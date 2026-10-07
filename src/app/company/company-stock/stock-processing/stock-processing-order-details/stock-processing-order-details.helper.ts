import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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

  public static setFormControlValidators(formGroup: FormGroup, formControlName: string, validators: ValidatorFn[]) {
    formGroup.get(formControlName).setValidators(validators);
    formGroup.get(formControlName).updateValueAndValidity();
  }

  public static async setRequiredProcessingEvidence(action: ApiProcessingAction, requiredProcessingEvidenceArray: FormArray) {

    requiredProcessingEvidenceArray.clear();

    if (action && action.requiredDocumentTypes && action.requiredDocumentTypes.length > 0) {

      for (const requiredDocumentType of action.requiredDocumentTypes) {
        requiredProcessingEvidenceArray.push(new FormGroup({
          evidenceTypeId: new FormControl(requiredDocumentType.id),
          evidenceTypeCode: new FormControl(requiredDocumentType.code),
          evidenceTypeLabel: new FormControl({ value: requiredDocumentType.label, disabled: true }),
          date: new FormControl(new Date(), requiredDocumentType.mandatory ? Validators.required : null),
          document: new FormControl(null, requiredDocumentType.mandatory ? Validators.required : null)
        }));
      }

    } else {
      requiredProcessingEvidenceArray.clear();
    }
  }

  public static prepareRequiredEvidenceTypeValues(requiredProcessingEvidenceArray: FormArray): ApiStockOrderEvidenceTypeValue[] {

    const evidenceTypesValues: ApiStockOrderEvidenceTypeValue[] = [];

    for (const control of requiredProcessingEvidenceArray.controls) {
      const controlValue: ApiStockOrderEvidenceTypeValue = control.value;
      if (controlValue && controlValue.document && controlValue.document.id) {
        evidenceTypesValues.push(controlValue);
      }
    }

    return evidenceTypesValues;
  }

  public static prepareOtherEvidenceDocuments(otherProcessingEvidenceArray: FormArray): ApiStockOrderEvidenceTypeValue[] {

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

  public static loadExistingOtherEvidenceDocuments(firstTSO: FormGroup, otherProcessingEvidenceArray: FormArray) {

    ((firstTSO.get('otherEvidenceDocuments') as FormArray).value as ApiStockOrderEvidenceTypeValue[]).forEach(evidenceTypeValue => {
      otherProcessingEvidenceArray.push(new FormGroup({
        formalCreationDate: new FormControl(evidenceTypeValue.date),
        document: new FormControl(evidenceTypeValue.document),
        type: new FormGroup({
          id: new FormControl(evidenceTypeValue.evidenceTypeId),
          code: new FormControl(evidenceTypeValue.evidenceTypeCode),
          label: new FormControl(evidenceTypeValue.evidenceTypeLabel)
        })
      }));
    });
  }

  public static loadExistingRequiredEvidenceDocuments(firstTSO: FormGroup, requiredProcessingEvidenceArray: FormArray) {

    ((firstTSO.get('requiredEvidenceTypeValues') as FormArray).value as ApiStockOrderEvidenceTypeValue[]).forEach(evidenceTypeValue => {
      const evidenceTypeControl = requiredProcessingEvidenceArray.controls
        .find(control => control.get('evidenceTypeId').value === evidenceTypeValue.evidenceTypeId) as FormGroup;
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

  public static ApiActivityProofEmptyObjectFormFactory(): () => FormControl {
    return () => {
      return new FormControl(StockProcessingOrderDetailsHelper.ApiActivityProofCreateEmptyObject(),
        ApiActivityProofValidationScheme.validators);
    };
  }
}
