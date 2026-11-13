import { Router } from '@angular/router';
import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { ApiPaginatedListApiBulkPayment } from '../../../../../api/model/apiPaginatedListApiBulkPayment';
import { PaymentControllerService } from '../../../../../api/api/paymentController.service';
import { SortOption } from '../../../../shared/result-sorter/result-sorter-types';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { ApiPaginatedResponseApiBulkPayment } from '../../../../../api/model/apiPaginatedResponseApiBulkPayment';

@Component({
    selector: 'app-stock-payments-bulk-list',
    templateUrl: './stock-payments-bulk-list.component.html',
    styleUrls: ['./stock-payments-bulk-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class StockPaymentsBulkListComponent implements OnInit {

  @Input()
  companyId: number;

  @Input()
  readOnly = false;

  @Output()
  showing = new EventEmitter<number>();

  @Output()
  countAll = new EventEmitter<number>();

  allPayments = 0;
  showedPayments = 0;

  reloadPingList$ = new BehaviorSubject<boolean>(false);
  pagingParams$ = new BehaviorSubject({});
  sortingParams$ = new BehaviorSubject(null);
  paging$ = new BehaviorSubject<number>(1);
  page = 0;
  pageSize = 10;

  bulkPayments$: Observable<ApiPaginatedListApiBulkPayment>;
  sortOptions: SortOption[];

  constructor(
      private router: Router,
      private paymentControllerService: PaymentControllerService,
      private globalEventManager: GlobalEventManagerService,
  ) { }

  ngOnInit(): void {

    this.initSortOptions();

    this.bulkPayments$ = combineLatest([
      this.reloadPingList$,
      this.paging$,
      this.sortingParams$
    ]).pipe(
        map(([ping, page, sorting]) => {
          return {
            offset: (page - 1) * this.pageSize,
            limit: this.pageSize,
            ...sorting
          };
        }),
        tap(() => this.globalEventManager.showLoading(true)),
        switchMap(params => {
          return this.loadBulkPayments(params);
        }),
        map((resp: ApiPaginatedResponseApiBulkPayment) => {

          if (!resp) {
            return null;
          }

          this.allPayments = 0;
          this.showedPayments = 0;

          if (resp.data.count) {
            this.allPayments = resp.data.count;
          }

          if (resp.data.count && (this.pageSize - resp.data.count > 0)) {
            this.showedPayments = resp.data.count;

          } else if (resp.data.count && (this.pageSize - resp.data.count <= 0)) {
            const temp = resp.data.count - (this.pageSize * (this.page - 1));
            this.showedPayments = temp >= this.pageSize ? this.pageSize : temp;
          }
          this.showing.emit(this.showedPayments);
          this.countAll.emit(this.allPayments);

          return resp.data;
        }),
        tap(() => this.globalEventManager.showLoading(false))
    );
  }

  initSortOptions() {
    this.sortOptions = [
      {
        key: 'receiptNumber',
        name: $localize`:@@productLabelBulkPayments.sortOptions.name.name:Receipt number`,
        defaultSortOrder: 'ASC'
      },
      {
        key: 'paymentPurposeType',
        name: $localize`:@@productLabelBulkPayments.sortOptions.paymentPurposeType.name:Payment purpose`,
        // inactive: true
      },
      {
        key: 'totalAmount',
        name: $localize`:@@productLabelBulkPayments.sortOptions.amount.name:Amount`,
        // inactive: true
      },
      {
        key: 'actions',
        name: $localize`:@@productLabelBulkPayments.sortOptions.actions.name:Actions`,
        inactive: true
      }
    ];
  }

  loadBulkPayments(params): Observable<ApiPaginatedResponseApiBulkPayment> {
    return this.paymentControllerService.listBulkPaymentsByCompanyByMap({
      ...params,
      id: this.companyId
    });
  }

  editBulkPayment(bulkPayment) {
    this.router.navigate(['my-stock', 'payments', 'deliveries', 'bulk-payment', 'update', bulkPayment.id]).then();
  }

  changeSort(event) {
    this.sortingParams$.next({ sortBy: event.key, sort: event.sortOrder });
  }

  showPagination() {
    return ((this.showedPayments - this.pageSize) === 0 && this.allPayments > this.pageSize) || this.page > 1;
  }

  readablePaymentPurpose(id) {
    return this.paymentPurposeTypes[id];
  }

  get paymentPurposeTypes() {
    const obj = {};
    obj['ADVANCE_PAYMENT'] = $localize`:@@paymentForm.paymentPurposeTypes.advancedPayment:Advanced payment`;
    obj['FIRST_INSTALLMENT'] = $localize`:@@paymentForm.paymentPurposeTypes.firstInstallment:Cherry payment`;
    obj['SECOND_INSTALLMENT'] = $localize`:@@paymentForm.paymentPurposeTypes.secondInstallment:Member bonus`;
    obj['WOMEN_PREMIUM'] = $localize`:@@paymentForm.paymentPurposeTypes.womenPreminum:AF Women premium`;
    obj['INVOICE_PAYMENT'] = $localize`:@@paymentForm.paymentPurposeTypes.invoicePayment:Invoice payment`;
    return obj;
  }

  onPageChange(event) {
    this.paging$.next(event);
  }

  reloadPage() {
    this.reloadPingList$.next(true);
  }

}
