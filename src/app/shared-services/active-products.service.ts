import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PagedSearchResults } from 'src/interfaces/CodebookHelperService';
import { GeneralSifrantService } from './general-sifrant.service';
import { ListProducts, ProductControllerService } from 'src/api/api/productController.service';
import { ApiProductListResponse } from 'src/api/model/apiProductListResponse';
import { ApiPaginatedResponseApiProductListResponse } from 'src/api/model/apiPaginatedResponseApiProductListResponse';

@Injectable({
  providedIn: 'root'
})
export class ActiveProductsService extends GeneralSifrantService<ApiProductListResponse> {

  constructor(
    private producController: ProductControllerService
  ) {
    super();
  }

  public identifier(el: ApiProductListResponse) {
    return el.id;
  }

  public textRepresentation(el: ApiProductListResponse) {
    return `${el.name}`
  }

  requestParams = {
    statuses: null,
    requestType: 'FETCH',
    limit: 1000,
    offset: 0,
    status: 'ACTIVE',
  } as ListProducts.PartialParamMap;

  public makeQuery(key: string, params?: any): Observable<PagedSearchResults<ApiProductListResponse>> {
    // console.log("MAKE Q")
    const limit = params && params.limit ? params.limit : this.limit()

    const reqPars = {
      ...this.requestParams,
      name: key
    }
    const tmp = this.producController.listProductsByMap(reqPars).pipe(
      map((res: ApiPaginatedResponseApiProductListResponse) => {
        return {
          results: res.data.items,
          offset: 0,
          limit: limit,
          totalCount: res.data.count
        }
      })
    )
    return tmp;
  }

  public placeholder(): string {
    const placeholder = $localize`:@@activeProducts.input.placehoder:Type product name ...`
    return placeholder
  }

}

