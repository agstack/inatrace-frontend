import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/core/auth.service';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { ApiPayment } from '../../../../../api/model/apiPayment';
import { PaymentControllerService } from '../../../../../api/api/paymentController.service';
import { SortOption } from '../../../../shared/result-sorter/result-sorter-types';
import { ApiPaginatedResponseApiPayment } from '../../../../../api/model/apiPaginatedResponseApiPayment';
import { formatDateWithDots } from '../../../../../shared/utils';
import { DeliveryDates } from '../../stock-core/stock-core-tab/stock-core-tab.component';
import { ModeEnum } from '../stock-payments-form/stock-payments-form.component';
import PaymentStatusEnum = ApiPayment.PaymentStatusEnum;
import { ApiPaginatedListApiPayment } from '../../../../../api/model/apiPaginatedListApiPayment';

@Component({
  selector: 'app-stock-payments-list',
  templateUrl: './stock-payments-list.component.html',
  styleUrls: ['./stock-payments-list.component.scss']
})
export class StockPaymentsListComponent implements OnInit, OnDestroy {

  @Input()
  reloadPingList$ = new BehaviorSubject<boolean>(false);

  @Input()
  companyId: number;

  @Input()
  currency: string;

  @Input()
  selectedPayments: ApiPayment[];

  @Input()
  wayOfPaymentPing$ = new BehaviorSubject<string>('');

  @Input()
  deliveryDatesPing$ = new BehaviorSubject<DeliveryDates>({ from: null, to: null });

  @Input()
  searchFarmerNameSurnamePing$ = new BehaviorSubject<string>(null);

  @Input()
  farmerIdPing$ = new BehaviorSubject<number>(null);

  @Input()
  representativeOfRecepientUserCustomerIdPing$ = new BehaviorSubject<number>(null);

  @Input()
  readOnly = false;

  @Output()
  showing = new EventEmitter<number>();

  @Output()
  countAll = new EventEmitter<number>();

  @Output()
  selectedPaymentsChanged = new EventEmitter<ApiPayment[]>();

  allPayments = 0;
  showedPayments = 0;

  clickClearCheckboxesPing$ = new BehaviorSubject<boolean>(false);
  cbCheckedAll = new FormControl(false);

  pagingParams$ = new BehaviorSubject({});
  sortingParams$ = new BehaviorSubject(null); // { sortBy: 'productionDate', sort: 'DESC' }
  paging$ = new BehaviorSubject<number>(1);
  page = 0;
  pageSize = 10;

  aggregatedTotalPaid = 0;
  currentData: ApiPayment[];
  sortOptions: SortOption[];
  clearCheckboxesSubscription: Subscription;
  allSelected = false;
  payments$: Observable<ApiPaginatedListApiPayment>;

  /** Ids whose confirmation is in flight, so a double click sends it once. */
  confirmingPaymentIds = new Set<number>();

  constructor(
      private route: ActivatedRoute,
      private router: Router,
      protected globalEventManager: GlobalEventManagerService,
      private authService: AuthService,
      private paymentControllerService: PaymentControllerService
  ) { }

