import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { SortOrder } from '../../../shared/result-sorter/result-sorter-types';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';
import { CompanyControllerService, GetCompanyCustomersList } from '../../../../api/api/companyController.service';
import { Router } from '@angular/router';
import { map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { SelectedUserCompanyService } from '../../../core/selected-user-company.service';

@Component({
    selector: 'app-company-customers-list',
    templateUrl: './company-customers-list.component.html',
    styleUrls: ['./company-customers-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CompanyCustomersListComponent implements OnInit {

  organizationId;
  page = 1;
  pageSize = 10;

  showing;
  customerCount;

  searchNameCustomers = new UntypedFormControl('');
  byCategory = 'BY_NAME';

  customer$;
  sorting$ = new BehaviorSubject<{ key: string, sortOrder: SortOrder }>({ key: 'BY_NAME', sortOrder: 'ASC'});
  query$ = new BehaviorSubject('');
  pagination$ = new BehaviorSubject(1);
  search$ = new BehaviorSubject('BY_NAME');
  ping$ = new BehaviorSubject(null);

  items = [
    { name: $localize`:@@productLabelStakeholders.search.customerName:Customer name`,
      category: 'BY_NAME'
    }
  ];

  sortOptions = [
    {
      key: 'name',
      name: $localize`:@@productLabelStakeholdersCustomers.sortOptions.companyName.name:Company name`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'contact',
      name: $localize`:@@productLabelStakeholdersCustomers.sortOptions.contact.name:Contact`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'email',
      name: $localize`:@@productLabelStakeholdersCustomers.sortOptions.email.name:E-mail`,
    },
    {
      key: 'actions',
      name: $localize`:@@productLabelStakeholdersCustomers.sortOptions.actions.name:Actions`,
      inactive: true
    }
  ];

  constructor(
      private globalEventsManager: GlobalEventManagerService,
      private companyController: CompanyControllerService,
      private router: Router,
      private selUserCompanyService: SelectedUserCompanyService
  ) { }

  ngOnInit(): void {

    this.selUserCompanyService.selectedCompanyProfile$.pipe(take(1)).subscribe(cp => {
      if (cp) {
        this.organizationId = cp.id;
        this.loadCustomers().then();
      }
    });
  }

  private async loadCustomers() {
    this.customer$ = combineLatest([this.sorting$, this.query$, this.search$, this.pagination$, this.ping$])
        .pipe(
            map(([sort, queryString, search, page, ping]) => {
              const params: GetCompanyCustomersList.PartialParamMap = {
                companyId: this.organizationId,
                sort: sort.sortOrder,
                sortBy: sort.key,
                offset: (page - 1) * this.pageSize,
                limit: this.pageSize,
                query: queryString
              };
              return params;
            }),
            tap(() => this.globalEventsManager.showLoading(true)),
            switchMap(params => this.companyController.getCompanyCustomersListByMap(params)),
            map(response => {
              if (response) {
                this.customerCount = response.data.count;
                this.showing = this.customerCount >= this.pageSize ? Math.min(this.page * this.pageSize, this.customerCount) : this.customerCount;
                return response.data;
              }
            }),
            tap(() => this.globalEventsManager.showLoading(false)),
            shareReplay(1)
        );
  }

  addCustomer() {
    this.router.navigate(['my-customers', 'add']).then();
  }

  editCustomer(id) {
    this.router.navigate(['my-customers', 'edit', id]).then();
  }

  async deleteCustomer(id) {
    const result = await this.globalEventsManager.openMessageModal({
      type: 'warning',
      message: $localize`:@@productLabelStakeholdersCustomers.deleteCustomer.error.message:Are you sure you want to delete the customer?`,
      options: {
        centered: true
      }
    });
    if (result !== 'ok') {
      return;
    }
    const res = await this.companyController.deleteCompanyCustomer(id).pipe(take(1)).toPromise();
    if (res && res.status === 'OK') {
      this.ping$.next(null);
    }
  }

  changeSort(event) {
    let newKey = '';
    switch (event.key) {
      case 'id':
        newKey = 'BY_ID';
        break;
      case 'name':
        newKey = 'BY_NAME';
        break;
      case 'surname':
        newKey = 'BY_SURNAME';
        break;
    }
    event.key = newKey;
    this.sorting$.next(event);
  }

  showPagination() {
    return this.customerCount && this.customerCount > this.pageSize;
  }

  onPageChange(event) {
    this.pagination$.next(event);
  }

  onSearchInput(event) {
    this.query$.next(event);
  }

  onCategoryChange(event) {
    this.search$.next(event);
  }

}
