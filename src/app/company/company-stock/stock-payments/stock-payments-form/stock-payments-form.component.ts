import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { take, takeUntil } from 'rxjs/operators';
import { EnumSifrant } from 'src/app/shared-services/enum-sifrant';
import { formatDateWithDotsAtHour } from 'src/shared/utils';
import { CompanyControllerService } from '../../../../../api/api/companyController.service';
import { CompanyUserCustomersByRoleService } from '../../../../shared-services/company-user-customers-by-role.service';
import { ApiPayment } from '../../../../../api/model/apiPayment';
import { ApiStockOrder } from '../../../../../api/model/apiStockOrder';
import { ApiUserCustomer } from '../../../../../api/model/apiUserCustomer';
import PaymentTypeEnum = ApiPayment.PaymentTypeEnum;
import PreferredWayOfPaymentEnum = ApiStockOrder.PreferredWayOfPaymentEnum;
import PaymentPurposeTypeEnum = ApiPayment.PaymentPurposeTypeEnum;
import PaymentStatusEnum = ApiPayment.PaymentStatusEnum;
import ReceiptDocumentTypeEnum = ApiPayment.ReceiptDocumentTypeEnum;
// import { Subject } from 'rxjs/internal/Subject';
import { ConnectedCompaniesForCompanyService } from '../../../../shared-services/connected-companies-for-company.service';
import { CurrencyCodesService } from '../../../../shared-services/currency-codes.service';
import { SelectedUserCompanyService } from '../../../../core/selected-user-company.service';
import {Subject} from 'rxjs';

export enum ModeEnum {
  PURCHASE = 'PURCHASE',
  CUSTOMER = 'CUSTOMER'
}

@Component({
  selector: 'app-stock-payments-form',
  templateUrl: './stock-payments-form.component.html',
  styleUrls: ['./stock-payments-form.component.scss']
})
export class StockPaymentsFormComponent implements OnInit, OnDestroy {

  @Input()
  paymentForm: FormGroup;

  @Input()
  orderReferenceForm = new FormControl(null);

  @Input()
  payableFromForm = new FormControl(null);

  @Input()
  searchCompaniesForm = new FormControl(null);

  @Input()
  searchCollectorsForm = new FormControl(null);

  @Input()
  searchFarmersForm = new FormControl(null);

  @Input()
  collectorsCodebook: CompanyUserCustomersByRoleService;

  @Input()
  farmersCodebook: CompanyUserCustomersByRoleService;

  @Input()
  submitted: boolean;

  @Input()
  viewOnly: boolean;

  @Input()
  stockOrder: ApiStockOrder;

  @Input()
  openBalance: number;

  @Input()
  purchased: number;

  @Input()
  mode: ModeEnum = ModeEnum.PURCHASE;

  companyId: number;

  readonlyPaymentType: boolean;
  uploaderLabel: string;
  confirmedAt: string;
  confirmedByUser: string;
  currency: string;
  unitLabel: string;

  associatedCompaniesService: ConnectedCompaniesForCompanyService;
  searchPreferredWayOfPayment = new FormControl(null);

  uploaderLabelStr = $localize`:@@paymentForm.attachment-uploader.receipt.label:Signed receipt (PDF/PNG/JPG)`;
  uploaderLabelRequiredStr = $localize`:@@paymentForm.attachment-uploader.receipt.required.label:Signed receipt (PDF/PNG/JPG)*`;
  labelDocumentStr = $localize`:@@paymentForm.attachment-uploader.document.label:Document (PDF/PNG/JPG)`;
  labelDocumentRequiredStr = $localize`:@@paymentForm.attachment-uploader.document.required.label:Document (PDF/PNG/JPG)*`;

  currencyAndUnitStrs = {
    purchasedLabel: $localize`:@@paymentForm.textinput.purchased.label:Purchased`,
    openBalanceLabel: $localize`:@@paymentForm.textinput.balance.label:Open balance`,
    paidToFarmerLabel: $localize`:@@paymentForm.textinput.amount.label:Amount paid to the farmer`,
    paidToCollectorLabel: $localize`:@@paymentForm.textinput.amountPaidToTheCollector.label:Amount paid to the collector`,
    totalPaidLabel: $localize`:@@paymentForm.textinput.totalPaid.label:Total paid`,
    paidFromCollectorToFarmerLabel: $localize`:@@paymentForm.textinput.amountAlready.label:Amount already paid by collector to farmer`
  };
  
  paymentTypesCodebook = EnumSifrant.fromObject({});
  paymentPurposeTypesCodebook = EnumSifrant.fromObject(this.paymentPurposeTypes);
  codebookAdditionalProofs = EnumSifrant.fromObject(this.addProofs);
  codebookPreferredWayOfPayment = EnumSifrant.fromObject(this.preferredWayOfPaymentList);
  
  private destroy$ = new Subject<boolean>();

  constructor(
      private route: ActivatedRoute,
      private companyControllerService: CompanyControllerService,
      private companyController: CompanyControllerService,
      public codebookCurrencyCodes: CurrencyCodesService,
      private selUserCompanyService: SelectedUserCompanyService
  ) { }

