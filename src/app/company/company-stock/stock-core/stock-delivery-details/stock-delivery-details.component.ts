import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors  } from '@angular/forms';
import { StockOrderType } from '../../../../../shared/types';
import { ActivatedRoute } from '@angular/router';
import { EnumSifrant } from '../../../../shared-services/enum-sifrant';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { CompanyUserCustomersByRoleService } from '../../../../shared-services/company-user-customers-by-role.service';
import { FacilityControllerService } from '../../../../../api/api/facilityController.service';
import { switchMap, take } from 'rxjs/operators';
import { ApiFacility } from '../../../../../api/model/apiFacility';
import { ApiSemiProduct } from '../../../../../api/model/apiSemiProduct';
import { CodebookTranslations } from '../../../../shared-services/codebook-translations';
import { CompanyControllerService } from '../../../../../api/api/companyController.service';
import { ApiUserCustomer } from '../../../../../api/model/apiUserCustomer';
import { ApiStockOrder } from '../../../../../api/model/apiStockOrder';
import {dateISOString, defaultEmptyObject, generateFormFromMetadata} from '../../../../../shared/utils';
import { ApiStockOrderValidationScheme } from './validation';
import { Location } from '@angular/common';
import { AuthService } from '../../../../core/auth.service';
import _ from 'lodash-es';
import { StockOrderControllerService } from '../../../../../api/api/stockOrderController.service';
import { ListEditorManager } from '../../../../shared/list-editor/list-editor-manager';
import { ApiActivityProofValidationScheme } from '../additional-proof-item/validation';
import { ApiActivityProof } from '../../../../../api/model/apiActivityProof';
import { SemiProductControllerService } from '../../../../../api/api/semiProductController.service';
import { ApiResponseApiCompanyGet } from '../../../../../api/model/apiResponseApiCompanyGet';
import StatusEnum = ApiResponseApiCompanyGet.StatusEnum;
import { SelectedUserCompanyService } from '../../../../core/selected-user-company.service';
import { ApiUserGet } from '../../../../../api/model/apiUserGet';
import { Subscription } from 'rxjs';
import { ApiCompanyGet } from '../../../../../api/model/apiCompanyGet';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-stock-delivery-details',
  templateUrl: './stock-delivery-details.component.html',
  styleUrls: ['./stock-delivery-details.component.scss']
})
export class StockDeliveryDetailsComponent implements OnInit, OnDestroy {

  title: string = null;

  update = true;

  stockOrderForm: FormGroup;
  order: ApiStockOrder;
  orderTypeForm = new FormControl(null);
  orderTypeCodebook = EnumSifrant.fromObject(this.orderTypeOptions);

  userLastChanged = null;

  submitted = false;

  codebookPreferredWayOfPayment: EnumSifrant;

  searchFarmers = new FormControl(null, Validators.required);
  searchCollectors = new FormControl(null);
  farmersCodebook: CompanyUserCustomersByRoleService;
  collectorsCodebook: CompanyUserCustomersByRoleService;

  employeeForm = new FormControl(null, Validators.required);
  codebookUsers: EnumSifrant;

  facilityNameForm = new FormControl(null);

  options: ApiSemiProduct[] = [];
  modelChoice = null;

  measureUnit = '-';
  selectedCurrency = '-';

  searchWomenCoffeeForm = new FormControl(null, Validators.required);
  codebookWomenCoffee = EnumSifrant.fromObject(this.womenCoffeeList);
  codebookOrganic = EnumSifrant.fromObject(this.yesNo);

  netWeightForm = new FormControl(null);
  finalPriceForm = new FormControl(null);

  updatePOInProgress = false;

  companyProfile: ApiCompanyGet | null = null;
  private currentLoggedInUser: ApiUserGet | null = null;

  private facility: ApiFacility;

  private purchaseOrderId = this.route.snapshot.params.purchaseOrderId;

  additionalProofsListManager = null;

