import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PagedSearchResults } from 'src/interfaces/CodebookHelperService';
import { GeneralSifrantService } from './general-sifrant.service';
import { CodebookTranslations } from './codebook-translations';
import {
  GetMeasureUnitTypeList,
  MeasureUnitTypeControllerService
} from '../../api/api/measureUnitTypeController.service';
import { ApiPaginatedResponseApiMeasureUnitType } from '../../api/model/apiPaginatedResponseApiMeasureUnitType';
import { ApiMeasureUnitType } from '../../api/model/apiMeasureUnitType';

@Injectable({
  providedIn: 'root'
})
export class ActiveMeasureUnitTypeService extends GeneralSifrantService<ApiMeasureUnitType> {

  constructor(
    private codebookService: MeasureUnitTypeControllerService,
    protected codebookTranslations: CodebookTranslations
  ) {
    super();
  }

  requestParams = {
    limit: 1000,
    offset: 0,
  } as GetMeasureUnitTypeList.PartialParamMap;

  public identifier(el: ApiMeasureUnitType) {
    return el.id;
  }

  public textRepresentation(el: ApiMeasureUnitType) {
    const label = this.codebookTranslations.translate(el, 'label');
    // More than one measure unit can share the same label (for example WEIGHT_KG and KG_COFFEE
    // are both "kg"), so show the code as well to keep the options distinguishable.
    return el.code ? `${label} (${el.code})` : label;
  }

  public makeQuery(key: string, params?: any): Observable<PagedSearchResults<ApiMeasureUnitType>> {
    const limit = params && params.limit ? params.limit : this.limit();

    const reqPars = {
      ...this.requestParams
    };

    return this.codebookService.getMeasureUnitTypeListByMap(reqPars).pipe(
        map((res: ApiPaginatedResponseApiMeasureUnitType) => {
          return {
            results: res.data.items,
            offset: 0,
            limit,
            totalCount: res.data.count
          };
        })
    );
  }

  public placeholder(): string {
    return $localize`:@@activeMeasureUnitTypes.input.placehoder:Select measure unit type`;
  }

}
