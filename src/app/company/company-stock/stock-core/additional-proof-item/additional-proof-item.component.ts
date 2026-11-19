import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { UntypedFormGroup } from '@angular/forms';
import {dateISOString, generateFormFromMetadata} from 'src/shared/utils';
import { ApiActivityProofValidationScheme } from './validation';
import { EnumSifrant } from 'src/app/shared-services/enum-sifrant';
import { GenericEditableItemComponent } from 'src/app/shared/generic-editable-item/generic-editable-item.component';
import { ImageViewerComponent } from 'src/app/shared/image-viewer/image-viewer.component';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { NgbModalImproved } from 'src/app/core/ngb-modal-improved/ngb-modal-improved.service';
import { ApiActivityProof } from '../../../../../api/model/apiActivityProof';
import { ProcessingEvidenceTypeService } from '../../../../shared-services/processing-evidence-types.service';
import { CodebookTranslations } from '../../../../shared-services/codebook-translations';
import { ProcessingEvidenceTypeControllerService } from '../../../../../api/api/processingEvidenceTypeController.service';

@Component({
    selector: 'app-additional-proof-item',
    templateUrl: './additional-proof-item.component.html',
    styleUrls: ['./additional-proof-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AdditionalProofItemComponent extends GenericEditableItemComponent<ApiActivityProof> implements OnInit {

  constructor(
    protected globalEventsManager: GlobalEventManagerService,
    protected router: Router,
    private modalService: NgbModalImproved,
    private codebookTranslations: CodebookTranslations,
    private procEvidenceTypeController: ProcessingEvidenceTypeControllerService
  ) {
    super(globalEventsManager);
  }

  @Input()
  disableDelete = false;

  @Input()
  formTitle = null;

  @Input()
  evidenceType = false;

  codebookAdditionalProofs;

  get addProofs() {
    const obj = {};
    obj['PAYMENT_LIST'] = $localize`:@@productLabelStockPurchaseOrdersModal.addProofs.paymentList:Payment list`;
    obj['PAYMENT_ORDER_APPROVED'] = $localize`:@@productLabelStockPurchaseOrdersModal.addProofs.paymentOrderApproved:Payment order approved`;
    obj['PAYMENT_PROOF'] = $localize`:@@productLabelStockPurchaseOrdersModal.addProofs.paymentProof:Payment proof`;
    obj['PURCHASE_SHEET'] = $localize`:@@productLabelStockPurchaseOrdersModal.addProofs.purchaseSheet:Purchase sheet`;
    obj['PURCHASE_SHEET_BANK_TRANSFER'] = $localize`:@@productLabelStockPurchaseOrdersModal.addProofs.purchaseSheetBankTransfer:Purchase sheet bank transfer`;
    obj['PURCHASE_SHEET_COLLECTOR'] = $localize`:@@productLabelStockPurchaseOrdersModal.addProofs.purchaseSheetCollector:Purchase sheet collector`;
    obj['RECEIPT'] = $localize`:@@productLabelStockPurchaseOrdersModal.addProofs.receipt:Receipt`;
    obj['RECEIPT_BANK_TRANSFER'] = $localize`:@@productLabelStockPurchaseOrdersModal.addProofs.receiptBankTransfer:Receipt bank transfer`;
    obj['RECEIPT_COLLECTOR'] = $localize`:@@productLabelStockPurchaseOrdersModal.addProofs.receiptCollector:Receipt collector`;
    return obj;
  }

  get name() {

    if (this.contentObject && this.contentObject.formalCreationDate && this.contentObject.type) {
      const tmpDate = new Date(this.contentObject.formalCreationDate);
      const day = tmpDate.getDate();
      const month = tmpDate.getMonth() + 1;
      const year = tmpDate.getFullYear();

      if (this.evidenceType) {
        return this.contentObject.type.label + ' (' + day + '.' + month + '.' + year + ')';
      }
      return this.addProofs[this.contentObject.type] + ' (' + day + '.' + month + '.' + year + ')';
    }
    return '';
  }

  ngOnInit(): void {

    if (this.form.value?.id == null) {
      const today = dateISOString(new Date());
      this.form.get('formalCreationDate').setValue(today);
    }

    if (this.evidenceType) {
      this.codebookAdditionalProofs = new ProcessingEvidenceTypeService(this.procEvidenceTypeController, this.codebookTranslations, 'DOCUMENT');
    } else {
      this.codebookAdditionalProofs = EnumSifrant.fromObject(this.addProofs);
    }
  }

  public generateForm(value: any): UntypedFormGroup {
    return generateFormFromMetadata(ApiActivityProof.formMetadata(), value, ApiActivityProofValidationScheme);
  }

  viewImage() {

    if (!this.form.get('document')) { return; }

    if (this.form.get('document').value && this.form.get('document').value.contentType.startsWith('image')) {

      const modalRef = this.modalService.open(ImageViewerComponent, { centered: true });
      Object.assign(modalRef.componentInstance, {
        modal: false,
        fileInfo: this.form.get('document').value
      });
    }
  }

  isImageToShow() {
    return this.contentObject && this.contentObject.document && this.contentObject.document.storageKey && this.contentObject.document.contentType.startsWith('image');
  }

}
