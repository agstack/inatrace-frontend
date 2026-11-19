import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { debounceTime, map, shareReplay, startWith, switchMap, take, tap } from 'rxjs/operators';
import { CompanyControllerService } from 'src/api/api/companyController.service';
import { ApiPaginatedResponseApiCompanyListResponse } from 'src/api/model/apiPaginatedResponseApiCompanyListResponse';
import { EnumSifrant } from '../../shared-services/enum-sifrant';
import { AuthService } from '../../core/auth.service';
import { GlobalEventManagerService } from '../../core/global-event-manager.service';
import { NgbModalImproved } from '../../core/ngb-modal-improved/ngb-modal-improved.service';
import { CompanySelectModalComponent } from '../company-common/company-select-modal/company-select-modal.component';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { SortOption } from '../../shared/result-sorter/result-sorter-types';

@Component({
    selector: 'app-company-list',
    templateUrl: './company-list.component.html',
    styleUrls: ['./company-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CompanyListComponent implements OnInit, OnDestroy {

  faTimes = faTimes;

  companies = [];
  listErrorStatus$: BehaviorSubject<string>;

  searchName = new UntypedFormControl(null);
  searchStatus = new UntypedFormControl('');
  myCompanies = new UntypedFormControl(true);

  reloadPing$ = new BehaviorSubject<boolean>(false);
  sortingParams$ = new BehaviorSubject({ sortBy: 'name', sort: 'ASC' });
  paging$ = new BehaviorSubject<number>(1);

  page = 0;
  pageSize = 10;

  allCompanies = 0;
  showedCompanies = 0;

  searchParams$ = combineLatest(
      this.searchName.valueChanges.pipe(
          startWith(null),
          debounceTime(200)
      ),
      this.searchStatus.valueChanges.pipe(
          startWith(null)
      ),
      this.myCompanies.valueChanges.pipe(
          startWith(true),
      ),
      (name: string, status: string, myCompanies: boolean) => {
        return { name, status, myCompanies };
      }
  );

  companies$ = combineLatest(this.reloadPing$, this.paging$, this.searchParams$, this.sortingParams$,
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
        const myCompanies = params.myCompanies;
        const newParams = { ...params };
        delete newParams['myCompanies'];
        if (myCompanies) {
          return this.companyController.listCompaniesByMap(newParams);
        } else {
          return this.companyController.listCompaniesAdminByMap(newParams);
        }
      }),
      map((resp: ApiPaginatedResponseApiCompanyListResponse) => {
        if (resp) {
          if (resp.data && resp.data.count && (this.pageSize - resp.data.count > 0)) { this.showedCompanies = resp.data.count; }
          else {
            const temp = resp.data.count - (this.pageSize * (this.page - 1));
            this.showedCompanies = temp >= this.pageSize ? this.pageSize : temp;
          }
          return resp.data;
        }
      }),
      tap(() => this.globalEventsManager.showLoading(false)),
      shareReplay(1)
  );

  routerSub: Subscription;

  codebookStatus = EnumSifrant.fromObject(this.statusList);

  sortOptions: SortOption[] = [
    {
      key: 'name',
      name: $localize`:@@companyList.sortOptions.name.name:Name`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'status',
      name: $localize`:@@companyList.sortOptions.status.name:Status`,
    },
    {
      key: 'actions',
      name: $localize`:@@companyList.sortOptions.actions.name:Actions`,
      inactive: true
    }
  ];

  isSystemAdmin = false;
  isRegionalAdmin = false;

  constructor(
    private companyController: CompanyControllerService,
    private router: Router,
    private route: ActivatedRoute,
    protected globalEventsManager: GlobalEventManagerService,
    private authService: AuthService,
    private modalService: NgbModalImproved
  ) { }

  ngOnInit(): void {

    this.listErrorStatus$ = new BehaviorSubject<string>('');

    this.authService.userProfile$.pipe(take(1)).subscribe(up => {
      this.isSystemAdmin = up?.role === 'SYSTEM_ADMIN';
      this.isRegionalAdmin = up?.role === 'REGIONAL_ADMIN';
      this.setAllCompanies().then();
    });

    // do not allow access via breadcrumbs - temp fix
    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && event.url === '/companies') {
        this.reloadPage();
      }
    });
  }

  ngOnDestroy() {
    if (this.routerSub) { this.routerSub.unsubscribe(); }
  }

  reloadPage() {
    this.reloadPing$.next(true);
  }

  onPageChange(event) {
    this.paging$.next(event);
  }

  async setAllCompanies() {
    if (this.isSystemAdmin) {
      const res = await this.companyController.listCompaniesAdmin(null, null, null, 'COUNT').pipe(take(1)).toPromise();
      if (res && res.status === 'OK' && res.data && res.data.count >= 0) {
        this.allCompanies = res.data.count;
      }
    } else {
      const res = await this.companyController.listCompanies(null, null, null, 'COUNT').pipe(take(1)).toPromise();
      if (res && res.status === 'OK' && res.data && res.data.count >= 0) {
        this.allCompanies = res.data.count;
      }
    }
  }

  get statusList() {
    const obj = {};
    obj[''] = $localize`:@@companyList.statusList.all:All`;
    obj['REGISTERED'] = $localize`:@@companyList.statusList.registred:Registred`;
    obj['ACTIVE'] = $localize`:@@companyList.statusList.active:Active`;
    obj['DEACTIVATED'] = $localize`:@@companyList.statusList.deactivated:Deactivated`;
    return obj;
  }

  createCompany(): void {
    this.router.navigate(['companies/new']).then();
  }

  edit(id): void {
    this.router.navigate(['/companies', id]).then();
  }

  async activate(id) {
    try {
      this.globalEventsManager.showLoading(true);
      await this.companyController.executeCompanyAction('ACTIVATE_COMPANY', { companyId: id }).pipe(take(1)).toPromise();
      this.reloadPage();
      this.globalEventsManager.push({
        action: 'success',
        notificationType: 'success',
        title: $localize`:@@companyList.activate.success.title:Activated!`,
        message: $localize`:@@companyList.activate.success.message:Company has been successfully activated`
      });
    } catch (e) {
      this.globalEventsManager.push({
        action: 'error',
        notificationType: 'error',
        title: $localize`:@@companyList.activate.error.title:Error`,
        message: $localize`:@@companyList.activate.error.message:Cannot activate the company`
      });
    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  async deactivate(id) {
    try {
      this.globalEventsManager.showLoading(true);
      await this.companyController.executeCompanyAction('DEACTIVATE_COMPANY', { companyId: id }).pipe(take(1)).toPromise();
      this.reloadPage();
      this.globalEventsManager.push({
        action: 'success',
        notificationType: 'success',
        title: $localize`:@@companyList.deactivate.success.title:Deactivated!`,
        message: $localize`:@@companyList.deactivate.success.message:Company has been successfully deactivated`
      });
    } catch (e) {
      this.globalEventsManager.push({
        action: 'error',
        notificationType: 'error',
        title: $localize`:@@companyList.deactivate.error.title:Error`,
        message: $localize`:@@companyList.deactivate.error.message:Cannot deactivate the company`
      });
    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  changeSort(event) {
    this.sortingParams$.next({ sortBy: event.key, sort: event.sortOrder });
  }

  async mergeTo(company) {
    const modalRef = this.modalService.open(CompanySelectModalComponent, { centered: true });
    Object.assign(modalRef.componentInstance, {
      title: $localize`:@@companyList.mergeTo.modal.title:Merge to Company`,
      instructionsHtml: $localize`:@@companyList.mergeTo.modal.instructionsHtml:Merge company ${company.name} to:`
    });
    const otherCompany = await modalRef.result;
    if (otherCompany) {
      const res = await this.companyController.executeCompanyAction('MERGE_TO_COMPANY', {
        companyId: company.id,
        otherCompanyId: otherCompany.id
      }).pipe(take(1)).toPromise();
      if (res && res.status === 'OK') {
        this.reloadPage();
        this.globalEventsManager.push({
          action: 'success',
          notificationType: 'success',
          title: $localize`:@@companyList.mergeTo.success.title:Merged!`,
          message: $localize`:@@companyList.mergeTo.success.message:Company has been successfully merged to ${otherCompany.name}.`
        });
      }
    }
  }

  showStatus(status: string) {
    this.searchStatus.setValue(status);
  }

  myCompaniesOnly(my: boolean) {
    this.myCompanies.setValue(my);
  }

  clearValue(form: UntypedFormControl, myCompanies = false) {
    if (myCompanies) { form.setValue(false); }
    else { form.setValue(''); }
  }

  showPagination() {
    return ((this.showedCompanies - this.pageSize) === 0 && this.allCompanies >= this.pageSize) || this.page > 1;
  }

}
