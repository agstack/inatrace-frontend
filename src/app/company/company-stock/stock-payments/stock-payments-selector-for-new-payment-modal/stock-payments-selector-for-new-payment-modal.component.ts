import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { EnumSifrant } from '../../../../shared-services/enum-sifrant';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StockOrderControllerService } from '../../../../../api/api/stockOrderController.service';
import { CompanyUserCustomersByRoleService } from '../../../../shared-services/company-user-customers-by-role.service';
import { CompanyControllerService } from '../../../../../api/api/companyController.service';
import { ApiUserCustomerCooperative } from '../../../../../api/model/apiUserCustomerCooperative';
import { StockOrdersForCompanyService } from '../../../../shared-services/stock-orders-for-company.service';
import { ApiStockOrder } from '../../../../../api/model/apiStockOrder';
import OrderTypeEnum = ApiStockOrder.OrderTypeEnum;
import UserCustomerTypeEnum = ApiUserCustomerCooperative.UserCustomerTypeEnum;

@Component({
    selector: 'app-stock-payments-selector-for-new-payment-modal',
    templateUrl: './stock-payments-selector-for-new-payment-modal.component.html',
    styleUrls: ['./stock-payments-selector-for-new-payment-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class StockPaymentsSelectorForNewPaymentModalComponent implements OnInit {

  title = $localize`:@@facilityStockOrderPaymentModal.title:Select farmer and purchase order`;

  @Input()
  dismissible = true;
  @Input()
  companyId: number;

  purchaseOrderId: number;
  currentFarmerId: number;

  farmersCodebook: CompanyUserCustomersByRoleService;
  womenShareCodebook = EnumSifrant.fromObject(this.womenShareTypes);
  purchaseOrdersForPaymentsCodebook: StockOrdersForCompanyService;

  farmerForm = new UntypedFormControl(null);
  womenCoffeeOnlyForm = new UntypedFormControl(null);
  stockOrderForPaymentForm = new UntypedFormControl(null);

  constructor(
      public activeModal: NgbActiveModal,
      private stockOrderControllerService: StockOrderControllerService,
      private companyControllerService: CompanyControllerService
  ) { }

  ngOnInit(): void {
    this.farmersCodebook = new CompanyUserCustomersByRoleService(
        this.companyControllerService,
        this.companyId,
        UserCustomerTypeEnum.FARMER
    );
  }

  farmersChanged(event) {
    if (event) {
      this.currentFarmerId = event.id;
      this.purchaseOrdersForPaymentsCodebook = new StockOrdersForCompanyService(
          this.stockOrderControllerService,
          this.companyId,
          this.currentFarmerId,
          true,
          this.womenCoffeeOnlyForm ? this.womenCoffeeOnlyForm.value : null,
          null,
          OrderTypeEnum.PURCHASEORDER,
          null,
          null,
          null
      );
    } else {
      this.currentFarmerId = null;
      this.purchaseOrderId = null;
      this.womenCoffeeOnlyForm.setValue(null);
    }
    this.stockOrderForPaymentForm.setValue(null);
  }

  womenCoffeeChanged(event) {
    this.purchaseOrderId = null;
    this.stockOrderForPaymentForm.setValue(null);
    this.purchaseOrdersForPaymentsCodebook = new StockOrdersForCompanyService(
        this.stockOrderControllerService,
        this.companyId,
        this.currentFarmerId,
        true,
        this.womenCoffeeOnlyForm ? this.womenCoffeeOnlyForm.value : null,
        null,
        OrderTypeEnum.PURCHASEORDER,
        null,
        null,
        null
    );

  }

  purchaseOrderForPaymentChanged(event) {
    this.purchaseOrderId = (event) ? event.id : null;
  }

  get womenShareTypes() {
    const obj = {};
    obj[0] = $localize`:@@facilityStockOrderPaymentModal.womenShareTypes.no:NO`;
    obj[1] = $localize`:@@facilityStockOrderPaymentModal.womenShareTypes.yes:YES`;
    return obj;
  }

  onConfirm() {
    if (this.stockOrderForPaymentForm.value) {
      this.activeModal.close(this.stockOrderForPaymentForm.value);
    }
  }

  cancel() {
    this.activeModal.close();
  }

}
