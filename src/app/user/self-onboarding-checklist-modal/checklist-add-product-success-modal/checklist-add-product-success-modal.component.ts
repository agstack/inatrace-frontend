import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { NgbModalImproved } from "../../../core/ngb-modal-improved/ngb-modal-improved.service";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { SelfOnboardingChecklistModalComponent } from "../self-onboarding-checklist-modal.component";
import { SelfOnboardingService } from "../../../shared-services/self-onboarding.service";

@Component({
    selector: 'app-checklist-add-product-success-modal',
    templateUrl: './checklist-add-product-success-modal.component.html',
    styleUrls: ['./checklist-add-product-success-modal.component.scss', '../self-onboarding-checklist-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ChecklistAddProductSuccessModalComponent implements OnInit {

  constructor(
      private activeModal: NgbActiveModal,
      private modalService: NgbModalImproved,
      private selfOnboardingService: SelfOnboardingService
  ) { }

  ngOnInit(): void {
  }

  continue() {
    this.selfOnboardingService.clearAddProductCurrentStep();
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
