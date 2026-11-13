import { SimpleValidationScheme } from 'src/interfaces/Validation';
import { ApiProductLabelBatch } from 'src/api/model/apiProductLabelBatch';
import { Validators, UntypedFormGroup, ValidationErrors } from '@angular/forms';
import { multiFieldValidator } from 'src/shared/validation';
import {dateISOString} from '../../../../shared/utils';


function expiryDateBeforeProductionDate(control: UntypedFormGroup): ValidationErrors | null {
  let productionDate = control.value && control.value['productionDate'];
  if (!productionDate) return null
  let expiryDate = control.value && control.value['expiryDate'];
  if (!expiryDate) return null
  productionDate = dateISOString(productionDate)
  expiryDate = dateISOString(expiryDate)
  return expiryDate < productionDate
      ? { endBeforeStart: true }
      : null
}

function atLeastOneDate(control: UntypedFormGroup): ValidationErrors | null {
  if (control.value && (control.value['checkAuthenticity'] == null || !control.value['checkAuthenticity'])) return null;
  const productionDate = control.value && control.value['productionDate'];
  const expiryDate = control.value && control.value['expiryDate'];
  return productionDate == null && expiryDate == null
    ? { atLeastOneDate: true }
    : null
}


  export const ApiProductLabelBatchValidationScheme = {
      validators: [
      multiFieldValidator(['expiryDate'], expiryDateBeforeProductionDate, ['endBeforeStart']),
      multiFieldValidator(['productionDate', 'expiryDate'], atLeastOneDate, ['atLeastOneDate'])
      ],
      fields: {
                checkAuthenticity: {
                    validators: []
                },
                expiryDate: {
                    validators: []
                },
                id: {
                    validators: []
                },
                labelId: {
                    validators: []
                },
                locations: {
                    validators: []
                },
                number: {
                    validators: [Validators.required]
                },
                photo: {
                    validators: []
                },
                productionDate: {
                    validators: []
                },
                traceOrigin: {
                    validators: []
                },
      }
  } as SimpleValidationScheme<ApiProductLabelBatch>;
