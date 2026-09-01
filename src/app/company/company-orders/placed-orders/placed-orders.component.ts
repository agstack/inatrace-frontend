import { Component, OnInit } from '@angular/core';
import { OrdersTabComponent } from '../orders-tab/orders-tab.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FacilityControllerService } from '../../../../api/api/facilityController.service';
import { FormControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { setNavigationParameter } from '../../../../shared/utils';
import { ApiCompanyCustomer } from '../../../../api/model/apiCompanyCustomer';
import { CompanyCustomersService } from '../../../shared-services/company-customers.service';
import { CompanyControllerService } from '../../../../api/api/companyController.service';
import { SelectedUserCompanyService } from '../../../core/selected-user-company.service';
import { NgbModalImproved } from '../../../core/ngb-modal-improved/ngb-modal-improved.service';
import { PlaceQuoteOrderModalComponent } from './place-quote-order-modal/place-quote-order-modal.component';
import { PlaceQuoteOrderModalResult } from './place-quote-order-modal/model';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';
import { StockOrderControllerService } from '../../../../api/api/stockOrderController.service';
import { FileSaverService } from 'ngx-filesaver';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-placed-orders',
  templateUrl: './placed-orders.component.html',
  styleUrls: ['./placed-orders.component.scss']
})
export class PlacedOrdersComponent extends OrdersTabComponent implements OnInit {

  rootTab = 1;
  allPlacedOrders = 0;

  // Controls for company customer dropdown selection component
  companyCustomerForm = new FormControl(null);
  companyCustomerId = null;
  companyCustomerId$ = new BehaviorSubject<number>(null);
  companyCustomerCodebook: CompanyCustomersService;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected facilityController: FacilityControllerService,
    protected globalEventManager: GlobalEventManagerService,
    private companyControllerService: CompanyControllerService,
    protected selUserCompanyService: SelectedUserCompanyService,
    private stockOrderControllerService: StockOrderControllerService,
    private fileSaverService: FileSaverService,
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

  // Export the table in excel
  async exportOrdersExcel(): Promise<void> {
  
      this.globalEventManager.showLoading(true);
      try {
        const res = await this.stockOrderControllerService.exportPlacedOrderByCompany(this.companyId)
            .pipe(take(1))
            .toPromise();
  
        this.fileSaverService.save(res, 'placed_orders.xlsx');
      } finally {
        this.globalEventManager.showLoading(false);
      }
    }

    // Retrieve count placed orders for export button visibility management
    onCountAllOrders(event) {
      this.allPlacedOrders = event;
    }

}
