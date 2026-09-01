import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import _ from 'lodash-es';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ApiUserCustomer } from '../../../../api/model/apiUserCustomer';
import { CompanyControllerService } from '../../../../api/api/companyController.service';
import { defaultEmptyObject, generateFormFromMetadata } from '../../../../shared/utils';
import {
  ApiUserCustomerCooperativeValidationScheme,
  ApiUserCustomerValidationScheme
} from './validation';
import { ApiBankInformation } from '../../../../api/model/apiBankInformation';
import { ApiFarmInformation } from '../../../../api/model/apiFarmInformation';
import { ApiLocation } from '../../../../api/model/apiLocation';
import { ApiAddress } from '../../../../api/model/apiAddress';
import { first, take } from 'rxjs/operators';
import { EnumSifrant } from '../../../shared-services/enum-sifrant';
import { ThemeService } from '../../../shared-services/theme.service';
import { environment } from '../../../../environments/environment';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';
import { ApiCompany } from '../../../../api/model/apiCompany';
import { ListEditorManager } from '../../../shared/list-editor/list-editor-manager';
import { ApiUserCustomerCooperative } from '../../../../api/model/apiUserCustomerCooperative';
import UserCustomerTypeEnum = ApiUserCustomerCooperative.UserCustomerTypeEnum;
import { ApiStockOrder } from '../../../../api/model/apiStockOrder';
// import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { ApiCertification } from '../../../../api/model/apiCertification';
import { ApiCertificationValidationScheme } from '../../../m-product/product-label/validation';
import { ApiPayment } from '../../../../api/model/apiPayment';
import { SelectedUserCompanyService } from '../../../core/selected-user-company.service';
import {BehaviorSubject} from 'rxjs';

@Component({
  selector: 'app-company-collectors-details',
  templateUrl: './company-collectors-details.component.html',
  styleUrls: ['./company-collectors-details.component.scss']
})
export class CompanyCollectorsDetailsComponent implements OnInit {

  faTimes = faTimes;

  title: string;
  update: boolean;
  company: ApiCompany;
  companyId;
  collector: ApiUserCustomer;
  collectorForm: FormGroup;
  submitted = false;
  qrCodeSize = 110;
  appName = environment.appName;

  openBalanceOnly = false;
  sortPay = null;
  sortPO = null;
  purchaseOrders = [];
  payments = [];

  // payments table parameters
  showedPaymentOrders = 0;
  allPaymentOrders = 0;
  selectedPayments: ApiPayment[];

  representativeOfUserCustomerIdPing$ = new BehaviorSubject<number>(this.route.snapshot.params.id);

  // purchase table parameters
  showedPurchaseOrders = 0;
  allPurchaseOrders = 0;
  selectedOrders: ApiStockOrder[];

  producersListManager;
  codebookAssoc;
  codebookCoop;
  assocCoop;
  assocForm = new FormControl(null);

  genderCodebook = EnumSifrant.fromObject({
    MALE: $localize`:@@collectorDetail.gender.male:Male`,
    FEMALE: $localize`:@@collectorDetail.gender.female:Female`,
    N_A: 'N/A',
    DIVERSE: $localize`:@@collectorDetail.gender.diverse:Diverse`
  });

  readonly collectorType = UserCustomerTypeEnum.COLLECTOR;

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
      name: $localize`:@@collectorDetail.sortOptionsPay.amount.name:Amount paid to collector (RWF)`,
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

  constructor(
      private location: Location,
      private formBuilder: FormBuilder,
      private route: ActivatedRoute,
      private companyService: CompanyControllerService,
      private globalEventsManager: GlobalEventManagerService,
      private selUserCompanyService: SelectedUserCompanyService,
      public theme: ThemeService
  ) { }

  static ApiUserCustomerCooperativeCreateEmptyObject(): ApiUserCustomerCooperative {
    const obj: ApiUserCustomerCooperative = defaultEmptyObject(ApiUserCustomerCooperative.formMetadata());
    obj.company = defaultEmptyObject(ApiCompany.formMetadata());
    return obj;
  }

  static ApiUserCustomerCooperativeEmptyObjectFormFactory(): () => FormControl {
    return () => {
      return new FormControl(CompanyCollectorsDetailsComponent.ApiUserCustomerCooperativeCreateEmptyObject(),
        ApiUserCustomerCooperativeValidationScheme.validators);
    };
  }

  static ApiCertificationCreateEmptyObject(): ApiCertification {
    const obj = ApiCertification.formMetadata();
    return defaultEmptyObject(obj) as ApiCertification;
  }

  static ApiCertificationEmptyObjectFormFactory(): () => FormControl {
    return () => {
      return new FormControl(CompanyCollectorsDetailsComponent.ApiCertificationCreateEmptyObject(), ApiCertificationValidationScheme.validators);
    };
  }

