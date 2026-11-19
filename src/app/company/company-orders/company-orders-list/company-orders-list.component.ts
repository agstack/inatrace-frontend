import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { ApiPaginatedListApiStockOrder } from '../../../../api/model/apiPaginatedListApiStockOrder';
import { SortOption } from '../../../shared/result-sorter/result-sorter-types';
import { UntypedFormControl } from '@angular/forms';
import { ApiStockOrder } from '../../../../api/model/apiStockOrder';
import {finalize, map, switchMap, take, tap} from 'rxjs/operators';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';
import { ApiPaginatedResponseApiStockOrder } from '../../../../api/model/apiPaginatedResponseApiStockOrder';
import {
  GetQuoteOrdersInFacility,
  GetStockOrdersInFacilityForCustomer,
  StockOrderControllerService
} from '../../../../api/api/stockOrderController.service';
import { Router } from '@angular/router';
import { NgbModalImproved } from '../../../core/ngb-modal-improved/ngb-modal-improved.service';
import { ApproveRejectTransactionModalComponent } from '../approve-reject-transaction-modal/approve-reject-transaction-modal.component';
import { GenerateQRCodeModalComponent } from '../../../components/generate-qr-code-modal/generate-qr-code-modal.component';
import { ProcessingOrderControllerService } from '../../../../api/api/processingOrderController.service';
import {FileSaverService} from 'ngx-filesaver';
import {ToastrService} from 'ngx-toastr';

