import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Location } from '@angular/common';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { ActivatedRoute } from '@angular/router';
import { PaymentControllerService } from '../../../../../api/api/paymentController.service';
import { StockOrderControllerService } from '../../../../../api/api/stockOrderController.service';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { take } from 'rxjs/operators';
import { ApiBulkPayment } from '../../../../../api/model/apiBulkPayment';
import { CompanyControllerService } from '../../../../../api/api/companyController.service';
import { Subscription } from 'rxjs';
import {
  dateISOString,
  defaultEmptyObject,
  generateFormFromMetadata
} from '../../../../../shared/utils';
import {
  ApiActivityProofValidationScheme,
  ApiBulkPaymentValidationScheme,
  ApiPaymentValidationScheme,
  ApiStockOrderValidationScheme
} from './validation';
import { ApiPayment } from '../../../../../api/model/apiPayment';
import { ApiStockOrder } from '../../../../../api/model/apiStockOrder';
import { EnumSifrant } from '../../../../shared-services/enum-sifrant';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { ListEditorManager } from '../../../../shared/list-editor/list-editor-manager';
import { ApiActivityProof } from '../../../../../api/model/apiActivityProof';
import PaymentPurposeTypeEnum = ApiPayment.PaymentPurposeTypeEnum;
import PaymentTypeEnum = ApiPayment.PaymentTypeEnum;
import RecipientTypeEnum = ApiPayment.RecipientTypeEnum;
import PaymentStatusEnum = ApiPayment.PaymentStatusEnum;
import PreferredWayOfPaymentEnum = ApiPayment.PreferredWayOfPaymentEnum;
import { ApiCompanyGet } from '../../../../../api/model/apiCompanyGet';
import { SelectedUserCompanyService } from '../../../../core/selected-user-company.service';

enum BulkType {
  BONUS = 'BONUS',
  PO = 'PO'
}

