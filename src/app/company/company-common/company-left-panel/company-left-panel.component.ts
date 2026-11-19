import { Component, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { combineLatest, Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { ApiUserGet } from '../../../../api/model/apiUserGet';
import RoleEnum = ApiUserGet.RoleEnum;
import { SelectedUserCompanyService } from '../../../core/selected-user-company.service';
import { ApiCompanyGet } from '../../../../api/model/apiCompanyGet';
import CompanyRolesEnum = ApiCompanyGet.CompanyRolesEnum;
import { SelfOnboardingService } from '../../../shared-services/self-onboarding.service';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-company-left-panel',
    templateUrl: './company-left-panel.component.html',
    styleUrls: ['./company-left-panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CompanyLeftPanelComponent implements OnInit, OnDestroy {

  faCog = faCog;

  private companyId: number;
  companyTitle: string;
  imgStorageKey: string = null;

  isSystemOrRegionalAdmin = false;
  isCompanyAdmin = false;

  private subscriptions: Subscription[] = [];

  showCollectorsLink = false;
  showMyCustomersLink = false;

  @ViewChild('companyProfileButtonTooltip')
  companyProfileButtonTooltip: NgbTooltip;

  constructor(
    private router: Router,
    private authService: AuthService,
    private selUserCompanyService: SelectedUserCompanyService,
    private selfOnboardingService: SelfOnboardingService
  ) { }

  ngOnInit() {

    let user: ApiUserGet | null = null;
    this.subscriptions.push(
      this.authService.userProfile$
        .pipe(
          switchMap(userProfile => {
            user = userProfile;
            return this.selUserCompanyService.selectedCompanyProfile$;
          })
        )
        .subscribe(companyProfile => {
          if (user && companyProfile) {

            this.companyId = companyProfile.id;
            this.companyTitle = companyProfile.name;
            this.imgStorageKey = companyProfile.logo?.storageKey;

            if (user.role === ApiUserGet.RoleEnum.SYSTEMADMIN || user.role === RoleEnum.REGIONALADMIN) {
              this.isSystemOrRegionalAdmin = true;
            }

            if (user.companyIdsAdmin.includes(this.companyId)) {
              this.isCompanyAdmin = true;
            }

            this.showCollectorsLink = companyProfile.supportsCollectors;
            companyProfile.companyRoles?.forEach(cr => {
              if (cr === CompanyRolesEnum.BUYER) {
                this.showMyCustomersLink = true;
              }
            });

            this.subscriptions.push(
                combineLatest([
                  this.selfOnboardingService.addFacilityCurrentStep$,
                  this.selfOnboardingService.addProcessingActionCurrentStep$
                ]).subscribe(([addFacilityStep, addProcActionStep]) => {
                  if (addFacilityStep === 2 || addProcActionStep === 2) {
                    setTimeout(() => this.companyProfileButtonTooltip?.open());
                  } else {
                    setTimeout(() => this.companyProfileButtonTooltip?.close());
                  }
                })
            );
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subs => subs.unsubscribe());
  }

  async openCompanyProfile() {

    if (!this.companyId) {
      return;
    }

    const currentAddFacilityStep = await this.selfOnboardingService.addFacilityCurrentStep$.pipe(take(1)).toPromise();
    if (currentAddFacilityStep === 2) {
      this.selfOnboardingService.setAddFacilityCurrentStep(3);
      this.router.navigate(['companies', this.companyId, 'facilities']).then();
      return;
    }

    const currentAddProcActionStep = await this.selfOnboardingService.addProcessingActionCurrentStep$.pipe(take(1)).toPromise();
    if (currentAddProcActionStep === 2) {
      this.selfOnboardingService.setAddProcessingActionCurrentStep(3);
      this.router.navigate(['companies', this.companyId, 'processingActions']).then();
      return;
    }

    this.router.navigate(['companies', this.companyId, 'company']).then();
  }

}
