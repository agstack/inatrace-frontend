import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

import { MapComponent } from './map.component';
import { GlobalEventManagerService } from '../../core/global-event-manager.service';
import { CompanyControllerService } from '../../../api/api/companyController.service';
import { ApiPlot } from '../../../api/model/apiPlot';
import { ApiPlotCoordinate } from '../../../api/model/apiPlotCoordinate';

/**
 * Stands in for mapboxgl.Map: records the listeners the component registers so a test can replay
 * the SDK's asynchronous events ('style.load', 'error'), and whether the map was released.
 */
class FakeMap {
  removed = false;
  dragRotate = { disable: () => {} };
  touchZoomRotate = { disableRotation: () => {} };
  layers = new Set<string>();
  sources = new Set<string>();
  fitBoundsCalls: any[] = [];
  failSource: string | null = null;
  private listeners: Record<string, ((event?: any) => void)[]> = {};

  on(type: string, listener: (event?: any) => void) {
    (this.listeners[type] = this.listeners[type] || []).push(listener);
    return this;
  }

  fire(type: string, event: any = {}) {
    (this.listeners[type] || []).forEach(listener => listener(event));
  }

  remove() { this.removed = true; }
  setStyle() {}
  resize() {}
  flyTo() {}
  fitBounds(bounds: any) { this.fitBoundsCalls.push(bounds); }
  getLayer(id: string) { return this.layers.has(id) ? { id } : undefined; }
  addLayer(layer: any) { this.layers.add(layer.id); }
  removeLayer(id: string) { this.layers.delete(id); }
  getSource(id: string) { return this.sources.has(id) ? { id } : undefined; }
  addSource(id: string) {
    if (this.failSource === id) {
      throw new Error('synthetic Mapbox failure');
    }
    this.sources.add(id);
  }
  removeSource(id: string) { this.sources.delete(id); }
}

