import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UntypedFormGroup } from '@angular/forms';
import { EnumSifrant } from 'src/app/shared-services/enum-sifrant';
import { generateFormFromMetadata } from '../../../../shared/utils';
import { ApiProductLabelBase } from '../../../../api/model/apiProductLabelBase';
import { ApiProductLabelBaseValidationScheme } from './validation';
import { LanguageForLabelModalResult } from './model';

@Component({
    selector: 'app-language-for-label-modal',
    templateUrl: './language-for-label-modal.component.html',
    styleUrls: ['./language-for-label-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class LanguageForLabelModalComponent implements OnInit {

  @Input()
  dismissible = true;

  @Input()
  title = null;

  form: UntypedFormGroup;
  submitted = false;

  codebookLanguageCodes = EnumSifrant.fromObject(this.languageCodes);

  constructor(
    public activeModal: NgbActiveModal,
  ) { }

  ngOnInit(): void {
    this.form = generateFormFromMetadata(ApiProductLabelBase.formMetadata(), {}, ApiProductLabelBaseValidationScheme);
  }

  cancel() {
    this.activeModal.close();
  }

  onConfirm() {

    this.submitted = true;
    if (this.form.valid) {

      const result: LanguageForLabelModalResult = {
        lang: this.form.get('language').value,
        title: this.form.get('title').value
      };

      this.activeModal.close(result);
    }
  }

  get languageCodes() {
    const obj = {};
    obj['EN'] = $localize`:@@languageForLabelModal.languageCodes.en:EN`;
    obj['DE'] = $localize`:@@languageForLabelModal.languageCodes.de:DE`;
    obj['ES'] = $localize`:@@languageForLabelModal.languageCodes.es:ES`;
    obj['RW'] = $localize`:@@languageForLabelModal.languageCodes.rw:RW`;
    return obj;
  }

}
