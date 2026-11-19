import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { StockOrderControllerService } from '../../../../../api/api/stockOrderController.service';
import { PaymentControllerService } from '../../../../../api/api/paymentController.service';
import { ApiPayment } from '../../../../../api/model/apiPayment';
import { CompanyControllerService } from '../../../../../api/api/companyController.service';
import { CompanyUserCustomersByRoleService } from '../../../../shared-services/company-user-customers-by-role.service';
import { dateISOString, generateFormFromMetadata } from '../../../../../shared/utils';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { ApiPaymentValidationScheme } from '../validation';
import { Location } from '@angular/common';
import { ApiStockOrder } from '../../../../../api/model/apiStockOrder';
import { ModeEnum } from '../stock-payments-form/stock-payments-form.component';
import { ApiUserCustomerCooperative } from '../../../../../api/model/apiUserCustomerCooperative';
import PaymentStatusEnum = ApiPayment.PaymentStatusEnum;
import RecipientTypeEnum = ApiPayment.RecipientTypeEnum;
import UserCustomerTypeEnum = ApiUserCustomerCooperative.UserCustomerTypeEnum;
import { ToastrService } from 'ngx-toastr';
import { SelectedUserCompanyService } from '../../../../core/selected-user-company.service';

@Component({
    selector: 'app-stock-payments-detail',
    templateUrl: './stock-payments-detail.component.html',
    styleUrls: ['./stock-payments-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class StockPaymentsDetailComponent implements OnInit {

  mode = ModeEnum.PURCHASE;

  update: boolean;
  title: string;

  lastUpdatedByUser: string;
  companyId: number | null = null;

  purchaseOrderId: number;
  customerOrderId: number;

  submitted: boolean;
  paymentUpdateInProgress: boolean;

  stockOrder: ApiStockOrder;
  payment: ApiPayment;

  farmersCodebook: CompanyUserCustomersByRoleService;
  collectorsCodebook: CompanyUserCustomersByRoleService;

  paymentForm: UntypedFormGroup;

  searchFarmersForm = new UntypedFormControl(null);
  searchCollectorsForm = new UntypedFormControl(null);
  searchCompaniesForm = new UntypedFormControl(null);

  payableFromForm = new UntypedFormControl(null);
  orderReferenceForm = new UntypedFormControl(null);

  private addPricePerUnitMessage: string = $localize`:@@productLabelStockPayments.addPricePerUnit.message:Add price per unit`;

  constructor(
      private location: Location,
      private route: ActivatedRoute,
      private globalEventsManager: GlobalEventManagerService,
      private companyControllerService: CompanyControllerService,
      private stockOrderControllerService: StockOrderControllerService,
      private paymentControllerService: PaymentControllerService,
      private toasterService: ToastrService,
      private router: Router,
      private selUserCompanyService: SelectedUserCompanyService
  ) { }

  async ngOnInit(): Promise<void> {

    this.purchaseOrderId = this.route.snapshot.params.purchaseOrderId;
    this.customerOrderId = this.route.snapshot.params.customerOrderId;

    this.paymentUpdateInProgress = false;

    this.companyId = (await this.selUserCompanyService.selectedCompanyProfile$.pipe(take(1)).toPromise())?.id;

    this.initInitialData().then(
        () => {
          this.farmersCodebook = new CompanyUserCustomersByRoleService(
              this.companyControllerService,
              this.companyId,
              UserCustomerTypeEnum.FARMER
          );

          this.collectorsCodebook = new CompanyUserCustomersByRoleService(
              this.companyControllerService,
              this.companyId,
              UserCustomerTypeEnum.COLLECTOR
          );

          if (this.update) {
            this.editPayment().then();
          } else {
            this.newPayment().then();
          }
        }
    );
  }

  async initInitialData() {

    const action = this.route.snapshot.data.action;
    const type = this.route.snapshot.params.type;

    if (this.customerOrderId || type === ModeEnum.CUSTOMER) {
      this.mode = ModeEnum.CUSTOMER;
    }

    if (action === 'new') {

      this.update = false;
      this.title = $localize`:@@productLabelStockPayments.newTitle:New payment`;

      // Fetch StockOrder
      const stockOrderId = this.purchaseOrderId ? this.purchaseOrderId : this.customerOrderId;
      const stockOrderResp = await this.stockOrderControllerService.getStockOrder(stockOrderId)
          .pipe(take(1))
          .toPromise();

      if (stockOrderResp && stockOrderResp.status === 'OK' && stockOrderResp.data && stockOrderResp.data) {
        this.stockOrder = stockOrderResp.data;
      }

    } else if (action === 'update') {

      this.update = true;
      this.title = $localize`:@@productLabelStockPayments.updateTitle:Update payment`;

      // Fetch Payment
      const paymentId = this.route.snapshot.params.paymentId;
      const paymentResp = await this.paymentControllerService.getPayment(paymentId)
          .pipe(take(1))
          .toPromise();

      // Fetch Payment and StockOrder from received Payment
      if (paymentResp && paymentResp.status === 'OK' && paymentResp.data) {
        this.payment = paymentResp.data;
        this.stockOrder = this.payment.stockOrder;
      }

    } else {
      throw Error('Unrecognized action "' + action + '".');
    }
  }

  private async newPayment() {

    if (this.stockOrder.priceDeterminedLater) {
      this.toasterService.error(this.addPricePerUnitMessage);
      this.router.navigate(['my-stock', 'deliveries', 'tab']).then();
    }

    this.submitted = false;

    this.paymentForm = generateFormFromMetadata(ApiPayment.formMetadata(), {}, ApiPaymentValidationScheme);

    // Formal creation time
    const today = dateISOString(new Date());
    this.paymentForm.get('formalCreationTime').setValue(today);

    // If we are in purchase mode (purchase order from a farmer), set the currency of the payment to be the currency of the stock order
    if (this.mode === ModeEnum.PURCHASE) {
      this.paymentForm.get('currency').setValue(this.stockOrder.currency);
    }

    this.paymentForm.get('paymentStatus').setValue(PaymentStatusEnum.UNCONFIRMED);
    this.paymentForm.get('stockOrder').setValue(this.stockOrder);

    // Set purchase order (identifier/LOT)
    this.orderReferenceForm.setValue(this.mode === ModeEnum.PURCHASE
        ? this.stockOrder.identifier
        : this.stockOrder.internalLotNumber);

    // Collector
    if (this.stockOrder.representativeOfProducerUserCustomer) {
      this.searchCollectorsForm.setValue(this.stockOrder.representativeOfProducerUserCustomer);
      this.paymentForm.get('representativeOfRecipientUserCustomer').setValue(this.stockOrder.representativeOfProducerUserCustomer);
    }

    // Farmer
    if (this.stockOrder.producerUserCustomer) {
      this.searchFarmersForm.setValue(this.stockOrder.producerUserCustomer);
      this.paymentForm.get('recipientUserCustomer').setValue(this.stockOrder.producerUserCustomer);
    }

    // Set the recipient company
    if (this.stockOrder.quoteCompany) {
      this.searchCompaniesForm.setValue(this.stockOrder.quoteCompany);
      this.paymentForm.get('recipientCompany').setValue(this.stockOrder.quoteCompany);
    }

    // Paying company (a company which has created the stock order (Purchase or Quote) should be paying for it)
    this.payableFromForm.setValue(this.stockOrder.company?.name);
    this.paymentForm.get('payingCompany').setValue(this.stockOrder.company);
  }

  private async editPayment() {

    this.paymentForm = generateFormFromMetadata(ApiPayment.formMetadata(), this.payment, ApiPaymentValidationScheme);

    this.searchCompaniesForm.setValue(this.paymentForm.get('recipientCompany').value);
    this.searchCollectorsForm.setValue(this.paymentForm.get('representativeOfRecipientUserCustomer').value);
    this.searchFarmersForm.setValue(this.paymentForm.get('recipientUserCustomer').value);

    this.payableFromForm.setValue(this.payment.payingCompany?.name);

    this.orderReferenceForm.setValue(this.mode === ModeEnum.PURCHASE
        ? this.stockOrder.identifier
        : this.stockOrder.internalLotNumber);

    if (this.payment.updatedBy) {
      this.lastUpdatedByUser = this.payment.updatedBy.name + ' ' + this.payment.updatedBy.surname;
    }
  }

  async updatePayment() {

    if (this.paymentUpdateInProgress) {
      return;
    }

    this.paymentUpdateInProgress = true;
    this.globalEventsManager.showLoading(true);

    // Set recipientType
    if (this.paymentForm.get('recipientCompany').value?.id) {

      this.paymentForm.get('recipientType').setValue(RecipientTypeEnum.COMPANY);

    } else if (this.paymentForm.get('recipientUserCustomer').value?.id) {

      this.paymentForm.get('recipientType').setValue(RecipientTypeEnum.USERCUSTOMER);

    } else {
      this.paymentForm.get('recipientType').setValue(null);
    }

    this.submitted = true;
    if (this.paymentForm.invalid) {
      this.paymentUpdateInProgress = false;
      this.globalEventsManager.showLoading(false);
      return;
    }

    const formalCreationTime = this.paymentForm.get('formalCreationTime').value;
    if (formalCreationTime) {
      this.paymentForm.get('formalCreationTime').setValue(dateISOString(formalCreationTime));
    }

    try {

      const paymentResp = await this.paymentControllerService.createOrUpdatePayment(this.paymentForm.getRawValue())
        .pipe(take(1))
        .toPromise();

      if (paymentResp && paymentResp.status === 'OK') {
        this.dismiss();
      }

    } finally {
      this.paymentUpdateInProgress = false;
      this.globalEventsManager.showLoading(false);
    }
  }

  get modeEnum(): typeof ModeEnum{
    return ModeEnum;
  }

  dismiss() {
    this.location.back();
  }

}