  ngOnInit(): void {

    this.clearCheckboxesSubscription = this.clickClearCheckboxesPing$.subscribe(val => {
      if (val) {
        this.clearCBs();
      }
    });

    this.initSortOptions();

    this.payments$ = combineLatest([
      this.reloadPingList$,
      this.paging$,
      this.sortingParams$,
      this.wayOfPaymentPing$,
      this.farmerIdPing$,
      this.representativeOfRecepientUserCustomerIdPing$,
      this.deliveryDatesPing$,
      this.searchFarmerNameSurnamePing$
    ]).pipe(
        map(([ping, page, sorting, wayOfPayment, farmerId, representativeOfRecipientUserCustomerId, deliveryDates, query]) => {
          return {
            offset: (page - 1) * this.pageSize,
            limit: this.pageSize,
            ...sorting,
            preferredWayOfPayment: wayOfPayment,
            productionDateStart: deliveryDates.from ? deliveryDates.from : null,
            productionDateEnd: deliveryDates.to ? deliveryDates.to : null,
            query: query ? query : null,
            farmerId,
            representativeOfRecipientUserCustomerId
          };
        }),
        tap(() => this.globalEventManager.showLoading(true)),
        switchMap(params => {
          return this.loadPayments(params);
        }),
        map((resp: ApiPaginatedResponseApiPayment) => {

          if (!resp) {
            return null;
          }

          this.clearCBs();

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
          this.currentData = resp.data.items;

          return resp.data;
        }),
        tap((data: ApiPaginatedListApiPayment ) => {
          if (data) {
            this.aggregatedTotalPaid = this.calculateAggregatedTotalPaid(data.items);
          }
        }),
        tap(() => this.globalEventManager.showLoading(false))
    );
  }

  ngOnDestroy() {
    if (this.clearCheckboxesSubscription) {
      this.clearCheckboxesSubscription.unsubscribe();
    }
  }

  initSortOptions() {
    this.sortOptions = [
      {
        key: 'cb',
        name: '',
        selectAllCheckbox: true,
        hide: false
      },
      {
        key: 'purpose',
        name: $localize`:@@productLabelPayments.sortOptions.paymentPurposeType.name:Payment purpose`,
        inactive: true
      },
      {
        key: 'amount',
        name: $localize`:@@productLabelPayments.sortOptions.amount.name:Amount paid to the farmer`,
        inactive: true,
        hide: false
      },
      {
        key: 'recipientUserCustomer',
        name: $localize`:@@productLabelPayments.sortOptions.producer_name.name:Farmer name`,
        inactive: true,
        hide: false
      },
      {
        key: 'recipientCompany',
        name: $localize`:@@productLabelPayments.sortOptions.company_name.name:Company name`,
        inactive: true,
        hide: false
      },
      {
        key: 'productionDate',
        name: $localize`:@@productLabelPayments.sortOptions.deliveryDate.name:Delivery date`,
        hide: false
      },
      {
        key: 'formalCreationTime',
        name: $localize`:@@productLabelPayments.sortOptions.paymentDate.name:Payment date`,
        hide: false
      },
      {
        key: 'preferredWayOfPayment',
        name: $localize`:@@productLabelPayments.sortOptions.wayOfPayment.name:Way of payment`,
        inactive: true,
        hide: false
      },
      {
        key: 'actions',
        name: $localize`:@@productLabelPayments.sortOptions.actions.name:Actions`,
        inactive: true
      }
    ];
  }

  loadPayments(params): Observable<ApiPaginatedResponseApiPayment> {
    return this.paymentControllerService.listPaymentsByCompanyByMap({
      ...params,
      id: this.companyId
    });
  }

  editPayment(payment: ApiPayment) {
    if (payment.recipientType === 'USER_CUSTOMER') {
      this.router.navigate(['my-stock', 'payments', payment.id, 'update', ModeEnum.PURCHASE]).then();
    } else {
      this.router.navigate(['my-stock', 'payments', payment.id, 'update', ModeEnum.CUSTOMER]).then();
    }
  }

  async deletePayment(entity) {
    const result = await this.globalEventManager.openMessageModal({
      type: 'warning',
      message: $localize`:@@productLabelPayments.delete.error.message:Are you sure you want to delete this payment?`,
      options: {
        centered: true
      }
    });
    if (result !== 'ok') { return; }
    const res = await this.paymentControllerService.deletePaymentByMap(entity).pipe(take(1)).toPromise();
    if (res && res.status === 'OK') {
      this.reloadPage();
    }
  }

