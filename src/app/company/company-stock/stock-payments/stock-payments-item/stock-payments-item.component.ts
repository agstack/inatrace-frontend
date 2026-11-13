import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { Router } from '@angular/router';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { generateFormFromMetadata } from '../../../../../shared/utils';
import { GenericEditableItemComponent } from '../../../../shared/generic-editable-item/generic-editable-item.component';
import { ApiPayment } from '../../../../../api/model/apiPayment';
import { PaymentControllerService } from '../../../../../api/api/paymentController.service';
import { ApiStockOrder } from '../../../../../api/model/apiStockOrder';
import { ApiPaymentValidationScheme } from '../stock-payments-bulk-detail/validation';
import { CompanyUserCustomersByRoleService } from '../../../../shared-services/company-user-customers-by-role.service';
import { ApiUserCustomerCooperative } from '../../../../../api/model/apiUserCustomerCooperative';
import { CompanyControllerService } from '../../../../../api/api/companyController.service';
import UserCustomerTypeEnum = ApiUserCustomerCooperative.UserCustomerTypeEnum;

@Component({
    selector: 'app-stock-payments-item',
    templateUrl: './stock-payments-item.component.html',
    styleUrls: ['./stock-payments-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class StockPaymentsItemComponent extends GenericEditableItemComponent<ApiPayment> implements OnInit {

  @Input()
  paymentForm: UntypedFormGroup;
  @Input()
  disableDelete: boolean;
  @Input()
  formTitle: string;

  payableFromForm = new UntypedFormControl(null);
  searchFarmersForm = new UntypedFormControl(null);
  searchCompaniesForm = new UntypedFormControl(null);
  searchCollectorsForm = new UntypedFormControl(null);
  orderReferenceForm = new UntypedFormControl(null);

  payment: ApiPayment;
  purchaseOrder: ApiStockOrder;
  farmersCodebook: CompanyUserCustomersByRoleService;
  collectorsCodebook: CompanyUserCustomersByRoleService;

  viewOnly = false;
  updatePaymentInProgress = false;

  openBalanceToBeSet;
  purchasedToBeSet;

  constructor(
      protected router: Router,
      protected globalEventsManager: GlobalEventManagerService,
      private paymentControllerService: PaymentControllerService,
      private companyControllerService: CompanyControllerService
  ) {
    super(globalEventsManager);
  }

  ngOnInit(): void {

    if (this.form.value != null) {
      this.viewOnly = true;
      this.searchCompaniesForm.disable();
      this.searchFarmersForm.disable();
      this.form.get('paymentType').disable();
      this.form.get('paymentPurposeType').disable();
      this.form.get('receiptDocument').disable();
      this.form.get('formalCreationTime').disable();
    } else {
      this.viewOnly = false;
      this.searchCompaniesForm.enable();
      this.searchFarmersForm.enable();
      this.form.get('paymentType').enable();
      this.form.get('paymentPurposeType').enable();
      this.form.get('receiptDocument').enable();
      this.form.get('formalCreationTime').enable();
    }
    this.initializeData().then();
  }

  public generateForm(value: any): UntypedFormGroup {
    return generateFormFromMetadata(ApiPayment.formMetadata(), value, ApiPaymentValidationScheme);
  }

  async initializeData() {

    this.payment = this.paymentForm.value;
    this.purchaseOrder = this.payment.stockOrder;

    this.openBalanceToBeSet = this.purchaseOrder.balance;
    this.purchasedToBeSet = this.purchaseOrder.fulfilledQuantity;

    // Identifier
    this.orderReferenceForm.setValue(this.purchaseOrder.identifier);

    // Paying company
    if (this.payment.payingCompany) {
      this.payableFromForm.setValue(this.payment.payingCompany.name);
    }

    // Collector
    const collector = this.purchaseOrder.representativeOfProducerUserCustomer;
    if (collector) {
      this.searchCollectorsForm.setValue(collector);
    }

    // Farmer
    const farmer = this.purchaseOrder.producerUserCustomer;
    if (farmer) {
      this.searchFarmersForm.setValue(farmer);
    }

    // Codebooks

    this.farmersCodebook = new CompanyUserCustomersByRoleService(
        this.companyControllerService,
        this.payment.payingCompany.id,
        UserCustomerTypeEnum.FARMER
    );

    this.collectorsCodebook = new CompanyUserCustomersByRoleService(
        this.companyControllerService,
        this.payment.payingCompany.id,
        UserCustomerTypeEnum.COLLECTOR
    );

  }

  whichClass() {
    if (this.payment) {
      return 'af-form-block--c12';
    }
    return 'af-form-block--c6';
  }

  get name(): string {
    return this.contentObject
        ? this.contentObject.receiptNumber + ' (' + this.contentObject.amount + ' ' + this.contentObject.currency + ')'
        : '';
  }

}
