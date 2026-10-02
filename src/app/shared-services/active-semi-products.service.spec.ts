import { of } from 'rxjs';
import { ApiSemiProduct } from '../../api/model/apiSemiProduct';
import { SemiProductControllerService } from '../../api/api/semiProductController.service';
import { ActiveSemiProductsService } from './active-semi-products.service';
import { CodebookTranslations } from './codebook-translations';

describe('ActiveSemiProductsService', () => {
  let codebookService: any;
  let service: ActiveSemiProductsService;

  const semiProducts: ApiSemiProduct[] = [
    { id: 1, name: 'Washed coffee', measurementUnitType: { id: 1, label: 'kg', code: 'KG' } },
    { id: 2, name: 'Cocoa beans', measurementUnitType: { id: 2, label: 'bag', code: 'BAG' } }
  ];

  beforeEach(() => {
    codebookService = jasmine.createSpyObj('SemiProductControllerService', ['getSemiProductListByMap']);
    codebookService.getSemiProductListByMap.and.returnValue(of({
      data: { items: semiProducts, count: semiProducts.length }
    }));
    service = new ActiveSemiProductsService(
      codebookService as SemiProductControllerService,
      new CodebookTranslations()
    );
  });

  it('filters semi-products by the displayed text, ignoring case', () => {
    service.makeQuery('COFFEE').subscribe(result => {
      expect(result.results).toEqual([semiProducts[0]]);
      expect(result.totalCount).toBe(1);
    });

    expect(codebookService.getSemiProductListByMap).toHaveBeenCalledWith({ limit: 1000, offset: 0 });
  });

  it('returns all semi-products when the search is empty', () => {
    service.makeQuery('').subscribe(result => {
      expect(result.results).toEqual(semiProducts);
      expect(result.totalCount).toBe(2);
    });
  });
});
