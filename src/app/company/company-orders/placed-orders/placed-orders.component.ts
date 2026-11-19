import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { OrdersTabComponent } from '../orders-tab/orders-tab.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FacilityControllerService } from '../../../../api/api/facilityController.service';
import { UntypedFormControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { setNavigationParameter } from '../../../../shared/utils';
import { ApiCompanyCustomer } from '../../../../api/model/apiCompanyCustomer';
import { CompanyCustomersService } from '../../../shared-services/company-customers.service';
import { CompanyControllerService } from '../../../../api/api/companyController.service';
import { SelectedUserCompanyService } from '../../../core/selected-user-company.service';
import { NgbModalImproved } from '../../../core/ngb-modal-improved/ngb-modal-improved.service';
import { PlaceQuoteOrderModalComponent } from './place-quote-order-modal/place-quote-order-modal.component';
import { PlaceQuoteOrderModalResult } from './place-quote-order-modal/model';

@Component({
    selector: 'app-placed-orders',
    templateUrl: './placed-orders.component.html',
    styleUrls: ['./placed-orders.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PlacedOrdersComponent extends OrdersTabComponent implements OnInit {

  rootTab = 1;

  // Controls for company customer dropdown selection component
  companyCustomerForm = new UntypedFormControl(null);
  companyCustomerId = null;
  companyCustomerId$ = new BehaviorSubject<number>(null);
  companyCustomerCodebook: CompanyCustomersService;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected facilityController: FacilityControllerService,
    private companyControllerService: CompanyControllerService,
    protected selUserCompanyService: SelectedUserCompanyService,
    private modalService: NgbModalImproved
  ) {
    super(router, route, facilityController, selUserCompanyService);
  }

  async ngOnInit(): Promise<void> {
    await super.ngOnInit();
    this.companyCustomerCodebook = new CompanyCustomersService(this.companyControllerService, this.companyId);
  }

  async placeQuoteOrder(): Promise<void> {

    // Open the modal dialog for selecting facility and order template (processing action)
    const modalRef = this.modalService.open(PlaceQuoteOrderModalComponent, { centered: true });

    // Wait for the result and navigate to the processing order details component
    const modalResult = await modalRef.result as PlaceQuoteOrderModalResult;
    if (modalResult) {
      this.router.navigate(['my-stock', 'processing', modalResult.orderTemplateId, 'facility', modalResult.facilityId, 'new']).then();
    }
  }

  addCustomerOrder() {
    this.router.navigate(['customer-order', 'add'], { relativeTo: this.route.parent }).then();
  }

  customerChanged(event: ApiCompanyCustomer) {

    if (event) {
      this.companyCustomerId = event.id;
    } else {
      this.companyCustomerId = null;
      this.companyCustomerForm.setValue(null);
    }

    this.companyCustomerId$.next(this.companyCustomerId);
    setNavigationParameter(this.router, this.route, 'companyCustomerId', this.companyCustomerId);
  }

}
