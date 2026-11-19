import { AfterViewInit, Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormControl } from '@angular/forms';
import { GeneralSifrantService } from '../../../../shared-services/general-sifrant.service';
import { FacilityControllerService } from '../../../../../api/api/facilityController.service';
import { CompanyFacilitiesService } from '../../../../shared-services/company-facilities.service';
import { CompanyCollectingFacilitiesService } from '../../../../shared-services/company-collecting-facilities.service';
import {dateISOString, setNavigationParameter} from '../../../../../shared/utils';
import { ApiFacility } from '../../../../../api/model/apiFacility';
import { BehaviorSubject, Subscription } from 'rxjs';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { AuthorisedLayoutComponent } from '../../../../layout/authorised/authorised-layout/authorised-layout.component';
import { TabCommunicationService } from '../../../../shared/tab-communication.service';
import { ApiStockOrder } from '../../../../../api/model/apiStockOrder';
import { ApiPayment } from '../../../../../api/model/apiPayment';
import { AuthService } from '../../../../core/auth.service';
import { take } from 'rxjs/operators';
import { CompanyControllerService } from '../../../../../api/api/companyController.service';
import { ApiResponseListApiCompanyUser } from '../../../../../api/model/apiResponseListApiCompanyUser';
import { ApiCompanyUser } from '../../../../../api/model/apiCompanyUser';
import StatusEnum = ApiResponseListApiCompanyUser.StatusEnum;
import CompanyRoleEnum = ApiCompanyUser.CompanyRoleEnum;
import {ApiGroupStockOrder} from '../../../../../api/model/apiGroupStockOrder';
import { SelectedUserCompanyService } from '../../../../core/selected-user-company.service';
import { ApiCompanyGet } from '../../../../../api/model/apiCompanyGet';

export type StockOrderListingPageMode = 'PURCHASE_ORDERS' | 'COMPANY_ADMIN' | 'SYSTEM_ADMIN';

export interface DeliveryDates {
  from: string;
  to: string;
}

