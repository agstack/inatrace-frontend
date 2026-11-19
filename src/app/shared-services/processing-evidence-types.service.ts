import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PagedSearchResults } from 'src/interfaces/CodebookHelperService';
import { GeneralSifrantService } from './general-sifrant.service';
import { CodebookTranslations } from './codebook-translations';
import { ApiProcessingEvidenceType } from '../../api/model/apiProcessingEvidenceType';
import {
  GetProcessingEvidenceTypeList,
  ProcessingEvidenceTypeControllerService
} from '../../api/api/processingEvidenceTypeController.service';
import { ApiPaginatedResponseApiProcessingEvidenceType } from '../../api/model/apiPaginatedResponseApiProcessingEvidenceType';

export class ProcessingEvidenceTypeService extends GeneralSifrantService<ApiProcessingEvidenceType> {

  constructor(
    private codebookService: ProcessingEvidenceTypeControllerService,
    protected codebookTranslations: CodebookTranslations,
    private type: string,
    private valueChainIdList?: number[]
  ) {
    super();
  }

  requestParams = {
    limit: 1000,
    offset: 0,
  } as GetProcessingEvidenceTypeList.PartialParamMap;

  public identifier(el: ApiProcessingEvidenceType) {
    return el.id;
  }

  public textRepresentation(el: ApiProcessingEvidenceType) {
    return this.codebookTranslations.translate(el, 'label');
  }

  public makeQuery(key: string, params?: any, productId?: string): Observable<PagedSearchResults<ApiProcessingEvidenceType>> {
    const limit = params && params.limit ? params.limit : this.limit();
    const reqPars: GetProcessingEvidenceTypeList.PartialParamMap = {
      ...this.requestParams
    };

    const lkey = key ? key.toLocaleLowerCase() : null;
    return this.fetchProcessingEvidenceTypes(reqPars, this.valueChainIdList).pipe(
        map((res: ApiPaginatedResponseApiProcessingEvidenceType) => {
          let results = res.data.items;
          if (this.type) {
            results = res.data.items.filter(c => c.type === this.type);
          }

          return {
            results: results.filter((x: ApiProcessingEvidenceType) => lkey == null || x.label.toLocaleLowerCase().indexOf(lkey) >= 0),
            offset: 0,
            limit,
            totalCount: results.length,
          };
        })
    );
  }

  public placeholder(): string {
    return $localize`:@@processingEvidenceType.input.placehoder:Select document type`;
  }

  private fetchProcessingEvidenceTypes(reqParams, valueChainIdList?: number[]): Observable<ApiPaginatedResponseApiProcessingEvidenceType> {
    if (valueChainIdList !== null && valueChainIdList !== undefined) {
      return this.codebookService.listProcessingEvidenceTypesByValueChainsByMap({ valueChainIds: valueChainIdList, ...reqParams });
    } else {
      return this.codebookService.getProcessingEvidenceTypeListByMap(reqParams);
    }
  }

}
