import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of, Subscription } from 'rxjs';
import { DeliveryDates, StockOrderListingPageMode } from '../stock-core-tab/stock-core-tab.component';
import { SortOption } from '../../../../shared/result-sorter/result-sorter-types';
import { UntypedFormControl } from '@angular/forms';
import { finalize, map, switchMap, take, tap } from 'rxjs/operators';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { StockOrderControllerService } from '../../../../../api/api/stockOrderController.service';
import { ApiPaginatedResponseApiStockOrder } from '../../../../../api/model/apiPaginatedResponseApiStockOrder';
import { ApiPaginatedListApiStockOrder } from '../../../../../api/model/apiPaginatedListApiStockOrder';
import { formatDateWithDots } from '../../../../../shared/utils';
import { ApiStockOrder } from '../../../../../api/model/apiStockOrder';
import { ApiUserCustomer } from '../../../../../api/model/apiUserCustomer';
import { StockOrderType } from '../../../../../shared/types';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiDefaultResponse } from '../../../../../api/model/apiDefaultResponse';
import StatusEnum = ApiDefaultResponse.StatusEnum;
import { AggregatedStockItem } from './models';
import { GenerateQRCodeModalComponent } from '../../../../components/generate-qr-code-modal/generate-qr-code-modal.component';
import { NgbModalImproved } from '../../../../core/ngb-modal-improved/ngb-modal-improved.service';
import { ProcessingOrderControllerService } from '../../../../../api/api/processingOrderController.service';
import { ToastrService } from 'ngx-toastr';
import { FileSaverService } from 'ngx-filesaver';
import { NgbTooltip } from "@ng-bootstrap/ng-bootstrap";
import { SelfOnboardingService } from "../../../../shared-services/self-onboarding.service";