@Component({
    selector: 'app-stock-payments-bulk-detail',
    templateUrl: './stock-payments-bulk-detail.component.html',
    styleUrls: ['./stock-payments-bulk-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class StockPaymentsBulkDetailComponent implements OnInit, OnDestroy {

  faTrashAlt = faTrashAlt;

  title: string;
  createdBy: string;
  currency: string;
  update: boolean;
  submitted: boolean;
  bulkPaymentUpdateInProgress: boolean;

  bulkPayment: ApiBulkPayment;
  bulkType: BulkType;

  subConditional: Subscription;
  paymentsListManager: ListEditorManager<ApiPayment>;
  additionalProofsListManager: ListEditorManager<ApiActivityProof>;

  paymentsForm: UntypedFormArray;
  purchaseItems: UntypedFormArray;
  purchaseItemsNoBankAccount: UntypedFormArray;
  bulkPaymentForm: UntypedFormGroup;
  payableToCompany: UntypedFormControl;
  payableToFarmer: UntypedFormControl;
  payableToCollector: UntypedFormControl;
  payableFromForm: UntypedFormControl;

  paymentPurposeTypesCodebook = EnumSifrant.fromObject(this.paymentPurposeTypes);

  stringWithoutUnits = {
    totalAmountLabel: $localize`:@@productLabelStockBulkPayments.textinput.amount.label:Total amount paid`,
    additionalCostsLabel: $localize`:@@productLabelStockBulkPayments.textinput.additionalCosts.label:Additional costs`,
    costLabel: $localize`:@@productLabelStockBulkPayments.textinput.origin.amount:Cost`,
    balanceLabel: $localize`:@@productLabelStockBulkPayments.textinput.origin.balance:Balance`,
    payingLabel: $localize`:@@productLabelStockBulkPayments.textinput.origin.paying:Paying`
  };

  payingCompany: ApiCompanyGet | null = null;

  static ApiActivityProofItemCreateEmptyObject(): ApiActivityProof {
    return defaultEmptyObject(ApiActivityProof.formMetadata()) as ApiActivityProof;
  }

  static ApiActivityProofItemEmptyObjectFormFactory(): () => UntypedFormControl {
    return () => {
      return new UntypedFormControl(
          this.ApiActivityProofItemCreateEmptyObject(),
          ApiActivityProofValidationScheme.validators
      );
    };
  }

  static ApiPaymentCreateEmptyObject(): ApiPayment {
    return defaultEmptyObject(ApiPayment.formMetadata()) as ApiPayment;
  }

  static ApiPaymentEmptyObjectFormFactory(): () => UntypedFormControl {
    return () => {
      return new UntypedFormControl(
          this.ApiPaymentCreateEmptyObject(),
          ApiPaymentValidationScheme.validators
      );
    };
  }

  constructor(
      private route: ActivatedRoute,
      private location: Location,
      private globalEventsManager: GlobalEventManagerService,
      private paymentControllerService: PaymentControllerService,
      private stockOrderControllerService: StockOrderControllerService,
      private selUserCompanyService: SelectedUserCompanyService
  ) { }

  async ngOnInit(): Promise<void> {

    this.payingCompany = await this.selUserCompanyService.selectedCompanyProfile$.pipe(take(1)).toPromise();

    this.initInitialData().then(
        () => {
          if (this.update) {
            this.editBulkPayment();
          } else {
            this.newBulkPayment();
          }
        }
    );
  }

  ngOnDestroy() {
    if (this.subConditional) {
      this.subConditional.unsubscribe();
    }
  }

  async initInitialData() {

    const action = this.route.snapshot.data.action;
    this.bulkType = this.route.snapshot.params.bulkType;

    this.submitted = false;
    this.bulkPaymentUpdateInProgress = false;

    this.paymentsForm = new UntypedFormArray([]);
    this.purchaseItems = new UntypedFormArray([]);
    this.purchaseItemsNoBankAccount = new UntypedFormArray([]);
    this.payableFromForm = new UntypedFormControl(null);
    this.payableToCompany = new UntypedFormControl(null);
    this.payableToFarmer = new UntypedFormControl($localize`:@@productLabelStockBulkPayments.payableTo.multiple:Multiple`);
    this.payableToCollector = new UntypedFormControl(
        this.bulkType === BulkType.PO
            ? $localize`:@@productLabelStockBulkPayments.payableTo.multiple:Multiple`
            : null
    );

    if (!action) {
      return;
    }

    if (action === 'new') {

      this.update = false;
      this.title = $localize`:@@productLabelStockBulkPayments.newTitle:New bulk payment`;

    } else if (action === 'update') {

      this.update = true;
      this.title = $localize`:@@productLabelStockBulkPayments.updateTitle:Update bulk payment`;

      const bulkPaymentId = this.route.snapshot.params.bulkPaymentId;
      const bulkPaymentResp = await this.paymentControllerService.getBulkPayment(bulkPaymentId)
          .pipe(take(1))
          .toPromise();

      if (bulkPaymentResp && bulkPaymentResp.status === 'OK' && bulkPaymentResp.data) {
        this.bulkPayment = bulkPaymentResp.data;
        this.currency = this.bulkPayment.payingCompany?.currency?.code;
        this.preparePaymentsForEdit();
      }

    } else {
      throw Error('Wrong action.');
    }

  }

  newBulkPayment() {
    this.bulkPaymentForm = generateFormFromMetadata(ApiBulkPayment.formMetadata(), {}, ApiBulkPaymentValidationScheme);
    this.setDateAndOtherFieldsThatCanBeFilled().then();
    this.conditionalValidators();
    this.initializeListManager();
    this.initPurchaseOrders().then();
    this.bulkPaymentForm.get('paymentPurposeType').setValue(PaymentPurposeTypeEnum.FIRSTINSTALLMENT);
  }

  editBulkPayment() {
    this.bulkPaymentForm = generateFormFromMetadata(ApiBulkPayment.formMetadata(), this.bulkPayment, ApiBulkPaymentValidationScheme);
    this.conditionalValidators();
    this.initializeListManager();
    this.initPayments().then();
    this.bulkPaymentForm.get('paymentPurposeType').disable();
  }

  async setDateAndOtherFieldsThatCanBeFilled() {

    const today = dateISOString(new Date());
    this.bulkPaymentForm.get('formalCreationTime').setValue(today);

    // Paying company is the company in which the user is currently logged in
    if (this.payingCompany) {
      this.bulkPaymentForm.get('payingCompany').setValue(this.payingCompany);
      this.payableFromForm.setValue(this.payingCompany.name);
      this.currency = this.payingCompany.currency?.code;
    }
  }

  preparePaymentsForEdit() {
    for (const payment of this.bulkPayment.payments) {
      (this.paymentsForm as UntypedFormArray).push(new UntypedFormControl(payment));
    }
  }

  conditionalValidators() {
    this.subConditional = this.bulkPaymentForm.get('additionalCost').valueChanges.subscribe(val => {
      if (val) {
        this.bulkPaymentForm.controls['additionalCostDescription'].setValidators([Validators.required]);
        this.bulkPaymentForm.controls['additionalCostDescription'].updateValueAndValidity();
      } else {
        this.bulkPaymentForm.controls['additionalCostDescription'].clearValidators();
        this.bulkPaymentForm.controls['additionalCostDescription'].updateValueAndValidity();
      }
    });

    if (this.bulkType === BulkType.BONUS) {
      this.bulkPaymentForm.controls['paymentPerKg'].setValidators([Validators.required]);
      this.bulkPaymentForm.controls['paymentPerKg'].updateValueAndValidity();
    }
  }

  initializeListManager() {
    this.additionalProofsListManager = new ListEditorManager<ApiActivityProof>(
        this.bulkPaymentForm.get('additionalProofs') as UntypedFormArray,
        StockPaymentsBulkDetailComponent.ApiActivityProofItemEmptyObjectFormFactory(),
        ApiActivityProofValidationScheme
    );

    this.paymentsListManager = new ListEditorManager<ApiPayment>(
        this.paymentsForm as UntypedFormArray,
        StockPaymentsBulkDetailComponent.ApiPaymentEmptyObjectFormFactory(),
        ApiPaymentValidationScheme
    );
  }

  async initPayments() {

    if (this.bulkPayment.payingCompany) {
        this.payableFromForm.setValue(this.bulkPayment.payingCompany.name);
    }

    if (this.bulkPayment.createdBy) {
      this.createdBy = this.bulkPayment.createdBy.name + ' ' + this.bulkPayment.createdBy.surname;
    }
  }

  async initPurchaseOrders() {

    const purchaseOrderIds = this.route.snapshot.params.purchaseOrderIds.split(',');

    if (this.bulkType === BulkType.PO) {

      for (const purchaseOrderId of purchaseOrderIds) {
        const purchaseOrderResp = await this.stockOrderControllerService.getStockOrder(purchaseOrderId)
            .pipe(take(1))
            .toPromise();

        if (purchaseOrderResp && purchaseOrderResp.status === 'OK' && purchaseOrderResp.data) {
          const purchaseOrder = purchaseOrderResp.data;

          const purchaseOrderForm = generateFormFromMetadata(ApiStockOrder.formMetadata(), purchaseOrder, ApiStockOrderValidationScheme);
          purchaseOrderForm.get('paid').setValue(purchaseOrder.balance);

          if (purchaseOrder.preferredWayOfPayment === PreferredWayOfPaymentEnum.CASHVIACOLLECTOR
              && purchaseOrder.representativeOfProducerUserCustomer) {

            const collector = purchaseOrder.representativeOfProducerUserCustomer;
            if (!collector) {
              continue;
            }

            if (collector.bank && collector.bank.accountNumber) {
              this.purchaseItems.push(purchaseOrderForm);
            } else {
              this.purchaseItemsNoBankAccount.push(purchaseOrderForm);
            }

          } else {
            // preferredWayOfPayment != CASH_VIA_COLLECTOR || representativeOfProducerUserCustomer (collector) == null

            const farmer = purchaseOrder.producerUserCustomer;
            if (!farmer) {
              continue;
            }

            if (farmer.bank && farmer.bank.accountNumber) {
              this.purchaseItems.push(purchaseOrderForm);
            } else {
              this.purchaseItemsNoBankAccount.push(purchaseOrderForm);
            }

          }
        }
      }
    } else if (this.bulkType === BulkType.BONUS) {
    //   let checkedStockOrderList: string[] = [];
    //   let sumPurchased = 0;
    //   for (let po of POIds) {
    //
    //     let resOrder = await this.stockOrderService.getAggregatesForStockOrder(po).pipe(take(1)).toPromise();
    //     if (resOrder && resOrder.status === 'OK' && resOrder.data) {
    //       const order = resOrder.data[0];
    //       let orderName = order.stockOrderAggs[0].stockOrder.internalLotNumber;
    //       let orderId = order.stockOrderAggs[0].stockOrder._id;
    //       const len = resOrder.data.length;
    //       for (const so of resOrder.data[len - 1].stockOrderAggs) {
    //         if (so.stockOrder.orderType != "PURCHASE_ORDER") continue;
    //         if (checkedStockOrderList.includes(so.stockOrder._id)) continue;
    //         checkedStockOrderList.push(so.stockOrder._id)
    //         let resUserBank = await this.chainUserCustomerService.getUserCustomer(so.stockOrder.producerUserCustomerId).pipe(take(1)).toPromise();
    //         if (resUserBank && resUserBank.status === 'OK' && resUserBank.data) {
    //           if (resUserBank.data.bankAccountInfo == null || (resUserBank.data.bankAccountInfo && !resUserBank.data.bankAccountInfo.accountNumber)) {
    //             this.purchaseItemsNoBankAccount.push(new FormGroup({
    //               _id: new FormControl(dbKey(so.stockOrder)),
    //               name: new FormControl(so.stockOrder.identifier),
    //               recipientName: new FormControl(resUserBank.data.name),
    //               recipientSurname: new FormControl(resUserBank.data.surname),
    //               productId: new FormControl(resUserBank.data.productId),
    //               recipientId: new FormControl(resUserBank.data._id),
    //               orderName: new FormControl(orderName),
    //             }, { validators: this.payingEqualOrLessThanBalance }))
    //           } else {
    //             this.purchaseItems.push(new FormGroup({
    //               _id: new FormControl(dbKey(so.stockOrder)),
    //               recipientUserCustomerId: new FormControl(so.stockOrder.producerUserCustomerId),
    //               representativeOfRecipientUserCustomerId: new FormControl(so.stockOrder.representativeOfProducerUserCustomerId),
    //               name: new FormControl(so.stockOrder.identifier),
    //               purchased: new FormControl(so.stockOrder.totalQuantity),
    //               balance: new FormControl(null),
    //               paying: new FormControl(null),
    //               orderName: new FormControl(orderName),
    //               orderId: new FormControl(orderId)
    //             }, { validators: this.payingEqualOrLessThanBalance }))
    //             sumPurchased += so.stockOrder.totalQuantity;
    //           }
    //         }
    //       }
    //     }
    //   }
    //   this.totalPurchasedKgForm.setValue(sumPurchased);
    }
  }

  async saveBulkPayment() {

    if (this.bulkPaymentUpdateInProgress) {
      return;
    }

    this.globalEventsManager.showLoading(true);
    this.bulkPaymentUpdateInProgress = true;
    this.submitted = true;

    if (this.bulkPaymentForm.invalid || this.purchaseItems.invalid) {
      this.bulkPaymentUpdateInProgress = false;
      this.globalEventsManager.showLoading(false);
      return;
    }

    const formalCreationTime = this.bulkPaymentForm.get('formalCreationTime').value;
    if (formalCreationTime) {
      this.bulkPaymentForm.get('formalCreationTime').setValue(dateISOString(formalCreationTime));
    }

    (this.bulkPaymentForm.get('payments') as UntypedFormArray).clear();
    this.bulkPayment = this.bulkPaymentForm.getRawValue();

    if (!this.update) {
      for (const purchaseOrder of this.purchaseItems.value) {

        const payment = {
          currency: this.currency,
          formalCreationTime: this.bulkPaymentForm.get('formalCreationTime').value,
          payingCompany: this.bulkPaymentForm.get('payingCompany').value,
          paymentPurposeType: this.bulkPaymentForm.get('paymentPurposeType').value,
          receiptNumber: this.bulkPaymentForm.get('receiptNumber').value,
          stockOrder: purchaseOrder,
          orderId: purchaseOrder.orderId,
          amount: purchaseOrder.paid,
          recipientUserCustomer: purchaseOrder.producerUserCustomer,
          preferredWayOfPayment: purchaseOrder.preferredWayOfPayment,
          representativeOfRecipientUserCustomer: purchaseOrder.representativeOfRecipientUserCustomer,
          paymentType: PaymentTypeEnum.BANKTRANSFER,
          recipientType: RecipientTypeEnum.USERCUSTOMER,
          paymentStatus: PaymentStatusEnum.UNCONFIRMED,
        } as ApiPayment;

        if (purchaseOrder.preferredWayOfPayment === PreferredWayOfPaymentEnum.CASHVIACOLLECTOR) {
          payment.amountPaidToTheCollector = purchaseOrder.paid;
        }

        this.bulkPayment.payments.push(payment);
      }
    }

    const bulkPaymentResp = await this.paymentControllerService.createBulkPayment(this.bulkPayment)
        .pipe(take(1))
        .toPromise();

    this.bulkPaymentUpdateInProgress = false;
    this.globalEventsManager.showLoading(false);

    if (bulkPaymentResp && bulkPaymentResp.status === 'OK' && bulkPaymentResp.data) {
      this.dismiss();
    }
  }

  removeItem(index: number) {
    this.purchaseItems.removeAt(index);
  }

  setTotalAmountToBePaid() {
    if (this.update && this.bulkPayment) {
      this.bulkPaymentForm.get('totalAmount').setValue(this.bulkPayment.totalAmount);
      return;
    }

    let sum = 0;
    for (const purchaseOrder of this.purchaseItems.value) {
      sum += Number(purchaseOrder.paid);
    }
    this.bulkPaymentForm.get('totalAmount').setValue(sum);
  }

  get additionalProofsForm(): UntypedFormArray {
    return this.bulkPaymentForm.get('additionalProofs') as UntypedFormArray;
  }

  get BulkType(): typeof BulkType {
    return BulkType;
  }

  get PreferredWayOfPayment(): typeof PreferredWayOfPaymentEnum {
    return PreferredWayOfPaymentEnum;
  }

  get paymentPurposeTypes() {
    const obj = {};
    obj['ADVANCE_PAYMENT'] = $localize`:@@paymentForm.paymentPurposeTypes.advancedPayment:Advanced payment`;
    obj['FIRST_INSTALLMENT'] = $localize`:@@paymentForm.paymentPurposeTypes.firstInstallment:Base payment`;
    obj['SECOND_INSTALLMENT'] = $localize`:@@paymentForm.paymentPurposeTypes.secondInstallment:Member bonus`;
    obj['WOMEN_PREMIUM'] = $localize`:@@paymentForm.paymentPurposeTypes.womenPreminum:Women premium`;
    obj['INVOICE_PAYMENT'] = $localize`:@@paymentForm.paymentPurposeTypes.invoicePayment:Invoice payment`;
    obj['ORGANIC_BONUS'] = $localize`:@@paymentForm.paymentPurposeTypes.organicBonus:Organic bonus`;
    obj['FT_BONUS'] = $localize`:@@paymentForm.paymentPurposeTypes.ftBonus:FT bonus`;
    obj['FT_PREMIUM'] = $localize`:@@paymentForm.paymentPurposeTypes.ftPremium:FT premium`;
    obj['OTHER_BONUS'] = $localize`:@@paymentForm.paymentPurposeTypes.otherBonus:Other bonus`;
    return obj;
  }

  getCurrencyString(text: string): string {
    if (this.currency) {
      return `${text} (${this.currency})`;
    }
    return text;
  }

  dismiss() {
    this.location.back();
  }

  hideSavedButton() {
    return this.update
        || this.purchaseItemsNoBankAccount.controls.length > 0
        || this.purchaseItems.value.length === 0 && !this.update;
  }

}
