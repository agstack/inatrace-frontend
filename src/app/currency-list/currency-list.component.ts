import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CurrencyTypeControllerService } from '../../api/api/currencyTypeController.service';
import { first, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { SortKeyAndOrder, SortOption, SortOrder } from '../shared/result-sorter/result-sorter-types';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { Router } from '@angular/router';
import { GlobalEventManagerService } from '../core/global-event-manager.service';
import { UntypedFormControl } from '@angular/forms';
import { ApiPaginatedResponseApiCurrencyType } from '../../api/model/apiPaginatedResponseApiCurrencyType';
import { AuthService } from '../core/auth.service';

@Component({
    selector: 'app-currency-list',
    templateUrl: './currency-list.component.html',
    styleUrls: ['./currency-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CurrencyListComponent implements OnInit {

  public enabledPaginationActive = false;
  public disabledPaginationActive = false;

  public ping$ = new BehaviorSubject(null);

  public enabledCurrencyType$;
  public enabledSortingParam$ = new BehaviorSubject<{ sortBy: string; sort: SortOrder; }>({ sortBy: 'code', sort: 'ASC' });
  public enabledSearch$ = new BehaviorSubject<string>(null);
  public enabledPagination$ = new BehaviorSubject(1);
  public enabledPage = 1;

  public disabledCurrencyType$;
  public disabledSortingParam$ = new BehaviorSubject<{ sortBy: string; sort: SortOrder; }>({ sortBy: 'code', sort: 'ASC' });
  public disabledSearch$ = new BehaviorSubject<string>(null);
  public disabledPagination$ = new BehaviorSubject(1);
  public disabledPage = 1;

  public pageSize = 10;

  sortOptions: SortOption[] = [
    {
      key: 'code',
      name: $localize`:@@currencyList.sortOptions.name.name:Name`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'label',
      name: $localize`:@@currencyList.sortOptions.description.name:Description`
    },
    {
      key: 'actions',
      name: $localize`:@@currencyList.sortOptions.actions.name:Actions`,
      inactive: true
    }
  ];

  public enabledSearchText = new UntypedFormControl(null);
  public disabledSearchText = new UntypedFormControl(null);

  isRegionalAdmin = false;

  constructor(
      private router: Router,
      private currencyService: CurrencyTypeControllerService,
      private globalEventsManager: GlobalEventManagerService,
      private authService: AuthService
  ) { }

  ngOnInit(): void {

    this.authService.userProfile$.pipe(take(1)).subscribe(up => {
      this.isRegionalAdmin = up?.role === 'REGIONAL_ADMIN';
    });

    this.loadCurrencies();
  }

  loadCurrencies() {
    this.enabledCurrencyType$ = combineLatest([this.enabledSortingParam$, this.enabledSearch$, this.enabledPagination$, this.ping$]).pipe(
      map(([sorting, search, page]) => {
        return {
          query: search,
          ...sorting,
          offset: this.pageSize * (page - 1),
          limit: this.pageSize
        };
      }),
      tap(_ => this.globalEventsManager.showLoading(true)),
      switchMap(params => {
        return this.currencyService.getEnabledCurrencyTypesByMap(params);
      }),
      map((resp: ApiPaginatedResponseApiCurrencyType) => {
        if (resp) {
          this.enabledPaginationActive = resp.data.count > 10;
          return resp.data;
        }
      }),
      tap(_ => this.globalEventsManager.showLoading(false)),
      shareReplay(1)
    );

    this.disabledCurrencyType$ = combineLatest([this.disabledSortingParam$, this.disabledSearch$, this.disabledPagination$, this.ping$]).pipe(
        map(([sorting, search, page]) => {
          return {
            query: search,
            ...sorting,
            offset: this.pageSize * (page - 1),
            limit: this.pageSize
          };
        }),
        tap(_ => this.globalEventsManager.showLoading(true)),
        switchMap(params => {
          return this.currencyService.getDisabledCurrencyTypesByMap(params);
        }),
        map((resp: ApiPaginatedResponseApiCurrencyType) => {
          if (resp) {
            this.disabledPaginationActive = resp.data.count > 10;
            return resp.data;
          }
        }),
        tap(_ => this.globalEventsManager.showLoading(false)),
        shareReplay(1)
    );
  }

  onSortChangeEnabled(event: SortKeyAndOrder) {
    this.enabledSortingParam$.next({
      sortBy: event.key,
      sort: event.sortOrder
    });
  }

  onSortChangeDisabled(event: SortKeyAndOrder) {
    this.disabledSortingParam$.next({
      sortBy: event.key,
      sort: event.sortOrder
    });
  }

  enableCurrency(id) {
    this.currencyService.enableCurrency(id).pipe(first()).subscribe(() => {
      this.ping$.next(null);
    });
  }

  disableCurrency(id) {
    this.currencyService.disableCurrency(id).pipe(first()).subscribe(() => {
      this.ping$.next(null);
    });
  }

  searchEnabledInput(event) {
    this.enabledSearch$.next(event);
  }

  searchDisabledInput(event) {
    this.disabledSearch$.next(event);
  }

  enabledPageChange(event) {
    this.enabledPagination$.next(event);
  }

  disabledPageChange(event) {
    this.disabledPagination$.next(event);
  }

}
