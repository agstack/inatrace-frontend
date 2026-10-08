import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { CompanyDetailProcessingActionsDetailComponent } from './company-detail-processing-actions-detail.component';

describe('CompanyDetailProcessingActionsDetailComponent translations', () => {
  function translation(language: string, name = '', description = ''): FormGroup {
    return new FormGroup({
      language: new FormControl(language),
      name: new FormControl(name),
      description: new FormControl(description)
    });
  }

  function createComponent(translations: FormGroup[]): CompanyDetailProcessingActionsDetailComponent {
    const globalEventsManager = jasmine.createSpyObj('GlobalEventManagerService', ['showLoading']);
    const component = new CompanyDetailProcessingActionsDetailComponent(
      jasmine.createSpyObj('Router', ['navigate']),
      { snapshot: { params: { id: '1' }, paramMap: { get: () => '1' } } } as any,
      globalEventsManager,
      null, null, null, null, null, null, null, null,
      { detectChanges: jasmine.createSpy('detectChanges') } as any,
      null
    );
    component.form = new FormGroup({ translations: new FormArray(translations) });
    component.finalizeForm();
    return component;
  }

  function translationControl(component: CompanyDetailProcessingActionsDetailComponent, language: string): FormGroup {
    return (component.form.get('translations') as FormArray).controls
      .find(control => control.get('language').value === language) as FormGroup;
  }

  it('requires the English name and description without requiring optional translations', () => {
    const component = createComponent([translation('EN')]);
    const english = translationControl(component, 'EN');
    const german = translationControl(component, 'DE');

    expect(english.get('name').hasError('required')).toBe(true);
    expect(english.get('description').hasError('required')).toBe(true);
    expect(german.get('name').valid).toBe(true);
    expect(german.get('description').valid).toBe(true);
  });

  it('keeps optional translations empty when the English translation is complete', () => {
    const component = createComponent([translation('EN', 'Drying', 'Dry the coffee beans')]);
    const english = translationControl(component, 'EN');
    const kinyarwanda = translationControl(component, 'RW');

    expect(english.value).toEqual({ language: 'EN', name: 'Drying', description: 'Dry the coffee beans' });
    expect(kinyarwanda.valid).toBe(true);
    expect(component.form.valid).toBe(true);
  });

  it('shows the English translation when a save is blocked by missing English fields', async () => {
    const component = createComponent([translation('EN')]);
    component.selectedLanguage = 'DE';

    await component.saveProcessingAction();

    expect(component.submitted).toBe(true);
    expect(component.selectedLanguage).toBe('EN');
  });
});
