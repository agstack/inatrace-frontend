import { GeneralSifrantService } from './general-sifrant.service';
import { ApiProductLabelBase } from '../../api/model/apiProductLabelBase';
import { ProductControllerService } from '../../api/api/productController.service';
import { Observable } from 'rxjs';
import { PagedSearchResults } from '../../interfaces/CodebookHelperService';
import { map } from 'rxjs/operators';
import { ApiResponseListApiProductLabelBase } from '../../api/model/apiResponseListApiProductLabelBase';

export default class ProductLabelsService extends GeneralSifrantService<ApiProductLabelBase> {

  constructor(
    private productController: ProductControllerService,
    private productId: number
  ) {
    super();
  }

  readonly unpublishedTranslations = $localize`:@@productLabelFinalProduct.modal.singleChoice.productLabels.status.unpublished:Unpublished`;

  public identifier(el: ApiProductLabelBase) {
    return el.id;
  }

  public textRepresentation(el: ApiProductLabelBase) {
    return `${el.title} ${el.status === 'UNPUBLISHED' ? '(' + this.unpublishedTranslations + ')' : ''}`;
  }

  makeQuery(key: string, params?: any): Observable<PagedSearchResults<ApiProductLabelBase>> {

    return this.productController.getProductLabels(this.productId)
      .pipe(
        map((res: ApiResponseListApiProductLabelBase) => {
          return {
            results: res.data,
            offset: 0,
            limit: this.limit(),
            totalCount: res.data.length
          };
        })
      );
  }
}
