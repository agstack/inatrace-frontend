import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import {
  SelfOnboardingChecklistModalComponent
} from "../self-onboarding-checklist-modal/self-onboarding-checklist-modal.component";
import { NgbModalImproved } from "../../core/ngb-modal-improved/ngb-modal-improved.service";
import { SelfOnboardingService } from "../../shared-services/self-onboarding.service";
import { ApiUserGet } from "../../../api/model/apiUserGet";

@Component({
    selector: 'app-self-onboarding-assistant-modal',
    templateUrl: './self-onboarding-assistant-modal.component.html',
    styleUrls: ['./self-onboarding-assistant-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SelfOnboardingAssistantModalComponent implements OnInit {

  @Input()
  userProfile: ApiUserGet;

  constructor(
      private activeModal: NgbActiveModal,
      private modalService: NgbModalImproved,
      private selfOnboardingService: SelfOnboardingService
  ) { }

  ngOnInit(): void {
  }

  closeAssistantModal(): void {
    this.activeModal.dismiss();
  }

  openChecklistModal(): void {

    this.activeModal.dismiss();
    this.modalService.open(SelfOnboardingChecklistModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'md',
      windowClass: 'self-onboarding-checklist-modal-class',
    });
  }

  openGuidedTour(): void {
    this.selfOnboardingService.startGuidedTourStep();
    this.activeModal.dismiss();
  }

}
