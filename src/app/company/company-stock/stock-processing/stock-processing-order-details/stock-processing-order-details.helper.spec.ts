import { FormArray, FormControl } from '@angular/forms';
import { ApiProcessingAction } from '../../../../../api/model/apiProcessingAction';
import { ApiProcessingEvidenceField } from '../../../../../api/model/apiProcessingEvidenceField';
import { StockProcessingOrderDetailsHelper } from './stock-processing-order-details.helper';

describe('StockProcessingOrderDetailsHelper', () => {
  const action = {
    requiredEvidenceFields: [
      {id: 1, fieldName: 'moisture', type: ApiProcessingEvidenceField.TypeEnum.NUMBER},
      {id: 2, fieldName: 'brokenShare', type: ApiProcessingEvidenceField.TypeEnum.INTEGER}
    ]
  } as ApiProcessingAction;

  it('accepts empty values and zero, but rejects fractional integer values', () => {
    expect(StockProcessingOrderDetailsHelper.integerValidator(new FormControl(null))).toBeNull();
    expect(StockProcessingOrderDetailsHelper.integerValidator(new FormControl(0))).toBeNull();
    expect(StockProcessingOrderDetailsHelper.integerValidator(new FormControl(7))).toBeNull();
    expect(StockProcessingOrderDetailsHelper.integerValidator(new FormControl(7.5))).toEqual({integer: true});
  });

  it('does not throw when an older processing order has no evidence form group', () => {
    expect(StockProcessingOrderDetailsHelper.prepareRequiredEvidenceFieldValues(null, action)).toEqual([]);
  });

  it('converts browser string values to numericValue without losing decimal or zero values', () => {
    const values = StockProcessingOrderDetailsHelper.prepareRequiredEvidenceFieldValues({
      moisture: '11.75',
      brokenShare: '0'
    }, action);

    expect(values).toEqual([
      {evidenceFieldId: 1, evidenceFieldName: 'moisture', numericValue: 11.75},
      {evidenceFieldId: 2, evidenceFieldName: 'brokenShare', numericValue: 0}
    ]);
    expect(typeof values[0].numericValue).toBe('number');
    expect(typeof values[1].numericValue).toBe('number');
  });

  it('serializes independent numeric evidence payloads for each output', () => {
    const firstOutputValues = StockProcessingOrderDetailsHelper.prepareRequiredEvidenceFieldValues({
      moisture: '11.5',
      brokenShare: '0'
    }, action);
    const secondOutputValues = StockProcessingOrderDetailsHelper.prepareRequiredEvidenceFieldValues({
      moisture: '9.25',
      brokenShare: '4'
    }, action);

    expect(firstOutputValues).toEqual([
      {evidenceFieldId: 1, evidenceFieldName: 'moisture', numericValue: 11.5},
      {evidenceFieldId: 2, evidenceFieldName: 'brokenShare', numericValue: 0}
    ]);
    expect(secondOutputValues).toEqual([
      {evidenceFieldId: 1, evidenceFieldName: 'moisture', numericValue: 9.25},
      {evidenceFieldId: 2, evidenceFieldName: 'brokenShare', numericValue: 4}
    ]);
  });

  it('keeps optional document evidence optional and omits it from the payload when empty', async () => {
    const documents = new FormArray([]);
    const actionWithOptionalDocument = {
      requiredDocumentTypes: [{id: 3, code: 'QUALITY_REPORT', label: 'Quality control report', mandatory: false}]
    } as ApiProcessingAction;

    await StockProcessingOrderDetailsHelper.setRequiredProcessingEvidence(actionWithOptionalDocument, documents);

    expect(documents.at(0).get('date').valid).toBe(true);
    expect(documents.at(0).get('document').valid).toBe(true);
    expect(StockProcessingOrderDetailsHelper.prepareRequiredEvidenceTypeValues(documents)).toEqual([]);
  });
});
