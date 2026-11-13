import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { StockCoreTabComponent } from '../../stock-core/stock-core-tab/stock-core-tab.component';
import { ActivatedRoute, Router } from '@angular/router';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { FacilityControllerService } from '../../../../../api/api/facilityController.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { AuthService } from '../../../../core/auth.service';
import { CompanyControllerService } from '../../../../../api/api/companyController.service';
import { SelectedUserCompanyService } from '../../../../core/selected-user-company.service';
import { SelfOnboardingService } from "../../../../shared-services/self-onboarding.service";
import { NgbTooltip } from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'app-stock-processing-tab',
    templateUrl: './stock-processing-tab.component.html',
    styleUrls: ['./stock-processing-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class StockProcessingTabComponent extends StockCoreTabComponent implements OnInit, OnDestroy, AfterViewInit {

  rootTab = 1;

  allProcessFacilities = 0;
  showedProcessFacilities = 0;

  reloadProcessingFacilitiesListPing$ = new BehaviorSubject<boolean>(false);

  subs: Subscription;

  @ViewChild('procActionsTitleTooltip')
  procActionsTitleTooltip: NgbTooltip;

  @ViewChild('facilityListTooltip')
  facilityListTooltip: NgbTooltip;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected globalEventManager: GlobalEventManagerService,
    protected facilityControllerService: FacilityControllerService,
    protected authService: AuthService,
    protected companyController: CompanyControllerService,
    protected selUserCompanyService: SelectedUserCompanyService,
    protected selfOnboardingService: SelfOnboardingService
  ) {
    super(router, route, globalEventManager, facilityControllerService, authService, companyController, selUserCompanyService);
  }

  async ngOnInit(): Promise<void> {
    await super.ngOnInit();
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();

    this.subs = this.selfOnboardingService.guidedTourStep$.subscribe(step => {

      setTimeout(() => {
        this.procActionsTitleTooltip?.close();
        this.facilityListTooltip?.close();
      }, 50)

      if (step === 5) {
        setTimeout(() => this.procActionsTitleTooltip?.open(), 50);
      } else if (step === 6) {
        setTimeout(() => this.facilityListTooltip?.open(), 50);
      }
    });
  }

  ngOnDestroy() {
    if (this.subs) {
      this.subs.unsubscribe();
    }
  }

  newProcessingOrder() {
    this.router.navigate(['my-stock', 'processing', 'NEW', 'facility', 'NEW', 'new']).then();
  }

  public onCountAll(event) {
    this.allProcessFacilities = event;
  }

  public onShow(event) {
    this.showedProcessFacilities = event;
  }

  continueGuidedTourToPayments() {
    this.selfOnboardingService.guidedTourNextStep(8);
    this.router.navigate(['my-stock', 'payments']).then();
  }

}
