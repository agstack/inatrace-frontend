import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { NgbModalImproved } from '../../../core/ngb-modal-improved/ngb-modal-improved.service';
import { ActivatedRoute } from '@angular/router';
import { FinalProductDetailModalComponent } from '../final-product-detail-modal/final-product-detail-modal.component';
import { ProductControllerService } from '../../../../api/api/productController.service';
import { take } from 'rxjs/operators';
import { ApiProductCompany } from '../../../../api/model/apiProductCompany';
import { SelectedUserCompanyService } from '../../../core/selected-user-company.service';

@Component({
    selector: 'app-final-product',
    templateUrl: './final-product.component.html',
    styleUrls: ['./final-product.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FinalProductComponent implements OnInit {

  title = $localize`:@@productLabelFinalProduct.title.finalProducts:Final products`;

  listReload: boolean;
  productId: number;
  allFinalProducts = 0;
  showedFinalProducts = 0;

  companyId: number;
  isProductAdmin = false;

  constructor(
      private route: ActivatedRoute,
      private modalService: NgbModalImproved,
      private productController: ProductControllerService,
      private selUserCompanyService: SelectedUserCompanyService
  ) { }

  async ngOnInit(): Promise<void> {

    this.productId = this.route.snapshot.params.id;
    this.companyId = (await this.selUserCompanyService.selectedCompanyProfile$.pipe(take(1)).toPromise())?.id;

    this.productController.getProduct(this.productId).pipe(take(1)).subscribe(product => {
      if (product && product.data) {
        this.isProductAdmin = product.data.associatedCompanies.some(value => value.type === ApiProductCompany.TypeEnum.OWNER && value.company.id === this.companyId);
      }
    });
  }

  newFinalProduct(){
    this.modalService.open(FinalProductDetailModalComponent, {
      centered: true
    }, {
      productId: this.productId,
      isUpdate: false,
      finalProductId: null,
      saveCallback: () => {
        // Trigger 'ngOnChanges' in list component to reload the list
        this.listReload = !this.listReload;
      }
    });
  }

  onShowFinalProducts(event) {
    this.showedFinalProducts = event;
  }

  onCountAllFinalProducts(event) {
    this.allFinalProducts = event;
  }

}
