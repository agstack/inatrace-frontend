import { AfterContentInit, AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import {UntypedFormControl} from '@angular/forms';
import { NgbActiveModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import {ActiveCompaniesService} from '../../../shared-services/active-companies.service';
import {ActiveValueChainService} from '../../../shared-services/active-value-chain.service';
import { SelfOnboardingService } from "../../../shared-services/self-onboarding.service";
import { Subscription } from "rxjs";
import { take } from "rxjs/operators";

@Component({
    selector: 'app-new-product-modal',
    templateUrl: './new-product-modal.component.html',
    styleUrls: ['./new-product-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class NewProductModalComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input()
  dismissable = true;

  @Input()
  title = null;

  @Input()
  companyInstructionsHtml = null;

  @Input()
  valueChainInstructionsHtml = null;

  @Input()
  onSelectedCompany: (company: any) => {};

  @ViewChild('selectProductCompanyTooltip')
  selectProductCompanyTooltip: NgbTooltip;

  companyForm = new UntypedFormControl(null);
  valueChainForm = new UntypedFormControl(null);

  private subs: Subscription;

  constructor(
      public activeModal: NgbActiveModal,
      public sifrantCompany: ActiveCompaniesService,
      public sifrantValueChains: ActiveValueChainService,
      private selfOnboardingService: SelfOnboardingService
  ) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {

    this.subs = this.selfOnboardingService.addProductCurrentStep$.subscribe(step => {
      if (step == 3) {
        this.selectProductCompanyTooltip?.open();
      } else {
        this.selectProductCompanyTooltip?.close();
      }
    });
  }

  ngOnDestroy() {
    if (this.subs) {
      this.subs.unsubscribe();
    }
  }

  cancel() {
    this.activeModal.close();
  }

  async onConfirm() {

    if (this.companyForm.value && this.valueChainForm.value) {

      const currentStep = await this.selfOnboardingService.addProductCurrentStep$.pipe(take(1)).toPromise();
      if (currentStep == 3) {
        this.selfOnboardingService.setAddProductCurrentStep(4);
      }

      this.activeModal.close({company: this.companyForm.value, valueChain: this.valueChainForm.value});
    }
  }
}
