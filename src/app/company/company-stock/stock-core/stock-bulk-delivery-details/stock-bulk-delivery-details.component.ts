import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ListEditorManager } from '../../../../shared/list-editor/list-editor-manager';
import { ApiActivityProof } from '../../../../../api/model/apiActivityProof';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ApiActivityProofValidationScheme } from '../additional-proof-item/validation';
import {
  dateISOString,
  defaultEmptyObject,
  generateFormFromMetadata
} from '../../../../../shared/utils';
import { Location } from '@angular/common';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { StockOrderType } from '../../../../../shared/types';
import { ApiFacility } from '../../../../../api/model/apiFacility';
import { switchMap, take } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { ApiResponseApiCompanyGet } from '../../../../../api/model/apiResponseApiCompanyGet';
import StatusEnum = ApiResponseApiCompanyGet.StatusEnum;
import { FacilityControllerService } from '../../../../../api/api/facilityController.service';
import { CodebookTranslations } from '../../../../shared-services/codebook-translations';
import { ApiSemiProduct } from '../../../../../api/model/apiSemiProduct';
import { CompanyControllerService } from '../../../../../api/api/companyController.service';
import { CompanyUserCustomersByRoleService } from '../../../../shared-services/company-user-customers-by-role.service';
import { ApiUserCustomer } from '../../../../../api/model/apiUserCustomer';
import { EnumSifrant } from '../../../../shared-services/enum-sifrant';
import { SemiProductControllerService } from '../../../../../api/api/semiProductController.service';
import { AuthService } from '../../../../core/auth.service';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { ApiPurchaseOrder } from '../../../../../api/model/apiPurchaseOrder';
import _ from 'lodash-es';
import { StockOrderControllerService } from '../../../../../api/api/stockOrderController.service';
import { ApiPurchaseOrderFarmer } from '../../../../../api/model/apiPurchaseOrderFarmer';
import { ApiPurchaseOrderFarmerValidationScheme, ApiPurchaseOrderValidationScheme } from './validation';
import { SelectedUserCompanyService } from '../../../../core/selected-user-company.service';
import { ApiUserGet } from '../../../../../api/model/apiUserGet';
import { ApiCompanyGet } from '../../../../../api/model/apiCompanyGet';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-stock-bulk-delivery-details',
    templateUrl: './stock-bulk-delivery-details.component.html',
    styleUrls: ['./stock-bulk-delivery-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class StockBulkDeliveryDetailsComponent implements OnInit, OnDestroy {

  // FontAwesome icons
  faTrashAlt = faTrashAlt;

  title: string = null;

  purchaseOrderBulkForm: UntypedFormGroup;

  codebookPreferredWayOfPayment: EnumSifrant;

  searchCollectors = new UntypedFormControl(null);
  farmersCodebook: CompanyUserCustomersByRoleService;
  collectorsCodebook: CompanyUserCustomersByRoleService;

  employeeForm = new UntypedFormControl(null, Validators.required);
  codebookUsers: EnumSifrant;

  facilityNameForm = new UntypedFormControl(null);

  options: ApiSemiProduct[] = [];

  additionalProofsListManager = null;

  companyProfile: ApiCompanyGet | null = null;
  private currentLoggedInUser: ApiUserGet | null = null;

  private facility: ApiFacility;

  updatePOInProgress = false;

  selectedCurrency = '-';

  // temp objects for storing measureUnit for differentFarmers
  measureUnitArray: string[] = ['-'];

  codebookWomenCoffee = EnumSifrant.fromObject(this.womenCoffeeList);
  codebookOrganic = EnumSifrant.fromObject(this.yesNo);

  submitted = false;

  emptyFarmersFormArray = null;

  searchWomenCoffeeForm: UntypedFormControl[] = [new UntypedFormControl(null, Validators.required)];
  netWeightFormArray: UntypedFormControl[] = [new UntypedFormControl(null)];
  finalPriceFormArray: UntypedFormControl[] = [new UntypedFormControl(null)];

  private userProfileSubs: Subscription;

  constructor(
      private route: ActivatedRoute,
      private location: Location,
      private fb: UntypedFormBuilder,
      private globalEventsManager: GlobalEventManagerService,
      private facilityControllerService: FacilityControllerService,
      private companyControllerService: CompanyControllerService,
      private semiProductControllerService: SemiProductControllerService,
      private stockOrderControllerService: StockOrderControllerService,
      private codebookTranslations: CodebookTranslations,
      private authService: AuthService,
      private selUserCompanyService: SelectedUserCompanyService
  ) { }

  // Additional proof item factory methods (used when creating ListEditorManger)
  static AdditionalProofItemCreateEmptyObject(): ApiActivityProof {
    const object = ApiActivityProof.formMetadata();
    return defaultEmptyObject(object) as ApiActivityProof;
  }

  static AdditionalProofItemEmptyObjectFormFactory(): () => UntypedFormControl {
    return () => {
      return new UntypedFormControl(StockBulkDeliveryDetailsComponent.AdditionalProofItemCreateEmptyObject(),
          ApiActivityProofValidationScheme.validators);
    };
  }

  get orderType(): StockOrderType {
    // order type is fixed to PURCHASE_ORDER
    return 'PURCHASE_ORDER' as StockOrderType;
  }

  get preferredWayOfPaymentList() {

    const obj = {};
    obj['CASH'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.cash:Cash`;

    if (this.purchaseOrderBulkForm &&
        this.purchaseOrderBulkForm.get('representativeOfProducerUserCustomer') &&
        this.purchaseOrderBulkForm.get('representativeOfProducerUserCustomer').value) {

      obj['CASH_VIA_COLLECTOR'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.cashViaCollector:Cash via collector`;
    }

    if (this.purchaseOrderBulkForm &&
        this.purchaseOrderBulkForm.get('representativeOfProducerUserCustomer') &&
        !this.purchaseOrderBulkForm.get('representativeOfProducerUserCustomer').value) {

      obj['UNKNOWN'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.unknown:Unknown`;
    }

    obj['BANK_TRANSFER'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.bankTransfer:Bank transfer`;
    obj['CHEQUE'] = $localize`:@@preferredWayOfPayment.cheque:Cheque`;
    obj['OFFSETTING'] = $localize`:@@preferredWayOfPayment.offsetting:Cheque`;

    return obj;
  }

  quantityLabel(idx: number) {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.quantityDelievered.label:Quantity` + ` (${this.measureUnitArray[idx]})`;
  }

  tareLabel(idx: number) {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.tare.label:Tare` + ` (${this.measureUnitArray[idx]})`;
  }

  netLabel(idx: number) {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.netWeight.label:Net weight` + ` (${this.measureUnitArray[idx]})`;
  }

  finalPriceLabel(idx: number) {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.finalPrice.label:Final price` + ` (${this.selectedCurrency}/${this.measureUnitArray[idx]})`;
  }

  pricePerUnitLabel(idx: number) {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.pricePerUnit.label:Price per unit` + ` (${this.selectedCurrency}/${this.measureUnitArray[idx]})`;
  }

  get costLabel() {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.cost.label:Base payment` + ` (${this.selectedCurrency})`;
  }

  get balanceLabel() {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.balance.label:Open balance` + ` (${this.selectedCurrency})`;
  }

  damagedPriceDeductionLabel(idx: number) {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.damagedPriceDeduction.label: Deduction` + ` (${this.selectedCurrency}/${this.measureUnitArray[idx]})`;
  }

  damagedWeightDeductionLabel(idx: number) {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.damagedWeightDeduction.label: Deduction` + ` (${this.measureUnitArray[idx]})`;
  }

  get additionalProofsForm(): UntypedFormArray {
    return this.purchaseOrderBulkForm.get('activityProofs') as UntypedFormArray;
  }

  private get womenCoffeeList() {
    const obj = {};
    obj['YES'] = $localize`:@@productLabelStockPurchaseOrdersModal.womensCoffeeList.yes:Yes`;
    obj['NO'] = $localize`:@@productLabelStockPurchaseOrdersModal.womensCoffeeList.no:No`;
    return obj;
  }

  get yesNo() {
    const obj = {};
    obj['true'] = $localize`:@@productLabelStockPurchaseOrdersModal.organic.yes:Yes`;
    obj['false'] = $localize`:@@productLabelStockPurchaseOrdersModal.organic.no:No`;
    return obj;
  }

  async ngOnInit() {

    this.userProfileSubs = this.authService.userProfile$
      .pipe(
        switchMap(up => {
          this.currentLoggedInUser = up;
          return this.selUserCompanyService.selectedCompanyProfile$;
        })
      )
      .subscribe(cp => {
        if (cp) {
          this.companyProfile = cp;
          this.selectedCurrency = cp.currency?.code ? cp.currency.code : '-';
          this.reloadOrder();
        }
      });
  }

  ngOnDestroy(): void {
    if (this.userProfileSubs) {
      this.userProfileSubs.unsubscribe();
    }
  }

  private newTitle() {
    // only purchase_order supported
    return $localize`:@@productLabelStockPurchaseOrdersModal.newPurchaseOrderTitle:New purchase order`;
  }

  private reloadOrder() {

    this.globalEventsManager.showLoading(true);
    this.submitted = false;

    this.initializeData().then(() => {
      this.farmersCodebook = new CompanyUserCustomersByRoleService(this.companyControllerService, this.companyProfile?.id, 'FARMER');
      this.collectorsCodebook = new CompanyUserCustomersByRoleService(this.companyControllerService, this.companyProfile?.id, 'COLLECTOR');

      this.newPurchaseBulkOrder();

      this.updateValidators();
      this.initializeListManager();
      this.globalEventsManager.showLoading(false);
    });
  }

  private async initializeData() {

    const action = this.route.snapshot.data.action;
    if (!action) {
      return;
    }

    if (action === 'new') {

      this.title = this.newTitle();
      const facilityId = this.route.snapshot.params.facilityId;

      const response = await this.facilityControllerService.getFacility(facilityId).pipe(take(1)).toPromise();
      if (response && response.status === StatusEnum.OK && response.data) {
        this.facility = response.data;
        for (const item of this.facility.facilitySemiProductList) {
          if (item.buyable) {
            item.name = this.translateName(item);
            this.options.push(item);
          }
        }
        this.facilityNameForm.setValue(this.translateName(this.facility));
      }
    }

    if (this.companyProfile) {
      const obj = {};
      for (const user of this.companyProfile.users) {
        obj[user.id.toString()] = user.name + ' ' + user.surname;
      }
      this.codebookUsers = EnumSifrant.fromObject(obj);
    }
  }

  private initializeListManager() {

    this.additionalProofsListManager = new ListEditorManager<ApiActivityProof>(
        this.additionalProofsForm as UntypedFormArray,
        StockBulkDeliveryDetailsComponent.AdditionalProofItemEmptyObjectFormFactory(),
        ApiActivityProofValidationScheme
    );

  }

  private newPurchaseBulkOrder() {

    this.purchaseOrderBulkForm = generateFormFromMetadata(
        ApiPurchaseOrder.formMetadata(), {facility: {id: this.facility.id}}, ApiPurchaseOrderValidationScheme());

    this.emptyFarmersFormArray = generateFormFromMetadata(ApiPurchaseOrderFarmer.formMetadata(),
      defaultEmptyObject(ApiPurchaseOrderFarmer.formMetadata()) as ApiPurchaseOrderFarmer,  ApiPurchaseOrderFarmerValidationScheme());

    this.farmersFormArray.push(
      _.cloneDeep(this.emptyFarmersFormArray)
    );

    // Initialize preferred way of payments
    this.codebookPreferredWayOfPayment = EnumSifrant.fromObject(this.preferredWayOfPaymentList);

    // Set initial data
    if (this.selectedCurrency !== '-') {
      this.purchaseOrderBulkForm.get('currency').setValue(this.selectedCurrency);
    }

    this.setDate();

    // Set current logged-in user as employee
    this.employeeForm.setValue(this.currentLoggedInUser?.id.toString());

    // If only one semi-product select it as a default
    if (this.options && this.options.length === 1) {

      const index = 0;

      this.farmersFormArray.at(index).get('semiProduct').setValue(this.options[0]);
      this.setMeasureUnit(this.options[0].id, index).then();
    }

    this.prepareData();
  }


  async createBulkPurchaseOrder(close: boolean = true) {

    if (this.updatePOInProgress) {
      return;
    }
    this.updatePOInProgress = true;
    this.globalEventsManager.showLoading(true);
    this.submitted = true;

    // Set the user ID that creates the purchase order
    this.purchaseOrderBulkForm.get('creatorId').setValue(this.employeeForm.value);

    this.searchWomenCoffeeForm.forEach((next, index) => {
      // convert values for send
      if (this.showWomensOnly(index)) {
        this.farmersFormArray.at(index).get('womenShare').setValue(next.value === 'YES');
      }
    });

    this.prepareData();

    // Validate forms
    if (this.cannotUpdatePO()) {
      this.updatePOInProgress = false;
      this.globalEventsManager.showLoading(false);
      return;
    }

    // call for adding new bulk purchase
    // Set the identifier if we are creating new purchase order

    await this.setIdentifiers();

    this.farmersFormArray.controls.forEach((nextFormGroup, index) => {

      this.setToBePaid(index);

      this.setBalance(index);

    });

    const data: ApiPurchaseOrder = _.cloneDeep(this.purchaseOrderBulkForm.value);

    // Remove keys that are not set
    Object.keys(data).forEach((key) => (data[key] == null) && delete data[key]);

    // Create the purchase order
    try {

      const res = await this.stockOrderControllerService.createPurchaseOrderBulk(data).pipe(take(1)).toPromise();

      if (res && res.status === 'OK') {
        if (close) {
          this.dismiss();
        }
        else {
          this.purchaseOrderBulkForm.markAsPristine();

          this.employeeForm.markAsPristine();
          this.reloadOrder();
        }
      }
    } catch (e) {
      throw e;
    } finally {
      this.updatePOInProgress = false;
      this.globalEventsManager.showLoading(false);
    }
  }

  private cannotUpdatePO() {
    return (this.purchaseOrderBulkForm.invalid || this.employeeForm.invalid || this.checkWomenOnlyForm() ||
      this.checkAllTareInvalid()) || this.checkAllDamagedPriceDeductionInvalid();
  }

  private checkWomenOnlyForm(): boolean {
    const invalidExist = this.searchWomenCoffeeForm.find(control => control.invalid);
    return invalidExist !== undefined;
  }

  private checkAllTareInvalid(): boolean {
    const invalidExist = this.farmersFormArray.controls.find((control, index) => this.tareInvalidCheck(index));
    return invalidExist !== undefined;
  }

  tareInvalidCheck(idx: number) {
    const tare: number = Number(this.farmersFormArray.at(idx).get('tare').value).valueOf();
    const totalGrossQuantity: number = Number(this.farmersFormArray.at(idx).get('totalGrossQuantity').value).valueOf();
    return tare && totalGrossQuantity && (tare > totalGrossQuantity);
  }

  private checkAllDamagedPriceDeductionInvalid(): boolean {
    const invalidExist = this.farmersFormArray.controls.find((control, index) => this.damagedPriceDeductionInvalidCheck(index));
    return invalidExist !== undefined;
  }

  damagedPriceDeductionInvalidCheck(idx: number) {
    const damagedPriceDeduction: number = Number(this.farmersFormArray.at(idx).get('damagedPriceDeduction').value).valueOf();
    const pricePerUnit: number = Number(this.farmersFormArray.at(idx).get('pricePerUnit').value).valueOf();
    return damagedPriceDeduction && pricePerUnit && (damagedPriceDeduction > pricePerUnit);
  }

  damagedWeightDeductionInvalidCheck(idx: number) {
    const damagedWeightDeduction = Number(this.farmersFormArray.at(idx).get('damagedWeightDeduction').value).valueOf();
    const totalQuantity = Number(this.farmersFormArray.at(idx).get('totalQuantity').value).valueOf();
    return damagedWeightDeduction && totalQuantity && (damagedWeightDeduction > totalQuantity);
  }

  setFarmer(event: ApiUserCustomer, idx: number) {

    this.farmersFormArray.at(idx).get('producerUserCustomer').markAsDirty();
    this.farmersFormArray.at(idx).get('producerUserCustomer').updateValueAndValidity();
    this.codebookPreferredWayOfPayment = EnumSifrant.fromObject(this.preferredWayOfPaymentList);
  }

  setCollector(event: ApiUserCustomer) {

    if (event) {
      this.purchaseOrderBulkForm.get('representativeOfProducerUserCustomer').setValue({ id: event.id });
      if (this.purchaseOrderBulkForm.get('preferredWayOfPayment') && this.purchaseOrderBulkForm.get('preferredWayOfPayment').value === 'UNKNOWN') {
        this.purchaseOrderBulkForm.get('preferredWayOfPayment').setValue(null);
      }
    } else {
      this.purchaseOrderBulkForm.get('representativeOfProducerUserCustomer').setValue(null);
      if (this.purchaseOrderBulkForm.get('preferredWayOfPayment') && this.purchaseOrderBulkForm.get('preferredWayOfPayment').value === 'CASH_VIA_COLLECTOR') {
        this.purchaseOrderBulkForm.get('preferredWayOfPayment').setValue(null);
      }
    }

    this.purchaseOrderBulkForm.get('representativeOfProducerUserCustomer').markAsDirty();
    this.purchaseOrderBulkForm.get('representativeOfProducerUserCustomer').updateValueAndValidity();
    this.codebookPreferredWayOfPayment = EnumSifrant.fromObject(this.preferredWayOfPaymentList);
  }

  semiProductSelected(semiProduct , idx: number) {

    if (semiProduct) {
      this.setMeasureUnit(Number(semiProduct.id), idx).then();
    }

  }

  async setMeasureUnit(semiProdId: number, idx: number) {

    if (this.measureUnitArray[idx] === null || this.measureUnitArray[idx] === undefined) {
      // init value
      this.measureUnitArray.push('-');
    }

    const res = await this.semiProductControllerService.getSemiProduct(semiProdId).pipe(take(1)).toPromise();
    if (res && res.status === StatusEnum.OK && res.data) {
      this.measureUnitArray[idx] = res.data.measurementUnitType.label;
    } else {
      this.measureUnitArray[idx] = '-';
    }
  }

  setToBePaid(idx: number) {

    if (this.farmersFormArray.at(idx) && this.farmersFormArray.at(idx).get('totalGrossQuantity').value && this.farmersFormArray.at(idx).get('pricePerUnit').value) {
      let netWeight = this.farmersFormArray.at(idx).get('totalGrossQuantity').value;
      let finalPrice = this.farmersFormArray.at(idx).get('pricePerUnit').value;

      if (this.farmersFormArray.at(idx).get('tare').value) {
        netWeight -= this.farmersFormArray.at(idx).get('tare').value;
      }

      if (this.farmersFormArray.at(idx).get('damagedWeightDeduction').value) {
        netWeight -= this.farmersFormArray.at(idx).get('damagedWeightDeduction').value;
      }

      if (netWeight < 0) {
        netWeight = 0.00;
      }

      if (this.farmersFormArray.at(idx).get('damagedPriceDeduction').value) {
        finalPrice -= this.farmersFormArray.at(idx).get('damagedPriceDeduction').value;
      }

      if (finalPrice < 0) {
        finalPrice = 0.00;
      }

      this.farmersFormArray.at(idx).get('cost').setValue(Number(netWeight * finalPrice).toFixed(2));
    } else {

      this.farmersFormArray.at(idx).get('cost').setValue(null);
    }
  }

  setBalance(idx: number) {

    if (this.farmersFormArray.at(idx) && this.farmersFormArray.at(idx).get('cost').value !== null && this.farmersFormArray.at(idx).get('cost').value !== undefined) {
      this.farmersFormArray.at(idx).get('balance').setValue(this.farmersFormArray.at(idx).get('cost').value);
    } else {
      this.farmersFormArray.at(idx).get('balance').setValue(null);
    }
  }

  dismiss() {
    this.location.back();
  }

  get showCollector() {
    return this.facility && this.facility.displayMayInvolveCollectors;
  }

  get readonlyCollector() {
    return this.facility && !this.facility.displayMayInvolveCollectors;
  }

  showOrganic(idx: number) {
    return this.facility && this.facility.displayOrganic || this.farmersFormArray.at(idx).get('organic').value;
  }

  get readonlyOrganic() {
    return this.facility && !this.facility.displayOrganic;
  }

  showWomensOnly(idx: number) {
    return this.facility && this.facility.displayWomenOnly || this.farmersFormArray.at(idx).get('womenShare').value;
  }

  get readonlyWomensOnly() {
    return this.facility && !this.facility.displayWomenOnly;
  }

  showTare(idx: number) {
    return this.facility && this.facility.displayTare || this.farmersFormArray.at(idx).get('tare').value;
  }

  get readonlyTare() {
    return this.facility && !this.facility.displayTare;
  }

  showDamagedPriceDeduction(idx: number) {
    return this.facility && this.facility.displayPriceDeductionDamage || this.farmersFormArray.at(idx).get('damagedPriceDeduction').value;
  }

  showDamagedWeightDeduction(idx: number) {
    return this.facility && this.facility.displayWeightDeductionDamage || this.farmersFormArray.at(idx).get('damagedWeightDeduction').value;
  }

  get readonlyDamagedPriceDeduction() {
    return this.facility && !this.facility.displayPriceDeductionDamage;
  }

  get readonlyDamagedWeightDeduction() {
    return this.facility && !this.facility.displayWeightDeductionDamage;
  }

  netWeight(idx: number) {
    if (this.farmersFormArray.at(idx) && this.farmersFormArray.at(idx).get('totalGrossQuantity').value) {
      let netWeight = Number(this.farmersFormArray.at(idx).get('totalGrossQuantity').value);
      if (this.farmersFormArray.at(idx).get('tare').value) {
        netWeight -= Number(this.farmersFormArray.at(idx).get('tare').value);
      }
      if (this.farmersFormArray.at(idx).get('damagedWeightDeduction').value) {
        netWeight -= Number(this.farmersFormArray.at(idx).get('damagedWeightDeduction').value);
      }
      netWeight = Math.max(0, netWeight);
      this.netWeightFormArray[idx].setValue(netWeight.toFixed(2));
    } else {
      this.netWeightFormArray[idx].setValue(null);
    }
  }

  finalPrice(idx: number) {
    if (this.farmersFormArray.at(idx) && this.farmersFormArray.at(idx).get('pricePerUnit').value) {
      let finalPrice = this.farmersFormArray.at(idx).get('pricePerUnit').value;
      if (this.farmersFormArray.at(idx).get('damagedPriceDeduction').value) {
        finalPrice -= this.farmersFormArray.at(idx).get('damagedPriceDeduction').value;
      }

      if (finalPrice < 0) {
        finalPrice = 0.00;
      }

      this.finalPriceFormArray[idx].setValue(Number(finalPrice).toFixed(2));
    } else {
      this.finalPriceFormArray[idx].setValue(null);
    }
  }

  updateValidators() {

    this.farmersFormArray.controls.forEach((nextFormGroup, index) => {

        // This is for field organic
        nextFormGroup.get('organic').setValidators(
          this.facility &&
          this.facility.displayOrganic ?
            [Validators.required] : []
        );
        nextFormGroup.get('organic').updateValueAndValidity();

        // This is for field tare
        nextFormGroup.get('tare').setValidators(
          this.facility &&
          this.facility.displayTare ?
            [Validators.required] : []
        );
        nextFormGroup.get('tare').updateValueAndValidity();

        // This is for field damagedPriceDeduction
        nextFormGroup.get('damagedPriceDeduction').setValidators(
          this.facility &&
          this.facility.displayPriceDeductionDamage ?
            [Validators.required] : []
        );
        nextFormGroup.get('damagedPriceDeduction').updateValueAndValidity();

        // This is for field damagedWeightDeduction
        nextFormGroup.get('damagedWeightDeduction').setValidators(
            this.facility &&
            this.facility.displayWeightDeductionDamage ?
                [Validators.required] : []
        );
        nextFormGroup.get('damagedWeightDeduction').updateValueAndValidity();

        // This is for field womenShare
        nextFormGroup.get('womenShare').setValidators(
          this.facility &&
          this.facility.displayWomenOnly ?
            [Validators.required] : []
        );
        nextFormGroup.get('womenShare').updateValueAndValidity();

        this.searchWomenCoffeeForm[index].setValidators(
          this.facility &&
          this.facility.displayWomenOnly ?
            [Validators.required] : []
        );
        this.searchWomenCoffeeForm[index].updateValueAndValidity();
      }
    );
  }

  private setQuantities() {

    this.farmersFormArray.controls.forEach((nextFormGroup) => {
      if (nextFormGroup.get('totalGrossQuantity').valid) {

        let quantity = parseFloat(nextFormGroup.get('totalGrossQuantity').value);

        if (nextFormGroup.get('tare').value) {
          quantity -= nextFormGroup.get('tare').value;
        }

        if (quantity < 0) {
          quantity = 0.00;
        }

        let form = nextFormGroup.get('totalQuantity');
        form.setValue(quantity);
        form.updateValueAndValidity();

        form = nextFormGroup.get('fulfilledQuantity');
        form.setValue(quantity);
        form.updateValueAndValidity();

        form = nextFormGroup.get('availableQuantity');
        form.setValue(quantity);
        form.updateValueAndValidity();
      }
    });
  }

  private setDate() {
    const today = dateISOString(new Date());
    this.purchaseOrderBulkForm.get('productionDate').setValue(today);
  }

  private prepareData() {
    this.setQuantities();
    const pd = this.purchaseOrderBulkForm.get('productionDate').value;
    if (pd != null) {
      this.purchaseOrderBulkForm.get('productionDate').setValue(dateISOString(pd));
    }
  }

  addFarmerInfo() {

    let semiProductControlValue = null;

    // use size as new index
    const farmerListSize = this.farmersFormArray.length;

    // If only one semi-product, select it as a default
    if (this.options && this.options.length === 1) {
      semiProductControlValue =  this.options[0];
      this.setMeasureUnit(this.options[0].id, farmerListSize).then();
    }

    if (this.measureUnitArray[farmerListSize] === null || this.measureUnitArray[farmerListSize] === undefined) {
      // init value
      this.measureUnitArray.push('-');
    }

    this.netWeightFormArray.push(new UntypedFormControl(null));
    this.finalPriceFormArray.push(new UntypedFormControl(null));
    this.searchWomenCoffeeForm.push(new UntypedFormControl(null, Validators.required));

    // add new fields to form, and init semiProduct if only one available
    const emptyFarmersFormArrayNewItem = _.cloneDeep(this.emptyFarmersFormArray);
    (emptyFarmersFormArrayNewItem as UntypedFormGroup).get('semiProduct').setValue(semiProductControlValue);
    this.farmersFormArray.push(
      emptyFarmersFormArrayNewItem
    );

    this.updateValidators();

  }

  removeFarmer(idx) {
    this.farmersFormArray.removeAt(idx);
  }

  // get farmers form array
  get farmersFormArray() {
    return (this.purchaseOrderBulkForm.get('farmers') as UntypedFormArray);
  }

  checkRemoveFarmerIconShow(idx: number) {
    return (idx > 0) || (idx === 0 && this.farmersFormArray.length > 1);
  }

  private async setIdentifiers() {

    await Promise.all(this.farmersFormArray.controls.map(async (control) => {
        const farmerResponse = await this.companyControllerService
          .getUserCustomer(control.get('producerUserCustomer').value?.id).pipe(take(1)).toPromise();

        if (farmerResponse && farmerResponse.status === StatusEnum.OK && farmerResponse.data) {
          const identifier = 'PT-' + farmerResponse.data.surname + '-' + this.purchaseOrderBulkForm.get('productionDate').value;
          control.get('identifier').setValue(identifier);
        }
    }));

  }

  private translateName(obj) {
    return this.codebookTranslations.translate(obj, 'name');
  }

}
