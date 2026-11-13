import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { faImage, faStamp, faUser } from '@fortawesome/free-solid-svg-icons';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';
import { FileSaverService } from 'ngx-filesaver';
import { CommonControllerService } from 'src/api/api/commonController.service';
import { ApiCompanyDocument } from 'src/api/model/apiCompanyDocument';
import { ApiDocument } from 'src/api/model/apiDocument';
import { ApiCompanyDocumentValidationScheme } from 'src/app/company/company-detail/validation';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { defaultEmptyObject, generateFormFromMetadata } from 'src/shared/utils';
import { GenericEditableItemComponent } from '../generic-editable-item/generic-editable-item.component';
import { environment } from 'src/environments/environment';

enum DocumentCategory {
  VIDEO = 'VIDEO',
  PRODUCTION_RECORD = 'PRODUCTION_RECORD',
  MEET_THE_FARMER = 'MEET_THE_FARMER'
}

@Component({
    selector: 'app-company-document-item',
    templateUrl: './company-document-item.component.html',
    styleUrls: ['./company-document-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CompanyDocumentItemComponent extends GenericEditableItemComponent<ApiCompanyDocument> implements OnInit {

  constructor(
      protected globalEventsManager: GlobalEventManagerService,
      protected router: Router,
      private fileSaverService: FileSaverService,
      private commonController: CommonControllerService

  ) {
      super(globalEventsManager);
  }

  rootImageUrl: string = environment.relativeImageUploadUrlAllSizes;

  documentCategory = DocumentCategory;

  @Input()
  disableDelete = false;

  @Input()
  formTitle = null;

  @Input()
  category = null;

  @Input()
  readOnly = false;

  faStamp = faStamp;
  faUser = faUser;
  faYoutube = faYoutube;
  faImage = faImage;

  static createEmptyObject(): ApiCompanyDocument {
    const document = ApiCompanyDocument.formMetadata();
    return defaultEmptyObject(document) as ApiCompanyDocument;
  }

  static emptyObjectFormFactory(): () => UntypedFormControl {
    return () => {
      return new UntypedFormControl(CompanyDocumentItemComponent.createEmptyObject(), ApiCompanyDocumentValidationScheme.validators);
    };
  }

  public generateForm(value: any): UntypedFormGroup {
      return generateFormFromMetadata(ApiCompanyDocument.formMetadata(), value, ApiCompanyDocumentValidationScheme);
  }

  ngOnInit() {
    if (this.category === 'MEET_THE_FARMER') {
      this.form.get('category').setValue('MEET_THE_FARMER');
      this.form.get('type').setValue('FILE');

      this.form.controls['document'].setValidators([Validators.required]);
      this.form.controls['document'].updateValueAndValidity();

      this.form.controls['name'].setValidators([Validators.required]);
      this.form.controls['name'].updateValueAndValidity();

      this.form.controls['quote'].setValidators([Validators.required]);
      this.form.controls['quote'].updateValueAndValidity();
    } else if (this.category === 'PRODUCTION_RECORD') {
      this.form.get('category').setValue('PRODUCTION_RECORD');
      this.form.get('type').setValue('FILE');

      this.form.controls['document'].setValidators([Validators.required]);
      this.form.controls['document'].updateValueAndValidity();

    } else if (this.category === 'VIDEO') {
      this.form.get('category').setValue('VIDEO');
      this.form.get('type').setValue('LINK');

      this.form.controls['link'].setValidators([Validators.required]);
      this.form.controls['link'].updateValueAndValidity();
    }
  }

  onDownload() {
    const apiDoc = this.form.get('document').value as ApiDocument;
    if (apiDoc && apiDoc.storageKey) {
      const sub = this.commonController.getDocument(apiDoc.storageKey).subscribe(res => {
        this.fileSaverService.save(res, apiDoc.name);
        sub.unsubscribe();
      });
    }
  }
}