@Component({
    selector: 'app-company-orders-list',
    templateUrl: './company-orders-list.component.html',
    styleUrls: ['./company-orders-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CompanyOrdersListComponent implements OnInit {

  @Input()
  orderType: 'RECEIVED' | 'PLACED' = 'RECEIVED';

  @Input()
  reloadPingList$ = new BehaviorSubject<boolean>(false);

  @Input()
  facilityId$ = new BehaviorSubject<number>(null);

  @Input()
  semiProductId$ = new BehaviorSubject<number>(null);

  @Input()
  companyId: number = null;

  @Input()
  companyCustomerId$ = new BehaviorSubject<number>(null);

  @Input()
  openOnly$ = new BehaviorSubject<boolean>(false);

  @Output()
  showing = new EventEmitter<number>();

  @Output()
  countAll = new EventEmitter<number>();

  orders$: Observable<ApiPaginatedListApiStockOrder>;

  sortOptions: SortOption[];
  sortingParams$ = new BehaviorSubject(null);

  page = 1;
  pageSize = 10;
  paging$ = new BehaviorSubject<number>(1);

  allOrders = 0;
  showedOrders = 0;

  cbCheckedAll = new UntypedFormControl(false);

  constructor(
    private router: Router,
    private globalEventsManager: GlobalEventManagerService,
    private toastService: ToastrService,
    private stockOrderController: StockOrderControllerService,
    private processingOrderController: ProcessingOrderControllerService,
    private fileSaverService: FileSaverService,
    private modalService: NgbModalImproved
  ) { }

  ngOnInit(): void {
    this.initializeSortOptions().then();
    this.initializeObservables().then();
  }

  changeSort(event) {
    if (event.key === 'cb') {
      return;
    }
    this.sortingParams$.next({ sortBy: event.key, sort: event.sortOrder });
  }

  onPageChange(event) {
    this.paging$.next(event);
  }

  kgsOf(order: ApiStockOrder) {
    if (order.measureUnitType.weight) {
      return order.measureUnitType.weight * order.totalQuantity;
    }
    return '-';
  }

  showPagination() {
    return ((this.showedOrders - this.pageSize) === 0 && this.allOrders >= this.pageSize) || this.page > 1;
  }

  edit(order: ApiStockOrder) {
    this.router.navigate(['my-stock', 'processing', 'update', order.id]).then();
  }

  history(item: ApiStockOrder) {
    this.router.navigate(['my-stock', 'all-stock', 'stock-order', item.id, 'view'],
      { queryParams: { returnUrl: this.router.routerState.snapshot.url }}).then();
   }

  approveReject(item: ApiStockOrder) {
    const modalRef = this.modalService.open(ApproveRejectTransactionModalComponent, { centered: true });
    Object.assign(modalRef.componentInstance, {
      title: $localize`:@@orderHistoryView.rejectTransaction.modal.title:Approve / reject transaction`,
      instructionsHtml: $localize`:@@orderHistoryView.rejectTransaction.modal.instructionsHtml:Comment`,
      stockOrderId: item.id
    });
    modalRef.result.then(confirmed => {
      if (confirmed) {
        this.reloadPingList$.next(true);
      }
    });
  }

  payment(order: ApiStockOrder) {
    this.router.navigate(['my-stock', 'payments', 'customer-order', order.id, 'new'],
      { queryParams: {returnUrl: this.router.routerState.snapshot.url }}).then();
  }

  openQRCodes(order: ApiStockOrder) {

    if (!order.qrCodeTag) {
      return;
    }

    const modalRef = this.modalService.open(GenerateQRCodeModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    Object.assign(modalRef.componentInstance, {
      qrCodeTag: order.qrCodeTag,
      qrCodeFinalProduct: order.qrCodeTagFinalProduct
    });
  }

  private async initializeSortOptions() {

    this.sortOptions = [
      {
        key: 'deliveryTime',
        name: $localize`:@@orderList.sortOptions.dateOfDelivery.name:Date of delivery`,
      },
      {
        key: 'semiProduct',
        name: $localize`:@@orderList.sortOptions.semiProduct.name:SKU`,
        inactive: true,
      },
      {
        key: 'client',
        name: $localize`:@@orderList.sortOptions.client.name:Client`,
        inactive: true,
        hide: this.orderType === 'PLACED'
      },
      {
        key: 'customer',
        name: $localize`:@@orderList.sortOptions.customer.name:Customer`,
        inactive: true,
        hide: this.orderType === 'RECEIVED'
      },
      {
        key: 'orderId',
        name: $localize`:@@orderList.sortOptions.orderId.name:Order ID`,
        inactive: true,
      },
      {
        key: 'toFacility',
        name: $localize`:@@orderList.sortOptions.toFacility.name:To facility`,
        inactive: true,
        hide: this.orderType === 'PLACED'
      },
      {
        key: 'orderedTo',
        name: $localize`:@@orderList.sortOptions.orderedTo.name:Ordered to`,
        inactive: true,
        hide: this.orderType === 'RECEIVED'
      },
      {
        key: 'fullfilled',
        name: $localize`:@@orderList.sortOptions.quantityFulfilled.name:Quantity / Fulfilled`,
        inactive: true,
      },
      {
        key: 'unit',
        name: $localize`:@@orderList.sortOptions.unit.name:Unit`,
        inactive: true,
      },
      {
        key: 'kilos',
        name: $localize`:@@orderList.sortOptions.kgs.name:kgs`,
        inactive: true,
      },
      {
        key: 'updateTimestamp',
        name: $localize`:@@orderList.sortOptions.lastChange.name:Time of last change`,
        defaultSortOrder: 'DESC',
      },
      {
        key: 'actions',
        name: $localize`:@@orderList.sortOptions.actions.name:Actions`,
        inactive: true
      }
    ];

    this.sortingParams$.next({ sortBy: 'updateTimestamp', sort: 'DESC' });
  }

  private async initializeObservables() {

    this.orders$ = combineLatest([
      this.reloadPingList$,
      this.paging$,
      this.sortingParams$,
      this.facilityId$,
      this.semiProductId$,
      this.openOnly$,
      this.companyCustomerId$
    ]).pipe(
      map(([
             reload,
             page,
             sortingParams,
             facilityId,
             semiProductId,
             openOnly,
             companyCustomerId]) => {
        return {
          offset: (page - 1) * this.pageSize,
          limit: this.pageSize,
          ...sortingParams,
          companyId: this.companyId,
          facilityId,
          semiProductId,
          openOnly,
          companyCustomerId
        };
      }),
      tap(() => this.globalEventsManager.showLoading(true)),
      switchMap(params => this.loadStockOrders(params)),
      map(response => {

        if (response && response.data) {
          this.setCounts(response.data.count);
          return response.data;
        } else {
          return null;
        }
      }),
      tap(() => this.globalEventsManager.showLoading(false)),
      finalize(() => this.globalEventsManager.showLoading(false))
    );
  }

  private loadStockOrders(params: GetQuoteOrdersInFacility.PartialParamMap | GetStockOrdersInFacilityForCustomer.PartialParamMap):
    Observable<ApiPaginatedResponseApiStockOrder> {

    // If we are in input mode, that means we need stock orders that are quoted to the current company
    if (this.orderType === 'RECEIVED') {

      return this.stockOrderController.getQuoteOrdersInFacilityByMap(params);

    } else if (this.orderType === 'PLACED') {

      // If we are in customer mode, that means we need stock orders the were created form the current company for a customer company
      return this.stockOrderController.getStockOrdersInFacilityForCustomerByMap(params);
    }

    throw Error('Wrong mode: ' + this.orderType);
  }

  private setCounts(allCount: number) {

    this.allOrders = allCount;

    if (this.pageSize > this.allOrders) {
      this.showedOrders = this.allOrders;
    } else {
      const temp = this.allOrders - (this.pageSize * (this.page - 1));
      this.showedOrders = temp >= this.pageSize ? this.pageSize : temp;
    }

    this.showing.emit(this.showedOrders);
    this.countAll.emit(this.allOrders);
  }

  canDelete(order: ApiStockOrder) {
    return this.orderType !== 'RECEIVED' && Math.abs(order.fulfilledQuantity - order.availableQuantity) < 0.0000000001;
  }

  async delete(order: ApiStockOrder) {

    const result = await this.globalEventsManager.openMessageModal({
      type: 'warning',
      message: $localize`:@@orderList.delete.error.message:Are you sure you want to delete the order?`,
      options: { centered: true }
    });

    if (result !== 'ok') {
      return;
    }

    this.stockOrderController.getStockOrder(order.id, true)
      .pipe(
        tap(() => this.globalEventsManager.showLoading(true)),
        switchMap(orderResp => {
          if (orderResp && orderResp.status === 'OK' && orderResp.data) {
            return this.processingOrderController.deleteProcessingOrder(orderResp.data.processingOrder.id);
          }
          return of(null);
        })
      )
      .subscribe(
        resp => {
          if (resp && resp.status === 'OK') {
            this.reloadPingList$.next(true);
          }
        }
      );
  }

  async exportGeoData(order: ApiStockOrder) {

    this.globalEventsManager.showLoading(true);

    const res = await this.stockOrderController.exportGeoData(order.id)
      .pipe(
        take(1),
        finalize(() => {
          this.globalEventsManager.showLoading(false);
        })
      ).toPromise();

    if (res.size > 0) {
      this.fileSaverService.save(res, 'geoData.geojson');
    } else {
      this.toastService.info($localize`:@@orderList.export.geojson.noDataAvailable:There is no Geo data available for this order`);
      return;
    }

  }
}