  async ngOnInit(): Promise<void> {

    this.companyId = (await this.selUserCompanyService.selectedCompanyProfile$.pipe(take(1)).toPromise())?.id;

    this.initInitialData().then(() => {

      this.uploaderLabel = this.uploaderLabelStr;

      if (this.paymentForm.value && this.paymentForm.value.paymentStatus === PaymentStatusEnum.CONFIRMED) {
        this.viewOnly = true;
        this.setConfirmed().then();
      }

      this.searchCollectorsForm.disable();
      this.searchFarmersForm.disable();

      if (this.mode === ModeEnum.PURCHASE) {
        this.searchCompaniesForm.disable();

        if (!this.paymentForm.get('paymentPurposeType').value) {
          this.paymentForm.get('paymentPurposeType').setValue(PaymentPurposeTypeEnum.FIRSTINSTALLMENT);
        }

        if (this.paymentForm.get('paymentPurposeType').value === PaymentPurposeTypeEnum.FIRSTINSTALLMENT) {
          this.uploaderLabel = this.uploaderLabelRequiredStr;
        }
      }

      if (this.viewOnly) {
        this.paymentForm.get('paymentType').disable();
        this.paymentForm.get('paymentPurposeType').disable();
        this.paymentForm.get('formalCreationTime').disable();
        this.paymentForm.get('receiptDocumentType').disable();
        this.paymentForm.get('receiptDocument').disable();
        this.paymentForm.get('currency').disable();

        this.searchCompaniesForm.disable();

        if (this.mode === ModeEnum.CUSTOMER) {
          this.paymentForm.get('receiptDocumentType').setValue(ReceiptDocumentTypeEnum.RECEIPT);
          this.paymentForm.get('receiptDocumentType').disable();
        }

      } else {
        if (this.searchCollectorsForm.value) {
          this.paymentForm.get('receiptDocumentType').setValue(null);
          this.uploaderLabel = this.labelDocumentStr;

          if (this.paymentForm.get('paymentPurposeType').value === PaymentPurposeTypeEnum.FIRSTINSTALLMENT) {
            this.uploaderLabel = this.labelDocumentRequiredStr;
          }

        } else {
          this.paymentForm.get('receiptDocumentType').setValue(ReceiptDocumentTypeEnum.RECEIPT);
          this.paymentForm.get('receiptDocumentType').disable();
        }

        if (this.mode === ModeEnum.PURCHASE) {
          if (this.openBalance > 0) {
            if (this.searchPreferredWayOfPayment.value === PreferredWayOfPaymentEnum.CASHVIACOLLECTOR) {
              this.paymentForm.get('amountPaidToTheCollector').setValue(this.openBalance);
            } else {
              this.paymentForm.get('amount').setValue(this.openBalance);
            }
          }
        }
      }
    });
    
    this.paymentForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((values: any) => {
      const {currency, measureUnitType} = values.stockOrder;
      this.currency = currency;
      this.unitLabel = measureUnitType.label;
    });
    
    this.searchCollectorsForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.paymentTypesCodebook = EnumSifrant.fromObject(
          this.createPaymentTypes(value !== null)
      );
    });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
  }

  private async initInitialData() {

    if (this.stockOrder) {

      this.paymentForm.get('productionDate').setValue(this.stockOrder.productionDate);
      this.paymentForm.get('preferredWayOfPayment').setValue(this.stockOrder.preferredWayOfPayment);

      if (this.mode === ModeEnum.PURCHASE) {
        this.searchPreferredWayOfPayment.setValue(this.stockOrder.preferredWayOfPayment);
        this.searchPreferredWayOfPayment.disable();

        if (this.stockOrder.preferredWayOfPayment === PreferredWayOfPaymentEnum.CASHVIACOLLECTOR
            && this.paymentForm && !this.paymentForm.get('paymentType').value) {
          this.paymentForm.get('paymentType').setValue(PaymentTypeEnum.BANKTRANSFER);
          this.paymentForm.get('amountPaidToTheCollector').setValidators([Validators.required]);

        } else if (this.stockOrder.preferredWayOfPayment !== PreferredWayOfPaymentEnum.CASHVIACOLLECTOR
            && this.paymentForm && !this.paymentForm.get('paymentType').value) {
          this.paymentForm.get('amountPaidToTheCollector').setValue(0);
          this.paymentForm.get('amountPaidToTheCollector').disable();
        }

      } else {
        this.paymentForm.get('paymentType').setValue(PaymentTypeEnum.BANKTRANSFER);
        this.readonlyPaymentType = true;
      }
    }

    // Initialize the associated companies of the paying company (connected though the products where the paying company is a stakeholder)
    this.associatedCompaniesService = new ConnectedCompaniesForCompanyService(this.companyController, this.companyId);
  }

  private async setConfirmed() {

    this.confirmedAt = formatDateWithDotsAtHour(this.paymentForm.get('paymentConfirmedAtTime').value);

    if (this.paymentForm.contains('paymentConfirmedByUser')) {
      const paymentConfirmedByUser = this.paymentForm.get('paymentConfirmedByUser').value;
      this.confirmedByUser = paymentConfirmedByUser.name + ' ' + paymentConfirmedByUser.surname;
    }
  }

  setFarmer(event: ApiUserCustomer) {
    if (event) {
      this.paymentForm.get('recipientUserCustomer').setValue(event);
    } else {
      this.paymentForm.get('recipientUserCustomer').setValue(null);
    }
    this.paymentForm.get('recipientUserCustomer').markAsDirty();
    this.paymentForm.get('recipientUserCustomer').updateValueAndValidity();
  }

  setCollector(event: ApiUserCustomer) {
    if (event) {
      this.paymentForm.get('representativeOfRecipientUserCustomer').setValue(event);
      this.paymentForm.get('receiptDocumentType').setValue(null);
    } else {
      this.paymentForm.get('representativeOfRecipientUserCustomer').setValue(null);
      this.paymentForm.get('receiptDocumentType').setValue(ReceiptDocumentTypeEnum.RECEIPT);
    }
    this.paymentForm.get('representativeOfRecipientUserCustomer').markAsDirty();
    this.paymentForm.get('representativeOfRecipientUserCustomer').updateValueAndValidity();
  }

  async setCompany(event) {
    if (event) {
      const companyResp = await this.companyControllerService.getCompany(event.company.id)
          .pipe(take(1))
          .toPromise();
      if (companyResp && companyResp.status === 'OK' && companyResp.data) {
        this.paymentForm.get('recipientCompany').setValue(companyResp.data);
      }
    } else {
      this.paymentForm.get('recipientCompany').setValue(null);
    }
    this.paymentForm.get('recipientCompany').markAsDirty();
    this.paymentForm.get('recipientCompany').updateValueAndValidity();
  }

  changeReceiptDocumentLabel() {
    if (!this.viewOnly && this.searchCollectorsForm.value) {
      if (this.paymentForm.get('paymentPurposeType').value === PaymentPurposeTypeEnum.FIRSTINSTALLMENT) {
        this.uploaderLabel = this.labelDocumentRequiredStr;
      } else {
        this.uploaderLabel = this.labelDocumentStr;
      }
    } else {
      if (this.paymentForm.get('paymentPurposeType').value === PaymentPurposeTypeEnum.FIRSTINSTALLMENT) {
        this.uploaderLabel = this.uploaderLabelRequiredStr;
      } else {
        this.uploaderLabel = this.uploaderLabelStr;
      }
    }
  }

  get totalPaid() {

    let totalPaid = 0;

    if (this.paymentForm && this.paymentForm.get('amount') && this.paymentForm.get('amount').value) {
      totalPaid += Number(this.paymentForm.get('amount').value);
    }

    if (this.paymentForm
        && this.searchPreferredWayOfPayment
        && this.searchPreferredWayOfPayment.value !== PreferredWayOfPaymentEnum.CASHVIACOLLECTOR
        && this.paymentForm.get('amountPaidToTheCollector')
        && this.paymentForm.get('amountPaidToTheCollector').value) {

      totalPaid += Number(this.paymentForm.get('amountPaidToTheCollector').value);
    }

    return totalPaid;
  }
  
  createPaymentTypes(collector: boolean = false): object {
    const obj = {};
    
    obj['CASH'] = $localize`:@@paymentForm.paymentTypes.cash:Cash`;
    obj['BANK_TRANSFER'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.bankTransfer:Bank transfer`;
    if (collector) {
      obj['CASH_VIA_COLLECTOR'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.cashViaCollector:Cash via collector`;
    }
    obj['CHEQUE'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.cheque:Cheque`;
    obj['OFFSETTING'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.offsetting:Offsetting`;
  
    return obj;
  }
  
  getCurrencyString(trString: string): string {
    if (this.currency) {
      return `${trString} (${this.currency})`;
    }
    return trString;
  }
  
  getUnitLabelString(trString: string): string {
    if (this.unitLabel) {
      return `${trString} (${this.unitLabel})`;
    }
    return trString;
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

  get addProofs() {
    const obj = {};
    obj['PURCHASE_SHEET'] = $localize`:@@paymentForm.addProofs.purchaseSheet:Purchase sheet`;
    obj['RECEIPT'] = $localize`:@@paymentForm.addProofs.receipt:Receipt`;
    return obj;
  }

  get preferredWayOfPaymentList() {
    const obj = {};
    obj['CASH'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.cash:Cash`;
    obj['CHEQUE'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.cheque:Cheque`;
    obj['OFFSETTING'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.offsetting:Offsetting`;
    obj['CASH_VIA_COOPERATIVE'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.cashViaCooperative:Cash via cooperative`;
    obj['CASH_VIA_COLLECTOR'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.cashViaCollector:Cash via collector`;
    obj['BANK_TRANSFER'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.bankTransfer:Bank transfer`;
    obj['UNKNOWN'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.unknown:Unknown`;
    return obj;
  }

  get modeEnum(): typeof ModeEnum {
    return ModeEnum;
  }

  get preferredWayOfPayment(): typeof PreferredWayOfPaymentEnum {
    return PreferredWayOfPaymentEnum;
  }

}
