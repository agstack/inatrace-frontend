import { of } from 'rxjs';
import { ActiveMeasureUnitTypeService } from './active-measure-unit-types.service';
import { ApiMeasureUnitType } from '../../api/model/apiMeasureUnitType';

describe('ActiveMeasureUnitTypeService', () => {

  const createService = () => {
    const codebookService = { getMeasureUnitTypeListByMap: () => of({ data: { items: [], count: 0 } }) } as any;
    const translations = { translate: (el: any, field: string) => el[field] } as any;
    return new ActiveMeasureUnitTypeService(codebookService, translations);
  };

  it('shows the code next to the label so equal labels can be told apart', () => {
    const service = createService();
    const unit = { id: 2, label: 'kg', code: 'WEIGHT_KG' } as ApiMeasureUnitType;

    expect(service.textRepresentation(unit)).toBe('kg (WEIGHT_KG)');
  });

  it('keeps the label when there is no code', () => {
    const service = createService();
    const unit = { id: 2, label: 'kg' } as ApiMeasureUnitType;

    expect(service.textRepresentation(unit)).toBe('kg');
  });
});
