import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { environment } from 'src/environments/environment';
import * as mapboxgl from 'mapbox-gl';
import { Observable, Subscription, Subject } from 'rxjs';
import { ApiPlotCoordinate } from '../../../api/model/apiPlotCoordinate';
import { PlotCoordinatesManagerService } from '../../shared-services/plot-coordinates-manager.service';
import { PlotActionWrapper, PlotCoordinateAction } from '../../shared-services/plot-coordinate-action-enum';
import { ApiPlot } from '../../../api/model/apiPlot';
import { GlobalEventManagerService } from '../../core/global-event-manager.service';
// import { Subject } from 'rxjs/internal/Subject';
import { CompanyControllerService } from '../../../api/api/companyController.service';
import { FormControl } from '@angular/forms';

// @ts-ignore
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
// declare var mapboxgl: any;

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
  plotCoordinates: Array<ApiPlotCoordinate>;  // used for adding/editing single plot

  @Input()
  plots: Array<ApiPlot>;  // used for viewing multiple plots

  @Input()
  pin: ApiPlotCoordinate;

  @Input()
  farmerId: number;

  @Input()
  initialLat: number;

  @Input()
  initialLng: number;

  @Output()
  plotCoordinatesChange = new EventEmitter<Array<ApiPlotCoordinate>>();

  @Output()
  plotGeoIdChange = new EventEmitter<ApiPlot>();
  
  @Output()
  geoIdOpenChange = new EventEmitter<string>();

  @Input()
  showPlotVisible = false;

  @Input()
  editable: boolean;

  // Ajout event de click map
  @Output() mapClick = new EventEmitter<{ longitude: number, latitude: number }>();
  
  subscriptions: Subscription = new Subscription();
  markers: Array<mapboxgl.Marker> = [];

  mapStyle: FormControl = new FormControl('satellite-streets-v12');
  
  constructor(private globalEventsManager: GlobalEventManagerService,
              private companyControllerService: CompanyControllerService) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.initializeMap();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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

  getInitialMapExtremes(coordinates: Array<ApiPlotCoordinate>): [[number, number], [number, number]] {

    let latMin = coordinates[0].latitude;
    let latMax = coordinates[0].latitude;
    let lngMin = coordinates[0].longitude;
    let lngMax = coordinates[0].longitude;

    coordinates.forEach(v => {
      if (latMax < v.latitude) { latMax = v.latitude; }
      if (latMin > v.latitude) { latMin = v.latitude; }
      if (lngMax < v.longitude) { lngMax = v.longitude; }
      if (lngMin > v.longitude) { lngMin = v.longitude; }
    });
    const offset = 0.02;
    return [[lngMin - offset, latMin - offset], [lngMax + offset, latMax + offset]];
  }

  setExistingPlots(plots: Array<ApiPlot>) {

    this.markers.forEach(marker => marker.remove());
    this.markers = [];
    this.plotCoordinates = [];

    // Find the plots that shall be removed
    const plotsToRemove: Array<ApiPlot> = [];
    this.plots.forEach(plot => {
      const existingPlot = plots.find(p => plot.plotName === p.plotName);
      if (existingPlot == null) {
        plotsToRemove.push(plot);
      }
    });

    // Remove layers of plots that are removed
    plotsToRemove.forEach((plot) => {

      if (this.map.getLayer(plot.plotName)) {
        this.map.removeLayer(plot.plotName);
      }
      const borderName = plot.plotName + 'Border';
      if (this.map.getLayer(borderName)) {
        this.map.removeLayer(borderName);
      }

      if (this.map.getSource(this.MAPBOX_SOURCE_PREFIX + plot.plotName)) {
        this.map.removeSource(this.MAPBOX_SOURCE_PREFIX + plot.plotName);
      }
    });

    const allPlotsCoordinates = [];
    plots.forEach(plot => {
      allPlotsCoordinates.push(...plot.coordinates);
    });

    if (allPlotsCoordinates.length > 0) {
      this.map.fitBounds(this.getInitialMapExtremes(allPlotsCoordinates));

      plots.forEach(plot => {
        this.showPlot(plot.plotName, this.getCoordinatesArray(plot.coordinates));
        this.setPlotCenterMarker(plot);
      });
    }
  }

  setExistingPlotCoordinates(coordinates: Array<ApiPlotCoordinate>) {
    if (this.markers.length > 0) {
      this.deletePlot();
    }
    coordinates.forEach(v => this.placeMarkerOnMap(v.latitude, v.longitude));
    this.map.fitBounds(this.getInitialMapExtremes(this.plotCoordinates));
    this.plotCoordinatesChange.emit(this.plotCoordinates);
  }

  undoLastPlotCoordinate() {

    this.showPlotSubject.next(false);

    const lastMarker = this.markers.pop();
    lastMarker.remove();
    this.plotCoordinates.pop();
    this.plotCoordinatesChange.emit(this.plotCoordinates);

    setTimeout(() => {
      this.showPlotSubject.next(true);
    }, 200);
  }

  deletePlot(plotId?: string) {

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
    this.buildMap();

    // Subscribe to Map style radio group changes
    this.subscriptions.add(
      this.mapStyle.valueChanges.subscribe(value => {
        this.map.setStyle(`${this.MAPBOX_STYLE_BASE_PATH}${value}`);
      })
    );

    this.map.on('click', (e) => {
      this.onMapClick(e);
    });
  }

  flyToCurrentPosition(): void {
    navigator.geolocation.getCurrentPosition( position => {
      this.map.flyTo({
        center: [position.coords.longitude, position.coords.latitude]
      });
    });
  }
  
  buildMap(): void {
    this.map = new mapboxgl.Map({
      accessToken: environment.mapboxAccessToken,
      container: this.mapId, // id of div that holds the map
      style: `${this.MAPBOX_STYLE_BASE_PATH}${this.mapStyle.value}`,
      zoom: 10,
      center: [this.initialLng ?? 14.995463, this.initialLat ?? 46.151241],
      cooperativeGestures: true
    });

    // disable map rotation using right click + drag
    this.map.dragRotate.disable();

    // disable map rotation using touch rotation gesture
    this.map.touchZoomRotate.disableRotation();

    this.map.on('click', e => this.mapClicked(e));
    this.map.on('load', () => this.mapLoaded());
  }

  updateMap(plots: Array<ApiPlot>): void {

    this.setExistingPlots(plots);
    this.plots = plots;
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

    if (!this.editable) {
      return;
    }

    if (this.editMode) {

      this.showPlotSubject.next(false);

      const lng = e.lngLat.wrap()['lng'];
      const lat = e.lngLat.wrap()['lat'];
      this.placeMarkerOnMap(lat, lng);
      this.plotCoordinatesChange.emit(this.plotCoordinates);

      setTimeout(() => {
        this.showPlotSubject.next(true);
      }, 200);
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
         if (this.pin?.latitude && this.pin?.longitude) {
          this.setPin(this.pin);
          this.map.fitBounds(this.getInitialMapExtremes(this.plotCoordinates));
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
    // remove all previous markers
    this.markers.forEach(m => m.remove());
    this.markers = [];
    this.plotCoordinates = [];

    this.placeMarkerOnMap(pin.latitude, pin.longitude, null, true);
    this.plotCoordinatesChange.emit(this.plotCoordinates);
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
    if (show) {
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

  private setPlotCenterMarker(plot: ApiPlot) {

    const plotCoordinates: ApiPlotCoordinate[] = plot.coordinates;

    let lonCenter = plotCoordinates.reduce( (sum, element) => sum += element.longitude , 0);
    lonCenter = lonCenter / plotCoordinates.length;

    let latCenter = plotCoordinates.reduce( (sum, element) => sum += element.latitude , 0);
    latCenter = latCenter / plotCoordinates.length;

    this.placeMarkerOnMap(latCenter, lonCenter, plot);
  }

  // pour gerer click sur Map
  private onMapClick(event: mapboxgl.MapMouseEvent) {
    const coordinates = event.lngLat;
    
    // Émet les coordonnées via l'Output
    this.mapClick.emit({
      longitude: coordinates.lng,
      latitude: coordinates.lat
    });
  }

}
