import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { GetValueChainList, ValueChainControllerService } from '../../../api/api/valueChainController.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { UntypedFormControl } from '@angular/forms';
import { debounceTime, finalize, map, startWith, switchMap, take, tap } from 'rxjs/operators';
import { SortKeyAndOrder, SortOption, SortOrder } from '../../shared/result-sorter/result-sorter-types';
import { GlobalEventManagerService } from '../../core/global-event-manager.service';
import { ApiPaginatedResponseApiValueChain } from '../../../api/model/apiPaginatedResponseApiValueChain';
import { Router } from '@angular/router';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../core/auth.service';

@Component({
    selector: 'app-value-chain-list',
    templateUrl: './value-chain-list.component.html',
    styleUrls: ['./value-chain-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ValueChainListComponent implements OnInit {

  faTimes = faTimes;

  searchName = new UntypedFormControl(null);
  filterStatus = new UntypedFormControl('ENABLED');

  page = 0;
  pageSize = 10;

  allValueChains = 0;
  showedValueChains = 0;

  sortOptions: SortOption[] = [
    {
      key: 'name',
      name: $localize`:@@valueChainList.sortOptions.name.name:Name`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'description',
      name: $localize`:@@valueChainList.sortOptions.description.name:Description`
    },
    {
      key: 'status',
      name: $localize`:@@valueChainList.sortOptions.status.name:Status`,
    },
    {
      key: 'actions',
      name: $localize`:@@valueChainList.sortOptions.actions.name:Actions`,
      inactive: true
    }
  ];

  private reloadPing$ = new BehaviorSubject(false);
  private sortingParams$ = new BehaviorSubject<{ sortBy: string; sort: SortOrder }>({ sortBy: 'name', sort: 'ASC' });
  private paging$ = new BehaviorSubject(1);

  private searchParams$ = combineLatest([
    this.searchName.valueChanges.pipe(
      startWith(null as string),
      debounceTime(200)
    ),
    this.filterStatus.valueChanges.pipe(
      startWith('ENABLED')
    )
  ]).pipe(map(([name, status]) => ({name, status})));

  valueChains$ = combineLatest([
    this.reloadPing$,
    this.paging$,
    this.searchParams$,
    this.sortingParams$
  ]).pipe(
    map(([ping, page, search, sorting]) => {
      const params: GetValueChainList.PartialParamMap = {
        name: search.name,
        valueChainStatus: search.status,
        sortBy: sorting.sortBy,
        sort: sorting.sort,
        offset: (page - 1) * this.pageSize,
        limit: this.pageSize
      };
      return params;
    }),
    tap(() => this.globalEventsManager.showLoading(true)),
    switchMap(requestParams => this.valueChainService.getValueChainListByMap(requestParams)),
    map((response: ApiPaginatedResponseApiValueChain) => {
      if (response) {
        if (response.data?.count) {
          this.allValueChains = response.data.count;
        }
        if (response.data?.count && (this.pageSize - response.data.count > 0)) {
          this.showedValueChains = response.data.count;
        } else {
          const temp = response.data.count - (this.pageSize * (this.page - 1));
          this.showedValueChains = temp >= this.pageSize ? this.pageSize : temp;
        }
        return response.data;
      }
    }),
    tap(() => this.globalEventsManager.showLoading(false))
  );

  isRegionalAdmin = false;

  constructor(
    private router: Router,
    private valueChainService: ValueChainControllerService,
    protected globalEventsManager: GlobalEventManagerService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.authService.userProfile$.pipe(take(1)).subscribe(up => {
      this.isRegionalAdmin = up?.role === 'REGIONAL_ADMIN';
    });
  }

  reloadData() {
    this.reloadPing$.next(true);
  }

  onPageChange(event) {
    this.paging$.next(event);
  }

  onSortChange(event: SortKeyAndOrder) {
    this.sortingParams$.next({ sortBy: event.key, sort: event.sortOrder });
  }

  showPagination() {
    return ((this.showedValueChains - this.pageSize) === 0 && this.allValueChains >= this.pageSize) || this.page > 1;
  }

  showValueChainsWithStatus(status: string) {
    this.filterStatus.setValue(status);
  }

  clearFilter() {
    this.filterStatus.reset(null);
  }

  createNewValueChain() {
    this.router.navigate(['value-chains', 'new']).then();
  }

  editValueChain(id): void {
    this.router.navigate(['/value-chains', id]).then();
  }

  enableValueChain(id): void {

    this.globalEventsManager.showLoading(true);
    this.valueChainService.enableValueChain(id)
      .pipe(
        finalize(() => this.globalEventsManager.showLoading(false))
      )
      .subscribe(
        () => {
          this.reloadData();
          this.globalEventsManager.push({
            action: 'success',
            notificationType: 'success',
            title: $localize`:@@valueChainList.action.enable.success.title:Enabled!`,
            message: $localize`:@@valueChainList.action.enable.success.message:Value chain has been successfully enabled`
          });
        },
        () => {
          this.globalEventsManager.push({
            action: 'error',
            notificationType: 'error',
            title: $localize`:@@valueChainList.action.enable.error.title:Error`,
            message: $localize`:@@valueChainList.action.enable.error.message:Cannot enable value chain`
          });
        }
      );
  }

  disableValueChain(id): void {

    this.globalEventsManager.showLoading(true);
    this.valueChainService.disableValueChain(id)
      .pipe(
        finalize(() => this.globalEventsManager.showLoading(false))
      )
      .subscribe(
        () => {
          this.reloadData();
          this.globalEventsManager.push({
            action: 'success',
            notificationType: 'success',
            title: $localize`:@@valueChainList.action.disable.success.title:Disabled!`,
            message: $localize`:@@valueChainList.action.disable.success.message:Value chain has been successfully disabled`
          });
        },
        () => {
          this.globalEventsManager.push({
            action: 'error',
            notificationType: 'error',
            title: $localize`:@@valueChainList.action.disable.error.title:Error`,
            message: $localize`:@@valueChainList.action.disable.error.message:Cannot disable value chain`
          });
        }
      );
  }

  deleteValueChain(id): void {

    this.globalEventsManager.showLoading(true);
    this.valueChainService.deleteValueChain(id)
      .pipe(
        finalize(() => this.globalEventsManager.showLoading(false))
      )
      .subscribe(
        () => {
          this.reloadData();
          this.globalEventsManager.push({
            action: 'success',
            notificationType: 'success',
            title: $localize`:@@valueChainList.action.delete.success.title:Deleted!`,
            message: $localize`:@@valueChainList.action.delete.success.message:Value chain has been successfully deleted`
          });
        },
        () => {
          this.globalEventsManager.push({
            action: 'error',
            notificationType: 'error',
            title: $localize`:@@valueChainList.action.delete.error.title:Error`,
            message: $localize`:@@valueChainList.action.delete.error.message:Cannot delete value chain`
          });
        }
      );
  }

}
