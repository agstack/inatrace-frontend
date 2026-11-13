import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { SortOption, SortOrder } from '../../../shared/result-sorter/result-sorter-types';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';
import { CompanyControllerService, GetUserCustomersForCompanyAndType } from '../../../../api/api/companyController.service';
import { Router } from '@angular/router';
import { map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { UntypedFormControl } from '@angular/forms';
import { AuthService } from '../../../core/auth.service';
import { SelectedUserCompanyService } from '../../../core/selected-user-company.service';
import { ApiUserGet } from '../../../../api/model/apiUserGet';
import RoleEnum = ApiUserGet.RoleEnum;
import { FileSaverService } from 'ngx-filesaver';
import { ApiPlot } from '../../../../api/model/apiPlot';
import {
  OpenPlotDetailsExternallyModalComponent
} from '../open-plot-details-externally-modal/open-plot-details-externally-modal.component';
import { NgbModalImproved } from '../../../core/ngb-modal-improved/ngb-modal-improved.service';
import { ApiCompany } from "../../../../api/model/apiCompany";
import { NgbTooltip } from "@ng-bootstrap/ng-bootstrap";
import { SelfOnboardingService } from "../../../shared-services/self-onboarding.service";

@Component({
    selector: 'app-company-farmers-list',
    templateUrl: './company-farmers-list.component.html',
    styleUrls: ['./company-farmers-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CompanyFarmersListComponent implements OnInit, OnDestroy, AfterViewInit {

  organizationId;
  selectedCompany: ApiCompany;
  page = 1;
  pageSize = 10;

  showing;
  farmerCount;

  searchNameFarmers = new UntypedFormControl('');
  byCategory = 'BY_NAME';

  farmers$: Observable<any>;
  plots$: Observable<ApiPlot[]>;
  sorting$ = new BehaviorSubject<{ key: string, sortOrder: SortOrder }>({ key: 'BY_NAME', sortOrder: 'ASC'});
  query$ = new BehaviorSubject('');
  pagination$ = new BehaviorSubject(1);
  search$ = new BehaviorSubject('BY_NAME');
  ping$ = new BehaviorSubject(null);

  showRwanda = false;
  showHonduras = false;

  items = [
    { name: $localize`:@@productLabelStakeholders.search.firstName:First name`,
      category: 'BY_NAME'
    },
    { name: $localize`:@@productLabelStakeholders.search.lastName:Last name`,
      category: 'BY_SURNAME'
    }
  ];

  sortOptions: SortOption[] = [
    {
      key: 'name',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.name.name:First name`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'surname',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.surname.name:Last name`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'gender',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.gender.name:Gender`,
      inactive: true
    },
    {
      key: 'id',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.id.name:Id`,
    },
    {
      key: 'city',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.city.name:City/Town/Village`,
      inactive: true
    },
    {
      key: 'state',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.state.name:State/Province/Region`,
      inactive: true
    },
    {
      key: 'actions',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.actions.name:Actions`,
      inactive: true
    }
  ];

  sortOptionsRwanda: SortOption[] = [
    {
      key: 'name',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.name.name:First name`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'surname',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.surname.name:Last name`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'gender',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.gender.name:Gender`,
      inactive: true
    },
    {
      key: 'id',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.id.name:Id`,
    },
    {
      key: 'village',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.village.name:Village`,
      inactive: true
    },
    {
      key: 'cell',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.cell.name:Cell`,
      inactive: true
    },
    {
      key: 'actions',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.actions.name:Actions`,
      inactive: true
    }
  ];

  sortOptionsHonduras: SortOption[] = [
    {
      key: 'name',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.name.name:First name`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'surname',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.surname.name:Last name`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'gender',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.gender.name:Gender`,
      inactive: true
    },
    {
      key: 'id',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.id.name:Id`,
    },
    {
      key: 'municipality',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.municipality.name:Municipality`,
      inactive: true
    },
    {
      key: 'village',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.village.name:Village`,
      inactive: true
    },
    {
      key: 'actions',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.actions.name:Actions`,
      inactive: true
    }
  ];

  isSystemOrRegionalAdmin = false;

  subs: Subscription;

  @ViewChild('addFarmerButtonTooltip')
  addFarmerButtonTooltip: NgbTooltip;

  constructor(
      private globalEventsManager: GlobalEventManagerService,
      private companyController: CompanyControllerService,
      private router: Router,
      private authService: AuthService,
      private selUserCompanyService: SelectedUserCompanyService,
      private fileSaverService: FileSaverService,
      private modalService: NgbModalImproved,
      private selfOnboardingService: SelfOnboardingService
  ) { }

  ngOnInit(): void {

    this.authService.userProfile$.pipe(take(1)).subscribe(up => {
      this.isSystemOrRegionalAdmin = up && (up.role === RoleEnum.SYSTEMADMIN || up.role === RoleEnum.REGIONALADMIN);
    });

    this.selUserCompanyService.selectedCompanyProfile$.pipe(take(1)).subscribe(cp => {
      if (cp) {

        this.organizationId = cp.id;
        this.selectedCompany = cp;

        this.showRwanda = cp.headquarters &&
            cp.headquarters.country &&
            cp.headquarters.country.code &&
            cp.headquarters.country.code === 'RW';

        this.showHonduras = cp.headquarters &&
          cp.headquarters.country &&
          cp.headquarters.country.code &&
          cp.headquarters.country.code === 'HN';

        this.loadFarmers().then();
      }
    });
  }

  ngAfterViewInit() {

    this.subs = this.selfOnboardingService.addFarmersCurrentStep$.subscribe(currentStep => {
      if (currentStep === 2) {
        this.addFarmerButtonTooltip?.open();
      } else {
        this.addFarmerButtonTooltip?.close();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subs) {
      this.subs.unsubscribe();
    }
  }

  private async loadFarmers() {

    this.farmers$ = combineLatest([this.sorting$, this.query$, this.search$, this.pagination$, this.ping$])
        .pipe(
            map(([sort, queryString, search, page, ping]) => {
              const params: GetUserCustomersForCompanyAndType.PartialParamMap = {
                companyId: this.organizationId,
                type: 'FARMER',
                sort: sort.sortOrder,
                sortBy: sort.key,
                offset: (page - 1) * this.pageSize,
                limit: this.pageSize,
                query: queryString,
                searchBy: search
              };
              return params;
            }),
            tap(() => this.globalEventsManager.showLoading(true)),
            switchMap(params => this.companyController.getUserCustomersForCompanyAndTypeByMap(params)),
            map(response => {
              if (response) {
                this.farmerCount = response.data.count;
                this.showing = this.farmerCount >= this.pageSize ? Math.min(this.page * this.pageSize, this.farmerCount) : this.farmerCount;

                return response.data;
              }
            }),
            tap(() => this.globalEventsManager.showLoading(false)),
            shareReplay(1)
        );

    this.plots$ = this.companyController.getUserCustomersPlotsForCompany(this.organizationId)
        .pipe(
            map(response => response.data)
        );
  }

  async addFarmer() {

    const addFarmerCurrentStep = await this.selfOnboardingService.addFarmersCurrentStep$.pipe(take(1)).toPromise();
    if (addFarmerCurrentStep === 2) {
      this.selfOnboardingService.setAddFarmersCurrentStep(3);
    }

    this.router.navigate(['my-farmers', 'add']).then();
  }

  editFarmer(id) {
    this.router.navigate(['my-farmers', 'edit', id]).then();
  }

  async exportFarmerData(): Promise<void> {

    this.globalEventsManager.showLoading(true);
    try {
      const res = await this.companyController.exportFarmerDataByCompany(this.organizationId)
          .pipe(take(1))
          .toPromise();

      this.fileSaverService.save(res, 'farmers_data.zip');
    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  async deleteFarmer(id) {
    const result = await this.globalEventsManager.openMessageModal({
      type: 'warning',
      message: $localize`:@@productLabelStakeholdersCollectors.deleteCollector.error.message:Are you sure you want to delete the collector?`,
      options: {
        centered: true
      }
    });
    if (result !== 'ok') {
      return;
    }
    const res = await this.companyController.deleteUserCustomer(id).pipe(take(1)).toPromise();
    if (res && res.status === 'OK') {
      this.ping$.next(null);
    }
  }

  importFarmers() {
    this.router.navigate(['my-farmers', 'import']).then();
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
    return this.farmerCount && this.farmerCount > this.pageSize;
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

  openGeoIdWhisp($geoId: string) {
    const modalRef = this.modalService.open(OpenPlotDetailsExternallyModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'xxl',
      scrollable: true
    });
    Object.assign(modalRef.componentInstance, {
      geoId: $geoId
    });
    modalRef.result.then();
  }

}
