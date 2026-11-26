import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

import { MapComponent } from './map.component';
import { GlobalEventManagerService } from '../../core/global-event-manager.service';
import { CompanyControllerService } from '../../../api/api/companyController.service';

/**
 * Stands in for mapboxgl.Map: records the listeners the component registers so a test can replay
 * the SDK's asynchronous events ('style.load', 'error'), and whether the map was released.
 */
class FakeMap {
  removed = false;
  dragRotate = { disable: () => {} };
  touchZoomRotate = { disableRotation: () => {} };
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
  fitBounds() {}
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
