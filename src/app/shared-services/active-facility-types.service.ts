import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PagedSearchResults } from 'src/interfaces/CodebookHelperService';
import { CodebookTranslations } from './codebook-translations';
import { GeneralSifrantService } from './general-sifrant.service';
import { ApiFacilityType } from '../../api/model/apiFacilityType';
import { FacilityTypeControllerService, GetFacilityTypeList } from '../../api/api/facilityTypeController.service';
import { ApiPaginatedResponseApiFacilityType } from '../../api/model/apiPaginatedResponseApiFacilityType';

@Injectable({
  providedIn: 'root'
})
export class ActiveFacilityTypeService extends GeneralSifrantService<ApiFacilityType> {

  constructor(
    private codebookService: FacilityTypeControllerService,
    protected codebookTranslations: CodebookTranslations
  ) {
    super();
  }

  requestParams = {
    limit: 1000,
    offset: 0,
  } as GetFacilityTypeList.PartialParamMap;

  public identifier(el: ApiFacilityType) {
    return el.id;
  }

  public textRepresentation(el: ApiFacilityType) {
    return this.codebookTranslations.translate(el, 'label');
  }

  public makeQuery(key: string, params?: any): Observable<PagedSearchResults<ApiFacilityType>> {
    const limit = params && params.limit ? params.limit : this.limit();
    const lkey = key ? key.toLocaleLowerCase() : null;

    const reqPars = {
      ...this.requestParams
    };

    return this.codebookService.getFacilityTypeListByMap(reqPars).pipe(
        map((res: ApiPaginatedResponseApiFacilityType) => {
          const results = res.data.items.filter((item: ApiFacilityType) =>
            lkey == null || this.textRepresentation(item).toLocaleLowerCase().indexOf(lkey) >= 0
          );

          return {
            results,
            offset: 0,
            limit,
            totalCount: results.length
          };
        })
    );
  }

  public placeholder(): string {
    return $localize`:@@activeFacilityTypes.input.placehoder:Select facility type`;
  }

}
