import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SelfOnboardingService } from '../../shared-services/self-onboarding.service';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { ApiCompanyOnboardingState } from "../../../api/model/apiCompanyOnboardingState";
import { CompanyControllerService } from "../../../api/api/companyController.service";
import { SelectedUserCompanyService } from "../../core/selected-user-company.service";
import { take } from "rxjs/operators";

@Component({
    selector: 'app-self-onboarding-checklist-modal',
    templateUrl: './self-onboarding-checklist-modal.component.html',
    styleUrls: ['./self-onboarding-checklist-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SelfOnboardingChecklistModalComponent implements OnInit {

  selfOnboardingStatus = new UntypedFormGroup({
    hasProduct: new UntypedFormControl(true),
    hasFacility: new UntypedFormControl(false),
    hasProcessingAction: new UntypedFormControl(false),
    hasFarmers: new UntypedFormControl(false),
  });

  @Input()
  companyOnboardingState: ApiCompanyOnboardingState;

  constructor(
      private activeModal: NgbActiveModal,
      private selfOnboardingService: SelfOnboardingService,
      private selUserCompanyService: SelectedUserCompanyService,
      private companyControllerService: CompanyControllerService
  ) { }

  ngOnInit(): void {

    if (this.companyOnboardingState == null) {
      this.selUserCompanyService.selectedCompanyProfile$.pipe(take(1)).subscribe(async value => {
        const companyOnboardingState = await this.companyControllerService.getCompanyOnboardingState(value.id).toPromise();
        this.companyOnboardingState = companyOnboardingState.data;
        this.updateSelfOnboardingStatus();
      })
    } else {

      this.updateSelfOnboardingStatus();
    }
  }

  closeChecklist() {
    this.activeModal.dismiss();
  }

  startAddProductWizard(): void {
    if (!this.selfOnboardingStatus.get('hasProduct').value) {
      this.selfOnboardingService.setAddProductCurrentStep(1);
      this.activeModal.dismiss();
    }
  }

  startAddFacilityWizard(): void {
    if (!this.selfOnboardingStatus.get('hasFacility').value) {
      this.selfOnboardingService.setAddFacilityCurrentStep(1);
      this.activeModal.dismiss();
    }
  }

  startAddProcessingActionWizard(): void {
    if (!this.selfOnboardingStatus.get('hasProcessingAction').value) {
      this.selfOnboardingService.setAddProcessingActionCurrentStep(1);
      this.activeModal.dismiss();
    }
  }

  startAddFarmersWizard(): void {
    if (!this.selfOnboardingStatus.get('hasFarmers').value) {
      this.selfOnboardingService.setAddFarmersCurrentStep(1);
      this.activeModal.dismiss();
    }
  }

  private updateSelfOnboardingStatus() {

    this.selfOnboardingStatus.get('hasProduct').setValue(this.companyOnboardingState?.hasCreatedProduct);
    this.selfOnboardingStatus.get('hasFacility').setValue(this.companyOnboardingState?.hasCreatedFacility);
    this.selfOnboardingStatus.get('hasProcessingAction').setValue(this.companyOnboardingState?.hasCreatedProcessingAction);
    this.selfOnboardingStatus.get('hasFarmers').setValue(this.companyOnboardingState?.hasAddedFarmers);
  }

}
