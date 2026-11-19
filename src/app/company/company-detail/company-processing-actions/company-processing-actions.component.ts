import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyDetailTabManagerComponent } from '../company-detail-tab-manager/company-detail-tab-manager.component';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';
import { AuthService } from '../../../core/auth.service';
import { CompanyControllerService } from '../../../../api/api/companyController.service';
import { SelfOnboardingService } from '../../../shared-services/self-onboarding.service';
import { Subscription } from 'rxjs';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { take } from 'rxjs/operators';
import {
  CompanyDetailProcessingActionsAddWizardComponent
} from './company-detail-processing-actions-add-wizard/company-detail-processing-actions-add-wizard.component';
import { NgbModalImproved } from "../../../core/ngb-modal-improved/ngb-modal-improved.service";

@Component({
    selector: 'app-company-processing-actions',
    templateUrl: './company-processing-actions.component.html',
    styleUrls: ['./company-processing-actions.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CompanyProcessingActionsComponent extends CompanyDetailTabManagerComponent implements OnInit, OnDestroy, AfterViewInit {

  rootTab = 3;
  prepared = false;

  organizationId: number;

  showedProcessingActions = 0;
  allProcessingActions = 0;

  private subscriptions: Subscription;

  @ViewChild('addProcActionButtonTooltip')
  addProcActionButtonTooltip: NgbTooltip;

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected globalEventsManager: GlobalEventManagerService,
      protected authService: AuthService,
      protected companyController: CompanyControllerService,
      private selfOnboardingService: SelfOnboardingService,
      private modalService: NgbModalImproved
  ) {
    super(router, route, authService, companyController);
  }

  ngOnInit(): void {

    super.ngOnInit();
    this.organizationId = +this.route.snapshot.paramMap.get('id');
    this.prepared = true;
  }

  ngAfterViewInit() {

    super.ngAfterViewInit();

    this.subscriptions = this.selfOnboardingService.addProcessingActionCurrentStep$.subscribe(step => {
      if (step === 3) {
        this.addProcActionButtonTooltip?.open();
      } else {
        this.addProcActionButtonTooltip?.close();
      }
    });
  }

  ngOnDestroy() {

    super.ngOnDestroy();
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }

  async newProcessingAction() {

    const addProcActionStep = await this.selfOnboardingService.addProcessingActionCurrentStep$.pipe(take(1)).toPromise();

    // In this case open the add processing action wizard
    if (addProcActionStep === 3) {
      this.selfOnboardingService.setAddProcessingActionCurrentStep(4);
      const modalRef = this.modalService.open(CompanyDetailProcessingActionsAddWizardComponent, {
        centered: true,
        backdrop: 'static',
        keyboard: false,
        size: 'lg'
      });
      Object.assign(modalRef.componentInstance, {
        companyId: this.organizationId
      });
    } else {
      this.router.navigate(['companies', this.organizationId, 'processingActions', 'new']).then();
    }
  }

  onShowSP(event) {
    this.showedProcessingActions = event;
  }

  onCountAll(event){
    this.allProcessingActions = event;
  }

  canDeactivate() {
    return true;
  }

}