  get certifications(): AbstractControl[] {
    return (this.collectorForm.get('certifications') as FormArray).controls;
  }

  ngOnInit(): void {
    this.initData().then(() => {
      if (!this.update) {
        this.newCollector();
      } else {
        this.editCollector();
      }
      this.initializeListManager();
    });
  }

  async initData() {

    const action = this.route.snapshot.data.action;
    if (!action) { return; }

    this.company = await this.selUserCompanyService.selectedCompanyProfile$.pipe(take(1)).toPromise();
    if (!this.company) { return; }

    this.companyId = this.company.id;

    switch (action) {
      case 'new':
        this.title = $localize`:@@collectorDetail.newCollector.title:New collector`;
        this.update = false;
        break;
      case 'update':
        this.title = $localize`:@@collectorDetail.editCollector.title:Edit collector`;
        this.update = true;
        const uc = await this.companyService.getUserCustomer(this.route.snapshot.params.id).pipe(first()).toPromise();
        if (uc && uc.status === 'OK') {
          this.collector = uc.data;
        }
        break;
      default:
        throw Error('Wrong action!');
    }

    this.listOfOrgProducer().then();
    this.listOfOrgAssociation().then();
  }

  newCollector() {
    this.collectorForm = generateFormFromMetadata(ApiUserCustomer.formMetadata(), this.emptyCollector(), ApiUserCustomerValidationScheme);
  }

  editCollector() {
    this.prepareEdit();
    this.collectorForm = generateFormFromMetadata(ApiUserCustomer.formMetadata(), this.collector, ApiUserCustomerValidationScheme);
  }

  emptyCollector() {
    const collector: ApiUserCustomer = defaultEmptyObject(ApiUserCustomer.formMetadata());

    collector.bank = defaultEmptyObject(ApiBankInformation.formMetadata()) as ApiBankInformation;
    collector.farm = defaultEmptyObject(ApiFarmInformation.formMetadata()) as ApiFarmInformation;
    collector.location = defaultEmptyObject(ApiLocation.formMetadata()) as ApiLocation;
    collector.location.address = defaultEmptyObject(ApiAddress.formMetadata()) as ApiAddress;

    return collector;
  }

  prepareEdit() {
    if (this.collector.bank == null) {
      this.collector.bank = defaultEmptyObject(ApiBankInformation.formMetadata());
    }
  }

  prepareData() {
    this.collectorForm.get('type').setValue(UserCustomerTypeEnum.COLLECTOR);

    if (this.collectorForm.get('hasSmartphone').value === null) {
      this.collectorForm.get('hasSmartphone').setValue(false);
    }

    if (this.collectorForm.get('farm.organic').value === null) {
      this.collectorForm.get('farm.organic').setValue(false);
    }

    const data = _.cloneDeep(this.collectorForm.value);

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

  async save() {
    this.submitted = true;
    if (this.collectorForm.invalid) { return; }
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
        this.dismiss();
      }
    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  initializeListManager() {

    this.producersListManager = new ListEditorManager<ApiUserCustomerCooperative>(
        this.collectorForm.get('cooperatives') as FormArray,
        CompanyCollectorsDetailsComponent.ApiUserCustomerCooperativeEmptyObjectFormFactory(),
        ApiUserCustomerCooperativeValidationScheme
    );

    this.certificationListManager = new ListEditorManager<ApiCertification>(
      (this.collectorForm.get('certifications')) as FormArray,
      CompanyCollectorsDetailsComponent.ApiCertificationEmptyObjectFormFactory(),
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
    if (this.collectorForm.value.associations.some(a => a.company.id === item.id)) {
      form.setValue(null);
      return;
    }
    this.collectorForm.value.associations.push({
      company: {
        id: item.id,
        name: item.name
      }
    });
    setTimeout(() => form.setValue(null));
  }

  deleteAssociation(item, index) {
    this.collectorForm.value.associations.splice(index, 1);
  }

  changeSort(event, type) {
    if (type === 'PAYMENT') {
      this.sortPay = event.sortOrder;
      return;
    }
    this.sortPO = event.sortOrder;
  }
  
  public get areaUnit(): FormControl {
    return this.collectorForm.get('farm.areaUnit') as FormControl;
  }

  selectedIdsChanged(event, type?) {
    if (type === 'PURCHASE') {
      this.selectedOrders = event;
    }
  }

  onShowPO(event) {
    this.showedPurchaseOrders = event;
  }

  onCountAllPO(event) {
    this.allPurchaseOrders = event;
  }

  onShowPayments(event) {
    this.showedPaymentOrders = event;
  }

  onCountAllPayments(event) {
    this.allPaymentOrders = event;
  }

}
