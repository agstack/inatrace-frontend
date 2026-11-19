import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { SelfOnboardingService } from "../../../shared-services/self-onboarding.service";

@Component({
    selector: 'app-checklist-add-farmers-success-modal',
    templateUrl: './checklist-add-farmers-success-modal.component.html',
    styleUrls: ['./checklist-add-farmers-success-modal.component.scss', '../self-onboarding-checklist-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ChecklistAddFarmersSuccessModalComponent implements OnInit {

    constructor(
        private activeModal: NgbActiveModal,
        private selfOnboardingService: SelfOnboardingService
    ) {
    }

    ngOnInit(): void {
    }

    showMeAround() {
        this.selfOnboardingService.clearAddFarmersCurrentStep();
        this.activeModal.dismiss();
        this.selfOnboardingService.startGuidedTourStep();
    }

    iAmGood() {
        this.selfOnboardingService.clearAddFarmersCurrentStep();
        this.activeModal.dismiss();
    }

}
