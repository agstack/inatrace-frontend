import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { SelfOnboardingService } from "../../../shared-services/self-onboarding.service";

@Component({
    selector: 'app-guided-tour-success-modal',
    templateUrl: './guided-tour-success-modal.component.html',
    styleUrls: ['./guided-tour-success-modal.component.scss', '../self-onboarding-checklist-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class GuidedTourSuccessModalComponent implements OnInit {

  constructor(
      private activeModal: NgbActiveModal,
      private selfOnboardingService: SelfOnboardingService
  ) { }

  ngOnInit(): void {
  }

  ok() {
    this.selfOnboardingService.endGuidedTour();
    this.activeModal.dismiss();
  }

}
