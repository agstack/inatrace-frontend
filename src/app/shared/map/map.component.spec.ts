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
  private listeners: { [type: string]: Array<(event?: any) => void> } = {};

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
}

describe('MapComponent', () => {
  let fixture: ComponentFixture<MapComponent>;
  let component: MapComponent;
  let fakeMap: FakeMap;
  const originalToken = environment.mapboxAccessToken;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
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
  });
});
