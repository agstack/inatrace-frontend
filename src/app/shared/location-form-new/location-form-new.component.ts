import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CountryService } from '../../shared-services/countries.service';
import { GlobalEventManagerService } from '../../core/global-event-manager.service';
import { FormGroup, Validators } from '@angular/forms';
import _ from 'lodash-es';
import { EnumSifrant } from '../../shared-services/enum-sifrant';
import { GoogleMap } from '@angular/google-maps';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-location-form-new',
  templateUrl: './location-form-new.component.html',
  styleUrls: ['./location-form-new.component.scss']
})
export class LocationFormNewComponent implements OnInit, OnDestroy {

  @Input()
  form: FormGroup;

  @Input()
  submitted = false;

  @ViewChild(GoogleMap) set map(map: GoogleMap) {
    if (map) { this.gMap = map; this.fitBounds(); }
  }

  gMap = null;
  isGoogleMapsLoaded = false;
  marker = null;
  bounds;
  initialBounds = [];
  defaultCenter = {
    lat: 5.274054,
    lng: 21.514503
  };
  defaultZoom = 3;

  private destroy$ = new Subject<void>();

  codebookStatus = EnumSifrant.fromObject(this.publiclyVisible);

  constructor(
      public countryCodes: CountryService,
      public globalEventsManager: GlobalEventManagerService
  ) { }

  ngOnInit(): void {
    this.updateCoordinateValidators(this.publiclyVisibleControl.value);
    this.publiclyVisibleControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.updateCoordinateValidators(value));

    this.globalEventsManager.loadedGoogleMapsEmitter
      .pipe(takeUntil(this.destroy$))
      .subscribe(loaded => {
      if (loaded) {
        this.isGoogleMapsLoaded = true;
        this.initializeMarker();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isMapPinRequired(): boolean {
    return this.isPubliclyVisible(this.publiclyVisibleControl.value);
  }

  get hasInvalidMapPin(): boolean {
    return this.isMapPinRequired && (this.latitudeControl.invalid || this.longitudeControl.invalid);
  }

  initializeMarker() {
    if (!this.form.get('facilityLocation.latitude') || !this.form.get('facilityLocation.longitude')) {
      return;
    }
    const lat = this.form.get('facilityLocation.latitude').value;
    const lng = this.form.get('facilityLocation.longitude').value;
    if (lat == null || lng == null) {
      return;
    }
    const tmp = {
      position: {
        lat,
        lng
      }
    };
    this.marker = tmp;
    this.initialBounds.push(tmp.position);
  }

  doShowVillage(): boolean {
    return this.form.get('facilityLocation.address.country').invalid
        || _.isEqual(this.form.get('facilityLocation.address.country').value, {id: 184, code: 'RW', name: 'Rwanda'});
  }

  get publiclyVisible() {
    const obj = {};
    obj['true'] = $localize`:@@locationForm.publiclyVisible.yes:YES`;
    obj['false'] = $localize`:@@locationForm.publiclyVisible.no:NO`;
    return obj;
  }

  dblClick(event: google.maps.MouseEvent) {
    if (this.marker) {
      this.updateMarkerLocation(event.latLng.toJSON());
    } else {
      this.marker = {
        position: event.latLng.toJSON()
      };
      this.updateLatLng();
    }
  }

  removeMarker() {
    this.marker = null;
    this.updateLatLng();
  }

  updateLatLng() {
    this.form.get('facilityLocation.latitude').setValue(this.marker ? this.marker.position.lat : null);
    this.form.get('facilityLocation.longitude').setValue(this.marker ? this.marker.position.lng : null);

    this.form.get('facilityLocation.latitude').markAsDirty();
    this.form.get('facilityLocation.longitude').markAsDirty();
  }

  updateMarkerLocation(location) {
    this.marker = {
      position: location
    };
    this.updateLatLng();
  }

  dragEnd(event) {
    this.updateMarkerLocation(event.latLng.toJSON());
  }

  fitBounds() {
    this.bounds = new google.maps.LatLngBounds();
    for (const bound of this.initialBounds) {
      this.bounds.extend(bound);
    }
    if (this.bounds.isEmpty()) {
      this.gMap.googleMap.setCenter(this.defaultCenter);
      this.gMap.googleMap.setZoom(this.defaultZoom);
      return;
    }
    const center = this.bounds.getCenter();
    const offset = 0.02;
    const northEast = new google.maps.LatLng(
        center.lat() + offset,
        center.lng() + offset
    );
    const southWest = new google.maps.LatLng(
        center.lat() - offset,
        center.lng() - offset
    );
    const minBounds = new google.maps.LatLngBounds(southWest, northEast);
    this.gMap.fitBounds(this.bounds.union(minBounds));
  }

  private get publiclyVisibleControl() {
    return this.form.get('facilityLocation.publiclyVisible');
  }

  private get latitudeControl() {
    return this.form.get('facilityLocation.latitude');
  }

  private get longitudeControl() {
    return this.form.get('facilityLocation.longitude');
  }

  private updateCoordinateValidators(publiclyVisible: string | boolean): void {
    const validators = this.isPubliclyVisible(publiclyVisible) ? [Validators.required] : [];

    [this.latitudeControl, this.longitudeControl].forEach(control => {
      control.setValidators(validators);
      control.updateValueAndValidity();
    });
  }

  private isPubliclyVisible(value: string | boolean): boolean {
    return value === true || value === 'true';
  }

}
