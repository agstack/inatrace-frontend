import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, map, shareReplay, startWith, switchMap, take, tap } from 'rxjs/operators';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { ProcessingActionControllerService } from '../../../../../api/api/processingActionController.service';
import { ApiPaginatedResponseApiProcessingAction } from '../../../../../api/model/apiPaginatedResponseApiProcessingAction';
import { SortOption } from '../../../../shared/result-sorter/result-sorter-types';

@Component({
    selector: 'app-company-list-processing-actions',
    templateUrl: './company-detail-processing-actions-list.component.html',
    styleUrls: ['./company-detail-processing-actions-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CompanyDetailProcessingActionsListComponent implements OnInit {

  @Input()
  organizationId: number;

  @Output()
  showing = new EventEmitter<number>();

  @Output()
  countAll = new EventEmitter<number>();

  searchName = new UntypedFormControl(null);
  reloadPingList$ = new BehaviorSubject<boolean>(false);
  pagingParams$ = new BehaviorSubject({});
  sortingParams$ = new BehaviorSubject({ sortBy: 'name', sort: 'ASC' });
  paging$ = new BehaviorSubject<number>(1);
  page = 0;
  pageSize = 10;
  showed = 0;
  all = 0;

  sortOptions: SortOption[] = [
    {
      key: 'name',
      name: $localize`:@@processingActionList.sortOptions.description.name:Name of process`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'type',
      name: $localize`:@@processingActionList.sortOptions.type.name:Type`,
      inactive: true
    },
    {
      key: 'inputSemiProduct',
      name: $localize`:@@processingActionList.sortOptions.inputSemiProduct.name:Input semi-product/final product`,
      inactive: true
    },
    {
      key: 'outputSemiProducts',
      name: $localize`:@@processingActionList.sortOptions.outputSemiProducts.name:Output semi-products/final product`,
      inactive: true
    },
    {
      key: 'actions',
      name: $localize`:@@processingActionList.sortOptions.actions.name:Actions`,
      inactive: true
    }
  ];

  searchParams$ = combineLatest(
      this.searchName.valueChanges.pipe(
          startWith(null),
          debounceTime(200)
      ),
      (query: string) => {
        return {
          query
        };
      }
  );

  processingActions$ = combineLatest(this.reloadPingList$, this.paging$, this.searchParams$, this.sortingParams$,
      (ping: boolean, page: number, search: any, sorting: any) => {
        return {
          ...search,
          ...sorting,
          offset: (page - 1) * this.pageSize,
          limit: this.pageSize
        };
      }).pipe(
      tap(() => this.globalEventsManager.showLoading(true)),
      switchMap(params => {
        return this.processingActionControllerService.listProcessingActionsByCompanyByMap({
          ...params,
          id: this.organizationId
        });
      }),
      map((resp: ApiPaginatedResponseApiProcessingAction) => {
        if (resp) {

          if (resp.data && resp.data.count && (this.pageSize - resp.data.count > 0)) {
            this.showed = resp.data.count;
          } else {
            const temp = resp.data.count - (this.pageSize * (this.page - 1));
            this.showed = temp >= this.pageSize ? this.pageSize : temp;
          }

          this.all = resp.data.count;
          this.showing.emit(this.showed);
          this.countAll.emit(this.all);

          return resp.data;
        }
      }),
      tap(() => this.globalEventsManager.showLoading(false)),
      shareReplay(1)
  );

  constructor(
      private processingActionControllerService: ProcessingActionControllerService,
      protected globalEventsManager: GlobalEventManagerService,
      private route: ActivatedRoute,
      private router: Router
  ) { }

  ngOnInit(): void {
  }

  async editProcessingAction(entity) {
    await this.router.navigate([
      'companies',
      this.organizationId,
      'processingActions',
      entity.id,
      'edit'
    ]);
  }

  async deleteProcessingAction(pa) {
    const result = await this.globalEventsManager.openMessageModal({
      type: 'warning',
      message: $localize`:@@processingActionList.deleteProcessingAction.error.message:Are you sure you want to delete it?`,
      options: { centered: true }
    });
    if (result !== 'ok') {
      // => Cancel
      return;
    }
    const resp = await this.processingActionControllerService.deleteProcessingAction(pa.id)
        .pipe(take(1))
        .toPromise();
    if (resp && resp.status === 'OK') {
      this.reloadPage();
    }
  }

  changeSort(event) {
    this.sortingParams$.next({
      sortBy: event.key,
      sort: event.sortOrder
    });
  }

  showPagination() {
    return ((this.showed - this.pageSize) === 0 && this.all > this.pageSize) || this.page > 1;
  }

  onPageChange(event) {
    this.paging$.next(event);
  }

  reloadPage() {
    this.reloadPingList$.next(true);
  }

}
