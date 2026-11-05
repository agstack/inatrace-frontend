import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { PlotsItemComponent } from './plots-item.component';
import { PlotCoordinateAction } from '../../../shared-services/plot-coordinate-action-enum';

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

  it('updates coordinates and clears a stale area when the boundary becomes incomplete', () => {
    const coordinates = [{ latitude: 1, longitude: 2 }, { latitude: 2, longitude: 3 }];
    component.updateFormCoordinates(coordinates);
    expect(component.form.get('coordinates').value.length).toBe(2);
    expect(component.form.get('size').value).toBeNull();
    expect(component.form.get('unit').value).toBeNull();
    component.updateFormCoordinates([]);
    expect(component.form.get('coordinates').value).toEqual([]);
  });

  it('preserves saved area for a non-editable plot', () => {
    component.mapEditable = false;
    component.updateFormCoordinates([{ latitude: 1, longitude: 2 }]);
    expect(component.form.get('size').value).toBe(2);
    expect(component.form.get('unit').value).toBe('ha');
  });
});
