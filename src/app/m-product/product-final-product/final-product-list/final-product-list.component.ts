import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { SortOption } from '../../../shared/result-sorter/result-sorter-types';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';
import { ProductControllerService } from '../../../../api/api/productController.service';
import { ApiPaginatedResponseApiFinalProduct } from '../../../../api/model/apiPaginatedResponseApiFinalProduct';
import { ApiPaginatedListApiFinalProduct } from '../../../../api/model/apiPaginatedListApiFinalProduct';
import { NgbModalImproved } from '../../../core/ngb-modal-improved/ngb-modal-improved.service';
import { FinalProductDetailModalComponent } from '../final-product-detail-modal/final-product-detail-modal.component';
import { ApiFinalProduct } from '../../../../api/model/apiFinalProduct';

@Component({
    selector: 'app-final-product-list',
    templateUrl: './final-product-list.component.html',
    styleUrls: ['./final-product-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FinalProductListComponent implements OnInit, OnChanges {

  @Input()
  productId: number;

  @Input()
  listReload: boolean;

  @Input()
  editable: boolean;

  @Output()
  showing = new EventEmitter<number>();

  @Output()
  countAll = new EventEmitter<number>();

  reloadPingList$ = new BehaviorSubject<boolean>(false);
  pagingParams$ = new BehaviorSubject({});
  sortingParams$ = new BehaviorSubject(null);
  paging$ = new BehaviorSubject<number>(1);
  page = 1;
  pageSize = 10;

  showed = 0;
  all = 0;

  sortOptions: SortOption[];
  finalProducts$: Observable<ApiPaginatedListApiFinalProduct>;

  constructor(
      private modalService: NgbModalImproved,
      private globalEventManager: GlobalEventManagerService,
      private productControllerService: ProductControllerService,
  ) { }

  ngOnChanges(): void {
    this.reloadPage();
  }

  ngOnInit(): void {

    this.initSortOptions();

    this.finalProducts$ = combineLatest([
      this.reloadPingList$,
      this.paging$,
      this.sortingParams$
    ]).pipe(
        map(([ping, page, sorting]) => {
          return {
            limit: this.pageSize,
            offset: (page - 1) * this.pageSize,
            ...sorting,
          };
        }),
        tap(
            () => this.globalEventManager.showLoading(true)
        ),
        switchMap(params => {
          return this.loadFinalProducts(params);
        }),
        map((resp: ApiPaginatedResponseApiFinalProduct) => {

          if (!resp) {
            return null;
          }

          this.all = 0;
          this.showed = 0;

          if (resp.data.count) {
            this.all = resp.data.count;

            if (this.pageSize - this.all > 0) {
              this.showed = resp.data.count;

            } else if (this.pageSize - this.all <= 0) {
              const temp = this.all - (this.pageSize * (this.page - 1));
              this.showed = (temp >= this.pageSize) ? this.pageSize : temp;
            }
          }

          this.showing.emit(this.showed);
          this.countAll.emit(this.all);

          return resp.data;
        }),
        tap(
            () => this.globalEventManager.showLoading(false)
        )
    );
  }

  loadFinalProducts(params): Observable<ApiPaginatedResponseApiFinalProduct>{
    return this.productControllerService.getFinalProductListByMap({
      ...params,
      productId: this.productId
    });
  }

  initSortOptions() {
    this.sortOptions = [
      {
        key: 'name',
        name: $localize`:@@productLabelFinalProduct.sortOptions.name:Name`,
        },
      {
        key: 'description',
        name: $localize`:@@productLabelFinalProduct.sortOptions.description:Description`,
        inactive: true
      },
      {
        key: 'unitLabel',
        name: $localize`:@@productLabelFinalProduct.sortOptions.unit.label:Unit label`,
        inactive: true
      },
      {
        key: 'actions',
        name: $localize`:@@productLabelFinalProduct.sortOptions.actions:Actions`,
        inactive: true
      }
    ];
  }

  editFinalProduct(finalProduct: ApiFinalProduct) {
    this.modalService.open(FinalProductDetailModalComponent, {
      centered: true
    }, {
      productId: this.productId,
      isUpdate: true,
      finalProductId: finalProduct.id,
      saveCallback: () => {
        this.reloadPage();
      }
    });
  }

  async deleteFinalProduct(finalProduct) {
    const result = await this.globalEventManager.openMessageModal({
      type: 'warning',
      message: $localize`:@@productLabelFinalProduct.message.warning.remove:Are you sure you want to remove final product with name '${finalProduct.name}'?`,
      options: { centered: true },
      dismissable: false
    });

    if (result !== 'ok') {
      return;
    }

    try {
      this.globalEventManager.showLoading(true);

      const res = await this.productControllerService.deleteFinalProduct(this.productId, finalProduct.id)
          .pipe(take(1))
          .toPromise();

      if (res && res.status === 'OK') {
        this.reloadPage();
      }

    } catch (e) {
      // Ignore error
    } finally {
      this.globalEventManager.showLoading(false);
    }
  }

  reloadPage() {
    this.reloadPingList$.next(true);
  }

  showPagination() {
    return ((this.showed - this.pageSize) === 0 && this.all > this.pageSize) || this.page > 1;
  }

  onPageChange(event) {
    this.paging$.next(event);
  }

  changeSort(event) {
    this.sortingParams$.next({ sortBy: event.key, sort: event.sortOrder });
  }

}
