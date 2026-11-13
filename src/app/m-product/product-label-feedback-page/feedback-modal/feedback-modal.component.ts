import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { defaultEmptyObject, generateFormFromMetadata } from 'src/shared/utils';
import { ApiProductLabelFeedback } from 'src/api/model/apiProductLabelFeedback';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';
import { PublicControllerService } from 'src/api/api/publicController.service';
import { take } from 'rxjs/operators';
import {
  ApiProductLabelFeedbackValidationScheme,
  questionnaireAnswersFormMetadata,
  questionnaireAnswersValidationScheme
} from './validation';
import { EnumSifrant } from '../../../shared-services/enum-sifrant';

@Component({
    selector: 'app-feedback-modal',
    templateUrl: './feedback-modal.component.html',
    styleUrls: ['./feedback-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FeedbackModalComponent implements OnInit {

  submitted = false;

  @Input()
  labelId;

  @Input()
  gdprHtmlContext;

  @Input()
  feedback;

  feedbackForm: UntypedFormGroup;

  productName: string;

  readOnly = false;

  constructor(
    public activeModal: NgbActiveModal,
    private globalEventsManager: GlobalEventManagerService,
    private publicController: PublicControllerService
  ) { }

  ngOnInit(): void {
    if (this.labelId) {
      this.feedbackForm = generateFormFromMetadata(ApiProductLabelFeedback.formMetadata(),
          defaultEmptyObject(ApiProductLabelFeedback.formMetadata()), ApiProductLabelFeedbackValidationScheme);
      const questionnaireAnswersForm = generateFormFromMetadata(questionnaireAnswersFormMetadata(), {}, questionnaireAnswersValidationScheme);
      this.feedbackForm.setControl('questionnaireAnswers', questionnaireAnswersForm);

      this.feedbackForm.updateValueAndValidity();
    } else {
      this.readOnly = true;
      this.feedbackForm = generateFormFromMetadata(ApiProductLabelFeedback.formMetadata(), this.feedback, ApiProductLabelFeedbackValidationScheme);
      const questionnaireAnswersForm = generateFormFromMetadata(questionnaireAnswersFormMetadata(), this.feedback.questionnaireAnswers, questionnaireAnswersValidationScheme);
      this.feedbackForm.setControl('questionnaireAnswers', questionnaireAnswersForm);

      this.feedbackForm.get('questionnaireAnswers.rateTaste').disable();
      this.feedbackForm.get('questionnaireAnswers.gender').disable();

      this.productName = this.feedback.productName;
    }
  }

  dismiss() {
    this.activeModal.dismiss();
  }

  async submitFeedback() {
    this.submitted = true;
    if (this.feedbackForm.invalid) {
      return false;
    }
    let result = false;
    try {
      this.globalEventsManager.showLoading(true);
      const data = this.prepareData();
      const res = await this.publicController.addProductLabelFeedback(this.labelId, data).pipe(take(1)).toPromise();
      if (res && res.status === 'OK') {
        result = true;
      }
    } catch (e) {

    } finally {
      this.globalEventsManager.showLoading(false);
    }
    this.dismiss();
    return result;
  }

  prepareData() {
    return this.feedbackForm.value;
  }

  get statusList() {
    const obj = {};
    obj['PRAISE'] = $localize`:@@productLabelFrontFeedback.statusList.registred:Praise`
    obj['PROPOSAL'] = $localize`:@@productLabelFrontFeedback.statusList.active:Proposal`
    obj['COMPLAINT'] = $localize`:@@productLabelFrontFeedback.statusList.deactivated:Complaint`
    return obj;
  }
  codebookStatus = EnumSifrant.fromObject(this.statusList);

  get ageCodes() {
    const obj = {};
    obj['Male'] = $localize`:@@customerDetail.ageCodes.male:Male`;
    obj['Female'] = $localize`:@@customerDetail.ageCodes.female:Female`;
    obj['N/A'] = $localize`:@@customerDetail.ageCodes.na:N/A`;
    return obj;
  }
  codebookAgeCodes = EnumSifrant.fromObject(this.ageCodes);


  get tasteCodes() {
    const obj = {};
    obj['Better'] = $localize`:@@customerDetail.tasteCodes.better:Better`;
    obj['Same'] = $localize`:@@customerDetail.tasteCodes.same:Same`;
    obj['Worse'] = $localize`:@@customerDetail.tasteCodes.worse:Worse`;
    return obj;
  }
  codebookTasteCodes = EnumSifrant.fromObject(this.tasteCodes);

}
