import { GeneralSifrantService } from './general-sifrant.service';
import { ApiSemiProduct } from '../../api/model/apiSemiProduct';
import {
  GetSemiProductListByValueChains,
  SemiProductControllerService
} from '../../api/api/semiProductController.service';
import { CodebookTranslations } from './codebook-translations';
import { PagedSearchResults } from '../../interfaces/CodebookHelperService';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiPaginatedResponseApiSemiProduct } from '../../api/model/apiPaginatedResponseApiSemiProduct';

export class SemiProductsForValueChainsService extends GeneralSifrantService<ApiSemiProduct> {

  constructor(
    private codebookService: SemiProductControllerService,
    private codebookTranslations: CodebookTranslations,

    private valueChainIdList?: number[]
  ) {
    super();
  }

  requestParams = {
    limit: 1000,
    offset: 0
  } as GetSemiProductListByValueChains.PartialParamMap;

  public identifier(el: ApiSemiProduct) {
    return el.id;
  }

  public textRepresentation(el: ApiSemiProduct): string {
    return this.codebookTranslations.translate(el, 'name');
  }

  makeQuery(key: string, params?: any): Observable<PagedSearchResults<ApiSemiProduct>> {
    const limit = params && params.limit ? params.limit : this.limit();

    return this.codebookService.getSemiProductListByValueChainsByMap({valueChainIds: this.valueChainIdList, ...this.requestParams}).pipe(
      map((res: ApiPaginatedResponseApiSemiProduct) => {
        return {
          results: res.data.items,
          offset: 0,
          limit,
          totalCount: res.data.count,
        };
      })
    );
  }

  public placeholder(): string {
    return $localize`:@@semiProductForValueChains.input.placehoder:Select semi-product`;
  }

}
