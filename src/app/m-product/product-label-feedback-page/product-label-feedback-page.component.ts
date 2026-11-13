import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Subscription, BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { NavigationEnd, Router, ActivatedRoute, NavigationStart } from '@angular/router';
import { PublicControllerService } from 'src/api/api/publicController.service';
import { UntypedFormControl } from '@angular/forms';
import { startWith, debounceTime, tap, switchMap, map, shareReplay, filter, take, catchError } from 'rxjs/operators';
import { ApiPaginatedResponseApiProductLabelFeedback } from 'src/api/model/apiPaginatedResponseApiProductLabelFeedback';
import { ProductControllerService } from 'src/api/api/productController.service';
import { faTimes, faFilter } from '@fortawesome/free-solid-svg-icons';
import { EnumSifrant } from 'src/app/shared-services/enum-sifrant';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { NgbModalImproved } from 'src/app/core/ngb-modal-improved/ngb-modal-improved.service';
import { FeedbackModalComponent } from 'src/app/m-product/product-label-feedback-page/feedback-modal/feedback-modal.component';

@Component({
    selector: 'app-product-label-feedback-page',
    templateUrl: './product-label-feedback-page.component.html',
    styleUrls: ['./product-label-feedback-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ProductLabelFeedbackPageComponent implements OnInit {

  constructor(
    private router: Router,
    protected globalEventsManager: GlobalEventManagerService,
    private publicController: PublicControllerService,
    private route: ActivatedRoute,
    private productController: ProductControllerService,
    private modalService: NgbModalImproved
  ) {
    if (this.router.getCurrentNavigation() &&
        this.router.getCurrentNavigation().extras &&
        this.router.getCurrentNavigation().extras.state &&
        this.router.getCurrentNavigation().extras.state.data) {
      this.labelId = this.router.getCurrentNavigation().extras.state.data;
      localStorage.setItem('statisticsUUID', this.labelId);
    } else {
      this.labelId = localStorage.getItem('statisticsUUID');
    }
  }

  faTimes = faTimes;
  faFilter = faFilter;
  routerSub: Subscription;
  searchName = new UntypedFormControl(null);
  searchStatus = new UntypedFormControl('');

  reloadPing$ = new BehaviorSubject<boolean>(false);
  pagingParams$ = new BehaviorSubject({});
  sortingParams$ = new BehaviorSubject({ sortBy: 'email', sort: 'ASC' });
  paging$ = new BehaviorSubject<number>(1);

  page = 0;
  pageSize = 10;
  labelId = '';
  // Numeric label id: the feedback list with the consumers' details is read through the
  // authenticated product route; the public list (by label UID) omits them.
  private readonly productLabelId = Number(this.route.snapshot.params.labelId);

  allFeedbacks = 0;
  showedFeedbacks = 0;

  ngOnInit(): void {
    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && event.url === '/feedback') {
        this.reloadPage();
      }
    });
    this.setAllFeedbacks().then();
  }

  async setAllFeedbacks() {
    const res = await this.productController.listProductLabelFeedbacksForLabel(this.productLabelId, null, 'COUNT').pipe(take(1)).toPromise();
    if (res && res.status === 'OK' && res.data && res.data.count >= 0) {
      this.allFeedbacks = res.data.count;
    }
  }

  reloadPage() {
    this.reloadPing$.next(true);
  }

  onPageChange(event) {
    this.paging$.next(event);
  }

  changeSort(event) {
    this.sortingParams$.next({ sortBy: event.key, sort: event.sortOrder })
  }

  searchParams$ = combineLatest(
    this.searchName.valueChanges.pipe(
      startWith(null),
      debounceTime(200)
    ),
    this.searchStatus.valueChanges.pipe(
      startWith(null)
    ),
    (email: string, type: string) => {
      return { email, type };
    }
  );

  get statusList() {
    const obj = {};
    obj[''] = $localize`:@@productLabelFeedback.statusList.all:All`;
    obj['PRAISE'] = $localize`:@@productLabelFeedback.statusList.registred:Praise`;
    obj['PROPOSAL'] = $localize`:@@productLabelFeedback.statusList.active:Proposal`;
    obj['COMPLAINT'] = $localize`:@@productLabelFeedback.statusList.deactivated:Complaint`;
    return obj;
  }

  codebookStatus = EnumSifrant.fromObject(this.statusList);

  showStatus(status: string) {
    this.searchStatus.setValue(status);
  }

  clearValue() {
    this.searchStatus.setValue('');
  }

  feedbacks$ = combineLatest(this.reloadPing$, this.paging$, this.searchParams$, this.sortingParams$,
    (ping: boolean, page: number, search: any, sorting: any) => {
      return {
        ...search,
        ...sorting,
        offset: (page - 1) * this.pageSize,
        limit: this.pageSize
      };
    }).pipe(
      tap(val => this.globalEventsManager.showLoading(true)),
      switchMap(params => {
        const newParams = { id: this.productLabelId, ...params };
        // The authenticated route can fail (expired session, a user outside the product's
        // companies, a backend without it); keep the list working for later searches and pages.
        return this.productController.listProductLabelFeedbacksForLabelByMap(newParams).pipe(
          catchError(() => {
            this.showLoadError();
            return of(null);
          })
        );
      }),
      map((resp: ApiPaginatedResponseApiProductLabelFeedback) => {
        if (resp) {
          if (resp.data && resp.data.count && (this.pageSize - resp.data.count > 0)) {
            this.showedFeedbacks = resp.data.count;
          } else {
            const temp = resp.data.count - (this.pageSize * (this.page - 1));
            this.showedFeedbacks = temp >= this.pageSize ? this.pageSize : temp;
          }
          return resp.data;
        }
      }),
      tap(val => this.globalEventsManager.showLoading(false)),
      shareReplay(1)
    );

  sortOptions = [
    {
      key: 'email',
      name: $localize`:@@productLabelFeedback.sortOptions.email.name:Email`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'gender',
      name: $localize`:@@productLabelFeedback.sortOptions.gender.name:Gender`,
    },
    {
      key: 'age',
      name: $localize`:@@productLabelFeedback.sortOptions.age.name:Age`,
    },
    {
      key: 'feedback',
      name: $localize`:@@productLabelFeedback.sortOptions.feedback.name:Feedback`,
      inactive: true
    },
    {
      key: 'gdpr',
      name: $localize`:@@productLabelFeedback.sortOptions.gdpr.name:GDPR`,
      inactive: true
    },
    {
      key: 'actions',
      name: $localize`:@@productLabelFeedback.sortOptions.actions.name:Actions`,
      inactive: true
    }
  ]

  async deleteFeedback(feedback) {
    let result = await this.globalEventsManager.openMessageModal({
      type: 'warning',
      message: $localize`:@@productLabelFeedback.deleteFeedback.error.message:Are you sure you want to delete the feedback?`,
      options: { centered: true }
    });
    if (result != "ok") return
    let res = await this.productController.deleteProductLabelFeedback(feedback.id).pipe(take(1)).toPromise();
    if (res && res.status == 'OK') {
      this.reloadPage()
    }
  }

  viewFeedback(feedback) {
    const modalRef = this.modalService.open(FeedbackModalComponent, {
      centered: true
    });
    Object.assign(modalRef.componentInstance, {
      feedback
    });
  }

  ngOnDestroy() {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  showPagination() {
    return ((this.showedFeedbacks - this.pageSize) === 0 && this.allFeedbacks >= this.pageSize) || this.page > 1;
  }

  setBoolean(b: boolean) {
    if (b) return '✓';
    return null;
  }

  private showLoadError() {
    this.globalEventsManager.showLoading(false);
    this.globalEventsManager.push({
      action: 'error',
      notificationType: 'error',
      title: $localize`:@@productLabelFeedback.loadError.title:Error`,
      message: $localize`:@@productLabelFeedback.loadError.message:The feedback could not be loaded.`
    });
  }

  async downloadFeedbacks() {

    // Page through all of them: one request returns at most `limit` feedbacks (100 by default).
    const pageSize = 100;
    const feedbacks = [];
    try {
      for (let offset = 0; ; offset += pageSize) {
        const page = await this.productController.listProductLabelFeedbacksForLabel(this.productLabelId, null, null, pageSize, offset, null, 'DESC').pipe(take(1)).toPromise();
        if (!page || page.status !== 'OK' || !page.data || !page.data.items) {
          return;
        }
        feedbacks.push(...page.data.items);
        if (page.data.items.length < pageSize || feedbacks.length >= page.data.count) {
          break;
        }
      }
    } catch (e) {
      this.showLoadError();
      return;
    }

    let csv = "Email" + ',' + '\n';
    for (let item of feedbacks) {
      if (item.email) {
        csv += item.email + ',' + '\n';
      }
    }

    const a = document.createElement('a');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    a.href = url;
    a.download = 'feedback-emails.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  }

}
