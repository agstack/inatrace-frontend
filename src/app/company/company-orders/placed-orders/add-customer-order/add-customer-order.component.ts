import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { CompanyCustomersService } from '../../../../shared-services/company-customers.service';
import { CompanyFacilitiesService } from '../../../../shared-services/company-facilities.service';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { CompanyControllerService } from '../../../../../api/api/companyController.service';
import { finalize, take, tap } from 'rxjs/operators';
import { dateISOString, defaultEmptyObject, deleteNullFields, generateFormFromMetadata } from '../../../../../shared/utils';
import { ActivatedRoute } from '@angular/router';
import { FacilityControllerService } from '../../../../../api/api/facilityController.service';
import { AuthService } from '../../../../core/auth.service';
import { ApiProductOrderValidationScheme } from './validation';
import { ApiProductOrder } from '../../../../../api/model/apiProductOrder';
import { ListEditorManager } from '../../../../shared/list-editor/list-editor-manager';
import { ApiStockOrder } from '../../../../../api/model/apiStockOrder';
import { ApiStockOrderValidationScheme } from './customer-order-item/validation';
import { Location } from '@angular/common';
import { ApiFacility } from '../../../../../api/model/apiFacility';
import _ from 'lodash-es';
import OrderTypeEnum = ApiStockOrder.OrderTypeEnum;
import { ProductOrderControllerService } from '../../../../../api/api/productOrderController.service';
import { SelectedUserCompanyService } from '../../../../core/selected-user-company.service';

@Component({
    selector: 'app-add-customer-order',
    templateUrl: './add-customer-order.component.html',
    styleUrls: ['./add-customer-order.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AddCustomerOrderComponent implements OnInit {

  form: UntypedFormGroup;
  submitted = false;

  title: string = null;

  companyId: number;

  creatorId: number;

  companyCustomerCodebook: CompanyCustomersService;

  outputFacilitiesCodebook: CompanyFacilitiesService;
  outputFacilityForm = new UntypedFormControl(null, Validators.required);

  stockOrdersListManager = null;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private globalEventsManager: GlobalEventManagerService,
    private companyCustomerController: CompanyControllerService,
    private facilityController: FacilityControllerService,
    private productOrderController: ProductOrderControllerService,
    private authService: AuthService,
    private selUserCompanyService: SelectedUserCompanyService
  ) { }

  static StockOrderItemCreateEmptyObject(): ApiStockOrder {
    const obj = ApiStockOrder.formMetadata();
    return defaultEmptyObject(obj) as ApiStockOrder;
  }

  static StockOrderItemEmptyObjectFormFactory(): () => UntypedFormControl {
    return () => {
      return new UntypedFormControl(AddCustomerOrderComponent.StockOrderItemCreateEmptyObject(), ApiStockOrderValidationScheme.validators);
    };
  }

  get orderItemsFormArray(): UntypedFormArray {
    return this.form.get('items') as UntypedFormArray;
  }

  get outputFacility() {
    if (this.outputFacilityForm.value) {
      return this.outputFacilityForm.value as ApiFacility;
    }
    return null;
  }

  ngOnInit(): void {

    this.selUserCompanyService.selectedCompanyProfile$.pipe(take(1)).subscribe(cp => {
      if (cp) {
        this.companyId = cp.id;
        this.reloadProductOrder();
      }
    });
  }

  private async getCreatorId() {
    const profile = await this.authService.userProfile$.pipe(take(1)).toPromise();
    if (profile) {
      return profile.id;
    }
    return null;
  }

  private newTitle() {
    return $localize`:@@globalOrderEdit.newTitle:New order`;
  }

  private reloadProductOrder() {
    this.globalEventsManager.showLoading(true);
    this.submitted = false;
    this.initInitialData().then(
      () => {

        this.companyCustomerCodebook = new CompanyCustomersService(this.companyCustomerController, this.companyId);
        this.outputFacilitiesCodebook = new CompanyFacilitiesService(this.facilityController, this.companyId);

        this.newOrder();
      }
    );
  }

  private async initInitialData() {

    this.title = this.newTitle();
    this.creatorId = await this.getCreatorId();
  }

  private newOrder() {

    // Generate the initial Angular reactive form
    this.form = generateFormFromMetadata(ApiProductOrder.formMetadata(), {}, ApiProductOrderValidationScheme);

    this.initializeListManager();
    this.globalEventsManager.showLoading(false);
  }

  private initializeListManager() {
    this.stockOrdersListManager = new ListEditorManager<ApiStockOrder>(
      this.orderItemsFormArray,
      AddCustomerOrderComponent.StockOrderItemEmptyObjectFormFactory(),
      ApiStockOrderValidationScheme
    );
  }

  dismiss() {
    this.location.back();
  }

  async saveProductOrder() {

    this.submitted = true;
    if (this.form.invalid || this.outputFacilityForm.invalid) {
      return;
    }

    // Set other Product order fields
    const productOrder = _.cloneDeep(this.form.value) as ApiProductOrder;
    productOrder.facility = this.outputFacilityForm.value;
    productOrder.deliveryDeadline = dateISOString(productOrder.deliveryDeadline);

    // Fill the missing data from the stock orders
    productOrder.items.forEach(order => {

      // Set the required Stock order fields
      order.creatorId = this.creatorId;
      order.deliveryTime = productOrder.deliveryDeadline;
      order.consumerCompanyCustomer = productOrder.customer;
      order.finalProduct = order.processingOrder.processingAction.inputFinalProduct;
      order.facility = this.outputFacilityForm.value;
      order.fulfilledQuantity = 0;
      order.availableQuantity = 0;
      order.productionDate = dateISOString(new Date());
      order.orderType = OrderTypeEnum.GENERALORDER;
      order.internalLotNumber = `${productOrder.orderId} (${order.finalProduct.name}, ${order.totalQuantity} ${order.finalProduct.measurementUnitType.label})`;

      // Set the contained processing order data
      const procOrder = order.processingOrder;
      procOrder.initiatorUserId = this.creatorId;
      procOrder.inputTransactions = [];

      deleteNullFields(order);
    });

    // Create new Product order
    this.productOrderController.createProductOrder(productOrder)
      .pipe(
        tap(() => this.globalEventsManager.showLoading(true)),
        finalize(() => this.globalEventsManager.showLoading(false))
      )
      .subscribe(
        resp => {
          if (resp && resp.status === 'OK') {
            this.dismiss();
          }
        }
      );
  }

}
