import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { ApiPaginatedListApiStockOrder } from '../../../../api/model/apiPaginatedListApiStockOrder';
import { SortOption } from '../../../shared/result-sorter/result-sorter-types';
import { FormControl } from '@angular/forms';
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
  styleUrls: ['./company-orders-list.component.scss']
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

  cbCheckedAll = new FormControl(false);

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

  async exportWhisp(order: ApiStockOrder) {

    const csv_header =[];
    const csv_content = [];

    this.globalEventsManager.showLoading(true);

    const res = await this.stockOrderController.exportGeoData(order.id)
      .pipe(
        take(1),
        finalize(() => {
          this.globalEventsManager.showLoading(false);
        })
      ).toPromise();

    if (res.size > 0) {
      // Send the result to whisp api
      const res_whisp = await this.stockOrderController.exportToWhisp(res)
      .pipe(
        take(1),
        finalize(() => {
          this.toastService.info(res_whisp);
          this.globalEventsManager.showLoading(false);
        })
      ).toPromise();
       console.log("after whisp call: ");
       console.log(res_whisp);
      if(res_whisp.data !== null) {
      
        // this.jsonToCsv(res_whisp.data, 'whisp_data.csv');
        this.generateAndDownloadCSV(res_whisp.data, 'whisp_data.csv');
      }
    } else {
      this.toastService.info($localize`:@@orderList.export.geojson.noDataAvailable:There is no Geo data available for this order`);
      return;
    }

  }

  /**
   * Convertit un objet JSON en CSV et déclenche le téléchargement
   */

  private jsonToCsv_old(jsonData: any, filename: string) {
    // Vérifie si les données sont un tableau
    const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
    
    if (dataArray.length === 0) {
      console.warn('Aucune donnée à exporter');
      return;
    }

    // Récupère les en-têtes (clés du premier objet)
    const headers = Object.keys(dataArray[0]);

    // remove les 2 cles inutiles
    const index = headers.indexOf('external_id');
    delete headers[index];
    const index2 = headers.indexOf('geojson'); 
    delete headers[index2];


    // Prépare les lignes CSV
    const csvRows: string[] = [];
    
    // Ajoute les en-têtes
    csvRows.push(headers.join(','));

    // Ajoute les données
    dataArray.forEach(item => {
      const row = headers.map(header => {
        // Gestion des valeurs imbriquées (optionnelle)
        const value = this.getNestedValue(item, header);
        return this.escapeCsvValue(value);
      });
      csvRows.push(row.join(','));
    });
    // Crée et télécharge le fichier
    this.downloadCsv(csvRows.join('\n'), filename);
  }

  /**
   * Extrait les valeurs imbriquées (si header contient des points)
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o?.[p], obj);
  }

  /**
   * Échappe les valeurs pour le format CSV
   */
  private escapeCsvValue(value: any): string {
    if (value === null || value === undefined) return '';
    
    // Convertit les dates en string
    if (value instanceof Date) return value.toISOString();
    
    const strValue = String(value);
    
    // Si la valeur contient des virgules, guillemets ou sauts de ligne
    if (/[,"\n]/.test(strValue)) {
      return `"${strValue.replace(/"/g, '""')}"`;
    }
    
    return strValue;
  }

  /**
   * Télécharge le contenu CSV
   */
  private downloadCsv(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
   
    // Nettoyage
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

    // let dwldLink = document.createElement("a");
    //  let isSafariBrowser = navigator.userAgent.indexOf(
    //     'Safari') != -1 &&
    //     navigator.userAgent.indexOf('Chrome') == -1;

    // // If Safari open in new window to
    // // save file with random filename.
    // if (isSafariBrowser) {
    //     dwldLink.setAttribute("target", "_blank");
    // }
    // dwldLink.setAttribute("href", url);
    // dwldLink.setAttribute("download", filename + ".csv");
    // dwldLink.style.visibility = "hidden";
    // document.body.appendChild(dwldLink);
    // dwldLink.click();
    // document.body.removeChild(dwldLink);
  }

  generateAndDownloadCSV(data_json: any, filename: string) {
    if (!data_json.features?.length) {
      // console.error('Aucune donnée disponible pour l\'export');
      this.toastService.info('Aucune donnée disponible pour lexport');
      return;
    }

    // Récupérer toutes les propriétés du premier feature (en excluant external_id)
    const properties = data_json.features[0].properties;
    const excludedKeys = ['external_id','geojson'];
    const headers = Object.keys(properties)
      .filter(key => !excludedKeys.includes(key))
      .join(',');

    // Créer le contenu CSV
    let csvContent = headers + '\n';
    // Ajouter les lignes de données
    data_json.features.forEach(feature => {
      const row = Object.entries(feature.properties)
        .filter(([key]) => !excludedKeys.includes(key))
        .map(([_, value]) => {
          // Gérer les valeurs null/undefined et les chaînes contenant des virgules
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
          return value;
        })
        .join(',');
      
      csvContent += row + '\n';
    });

    // Créer et déclencher le téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'export_whisp_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


}
