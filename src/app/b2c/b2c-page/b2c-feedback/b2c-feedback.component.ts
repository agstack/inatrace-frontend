import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { B2cPageComponent } from '../b2c-page.component';
import { ApiBusinessToCustomerSettings } from '../../../../api/model/apiBusinessToCustomerSettings';
import { UntypedFormGroup } from '@angular/forms';
import { take } from 'rxjs/operators';
import { defaultEmptyObject, generateFormFromMetadata } from '../../../../shared/utils';
import { ApiProductLabelFeedback } from '../../../../api/model/apiProductLabelFeedback';
import {
  ApiProductLabelFeedbackValidationScheme,
  questionnaireAnswersFormMetadata,
  questionnaireAnswersValidationScheme
} from '../../../m-product/product-label-feedback-page/feedback-modal/validation';
import { EnumSifrant } from '../../../shared-services/enum-sifrant';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';
import { PublicControllerService } from '../../../../api/api/publicController.service';

@Component({
    selector: 'app-b2c-feedback',
    templateUrl: './b2c-feedback.component.html',
    styleUrls: ['./b2c-feedback.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class B2cFeedbackComponent implements OnInit {

  b2cSettings: ApiBusinessToCustomerSettings;

  submitted = false;

  feedbackForm: UntypedFormGroup;

  tab: string = null;

  title = $localize`:@@frontPage.feedback.title:Feedback`;

  productName = '';

  gdprHtmlContext = '';

  constructor(
      @Inject(B2cPageComponent) private b2cPage: B2cPageComponent,
      private globalEventsManager: GlobalEventManagerService,
      private publicController: PublicControllerService
  ) {
    this.b2cSettings = b2cPage.b2cSettings;
  }

  ngOnInit(): void {
    this.initLabel();

    this.feedbackForm = generateFormFromMetadata(ApiProductLabelFeedback.formMetadata(),
        defaultEmptyObject(ApiProductLabelFeedback.formMetadata()), ApiProductLabelFeedbackValidationScheme);
    const questionnaireAnswersForm = generateFormFromMetadata(questionnaireAnswersFormMetadata(), {}, questionnaireAnswersValidationScheme);
    this.feedbackForm.setControl('questionnaireAnswers', questionnaireAnswersForm);
    this.feedbackForm.updateValueAndValidity();
  }

  initLabel() {
    this.prepareGDPR(this.b2cPage.publicProductLabel.fields);
  }

  prepareGDPR(data) {
    for (const item of data) {
      if (item.name === 'name') {
        this.productName = item.value;
      }
      if (item.name === 'settings.gdprText') {
        this.gdprHtmlContext = item.value;
      }
    }
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
      const res = await this.publicController.addProductLabelFeedback(this.b2cPage.uuid, data).pipe(take(1)).toPromise();
      if (res && res.status === 'OK') {
        result = true;
        this.globalEventsManager.push({
          action: 'success',
          notificationType: 'success',
          title: $localize`:@@frontPage.feedback.success.title:Submitted`,
          message: $localize`:@@frontPage.feedback.success.message:Successfully submitted.`
        });
        this.feedbackForm = generateFormFromMetadata(ApiProductLabelFeedback.formMetadata(),
            defaultEmptyObject(ApiProductLabelFeedback.formMetadata()), ApiProductLabelFeedbackValidationScheme);
        const questionnaireAnswersForm = generateFormFromMetadata(questionnaireAnswersFormMetadata(), {}, questionnaireAnswersValidationScheme);
        this.feedbackForm.setControl('questionnaireAnswers', questionnaireAnswersForm);
        this.feedbackForm.updateValueAndValidity();
      }
    } catch (e) {
      this.globalEventsManager.push({
        action: 'error',
        notificationType: 'error',
        title: $localize`:@@frontPage.feedback.error.title:Something went wrong`,
        message: $localize`:@@frontPage.feedback.error.message:Please try again.`
      });
    } finally {
      this.submitted = false;
      this.globalEventsManager.showLoading(false);
    }
    return result;
  }

  prepareData() {
    return this.feedbackForm.value;
  }

  get statusList() {
    const obj = {};
    obj['PRAISE'] = $localize`:@@frontPage.feedback.statusList.registred:Praise`;
    obj['PROPOSAL'] = $localize`:@@frontPage.feedback.statusList.active:Proposal`;
    obj['COMPLAINT'] = $localize`:@@frontPage.feedback.statusList.deactivated:Complaint`;
    return obj;
  }
  codebookStatus = EnumSifrant.fromObject(this.statusList);

  get ageCodes() {
    const obj = {};
    obj['Male'] = $localize`:@@frontPage.feedback.ageCodes.male:Male`;
    obj['Female'] = $localize`:@@frontPage.feedback.ageCodes.female:Female`;
    obj['N/A'] = $localize`:@@frontPage.feedback.ageCodes.na:N/A`;
    return obj;
  }
  codebookAgeCodes = EnumSifrant.fromObject(this.ageCodes);


  get tasteCodes() {
    const obj = {};
    obj['Better'] = $localize`:@@frontPage.feedback.tasteCodes.better:Better`;
    obj['Same'] = $localize`:@@frontPage.feedback.tasteCodes.same:Same`;
    obj['Worse'] = $localize`:@@frontPage.feedback.tasteCodes.worse:Worse`;
    return obj;
  }
  codebookTasteCodes = EnumSifrant.fromObject(this.tasteCodes);

}
