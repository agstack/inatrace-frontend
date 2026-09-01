import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { ApiTransaction } from '../../../../../api/model/apiTransaction';
import { ApiStockOrder } from '../../../../../api/model/apiStockOrder';
import { StockOrderControllerService } from '../../../../../api/api/stockOrderController.service';
import { StockOrderType } from '../../../../../shared/types';
import { ApiStockOrderHistory } from '../../../../../api/model/apiStockOrderHistory';
import { ApiStockOrderHistoryTimelineItem } from '../../../../../api/model/apiStockOrderHistoryTimelineItem';
import { ApiFacility } from '../../../../../api/model/apiFacility';
import { ApiMeasureUnitType } from '../../../../../api/model/apiMeasureUnitType';
import { FileSaverService } from 'ngx-filesaver';

interface GroupedStockOrders {
  processingDate: string;
  facility: ApiFacility;
  internalLotNumber: string;
  stockOrders: ApiStockOrder[];
  summedUpQuantity: number;
  measureUnitType: ApiMeasureUnitType;
}

@Component({
  selector: 'app-batch-history',
  templateUrl: './batch-history.component.html',
  styleUrls: ['./batch-history.component.scss']
})
export class BatchHistoryComponent implements OnInit {

  qrCodeSize = 150;

  faTimes = faTimes;

  reloadPing$ = new BehaviorSubject<boolean>(false);

  productId = this.route.snapshot.params.id;
  orderId = 0;

  history$: Observable<ApiStockOrderHistory> = combineLatest([this.reloadPing$, this.route.params])
    .pipe(
      tap(() => this.globalEventsManager.showLoading(true)),
      switchMap(val => {
        this.orderId = val[1].stockOrderId;
        return this.stockOrderService.getStockOrderAggregatedHistory(val[1].stockOrderId);
      }),
      map(val => {
        if (val && val.status === 'OK') {

          const stockOrderHistory = val.data;

          stockOrderHistory.timelineItems.forEach(timelineItem => {
            if (timelineItem.processingOrder) {

              const groups = new Map<string, ApiStockOrder[]>();
              for (const tso of timelineItem.processingOrder.targetStockOrders) {
                if (tso.sacNumber != null) {

                  // If sac number is present, parse the internal LOT number without the sac number part
                  const lastSlashIndex = tso.internalLotNumber.lastIndexOf('/');
                  if (lastSlashIndex !== -1) {

                    const internalLOTNumber = tso.internalLotNumber.substring(0, lastSlashIndex);
                    if (groups.has(internalLOTNumber)) {
                      groups.get(internalLOTNumber).push(tso);
                    } else {
                      groups.set(internalLOTNumber, [tso]);
                    }
                  }
                }
              }

              // Add the grouped stock orders into the Stock order history
              const groupsArray: GroupedStockOrders[] = [];
              groups.forEach((stockOrders, internalLOTNumber) => {
                const stockOrdersGroup: GroupedStockOrders = {
                  stockOrders,
                  facility: stockOrders[0].facility,
                  internalLotNumber: internalLOTNumber,
                  processingDate: stockOrders[0].productionDate,
                  summedUpQuantity: stockOrders.map(so => so.totalQuantity).reduce((previousValue, currentValue) => {
                    return (previousValue ?? 0) + currentValue;
                  }),
                  measureUnitType: stockOrders[0].measureUnitType
                };
                groupsArray.push(stockOrdersGroup);

                // Remove the stock orders from the original target stock order array
                stockOrders.forEach(so => {
                  const removeIndex = timelineItem.processingOrder.targetStockOrders.findIndex(tso => tso.id === so.id);
                  timelineItem.processingOrder.targetStockOrders.splice(removeIndex, 1);
                });
              });
              timelineItem.processingOrder['stockOrderGroups'] = groupsArray;
            }
          });

          return stockOrderHistory;
        }
        return null;
      }),
      tap(() => this.globalEventsManager.showLoading(false)),
      shareReplay(1)
    );

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private stockOrderService: StockOrderControllerService,
    private globalEventsManager: GlobalEventManagerService,
     private fileSaverService: FileSaverService
  ) { }

  getTargetStockOrders(timelineItem: ApiStockOrderHistoryTimelineItem) {
    return timelineItem.purchaseOrders?.length > 0 ? timelineItem.purchaseOrders : timelineItem.processingOrder.targetStockOrders;
  }

  getStockOrderGroups(timelineItem: ApiStockOrderHistoryTimelineItem): GroupedStockOrders[] {
    return timelineItem.processingOrder ? timelineItem.processingOrder['stockOrderGroups'] : [];
  }

  isRoot(root: ApiStockOrder, one: ApiStockOrder) {
    return root.id === one.id;
  }

  processingOrderName(historyItem: ApiStockOrderHistoryTimelineItem) {

    if (historyItem.processingOrder) {
      if (historyItem.processingOrder.processingAction) {
        return historyItem.processingOrder.processingAction.name;
      } else {
        return $localize`:@@orderHistoryView.processingOrderName.corruptedHistory: Corrupted history - processing action deleted`;
      }
    }

    return $localize`:@@orderHistoryView.processingOrderName.purchase:Purchase`;
  }

  processingCreationDate(historyItem: ApiStockOrderHistoryTimelineItem) {
    if (!historyItem.processingOrder) { return null; }
    return historyItem.processingOrder.processingDate;
  }

  ngOnInit() {
  }

  goToInput(tx: ApiTransaction) {
    this.router.navigate(['stock-order', tx.sourceStockOrder.id, 'view'], { relativeTo: this.route.parent }).then();
  }

  async goToOutput(tx: ApiTransaction) {
    this.router.navigate(['stock-order', tx.targetStockOrder.id, 'view'], { relativeTo: this.route.parent }).then();
  }

  goToSibling(order: ApiStockOrder) {
    this.router.navigate(['stock-order', order.id, 'view'], { relativeTo: this.route.parent }).then();
  }

  goToOrderView(order: ApiStockOrder) {
    this.router.navigate(['stock-order', order.id, 'view'], { relativeTo: this.route.parent }).then();
  }

  isThisOrder(currentOrder: ApiStockOrder, toShowOrder: ApiStockOrder) {
    return currentOrder.id === toShowOrder.id;
  }

  edit(order: ApiStockOrder) {

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

  qrCodeString(stockOrder: ApiStockOrder) {
    if (!stockOrder) {
      return;
    }
    return stockOrder.id.toString();
  }

  copyToClipboard() {
    document.execCommand('copy');
  }

  transactionColor(tx) {
    if (tx.status === 'CANCELED') { return 'ab-edit-link canceled'; }
    return 'ab-edit-link';
  }

  // Export the table in excel
    async exportSingleCommandHistoryExcel(): Promise<void> {
    
        this.globalEventsManager.showLoading(true);
        try {
          const res = await this.stockOrderService.exportSingleCommandHistory(this.orderId)
              .pipe(take(1))
              .toPromise();
    
          this.fileSaverService.save(res, 'stock_history.xlsx');
        } finally {
          this.globalEventsManager.showLoading(false);
        }
      }
  
      

}
