import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { GeneralCodesService } from './general-codes.service';
import { PagedSearchResults } from 'src/interfaces/CodebookHelperService';
import { generateFormFromMetadata, formAssign } from 'src/shared/utils';
import { Observable } from 'rxjs';
import { UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { ApiCountry } from 'src/api/model/apiCountry';
import { CommonControllerService } from 'src/api/api/commonController.service';

@Injectable({
  providedIn: 'root'
})
export class CountryService extends GeneralCodesService<ApiCountry> {

  constructor(
    protected commonController: CommonControllerService
  ) {
    super();
    this.initializeCodebook()
  }

  public identifier(el: ApiCountry) {
    return el.id;
  }

  public textRepresentation(el: ApiCountry) {
    return el.name;
  }

  public formGenerator() {
    return (el: ApiCountry) => generateFormFromMetadata(ApiCountry.formMetadata(), el);
    // return ApiCountry.formGenerator
  }

  public addElement(arr: UntypedFormArray, el: ApiCountry): void {
    arr.push(this.formGenerator()(el) as UntypedFormGroup);
    arr.markAsDirty()
  }

  public makeQuery(key: string, params?: any): Observable<PagedSearchResults<ApiCountry>> {
    let lkey = key ? key.toLocaleLowerCase() : null
    return this.sifrant$.pipe(
      map((allChoices: PagedSearchResults<ApiCountry>) => {
        return {
          results: allChoices.results.filter((x: ApiCountry) => lkey == null || x.name.toLocaleLowerCase().indexOf(lkey) >= 0),
          offset: allChoices.offset,
          limit: allChoices.limit,
          totalCount: allChoices.totalCount
        }
      })
    )
  }

  public initializeCodebook() {
    this.sifrant$ = this.sifrant$ || this.commonController.getCountries(null,"FETCH", 500, null, null, "ASC").pipe(
      map(x => this.pack(x.data.items))
    )
  }


}
