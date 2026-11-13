import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthorisedLayoutComponent } from '../../../layout/authorised/authorised-layout/authorised-layout.component';
import { BehaviorSubject, Subscription } from 'rxjs';
import { TabCommunicationService } from '../../../shared/tab-communication.service';
import { UntypedFormControl } from '@angular/forms';
import { setNavigationParameter } from '../../../../shared/utils';
import { ApiFacility } from '../../../../api/model/apiFacility';
import { FacilityControllerService } from '../../../../api/api/facilityController.service';
import { CompanyFacilitiesService } from '../../../shared-services/company-facilities.service';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { SelectedUserCompanyService } from '../../../core/selected-user-company.service';
import { take } from 'rxjs/operators';
import { ApiCompanyGet } from '../../../../api/model/apiCompanyGet';
import CompanyRolesEnum = ApiCompanyGet.CompanyRolesEnum;

@Component({
    template: '',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class OrdersTabComponent implements OnInit, AfterViewInit, OnDestroy {

  faTimes = faTimes;

  rootTab = 0;

  selectedTab: Subscription;

  tabs = [
    $localize`:@@productLabelOrder.tab0.title:Received orders`,
    $localize`:@@productLabelOrder.tab1.title:Placed orders`
  ];

  tabNames = [
    'received-orders',
    'placed-orders'
  ];

  companyId: number;
  companyHasBuyerRole = false;

  // Controls for the facility dropdown select component
  facilityCodebook: CompanyFacilitiesService;
  facilityForStockOrderForm = new UntypedFormControl(null);
  selectedFacilityId = null;
  selectedFacilityId$ = new BehaviorSubject<number>(null);

  allOrders = 0;
  showedOrders = 0;

  openOnly = false;
  openOnly$ = new BehaviorSubject<boolean>(this.openOnly);

  // TABS
  @ViewChild(AuthorisedLayoutComponent)
  authorizedLayout;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected facilityController: FacilityControllerService,
    protected selUserCompanyService: SelectedUserCompanyService
  ) { }

  get tabCommunicationService(): TabCommunicationService {
    return this.authorizedLayout ? this.authorizedLayout.tabCommunicationService : null;
  }

  async ngOnInit(): Promise<void> {

    const cp = await this.selUserCompanyService.selectedCompanyProfile$.pipe(take(1)).toPromise();
    if (cp) {
      this.companyId = cp.id;
      this.facilityCodebook = new CompanyFacilitiesService(this.facilityController, this.companyId);
      this.companyHasBuyerRole = cp.companyRoles?.some(cr => cr === CompanyRolesEnum.BUYER);
    }
  }

  ngAfterViewInit() {
    this.selectedTab = this.tabCommunicationService.subscribe(this.tabs, this.tabNames, this.rootTab, this.targetNavigate.bind(this));
  }

  ngOnDestroy() {
    this.tabCommunicationService.announceTabTitles([]);
    if (this.selectedTab) {
      this.selectedTab.unsubscribe();
    }
  }

  targetNavigate(segment: string) {
    this.router.navigate([segment], { relativeTo: this.route.parent }).then();
  }

  facilityChanged(event: ApiFacility) {
    if (event) {
      this.selectedFacilityId = event.id;
      this.selectedFacilityId$.next(event.id);
    } else {
      this.selectedFacilityId = null;
      this.selectedFacilityId$.next(null);
    }
    setNavigationParameter(this.router, this.route, 'facilityId', this.selectedFacilityId);
  }

  setOpenOnly(openOnly: boolean) {
    this.openOnly = openOnly;
    this.openOnly$.next(openOnly);
  }

  onCount(event) {
    this.allOrders = event;
  }

  onShow(event) {
    this.showedOrders = event;
  }

}
