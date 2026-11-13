import { AbstractControl, UntypedFormArray, UntypedFormControl, UntypedFormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ApiStockOrderEvidenceFieldValue } from '../../../../../api/model/apiStockOrderEvidenceFieldValue';
import { ApiProcessingAction } from '../../../../../api/model/apiProcessingAction';
import { ApiStockOrderEvidenceTypeValue } from '../../../../../api/model/apiStockOrderEvidenceTypeValue';
import { ApiProcessingEvidenceType } from '../../../../../api/model/apiProcessingEvidenceType';
import ProcessingEvidenceFieldType = ApiProcessingEvidenceField.TypeEnum;
import { ApiProcessingEvidenceField } from '../../../../../api/model/apiProcessingEvidenceField';
import { ApiActivityProof } from '../../../../../api/model/apiActivityProof';
import { defaultEmptyObject, generateFormFromMetadata } from '../../../../../shared/utils';
import { ApiActivityProofValidationScheme } from '../../stock-core/additional-proof-item/validation';
import { ApiDocument } from '../../../../../api/model/apiDocument';

export class StockProcessingOrderDetailsHelper {

  public static integerValidator(control: AbstractControl): ValidationErrors | null {

    const value = control.value;
    if (value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }

    const numericValue = typeof value === 'number' ? value : Number(value);
    return Number.isInteger(numericValue) ? null : {integer: true};
  }

  public static setFormControlValidators(formGroup: UntypedFormGroup, formControlName: string, validators: ValidatorFn[]) {
    formGroup.get(formControlName).setValidators(validators);
    formGroup.get(formControlName).updateValueAndValidity();
  }

  public static async setRequiredProcessingEvidence(action: ApiProcessingAction, requiredProcessingEvidenceArray: UntypedFormArray) {

    requiredProcessingEvidenceArray.clear();

    if (action && action.requiredDocumentTypes && action.requiredDocumentTypes.length > 0) {

      for (const requiredDocumentType of action.requiredDocumentTypes) {
        requiredProcessingEvidenceArray.push(new UntypedFormGroup({
          evidenceTypeId: new UntypedFormControl(requiredDocumentType.id),
          evidenceTypeCode: new UntypedFormControl(requiredDocumentType.code),
          evidenceTypeLabel: new UntypedFormControl({ value: requiredDocumentType.label, disabled: true }),
          date: new UntypedFormControl(new Date(), requiredDocumentType.mandatory ? Validators.required : null),
          document: new UntypedFormControl(null, requiredDocumentType.mandatory ? Validators.required : null)
        }));
      }

    } else {
      requiredProcessingEvidenceArray.clear();
    }
  }

  public static prepareRequiredEvidenceTypeValues(requiredProcessingEvidenceArray: UntypedFormArray): ApiStockOrderEvidenceTypeValue[] {

    const evidenceTypesValues: ApiStockOrderEvidenceTypeValue[] = [];

    for (const control of requiredProcessingEvidenceArray.controls) {
      const controlValue: ApiStockOrderEvidenceTypeValue = control.value;
      if (controlValue && controlValue.document && controlValue.document.id) {
        evidenceTypesValues.push(controlValue);
      }
    }

    return evidenceTypesValues;
  }

  public static prepareOtherEvidenceDocuments(otherProcessingEvidenceArray: UntypedFormArray): ApiStockOrderEvidenceTypeValue[] {

    const otherEvidenceDocuments: ApiStockOrderEvidenceTypeValue[] = [];

    for (const control of otherProcessingEvidenceArray.controls) {

      const evidenceType: ApiProcessingEvidenceType = control.value.type;

      otherEvidenceDocuments.push({
        evidenceTypeId: evidenceType.id,
        evidenceTypeCode: evidenceType.code,
        date: control.value.formalCreationDate,
        document: control.value.document
      });
    }

    return otherEvidenceDocuments;
  }