@Component({
    template: '',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class StockCoreTabComponent implements OnInit, AfterViewInit {

  faTimes = faTimes;

  companyId: number;
  companyProfile: ApiCompanyGet | null = null;

  selectedFacilityId: number;
  facilityIdPing$ = new BehaviorSubject<number>(null);
  facilityForStockOrderForm = new UntypedFormControl(null);
  facilityCodebook: GeneralSifrantService<any>;

  openBalanceOnly = false;
  openBalancePing$ = new BehaviorSubject<boolean>(this.openBalanceOnly);

  filterWayOfPayment = new UntypedFormControl('');
  wayOfPaymentPing$ = new BehaviorSubject<string>(this.filterWayOfPayment.value);

  selectedOrders: ApiStockOrder[];
  selectedGroupOrders: ApiGroupStockOrder[];
  selectedPayments: ApiPayment[];

  clickAddPaymentsPing$ = new BehaviorSubject<boolean>(false);

  fromFilterDate = new UntypedFormControl(null);
  toFilterDate = new UntypedFormControl(null);
  deliveryDatesPing$ = new BehaviorSubject<DeliveryDates>({ from: null, to: null });

  isAuthRoleToSeeProcessing = true;
  isAuthRoleToSeePayments = true;
  isAuthRoleToEditPayments = true;
  isAuthRoleToSeeMyStock = true;

  // TABS
  @ViewChild(AuthorisedLayoutComponent)
  authorizedLayout;

  rootTab = 0;
  selectedTab: Subscription;

  tabs = [
    $localize`:@@productLabelStock.tab0.title:Deliveries`,
    $localize`:@@productLabelStock.tab1.title:Processing`,
    $localize`:@@productLabelStock.tab2.title:Payments`,
    $localize`:@@productLabelStock.tab4.title:All stock`,
  ];

  tabNames = [
    'deliveries',
    'processing',
    'payments',
    'all-stock'
  ];

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected globalEventManager: GlobalEventManagerService,
    protected facilityControllerService: FacilityControllerService,
    protected authService: AuthService,
    protected companyController: CompanyControllerService,
    protected selUserCompanyService: SelectedUserCompanyService
  ) { }

  get pageMode(): StockOrderListingPageMode {
    if (!this.route.snapshot.data.mode) { return 'PURCHASE_ORDERS'; }
    return this.route.snapshot.data.mode as StockOrderListingPageMode;
  }

  get tabCommunicationService(): TabCommunicationService {
    return this.authorizedLayout ? this.authorizedLayout.tabCommunicationService : null;
  }

  targetNavigate(segment: string) {
    this.router.navigate(['my-stock', segment, 'tab']).then();
  }

  async ngOnInit(): Promise<void> {

    this.selectedOrders = [];
    this.selectedGroupOrders = [];
    this.selectedPayments = [];

    const cp = await this.selUserCompanyService.selectedCompanyProfile$.pipe(take(1)).toPromise();
    if (cp) {
      this.companyProfile = cp;
      this.companyId = cp.id;
      this.isAuthorisedCompanyRole().then();
      this.initFacilityCodebook();
    }
  }

  ngAfterViewInit() {
    this.selectedTab = this.tabCommunicationService.subscribe(this.tabs, this.tabNames, this.rootTab, this.targetNavigate.bind(this));
  }

  private initFacilityCodebook(): void {
    switch (this.pageMode) {
      case 'SYSTEM_ADMIN':
      case 'COMPANY_ADMIN':
        this.facilityCodebook = new CompanyFacilitiesService(this.facilityControllerService, this.companyId);
        break;
      case 'PURCHASE_ORDERS':
      default:
        this.facilityCodebook = new CompanyCollectingFacilitiesService(this.facilityControllerService, this.companyId);
        break;
    }
  }

  facilityForStockOrderChanged(event: ApiFacility) {
    if (event) {
      this.selectedFacilityId = event.id;
      this.facilityIdPing$.next(this.selectedFacilityId);
    } else {
      this.selectedFacilityId = null;
      this.facilityIdPing$.next(null);
    }
    setNavigationParameter(this.router, this.route, 'facilityId', String(this.selectedFacilityId));
  }

  setOpenBalanceOnly(openB: boolean) {
    this.openBalanceOnly = openB;
    this.openBalancePing$.next(openB);
  }

  public setWayOfPayment(value: string) {
    this.filterWayOfPayment.setValue(value);
    this.wayOfPaymentPing$.next(value);
  }

  showWarning(title, message) {
    const buttonOkText = $localize`:@@productLabelStock.warning.button.ok:OK`;
    this.globalEventManager.openMessageModal({
      title,
      message,
      type: 'warning',
      options: {centered: true},
      dismissable: false,
      buttons: ['ok'],
      buttonTitles: {ok: buttonOkText}
    }).then();
   }

  private dateSearch() {

    let from = this.fromFilterDate.value;
    let to = this.toFilterDate.value;

    if (from && to) {
      from = dateISOString(from);
      to = dateISOString(to);
    } else if (from) {
      const tomorrow = new Date();
      tomorrow.setDate(new Date().getDate() + 1);
      from = dateISOString(from);
      to = dateISOString(tomorrow);
    } else if (to) {
      const fromBeginningOfTime = new Date(null);
      from = dateISOString(fromBeginningOfTime);
      to = dateISOString(to);
    } else {
      from = null;
      to = null;
    }

    this.deliveryDatesPing$.next({ from, to });
  }

  onFilterDateRangeChange() {
    this.dateSearch();
  }

  selectedIdsChanged(event, type?) {
    if (type === 'PURCHASE') { this.selectedOrders = event; }
    else if (type === 'GROUP') { this.selectedGroupOrders = event; }
    else { this.selectedPayments = event; }
  }

  private async isAuthorisedCompanyRole() {

    const userProfile = await this.authService.userProfile$.pipe(take(1)).toPromise();

    const companyUsersRes = await this.companyController.getCompanyUsers(this.companyId).pipe(take(1)).toPromise();
    if (companyUsersRes && companyUsersRes.status === StatusEnum.OK) {
      const companyUsers = companyUsersRes.data;
      const user = companyUsers.find(cu => cu.id === userProfile.id);
      if (user) {
        if (user.companyRole === CompanyRoleEnum.ACCOUNTANT) {
          this.isAuthRoleToSeeProcessing = false;
          this.isAuthRoleToSeeMyStock = false;
        }
        if (user.companyRole === CompanyRoleEnum.MANAGER) {
          this.isAuthRoleToEditPayments = false;
        }
        return;
      }
    }

    this.isAuthRoleToSeeProcessing = false;
    this.isAuthRoleToSeeMyStock = false;
  }

}
