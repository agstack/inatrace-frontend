import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormArray, UntypedFormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import { generateFormFromMetadata } from 'src/shared/utils';
import { take } from 'rxjs/operators';
import { ApiTransaction } from '../../../../api/model/apiTransaction';
import { TransactionControllerService } from '../../../../api/api/transactionController.service';

@Component({
    selector: 'app-reject-transaction-modal',
    templateUrl: './approve-reject-transaction-modal.component.html',
    styleUrls: ['./approve-reject-transaction-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ApproveRejectTransactionModalComponent implements OnInit {

  @Input()
  title = null;

  @Input()
  instructionsHtml = null;

  @Input()
  stockOrderId = null;

  transactions;
  faCheck = faCheck;
  faTimes = faTimes;

  approveRejectForm: UntypedFormArray = new UntypedFormArray([]);

  constructor(
    public activeModal: NgbActiveModal,
    private transactionController: TransactionControllerService
  ) { }

  ngOnInit(): void {
    this.prepare().then();
  }

  async prepare() {

    const resp = await this.transactionController.getStockOrderInputTransactions(this.stockOrderId).pipe(take(1)).toPromise();
    if (resp && resp.status === 'OK' && resp.data) {
      for (const item of resp.data.items) {
        if (item.status === 'PENDING') {
          const form = generateFormFromMetadata(ApiTransaction.formMetadata(), item);
          form.addControl('approved', new UntypedFormControl(true));
          this.approveRejectForm.push(form);
        }
      }
    }
  }

  cancel() {
    this.activeModal.close();
  }

  async onConfirm() {

    if (!this.checkValidity) {
      return;
    }

    for (const item of this.approveRejectForm.controls) {
      if (item.value.rejectComment) {
        await this.transactionController
          .rejectTransaction(item.value.id, { id: item.value.id, rejectComment: item.value.rejectComment })
          .pipe(take(1)).toPromise();
      } else {
       await this.transactionController.approveTransaction(item.value.id).pipe(take(1)).toPromise();
      }
    }
    this.activeModal.close({confirmed: true});
  }

  rejectTransaction(tx) {
    tx.get('approved').setValue(false);
  }

  approveTransaction(tx) {
    tx.get('approved').setValue(true);
    tx.get('rejectComment').setValue(null);
  }

  setColor(item) {
    if (item.value.approved) {
      return 'approved';
    }
    return 'del-icon';
  }

  get checkValidity() {
    for (const item of this.approveRejectForm.controls) {
      if (item.value.approved != null && !item.value.approved && !item.value.rejectComment) {
        return false;
      }
    }

    return this.approveRejectForm.controls.length !== 0;
  }

}
