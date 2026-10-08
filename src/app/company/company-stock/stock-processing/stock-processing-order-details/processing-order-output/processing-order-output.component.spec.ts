import { FormControl, FormGroup } from '@angular/forms';
import { ApiProcessingAction } from '../../../../../../api/model/apiProcessingAction';
import { ApiProcessingEvidenceField } from '../../../../../../api/model/apiProcessingEvidenceField';
import { ProcessingOrderOutputComponent } from './processing-order-output.component';

describe('ProcessingOrderOutputComponent', () => {
  function outputForm(requiredEvidenceFieldValues: any[] = []): FormGroup {
    return new FormGroup({
      totalQuantity: new FormControl(null),
      semiProduct: new FormControl(null),
      facility: new FormControl(null),
      finalProduct: new FormControl(null),
      measureUnitType: new FormControl(null),
      requiredEvidenceFieldValues: new FormControl(requiredEvidenceFieldValues)
    });
  }

  function componentWith(actionFields: ApiProcessingEvidenceField[]): ProcessingOrderOutputComponent {
    const component = new ProcessingOrderOutputComponent();
    component.editing = true;
    component.selectedProcAction = {
      type: ApiProcessingAction.TypeEnum.PROCESSING,
      requiredEvidenceFields: actionFields
    } as ApiProcessingAction;
    return component;
  }

  it('creates independent evidence controls for every output and restores numeric values', () => {
    const fields = [
      {id: 1, fieldName: 'moisture', type: ApiProcessingEvidenceField.TypeEnum.NUMBER, mandatory: true},
      {id: 2, fieldName: 'brokenShare', type: ApiProcessingEvidenceField.TypeEnum.INTEGER, mandatory: false}
    ] as ApiProcessingEvidenceField[];
    const component = componentWith(fields);
    const firstOutput = outputForm([
      {evidenceFieldId: 1, evidenceFieldName: 'moisture', numericValue: 11.5},
      {evidenceFieldId: 2, evidenceFieldName: 'brokenShare', numericValue: 0}
    ]);
    const secondOutput = outputForm([
      {evidenceFieldId: 1, evidenceFieldName: 'moisture', numericValue: 9.25},
      {evidenceFieldId: 2, evidenceFieldName: 'brokenShare', numericValue: 4}
    ]);

    component.setRequiredFieldsAndListenersForTSO(firstOutput);
    component.setRequiredFieldsAndListenersForTSO(secondOutput);

    const firstEvidence = firstOutput.get('requiredProcEvidenceFieldGroup') as FormGroup;
    const secondEvidence = secondOutput.get('requiredProcEvidenceFieldGroup') as FormGroup;
    expect(firstEvidence.get('moisture').value).toBe(11.5);
    expect(firstEvidence.get('brokenShare').value).toBe(0);
    expect(secondEvidence.get('moisture').value).toBe(9.25);
    expect(secondEvidence.get('brokenShare').value).toBe(4);

    firstEvidence.get('moisture').setValue(12.75);
    expect(secondEvidence.get('moisture').value).toBe(9.25);
    component.ngOnDestroy();
  });

  it('requires mandatory fields while allowing an empty optional field and rejecting fractional integers', () => {
    const fields = [
      {id: 1, fieldName: 'moisture', type: ApiProcessingEvidenceField.TypeEnum.NUMBER, mandatory: true},
      {id: 2, fieldName: 'brokenShare', type: ApiProcessingEvidenceField.TypeEnum.INTEGER, mandatory: false}
    ] as ApiProcessingEvidenceField[];
    const component = componentWith(fields);
    const output = outputForm();

    component.setRequiredFieldsAndListenersForTSO(output);

    const evidence = output.get('requiredProcEvidenceFieldGroup') as FormGroup;
    expect(evidence.get('moisture').invalid).toBe(true);
    expect(evidence.get('brokenShare').valid).toBe(true);

    evidence.get('moisture').setValue(0);
    expect(evidence.get('moisture').valid).toBe(true);

    evidence.get('brokenShare').setValue(3.5);
    expect(evidence.get('brokenShare').errors).toEqual({integer: true});

    evidence.get('brokenShare').setValue(0);
    expect(evidence.get('brokenShare').valid).toBe(true);
    component.ngOnDestroy();
  });
});
