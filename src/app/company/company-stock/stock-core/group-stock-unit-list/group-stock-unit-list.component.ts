import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of, Subscription } from 'rxjs';
import { DeliveryDates } from '../stock-core-tab/stock-core-tab.component';
import { SortOption } from '../../../../shared/result-sorter/result-sorter-types';
import { UntypedFormControl } from '@angular/forms';
import {finalize, map, skip, switchMap, take, tap} from 'rxjs/operators';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { StockOrderControllerService } from '../../../../../api/api/stockOrderController.service';
import { ApiPaginatedListApiStockOrder } from '../../../../../api/model/apiPaginatedListApiStockOrder';
import { formatDateWithDots } from '../../../../../shared/utils';
import { ApiStockOrder } from '../../../../../api/model/apiStockOrder';
import { StockOrderType } from '../../../../../shared/types';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiDefaultResponse } from '../../../../../api/model/apiDefaultResponse';
import StatusEnum = ApiDefaultResponse.StatusEnum;
import { ProcessingOrderControllerService } from '../../../../../api/api/processingOrderController.service';
import { GroupStockOrderControllerService } from '../../../../../api/api/groupStockOrderController.service';
import { ApiPaginatedResponseApiGroupStockOrder } from '../../../../../api/model/apiPaginatedResponseApiGroupStockOrder';
import { ApiPaginatedListApiGroupStockOrder } from '../../../../../api/model/apiPaginatedListApiGroupStockOrder';
import { ApiGroupStockOrder } from '../../../../../api/model/apiGroupStockOrder';
import { AggregatedStockItem } from '../stock-unit-list/models';
import {FileSaverService} from 'ngx-filesaver';
import {ToastrService} from 'ngx-toastr';

