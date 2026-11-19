import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import _ from 'lodash-es';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { ApiCompany } from '../../../../api/model/apiCompany';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { Location } from '@angular/common';
import { take } from 'rxjs/operators';
import { defaultEmptyObject, generateFormFromMetadata } from '../../../../shared/utils';
import { CompanyControllerService } from '../../../../api/api/companyController.service';
import { ApiCompanyCustomer } from '../../../../api/model/apiCompanyCustomer';
import { ApiCompanyCustomerValidationScheme } from './validation';
import { ApiGeoAddress } from '../../../../api/model/apiGeoAddress';
import { SelectedUserCompanyService } from '../../../core/selected-user-company.service';

@Component({
    selector: 'app-company-customers-details',
    templateUrl: './company-customers-details.component.html',
    styleUrls: ['./company-customers-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CompanyCustomersDetailsComponent implements OnInit {

  faTrashAlt = faTrashAlt;

  title: string = null;
  update = true;

  organization: ApiCompany;
  companyId: number;
  productId;

  customer: ApiCompanyCustomer;
  customerId;
  customerForm: UntypedFormGroup;

  submitted = false;
  userProfile;
  semiProductWithPrices = new UntypedFormArray([]);

  constructor(
      private globalEventsManager: GlobalEventManagerService,
      private route: ActivatedRoute,
      private authService: AuthService,
      private location: Location,
      private companyService: CompanyControllerService,
      private selUserCompanyService: SelectedUserCompanyService
  ) { }

  ngOnInit(): void {
    this.initialize().then(() => {
      if (this.update) {
        this.editCustomer();
      } else {
        this.newCustomer();
      }
    });
  }

  async initialize() {

    const action = this.route.snapshot.data.action;
    if (!action) { return; }

    this.companyId = (await this.selUserCompanyService.selectedCompanyProfile$.pipe(take(1)).toPromise())?.id;

    this.customerId = this.route.snapshot.params.id;
    if (action === 'new') {
      this.title = $localize`:@@customerDetail.newCustomer.title:New customer`;
      this.update = false;
    } else if (action === 'update') {
      this.title = $localize`:@@customerDetail.updateCustomer.title:Edit customer`;
      this.update = true;
      const res = await this.companyService.getCompanyCustomer(this.customerId).pipe(take(1)).toPromise();
      if (res && res.status === 'OK') {
        this.customer = res.data;
      }
    } else {
      throw Error('Wrong action.');
    }
  }

  newCustomer() {
    this.customerForm = generateFormFromMetadata(ApiCompanyCustomer.formMetadata(), this.emptyCustomer(), ApiCompanyCustomerValidationScheme);
  }

  editCustomer() {
    this.customerForm = generateFormFromMetadata(ApiCompanyCustomer.formMetadata(), this.customer, ApiCompanyCustomerValidationScheme);
  }

  emptyCustomer() {
    const obj: ApiCompanyCustomer = defaultEmptyObject(ApiCompanyCustomer.formMetadata());
    obj.location = defaultEmptyObject(ApiGeoAddress.formMetadata()) as ApiGeoAddress;

    return obj;
  }

  prepareData() {
    const data: ApiCompanyCustomer = _.cloneDeep(this.customerForm.value);
    data.companyId = this.companyId;
    return data;
  }

  dismiss() {
    this.location.back();
  }

  async save() {
    this.submitted = true;
    if (this.customerForm.invalid) {
      return;
    }
    const data = this.prepareData();

    try {
      this.globalEventsManager.showLoading(true);

      let res;
      if (!this.update) {
        res = await this.companyService.createCompanyCustomer(data).toPromise();
      } else {
        res = await this.companyService.updateCompanyCustomer(data).toPromise();
      }

      if (res && res.status === 'OK') {
        this.dismiss();
      }
    } finally {
      this.globalEventsManager.showLoading(false);
    }

  }

}
