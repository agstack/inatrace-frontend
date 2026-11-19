import { Injectable } from '@angular/core';
import { GeneralSifrantService } from './general-sifrant.service';
import { Observable } from 'rxjs';
import { PagedSearchResults } from 'src/interfaces/CodebookHelperService';
import { map } from 'rxjs/operators';
import { ApiProductCompany } from 'src/api/model/apiProductCompany';
import { ProductControllerService } from 'src/api/api/productController.service';

@Injectable({
  providedIn: 'root'
})
export class AssociatedCompaniesService extends GeneralSifrantService<ApiProductCompany> {

  constructor(
    private productController: ProductControllerService,
    private productId: number,
    private type: string
  ) {
    super();
    // this.initializeCodebook();
  }

  public identifier(el: ApiProductCompany) {
    return el.company.id;
  }

  public textRepresentation(el: ApiProductCompany) {
    return el && el.company && `${el.company.name}`
  }

  public makeQuery(key: string, params?: any): Observable<PagedSearchResults<ApiProductCompany>> {
    const limit = params && params.limit ? params.limit : this.limit()
    const tmp = this.productController.getProduct(this.productId).pipe(
      map(resp => {
        const data = resp.data

        /*let associatedCompanies = [];
        let buyers = [];
        let producers = [];
        let owners = [];
        let associations = [];
        let roasters = [];

        for (let c of data.associatedCompanies) {
          associatedCompanies.push(c)
          if (c.type === "BUYER") buyers.push(c);
          if (c.type === "PRODUCER") producers.push(c);
          if (c.type === "OWNER") owners.push(c);
          if (c.type === "ASSOCIATION") associations.push(c);
          if (c.type === "ROASTER") roasters.push(c);
        }

        let results = []
        if (this.type == "BUYER") {
          results = buyers;
        } else if (this.type == "PRODUCER") {
          results = producers;
        } else if (this.type == "OWNER") {
          results = owners;
        } else if (this.type == "ASSOCIATION") {
          results = associations;
        } else if (this.type == "ROASTER") {
          results = roasters;
        } else {
          results = associatedCompanies;
        }*/

        const results = data.associatedCompanies.filter(c => !this.type || c.type == this.type)

        return {
          results: results,
          offset: 0,
          limit: limit,
          totalCount: results.length
        }
      })
    )

    return tmp;
  }

  public placeholder(): string {
    const placeholder = $localize`:@@associatedCompaniesService.input.placehoder:Select client`;
    return placeholder;
  }

}

