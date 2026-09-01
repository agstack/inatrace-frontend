import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { faFilter, faTimes } from '@fortawesome/free-solid-svg-icons';
import { combineLatest, Subscription, BehaviorSubject } from 'rxjs';
// import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { map, shareReplay, startWith, switchMap, take, tap } from 'rxjs/operators';
import { ProductControllerService } from 'src/api/api/productController.service';
import { ApiPaginatedResponseApiKnowledgeBlogBase } from 'src/api/model/apiPaginatedResponseApiKnowledgeBlogBase';
import { EnumSifrant } from 'src/app/shared-services/enum-sifrant';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { NgbModalImproved } from 'src/app/core/ngb-modal-improved/ngb-modal-improved.service';
import { KnowledgeBlogSelectSectionModalComponent } from '../knowledge-blog-select-section-modal/knowledge-blog-select-section-modal.component';

@Component({
  selector: 'app-product-label-knowledge-blog',
  templateUrl: './product-label-knowledge-blog.component.html',
  styleUrls: ['./product-label-knowledge-blog.component.scss']
})
export class ProductLabelKnowledgeBlogComponent implements OnInit {

  faTimes = faTimes;
  faFilter = faFilter;
  productId = this.route.snapshot.params.id;
  reloadPingList$ = new BehaviorSubject<boolean>(false)
  pagingParams$ = new BehaviorSubject({})
  sortingParams$ = new BehaviorSubject({ sortBy: 'title', sort: 'ASC' })
  paging$ = new BehaviorSubject<number>(1);
  page: number = 0;
  pageSize = 10;
  searchName = new FormControl(null)
  searchStatus = new FormControl("")
  routerSub: Subscription;

  allBlogs: number = 0;
  showedBlogs: number = 0;


  constructor(
    private globalEventsManager: GlobalEventManagerService,
    private productController: ProductControllerService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModalImproved
  ) {
  }

  ngOnInit(): void {
    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && event.url === '/knowledgeBlog') {
        this.reloadPage()
      }
    })
    this.setAllBlogs();
  }

  async setAllBlogs() {

    let res = await this.productController.getProductKnowledgeBlogs(this.productId, null, 'COUNT').pipe(take(1)).toPromise();
    if (res && res.status === 'OK' && res.data && res.data.count >= 0) {
      this.allBlogs = res.data.count;
    }

  }


  ngOnDestroy() {
    if (this.routerSub) this.routerSub.unsubscribe()
  }

  onPageChange(event) {
    this.paging$.next(event);
  }

  changeSort(event) {
    this.sortingParams$.next({ sortBy: event.key, sort: event.sortOrder })
  }

  reloadPage() {
    this.reloadPingList$.next(true)
  }

  sortOptions = [
    {
      key: 'title',
      name: $localize`:@@productLabelKnowledgeBlog.sortOptions.title.name:Title`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'date',
      name: $localize`:@@productLabelKnowledgeBlog.sortOptions.date.name:Date`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'type',
      name: $localize`:@@productLabelKnowledgeBlog.sortOptions.type.name:Type`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'actions',
      name: $localize`:@@productLabelKnowledgeBlog.sortOptions.actions.name:Actions`,
      inactive: true
    }
  ]

  searchParams$ = combineLatest(
    this.searchStatus.valueChanges.pipe(
      startWith(null)
    ),
    (type: string) => {
      return { type }
    }
  )

  codebookStatus = EnumSifrant.fromObject(this.statusList)

  get statusList() {
    let obj = {}
    obj[""] = $localize`:@@productLabelKnowledgeBlog.type.all:All`
    obj['FAIRNESS'] = $localize`:@@productLabelKnowledgeBlog.type.fairness:Fairness`
    obj['QUALITY'] = $localize`:@@productLabelKnowledgeBlog.type.quality:Quality`
    obj['PROVENANCE'] = $localize`:@@productLabelKnowledgeBlog.type.provenance:Provenance`
    return obj;
  }


  blogs$ = combineLatest(this.reloadPingList$, this.paging$, this.searchParams$, this.sortingParams$,
    (ping: boolean, page: number, search: any, sorting: any) => {
      return {
        ...search,
        ...sorting,
        offset: (page - 1) * this.pageSize,
        limit: this.pageSize
      }
    }).pipe(
      tap(val => this.globalEventsManager.showLoading(true)),
      switchMap(params => {
        return this.productController.getProductKnowledgeBlogsByMap({ productId: this.productId, ...params });
      }),
      map((resp: ApiPaginatedResponseApiKnowledgeBlogBase) => {
        if (resp) {

          if (resp.data && resp.data.count && (this.pageSize - resp.data.count > 0)) this.showedBlogs = resp.data.count;
          else {
            let temp = resp.data.count - (this.pageSize * (this.page - 1));
            this.showedBlogs = temp >= this.pageSize ? this.pageSize : temp;
          }

          return resp.data
        }
      }),
      tap(val => this.globalEventsManager.showLoading(false)),
      shareReplay(1)
    )

  blogDetail(blog) {
    if (blog) {
      this.router.navigate(['/', 'product-labels', this.productId, 'knowledge-blog', blog.type.toLowerCase(), blog.id])
    }
  }

  viewPage(blog) {
    if (blog) {
      this.router.navigate(['/', 'blog', this.productId, blog.type.toLowerCase(), blog.id])
    }
  }


  async selectSection() {
    const modalRef = this.modalService.open(KnowledgeBlogSelectSectionModalComponent, { centered: true });
    Object.assign(modalRef.componentInstance, {
      title: $localize`:@@productLabelKnowledgeBlog.selectSection.title:Type selection`,
      instructionsHtml: $localize`:@@productLabelKnowledgeBlog.selectSection.instructionsHtml:Select type`,
    })
    let type = await modalRef.result;
    if (type) {
      this.router.navigate(['/', 'product-labels', this.productId, 'knowledge-blog', type.toLowerCase(), 'new'])
    }
  }


  fairnessSection = {
    anchor: 'FAIRNESS',
    title: $localize`:@@productLabelKnowledgeBlog.title.fairness:Fairness`
  }

  qualitySection = {
    anchor: 'QUALITY',
    title: $localize`:@@productLabelKnowledgeBlog.title.quality:Quality`
  }

  provenanceSection = {
    anchor: 'PROVENANCE',
    title: $localize`:@@productLabelKnowledgeBlog.title.provenance:Provenance`,
  }


  toc = [
    this.fairnessSection,
    this.qualitySection,
    this.provenanceSection,
  ]

  showStatus(status: string) {
    this.searchStatus.setValue(status);
  }

  clearValue() {
    this.searchStatus.setValue("");
  }

  showPagination() {
    if (((this.showedBlogs - this.pageSize) == 0 && this.allBlogs >= this.pageSize) || this.page > 1) return true;
    else return false
  }

}