  public static prepareRequiredEvidenceFieldValues(stockOrderEvidenceFields,
                                                   selectedProcAction: ApiProcessingAction): ApiStockOrderEvidenceFieldValue[] {

    const evidenceFieldsValues: ApiStockOrderEvidenceFieldValue[] = [];

    // Legacy processing orders, or an order opened before the action definition
    // has finished loading, may not have the injected evidence form group.
    if (!stockOrderEvidenceFields || !selectedProcAction?.requiredEvidenceFields) {
      return evidenceFieldsValues;
    }

    // Create stock order evidence field instances (values) for every form control
    Object.keys(stockOrderEvidenceFields).forEach(key => {

      const procEvidenceField = selectedProcAction.requiredEvidenceFields.find(pef => pef.fieldName === key);

      const evidenceFieldValue: ApiStockOrderEvidenceFieldValue = {
        evidenceFieldId: procEvidenceField.id,
        evidenceFieldName: procEvidenceField.fieldName
      };

      switch (procEvidenceField.type) {
        case ProcessingEvidenceFieldType.NUMBER:
        case ProcessingEvidenceFieldType.INTEGER:
        case ProcessingEvidenceFieldType.EXCHANGERATE:
        case ProcessingEvidenceFieldType.PRICE:
          evidenceFieldValue.numericValue = StockProcessingOrderDetailsHelper.toNumericValue(stockOrderEvidenceFields[key]);
          break;
        case ProcessingEvidenceFieldType.DATE:
        case ProcessingEvidenceFieldType.TIMESTAMP:
          evidenceFieldValue.dateValue = stockOrderEvidenceFields[key];
          break;
        case ProcessingEvidenceFieldType.STRING:
        case ProcessingEvidenceFieldType.TEXT:
          evidenceFieldValue.stringValue = stockOrderEvidenceFields[key];
          break;
        default:
          evidenceFieldValue.stringValue = stockOrderEvidenceFields[key];
      }

      evidenceFieldsValues.push(evidenceFieldValue);
    });

    return evidenceFieldsValues;
  }

  private static toNumericValue(value: any): number | null {
    if (value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }

    return Number(value);
  }

  public static loadExistingOtherEvidenceDocuments(firstTSO: UntypedFormGroup, otherProcessingEvidenceArray: UntypedFormArray) {

    ((firstTSO.get('otherEvidenceDocuments') as UntypedFormArray).value as ApiStockOrderEvidenceTypeValue[]).forEach(evidenceTypeValue => {
      otherProcessingEvidenceArray.push(new UntypedFormGroup({
        formalCreationDate: new UntypedFormControl(evidenceTypeValue.date),
        document: new UntypedFormControl(evidenceTypeValue.document),
        type: new UntypedFormGroup({
          id: new UntypedFormControl(evidenceTypeValue.evidenceTypeId),
          code: new UntypedFormControl(evidenceTypeValue.evidenceTypeCode),
          label: new UntypedFormControl(evidenceTypeValue.evidenceTypeLabel)
        })
      }));
    });
  }

  public static loadExistingRequiredEvidenceDocuments(firstTSO: UntypedFormGroup, requiredProcessingEvidenceArray: UntypedFormArray) {

    ((firstTSO.get('requiredEvidenceTypeValues') as UntypedFormArray).value as ApiStockOrderEvidenceTypeValue[]).forEach(evidenceTypeValue => {
      const evidenceTypeControl = requiredProcessingEvidenceArray.controls
        .find(control => control.get('evidenceTypeId').value === evidenceTypeValue.evidenceTypeId) as UntypedFormGroup;
      setTimeout(() => {
        evidenceTypeControl.get('date').setValue(evidenceTypeValue.date);
        evidenceTypeControl.setControl('document', generateFormFromMetadata(ApiDocument.formMetadata(), evidenceTypeValue.document));
      });
    });
  }

  // Create form control for use in activity proofs list manager
  public static ApiActivityProofCreateEmptyObject(): ApiActivityProof {
    const obj = ApiActivityProof.formMetadata();
    return defaultEmptyObject(obj) as ApiActivityProof;
  }

  public static ApiActivityProofEmptyObjectFormFactory(): () => UntypedFormControl {
    return () => {
      return new UntypedFormControl(StockProcessingOrderDetailsHelper.ApiActivityProofCreateEmptyObject(),
        ApiActivityProofValidationScheme.validators);
    };
  }
}