describe('MapComponent', () => {
  let fixture: ComponentFixture<MapComponent>;
  let component: MapComponent;
  let fakeMap: FakeMap;
  const originalToken = environment.mapboxAccessToken;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      imports: [ReactiveFormsModule],
      declarations: [MapComponent],
      providers: [
        { provide: GlobalEventManagerService, useValue: {} },
        { provide: CompanyControllerService, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    fakeMap = new FakeMap();
    spyOn(component, 'createMap').and.callFake(() => fakeMap as any);
    // The component asks for the current position when it has nothing to centre on.
    spyOn(navigator.geolocation, 'getCurrentPosition');
    spyOn(console, 'error');
  });

  afterEach(() => {
    environment.mapboxAccessToken = originalToken;
  });

  function unavailableMessage(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.map-unavailable-message');
  }

  function mapFrame(): HTMLElement | null {
    return fixture.nativeElement.querySelector('#map');
  }

  function hiddenPlotsMessage(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.map-hidden-plots-message');
  }

  it('undoes every coordinate and ignores another undo at zero', fakeAsync(() => {
    const markers = [0, 1, 2].map(() => ({ remove: jasmine.createSpy('remove') }));
    component.markers = markers.slice() as any;
    component.plotCoordinates = [1, 2, 3].map(n => ({ latitude: n, longitude: n }));
    component.showPlotSubject = new Subject<boolean>();
    const emit = spyOn(component.plotCoordinatesChange, 'emit').and.callFake(() => {});
    const show = spyOn(component, 'showPlot');
    spyOn(component, 'hidePlot');
    const subscription = component.showPlotSubject.subscribe(value => component.togglePlot(value));

    component.undoLastPlotCoordinate();
    expect(component.plotCoordinates.length).toBe(2);
    component.undoLastPlotCoordinate();
    expect(component.plotCoordinates.length).toBe(1);
    component.undoLastPlotCoordinate();
    component.undoLastPlotCoordinate();
    expect(component.plotCoordinates).toEqual([]);
    expect(emit).toHaveBeenCalledTimes(3);
    markers.forEach(marker => expect(marker.remove).toHaveBeenCalledTimes(1));
    tick(200);
    expect(show).not.toHaveBeenCalled();
    subscription.unsubscribe();
  }));

  it('does not redraw an incomplete polygon after delete while an undo is pending', fakeAsync(() => {
    component.plotCoordinates = [1, 2, 3, 4].map(n => ({ latitude: n, longitude: n }));
    component.markers = [1, 2, 3, 4].map(() => ({ remove: () => {} })) as any;
    component.showPlotSubject = new Subject<boolean>();
    const show = spyOn(component, 'showPlot');
    spyOn(component, 'hidePlot');
    const subscription = component.showPlotSubject.subscribe(value => component.togglePlot(value));
    component.undoLastPlotCoordinate();
    component.deletePlot();
    tick(200);
    expect(component.plotCoordinates).toEqual([]);
    expect(show).not.toHaveBeenCalled();
    subscription.unsubscribe();
  }));

  describe('without an access token', () => {

    beforeEach(() => {
      environment.mapboxAccessToken = '';
      fixture.detectChanges();
    });

    it('shows the unavailable message instead of the map frame', () => {
      expect(component.mapUnavailable).toBe(true);
      expect(unavailableMessage()).not.toBeNull();
      expect(mapFrame()).toBeNull();
    });

    it('does not create a map', () => {
      expect(component.createMap).not.toHaveBeenCalled();
    });
  });

  describe('with an access token', () => {

    beforeEach(() => {
      environment.mapboxAccessToken = 'pk.test';
    });

    it('creates the map and shows the frame', () => {
      fixture.detectChanges();

      expect(component.createMap).toHaveBeenCalledTimes(1);
      expect(component.mapUnavailable).toBe(false);
      expect(mapFrame()).not.toBeNull();
      expect(unavailableMessage()).toBeNull();
    });

    it('shows the message when the SDK throws while starting', () => {
      (component.createMap as jasmine.Spy).and.throwError('Failed to initialize WebGL');

      fixture.detectChanges();

      expect(component.mapUnavailable).toBe(true);
      expect(unavailableMessage()).not.toBeNull();
      expect(mapFrame()).toBeNull();
    });

    it('gives up on the map when Mapbox refuses the token', () => {
      fixture.detectChanges();

      // What mapbox-gl fires from _authenticate: a plain Error, without the HTTP status.
      fakeMap.fire('error', { error: new Error(
        'A valid Mapbox access token is required to use Mapbox GL JS. To create an account or a new access token, visit https://account.mapbox.com/') });

      expect(component.mapUnavailable).toBe(true);
      expect(fakeMap.removed).toBe(true);
      expect(unavailableMessage()).not.toBeNull();
      expect(mapFrame()).toBeNull();
    });

    it('gives up on the map when a request is answered with 401', () => {
      fixture.detectChanges();
      fakeMap.fire('style.load');

      const error: any = new Error('Unauthorized');
      error.status = 401;
      fakeMap.fire('error', { error });

      expect(component.mapUnavailable).toBe(true);
      expect(fakeMap.removed).toBe(true);
    });

    it('gives up on the map when the style cannot be loaded', () => {
      fixture.detectChanges();

      // No 'style.load' yet: the style request itself failed.
      fakeMap.fire('error', { error: new Error('Failed to fetch') });

      expect(component.mapUnavailable).toBe(true);
      expect(fakeMap.removed).toBe(true);
      expect(unavailableMessage()).not.toBeNull();
    });

    it('keeps a working map up when a tile fails to load', () => {
      fixture.detectChanges();
      fakeMap.fire('style.load');

      fakeMap.fire('error', { error: new Error('Could not load tile'), sourceId: 'composite', tile: {} });

      expect(component.mapUnavailable).toBe(false);
      expect(fakeMap.removed).toBe(false);
      expect(mapFrame()).not.toBeNull();
      expect(console.error).toHaveBeenCalled();
    });

    it('keeps a working map up when a sprite fails to load after the style', () => {
      fixture.detectChanges();
      fakeMap.fire('style.load');

      fakeMap.fire('error', { error: new Error('Could not load sprite') });

      expect(component.mapUnavailable).toBe(false);
      expect(fakeMap.removed).toBe(false);
    });

    it('releases the map on destroy so late callbacks find none', () => {
      fixture.detectChanges();
      const flyTo = spyOn(fakeMap, 'flyTo');
      const positionCallback = (navigator.geolocation.getCurrentPosition as jasmine.Spy).calls.mostRecent().args[0];

      fixture.destroy();

      expect(fakeMap.removed).toBe(true);
      expect(component['map']).toBeNull();

      // A geolocation answer arriving after the view is gone.
      positionCallback({ coords: { latitude: 1, longitude: 2 } });
      expect(flyTo).not.toHaveBeenCalled();
    });

    it('uses a neutral center and zoom when no initial location is available', () => {
      fixture.detectChanges();

      const options = (component.createMap as jasmine.Spy).calls.mostRecent().args[0];
      expect(options.center).toEqual([0, 0]);
      expect(options.zoom).toBe(2);
    });

    it('uses the supplied initial location and zoom', () => {
      component.initialLat = 9.0765;
      component.initialLng = 7.3986;

      fixture.detectChanges();

      const options = (component.createMap as jasmine.Spy).calls.mostRecent().args[0];
      expect(options.center).toEqual([7.3986, 9.0765]);
      expect(options.zoom).toBe(10);
    });

    it('shows a zero-value pin without emitting an initial location change', () => {
      component.editMode = false;
      component.plots = [];
      component.plotCoordinates = [];
      component.pin = { latitude: 0, longitude: 0 };
      spyOn(component, 'placeMarkerOnMap').and.callFake((lat: number, lng: number) => {
        component.plotCoordinates.push({ latitude: lat, longitude: lng });
      });
      const emit = spyOn(component.plotCoordinatesChange, 'emit');

      fixture.detectChanges();
      fakeMap.fire('load');

      expect(component.placeMarkerOnMap).toHaveBeenCalledWith(0, 0, null, true);
      expect(emit).not.toHaveBeenCalled();
    });

    it('does not move the map when geolocation answers after drawing starts', fakeAsync(() => {
      component.editMode = true;
      component.editable = true;
      component.plotCoordinates = [];
      component.showPlotSubject = new Subject<boolean>();
      spyOn(component, 'placeMarkerOnMap').and.callFake((lat: number, lng: number) => {
        component.plotCoordinates.push({ latitude: lat, longitude: lng });
      });

      fixture.detectChanges();
      const positionCallback = (navigator.geolocation.getCurrentPosition as jasmine.Spy).calls.mostRecent().args[0];
      const flyTo = spyOn(fakeMap, 'flyTo');

      component.mapClicked({ lngLat: { wrap: () => ({ lat: 1, lng: 2 }) } });
      positionCallback({ coords: { latitude: 3, longitude: 4 } });

      expect(flyTo).not.toHaveBeenCalled();
      tick(200);
    }));
  });

  describe('existing plots', () => {
    const polygon: ApiPlotCoordinate[] = [
      { latitude: -14.30, longitude: -54.43 },
      { latitude: -14.30, longitude: -54.42 },
      { latitude: -14.29, longitude: -54.42 },
      { latitude: -14.29, longitude: -54.43 }
    ];

    function plot(id: number, name: string, coordinates: ApiPlotCoordinate[]): ApiPlot {
      return { id, plotName: name, coordinates };
    }

    function shiftedPolygon(delta: number): ApiPlotCoordinate[] {
      return polygon.map(coordinate => ({
        latitude: coordinate.latitude + delta,
        longitude: coordinate.longitude + delta
      }));
    }

    function loadPlots(plots: ApiPlot[]) {
      component.plots = plots;
      fixture.detectChanges();
      fakeMap.fire('load');
      fixture.detectChanges();
    }

    beforeEach(() => {
      environment.mapboxAccessToken = 'pk.test';
      spyOn(component, 'placeMarkerOnMap');
    });

    it('draws the plots with usable coordinates and ignores the rest', () => {
      loadPlots([
        plot(1, 'Polygon', polygon),
        plot(2, 'Point', [{ latitude: -14.28, longitude: -54.41 }]),
        plot(3, 'Empty', []),
        plot(4, 'Out of range', [{ latitude: 200, longitude: 300 }])
      ]);

      expect(fakeMap.fitBoundsCalls.length).toBe(1);
      const [[west, south], [east, north]] = fakeMap.fitBoundsCalls[0];
      expect(west).toBeCloseTo(-54.45, 5);
      expect(south).toBeCloseTo(-14.32, 5);
      expect(east).toBeCloseTo(-54.39, 5);
      expect(north).toBeCloseTo(-14.26, 5);

      expect(fakeMap.layers.has('existingPlot_id_1')).toBeTrue();
      expect(fakeMap.layers.has('existingPlot_id_2')).toBeFalse();
      expect(fakeMap.layers.has('existingPlot_id_3')).toBeFalse();
      expect(fakeMap.layers.has('existingPlot_id_4')).toBeFalse();
      expect(component.placeMarkerOnMap).toHaveBeenCalledTimes(2);
      expect(component.hiddenPlotsCount).toBe(2);
      expect(hiddenPlotsMessage()).not.toBeNull();
    });

    it('keeps the initial framing when no plot can be displayed', () => {
      loadPlots([
        plot(1, 'Empty', []),
        plot(2, 'Out of range', [{ latitude: 200, longitude: 300 }])
      ]);

      expect(fakeMap.fitBoundsCalls.length).toBe(0);
      expect(fakeMap.layers.size).toBe(0);
      expect(component.placeMarkerOnMap).not.toHaveBeenCalled();
      expect(component.hiddenPlotsCount).toBe(2);
      expect(hiddenPlotsMessage()).not.toBeNull();
    });

    it('does not warn when every plot is displayed', () => {
      loadPlots([plot(1, 'Polygon', polygon)]);

      expect(component.hiddenPlotsCount).toBe(0);
      expect(hiddenPlotsMessage()).toBeNull();
    });

    it('does not draw part of a polygon when one point is unusable', () => {
      loadPlots([plot(1, 'Partial', [
        polygon[0],
        { latitude: 200, longitude: -54.42 },
        polygon[1]
      ])]);

      expect(fakeMap.layers.size).toBe(0);
      expect(component.placeMarkerOnMap).not.toHaveBeenCalled();
      expect(component.hiddenPlotsCount).toBe(1);
    });

    it('shows a marker but no polygon for two usable points', () => {
      loadPlots([plot(1, 'Two points', [polygon[0], polygon[1]])]);

      expect(fakeMap.layers.size).toBe(0);
      expect(component.placeMarkerOnMap).toHaveBeenCalledTimes(1);
      expect(component.hiddenPlotsCount).toBe(0);
    });

    it('keeps same-named plots in separate layers', () => {
      loadPlots([
        plot(11, 'Point 1', polygon),
        plot(12, 'Point 1', shiftedPolygon(0.01))
      ]);

      expect(fakeMap.layers.has('existingPlot_id_11')).toBeTrue();
      expect(fakeMap.layers.has('existingPlot_id_12')).toBeTrue();
      expect(component.placeMarkerOnMap).toHaveBeenCalledTimes(2);
    });

    it('accepts zero and the coordinate limits', () => {
      loadPlots([
        plot(1, 'Zero', [{ latitude: 0, longitude: 0 }]),
        plot(2, 'Border', [{ latitude: 90, longitude: 180 }])
      ]);

      expect(component.hiddenPlotsCount).toBe(0);
      expect(component.placeMarkerOnMap).toHaveBeenCalledTimes(2);
      expect(fakeMap.fitBoundsCalls.length).toBe(1);
    });

    it('keeps the margin inside the Mapbox coordinate limits', () => {
      expect(component.getInitialMapExtremes([{ latitude: 90, longitude: 180 }]))
        .toEqual([[179.98, 89.98], [180, 90]]);
      expect(component.getInitialMapExtremes([{ latitude: -90, longitude: -180 }]))
        .toEqual([[-180, -90], [-179.98, -89.98]]);
      expect(component.getInitialMapExtremes([])).toBeNull();
      expect(component.getInitialMapExtremes([{ latitude: 200, longitude: 300 }])).toBeNull();
    });

    it('removes the layer of a plot that is no longer in the input', () => {
      const first = plot(1, 'First', polygon);
      const second = plot(2, 'Second', shiftedPolygon(0.01));
      loadPlots([first, second]);

      component.plots = [first];
      component.setExistingPlots([first]);

      expect(fakeMap.layers.has('existingPlot_id_1')).toBeTrue();
      expect(fakeMap.layers.has('existingPlot_id_2')).toBeFalse();
      expect(fakeMap.sources.has('ina_plot_existingPlot_id_2')).toBeFalse();
    });

    it('draws the other plots when Mapbox rejects one geometry', () => {
      fakeMap.failSource = 'ina_plot_existingPlot_id_1';

      loadPlots([
        plot(1, 'Rejected', polygon),
        plot(2, 'Accepted', shiftedPolygon(0.01))
      ]);

      expect(fakeMap.layers.has('existingPlot_id_1')).toBeFalse();
      expect(fakeMap.layers.has('existingPlot_id_2')).toBeTrue();
      expect(component.hiddenPlotsCount).toBe(1);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('plot drawing gestures', () => {
    let emit: jasmine.Spy;

    function clickEvent(lat: number, lng: number, detail?: number, clientX = 100, clientY = 100) {
      const originalEvent: any = { clientX, clientY };
      if (detail !== undefined) {
        originalEvent.detail = detail;
      }
      return {
        lngLat: { wrap: () => ({ lat, lng }) },
        originalEvent
      };
    }

    function touchZoomStart(clientX: number, clientY: number) {
      return {
        originalEvent: {
          type: 'touchend',
          changedTouches: [{ clientX, clientY }]
        }
      };
    }

    beforeEach(() => {
      environment.mapboxAccessToken = 'pk.test';
      component.editable = true;
      component.editMode = true;
      component.plotCoordinates = [];
      component.markers = [];
      component.showPlotSubject = new Subject<boolean>();
      spyOn(component, 'placeMarkerOnMap').and.callFake((lat: number, lng: number) => {
        const marker = { remove: jasmine.createSpy('remove') };
        component.markers.push(marker as any);
        component.plotCoordinates.push({ latitude: lat, longitude: lng });
      });
      emit = spyOn(component.plotCoordinatesChange, 'emit').and.callThrough();
      fixture.detectChanges();
    });

    it('adds exactly one point for a single click', () => {
      fakeMap.fire('click', clickEvent(10, 20, 1));

      expect(component.plotCoordinates).toEqual([{ latitude: 10, longitude: 20 }]);
      expect(component.markers.length).toBe(1);
      expect(emit).toHaveBeenCalledTimes(1);
    });

    it('does not add points for a mouse double-click', () => {
      fakeMap.fire('click', clickEvent(10, 20, 1, 100, 100));
      const firstMarker = component.markers[0] as any;

      fakeMap.fire('click', clickEvent(10, 20, 2, 102, 101));
      fakeMap.fire('dblclick', clickEvent(10, 20, 2, 102, 101));

      expect(component.plotCoordinates).toEqual([]);
      expect(component.markers).toEqual([]);
      expect(firstMarker.remove).toHaveBeenCalled();
      expect(emit).toHaveBeenCalledTimes(2);
      expect(emit.calls.mostRecent().args[0]).toEqual([]);
    });

    it('ignores the extra clicks of repeated double-clicks used to zoom', () => {
      fakeMap.fire('click', clickEvent(10, 20, 1, 100, 100));
      fakeMap.fire('click', clickEvent(10, 20, 2, 102, 101));
      fakeMap.fire('dblclick', clickEvent(10, 20, 2, 102, 101));
      fakeMap.fire('click', clickEvent(10, 20, 3, 103, 102));
      fakeMap.fire('click', clickEvent(10, 20, 4, 104, 103));

      expect(component.plotCoordinates).toEqual([]);
      expect(component.markers).toEqual([]);
      expect(emit).toHaveBeenCalledTimes(2);
    });

    it('keeps existing points when a double-click is used to zoom', () => {
      component.plotCoordinates = [
        { latitude: 1, longitude: 1 },
        { latitude: 2, longitude: 2 }
      ];
      const existingMarkers = [
        { remove: jasmine.createSpy('remove') },
        { remove: jasmine.createSpy('remove') }
      ];
      component.markers = existingMarkers as any;

      fakeMap.fire('click', clickEvent(10, 20, 1, 100, 100));
      fakeMap.fire('click', clickEvent(10, 20, 2, 102, 101));
      fakeMap.fire('dblclick', clickEvent(10, 20, 2, 102, 101));

      expect(component.plotCoordinates).toEqual([
        { latitude: 1, longitude: 1 },
        { latitude: 2, longitude: 2 }
      ]);
      expect(component.markers).toEqual(existingMarkers as any);
      expect(existingMarkers[0].remove).not.toHaveBeenCalled();
      expect(existingMarkers[1].remove).not.toHaveBeenCalled();
    });

    it('keeps rapid single clicks at different positions', () => {
      fakeMap.fire('click', clickEvent(10, 20, 1, 100, 100));
      fakeMap.fire('click', clickEvent(11, 21, 1, 200, 200));

      expect(component.plotCoordinates.length).toBe(2);
      expect(component.markers.length).toBe(2);
      expect(emit).toHaveBeenCalledTimes(2);
    });

    it('treats a nearby second click without MouseEvent.detail as a double-click', () => {
      fakeMap.fire('click', clickEvent(10, 20, 1, 100, 100));
      fakeMap.fire('click', clickEvent(10, 20, undefined, 102, 101));

      expect(component.plotCoordinates).toEqual([]);
      expect(emit).toHaveBeenCalledTimes(2);
    });

    it('keeps a second click without MouseEvent.detail when it is far away', () => {
      fakeMap.fire('click', clickEvent(10, 20, 1, 100, 100));
      fakeMap.fire('click', clickEvent(11, 21, undefined, 300, 300));

      expect(component.plotCoordinates.length).toBe(2);
    });

    it('does not add points for a touch double-tap', () => {
      fakeMap.fire('click', clickEvent(10, 20, 1, 100, 100));
      const marker = component.markers[0] as any;

      fakeMap.fire('zoomstart', touchZoomStart(102, 101));

      expect(component.plotCoordinates).toEqual([]);
      expect(component.markers).toEqual([]);
      expect(marker.remove).toHaveBeenCalled();
      expect(emit.calls.mostRecent().args[0]).toEqual([]);
    });

    it('keeps the point when zoom starts from a non-double-tap gesture', () => {
      fakeMap.fire('click', clickEvent(10, 20, 1, 100, 100));
      fakeMap.fire('zoomstart', { originalEvent: { type: 'touchstart' } });
      fakeMap.fire('zoomstart', touchZoomStart(500, 500));

      expect(component.plotCoordinates.length).toBe(1);
    });

    it('does not add points when the map is not editable', () => {
      component.editable = false;
      fakeMap.fire('click', clickEvent(10, 20, 1));

      expect(component.plotCoordinates).toEqual([]);
      expect(emit).not.toHaveBeenCalled();
    });

    it('does not add points outside edit mode', () => {
      component.editMode = false;
      fakeMap.fire('click', clickEvent(10, 20, 1));

      expect(component.plotCoordinates).toEqual([]);
    });

    it('confirms a single click after the gesture timeout', fakeAsync(() => {
      fakeMap.fire('click', clickEvent(10, 20, 1));
      tick(2000);

      fakeMap.fire('dblclick', clickEvent(10, 20, 2));

      expect(component.plotCoordinates.length).toBe(1);
    }));

    it('does not roll back a click after the map is destroyed', fakeAsync(() => {
      fakeMap.fire('click', clickEvent(10, 20, 1));
      fixture.destroy();

      fakeMap.fire('dblclick', clickEvent(10, 20, 2));
      tick(2000);

      expect(component.plotCoordinates.length).toBe(1);
    }));
  });
});
