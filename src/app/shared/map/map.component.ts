import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { environment } from 'src/environments/environment';
import * as mapboxgl from 'mapbox-gl';
import { Observable, Subscription } from 'rxjs';
import { ApiPlotCoordinate } from '../../../api/model/apiPlotCoordinate';
import { PlotCoordinatesManagerService } from '../../shared-services/plot-coordinates-manager.service';
import { PlotActionWrapper, PlotCoordinateAction } from '../../shared-services/plot-coordinate-action-enum';
import { ApiPlot } from '../../../api/model/apiPlot';
import { GlobalEventManagerService } from '../../core/global-event-manager.service';
import { Subject } from 'rxjs/internal/Subject';
import { CompanyControllerService } from '../../../api/api/companyController.service';
import { UntypedFormControl } from '@angular/forms';

// A double-click and the second click of a double-click arrive close together. Mapbox's touch
// recognizer uses 500 ms and 30 px; the mouse values only guard the fallback for browsers that do
// not expose MouseEvent.detail. The gesture timeout keeps a single click confirmable long enough
// to cover slower double-clicks without ever touching older points.
const DOUBLE_CLICK_INTERVAL_MS = 1000;
const DOUBLE_TAP_INTERVAL_MS = 500;
const DOUBLE_CLICK_DISTANCE_PX = 30;
const CLICK_GESTURE_TIMEOUT_MS = 1500;

const NEUTRAL_MAP_CENTER: [number, number] = [0, 0];
const NEUTRAL_MAP_ZOOM = 2;
const INITIAL_MAP_ZOOM = 10;