  private userProfileSubs: Subscription;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private globalEventsManager: GlobalEventManagerService,
    private facilityControllerService: FacilityControllerService,
    private companyControllerService: CompanyControllerService,
    private stockOrderControllerService: StockOrderControllerService,
    private semiProductControllerService: SemiProductControllerService,
    private codebookTranslations: CodebookTranslations,
    private authService: AuthService,
    private selUserCompanyService: SelectedUserCompanyService,
    private toastr: ToastrService
  ) { }

  // Additional proof item factory methods (used when creating ListEditorManger)
  static AdditionalProofItemCreateEmptyObject(): ApiActivityProof {
    const object = ApiActivityProof.formMetadata();
    return defaultEmptyObject(object) as ApiActivityProof;
  }

  static AdditionalProofItemEmptyObjectFormFactory(): () => FormControl {
    return () => {
      return new FormControl(StockDeliveryDetailsComponent.AdditionalProofItemCreateEmptyObject(),
        ApiActivityProofValidationScheme.validators);
    };
  }

  get orderType(): StockOrderType {

    const realType = this.stockOrderForm && this.stockOrderForm.get('orderType').value;

    if (realType) {
      return realType;
    }

    if (this.route.snapshot.data.action === 'update') {
      if (this.order && this.order.orderType) {
        return this.order.orderType;
      }
      return null;
    }

    if (!this.route.snapshot.data.mode) {
      throw Error('No stock order mode set');
    }
    return this.route.snapshot.data.mode as StockOrderType;
  }

  get orderTypeOptions() {

    const obj = {};
    obj['GENERAL_ORDER'] = $localize`:@@orderType.codebook.generalOrder:General order`;
    obj['PROCESSING_ORDER'] = $localize`:@@orderType.codebook.processingOrder:Processing order`;
    obj['PURCHASE_ORDER'] = $localize`:@@orderType.codebook.purchaseOrder:Purchase order`;
    return obj;
  }

  get preferredWayOfPaymentList() {

    const obj = {};
    obj['CASH'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.cash:Cash`;

    if (this.stockOrderForm &&
      this.stockOrderForm.get('representativeOfProducerUserCustomer') &&
      this.stockOrderForm.get('representativeOfProducerUserCustomer').value) {

      obj['CASH_VIA_COLLECTOR'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.cashViaCollector:Cash via collector`;
    }

    if (this.stockOrderForm &&
      this.stockOrderForm.get('producerUserCustomer') &&
      this.stockOrderForm.get('producerUserCustomer').value &&
      this.stockOrderForm.get('representativeOfProducerUserCustomer') &&
      !this.stockOrderForm.get('representativeOfProducerUserCustomer').value) {

      obj['UNKNOWN'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.unknown:Unknown`;
    }

    obj['BANK_TRANSFER'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.bankTransfer:Bank transfer`;
    obj['CHEQUE'] = $localize`:@@preferredWayOfPayment.cheque:Cheque`;
    obj['OFFSETTING'] = $localize`:@@preferredWayOfPayment.offsetting:Cheque`;

    return obj;
  }

  get quantityLabel() {
    if (this.orderType === 'PURCHASE_ORDER') {
      return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.quantityDelievered.label:Quantity` + ` (${this.measureUnit})`;
    } else {
      return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.quantity.label:Quantity (units)`;
    }
  }

  get tareLabel() {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.tare.label:Tare` + ` (${this.measureUnit})`;
  }

  get netLabel() {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.netWeight.label:Net weight` + ` (${this.measureUnit})`;
  }

  get finalPriceLabel() {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.finalPrice.label:Final price` + ` (${this.selectedCurrency}/${this.measureUnit})`;
  }

  get pricePerUnitLabel() {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.pricePerUnit.label:Price per unit` + ` (${this.selectedCurrency}/${this.measureUnit})`;
  }

  get costLabel() {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.cost.label:Base payment` + ` (${this.selectedCurrency})`;
  }

  get balanceLabel() {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.balance.label:Open balance` + ` (${this.selectedCurrency})`;
  }

  get damagedPriceDeductionLabel() {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.damagedPriceDeduction.label: Deduction` + ` (${this.selectedCurrency}/${this.measureUnit})`;
  }

  get damagedWeightDeductionLabel() {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.damagedWeightDeduction.label: Deduction` + ` (${this.measureUnit})`;
  }

  get additionalProofsForm(): FormArray {
    return this.stockOrderForm.get('activityProofs') as FormArray;
  }

  // get additionalProofsForm(): FormArray {
  //   const formArray = this.stockOrderForm.get('activityProofs') as FormArray;
    
  //   // Applique le validateur personnalisé
  //   formArray.setValidators([this.validateAtLeastOneFileSelected()]);    
    
  //   return formArray;
  // }

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

  private newTitle(pageMode: StockOrderType) {
    switch (pageMode) {
      case 'GENERAL_ORDER':
        return $localize`:@@productLabelStockPurchaseOrdersModal.newGeneralOrderTitle:New transfer order`;
      case 'PROCESSING_ORDER':
        return $localize`:@@productLabelStockPurchaseOrdersModal.newProcessingOrderTitle:New processing order`;
      case 'PURCHASE_ORDER':
        return $localize`:@@productLabelStockPurchaseOrdersModal.newPurchaseOrderTitle:New purchase order`;
      default:
        return null;
    }
  }

  updateTitle(pageMode: StockOrderType) {
    switch (pageMode) {
      case 'GENERAL_ORDER':
        return $localize`:@@productLabelStockPurchaseOrdersModal.updateGeneralOrderTitle:Update transfer order`;
      case 'PROCESSING_ORDER':
        return $localize`:@@productLabelStockPurchaseOrdersModal.updateProcessingOrderTitle:Update processing order`;
      case 'PURCHASE_ORDER':
        return $localize`:@@productLabelStockPurchaseOrdersModal.updatePurchaseOrderTitle:Update purchase order`;
      default:
        return null;
    }
  }

  private reloadOrder() {

    this.globalEventsManager.showLoading(true);
    this.submitted = false;

    this.initializeData().then(() => {
      this.farmersCodebook = new CompanyUserCustomersByRoleService(this.companyControllerService, this.companyProfile?.id, 'FARMER');
      this.collectorsCodebook = new CompanyUserCustomersByRoleService(this.companyControllerService, this.companyProfile?.id, 'COLLECTOR');

      if (this.update) {
        this.editStockOrder().then();
      } else {
        this.newStockOrder();
      }
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

      this.update = false;
      this.title = this.newTitle(this.orderType);
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

    } else if (action === 'update') {

      this.update = true;

      const stockOrderResponse = await this.stockOrderControllerService.getStockOrder(this.purchaseOrderId).pipe(take(1)).toPromise();
      if (stockOrderResponse && stockOrderResponse.status === StatusEnum.OK && stockOrderResponse.data) {

        this.order = stockOrderResponse.data;
        this.title = this.updateTitle(this.orderType);
        this.facility = stockOrderResponse.data.facility;

        for (const item of this.facility.facilitySemiProductList) {
          if (item.buyable) {
            item.name = this.translateName(item);
            this.options.push(item);
          }
        }
        this.facilityNameForm.setValue(this.translateName(this.facility));
      }
    } else {
      throw Error('Wrong action.');
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
      this.additionalProofsForm as FormArray,
      StockDeliveryDetailsComponent.AdditionalProofItemEmptyObjectFormFactory(),
      ApiActivityProofValidationScheme
    );
  
    // Appliquer le validateur
    // this.additionalProofsForm.setValidators([this.validateAtLeastOneFile()]);
  }

  private newStockOrder() {

    this.stockOrderForm = generateFormFromMetadata(ApiStockOrder.formMetadata(), { facility: { id: this.facility.id } }, ApiStockOrderValidationScheme(this.orderType));

    // Initialize preferred way of payments
    this.codebookPreferredWayOfPayment = EnumSifrant.fromObject(this.preferredWayOfPaymentList);

    // Set initial data
    if (this.selectedCurrency !== '-') {
      this.stockOrderForm.get('currency').setValue(this.selectedCurrency);
    }

    this.stockOrderForm.get('orderType').setValue(this.orderType);
    this.setDate();

    // Set current logged-in user as employee
    this.employeeForm.setValue(this.currentLoggedInUser?.id.toString());

    // If only one semi-product select it as a default
    if (this.options && this.options.length === 1) {
      this.modelChoice = this.options[0].id;
      this.stockOrderForm.get('semiProduct').setValue({ id: this.options[0].id });
      this.setMeasureUnit(this.modelChoice).then();
    }

    this.prepareData();
  }

  private async editStockOrder() {

    // Generate the form
    this.stockOrderForm = generateFormFromMetadata(ApiStockOrder.formMetadata(), this.order, ApiStockOrderValidationScheme(this.orderType));

    // Initialize preferred way of payments
    this.codebookPreferredWayOfPayment = EnumSifrant.fromObject(this.preferredWayOfPaymentList);

    if (this.orderType === 'PURCHASE_ORDER') {
      this.selectedCurrency = this.stockOrderForm.get('currency').value ? this.stockOrderForm.get('currency').value : '-';
      this.searchFarmers.setValue(this.order.producerUserCustomer);
      if (this.order.representativeOfProducerUserCustomer && this.order.representativeOfProducerUserCustomer.id) {
        this.searchCollectors.setValue(this.order.representativeOfProducerUserCustomer);
      }
    }

    this.modelChoice = this.order.semiProduct?.id;
    if (this.modelChoice) {
      this.setMeasureUnit(this.modelChoice).then();
    }

    this.employeeForm.setValue(this.order.creatorId.toString());
    this.searchWomenCoffeeForm.setValue(this.order.womenShare ? 'YES' : 'NO');

    // TODO: set documents and payments if purchase order

    if (this.order.updatedBy && this.order.updatedBy.id) {
      const userUpdatedBy = this.order.updatedBy;
      this.userLastChanged = `${userUpdatedBy.name} ${userUpdatedBy.surname}`;
    } else if (this.order.createdBy && this.order.createdBy.id) {
      const userCreatedBy = this.order.createdBy;
      this.userLastChanged = `${userCreatedBy.name} ${userCreatedBy.surname}`;
    }

    if (this.stockOrderForm.get('organic').value != null) {
      this.stockOrderForm.get('organic').setValue(this.stockOrderForm.get('organic').value.toString());
    }

    if (this.stockOrderForm.get('priceDeterminedLater').value) {
      this.stockOrderForm.get('pricePerUnit').clearValidators();
      this.stockOrderForm.get('damagedPriceDeduction').clearValidators();
    }
    this.stockOrderForm.updateValueAndValidity();
  }

  async createOrUpdatePurchaseOrder(close: boolean = true) {

    if (this.updatePOInProgress) {
      return;
    }
    this.updatePOInProgress = true;
    this.globalEventsManager.showLoading(true);
    this.submitted = true;

    // Forcer la validation des preuves supplémentaires
  // this.additionalProofsForm.updateValueAndValidity();

  // Vérifier si des fichiers sont requis mais manquants
  const orderTyp = this.stockOrderForm?.get('orderType')?.value;
 
  if (this.additionalProofsForm.value==0 && orderTyp !== 'PURCHASE_ORDER') {
    this.toastr.error($localize`:@@additionalProofs.error.noFileSelected:At least one file must be selected for additional proof`);
    this.globalEventsManager.showLoading(false);
    this.updatePOInProgress = false;
    return;
  }
    // Set the user ID that creates the purchase order
    this.stockOrderForm.get('creatorId').setValue(this.employeeForm.value);

    // Set women share field
    this.stockOrderForm.get('womenShare').setValue(this.searchWomenCoffeeForm.value === 'YES');

    // Validate forms
    if (this.cannotUpdatePO()) {
      this.updatePOInProgress = false;
      this.globalEventsManager.showLoading(false);
      return;
    }

    // Set the identifier if we are creating new purchase order
    if (!this.update) {
      await this.setIdentifier();
    }

    const data: ApiStockOrder = _.cloneDeep(this.stockOrderForm.value);

    
      // Remove keys that are not set
    Object.keys(data).forEach((key) => (data[key] == null) && delete data[key]);
    console.log("Data affter removing empty keys");
    console.log(data);
    // Create the purchase order
    try {

      const res = await this.stockOrderControllerService.createOrUpdateStockOrder(data).pipe(take(1)).toPromise();

      if (res && res.status === 'OK') {
        if (close) {
          this.dismiss();
        }
        else {
          this.stockOrderForm.markAsPristine();
          this.searchFarmers.markAsPristine();
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
    this.prepareData();
    return (this.stockOrderForm.invalid || this.searchFarmers.invalid ||
      this.employeeForm.invalid || !this.modelChoice || this.searchWomenCoffeeForm.invalid ||
      this.tareInvalidCheck || this.damagedPriceDeductionInvalidCheck);
  }

  onSelectedType(type: StockOrderType) {
    switch (type as StockOrderType) {
      case 'PURCHASE_ORDER':
        this.stockOrderForm.get('orderType').setValue(type);
        return;
      case 'GENERAL_ORDER':
      case 'PROCESSING_ORDER':
        return;
      default:
        throw Error('Wrong order type: ' + type);
    }
  }

  setFarmer(event: ApiUserCustomer) {

    if (event) {
      this.stockOrderForm.get('producerUserCustomer').setValue({ id: event.id });
    } else {
      this.stockOrderForm.get('producerUserCustomer').setValue(null);
    }

    this.stockOrderForm.get('producerUserCustomer').markAsDirty();
    this.stockOrderForm.get('producerUserCustomer').updateValueAndValidity();
    this.codebookPreferredWayOfPayment = EnumSifrant.fromObject(this.preferredWayOfPaymentList);
  }

  setCollector(event: ApiUserCustomer) {

    if (event) {
      this.stockOrderForm.get('representativeOfProducerUserCustomer').setValue({ id: event.id });
      if (this.stockOrderForm.get('preferredWayOfPayment') && this.stockOrderForm.get('preferredWayOfPayment').value === 'UNKNOWN') {
        this.stockOrderForm.get('preferredWayOfPayment').setValue(null);
      }
    } else {
      this.stockOrderForm.get('representativeOfProducerUserCustomer').setValue(null);
      if (this.stockOrderForm.get('preferredWayOfPayment') && this.stockOrderForm.get('preferredWayOfPayment').value === 'CASH_VIA_COLLECTOR') {
        this.stockOrderForm.get('preferredWayOfPayment').setValue(null);
      }
    }

    this.stockOrderForm.get('representativeOfProducerUserCustomer').markAsDirty();
    this.stockOrderForm.get('representativeOfProducerUserCustomer').updateValueAndValidity();
    this.codebookPreferredWayOfPayment = EnumSifrant.fromObject(this.preferredWayOfPaymentList);
  }

  semiProductSelected(id: string) {

    if (id) {
      this.stockOrderForm.get('semiProduct').setValue({ id });
      this.setMeasureUnit(Number(id)).then();
    } else {
      this.stockOrderForm.get('semiProduct').setValue(null);
    }

    this.stockOrderForm.get('semiProduct').markAsDirty();
    this.stockOrderForm.get('semiProduct').updateValueAndValidity();
  }

  async setMeasureUnit(semiProdId: number) {

    const res = await this.semiProductControllerService.getSemiProduct(semiProdId).pipe(take(1)).toPromise();
    if (res && res.status === StatusEnum.OK && res.data) {
      this.measureUnit = res.data.measurementUnitType.label;
    } else {
      this.measureUnit = '-';
    }
  }

  setToBePaid() {

    if (this.stockOrderForm && this.stockOrderForm.get('totalGrossQuantity').value && this.stockOrderForm.get('pricePerUnit').value) {
      let netWeight = this.stockOrderForm.get('totalGrossQuantity').value;
      let finalPrice = this.stockOrderForm.get('pricePerUnit').value;

      if (this.stockOrderForm.get('tare').value) {
        netWeight -= this.stockOrderForm.get('tare').value;
      }

      if (this.stockOrderForm.get('damagedWeightDeduction').value) {
        netWeight -= this.stockOrderForm.get('damagedWeightDeduction').value;
      }

      if (netWeight < 0) {
        netWeight = 0.00;
      }

      if (this.stockOrderForm.get('damagedPriceDeduction').value) {
        finalPrice -= this.stockOrderForm.get('damagedPriceDeduction').value;
      }

      if (finalPrice < 0) {
        finalPrice = 0.00;
      }

      this.stockOrderForm.get('cost').setValue(Number(netWeight * finalPrice).toFixed(2));
    } else {

      this.stockOrderForm.get('cost').setValue(null);
    }
  }

  setBalance() {

    if (this.stockOrderForm && this.stockOrderForm.get('cost').value !== null && this.stockOrderForm.get('cost').value !== undefined) {
        this.stockOrderForm.get('balance').setValue(this.stockOrderForm.get('cost').value);
    } else {

      this.stockOrderForm.get('balance').setValue(null);
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

  get showOrganic() {
    return this.facility && this.facility.displayOrganic || this.stockOrderForm.get('organic').value;
  }

  get readonlyOrganic() {
    return this.facility && !this.facility.displayOrganic;
  }
  
  get showWomensOnly() {
    return this.facility && this.facility.displayWomenOnly || this.searchWomenCoffeeForm.value;
  }

  get readonlyWomensOnly() {
    return this.facility && !this.facility.displayWomenOnly;
  }

  get showTare() {
    return this.facility && this.facility.displayTare || this.stockOrderForm.get('tare').value;
  }

  get readonlyTare() {
    return this.facility && !this.facility.displayTare;
  }

  get showDamagedPriceDeduction() {
    return this.facility && this.facility.displayPriceDeductionDamage || this.stockOrderForm.get('damagedPriceDeduction').value;
  }

  get showDamagedWeightDeduction() {
    return this.facility && this.facility.displayWeightDeductionDamage || this.stockOrderForm.get('damagedWeightDeduction').value;
  }

  get readonlyDamagedPriceDeduction() {
    return this.facility && !this.facility.displayPriceDeductionDamage || this.stockOrderForm.get('priceDeterminedLater').value;
  }

  get readonlyDamagedWeightDeduction() {
    return this.facility && !this.facility.displayWeightDeductionDamage;
  }

  netWeight() {
    if (this.stockOrderForm && this.stockOrderForm.get('totalGrossQuantity').value) {
      let netWeight = Number(this.stockOrderForm.get('totalGrossQuantity').value);
      if (this.stockOrderForm.get('tare').value) {
        netWeight -= Number(this.stockOrderForm.get('tare').value);
      }
      if (this.stockOrderForm.get('damagedWeightDeduction').value) {
        netWeight -= Number(this.stockOrderForm.get('damagedWeightDeduction').value);
      }
      netWeight = Math.max(0, netWeight);
      this.netWeightForm.setValue(netWeight.toFixed(2));
    } else {
      this.netWeightForm.setValue(null);
    }
  }

  finalPrice() {
    if (this.stockOrderForm && this.stockOrderForm.get('pricePerUnit').value) {
      let finalPrice = this.stockOrderForm.get('pricePerUnit').value;
      if (this.stockOrderForm.get('damagedPriceDeduction').value) {
        finalPrice -= this.stockOrderForm.get('damagedPriceDeduction').value;
      }

      if (finalPrice < 0) {
        finalPrice = 0.00;
      }

      this.finalPriceForm.setValue(Number(finalPrice).toFixed(2));
    } else {
      this.finalPriceForm.setValue(null);
    }
  }

  updateValidators() {
    this.stockOrderForm.get('organic').setValidators(
        this.orderType === 'PURCHASE_ORDER' &&
        this.facility &&
        this.facility.displayOrganic ?
            [Validators.required] : []
    );
    this.stockOrderForm.get('organic').updateValueAndValidity();
    this.stockOrderForm.get('tare').setValidators(
        this.orderType === 'PURCHASE_ORDER' &&
        this.facility &&
        this.facility.displayTare ?
            [Validators.required] : []
    );
    this.stockOrderForm.get('tare').updateValueAndValidity();
    this.stockOrderForm.get('damagedPriceDeduction').setValidators(
        this.orderType === 'PURCHASE_ORDER' &&
        this.facility &&
        this.facility.displayPriceDeductionDamage &&
        !this.stockOrderForm.get('priceDeterminedLater').value ?
            [Validators.required] : []
    );
    this.stockOrderForm.get('damagedPriceDeduction').updateValueAndValidity();
    this.stockOrderForm.get('damagedWeightDeduction').setValidators(
        this.orderType === 'PURCHASE_ORDER' &&
        this.facility &&
        this.facility.displayWeightDeductionDamage ?
            [Validators.required] : []
    );
    this.stockOrderForm.get('damagedWeightDeduction').updateValueAndValidity();
    this.searchWomenCoffeeForm.setValidators(
        this.orderType === 'PURCHASE_ORDER' &&
        this.facility &&
        this.facility.displayWomenOnly ?
            [Validators.required] : []
    );
    this.searchWomenCoffeeForm.updateValueAndValidity();
  }

  get tareInvalidCheck() {
      const tare: number = Number(this.stockOrderForm.get('tare').value).valueOf();
      const totalGrossQuantity: number = Number(this.stockOrderForm.get('totalGrossQuantity').value).valueOf();
      return tare && totalGrossQuantity && (tare > totalGrossQuantity);
  }

  get damagedPriceDeductionInvalidCheck() {
    const damagedPriceDeduction: number = Number(this.stockOrderForm.get('damagedPriceDeduction').value).valueOf();
    const pricePerUnit: number = Number(this.stockOrderForm.get('pricePerUnit').value).valueOf();
    return damagedPriceDeduction && pricePerUnit && (damagedPriceDeduction > pricePerUnit);
  }

  get damagedWeightDeductionInvalidCheck() {
    const damagedWeightDeduction = Number(this.stockOrderForm.get('damagedWeightDeduction').value).valueOf();
    const totalQuantity = Number(this.stockOrderForm.get('totalQuantity').value).valueOf();
    return damagedWeightDeduction && totalQuantity && (damagedWeightDeduction > totalQuantity);
  }

  private setQuantities() {

    if (this.stockOrderForm.get('totalGrossQuantity').valid) {

      let quantity = parseFloat(this.stockOrderForm.get('totalGrossQuantity').value);

      if (this.stockOrderForm.get('tare').value) {
        quantity -= this.stockOrderForm.get('tare').value;
      }

      if (quantity < 0) {
        quantity = 0.00;
      }

      let form = this.stockOrderForm.get('totalQuantity');
      form.setValue(quantity);
      form.updateValueAndValidity();

      form = this.stockOrderForm.get('fulfilledQuantity');
      form.setValue(quantity);
      form.updateValueAndValidity();

      form = this.stockOrderForm.get('availableQuantity');
      form.setValue(quantity);
      form.updateValueAndValidity();
    }
  }

  private setDate() {
    const today = dateISOString(new Date());
    this.stockOrderForm.get('productionDate').setValue(today);
  }

  private prepareData() {
    this.setQuantities();
    const pd = this.stockOrderForm.get('productionDate').value;
    if (pd != null) {
      this.stockOrderForm.get('productionDate').setValue(dateISOString(pd));
    }
  }

  private async setIdentifier() {

    const farmerResponse = await this.companyControllerService
      .getUserCustomer(this.stockOrderForm.get('producerUserCustomer').value?.id).pipe(take(1)).toPromise();

    if (farmerResponse && farmerResponse.status === StatusEnum.OK && farmerResponse.data) {
      const identifier = 'PT-' + farmerResponse.data.surname + '-' + this.stockOrderForm.get('productionDate').value;
      this.stockOrderForm.get('identifier').setValue(identifier);
    }
  }

  private translateName(obj) {
    return this.codebookTranslations.translate(obj, 'name');
  }

  get displayPriceDeterminedLater() {
    return this.facility.displayPriceDeterminedLater;
  }

  priceDeterminedLaterChanged() {
    // change validation for price per unit based on
    if (this.stockOrderForm.get('priceDeterminedLater').value) {
      this.stockOrderForm.get('pricePerUnit').clearValidators();
      this.stockOrderForm.get('pricePerUnit').setValue(null);
      this.stockOrderForm.get('damagedPriceDeduction').setValue(null);
      this.updateValidators();
    } else {
      this.stockOrderForm.get('pricePerUnit').setValidators(ApiStockOrderValidationScheme(this.orderType).fields.pricePerUnit.validators);
      this.updateValidators();
    }

    this.stockOrderForm.get('pricePerUnit').updateValueAndValidity();
  }

  // Permet de valider si le composant a au moins 1 fichier passe
validateAtLeastOneFileSelected(): ValidatorFn {
  return (control): { [key: string]: boolean } | null => {
    const formArray = control as FormArray;
    const hasFile = formArray.controls.some(ctrl => {
      const value = ctrl.value;
      
      // Cas 1: Fichier direct
      if (value instanceof File) return true;
      
      // Cas 2: Objet avec propriétés de fichier
      if (value && typeof value === 'object') {
        return value.fileName && value.fileSize;
      }
      
      // Cas 3: Base64 ou autre représentation
      if (typeof value === 'string') {
        return value.startsWith('data:') || value.length > 100;
      }
      
      return false;
    });
    
    return hasFile ? null : { 'requiredFile': true };
  };
}

}
