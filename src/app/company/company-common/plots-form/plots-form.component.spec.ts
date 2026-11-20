import { UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';

import { PlotsFormComponent } from './plots-form.component';

describe('PlotsFormComponent', () => {

  function createForm(location: any, country: any): UntypedFormGroup {
    return new UntypedFormGroup({
      plots: new UntypedFormArray([]),
      location: new UntypedFormGroup({
        latitude: new UntypedFormControl(location?.latitude ?? null),
        longitude: new UntypedFormControl(location?.longitude ?? null),
        address: new UntypedFormGroup({
          country: new UntypedFormControl(country ?? null)
        })
      })
    });
  }

  function createComponent(location: any, country: any): PlotsFormComponent {
    const component = new PlotsFormComponent({} as any);
    component.form = createForm(location, country);
    component.ngOnInit();
    return component;
  }

  it('uses the farmer location coordinates for the pin and initial map center', () => {
    const component = createComponent(
      { latitude: 9.0765, longitude: 7.3986 },
      { id: 162, name: 'Nigeria', code: 'NG', latitude: 9.082, longitude: 8.6753 }
    );

    expect(component.pin).toEqual({ latitude: 9.0765, longitude: 7.3986 });
    expect(component.initialLat).toBe(9.0765);
    expect(component.initialLng).toBe(7.3986);
  });

  it('falls back to the country coordinates when the farmer has no pin', () => {
    const component = createComponent(
      { latitude: null, longitude: null },
      { id: 162, name: 'Nigeria', code: 'NG', latitude: 9.082, longitude: 8.6753 }
    );

    expect(component.pin).toBeUndefined();
    expect(component.initialLat).toBe(9.082);
    expect(component.initialLng).toBe(8.6753);
  });

  it('accepts zero as a valid farmer coordinate', () => {
    const component = createComponent(
      { latitude: 0, longitude: 0 },
      { id: 162, name: 'Nigeria', code: 'NG', latitude: 9.082, longitude: 8.6753 }
    );

    expect(component.pin).toEqual({ latitude: 0, longitude: 0 });
    expect(component.initialLat).toBe(0);
    expect(component.initialLng).toBe(0);
  });

  it('uses a coherent country pair when the farmer location is incomplete', () => {
    const component = createComponent(
      { latitude: 9.0765, longitude: null },
      { id: 162, name: 'Nigeria', code: 'NG', latitude: 9.082, longitude: 8.6753 }
    );

    expect(component.pin).toBeUndefined();
    expect(component.initialLat).toBe(9.082);
    expect(component.initialLng).toBe(8.6753);
  });

  it('leaves the initial center undefined when neither source has coordinates', () => {
    const component = createComponent(
      { latitude: null, longitude: null },
      { id: 162, name: 'Nigeria', code: 'NG' }
    );

    expect(component.pin).toBeUndefined();
    expect(component.initialLat).toBeUndefined();
    expect(component.initialLng).toBeUndefined();
  });
});