@Component({
    selector: 'app-group-stock-unit-list',
    templateUrl: './group-stock-unit-list.component.html',
    styleUrls: ['./group-stock-unit-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class GroupStockUnitListComponent implements OnInit, OnDestroy {

  @Input()
  reloadPingList$ = new BehaviorSubject<boolean>(false);

  @Input()
  facilityId$ = new BehaviorSubject<number>(null);

  @Input()
  purchaseOrderOnly$ = new BehaviorSubject<boolean>(true);

  @Input()
  availableOnly$ = new BehaviorSubject<boolean>(false);

  @Input()
  deliveryDatesPing$ = new BehaviorSubject<DeliveryDates>({ from: null, to: null });

  @Input()
  clickClearCheckboxesPing$ = new BehaviorSubject<boolean>(false);

  @Input()
  selectedOrders: ApiGroupStockOrder[];

  @Input()
  semiProductId$ = new BehaviorSubject<number>(null);

  @Output()
  countAll = new EventEmitter<number>();

  @Output()
  showing = new EventEmitter<number>();

  @Output()
  selectedIdsChanged = new EventEmitter<ApiStockOrder[]>();

  private subscriptions: Subscription[] = [];

  sortOptions: SortOption[];
  private sortingParams$ = new BehaviorSubject(null);

  private allOrders = 0;
  private showedOrders = 0;
  page = 1;
  pageSize = 10;
  private paging$ = new BehaviorSubject<number>(1);

  cbCheckedAll = new UntypedFormControl(false);
  private allSelected = false;
  currentData: ApiGroupStockOrder[];

  orders$: Observable<ApiPaginatedListApiGroupStockOrder>;
  aggregatedOrders: AggregatedStockItem[];

  constructor(
      private router: Router,
      private route: ActivatedRoute,
      private globalEventsManager: GlobalEventManagerService,
      private fileSaverService: FileSaverService,
      private toastService: ToastrService,
      private stockOrderControllerService: StockOrderControllerService,
      private groupStockOrderControllerService: GroupStockOrderControllerService,
      private processingOrderController: ProcessingOrderControllerService,
  ) { }

  ngOnInit(): void {

    this.subscriptions.push(
        this.clickClearCheckboxesPing$.subscribe(val => {
          if (val) {
            this.clearCBs();
          }
        }),

        combineLatest([
          this.reloadPingList$,
          this.facilityId$,
          this.purchaseOrderOnly$,
          this.availableOnly$,
          this.deliveryDatesPing$,
          this.semiProductId$,
        ]).pipe(skip(1))
            .subscribe(() => this.selectedOrders = [])
    );

    this.initSortOptions();

    this.orders$ = combineLatest([
      this.reloadPingList$,
      this.paging$,
      this.sortingParams$,
      this.facilityId$,
      this.purchaseOrderOnly$,
      this.availableOnly$,
      this.deliveryDatesPing$,
      this.semiProductId$,
    ]).pipe(
        map(([
               ping,
               page,
               sorting,
               facilityId,
               isPurchaseOrderOnly,
               availableOnly,
               deliveryDates,
               semiProductId]) => {
          return {
            offset: (page - 1) * this.pageSize,
            limit: this.pageSize,
            ...sorting,
            facilityId,
            isPurchaseOrderOnly,
            availableOnly,
            productionDateStart: deliveryDates.from,
            productionDateEnd: deliveryDates.to,
            semiProductId
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

  ngOnDestroy(): void {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }

  private initSortOptions() {
    this.sortOptions = [
      {
        key: 'cb',
        name: '',
        inactive: true,
        selectAllCheckbox: false
      },
      {
        key: 'date',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.production.name:Production date`,
        defaultSortOrder: 'DESC'
      },
      {
        key: 'identifier',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.identifier.name:Identifier`,
        inactive: true,
      },
      {
        key: 'sacNumber',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.sacNumber.name:No. of sacs`,
        inactive: true,
      },
      {
        key: 'orderType',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.orderType.name:Type`,
        inactive: true,
      },
      {
        key: 'semiProduct',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.semiProduct.name:Semi-product`,
        inactive: true
      },
      {
        key: 'quantity',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.quantityFiledAvailable.name:Quantity / Filled / Available`,
        inactive: true,
      },
      {
        key: 'unit',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.unit.name:Unit`,
        inactive: true,
      },
      {
        key: 'deliveryTime',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.deliveryTime.name:Delivery date`,
      },
      {
        key: 'updateTimestamp',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.lastChange.name:Date of last change`,
        defaultSortOrder: 'DESC',
      },
      {
        key: 'isAvailable',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.status.name:Status`,
        inactive: true,
      },
      {
        key: 'actions',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.actions.name:Actions`,
        inactive: true
      }
    ];

    this.sortingParams$.next({ sortBy: 'updateTimestamp', sort: 'DESC' });
  }

  private loadStockOrders(params): Observable<ApiPaginatedResponseApiGroupStockOrder> {
    const facilityId = params.facilityId;
    delete params.facilityId;

    if (!facilityId) {
      return of({
        data: {
          count: 0,
          items: []
        },
        status: StatusEnum.OK
      });
    }
    return this.groupStockOrderControllerService.getGroupedStockOrderListByMap({ ...params, facilityId });
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

  edit(order: ApiGroupStockOrder) {
    switch (order.orderType as StockOrderType) {
      case 'PURCHASE_ORDER':
        this.router.navigate(['my-stock', 'deliveries', 'update', order.groupedIds[0]]).then();
        return;
      case 'GENERAL_ORDER':
      case 'PROCESSING_ORDER':
      case 'TRANSFER_ORDER':
        this.router.navigate(['my-stock', 'processing', 'update', order.groupedIds[0]]).then();
        return;

      default:
        throw new Error('Unsupported Stock order type');
    }
  }

  history(item: ApiGroupStockOrder) {
    this.router.navigate(['all-stock', 'stock-order', item.groupedIds[0], 'view'],
        { relativeTo: this.route.parent.parent, queryParams: { returnUrl: this.router.routerState.snapshot.url }}).then();
  }

  canDelete(order: ApiGroupStockOrder) {
    if (order.orderType === 'PROCESSING_ORDER') { return true; }
    if (order.orderType === 'TRANSFER_ORDER') { return true; }
    if (order.orderType === 'GENERAL_ORDER') { return Math.abs(order.fulfilledQuantity - order.availableQuantity) < 0.0000000001; }
    return true;
  }

  async delete(order: ApiGroupStockOrder) {
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

        const stockOrderResp = await this.stockOrderControllerService.getStockOrder(order.groupedIds[0], true).pipe(take(1)).toPromise();
        if (stockOrderResp && stockOrderResp.status === 'OK' && stockOrderResp.data) {
          const procOrderResp = await this.processingOrderController.deleteProcessingOrder(stockOrderResp.data.processingOrder.id).pipe(take(1)).toPromise();
          if (procOrderResp && procOrderResp.status === 'OK') {
            this.reloadPingList$.next(true);
          }
        }

        return;
      }

      // Remove purchase order
      const response = await this.stockOrderControllerService.deleteStockOrder(order.groupedIds[0]).pipe(take(1)).toPromise();
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

  cbSelected(order: ApiGroupStockOrder, index: number) {

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

        if (item.groupedIds.filter(v => order.groupedIds.includes(v)).length) {

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

  formatDate(productionDate) {
    if (productionDate) {
      return formatDateWithDots(productionDate);
    }
    return '';
  }

  aggregateOrderItems(items: ApiGroupStockOrder[]): AggregatedStockItem[] {

    // Aggregate semi-products
    const aggregatedSemiProductsMap: Map<string, AggregatedStockItem> = items
        .filter(stockOrder => stockOrder.semiProductName)
        .reduce((acc: Map<string, AggregatedStockItem>, item: ApiGroupStockOrder) => {

          const nextTotalQuantity = item.totalQuantity ? item.totalQuantity : 0;

          if (acc.has(item.semiProductName)) {
            const prevElem = acc.get(item.semiProductName);
            acc.set(item.semiProductName, {
              ...prevElem,
              amount: nextTotalQuantity + prevElem.amount
            });
          } else {
            acc.set(item.semiProductName, {
              amount: nextTotalQuantity,
              measureUnit: item.unitLabel,
              stockUnitName: item.semiProductName
            });
          }
          return acc;
        }, new Map<string, AggregatedStockItem>());

    // Aggregate final products
    const aggregatedFinalProducts: Map<string, AggregatedStockItem> = items
        .filter(stockOrder => stockOrder.finalProductName)
        .reduce((acc: Map<string, AggregatedStockItem>, item: ApiGroupStockOrder) => {

          const nextTotalQuantity = item.totalQuantity ? item.totalQuantity : 0;

          if (acc.has(item.finalProductName)) {
            const prevElem = acc.get(item.finalProductName);
            acc.set(item.finalProductName, {
              ...prevElem,
              amount: nextTotalQuantity + prevElem.amount
            });
          } else {
            acc.set(item.finalProductName, {
              amount: nextTotalQuantity,
              measureUnit: item.unitLabel,
              stockUnitName: item.finalProductName
            });
          }
          return acc;
        }, new Map<string, AggregatedStockItem>());

    return [...Array.from(aggregatedSemiProductsMap.values()), ...Array.from(aggregatedFinalProducts.values())];
  }

  async exportGeoData(order: ApiGroupStockOrder) {

    const firstOrderId = order.groupedIds[0];

    this.globalEventsManager.showLoading(true);
    const res = await this.stockOrderControllerService.exportGeoData(firstOrderId)
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
