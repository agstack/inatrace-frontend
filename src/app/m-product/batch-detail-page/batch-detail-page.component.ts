import { Component, OnInit, Input, ViewChild, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormGroup, UntypedFormArray, UntypedFormControl } from '@angular/forms';
import { ApiProductLabelBatch } from 'src/api/model/apiProductLabelBatch';
import {dateISOString, generateFormFromMetadata} from 'src/shared/utils';
import { ApiProductLabelBatchValidationScheme } from '../batches-list/batch-edit-modal/validation';
import { ProductControllerService } from 'src/api/api/productController.service';
import { Location } from '@angular/common';
import { take } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { GoogleMap, MapInfoWindow } from '@angular/google-maps';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { PrefillLocationsFromProductModalComponent } from './prefill-locations-from-product-modal/prefill-locations-from-product-modal.component';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { Subscription } from 'rxjs';
import { NgbModalImproved } from 'src/app/core/ngb-modal-improved/ngb-modal-improved.service';


@Component({
    selector: 'app-batch-detail-page',
    templateUrl: './batch-detail-page.component.html',
    styleUrls: ['./batch-detail-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class BatchDetailPageComponent implements OnInit, OnDestroy {

  @ViewChild(GoogleMap) set map(map: GoogleMap) {
    if (map) {
      this.gMap = map;
      this.fitBounds();}
  };

  @ViewChild(MapInfoWindow) set infoWindow(infoWindow: MapInfoWindow) {
    if (infoWindow) this.gInfoWindow = infoWindow;
  };

  public canDeactivate(): boolean {
    return !this.batchDetailForm || !(this.changed)
  }

  goToLink: string = this.router.url.substr(0, this.router.url.lastIndexOf("/"));

  faTrashAlt = faTrashAlt;
  gInfoWindow = null;
  gMap = null;
  gInfoWindowText = "";
  markers: any = [];
  defaultCenter = {
    lat: 5.274054,
    lng: 21.514503
  };
  defaultZoom = 3;
  zoomForOnePin = 10;
  bounds: any;
  initialBounds: any = [];
  isGoogleMapsLoaded = false;

  batch: ApiProductLabelBatch = {};

  batchDetailForm: UntypedFormGroup;
  submitted = false;
  rootImageUrl: string = environment.relativeImageUploadUrlAllSizes;
  title = "";

  subs: Subscription[] = [];

  constructor(
    private globalEventsManager: GlobalEventManagerService,
    private productController: ProductControllerService,
    private location: Location,
    private route: ActivatedRoute,
    private modalService: NgbModalImproved,
    private router: Router
  ) { }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
  }

  ngOnInit(): void {
    if (this.mode === "create") {
      this.newBatch();
      this.title = $localize`:@@batchDetail.title.new:Add batch`;
    } else {
      this.getBatch();
      this.title = $localize`:@@batchDetail.title.edit:Edit batch`;
    }
    const sub2 = this.globalEventsManager.loadedGoogleMapsEmitter.subscribe(
      loaded => {
        if (loaded) this.isGoogleMapsLoaded = true;
      },
      error => { }
    )
    this.subs.push(sub2);

  }

  newBatch() {
    this.batchDetailForm = generateFormFromMetadata(ApiProductLabelBatch.formMetadata(), {}, ApiProductLabelBatchValidationScheme);
  }

  getBatch(): void {
    this.globalEventsManager.showLoading(true);
    const id = +this.route.snapshot.paramMap.get('batchId');
    const sub = this.productController.getProductLabelBatch(id)
      .subscribe(batch => {
        this.batch = batch.data;

        this.batchDetailForm = generateFormFromMetadata(ApiProductLabelBatch.formMetadata(), batch.data, ApiProductLabelBatchValidationScheme)
        this.initializeOriginLocations(this.originLocations.value);

        this.initializeMarkers(this.originLocations.value);

        this.globalEventsManager.showLoading(false);
      },
        error => {
          this.globalEventsManager.showLoading(false);
        });
    this.subs.push(sub);
  }

  get mode() {
    const id = this.route.snapshot.params.batchId;
    return id == null ? 'create' : 'update'
  }


  goBack(): void {
    this.location.back()
  }


  async saveBatch(goBack = true) {
    this.submitted = true;
    if (this.batchDetailForm.invalid || !this.validateLocations()) {
      this.globalEventsManager.push({
        action: 'error',
        notificationType: 'error',
        title: $localize`:@@batchDetail.saveBatch.error.title:Error`,
        message: $localize`:@@batchDetail.saveBatch.error.message:Errors on page. Please check!`
      })
      return
    }

    this.prepareRequest();
    const params = this.route.snapshot.params;
    const res = await this.productController.updateProductLabelBatch({ ...params, ...this.batchDetailForm.value }).pipe(take(1)).toPromise()
    if (res && res.status == 'OK' && goBack) {
      this.batchDetailForm.markAsPristine()
      this.goBack()
    }
  }

  async createBatch(goBack = true) {
    this.submitted = true;
    if (this.batchDetailForm.invalid || !this.validateLocations()) {
      this.globalEventsManager.push({
        action: 'error',
        notificationType: 'error',
        title: $localize`:@@batchDetail.createBatch.error.title:Error`,
        message: $localize`:@@batchDetail.createBatch.error.message:Errors on page. Please check!`
      })
      return
    }

    this.prepareRequest();
    const res = await this.productController.createProductLabelBatch(this.batchDetailForm.value).pipe(take(1)).toPromise()
    if (res && res.status == 'OK' && goBack) {
      this.batchDetailForm.markAsPristine()
      this.goBack();
      this.globalEventsManager.showLoading(false);
    }

  }

  validateLocations () {
    return this.origCheck;
  }

  get origCheck() {
    return this.batchDetailForm.get('traceOrigin').value == null || !this.batchDetailForm.get('traceOrigin').value ||
    (this.batchDetailForm.get('traceOrigin').value && this.batchDetailForm.get('locations').value.length > 0)
  }

  get changed() {
    return this.batchDetailForm.dirty;
  }

  prepareRequest() {
    const pd = this.batchDetailForm.get('productionDate').value;
    if (pd != null) this.batchDetailForm.get('productionDate').setValue(dateISOString(pd));
    const ed = this.batchDetailForm.get('expiryDate').value;
    if (ed != null) this.batchDetailForm.get('expiryDate').setValue(dateISOString(ed));
    if (this.mode == 'create') this.batchDetailForm.get('labelId').setValue(Number(this.route.snapshot.params.labelId));
  }

  onFileUpload(event) {
  }

  fitBounds() {
    if (this.initialBounds.length == 0) return;
    this.bounds = new google.maps.LatLngBounds()
    for (const bound of this.initialBounds) {
      this.bounds.extend(bound);
    }
    if (this.bounds.isEmpty()) {
      this.gMap.googleMap.setCenter(this.defaultCenter)
      this.gMap.googleMap.setZoom(this.defaultZoom);
      return;
    }
    const center = this.bounds.getCenter()
    const offset = 0.02
    const northEast = new google.maps.LatLng(
      center.lat() + offset,
      center.lng() + offset
    )
    const southWest = new google.maps.LatLng(
      center.lat() - offset,
      center.lng() - offset
    )
    const minBounds = new google.maps.LatLngBounds(southWest, northEast)
    this.gMap.fitBounds(this.bounds.union(minBounds))
  }

  //origin location helper methods
  get originLocations(): UntypedFormArray {
    return this.batchDetailForm.get('locations') as UntypedFormArray
  }

  createOrFillOriginLocationsItem(loc: any, create: boolean): UntypedFormGroup {
    return new UntypedFormGroup({
      latitude: new UntypedFormControl(create ? loc.lat : loc.latitude),
      longitude: new UntypedFormControl(create ? loc.lng : loc.longitude),
      pinName: new UntypedFormControl(create ? null : loc.pinName),
      numberOfFarmers: new UntypedFormControl(create ? null : loc.numberOfFarmers),
    });
  }

  initializeOriginLocations(locs): void {
    const tmp = new UntypedFormArray([]);
    for (const loc of locs) {
      tmp.push(this.createOrFillOriginLocationsItem(loc, false));
    };
    (this.batchDetailForm as UntypedFormGroup).setControl('locations', tmp);
    this.batchDetailForm.updateValueAndValidity()
  }

  initializeMarkers(locs): void {
    this.markers = [];
    for (const loc of locs) {
      const tmp = {
        position: {
          lat: loc.latitude,
          lng: loc.longitude
        },
        label: {
          text: loc.numberOfFarmers ? String(loc.numberOfFarmers) : ' '
        },
        infoText: loc.pinName
      }
      this.markers.push(tmp);
      this.initialBounds.push(tmp.position);
    }
  }

  addOriginLocations(loc) {
    const tmp = {
      position: loc,
      label: {
        text: ' '
      },
      infoText: ' '
    }
    this.markers.push(tmp)
    this.initialBounds.push(tmp.position);
    this.originLocations.push(this.createOrFillOriginLocationsItem(loc, true) as UntypedFormGroup);
    this.batchDetailForm.markAsDirty();
  }

  removeOriginLocation(index: number) {
    this.originLocations.removeAt(index);
    this.markers.splice(index, 1);
    this.initialBounds.splice(index, 1);
    this.batchDetailForm.markAsDirty();
  }

  updateMarkerLocation(loc, index) {
    this.originLocations.at(index).get('latitude').setValue(loc.lat);
    this.originLocations.at(index).get('longitude').setValue(loc.lng);
    const tmpCurrent = this.markers[index];
    const tmp = {
      position: loc,
      label: tmpCurrent.label,
      infoText: tmpCurrent.infoText
    }
    this.markers.splice(index, 1, tmp);
    this.initialBounds.splice(index, 1, tmp.position);
  }

  updateInfoWindow(infoText, index) {
    const tmpCurrent = this.markers[index];
    const tmp = {
      position: tmpCurrent.position,
      label: tmpCurrent.label,
      infoText: infoText
    }
    this.markers.splice(index, 1, tmp);
  }

  dblClick(event: google.maps.MapMouseEvent) {
    this.addOriginLocations(event.latLng.toJSON());
  }

  dragend(event, index) {
    this.updateMarkerLocation(event.latLng.toJSON(), index);
  }

  openInfoWindow(gMarker, marker) {
    this.gInfoWindowText = marker.infoText;
    this.gInfoWindow.open(gMarker);
  }

  onKey(event, index) {
    this.updateInfoWindow(event.target.value, index)
  }

  async prefillFromProduct() {
    const modalRef = this.modalService.open(PrefillLocationsFromProductModalComponent, { centered: true });
    Object.assign(modalRef.componentInstance, {
      title: $localize`:@@batchDetail.prefillFromProduct.title:Prefill locations from product?`,
      instructionsHtml: $localize`:@@batchDetail.prefillFromProduct.instructionsHtml:This action will replace all your current locations with product's locations`
    })
    const confiem = await modalRef.result;
    if (confirm) {
      const productId = +this.route.snapshot.paramMap.get('id');
      this.productController.getProduct(productId).pipe(take(1))
        .subscribe(resp => {
          if (resp.status == "OK") {
            this.prefillLocations(resp.data.origin.locations);
          }

        }
        )
    }
  }

  prefillLocations(prodLocations){
    this.initializeOriginLocations(prodLocations);
    this.initialBounds = [];
    this.initializeMarkers(prodLocations);
    this.fitBounds();
    this.batchDetailForm.markAsDirty();
  }

}