@Component({
    selector: 'app-stock-unit-list',
    templateUrl: './stock-unit-list.component.html',
    styleUrls: ['./stock-unit-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class StockUnitListComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input()
  reloadPingList$ = new BehaviorSubject<boolean>(false);

  @Input()
  facilityId$ = new BehaviorSubject<number>(null);

  @Input()
  openBalanceOnly$ = new BehaviorSubject<boolean>(false);

  @Input()
  purchaseOrderOnly$ = new BehaviorSubject<boolean>(true);

  @Input()
  availableOnly$ = new BehaviorSubject<boolean>(false);

  @Input()
  semiProductId$ = new BehaviorSubject<number>(null);

  @Input()
  selectedOrders: ApiStockOrder[];

  @Input()
  clickAddPaymentsPing$ = new BehaviorSubject<boolean>(false);

  @Input()
  companyId: number = null;

  @Input()
  farmerIdPing$ = new BehaviorSubject<number>(null);

  @Input()
  representativeOfProducerUserCustomerIdPing$ = new BehaviorSubject<number>(null);

  @Input()
  wayOfPaymentPing$ = new BehaviorSubject<string>('');

  @Input()
  womenOnlyPing$ = new BehaviorSubject<boolean>(null);

  @Input()
  deliveryDatesPing$ = new BehaviorSubject<DeliveryDates>({ from: null, to: null });

  @Input()
  searchFarmerNameSurnamePing$ = new BehaviorSubject<string>(null);

  @Input()
  mode: 'PURCHASE' | 'GENERAL' = 'PURCHASE';

  @Input()
  pageListingMode: StockOrderListingPageMode = 'PURCHASE_ORDERS';

  @Input()
  hideCheckbox = false;

  @Output()
  countAll = new EventEmitter<number>();

  @Output()
  showing = new EventEmitter<number>();

  @Output()
  selectedIdsChanged = new EventEmitter<ApiStockOrder[]>();

  @ViewChild('deliveriesListTooltip')
  deliveriesListTooltip: NgbTooltip;

  sortOptions: SortOption[];
  private sortingParams$ = new BehaviorSubject(null);

  private allOrders = 0;
  private showedOrders = 0;
  page = 1;
  pageSize = 10;
  private paging$ = new BehaviorSubject<number>(1);

  cbCheckedAll = new UntypedFormControl(false);
  private allSelected = false;
  currentData: ApiStockOrder[];

  orders$: Observable<ApiPaginatedListApiStockOrder>;
  aggregatedOrders: AggregatedStockItem[];

  subs: Subscription;

  private addPricePerUnitMessage: string = $localize`:@@productLabelStockPayments.addPricePerUnit.message:Add price per unit`;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private globalEventsManager: GlobalEventManagerService,
    private fileSaverService: FileSaverService,
    private stockOrderControllerService: StockOrderControllerService,
    private processingOrderController: ProcessingOrderControllerService,
    private modalService: NgbModalImproved,
    private toasterService: ToastrService,
    private selfOnboardingService: SelfOnboardingService
  ) { }

  ngOnInit(): void {

    this.subs = this.clickAddPaymentsPing$.subscribe(val => {
      if (val) {
        this.addPayments();
      }
    });

    this.initSortOptions();

    this.orders$ = combineLatest([
      this.reloadPingList$,
      this.paging$,
      this.sortingParams$,
      this.facilityId$,
      this.farmerIdPing$,
      this.representativeOfProducerUserCustomerIdPing$,
      this.openBalanceOnly$,
      this.purchaseOrderOnly$,
      this.availableOnly$,
      this.semiProductId$,
      this.wayOfPaymentPing$,
      this.womenOnlyPing$,
      this.deliveryDatesPing$,
      this.searchFarmerNameSurnamePing$
    ]).pipe(
      map(([
             ping,
             page,
             sorting,
             facilityId,
             farmerId,
             representativeOfProducerUserCustomerId,
             isOpenBalanceOnly,
             isPurchaseOrderOnly,
             availableOnly,
             semiProductId,
             wayOfPayment,
             isWomenShare,
             deliveryDates,
             query]) => {
        return {
          offset: (page - 1) * this.pageSize,
          limit: this.pageSize,
          ...sorting,
          facilityId,
          farmerId,
          representativeOfProducerUserCustomerId,
          isOpenBalanceOnly,
          isPurchaseOrderOnly,
          availableOnly,
          semiProductId,
          wayOfPayment,
          isWomenShare,
          productionDateStart: deliveryDates.from,
          productionDateEnd: deliveryDates.to,
          query: query ? query : null
        };
      }),
      tap(() => this.globalEventsManager.showLoading(true)),
      switchMap(params => {
        return this.loadStockOrders(params);
      }),
      map(response => {

        if (response && response.data) {
          this.currentData = response.data.items;
          this.setCounts(response.data.count);
          return response.data;
        } else {
          return null;
        }
      }),
      tap((data: ApiPaginatedListApiStockOrder) => {
        if (data) {
          this.aggregatedOrders = this.aggregateOrderItems(data.items);
        }
      }),
      tap(() => this.refreshCBs()),
      tap(() => this.globalEventsManager.showLoading(false))
    );
  }

  ngAfterViewInit(): void {

    this.subs.add(this.selfOnboardingService.guidedTourStep$.subscribe(step => {

          setTimeout(() => {
            this.deliveriesListTooltip?.close();
          }, 50);

          if (step === 4) {
            setTimeout(() => this.deliveriesListTooltip?.open(), 50);
          }
        })
    )
  }

  ngOnDestroy(): void {
    if (this.subs) { this.subs.unsubscribe(); }
  }

  private initSortOptions() {

    this.sortOptions = [
      {
        key: 'cb',
        name: '',
        selectAllCheckbox: ['PURCHASE_ORDERS'].indexOf(this.pageListingMode) >= 0,
        hide: this.hideCheckbox
      },
      {
        key: 'date',
        name: ['PURCHASE_ORDERS'].indexOf(this.pageListingMode) >= 0
          ? $localize`:@@productLabelPurchaseOrder.sortOptions.deliveryDate.name:Delivery date`
          : $localize`:@@productLabelPurchaseOrder.sortOptions.production.name:Production date`,
        defaultSortOrder: 'DESC'
      },
      {
        key: 'identifier',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.identifier.name:Identifier`,
        inactive: true,
        hide: ['PURCHASE_ORDERS'].indexOf(this.pageListingMode) >= 0,
      },
      {
        key: 'orderType',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.orderType.name:Type`,
        inactive: true,
        hide: ['PURCHASE_ORDERS'].indexOf(this.pageListingMode) >= 0,
      },
      {
        key: 'farmer',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.farmer.name:Farmer`,
        inactive: true,
        hide: ['COMPANY_ADMIN', 'SYSTEM_ADMIN'].indexOf(this.pageListingMode) >= 0,
      },
      {
        key: 'semiProduct',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.semiProduct.name:Semi-product`,
        inactive: true
      },
      {
        key: 'quantity',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.quantity.name:Quantity`,
        inactive: true,
        hide: ['COMPANY_ADMIN', 'SYSTEM_ADMIN'].indexOf(this.pageListingMode) >= 0,
      },
      {
        key: 'quantity',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.quantityFiledAvailable.name:Quantity / Filled / Available`,
        inactive: true,
        hide: ['PURCHASE_ORDERS'].indexOf(this.pageListingMode) >= 0,
      },
      {
        key: 'unit',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.unit.name:Unit`,
        inactive: true,
        hide: ['PURCHASE_ORDERS'].indexOf(this.pageListingMode) >= 0,
      },
      {
        key: 'payable',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.payable.name:Payable / Balance`,
        inactive: true,
        hide: ['COMPANY_ADMIN', 'SYSTEM_ADMIN'].indexOf(this.pageListingMode) >= 0,
      },
      {
        key: 'deliveryTime',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.deliveryTime.name:Delivery date`,
        hide: ['PURCHASE_ORDERS'].indexOf(this.pageListingMode) >= 0,
      },
      {
        key: 'updateTimestamp',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.lastChange.name:Date of last change`,
        defaultSortOrder: 'DESC',
        hide: ['PURCHASE_ORDERS'].indexOf(this.pageListingMode) >= 0,
      },
      {
        key: 'isAvailable',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.status.name:Status`,
        inactive: true,
        hide: ['PURCHASE_ORDERS'].indexOf(this.pageListingMode) >= 0,
      },
      {
        key: 'actions',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.actions.name:Actions`,
        inactive: true
      }
    ];

    if (this.mode === 'PURCHASE') {
      this.sortingParams$.next({ sortBy: 'date', sort: 'DESC' });
    }

    if (this.mode === 'GENERAL') {
      this.sortingParams$.next({ sortBy: 'lastChange', sort: 'DESC' });
    }
  }

  private loadStockOrders(params): Observable<ApiPaginatedResponseApiStockOrder> {

    if (!params.isOpenBalanceOnly) {
      delete params.isOpenBalanceOnly;
    }

    const facilityId = params.facilityId;
    delete params.facilityId;

    if (this.mode === 'PURCHASE') {
      if (!facilityId) {
        return this.stockOrderControllerService.getStockOrderListByCompanyIdByMap({ ...params, companyId: this.companyId });
      }
      return this.stockOrderControllerService.getStockOrderListByFacilityIdByMap({ ...params, facilityId });
    }

    if (this.mode === 'GENERAL') {

      if (!facilityId) {
        return of({
          data: {
            count: 0,
            items: []
          },
          status: StatusEnum.OK
        });
      }
      return this.stockOrderControllerService.getStockOrderListByFacilityIdByMap({ ...params, facilityId });
    }
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

  edit(order: ApiStockOrder) {

    if (this.pageListingMode === 'PURCHASE_ORDERS') {

      this.router.navigate(['my-stock', 'deliveries', 'update', order.id]).then();

    } else {

      switch (order.orderType as StockOrderType) {
        case 'PURCHASE_ORDER':
          this.router.navigate(['my-stock', 'deliveries', 'update', order.id]).then();
          return;
        case 'GENERAL_ORDER':
        case 'PROCESSING_ORDER':
        case 'TRANSFER_ORDER':
          this.router.navigate(['my-stock', 'processing', 'update', order.id]).then();
          return;

        default:
          throw new Error('Unsupported Stock order type');
      }
    }
  }

  history(item: ApiStockOrder) {
    this.router.navigate(['all-stock', 'stock-order', item.id, 'view'],
      { relativeTo: this.route.parent.parent, queryParams: { returnUrl: this.router.routerState.snapshot.url }}).then();
  }

  payment(order: ApiStockOrder) {
    if (order.priceDeterminedLater) {
      this.toasterService.warning(this.addPricePerUnitMessage);
      return;
    }
    this.router.navigate(['my-stock', 'payments', 'delivery', order.id, 'new']).then();
  }

  farmerProfile(id) {
    this.router.navigate(['my-farmers', 'edit', id],
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

  canDelete(order: ApiStockOrder) {
    if (order.orderType === 'PROCESSING_ORDER') { return true; }
    if (order.orderType === 'TRANSFER_ORDER') { return true; }
    if (order.orderType === 'GENERAL_ORDER') { return Math.abs(order.fulfilledQuantity - order.availableQuantity) < 0.0000000001; }
    return true;
  }

  async delete(order: ApiStockOrder) {

    let confirmResult;
    if (order.orderType === 'PROCESSING_ORDER' || order.orderType === 'TRANSFER_ORDER') {
      confirmResult = await this.globalEventsManager.openMessageModal({
        type: 'warning',
        message: $localize`:@@productLabelPurchaseOrder.deleteProcessingOrder.error.message:Are you sure you want to delete the order? This will delete processing transaction and possibly all orders generated from it.`,
        options: { centered: true }
      });
    } else {
      confirmResult = await this.globalEventsManager.openMessageModal({
        type: 'warning',
        message: $localize`:@@productLabelPurchaseOrder.delete.error.message:Are you sure you want to delete the order?`,
        options: { centered: true }
      });
    }

    // If user confirms, the modal result is 'ok'
    if (confirmResult !== 'ok') {
      return;
    }

    try {

      this.globalEventsManager.showLoading(true);

      if (order.orderType === 'PROCESSING_ORDER' || order.orderType === 'TRANSFER_ORDER' || order.orderType === 'GENERAL_ORDER') {

        const stockOrderResp = await this.stockOrderControllerService.getStockOrder(order.id, true).pipe(take(1)).toPromise();
        if (stockOrderResp && stockOrderResp.status === 'OK' && stockOrderResp.data) {
          const procOrderResp = await this.processingOrderController.deleteProcessingOrder(stockOrderResp.data.processingOrder.id).pipe(take(1)).toPromise();
          if (procOrderResp && procOrderResp.status === 'OK') {
            this.reloadPingList$.next(true);
          }
        }

        return;
      }

      // Remove purchase order
      const response = await this.stockOrderControllerService.deleteStockOrder(order.id).pipe(take(1)).toPromise();
      if (response && response.status === StatusEnum.OK) {
        this.reloadPingList$.next(true);
        this.clearCBs();
      }

    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  changeSort(event) {
    if (event.key === 'cb') {
      this.selectAllOnPage(event.checked);
      return;
    }
    this.sortingParams$.next({ sortBy: event.key, sort: event.sortOrder });
  }

  showPagination() {
    return ((this.showedOrders - this.pageSize) === 0 && this.allOrders >= this.pageSize) || this.page > 1;
  }

  onPageChange(event) {
    this.paging$.next(event);
  }

  cbSelected(order: ApiStockOrder, index: number) {

    (this.currentData[index] as any).selected = !(this.currentData[index] as any).selected;

    const selectedIndex = this.selectedOrders.indexOf(order);

    if (selectedIndex !== -1) {
      this.selectedOrders.splice(selectedIndex, 1);
    } else {
      this.selectedOrders.push(order);
    }
    this.selectedIdsChanged.emit(this.selectedOrders);

    if (this.allSelected) {
      this.allSelected = false;
      this.cbCheckedAll.setValue(false);
    } else {
      this.refreshCBs();
    }
  }

  private refreshCBs(){

    if (!this.selectedOrders){
      return;
    }

    let selectedCount = 0;

    for (const item of this.currentData) {
      for (const order of this.selectedOrders) {

        if (order.id === item.id) {

          (item as any).selected = true;
          selectedCount += 1;

          // Prevents having selected multiple same items
          const replaceIndex = this.selectedOrders.indexOf(order);
          if (replaceIndex !== -1) {
            this.selectedOrders.splice(replaceIndex, 1);
            this.selectedOrders.push(item);
          }
          break;
        }

      }
    }

    this.allSelected = selectedCount === this.showedOrders;
    this.cbCheckedAll.setValue(this.allSelected);
  }

  private selectAllOnPage(checked) {

    if (checked) {

      for (const item of this.currentData) {

        // Remove existing item (if exists)
        for (const order of this.selectedOrders) {
          if (order.id === item.id) {
            const replaceIndex = this.selectedOrders.indexOf(order);
            if (replaceIndex !== -1) {
              this.selectedOrders.splice(replaceIndex, 1);
            }
            break;
          }
        }

        // Select and add item
        (item as any).selected = true;
        this.selectedOrders.push(item);
      }

      this.allSelected = true;
      this.selectedIdsChanged.emit(this.selectedOrders);

    } else {

      // Unselect and remove items (from selectedOrders)
      for (const item of this.currentData) {
        for (const order of this.selectedOrders) {
          if (order.id === item.id) {
            (item as any).selected = false;
            const removeIndex = this.selectedOrders.indexOf(order);
            if (removeIndex !== -1) {
              this.selectedOrders.splice(removeIndex, 1);
            }
            break;
          }
        }
      }

      this.allSelected = false;
      this.selectedIdsChanged.emit(this.selectedOrders);
    }
  }

  private clearCBs() {
    this.selectedOrders = [];
    this.allSelected = false;
    this.cbCheckedAll.setValue(false);
    this.selectedIdsChanged.emit(this.selectedOrders);
    for (const item of this.currentData) {
      if ((item as any).selected) { (item as any).selected = false; }
    }
  }

  private addPayments() {
    const poIds = [];
    for (const item of this.selectedOrders) {
      if (item.priceDeterminedLater) {
        continue;
      }
      poIds.push(item.id);
    }
    this.router.navigate(['my-stock', 'payments', 'deliveries', 'bulk-payment', poIds.toString(), 'new', 'PO']).then();
  }

  formatDate(productionDate) {
    if (productionDate) {
      return formatDateWithDots(productionDate);
    }
    return '';
  }
  
  aggregateOrderItems(items: ApiStockOrder[]): AggregatedStockItem[] {

    // Aggregate semi-products
    const aggregatedSemiProductsMap: Map<number, AggregatedStockItem> = items
      .filter(stockOrder => stockOrder.semiProduct && stockOrder.semiProduct.id)
      .reduce((acc: Map<number, AggregatedStockItem>, item: ApiStockOrder) => {

        const nextTotalQuantity = item.totalQuantity ? item.totalQuantity : 0;

        if (acc.has(item.semiProduct.id)) {
          const prevElem = acc.get(item.semiProduct.id);
          acc.set(item.semiProduct.id, {
            ...prevElem,
            amount: nextTotalQuantity + prevElem.amount
          });
        } else {
          acc.set(item.semiProduct.id, {
            amount: nextTotalQuantity,
            measureUnit: item.measureUnitType.label,
            stockUnitName: item.semiProduct.name
          });
        }
        return acc;
      }, new Map<number, AggregatedStockItem>());

    // Aggregate final products
    const aggregatedFinalProducts: Map<number, AggregatedStockItem> = items
      .filter(stockOrder => stockOrder.finalProduct && stockOrder.finalProduct.id)
      .reduce((acc: Map<number, AggregatedStockItem>, item: ApiStockOrder) => {

        const nextTotalQuantity = item.totalQuantity ? item.totalQuantity : 0;

        if (acc.has(item.finalProduct.id)) {
          const prevElem = acc.get(item.finalProduct.id);
          acc.set(item.finalProduct.id, {
            ...prevElem,
            amount: nextTotalQuantity + prevElem.amount
          });
        } else {
          acc.set(item.finalProduct.id, {
            amount: nextTotalQuantity,
            measureUnit: item.measureUnitType.label,
            stockUnitName: `${item.finalProduct.name} (${item.finalProduct.product.name})`
          });
        }
        return acc;
      }, new Map<number, AggregatedStockItem>());
    
    return [...Array.from(aggregatedSemiProductsMap.values()), ...Array.from(aggregatedFinalProducts.values())];
  }

  orderIdentifier(order: ApiStockOrder) {
    return order && (order.identifier || order.internalLotNumber);
  }

  farmerName(farmer: ApiUserCustomer) {

    if (farmer) {
      if (farmer.location?.address?.country?.code === 'RW') {

        const cell = farmer.location.address.cell ? farmer.location.address.cell.substring(0, 2).toLocaleUpperCase() : '--';
        const village = farmer.location.address.village ? farmer.location.address.village.substring(0, 2).toLocaleUpperCase() : '--';
        return farmer.name + ' ' + farmer.surname + ' (' + farmer.id + ', ' + village + '-' + cell + ')';

      } else if (farmer.location?.address?.country?.code === 'HN') {
        const municipality = farmer.location.address.hondurasMunicipality ? farmer.location.address.hondurasMunicipality : '--';
        const village = farmer.location.address.hondurasVillage ? farmer.location.address.hondurasVillage : '--';
        return farmer.name + ' ' + farmer.surname + ' (' + farmer.id + ', ' + municipality + '-' + village + ')';
      }

      return farmer.name + ' ' + farmer.surname;
    }

    return '';
  }

  async exportGeoData(order: ApiStockOrder) {
    this.globalEventsManager.showLoading(true);
    const res = await this.stockOrderControllerService.exportGeoData(order.id)
      .pipe(
        take(1),
        finalize(() => {
          this.globalEventsManager.showLoading(false);
        })
      ).toPromise();
    if (res.size > 0) {
      this.fileSaverService.save(res, 'geoData.geojson');
    } else {
      this.toasterService.info($localize`:@@orderList.export.geojson.noDataAvailable:There is no Geo data available for this order`);
      return;
    }
  }

  continueGuidedTourToProcessing() {
    this.selfOnboardingService.guidedTourNextStep(5);
    this.router.navigate(['my-stock', 'processing']).then();
  }

}
