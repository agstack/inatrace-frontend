import { Observable } from 'rxjs';
import { PagedSearchResults } from '../../interfaces/CodebookHelperService';
import { map } from 'rxjs/operators';
import { GeneralSifrantService } from './general-sifrant.service';
import { CodebookTranslations } from './codebook-translations';
import {
  GetProcessingEvidenceFieldList,
  ProcessingEvidenceFieldControllerService
} from '../../api/api/processingEvidenceFieldController.service';
import { ApiPaginatedResponseApiProcessingEvidenceField } from '../../api/model/apiPaginatedResponseApiProcessingEvidenceField';
import { ApiProcessingEvidenceField } from '../../api/model/apiProcessingEvidenceField';

export class ProcessingEvidenceFieldsService extends GeneralSifrantService<ApiProcessingEvidenceField>{

  constructor(
      private codebookService: ProcessingEvidenceFieldControllerService,
      protected codebookTranslations: CodebookTranslations,
      private valueChainIdList?: number[]
  ) {
    super();
  }

  requestParams = {
    limit: 1000,
    offset: 0,
  } as GetProcessingEvidenceFieldList.PartialParamMap;

  public identifier(el: ApiProcessingEvidenceField) {
    return el.id;
  }

  public textRepresentation(el: ApiProcessingEvidenceField) {
    return this.codebookTranslations.translate(el, 'label');
  }

  public makeQuery(key: string, params?: any, productId?: string): Observable<PagedSearchResults<ApiProcessingEvidenceField>> {
    const limit = params && params.limit ? params.limit : this.limit();
    const reqPars = {
      productId,
      ...this.requestParams
    };

    const lkey = key ? key.toLocaleLowerCase() : null;
    return this.fetchProcessingEvidenceFields(reqPars, this.valueChainIdList).pipe(
        map((res: ApiPaginatedResponseApiProcessingEvidenceField) => {
          const results = res.data.items;

          return {
            results: results.filter((x: ApiProcessingEvidenceField) => lkey == null || x.label.toLocaleLowerCase().indexOf(lkey) >= 0),
            offset: 0,
            limit,
            totalCount: results.length,
          };
        })
    );
  }

  public placeholder(): string {
    return $localize`:@@processingEvidenceField.input.placeholder:Select evidence field`;
  }

  private fetchProcessingEvidenceFields(reqParams, valueChainIdList?: number[]): Observable<ApiPaginatedResponseApiProcessingEvidenceField> {
    if (valueChainIdList !== null && valueChainIdList !== undefined) {
      return this.codebookService.listProcessingEvidenceFieldsByValueChainsByMap({ valueChainIds: valueChainIdList, ...reqParams });
    } else {
      return this.codebookService.getProcessingEvidenceFieldListByMap(reqParams);
    }
  }

}
