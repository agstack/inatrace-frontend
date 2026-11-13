import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiUserGet } from '../../../api/model/apiUserGet';
import { NgbModalImproved } from '../../core/ngb-modal-improved/ngb-modal-improved.service';
import {
  SelfOnboardingChecklistModalComponent
} from '../self-onboarding-checklist-modal/self-onboarding-checklist-modal.component';
import { ApiCompanyOnboardingState } from "../../../api/model/apiCompanyOnboardingState";

@Component({
    selector: 'app-self-onboarding-welcome-modal',
    templateUrl: './self-onboarding-welcome-modal.component.html',
    styleUrls: ['./self-onboarding-welcome-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SelfOnboardingWelcomeModalComponent implements OnInit {

  @Input()
  userProfile: ApiUserGet;

  @Input()
  companyOnboardingState: ApiCompanyOnboardingState;

  constructor(
      private activeModal: NgbActiveModal,
      private modalService: NgbModalImproved
  ) { }

  ngOnInit(): void {
  }

  onGuideMe() {

    this.activeModal.dismiss();
    sessionStorage.setItem('dismissedOnboardingWelcomeModal', 'true');
    const modalRef = this.modalService.open(SelfOnboardingChecklistModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'md',
      windowClass: 'self-onboarding-checklist-modal-class',
    });
    Object.assign(modalRef.componentInstance, {
      companyOnboardingState: this.companyOnboardingState
    });
  }

  onMaybeLater() {
    this.activeModal.dismiss();
    sessionStorage.setItem('dismissedOnboardingWelcomeModal', 'true');
  }

}
