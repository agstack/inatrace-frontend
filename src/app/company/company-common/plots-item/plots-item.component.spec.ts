import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { ApiPlotCoordinate } from '../../../../api/model/apiPlotCoordinate';
import { CompanyControllerService } from '../../../../api/api/companyController.service';
import { CompanyFarmersDetailsComponent } from '../../company-farmers/company-farmers-details/company-farmers-details.component';
import { PlotsItemComponent } from './plots-item.component';
import { PlotCoordinateAction } from '../../../shared-services/plot-coordinate-action-enum';

describe('PlotsItemComponent plot area', () => {
  let component: PlotsItemComponent;
  const rectangle: ApiPlotCoordinate[] = [
    { longitude: 0, latitude: 0 },
    { longitude: 0.001, latitude: 0 },
    { longitude: 0.001, latitude: 0.001 },
    { longitude: 0, latitude: 0.001 }
  ];

  beforeEach(() => {
    component = new PlotsItemComponent({} as any, {} as any);
    component.tmpFormGroup = new FormGroup({
      coordinates: new FormArray([]),
      size: new FormControl(null),
      unit: new FormControl(null)
    });
  });

  it('converts an approximately 12,392 square metre polygon to hectares', () => {
    component.updateFormCoordinates(rectangle);
    expect(component.form.get('size').value).toBe('1.24');
    expect(component.form.get('unit').value).toBe('ha');
    expect(component.form.get('coordinates').value.length).toBe(4);
  });

  it('clears a previous polygon area for zero, one or two coordinates', () => {
    [[], rectangle.slice(0, 1), rectangle.slice(0, 2), null].forEach(coordinates => {
      component.updateFormCoordinates(rectangle);
      component.updateFormCoordinates(coordinates);
      expect(component.form.get('size').value).toBeNull();
      expect(component.form.get('unit').value).toBeNull();
      expect(component.form.get('coordinates').value.length).toBe(coordinates ? coordinates.length : 0);
    });
  });

  it('preserves the saved area when loading a non-editable plot', () => {
    component.mapEditable = false;
    component.form.get('size').setValue(2.5);
    component.form.get('unit').setValue('ha');
    component.updateFormCoordinates(rectangle);
    expect(component.form.get('size').value).toBe(2.5);
    expect(component.form.get('unit').value).toBe('ha');
  });

  it('keeps a single GPS point without a fabricated area when saved', () => {
    component.plotType = 'single_point';
    component.originalFormControl = new FormControl({});
    component.updateFormCoordinates(rectangle.slice(0, 1));
    component.form.markAsDirty();
    component.save();
    expect(component.originalFormControl.value.size).toBeNull();
    expect(component.originalFormControl.value.unit).toBeNull();
    expect(component.originalFormControl.value.coordinates[0]).toEqual(jasmine.objectContaining(rectangle[0]));
  });

  it('recalculates the area when an editable boundary changes', () => {
    component.form.get('size').setValue(20);
    component.form.get('unit').setValue('ha');
    component.updateFormCoordinates(rectangle);
    expect(component.form.get('size').value).toBe('1.24');
    expect(component.form.get('unit').value).toBe('ha');
  });

  it('puts the corrected value and coordinates into the saved form', () => {
    component.originalFormControl = new FormControl({});
    component.updateFormCoordinates(rectangle);
    component.form.markAsDirty();
    component.save();
    expect(component.originalFormControl.value.size).toBe('1.24');
    expect(component.originalFormControl.value.unit).toBe('ha');
    expect(component.originalFormControl.value.coordinates.length).toBe(rectangle.length);
    rectangle.forEach((coordinate, index) => {
      expect(component.originalFormControl.value.coordinates[index]).toEqual(jasmine.objectContaining(coordinate));
    });
  });

  it('sends the calculated area through the farmer update and reads it back', async () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [CompanyControllerService] });
    const api = TestBed.inject(CompanyControllerService);
    const http = TestBed.inject(HttpTestingController);
    const plotControl = new FormControl({});
    component.originalFormControl = plotControl;
    component.updateFormCoordinates(rectangle);
    component.form.markAsDirty();
    component.save();

    const route = { snapshot: { params: { id: 42 } } };
    const ui = { showLoading: () => {} };
    const onboarding = { addFarmersCurrentStep$: of(0) };
    const farmer = new CompanyFarmersDetailsComponent({} as any, route as any, api, ui as any,
      {} as any, {} as any, {} as any, {} as any, onboarding as any, {} as any);
    farmer.update = true;
    farmer.farmerForm = new FormGroup({
      id: new FormControl(42),
      type: new FormControl(null),
      hasSmartphone: new FormControl(false),
      location: new FormGroup({}),
      farm: new FormGroup({
        organic: new FormControl(false), areaUnit: new FormControl(null),
        totalCultivatedArea: new FormControl(null), areaOrganicCertified: new FormControl(null)
      }),
      plots: new FormArray([plotControl])
    });
    spyOn(farmer, 'ngOnInit');
    const save = farmer.save(true);
    const request = http.expectOne(`${api.configuration.basePath}/api/company/userCustomers/edit`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.plots[0].size).toBe('1.24');
    expect(request.request.body.plots[0].unit).toBe('ha');
    expect(request.request.body.plots[0].coordinates.length).toBe(4);
    request.flush({ status: 'OK', data: request.request.body });
    await save;
    expect(farmer.ngOnInit).toHaveBeenCalled();

    const reload = api.getUserCustomer(42).toPromise();
    const getRequest = http.expectOne(`${api.configuration.basePath}/api/company/userCustomers/42`);
    expect(getRequest.request.method).toBe('GET');
    const storedPlot = { ...request.request.body.plots[0], id: 17, size: 1.24 };
    getRequest.flush({ status: 'OK', data: { id: 42, plots: [storedPlot] } });
    const response = await reload;
    const reopened = new PlotsItemComponent({} as any, {} as any);
    reopened.formControlInput = new FormControl(response.data.plots[0]);
    reopened.ngOnInit();
    reopened.updateFormCoordinates(response.data.plots[0].coordinates);
    expect(reopened.form.get('size').value).toBe(1.24);
    expect(reopened.form.get('unit').value).toBe('ha');
    expect(reopened.form.get('coordinates').value.length).toBe(4);
    http.verify();
  });
});

describe('PlotsItemComponent undo', () => {
  let component: PlotsItemComponent;

  beforeEach(() => {
    component = new PlotsItemComponent({} as any, {} as any);
    component.tmpFormGroup = new FormGroup({
      coordinates: new FormArray([]),
      size: new FormControl(2),
      unit: new FormControl('ha')
    });
  });

  it('allows removal of the final point and ignores undo on an empty drawing', () => {
    const register = spyOn(component.plotCoordinatesManager, 'registerEvent');
    component.plotCoordinates = [{ latitude: 1, longitude: 2 }];
    component.undoLastPoint();
    expect(register).toHaveBeenCalledWith(PlotCoordinateAction.DELETE_LAST_COORDINATE);
    component.plotCoordinates = [];
    component.undoLastPoint();
    expect(register).toHaveBeenCalledTimes(1);
  });
});
