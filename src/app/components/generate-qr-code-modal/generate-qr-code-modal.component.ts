import { Component, Input, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductControllerService } from 'src/api/api/productController.service';
import { environment } from 'src/environments/environment';
import { UntypedFormControl } from '@angular/forms';
import { FinalProductLabelsService } from '../../shared-services/final-product-labels.service';
import { ApiFinalProduct } from '../../../api/model/apiFinalProduct';
import { Subscription } from 'rxjs';
import { ApiProductLabelBase } from '../../../api/model/apiProductLabelBase';

@Component({
    selector: 'app-generate-qr-code-modal',
    templateUrl: './generate-qr-code-modal.component.html',
    styleUrls: ['./generate-qr-code-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class GenerateQRCodeModalComponent implements OnInit, OnDestroy {

  @Input()
  qrCodeTag: string;

  @Input()
  qrCodeFinalProduct: ApiFinalProduct;

  title = $localize`:@@generateQRCode.title.orderItemQRCode:Order item QR code`;

  qrCodeSize = 200;
  qrCodeString: string = null;

  finalProductNameForm = new UntypedFormControl({ value: null, disabled: true });
  finalProductLabelForm = new UntypedFormControl(null);
  finalProductLabelsCodebook: FinalProductLabelsService;

  finalProdLabelSubs: Subscription;
  labelsCodebookSubs: Subscription;

  constructor(
    public activeModal: NgbActiveModal,
    private productController: ProductControllerService
  ) { }

  ngOnInit(): void {

    this.finalProductLabelsCodebook = new FinalProductLabelsService(this.qrCodeFinalProduct.product.id, this.qrCodeFinalProduct.id, this.productController);
    this.finalProductNameForm.setValue(`${this.qrCodeFinalProduct.name} (${this.qrCodeFinalProduct.product.name})`);

    // If only one label is present, set it as selected value
    this.labelsCodebookSubs = this.finalProductLabelsCodebook.getAllCandidates().subscribe(labels => {
      if (labels && labels.length === 1) {
        this.finalProductLabelForm.setValue(labels[0]);
      }
    });

    // When the selected Final product label changes, update the QR code string
    this.finalProdLabelSubs = this.finalProductLabelForm.valueChanges.subscribe((label: ApiProductLabelBase) => {
      if (label && this.qrCodeTag) {
        this.qrCodeString = `${environment.appBaseUrl}/${label.language.toLowerCase()}/${environment.qrCodeBasePath}/${label.uuid}/${this.qrCodeTag}`;
      } else {
        this.qrCodeString = null;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.finalProdLabelSubs) {
      this.finalProdLabelSubs.unsubscribe();
    }
    if (this.labelsCodebookSubs) {
      this.labelsCodebookSubs.unsubscribe();
    }
  }

  cancel() {
    this.activeModal.close();
  }

  copyToClipboard() {
    document.execCommand('copy');
  }
}
