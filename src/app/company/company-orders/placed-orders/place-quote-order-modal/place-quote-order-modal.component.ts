import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PlaceQuoteOrderModalResult } from './model';
import { UntypedFormControl, Validators } from '@angular/forms';
import { CompanyFacilitiesService } from '../../../../shared-services/company-facilities.service';
import { FacilityControllerService } from '../../../../../api/api/facilityController.service';
import { SelectedUserCompanyService } from '../../../../core/selected-user-company.service';
import { take } from 'rxjs/operators';
import { CodebookTranslations } from '../../../../shared-services/codebook-translations';
import { Subscription } from 'rxjs';
import { ProcessingActionControllerService } from '../../../../../api/api/processingActionController.service';
import { ApiFacility } from '../../../../../api/model/apiFacility';
import { ApiProcessingAction } from '../../../../../api/model/apiProcessingAction';
import { CompanyQuoteProcActionsForFacilityService } from '../../../../shared-services/company-quote-proc-actions-for-facility.service';

@Component({
    selector: 'app-place-quote-order-modal',
    templateUrl: './place-quote-order-modal.component.html',
    styleUrls: ['./place-quote-order-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PlaceQuoteOrderModalComponent implements OnInit, OnDestroy {

  facilityFormControl = new UntypedFormControl(null, Validators.required);

  processingActionFormControl = new UntypedFormControl(null, Validators.required);

  facilitiesCodebookService: CompanyFacilitiesService;
  procActionsCodebookService: CompanyQuoteProcActionsForFacilityService;

  facilityChangedSubs: Subscription;

  companyId: number;

  constructor(
    public activeModal: NgbActiveModal,
    private facilityControllerService: FacilityControllerService,
    private processingActionController: ProcessingActionControllerService,
    private codebookTranslations: CodebookTranslations,
    private selUserCompanyService: SelectedUserCompanyService
  ) { }

  ngOnInit(): void {
    this.selUserCompanyService.selectedCompanyProfile$.pipe(take(1)).subscribe(cp => {
      if (cp) {
        this.companyId = cp.id;
        this.facilitiesCodebookService = new CompanyFacilitiesService(this.facilityControllerService, this.companyId);
      }
    });

    this.facilityChangedSubs = this.facilityFormControl.valueChanges.subscribe(selFacility => {
      if (selFacility) {
        this.procActionsCodebookService = new CompanyQuoteProcActionsForFacilityService(this.processingActionController, this.companyId, selFacility);
      } else {
        this.procActionsCodebookService = null;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.facilityChangedSubs) {
      this.facilityChangedSubs.unsubscribe();
    }
  }

  cancel() {
    this.activeModal.close();
  }

  onConfirm() {

    if (this.facilityFormControl.valid && this.processingActionFormControl.valid) {
      const result: PlaceQuoteOrderModalResult = {
        facilityId: (this.facilityFormControl.value as ApiFacility).id,
        orderTemplateId: (this.processingActionFormControl.value as ApiProcessingAction).id
      };
      this.activeModal.close(result);
    }
  }

}
