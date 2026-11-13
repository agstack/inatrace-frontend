import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from 'src/app/core/auth.service';
import { combineLatest, Subscription } from 'rxjs';
import { AboutAppInfoService } from 'src/app/about-app-info.service';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { SelfOnboardingService } from '../../../shared-services/self-onboarding.service';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';

@Component({
    selector: 'app-authorised-side-nav',
    templateUrl: './authorised-side-nav.component.html',
    styleUrls: ['./authorised-side-nav.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AuthorisedSideNavComponent implements OnInit, OnDestroy, AfterViewInit {

  model = 1;
  isAdmin = false;
  isConfirmedOnly = false;

  constructor(
    private authService: AuthService,
    private aboutAppInfoService: AboutAppInfoService,
    private selfOnboardingService: SelfOnboardingService,
    private router: Router,
  ) { }

  user = null;
  sub: Subscription;

  @ViewChild('productsButtonTooltip')
  productsButtonTooltip: NgbTooltip;

  @ViewChild('companyButtonTooltip')
  companyButtonTooltip: NgbTooltip;

  ngOnInit() {
    this.sub = this.authService.userProfile$.subscribe(user => {
      this.user = user;
      this.isAdmin = user.role === 'SYSTEM_ADMIN' || user.role === 'REGIONAL_ADMIN';
      this.isConfirmedOnly = user.status === 'CONFIRMED_EMAIL';
    });
  }

  ngAfterViewInit() {

    this.sub.add(
        this.selfOnboardingService.addProductCurrentStep$.subscribe(step => {
          if (step === 1) {
            this.productsButtonTooltip?.open();
          } else {
            this.productsButtonTooltip?.close();
          }
        })
    );

    this.sub.add(
        combineLatest([
          this.selfOnboardingService.addFacilityCurrentStep$,
          this.selfOnboardingService.addProcessingActionCurrentStep$
        ]).subscribe(([addFacilityStep, addProcActionStep]) => {
          if (addFacilityStep === 1 || addProcActionStep === 1) {
            this.companyButtonTooltip?.open();
          } else {
            this.companyButtonTooltip?.close();
          }
        })
    );
  }

  ngOnDestroy() {
    if (this.sub) { this.sub.unsubscribe(); }
  }

  aboutApp() {
    this.aboutAppInfoService.openAboutApp();
  }

  async openProductsPage() {
    const currentStep = await this.selfOnboardingService.addProductCurrentStep$.pipe(take(1)).toPromise();
    if (currentStep === 1) {
      this.selfOnboardingService.setAddProductCurrentStep(2);
    }
    this.router.navigate(['/product-labels']).then();
  }

  async openCompanyPage() {

    const currentAddFacilityStep = await this.selfOnboardingService.addFacilityCurrentStep$.pipe(take(1)).toPromise();
    if (currentAddFacilityStep === 1) {
      this.selfOnboardingService.setAddFacilityCurrentStep(2);
    }

    const currentAddProcActionStep = await this.selfOnboardingService.addProcessingActionCurrentStep$.pipe(take(1)).toPromise();
    if (currentAddProcActionStep === 1) {
      this.selfOnboardingService.setAddProcessingActionCurrentStep(2);
    }

    this.router.navigate(['/my-stock']).then();
  }

}
