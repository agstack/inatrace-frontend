import { Component, Input, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { take } from 'rxjs/operators';
import { ProductControllerService } from '../../../../api/api/productController.service';
import { defaultEmptyObject, generateFormFromMetadata } from '../../../../shared/utils';
import { ApiSemiProductValidationScheme } from '../../../settings/type-detail-modal/validation';
import { ApiFinalProduct } from '../../../../api/model/apiFinalProduct';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ActiveMeasureUnitTypeService } from '../../../shared-services/active-measure-unit-types.service';
import { ApiProductLabelBase } from '../../../../api/model/apiProductLabelBase';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import ProductLabelsService from '../../../shared-services/product-labels.service';

@Component({
    selector: 'app-final-product-detail-modal',
    templateUrl: './final-product-detail-modal.component.html',
    styleUrls: ['./final-product-detail-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FinalProductDetailModalComponent implements OnInit {

  faTimes = faTimes;

  @Input()
  productId: number;

  @Input()
  isUpdate: boolean;

  @Input()
  finalProductId: number;

  @Output()
  saveCallback: () => string;

  title: string;
  submitted = false;
  form: UntypedFormGroup;

  productLabelForm = new UntypedFormControl(null);

  productLabels: Array<ApiProductLabelBase> = [];
  productLabelsCodebook: ProductLabelsService;

  constructor(
      public activeModal: NgbActiveModal,
      private productControllerService: ProductControllerService,
      public activeMeasureUnitTypeService: ActiveMeasureUnitTypeService
  ) { }

  ngOnInit(): void {
    this.productLabelsCodebook = new ProductLabelsService(this.productControllerService, this.productId);
    this.init().then();
  }

  async init() {

    this.title = (this.isUpdate)
        ? $localize`:@@productLabelFinalProduct.modal.title.update:Edit final product`
        : $localize`:@@productLabelFinalProduct.modal.title.new:Add new final products`;

    let finalProduct: ApiFinalProduct;
    if (this.isUpdate) {
      const resp = await this.productControllerService.getFinalProduct(this.productId, this.finalProductId)
        .pipe(take(1))
        .toPromise();
      if (resp && resp.status === 'OK' && resp.data) {
        finalProduct = resp.data;
        this.productLabels = [...finalProduct.labels];
      } else {
        return;
      }
    }

    this.form = generateFormFromMetadata(
        ApiFinalProduct.formMetadata(),
        this.isUpdate
            ? finalProduct
            : defaultEmptyObject(ApiFinalProduct.formMetadata()) as ApiFinalProduct,
        ApiSemiProductValidationScheme
    );
  }

  async addSelectedProductLabel(productLabel: ApiProductLabelBase) {
    if (!productLabel || this.productLabels.some(pl => pl.id === productLabel.id)) {
      setTimeout(() => this.productLabelForm.setValue(null));
      return;
    }

    this.productLabels.push(productLabel);
    setTimeout(() => this.productLabelForm.setValue(null));
  }

  removeSelectedProductLabel(idx: number) {
    this.productLabels.splice(idx, 1);
  }

  async save() {

    this.submitted = true;
    if (this.form.invalid) {
      return;
    }

    const finalProduct: ApiFinalProduct = this.form.value;
    finalProduct.labels = [...this.productLabels];

    const res = await this.productControllerService.createOrUpdateFinalProduct(this.productId, finalProduct)
        .pipe(take(1))
        .toPromise();

    if (res && res.status === 'OK') {
      if (this.saveCallback) {
        this.saveCallback();
      }
      this.dismiss();
    }
  }

  dismiss() {
    this.activeModal.dismiss();
  }

}
