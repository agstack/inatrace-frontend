import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TabCommunicationService } from 'src/app/shared/tab-communication.service';
import { AuthorisedLayoutComponent } from 'src/app/layout/authorised/authorised-layout/authorised-layout.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ComponentCanDeactivate } from 'src/app/shared-services/component-can-deactivate';
import { AuthService } from '../../../core/auth.service';
import { ApiUserGet } from '../../../../api/model/apiUserGet';
import { ApiCompanyName } from '../../../../api/model/apiCompanyName';
import { CompanyControllerService } from '../../../../api/api/companyController.service';

@Component({
    selector: 'app-company-detail-tab-manager',
    templateUrl: './company-detail-tab-manager.component.html',
    styleUrls: ['./company-detail-tab-manager.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CompanyDetailTabManagerComponent extends ComponentCanDeactivate implements OnInit, OnDestroy, AfterViewInit {

  // TABS
  @ViewChild(AuthorisedLayoutComponent) authorizedLayout;
  rootTab = 0;

  tabs = [
    $localize`:@@companyDetailTab.tab0.title:Company`,
    $localize`:@@companyDetailTab.tab2.title:Users`,
    $localize`:@@companyDetailTab.tab3.title:Facilities`,
    $localize`:@@companyDetailTab.tab4.title:Processing actions`
  ];

  tabNames = [
    'company',
    'users',
    'facilities',
    'processingActions'
  ];

  lockedTabs: string[] = [];

  cId = this.route.snapshot.params.id;
  selectedTab: Subscription;

  isAdmin = false;
  isCompanyAdmin = false;
  userProfileSubscription: Subscription;

  companyName: ApiCompanyName = null;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected authService: AuthService,
    protected companyController: CompanyControllerService
  ) { super(); }

  get tabCommunicationService(): TabCommunicationService {
    return this.authorizedLayout ? this.authorizedLayout.tabCommunicationService : null;
  }

  ngOnInit(): void {
    this.userProfileSubscription = this.authService.userProfile$
      .subscribe(userProfile => {
        if (userProfile) {

          // Set flag if this user is System admin
          this.isAdmin = userProfile.role === ApiUserGet.RoleEnum.SYSTEMADMIN || userProfile.role === ApiUserGet.RoleEnum.REGIONALADMIN;

          if (this.cId != null) {

            // Set flag if this user is enrolled in the selected company (if not enrolled in the company,
            // cannot see tabs: facilities and processing actions)
            this.isCompanyAdmin = userProfile.companyIdsAdmin.findIndex(id => String(id) === this.cId) !== -1;

            // If not company enrolled, lock the facilities and processing actions tabs
            if (!this.isCompanyAdmin) {
              this.lockedTabs = [
                'facilities',
                'processingActions'
              ];
            }
          } else {

            // If creating a new company, these tabs should be locked
            this.lockedTabs = [
              'users',
              'facilities',
              'processingActions'
            ];
          }
        }
      });

    if (this.rootTab !== 0) {
      this.companyController.getCompanyName(Number(this.cId)).subscribe(resp => {
        if (resp && resp.status === 'OK') {
          this.companyName = resp.data;
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.userProfileSubscription) {
      this.userProfileSubscription.unsubscribe();
    }
  }

  ngAfterViewInit() {
    this.selectedTab = this.tabCommunicationService.subscribe(
      this.tabs, 
      this.tabNames, 
      this.rootTab, 
      this.targetNavigate.bind(this),
      this.lockedTabs);
  }

  canDeactivate(): boolean {
    throw new Error('Method not implemented.');
  }

  targetNavigate(segment: string) {
    this.router.navigate(['companies', this.cId, segment]).then();
  }

}
