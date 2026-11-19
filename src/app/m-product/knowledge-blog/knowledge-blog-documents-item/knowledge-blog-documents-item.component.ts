import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { faStamp } from '@fortawesome/free-solid-svg-icons';
import { FileSaverService } from 'ngx-filesaver';
import { CommonControllerService } from 'src/api/api/commonController.service';
import { ApiDocument } from 'src/api/model/apiDocument';
import { ApiKnowledgeBlogPart } from 'src/api/model/apiKnowledgeBlogPart';
import { GenericEditableItemComponent } from 'src/app/shared/generic-editable-item/generic-editable-item.component';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { defaultEmptyObject, generateFormFromMetadata } from 'src/shared/utils';

@Component({
    selector: 'app-knowledge-blog-documents-item',
    templateUrl: './knowledge-blog-documents-item.component.html',
    styleUrls: ['./knowledge-blog-documents-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class KnowledgeBlogDocumentsItemComponent extends GenericEditableItemComponent<ApiKnowledgeBlogPart> {

  constructor(
    protected globalEventsManager: GlobalEventManagerService,
    protected router: Router,
    private fileSaverService: FileSaverService,
    private commonController: CommonControllerService
  ) {
    super(globalEventsManager);
  }

  @Input()
  disableDelete = false

  @Input()
  formTitle = null

  faStamp = faStamp;

  public generateForm(value: any): UntypedFormGroup {
    return generateFormFromMetadata(ApiDocument.formMetadata(), value)
  }

  static createEmptyObject(): ApiDocument {
    const obj = ApiDocument.formMetadata();
    return defaultEmptyObject(obj) as ApiDocument
  }

  static emptyObjectFormFactory(): () => UntypedFormControl {
    return () => {
      const f = new UntypedFormControl(KnowledgeBlogDocumentsItemComponent.createEmptyObject())
      return f
    }
  }


  onDownload() {
    const apiDoc = this.form.value as ApiDocument
    if (apiDoc && apiDoc.storageKey) {
      const sub = this.commonController.getDocument(apiDoc.storageKey).subscribe(res => {
        this.fileSaverService.save(res, apiDoc.name);
        sub.unsubscribe()
      })
    }
  }

}
