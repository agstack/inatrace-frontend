import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { debounceTime, map, shareReplay, startWith, switchMap, tap, take } from 'rxjs/operators';
import { ProductControllerService } from 'src/api/api/productController.service';
import { ApiPaginatedResponseApiProductListResponse } from 'src/api/model/apiPaginatedResponseApiProductListResponse';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { EnumSifrant } from 'src/app/shared-services/enum-sifrant';
import { AuthService } from 'src/app/core/auth.service';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { NgbModalImproved } from 'src/app/core/ngb-modal-improved/ngb-modal-improved.service';
import {
  NewProductModalComponent
} from './new-product-modal/new-product-modal.component';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { SelfOnboardingService } from '../../shared-services/self-onboarding.service';

@Component({
    selector: 'app-product-list',
    templateUrl: './product-list.component.html',
    styleUrls: ['./product-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ProductListComponent implements OnInit, OnDestroy, AfterViewInit {

  faTimes = faTimes;

  searchName = new UntypedFormControl(null);
  searchStatus = new UntypedFormControl('');
  myProducts = new UntypedFormControl(true);
  reloadPing$ = new BehaviorSubject<boolean>(false);
  pagingParams$ = new BehaviorSubject({});
  sortingParams$ = new BehaviorSubject({ sortBy: 'name', sort: 'ASC' });
  paging$ = new BehaviorSubject<number>(1);

  page = 0;
  pageSize = 10;

  allProducts = 0;
  showedProducts = 0;

  subs: Subscription;

  codebookStatus = EnumSifrant.fromObject(this.statusList);

  searchParams$ = combineLatest(
    this.searchName.valueChanges.pipe(
      startWith(null),
      debounceTime(200)
    ),
    this.searchStatus.valueChanges.pipe(
      startWith(null)
    ),
    this.myProducts.valueChanges.pipe(
      startWith(true),
    ),
    (name: string, status: string, myProducts: boolean) => {
      return { name, status, myProducts };
    }
  );

  products$ = combineLatest(this.reloadPing$, this.paging$, this.searchParams$, this.sortingParams$,
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
      const myProducts = params.myProducts;
      const newParams = {...params};
      delete newParams['myProducts'];
      if (myProducts) {
        return this.productController.listProductsByMap(params);
      } else {
        return this.productController.listProductsAdminByMap(params);
      }
    }),
    map((resp: ApiPaginatedResponseApiProductListResponse) => {
      if (resp) {
        if (resp.data && resp.data.count && (this.pageSize - resp.data.count > 0)) { this.showedProducts = resp.data.count; }
        else {
          const temp = resp.data.count - (this.pageSize * (this.page - 1));
          this.showedProducts = temp >= this.pageSize ? this.pageSize : temp;
        }

        return resp.data;
      }
    }),
    tap(() => this.globalEventsManager.showLoading(false)),
    shareReplay(1)
  );

  isSystemAdmin = false;

  @ViewChild('newProductButtonTooltip')
  newProductButtonTooltip: NgbTooltip;

  constructor(
    private productController: ProductControllerService,
    protected globalEventsManager: GlobalEventManagerService,
    private modalService: NgbModalImproved,
    private router: Router,
    private authService: AuthService,
    private selfOnboardingService: SelfOnboardingService
  ) { }

  ngOnInit(): void {

    this.subs = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && event.url === '/product-labels') {
        this.reloadPage();
      }
    });

    this.authService.userProfile$.pipe(take(1)).subscribe(up => {
      this.isSystemAdmin = up?.role === 'SYSTEM_ADMIN';
      this.setAllProducts().then();
    });
  }

  ngAfterViewInit(): void {

    this.subs.add(
        this.selfOnboardingService.addProductCurrentStep$.subscribe(step => {
          if (step === 2) {
            this.newProductButtonTooltip?.open();
          } else {
            this.newProductButtonTooltip?.close();
          }
        })
    );
  }

  ngOnDestroy() {
    if (this.subs) { this.subs.unsubscribe(); }
  }

  async setAllProducts() {
    if (this.isSystemAdmin) {
      const res = await this.productController.listProductsAdmin('COUNT').pipe(take(1)).toPromise();
      if (res && res.status === 'OK' && res.data && res.data.count >= 0) {
        this.allProducts = res.data.count;
      }
    } else {
      const res = await this.productController.listProducts('COUNT').pipe(take(1)).toPromise();
      if (res && res.status === 'OK' && res.data && res.data.count >= 0) {
        this.allProducts = res.data.count;
      }
    }
  }

  get statusList() {
    const obj = {};
    obj[''] = $localize`:@@productList.statusList.all:All`;
    obj['ACTIVE'] = $localize`:@@productList.statusList.active:Active`;
    obj['DISABLED'] = $localize`:@@productList.statusList.disabled:Disabled`;
    return obj;
  }

  reloadPage() {
    this.reloadPing$.next(true);
  }

  onPageChange(event) {
    this.paging$.next(event);
  }

  async createProductForCompany() {

    const currentStep =  await this.selfOnboardingService.addProductCurrentStep$.pipe(take(1)).toPromise();
    if (currentStep === 2) {
      this.selfOnboardingService.setAddProductCurrentStep(3);
    }

    const modalRef = this.modalService.open(NewProductModalComponent, { centered: true });
    Object.assign(modalRef.componentInstance, {
      title: $localize`:@@productList.createProductForCompanyAndValueChain.title:Product Company and Value Chain`,
      companyInstructionsHtml: $localize`:@@productList.createProductForCompanyAndValueChain.companyInstructionsHtml:Select a company for your product:`,
      valueChainInstructionsHtml: $localize`:@@productList.createProductForCompanyAndValueChain.valueChainInstructionsHtml:Select a value chain for your product:`
    });
    const modalResult = await modalRef.result;
    const company = modalResult?.company;
    const valueChain =  modalResult?.valueChain;

    if (company && valueChain) {
      this.router.navigate(['product-labels', 'new', company.id, valueChain.id]).then();
    }
  }

  showStatus(status: string) {
    this.searchStatus.setValue(status);
  }

  myProductsOnly(my: boolean) {
    this.myProducts.setValue(my);
  }

  clearValue(form: UntypedFormControl, myProducts = false) {
    if (myProducts) { form.setValue(false); }
    else { form.setValue(''); }
  }

  showPagination() {
    return ((this.showedProducts - this.pageSize) === 0 && this.allProducts >= this.pageSize) || this.page > 1;
  }

}