  async confirmPayment(payment: ApiPayment) {
    if (this.confirmingPaymentIds.has(payment.id)) {
      return;
    }
    this.confirmingPaymentIds.add(payment.id);
    try {
      const result = await this.globalEventManager.openMessageModal({
        type: 'warning',
        message: $localize`:@@productLabelPayments.confirm.error.message:Are you sure you want to confirm this payment?`,
        options: { centered: true }
      });
      if (result !== 'ok') {
        return;
      }

      // A copy: the row keeps showing UNCONFIRMED until the backend accepted the change.
      const payload: ApiPayment = { ...payment, paymentStatus: PaymentStatusEnum.CONFIRMED };
      delete (payload as any).selected;

      const res = await this.paymentControllerService.createOrUpdatePayment(payload)
          .pipe(take(1))
          .toPromise();

      if (res && res.status === 'OK') {
        this.reloadPage();
      } else {
        this.confirmPaymentFailed();
      }
    } catch (e) {
      this.confirmPaymentFailed();
    } finally {
      this.confirmingPaymentIds.delete(payment.id);
    }
  }

  private confirmPaymentFailed() {
    this.globalEventManager.push({
      action: 'error',
      notificationType: 'error',
      title: $localize`:@@frontPage.feedback.error.title:Something went wrong`,
      message: $localize`:@@productLabelPayments.confirm.error.toast:The payment could not be confirmed. Please try again.`
    });
  }

  changeSort(event) {
    if (event.key === 'cb') {
      this.selectAll(event.checked);
      return;
    }
    this.sortingParams$.next({ sortBy: event.key, sort: event.sortOrder });
    this.clearCBs();
  }

  async selectAll(checked) {
    if (checked) {
      this.selectedPayments = [];
      for (const item of this.currentData) {
        if (item.paymentStatus === 'UNCONFIRMED') {
          this.selectedPayments.push(item);
        }
      }
      this.currentData.map(item => {
        if (item.paymentStatus === 'UNCONFIRMED') {
          (item as any).selected = true;
          return item;
        }
      });
      this.allSelected = true;
      this.selectedPaymentsChanged.emit(this.selectedPayments);
    } else {
      this.selectedPayments = [];
      this.allSelected = false;
      this.currentData.map(item => {
        (item as any).selected = false;
        return item;
      });
      this.selectedPaymentsChanged.emit(this.selectedPayments);
    }
  }

  cbSelected(payment: ApiPayment, index: number) {
    if (this.allSelected) {
      this.allSelected = false;
      this.cbCheckedAll.setValue(false);
    }
    (this.currentData[index] as any).selected = !(this.currentData[index] as any).selected;

    const selectedIndex = this.selectedPayments.indexOf(payment);

    if (selectedIndex !== -1) {
      this.selectedPayments.splice(selectedIndex, 1);
    } else {
      this.selectedPayments.push(payment);
    }
    this.selectedPaymentsChanged.emit(this.selectedPayments);
  }

  private clearCBs() {
    this.selectedPayments = [];
    this.allSelected = false;
    this.cbCheckedAll.setValue(false);
    this.selectedPaymentsChanged.emit(this.selectedPayments);
    if (this.currentData) {
      for (const item of this.currentData) {
        if ((item as any).selected) {
          (item as any).selected = false;
        }
      }
    }
  }

  showPagination() {
    return ((this.showedPayments - this.pageSize) === 0 && this.allPayments > this.pageSize) || this.page > 1;
  }

  formatDate(productionDate) {
    if (productionDate) { return formatDateWithDots(productionDate); }
    return '';
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

  get paymentStatusEnum(): typeof PaymentStatusEnum {
    return PaymentStatusEnum;
  }

  onPageChange(event) {
    this.paging$.next(event);
  }

  reloadPage() {
    this.reloadPingList$.next(true);
  }
  
  calculateAggregatedTotalPaid(items: ApiPayment[]): number {
    return items.reduce((acc: number, item: ApiPayment) => {
      return item.amount + acc;
    }, 0);
  }

}