interface RecentPlotPoint {
  coordinate: ApiPlotCoordinate;
  marker: mapboxgl.Marker;
  timestamp: number;
  point?: { x: number; y: number };
}

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {

  private map: mapboxgl.Map;
  private MAPBOX_STYLE_BASE_PATH = 'mapbox://styles/mapbox/';

  private MAPBOX_SOURCE_PREFIX = 'ina_plot_';

  @Input()
  mapId = 'map';

  @Input()
  plotCoordinateDeletionEvent: Observable<PlotCoordinateAction>;

  @Input()
  plotCoordinatesManager: PlotCoordinatesManagerService;

  @Input()
  showPlotSubject: Subject<boolean>;

  @Input()
  editMode = false;

  @Input()
  plotCoordinates: ApiPlotCoordinate[];  // used for adding/editing single plot

  @Input()
  plots: ApiPlot[];  // used for viewing multiple plots

  @Input()
  pin: ApiPlotCoordinate;

  @Input()
  farmerId: number;

  @Input()
  initialLat: number;

  @Input()
  initialLng: number;

  @Output()
  plotCoordinatesChange = new EventEmitter<ApiPlotCoordinate[]>();

  @Output()
  plotGeoIdChange = new EventEmitter<ApiPlot>();
  
  @Output()
  geoIdOpenChange = new EventEmitter<string>();

  @Input()
  showPlotVisible = false;

  @Input()
  editable: boolean;
  
  subscriptions: Subscription = new Subscription();
  markers: mapboxgl.Marker[] = [];

  // Plots from the last `plots` input that are not on the map because their coordinates are
  // missing, out of range or could not be handled by Mapbox. The template uses this to explain
  // why the map shows fewer plots than the table.
  hiddenPlotsCount = 0;

  // The plots whose layers are currently on the map, so a later call can remove the ones that
  // disappeared even when the input array has already been replaced.
  private renderedPlots: ApiPlot[] = [];

  // Points added by clicks that may still turn out to be part of a double-click/double-tap.
  // Only these points are eligible for rollback; saved points and earlier single clicks are never
  // touched.
  private recentClickPoints: RecentPlotPoint[] = [];
  private clickGestureTimer: any = null;

  mapStyle: UntypedFormControl = new UntypedFormControl('satellite-streets-v12');

  // True when Mapbox cannot run - no access token, the SDK threw while starting up, or it reported an
  // authentication or style-load failure. The template then shows a short explanation instead of an
  // empty map frame.
  mapUnavailable = false;

  // Set once the style has loaded. Before that, an error means the map could not start at all.
  private styleLoaded = false;

  // A late geolocation answer must not move the map after the user has started drawing.
  private drawingStarted = false;

  constructor(private globalEventsManager: GlobalEventManagerService,
              private companyControllerService: CompanyControllerService,
              private changeDetectorRef: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    // Decided before the view is built, so the map container is only rendered when it can be used.
    this.mapUnavailable = !environment.mapboxAccessToken;
  }

  ngAfterViewInit() {
    if (this.mapUnavailable) {
      return;
    }
    this.initializeMap();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.releaseMap();
  }

  handlePlotCoordinateEvent(actionWrapper: PlotActionWrapper) {

    switch (actionWrapper.action) {
      case PlotCoordinateAction.DELETE_LAST_COORDINATE:
        this.undoLastPlotCoordinate();
        break;
      case PlotCoordinateAction.DELETE_PLOT:
        this.deletePlot(actionWrapper.plotId);
        break;
      case PlotCoordinateAction.ADD_COORDINATE_CURRENT_LOCATION:
        this.addPlotCoordinateCurrentLocation();
        break;
    }
  }

  private isValidCoordinate(coordinate: ApiPlotCoordinate): boolean {
    if (coordinate == null) {
      return false;
    }
    const latitude = coordinate.latitude;
    const longitude = coordinate.longitude;
    return typeof latitude === 'number' && Number.isFinite(latitude)
      && typeof longitude === 'number' && Number.isFinite(longitude)
      && latitude >= -90 && latitude <= 90
      && longitude >= -180 && longitude <= 180;
  }

  // A plot is displayable only when its whole geometry is usable. Filtering individual points
  // would draw a different polygon than the one stored, with a different shape and area.
  private displayableCoordinates(plot: ApiPlot): ApiPlotCoordinate[] | null {
    const coordinates = plot?.coordinates;
    if (!coordinates || coordinates.length === 0) {
      return null;
    }
    return coordinates.every(coordinate => this.isValidCoordinate(coordinate)) ? coordinates : null;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  // Plot names are not unique, so layers are keyed by the database id. The index is only a
  // fallback for a plot that has not been saved yet.
  private plotLayerId(plot: ApiPlot, index: number): string {
    const identity = plot?.id != null ? `id_${plot.id}` : `index_${index}`;
    return `existingPlot_${identity}`;
  }

  private removePlotLayers(layerId: string): void {
    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId);
    }
    const borderId = layerId + 'Border';
    if (this.map.getLayer(borderId)) {
      this.map.removeLayer(borderId);
    }
    if (this.map.getSource(this.MAPBOX_SOURCE_PREFIX + layerId)) {
      this.map.removeSource(this.MAPBOX_SOURCE_PREFIX + layerId);
    }
  }

  getInitialMapExtremes(coordinates: ApiPlotCoordinate[]): [[number, number], [number, number]] | null {

    const validCoordinates = (coordinates ?? []).filter(coordinate => this.isValidCoordinate(coordinate));
    if (validCoordinates.length === 0) {
      return null;
    }

    let latMin = validCoordinates[0].latitude;
    let latMax = validCoordinates[0].latitude;
    let lngMin = validCoordinates[0].longitude;
    let lngMax = validCoordinates[0].longitude;

    validCoordinates.forEach(v => {
      if (latMax < v.latitude) { latMax = v.latitude; }
      if (latMin > v.latitude) { latMin = v.latitude; }
      if (lngMax < v.longitude) { lngMax = v.longitude; }
      if (lngMin > v.longitude) { lngMin = v.longitude; }
    });
    // The margin must not push a valid border coordinate past Mapbox's limits: a plot at
    // latitude 90 or -90 would otherwise raise "Invalid LngLat latitude value".
    const offset = 0.02;
    return [
      [this.clamp(lngMin - offset, -180, 180), this.clamp(latMin - offset, -90, 90)],
      [this.clamp(lngMax + offset, -180, 180), this.clamp(latMax + offset, -90, 90)]
    ];
  }

  setExistingPlots(plots: ApiPlot[]) {

    this.clearClickGesture();
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
    this.plotCoordinates = [];
    this.hiddenPlotsCount = 0;

    const incomingPlots = plots ?? [];

    // Remove layers of plots that are no longer present. Plot names are not unique, so the layer
    // id comes from the database id; the list index is only a fallback for unsaved plots.
    const incomingLayerIds = new Set(incomingPlots.map((plot, index) => this.plotLayerId(plot, index)));
    this.renderedPlots.forEach((plot, index) => {
      const layerId = this.plotLayerId(plot, index);
      if (!incomingLayerIds.has(layerId)) {
        this.removePlotLayers(layerId);
      }
    });

    // A plot is drawn only when every coordinate is usable. Drawing the valid points of a
    // malformed polygon would silently change its shape and area.
    const displayablePlots: Array<{ plot: ApiPlot, index: number, coordinates: ApiPlotCoordinate[] }> = [];
    incomingPlots.forEach((plot, index) => {
      const coordinates = this.displayableCoordinates(plot);
      if (coordinates != null) {
        displayablePlots.push({ plot, index, coordinates });
      }
    });
    this.hiddenPlotsCount = incomingPlots.length - displayablePlots.length;

    const allPlotsCoordinates = displayablePlots.reduce<ApiPlotCoordinate[]>(
      (all, entry) => all.concat(entry.coordinates), []);
    const bounds = this.getInitialMapExtremes(allPlotsCoordinates);
    if (bounds != null) {
      this.map.fitBounds(bounds);
    }

    displayablePlots.forEach(entry => {
      const layerId = this.plotLayerId(entry.plot, entry.index);
      try {
        // One valid point, or two, still gets a marker; a polygon needs at least three points.
        if (entry.coordinates.length >= 3) {
          this.showPlot(layerId, this.getCoordinatesArray(entry.coordinates));
        }
        this.setPlotCenterMarker(entry.plot, entry.coordinates);
      } catch (error) {
        // One malformed geometry must not stop the remaining plots from being drawn.
        this.removePlotLayers(layerId);
        this.hiddenPlotsCount++;
        console.error('Plot could not be displayed:', entry.plot?.id ?? entry.plot?.plotName, error);
      }
    });

    this.renderedPlots = incomingPlots.slice();
    // The map 'load' event runs outside the component's usual input change, so make the warning
    // visible without waiting for an unrelated change detection cycle.
    this.changeDetectorRef.detectChanges();
  }

  setExistingPlotCoordinates(coordinates: ApiPlotCoordinate[]) {
    this.clearClickGesture();
    if (this.markers.length > 0) {
      this.deletePlot();
    }
    coordinates.forEach(v => this.placeMarkerOnMap(v.latitude, v.longitude));
    const bounds = this.getInitialMapExtremes(this.plotCoordinates);
    if (bounds != null) {
      this.map.fitBounds(bounds);
    }
    this.plotCoordinatesChange.emit(this.plotCoordinates);
  }

  undoLastPlotCoordinate() {

    this.clearClickGesture();

    if (!this.plotCoordinates || this.plotCoordinates.length === 0) {
      return;
    }

    this.showPlotSubject.next(false);

    const lastMarker = this.markers.pop();
    if (lastMarker) {
      lastMarker.remove();
    }
    this.plotCoordinates.pop();
    this.plotCoordinatesChange.emit(this.plotCoordinates);

    setTimeout(() => {
      this.showPlotSubject.next(true);
    }, 200);
  }

  deletePlot(plotId?: string) {

    this.clearClickGesture();

    if (plotId) {
      this.hidePlot(plotId);
    } else {
      this.markers.forEach(m => m.remove());
      this.markers = [];
      this.plotCoordinates = [];
      this.plotCoordinatesChange.emit(this.plotCoordinates);
    }

    setTimeout(() => {
      this.showPlotSubject.next(false);
    }, 200);
  }

  addPlotCoordinateCurrentLocation() {
    this.clearClickGesture();
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      this.placeMarkerOnMap(lat, lng);
      this.plotCoordinatesChange.emit(this.plotCoordinates);
    }, err => console.error(`Error while getting current location: ${err.code} ${err.message}`));
  }
  
  initializeMap(): void {

    if (this.editMode) {
      if (this.editable && (this.initialLat == null || this.initialLng == null)) {
        this.flyToCurrentPosition();
      }
    } else {
      if ((!this.plots || this.plots.length === 0) && (this.initialLat == null || this.initialLng == null)) {
        this.flyToCurrentPosition();
      }
    }
    if (!this.buildMap()) {
      this.mapUnavailable = true;
      this.changeDetectorRef.detectChanges();
      return;
    }

    // Subscribe to Map style radio group changes
    this.subscriptions.add(
      this.mapStyle.valueChanges.subscribe(value => {
        if (!this.map) {
          return;
        }
        this.map.setStyle(`${this.MAPBOX_STYLE_BASE_PATH}${value}`);
      })
    );
  }

  flyToCurrentPosition(): void {
    navigator.geolocation.getCurrentPosition( position => {
      // The position arrives asynchronously, by which time the map may have failed, been torn
      // down, or the user may have started drawing. Do not move the map in those cases.
      if (!this.map || this.drawingStarted) {
        return;
      }
      this.map.flyTo({
        center: [position.coords.longitude, position.coords.latitude]
      });
    });
  }

  // Returns false when the map could not be created, so the caller can fall back rather than
  // letting the failure escape ngAfterViewInit and abort the rest of the view's initialisation.
  buildMap(): boolean {

    const hasInitialLocation = this.initialLat != null && this.initialLng != null;
    const center: [number, number] = hasInitialLocation
      ? [this.initialLng, this.initialLat]
      : NEUTRAL_MAP_CENTER;

    try {
      this.map = this.createMap({
        accessToken: environment.mapboxAccessToken,
        container: this.mapId, // id of div that holds the map
        style: `${this.MAPBOX_STYLE_BASE_PATH}${this.mapStyle.value}`,
        zoom: hasInitialLocation ? INITIAL_MAP_ZOOM : NEUTRAL_MAP_ZOOM,
        center,
        cooperativeGestures: true
      });
    } catch (error) {
      console.error('Map could not be initialised:', error);
      this.map = null;
      return false;
    }

    // disable map rotation using right click + drag
    this.map.dragRotate.disable();

    // disable map rotation using touch rotation gesture
    this.map.touchZoomRotate.disableRotation();

    this.map.on('click', e => this.mapClicked(e));
    this.map.on('dblclick', e => this.mapDoubleClicked(e));
    this.map.on('zoomstart', e => this.mapZoomStarted(e));
    this.map.on('load', () => this.mapLoaded());
    this.map.on('style.load', () => this.styleLoaded = true);
    this.map.on('error', event => this.mapError(event));

    return true;
  }

  // The one place that talks to the SDK constructor, so tests can stand in a fake map.
  createMap(options: mapboxgl.MapboxOptions): mapboxgl.Map {
    return new mapboxgl.Map(options);
  }

  // Mapbox reports most failures asynchronously, through 'error' events: the constructor does not
  // throw for an invalid or expired token. Give up on the map when the token is refused or the style
  // itself cannot be loaded; a tile or sprite that fails to load is logged, as the SDK would, and the
  // map stays up.
  mapError(event: { error?: any, sourceId?: string, tile?: any }): void {

    const error = event?.error;
    if (!this.map) {
      return;
    }

    const message: string = error?.message ?? '';
    const tokenRefused = error?.status === 401 || /access[ _]token/i.test(message);
    const styleFailed = !this.styleLoaded && !event?.sourceId && !event?.tile;

    if (!tokenRefused && !styleFailed) {
      console.error(error);
      return;
    }

    console.error('Map could not be started:', error);
    this.releaseMap();
    this.mapUnavailable = true;
    this.changeDetectorRef.detectChanges();
  }

  // Frees the WebGL context and the SDK's listeners, and clears the reference so that callbacks
  // arriving later (geolocation, style changes) find no map and return.
  private releaseMap(): void {
    this.clearClickGesture();
    if (!this.map) {
      return;
    }
    const map = this.map;
    this.map = null;
    this.markers = [];
    map.remove();
  }

  placeMarkerOnMap(lat: number, lng: number, plot?: ApiPlot, isPin?: boolean) {
    const idx = this.plotCoordinates.length;

    // create a HTML element for each feature
    const el = document.createElement('div');
    el.classList.add('marker');
    el.innerHTML = isPin ? '<span></span>' : '<span><b>' + (idx + 1) + '</b></span>';

    if (plot) {
      const cropLabel = $localize`:@@map.modal.crop.title:Crop:`;
      const sizeLabel = $localize`:@@map.modal.size.title:Size:`;
      const geoIdLabel = $localize`:@@map.modal.geoId.title:Geo-ID:`;
      const openInGeoIdLabel = $localize`:@@map.modal.openInWhisp.title:Open in Whisp`;
      const certificationLabel = $localize`:@@map.modal.certification.title:Certification:`;
      let euOrganic = $localize`:@@map.modal.eu.organic.title:EU Organic`;
      const name = plot.plotName;
      let crop = plot.crop?.name;
      if (crop === undefined) {
        crop = '/';
      }
      let size: any = plot.size;
      if (size === undefined) {
        size = '/';
      }
      let unit = plot.unit;
      if (unit === undefined) {
        unit = '';
      }

      const buttonId = 'refresh-geo-btn-' + idx;
      let geoId = plot.geoId;
      if (geoId === undefined) {
        const refreshText = $localize`:@@map.modal.button.refresh.title:Refresh`;
        geoId = `<button id="${buttonId}" class="btn btn-sm popup-button">${refreshText}</button>`;
      } else {
        geoId = `<span class="geoid-content">${geoId}</span>`;
      }
      
      const buttonOpenGeoIdLink = 'open-whisp-a-' + idx;
      let openGeoIdLinkHtml = '';
      if (plot.geoId !== undefined) {
        openGeoIdLinkHtml = `<div class="pt-2">
                                <button id="${buttonOpenGeoIdLink}" class="btn btn-sm popup-button">${openInGeoIdLabel}</button>
                             </div>`;
      }
      
      const isCertified = plot.organicStartOfTransition !== undefined;
      if (!isCertified) {
        euOrganic = '/';
      }
      const popupHtml = `<div class="marker-popup">
                                  <div class="marker-popup-row-header">${name}</div>
                                  <div class="marker-popup-row">
                                    <div class="row-left">${cropLabel}</div>
                                    <div class="row-right"><b>${crop}</b></div>
                                  </div>
                                  <div class="marker-popup-row">
                                    <div class="row-left">${sizeLabel}</div>
                                    <div class="row-right"><b>${size} ${unit}</b></div>
                                  </div>
                                  <div class="marker-popup-row">
                                    <div class="row-left align-content-center geoid-label">${geoIdLabel}</div>
                                    <div class="row-right"><b>${geoId}</b>
                                      ${openGeoIdLinkHtml}
                                    </div>
                                  </div>
                                  <div class="marker-popup-row">
                                    <div class="row-left">${certificationLabel}</div>
                                    <div class="row-right"><b>${euOrganic}</b></div>
                                  </div>
                                </div>`;

      const popup = new mapboxgl.Popup(
        {
          anchor: 'top',
          offset: { top: [0, -10]},
          closeOnClick: true
        }
      ).setHTML(popupHtml);

      if (plot.geoId === undefined) {
        const farmerId = this.farmerId ?? plot['farmerId'];

        popup.on('open', () => {
          // popup opened so we fire an event
          document.getElementById(buttonId).addEventListener('click', () => {
            this.refreshGeoId(farmerId, plot, buttonId);
          });
        });
      } else {
        popup.on('open', () => {
          // popup open when geoId exist
          document.getElementById(buttonOpenGeoIdLink).addEventListener('click', () => {
            this.emitGeoIdOpenInWhispClick(plot.geoId);
          });
        });
      }

      // make a marker for each feature and add it to the map
      const marker = new mapboxgl.Marker(el)
        .setDraggable(false)
        .setPopup(popup)
        .setLngLat([lng, lat])
        .addTo(this.map);

      this.markers.push(marker);

    } else {
      // make a marker for each feature and add it to the map
      const marker = new mapboxgl.Marker(el)
        .setDraggable(true)
        .setLngLat([lng, lat])
        .addTo(this.map);

      this.markers.push(marker);
    }

    const coord: ApiPlotCoordinate = {
      latitude: lat,
      longitude: lng
    };

    this.plotCoordinates.push(coord);
  }

  refreshGeoId(farmerId: number, plot: ApiPlot, buttonId: string) {

    this.companyControllerService.refreshGeoIDForUserCustomerPlot(farmerId, plot.id).subscribe(res => {
      const data = res.data;

      const dataGeoId = data.geoId;

      if (data.geoId) {
        document.getElementById(buttonId).outerHTML = `<div style="text-align: end;"><b>${dataGeoId}</b></div>`;
      }

      this.emitRefreshedData(data);
    });
  }

  emitRefreshedData(plot: ApiPlot) {
    this.plotGeoIdChange.emit(plot);
  }
  
  emitGeoIdOpenInWhispClick(geoId: string) {
    this.geoIdOpenChange.emit(geoId);
  }
  
  // when the map is clicked, we add the plot-coordinate to the coordinates
  mapClicked(e) {

    if (!this.editable || !this.editMode) {
      return;
    }

    const detail = e?.originalEvent?.detail;

    // Every click in a multi-click sequence must be ignored: the first click adds a point, the
    // second (detail=2) would add another one before the double-click event arrives, and repeated
    // double-clicks to zoom keep incrementing detail. For browsers that do not expose detail, a
    // click close to the previous one in time and space is treated the same way.
    // map.on('dblclick') is an additional safeguard.
    if (detail > 1 || (detail == null && this.isNearLastClick(e))) {
      this.discardClickGesture();
      return;
    }

    this.drawingStarted = true;

    // A new single click confirms the previous point and starts a new gesture.
    this.clearClickGesture();

    this.showPlotSubject?.next(false);

    const lngLat = e.lngLat.wrap();
    this.placeMarkerOnMap(lngLat.lat, lngLat.lng);
    this.plotCoordinatesChange.emit(this.plotCoordinates);

    const marker = this.markers[this.markers.length - 1];
    const coordinate = this.plotCoordinates[this.plotCoordinates.length - 1];
    if (marker && coordinate) {
      this.recentClickPoints.push({
        coordinate,
        marker,
        timestamp: Date.now(),
        point: this.getClientPoint(e)
      });
    }

    // After this timeout the point is treated as a confirmed single click and is no longer
    // eligible for rollback.
    this.clickGestureTimer = setTimeout(() => this.clearClickGesture(), CLICK_GESTURE_TIMEOUT_MS);

    setTimeout(() => {
      if (this.map) {
        this.showPlotSubject?.next(true);
      }
    }, 200);
  }

  // A double-click zooms the map. Remove the point added by its first click.
  mapDoubleClicked(e) {
    if (!this.editable || !this.editMode) {
      return;
    }
    this.discardClickGesture();
  }

  // Mapbox's touch double-tap zooms without emitting dblclick. It reports the gesture as a
  // zoomstart whose original event is the second touchend.
  mapZoomStarted(e) {
    if (!this.editable || !this.editMode) {
      return;
    }
    if (e?.originalEvent?.type !== 'touchend') {
      return;
    }
    if (!this.isDoubleTapOnLastClick(e)) {
      return;
    }
    this.discardClickGesture();
  }

  private isNearLastClick(e: any): boolean {
    const last = this.recentClickPoints[this.recentClickPoints.length - 1];
    if (!last || Date.now() - last.timestamp > DOUBLE_CLICK_INTERVAL_MS) {
      return false;
    }
    const point = this.getClientPoint(e);
    if (!point || !last.point) {
      return true;
    }
    return this.distance(point, last.point) <= DOUBLE_CLICK_DISTANCE_PX;
  }

  private isDoubleTapOnLastClick(e: any): boolean {
    const last = this.recentClickPoints[this.recentClickPoints.length - 1];
    if (!last || Date.now() - last.timestamp > DOUBLE_TAP_INTERVAL_MS) {
      return false;
    }
    const point = this.getClientPoint(e);
    if (!point || !last.point) {
      return true;
    }
    return this.distance(point, last.point) <= DOUBLE_CLICK_DISTANCE_PX;
  }

  private getClientPoint(e: any): { x: number; y: number } | undefined {
    const original = e?.originalEvent;
    if (original && typeof original.clientX === 'number' && typeof original.clientY === 'number') {
      return { x: original.clientX, y: original.clientY };
    }
    const touch = original?.changedTouches?.[0];
    if (touch && typeof touch.clientX === 'number' && typeof touch.clientY === 'number') {
      return { x: touch.clientX, y: touch.clientY };
    }
    return undefined;
  }

  private distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  private discardClickGesture(): void {
    const points = this.recentClickPoints;
    this.recentClickPoints = [];
    this.clearClickGestureTimer();

    if (points.length === 0) {
      return;
    }

    this.showPlotSubject?.next(false);

    points.forEach(point => {
      const markerIndex = this.markers.indexOf(point.marker);
      if (markerIndex >= 0) {
        this.markers.splice(markerIndex, 1);
        point.marker.remove();
      }

      const coordinateIndex = this.plotCoordinates.indexOf(point.coordinate);
      if (coordinateIndex >= 0) {
        this.plotCoordinates.splice(coordinateIndex, 1);
      }
    });

    this.plotCoordinatesChange.emit(this.plotCoordinates);

    setTimeout(() => {
      if (this.map) {
        this.showPlotSubject?.next(true);
      }
    }, 200);
  }

  private clearClickGesture(): void {
    this.recentClickPoints = [];
    this.clearClickGestureTimer();
  }

  private clearClickGestureTimer(): void {
    if (this.clickGestureTimer != null) {
      clearTimeout(this.clickGestureTimer);
      this.clickGestureTimer = null;
    }
  }

  async mapLoaded() {

      this.map.resize();

      if (this.plotCoordinatesManager) {
        this.subscriptions.add(this.plotCoordinatesManager.plotCoordinateAction$.subscribe(actionWrapper => {
          this.handlePlotCoordinateEvent(actionWrapper);
        }));
      }

      if (!this.editMode) {
        // load plots
        if (this.plots && this.plots.length > 0) {
          this.setExistingPlots(this.plots);
        } else {
         if (this.pin?.latitude != null && this.pin?.longitude != null) {
          this.setPin(this.pin);
          const bounds = this.getInitialMapExtremes(this.plotCoordinates);
          if (bounds != null) {
            this.map.fitBounds(bounds);
          }
         }
        }
      } else {

        if (this.showPlotSubject) {
          this.subscriptions.add(this.showPlotSubject.asObservable().subscribe(show => {
            this.togglePlot(show);
            this.showPlotVisible = show;
          }));
          // show plot at first
          setTimeout(() => {
            this.showPlotSubject.next(true);
          }, 200);
        }

        // edit mode
        if (this.plotCoordinates && this.plotCoordinates.length > 0) {
          const plotCoordinates = [...this.plotCoordinates];
          this.plotCoordinates = [];
          this.setExistingPlotCoordinates(plotCoordinates);
        }

        if (!this.editable) {
          this.markers.forEach(marker => marker.setDraggable(false));
        }
      }
  }

  private setPin(pin: ApiPlotCoordinate) {
    this.clearClickGesture();
    // remove all previous markers
    this.markers.forEach(m => m.remove());
    this.markers = [];
    this.plotCoordinates = [];

    this.placeMarkerOnMap(pin.latitude, pin.longitude, null, true);
  }

  showPlot(name: string, coordinates: number[][]) {

    if (this.map.getLayer(name)) {
      return;
    }

    if (coordinates.length < 3) {
      return;
    }

    const sourceName = this.MAPBOX_SOURCE_PREFIX + name;

    this.map.addSource(sourceName, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            coordinates
          ]
        },
        properties: {
          name: 'polygon'
        }
      }
    });

    // Add a new layer to visualize the polygon.
    this.map.addLayer({
      id: name,
      type: 'fill',
      source: sourceName, // reference the data source
      layout: {},
      paint: {
      'fill-color': '#999933',
      'fill-opacity': 0.5
      }
    });

    const borderId = name + 'Border';

    this.map.addLayer({
      id: borderId,
      type: 'line',
      source: sourceName,
      layout: {},
      paint: {
      'line-color': '#999933',
      'line-width': 1
      }
    });
  }

  hidePlot(plotName?: string) {

    if (!plotName) {

      if (this.map.getLayer('polygonPreview')) {
        this.map.removeLayer('polygonPreview');
      }
      if (this.map.getLayer('polygonPreviewBorder')) {
        this.map.removeLayer('polygonPreviewBorder');
      }

      if (this.map.getSource(this.MAPBOX_SOURCE_PREFIX + 'polygonPreview')) {
        this.map.removeSource(this.MAPBOX_SOURCE_PREFIX + 'polygonPreview');
      }

    } else {

      if (this.map.getLayer(plotName)) {
        this.map.removeLayer(plotName);
      }
      const borderName = plotName + 'Border';
      if (this.map.getLayer(borderName)) {
        this.map.removeLayer(borderName);
      }

      if (this.map.getSource(this.MAPBOX_SOURCE_PREFIX + plotName)) {
        this.map.removeSource(this.MAPBOX_SOURCE_PREFIX + plotName);
      }
    }
  }

  togglePlot(show: boolean) {
    if (show && this.plotCoordinates && this.plotCoordinates.length >= 3) {
      this.showPlot('polygonPreview', this.getCoordinatesArray(this.plotCoordinates));
    } else {
      this.hidePlot();
    }
  }

  getCoordinatesArray(plotCoordinates: ApiPlotCoordinate[]): number[][] {
    const coords = [];
    plotCoordinates.forEach(v => coords.push([v.longitude, v.latitude]));
    coords.push(coords[0]);
    return coords;
  }

  private setPlotCenterMarker(plot: ApiPlot, coordinates: ApiPlotCoordinate[]) {

    if (coordinates.length === 0) {
      return;
    }

    let lonCenter = coordinates.reduce( (sum, element) => sum += element.longitude , 0);
    lonCenter = lonCenter / coordinates.length;

    let latCenter = coordinates.reduce( (sum, element) => sum += element.latitude , 0);
    latCenter = latCenter / coordinates.length;

    this.placeMarkerOnMap(latCenter, lonCenter, plot);
  }

}
