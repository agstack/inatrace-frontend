import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { SelfOnboardingChecklistModalComponent } from "../self-onboarding-checklist-modal.component";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { NgbModalImproved } from "../../../core/ngb-modal-improved/ngb-modal-improved.service";
import { SelfOnboardingService } from "../../../shared-services/self-onboarding.service";

@Component({
    selector: 'app-checklist-add-facility-success-modal',
    templateUrl: './checklist-add-facility-success-modal.component.html',
    styleUrls: ['./checklist-add-facility-success-modal.component.scss', '../self-onboarding-checklist-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ChecklistAddFacilitySuccessModalComponent implements OnInit {

  constructor(
      private activeModal: NgbActiveModal,
      private modalService: NgbModalImproved,
      private selfOnboardingService: SelfOnboardingService
  ) { }

  ngOnInit(): void {
  }

  continue() {
    this.selfOnboardingService.clearAddFacilityCurrentStep();
    this.activeModal.dismiss();
    this.modalService.open(SelfOnboardingChecklistModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'md',
      windowClass: 'self-onboarding-checklist-modal-class',
    });
  }

}
