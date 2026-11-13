import { Component, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, UntypedFormArray, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import _ from 'lodash-es';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ApiUserCustomer } from '../../../../api/model/apiUserCustomer';
import { CompanyControllerService } from '../../../../api/api/companyController.service';
import { defaultEmptyObject, generateFormFromMetadata } from '../../../../shared/utils';
import {
  ApiUserCustomerCooperativeValidationScheme,
  ApiUserCustomerValidationScheme
} from '../../company-collectors/company-collectors-details/validation';
import { ApiBankInformation } from '../../../../api/model/apiBankInformation';
import { ApiFarmInformation } from '../../../../api/model/apiFarmInformation';
import { ApiLocation } from '../../../../api/model/apiLocation';
import { ApiAddress } from '../../../../api/model/apiAddress';
import { debounceTime, first, startWith, take } from 'rxjs/operators';
import { EnumSifrant } from '../../../shared-services/enum-sifrant';
import { ThemeService } from '../../../shared-services/theme.service';
import { environment } from '../../../../environments/environment';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';
import { ApiCompany } from '../../../../api/model/apiCompany';
import { ListEditorManager } from '../../../shared/list-editor/list-editor-manager';
import { ApiUserCustomerCooperative } from '../../../../api/model/apiUserCustomerCooperative';
import UserCustomerTypeEnum = ApiUserCustomerCooperative.UserCustomerTypeEnum;
import { BehaviorSubject, Subscription } from 'rxjs';
import { ApiStockOrder } from '../../../../api/model/apiStockOrder';
import { ApiCertification } from '../../../../api/model/apiCertification';
import { ApiCertificationValidationScheme } from '../../../m-product/product-label/validation';
import { CompanyProductTypesService } from '../../../shared-services/company-product-types.service';
import { ApiProductType } from '../../../../api/model/apiProductType';
import { ListNotEmptyValidator } from '../../../../shared/validation';
import { ApiPayment } from '../../../../api/model/apiPayment';
import { ApiFarmPlantInformation } from '../../../../api/model/apiFarmPlantInformation';
import { SelectedUserCompanyService } from '../../../core/selected-user-company.service';
import { FileSaverService } from 'ngx-filesaver';
import { HttpClient } from '@angular/common/http';
import { SelfOnboardingService } from '../../../shared-services/self-onboarding.service';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-company-farmers-details',
    templateUrl: './company-farmers-details.component.html',
    styleUrls: ['./company-farmers-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CompanyFarmersDetailsComponent implements OnInit, OnDestroy {

  faTimes = faTimes;

  subscriptions: Subscription[] = [];

  title: string;
  update: boolean;
  company: ApiCompany;
  companyId;
  farmer: ApiUserCustomer;
  farmerForm: UntypedFormGroup;
  submitted = false;
  qrCodeSize = 110;
  appName = environment.appName;

  openBalanceOnly = false;
  deliveries = [];
  payments = [];

  producersListManager;
  codebookAssoc: EnumSifrant;
  codebookCoop;
  assocCoop;
  assocForm = new UntypedFormControl(null);

  genderCodebook = EnumSifrant.fromObject({
    MALE: $localize`:@@collectorDetail.gender.male:Male`,
    FEMALE: $localize`:@@collectorDetail.gender.female:Female`,
    N_A: 'N/A',
    DIVERSE: $localize`:@@collectorDetail.gender.diverse:Diverse`
  });

  readonly farmerType = UserCustomerTypeEnum.FARMER;

  // payments table parameters
  showedPaymentOrders = 0;
  allPaymentOrders = 0;
  selectedPayments: ApiPayment[];

  farmerIdPing$ = new BehaviorSubject<number>(this.route.snapshot.params.id);
  productTypesForm = new UntypedFormControl(null);
  productTypes: ApiProductType[] = [];
  productTypesCodebook: CompanyProductTypesService;
  selectedProductTypesForm = new UntypedFormControl(null, [ListNotEmptyValidator()]);

  // Deliveries table parameters
  showedDeliveries = 0;
  allDeliveries = 0;
  selectedOrders: ApiStockOrder[];

  certificationListManager = null;

  sortOptionsPay = [
    {
      key: 'date',
      name: $localize`:@@collectorDetail.sortOptionsPay.date.name:Date`,
    },
    {
      key: 'number',
      name: $localize`:@@collectorDetail.sortOptionsPay.number.name:Receipt number`,
      inactive: true
    },
    {
      key: 'purpose',
      name: $localize`:@@collectorDetail.sortOptionsPay.purpose.name:Payment purpose`,
      inactive: true
    },
    {
      key: 'amount',
      name: $localize`:@@collectorDetail.sortOptionsPay.amount.name:Amount paid to farmer (RWF)`,
      inactive: true
    },
    {
      key: 'amountCollector',
      name: $localize`:@@collectorDetail.sortOptionsPay.amountCollector.name:Amount paid to collector (RWF)`,
      inactive: true
    },
    {
      key: 'purchase',
      name: $localize`:@@collectorDetail.sortOptionsPay.purchase.name:Purchase order`,
      inactive: true
    },
    {
      key: 'status',
      name: $localize`:@@collectorDetail.sortOptionsPay.status.name:Status`,
      inactive: true
    }
  ];

  sortOptionsPO = [
    {
      key: 'date',
      name: $localize`:@@collectorDetail.sortOptionsPO.date.name:Date`,
    },
    {
      key: 'identifier',
      name: $localize`:@@collectorDetail.sortOptionsPO.identifier.name:Name`,
      inactive: true
    },
    {
      key: 'quantity',
      name: $localize`:@@collectorDetail.sortOptionsPO.quantity.name:Quantity (kg)`,
      inactive: true
    },
    {
      key: 'payableAndBalance',
      name: $localize`:@@collectorDetail.sortOptionsPO.payableAndBalance.name:Payable / Balance`,
      inactive: true
    }
  ];

  @ViewChild('newFarmerTitleTooltip')
  newFarmerTitleTooltip: NgbTooltip;

  public areaTranslations = {
    totalCultivatedLabel: $localize`:@@collectorDetail.textinput.totalCultivatedArea.label:Total cultivated area`,
    totalCultivatedPlaceholder: $localize`:@@collectorDetail.textinput.totalCultivatedArea.placeholder:Enter total cultivated area`,
    plantCultivatedLabel: $localize`:@@collectorDetail.textinput.plantCultivatedArea.label:Area cultivated with`,
    plantCultivatedPlaceholder: $localize`:@@collectorDetail.textinput.plantCultivatedArea.placeholder:Enter area cultivated with`,
    organicCertifiedLabel: $localize`:@@collectorDetail.textinput.areaOrganicCertified.label:Organic certified area`,
    organicCertifiedPlaceholder: $localize`:@@collectorDetail.textinput.areaOrganicCertified.placeholder:Enter organic certified area`,
    numberOfPlantsLabel: $localize`:@@collectorDetail.textinput.numberOfPlants.label:Number of plants`,
    numberOfPlantsPlaceholder: $localize`:@@collectorDetail.textinput.numberOfPlants.placeholder:Enter number of plants`,
  };

  constructor(
      private location: Location,
      private route: ActivatedRoute,
      private companyService: CompanyControllerService,
      private globalEventsManager: GlobalEventManagerService,
      private selUserCompanyService: SelectedUserCompanyService,
      public theme: ThemeService,
      private fileSaverService: FileSaverService,
      private httpClient: HttpClient,
      private selfOnboardingService: SelfOnboardingService,
      private router: Router
  ) { }

  static ApiUserCustomerCooperativeCreateEmptyObject(): ApiUserCustomerCooperative {
    const obj: ApiUserCustomerCooperative = defaultEmptyObject(ApiUserCustomerCooperative.formMetadata());
    obj.company = defaultEmptyObject(ApiCompany.formMetadata());
    return obj;
  }

  static ApiUserCustomerCooperativeEmptyObjectFormFactory(): () => UntypedFormControl {
    return () => {
      return new UntypedFormControl(CompanyFarmersDetailsComponent.ApiUserCustomerCooperativeCreateEmptyObject(),
        ApiUserCustomerCooperativeValidationScheme.validators);
    };
  }

  static ApiCertificationCreateEmptyObject(): ApiCertification {
    const obj = ApiCertification.formMetadata();
    return defaultEmptyObject(obj) as ApiCertification;
  }

  static ApiCertificationEmptyObjectFormFactory(): () => UntypedFormControl {
    return () => {
      return new UntypedFormControl(CompanyFarmersDetailsComponent.ApiCertificationCreateEmptyObject(), ApiCertificationValidationScheme.validators);
    };
  }

  get certifications(): AbstractControl[] {
    return (this.farmerForm.get('certifications') as UntypedFormArray).controls;
  }

  get farmPlantInfos(): AbstractControl[] {
    return (this.farmerForm.get('farm.farmPlantInformationList') as UntypedFormArray).controls;
  }

  ngOnInit(): void {
    this.farmerForm = null;
    this.initData().then(() => {
      if (!this.update) {
        this.newFarmer();
      } else {
        this.editFarmer();
      }

      this.farmerForm.setControl('productTypes', this.selectedProductTypesForm);

      this.selectedProductTypesForm.setValue(this.productTypes);

      this.productTypesCodebook = new CompanyProductTypesService(this.companyService, this.companyId);

      this.initializeListManager();
      this.updateAreaUnitValidators();
      this.initValueChangeListeners();
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  async initData() {

    const action = this.route.snapshot.data.action;
    if (!action) { return; }

    this.company = await this.selUserCompanyService.selectedCompanyProfile$.pipe(take(1)).toPromise();
    if (!this.company) { return; }

    this.companyId = this.company.id;

    switch (action) {
      case 'new': {
        this.title = $localize`:@@collectorDetail.newFarmer.title:New farmer`;
        this.update = false;
        // this code sets the default product type, when only 1 is available
        const defaultProdTypeCheck = await this.companyService.getCompanyProductTypes(this.companyId).pipe(take(1)).toPromise();
        if (defaultProdTypeCheck && defaultProdTypeCheck.status === 'OK') {
          if (defaultProdTypeCheck.data.count === 1) {
            this.productTypes = defaultProdTypeCheck.data.items;
          }
        }
        break;
      }
      case 'update': {
        this.title = $localize`:@@collectorDetail.editFarmer.title:Edit farmer`;
        this.update = true;
        const uc = await this.companyService.getUserCustomer(this.route.snapshot.params.id).pipe(first()).toPromise();
        if (uc && uc.status === 'OK') {
          this.farmer = uc.data;
          this.productTypes = uc.data.productTypes;
        }
        break;
      }
      default:
        throw Error('Wrong action!');
    }

    this.listOfOrgProducer().then();
    this.listOfOrgAssociation().then();
  }

  private prefillFarmPlantInformation(): void {

    const farmPlantInformationList = this.farmerForm.get('farm.farmPlantInformationList') as UntypedFormArray;
    if (farmPlantInformationList == null) {
      return;
    }

    const listControls = (farmPlantInformationList).controls;
    const newListControls: AbstractControl[] = [];
    listControls.forEach(control => {
      const farmPlantInformation = control.value as ApiFarmPlantInformation;

      const formGroup = new UntypedFormGroup({
        productType: new UntypedFormControl(farmPlantInformation.productType),
        plantCultivatedArea: new UntypedFormControl(farmPlantInformation.plantCultivatedArea),
        numberOfPlants: new UntypedFormControl(farmPlantInformation.numberOfPlants)
      });

      this.addControlValueChangeListener(formGroup.get('plantCultivatedArea') as UntypedFormControl);

      newListControls.push(formGroup);
    });

    // add missing product type in lists
    const listProductTypeControls = (this.farmerForm.get('productTypes') as UntypedFormArray).controls;
    listProductTypeControls.forEach(ptControl =>  {
      const productType = ptControl.value as ApiProductType;

      const productFound = listControls.find(plantInfo => plantInfo.value.productType.id === productType.id);
      if ( productFound === undefined ) {
        const formGroup = new UntypedFormGroup({
          productType: new UntypedFormControl(productType),
          plantCultivatedArea: new UntypedFormControl(null),
          numberOfPlants: new UntypedFormControl(null)
        });

        this.addControlValueChangeListener(formGroup.get('plantCultivatedArea') as UntypedFormControl);

        newListControls.push(formGroup);
      }
    });

    (this.farmerForm.get('farm.farmPlantInformationList') as UntypedFormArray).clear();

    newListControls.forEach(newControl => {
      (this.farmerForm.get('farm.farmPlantInformationList') as UntypedFormArray).push(newControl);
    });
  }

  private addNewFarmPlantInformation(productType: ApiProductType): void {

    const formGroup = new UntypedFormGroup({
      productType: new UntypedFormControl(productType),
      plantCultivatedArea: new UntypedFormControl(null),
      numberOfPlants: new UntypedFormControl(null)
    });

    this.addControlValueChangeListener(formGroup.get('plantCultivatedArea') as UntypedFormControl);

    (this.farmerForm.get('farm.farmPlantInformationList') as UntypedFormArray).push(formGroup);
  }

  private removeFarmPlantInformation(productType: ApiProductType): void {

    const plantInfoListArray = this.farmerForm.get('farm.farmPlantInformationList') as UntypedFormArray;

    const resultArrayControls = plantInfoListArray.controls.filter(control => control.get('productType').value.id !== productType.id);

    plantInfoListArray.clear();
    resultArrayControls.forEach(res => plantInfoListArray.push(res));
  }

  initValueChangeListeners() {

    if (this.areaUnit != null) {
      this.subscriptions.push(this.areaUnit.valueChanges.pipe(
          startWith(null),
          debounceTime(100)).subscribe(
          val => {
            if (val !== null && val !== undefined) {
              this.updateAreaUnitValidators();
            }
          }
      ));
    }

    if (this.totalCultivatedArea != null) {
      this.subscriptions.push(this.totalCultivatedArea.valueChanges.pipe(
          startWith(null),
          debounceTime(100)).subscribe(
          val => {
            if (val !== null && val !== undefined) {
              this.updateAreaUnitValidators();
            }
          }
      ));
    }

    if (this.areaOrganicCertified != null) {
      this.subscriptions.push(this.areaOrganicCertified.valueChanges.pipe(
          startWith(null),
          debounceTime(100)).subscribe(
          val => {
            if (val !== null && val !== undefined) {
              this.updateAreaUnitValidators();
            }
          }
      ));
    }
  }

  private addControlValueChangeListener(control: UntypedFormControl) {
    this.subscriptions.push(control.valueChanges.pipe(
      startWith(null),
      debounceTime(100)).subscribe(
      val => {
        if (val !== null && val !== undefined) {
          this.updateAreaUnitValidators();
        }
      }
    ));
  }

  newFarmer() {

    this.farmerForm = generateFormFromMetadata(ApiUserCustomer.formMetadata(), this.emptyFarmer(), ApiUserCustomerValidationScheme);

    // in case of 1 product (auto selection), also add empty fields in form
    if (this.productTypes?.length > 0) {
      setTimeout(() => {
        this.selectedProductTypesForm.setValue(this.productTypes);
        this.farmerForm.markAsDirty();
        this.productTypesForm.setValue(null);
        this.addNewFarmPlantInformation(this.productTypes[0]);
      });
    }

    this.subscriptions.push(
        this.selfOnboardingService.addFarmersCurrentStep$.subscribe(currentStep => {
          if (currentStep === 3) {
            setTimeout(() => this.newFarmerTitleTooltip?.open());
          } else {
            setTimeout(() => this.newFarmerTitleTooltip?.close());
          }
        })
    );
  }

  editFarmer() {
    this.prepareEdit();
    this.farmerForm = generateFormFromMetadata(ApiUserCustomer.formMetadata(), this.farmer, ApiUserCustomerValidationScheme);

    this.prefillFarmPlantInformation();
  }

  async geoJSONSelectedToUpload($event: Event) {

    if (!this.update) {
      return;
    }

    const fileInput: HTMLInputElement = $event.target as HTMLInputElement;
    const file = fileInput.files[0];

    const formData = new FormData();
    formData.append('file', file);

    this.globalEventsManager.showLoading(true);
    try {
      await this.httpClient.post(
          `${ this.companyService.configuration.basePath }/api/company/userCustomers/${ this.farmer.id }/uploadGeoData`, formData, {observe: 'response'})
          .pipe(take(1))
          .toPromise();

      this.ngOnInit();
    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  async exportGeoData() {

    if (!this.update) {
      return;
    }

    this.globalEventsManager.showLoading(true);
    try {
      const res = await this.companyService.exportUserCustomerGeoData(this.farmer.id)
          .pipe(take(1))
          .toPromise();
      this.fileSaverService.save(res, `${this.farmer.name}_${this.farmer.surname}_geo_data.json`);
    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  emptyFarmer() {
    const farmer: ApiUserCustomer = defaultEmptyObject(ApiUserCustomer.formMetadata());

    farmer.bank = defaultEmptyObject(ApiBankInformation.formMetadata()) as ApiBankInformation;
    farmer.farm = defaultEmptyObject(ApiFarmInformation.formMetadata()) as ApiFarmInformation;
    farmer.location = defaultEmptyObject(ApiLocation.formMetadata()) as ApiLocation;
    farmer.location.address = defaultEmptyObject(ApiAddress.formMetadata()) as ApiAddress;

    return farmer;
  }

  prepareEdit() {
    if (this.farmer.bank == null) {
      this.farmer.bank = defaultEmptyObject(ApiBankInformation.formMetadata());
    }
  }

  prepareData() {
    this.farmerForm.get('type').setValue(UserCustomerTypeEnum.FARMER);

    if (this.farmerForm.get('hasSmartphone').value === null) {
      this.farmerForm.get('hasSmartphone').setValue(false);
    }

    if (this.farmerForm.get('farm.organic').value === null) {
      this.farmerForm.get('farm.organic').setValue(false);
    }

    const data = _.cloneDeep(this.farmerForm.value);

    Object.keys(data.location).forEach((key) => (data.location[key] == null) && delete data.location[key]);
    if (data.farmInfo) { Object.keys(data.farmInfo).forEach((key) => (data.farmInfo[key] == null) && delete data.farmInfo[key]); }
    if (data.contact) { Object.keys(data.contact).forEach((key) => (data.contact[key] == null) && delete data.contact[key]); }
    if (data.bankAccountInfo) { Object.keys(data.bankAccountInfo).forEach((key) => (data.bankAccountInfo[key] == null) && delete data.bankAccountInfo[key]); }

    Object.keys(data).forEach((key) => (data[key] == null) && delete data[key]);

    return data;
  }

  dismiss() {
    this.location.back();
  }

  async addSelectedProductType(productType: ApiProductType) {
    if (!productType) {
      return;
    }
    if (this.productTypes.some(pt => pt?.id === productType?.id)) {
      setTimeout(() => this.productTypesForm.setValue(null));
      return;
    }
    this.productTypes.push(productType);
    setTimeout(() => {
      this.selectedProductTypesForm.setValue(this.productTypes);
      this.farmerForm.markAsDirty();
      this.productTypesForm.setValue(null);
      this.addNewFarmPlantInformation(productType);
    });
  }

  deleteProductType(idx: number) {
    this.confirmProductTypeRemove().then(confirmed => {
      if (confirmed) {
        const productType = this.productTypes[idx];
        this.productTypes.splice(idx, 1);
        setTimeout(() => this.selectedProductTypesForm.setValue(this.productTypes));
        this.farmerForm.markAsDirty();
        this.removeFarmPlantInformation(productType);
      }
    });
  }

  private async confirmProductTypeRemove(): Promise<boolean> {

    const result = await this.globalEventsManager.openMessageModal({
      type: 'warning',
      message: $localize`:@@companyDetailProductTypeModal.removeProductType.confirm.message:Are you sure you want to remove the product type?`,
      options: {
        centered: true
      }
    });

    return result === 'ok';
  }

  async save(stayOnPage = false) {

    this.submitted = true;

    if (this.farmerForm.invalid) {
      return;
    }
    if (this.checkNullEmpty(this.areaUnit) && this.checkAreaFieldsRequired()) {
      this.updateAreaUnitValidators();
      return;
    }

    const data = this.prepareData();

    try {
      this.globalEventsManager.showLoading(true);
      let res;
      if (!this.update) {

        res = await this.companyService.addUserCustomer(this.companyId, data).toPromise();

      } else {
        res = await this.companyService.updateUserCustomer(data).toPromise();
      }

      if (res && res.status === 'OK') {

        const currentAddFarmerStep = await this.selfOnboardingService.addFarmersCurrentStep$.pipe(take(1)).toPromise();
        if (currentAddFarmerStep === 3) {
          this.selfOnboardingService.setAddFarmersCurrentStep('success');
          this.router.navigate(['/home']).then();
        } else {

          if (!stayOnPage) {
            this.dismiss();
          } else {
            this.ngOnInit();
          }
        }
      }
    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  initializeListManager() {

    this.producersListManager = new ListEditorManager<ApiUserCustomerCooperative>(
        this.farmerForm.get('cooperatives') as UntypedFormArray,
        CompanyFarmersDetailsComponent.ApiUserCustomerCooperativeEmptyObjectFormFactory(),
        ApiUserCustomerCooperativeValidationScheme
    );

    this.certificationListManager = new ListEditorManager<ApiCertification>(
      (this.farmerForm.get('certifications')) as UntypedFormArray,
      CompanyFarmersDetailsComponent.ApiCertificationEmptyObjectFormFactory(),
      ApiCertificationValidationScheme
    );
  }

  async listOfOrgProducer() {

    const companiesObj = {};
    companiesObj[this.company.id] = this.company.name;
    this.codebookCoop = EnumSifrant.fromObject(companiesObj);
    this.assocCoop = companiesObj;
  }

  async listOfOrgAssociation() {

    const res = await this.companyService.getAssociations(this.companyId).pipe(take(1)).toPromise();

    if (res && res.status === 'OK' && res.data) {
      const companiesObj = {};
      for (const company of res.data.items) {
        companiesObj[company.id] = company.name;
      }
      this.codebookAssoc = EnumSifrant.fromObject(companiesObj);
    }
  }

  assocResultFormatter = (value: any) => {
    return this.codebookAssoc.textRepresentation(value);
  }

  assocInputFormatter = (value: any) => {
    return this.codebookAssoc.textRepresentation(value);
  }

  addAssociation(item, form) {
    if (!item) {
      return;
    }
    if (this.farmerForm.value.associations.some(a => a.company.id === item.id)) {
      form.setValue(null);
      return;
    }
    this.farmerForm.value.associations.push({
      company: {
        id: item.id,
        name: item.name
      }
    });
    setTimeout(() => form.setValue(null));
  }

  deleteAssociation(item, index) {
    this.farmerForm.value.associations.splice(index, 1);
  }

  updateAreaUnitValidators() {
    if (this.areaUnit == null) {
      return;
    }
    this.areaUnit.clearValidators();
    this.areaUnit.setValidators(
      this.checkAreaFieldsRequired() ?
        [Validators.required] : []
    );
    this.farmerForm.markAllAsTouched();
    this.farmerForm.updateValueAndValidity();
  }

  get checkAreaFieldInvalid() {
    return this.checkNullEmpty(this.areaUnit) && this.checkAreaFieldsRequired();
  }

  checkAreaFieldsRequired() {
    return (!this.checkNullEmpty(this.totalCultivatedArea) ||
      this.checkPlantsCultivatedAreaFields() ||
      !this.checkNullEmpty(this.areaOrganicCertified));
  }

  checkNullEmpty(control: UntypedFormControl){
    return control == null || control.value == null || control.value === '';
  }

  checkPlantsCultivatedAreaFields() {
    const farmPlantInformationList = this.farmerForm.get('farm.farmPlantInformationList') as UntypedFormArray;
    if (farmPlantInformationList != null) {
      const controls = farmPlantInformationList.controls;
      return controls.some(control => !this.checkNullEmpty(control.get('plantCultivatedArea') as UntypedFormControl));
    }
  }

  public get areaUnit(): UntypedFormControl {
    return this.farmerForm.get('farm.areaUnit') as UntypedFormControl;
  }

  public get totalCultivatedArea(): UntypedFormControl {
    return this.farmerForm.get('farm.totalCultivatedArea') as UntypedFormControl;
  }

  public get areaOrganicCertified(): UntypedFormControl {
    return this.farmerForm.get('farm.areaOrganicCertified') as UntypedFormControl;
  }
  
  appendAreaUnit(message: string, unit: string): string {
    if (unit && unit.length > 0) {
      return message + ` (${unit})`;
    }
    return message;
  }

  getProductTypeName(index: number): string {
    const selectedControl = (this.farmerForm.get('farm.farmPlantInformationList') as UntypedFormArray).controls[index];
    const productType = selectedControl.get('productType')?.value;
    return (productType) ? productType.name : '';
  }

  appendAreaUnitAndProductType(message: string, unit: string, index: number): string {
    const productTypeName = this.getProductTypeName(index);
    if (unit && unit.length > 0) {
      return message + ` ${productTypeName} (${unit})`;
    }
    return message + ` ${productTypeName}`;
  }

  appendProductType(message: string, index: number): string {
    const selectedControl = (this.farmerForm.get('farm.farmPlantInformationList') as UntypedFormArray).controls[index];
    const productType = selectedControl.get('productType')?.value;
    const productTypeName = (productType) ? `(${productType.name})` : '';
    return message + ` ${productTypeName}`;
  }

  selectedIdsChanged(event, type?) {
    if (type === 'PURCHASE') {
      this.selectedOrders = event;
    }
    else {
      this.selectedPayments = event;
    }
  }

  onShowPO(event) {
    this.showedDeliveries = event;
  }

  onCountAllPO(event) {
    this.allDeliveries = event;
  }

  onShowPayments(event) {
    this.showedPaymentOrders = event;
  }

  onCountAllPayments(event) {
    this.allPaymentOrders = event;
  }

}
