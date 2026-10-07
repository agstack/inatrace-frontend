import { FormControl, FormGroup } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { LocationFormNewComponent } from '../../../shared/location-form-new/location-form-new.component';
import { CompanyDetailFacilityAddComponent } from './company-detail-facility-add.component';

describe('CompanyDetailFacilityAddComponent location submission', () => {
  let component: CompanyDetailFacilityAddComponent;
  let facilityController: jasmine.SpyObj<any>;
  let location: jasmine.SpyObj<any>;
  let mapForm: LocationFormNewComponent;

  beforeEach(() => {
    facilityController = jasmine.createSpyObj('FacilityControllerService', ['createOrUpdateFacility']);
    location = jasmine.createSpyObj('Location', ['back']);
    component = new CompanyDetailFacilityAddComponent(
      {snapshot: {params: {id: '42'}}} as any,
      location,
      null,
      facilityController,
      null,
      null,
      null,
      null,
      null
    );
  });

  afterEach(() => {
    if (mapForm) {
      mapForm.ngOnDestroy();
    }
  });

  it('does not submit a public facility without a map pin', () => {
    component.edit = false;
    component.form = createFacilityForm('true');
    initializeMapValidation(component.form);

    component.save();

    expect(component.submitted).toBe(true);
    expect(component.form.invalid).toBe(true);
    expect(facilityController.createOrUpdateFacility).not.toHaveBeenCalled();
  });

  it('submits a new public facility with valid coordinates', () => {
    component.edit = false;
    component.form = createFacilityForm('true', 0, 0);
    initializeMapValidation(component.form);
    facilityController.createOrUpdateFacility.and.returnValue(of({}));

    component.save();

    expect(component.form.valid).toBe(true);
    expect(facilityController.createOrUpdateFacility).toHaveBeenCalled();
    expect(facilityController.createOrUpdateFacility.calls.mostRecent().args[0].company.id).toBe('42');
    expect(location.back).toHaveBeenCalled();
  });

  it('submits an edited public facility with valid coordinates', () => {
    component.edit = true;
    component.form = createFacilityForm(true, 1.25, 32.5);
    initializeMapValidation(component.form);
    facilityController.createOrUpdateFacility.and.returnValue(of({}));

    component.save();

    expect(component.form.valid).toBe(true);
    expect(facilityController.createOrUpdateFacility).toHaveBeenCalled();
    expect(location.back).toHaveBeenCalled();
  });

  function initializeMapValidation(form: FormGroup): void {
    mapForm = new LocationFormNewComponent(null, {
      loadedGoogleMapsEmitter: new Subject<boolean>()
    } as any);
    mapForm.form = form;
    mapForm.ngOnInit();
  }
});

function createFacilityForm(publiclyVisible: string | boolean, latitude: number = null, longitude: number = null): FormGroup {
  return new FormGroup({
    company: new FormGroup({id: new FormControl(null)}),
    facilityLocation: new FormGroup({
      publiclyVisible: new FormControl(publiclyVisible),
      latitude: new FormControl(latitude),
      longitude: new FormControl(longitude)
    })
  });
}
