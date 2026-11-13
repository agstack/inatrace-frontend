import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { faStamp } from '@fortawesome/free-solid-svg-icons';
import { FileSaverService } from 'ngx-filesaver';
import { CommonControllerService } from 'src/api/api/commonController.service';
import { ApiDocument } from 'src/api/model/apiDocument';
import { ApiProcessDocument } from 'src/api/model/apiProcessDocument';
import { GenericEditableItemComponent } from 'src/app/shared/generic-editable-item/generic-editable-item.component';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { defaultEmptyObject, generateFormFromMetadata } from 'src/shared/utils';
import { ApiProcessDocumentValidationScheme } from '../validation';


@Component({
    selector: 'app-production-record-item',
    templateUrl: './production-record-item.component.html',
    styleUrls: ['./production-record-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ProductionRecordItemComponent extends GenericEditableItemComponent<ApiProcessDocument> {

    constructor(
        protected globalEventsManager: GlobalEventManagerService,
        protected router: Router,
        private fileSaverService: FileSaverService,
        private commonController: CommonControllerService

    ) {
        super(globalEventsManager);
    }
    
    @Input()
    disableEdit = false;

    @Input()
    disableDelete = false;

    @Input()
    title = null;

    @Input()
    viewOnly = false;

    faStamp = faStamp;

    static createEmptyObject(): ApiProcessDocument {
        const market = ApiProcessDocument.formMetadata();
        return defaultEmptyObject(market) as ApiProcessDocument;
    }

    static emptyObjectFormFactory(): () => UntypedFormControl {
        return () => {
            const f = new UntypedFormControl(ProductionRecordItemComponent.createEmptyObject(), ApiProcessDocumentValidationScheme.validators);
            return f;
        };
    }

    public generateForm(value: any): UntypedFormGroup {
        return generateFormFromMetadata(ApiProcessDocument.formMetadata(), value, ApiProcessDocumentValidationScheme);
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
