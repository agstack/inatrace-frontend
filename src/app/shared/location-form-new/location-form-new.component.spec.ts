/* tslint:disable:component-selector */
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { GlobalEventManagerService } from '../../core/global-event-manager.service';
import { CountryService } from '../../shared-services/countries.service';
import { LocationFormNewComponent } from './location-form-new.component';

@Component({selector: 'textinput', template: ''})
class TextinputStubComponent {
  @Input() form: FormControl;
  @Input() label: string;
  @Input() placeholder: string;
}

@Component({selector: 'single-choice', template: ''})
class SingleChoiceStubComponent {
  @Input() formControlInput: FormControl;
  @Input() codebookService: any;
  @Input() isInvalidChoice: boolean;
}

@Component({selector: 'google-map', template: '<ng-content></ng-content>'})
class GoogleMapStubComponent {
  @Input() height: string;
  @Input() width: string;
  @Input() options: any;
  @Output() mapDblclick = new EventEmitter<any>();
}

@Component({selector: 'map-marker', template: '', exportAs: 'mapMarker'})
class MapMarkerStubComponent {
  @Input() position: any;
  @Input() label: any;
  @Input() options: any;
  @Output() mapRightclick = new EventEmitter<any>();
  @Output() mapDragend = new EventEmitter<any>();
}

describe('LocationFormNewComponent map pin validation', () => {
  let component: LocationFormNewComponent;
  let googleMapsLoaded: Subject<boolean>;

  beforeEach(() => {
    googleMapsLoaded = new Subject<boolean>();
    component = new LocationFormNewComponent(null, {
      loadedGoogleMapsEmitter: googleMapsLoaded
    } as any);
  });

  afterEach(() => component.ngOnDestroy());

  it('requires a pin immediately for an existing publicly visible location', () => {
    component.form = createLocationForm('true');

    component.ngOnInit();

    expect(component.isMapPinRequired).toBe(true);
    expect(component.hasInvalidMapPin).toBe(true);
    expect(component.form.invalid).toBe(true);
  });

  it('updates coordinate validators when public visibility changes', () => {
    component.form = createLocationForm('false');

    component.ngOnInit();
    expect(component.form.valid).toBe(true);

    component.form.get('facilityLocation.publiclyVisible').setValue(true);
    expect(component.form.invalid).toBe(true);

    component.form.get('facilityLocation.latitude').setValue(0);
    component.form.get('facilityLocation.longitude').setValue(0);
    expect(component.form.valid).toBe(true);

    component.form.get('facilityLocation.publiclyVisible').setValue('false');
    component.form.get('facilityLocation.latitude').setValue(null);
    component.form.get('facilityLocation.longitude').setValue(null);
    expect(component.isMapPinRequired).toBe(false);
    expect(component.hasInvalidMapPin).toBe(false);
    expect(component.form.valid).toBe(true);
  });

  it('clears coordinates and invalidates a public location when the pin is removed', () => {
    component.form = createLocationForm('true', 1.25, 32.5);
    component.marker = {position: {lat: 1.25, lng: 32.5}};

    component.ngOnInit();
    component.removeMarker();

    expect(component.marker).toBeNull();
    expect(component.form.get('facilityLocation.latitude').value).toBeNull();
    expect(component.form.get('facilityLocation.longitude').value).toBeNull();
    expect(component.form.get('facilityLocation.latitude').dirty).toBe(true);
    expect(component.form.get('facilityLocation.longitude').dirty).toBe(true);
    expect(component.hasInvalidMapPin).toBe(true);
    expect(component.form.invalid).toBe(true);
  });
});

describe('LocationFormNewComponent map pin feedback', () => {
  let component: LocationFormNewComponent;
  let fixture: ComponentFixture<LocationFormNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        LocationFormNewComponent,
        TextinputStubComponent,
        SingleChoiceStubComponent,
        GoogleMapStubComponent,
        MapMarkerStubComponent
      ],
      imports: [ReactiveFormsModule],
      providers: [
        {provide: CountryService, useValue: null},
        {provide: GlobalEventManagerService, useValue: {loadedGoogleMapsEmitter: new Subject<boolean>()}}
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LocationFormNewComponent);
    component = fixture.componentInstance;
    component.form = createLocationForm('true');
    component.submitted = true;
    component.isGoogleMapsLoaded = true;
  });

  it('renders the required indicator and feedback beside an invalid public map', () => {
    fixture.detectChanges();

    const map = fixture.nativeElement.querySelector('google-map');
    expect(fixture.nativeElement.textContent).toContain('Map pin*');
    expect(fixture.nativeElement.textContent).toContain(
      'A map pin is required when the location is publicly visible.'
    );
    expect(map.classList).toContain('location-map--invalid');
  });

  it('does not render map pin feedback for a non-public location', () => {
    component.form.get('facilityLocation.publiclyVisible').setValue('false');
    fixture.detectChanges();

    const map = fixture.nativeElement.querySelector('google-map');
    expect(fixture.nativeElement.textContent).toContain('Map pin');
    expect(fixture.nativeElement.textContent).not.toContain(
      'A map pin is required when the location is publicly visible.'
    );
    expect(map.classList).not.toContain('location-map--invalid');
  });
});

function createLocationForm(publiclyVisible: string | boolean, latitude: number = null, longitude: number = null): FormGroup {
  return new FormGroup({
    facilityLocation: new FormGroup({
      publiclyVisible: new FormControl(publiclyVisible),
      latitude: new FormControl(latitude),
      longitude: new FormControl(longitude),
      address: new FormGroup({country: new FormControl(null)})
    })
  });
}
