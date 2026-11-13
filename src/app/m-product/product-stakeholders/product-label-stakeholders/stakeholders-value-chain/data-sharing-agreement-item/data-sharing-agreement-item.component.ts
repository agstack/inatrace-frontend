import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { GenericEditableItemComponent } from '../../../../../shared/generic-editable-item/generic-editable-item.component';
import { GlobalEventManagerService } from '../../../../../core/global-event-manager.service';
import { ApiProductDataSharingAgreement } from '../../../../../../api/model/apiProductDataSharingAgreement';
import { UntypedFormGroup } from '@angular/forms';
import { generateFormFromMetadata } from '../../../../../../shared/utils';
import { ApiProductDataSharingAgreementValidationScheme } from '../validation';

@Component({
    selector: 'app-data-sharing-agreement-item',
    templateUrl: './data-sharing-agreement-item.component.html',
    styleUrls: ['./data-sharing-agreement-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class DataSharingAgreementItemComponent extends GenericEditableItemComponent<ApiProductDataSharingAgreement> implements OnInit {

  @Input()
  disableDelete = false;

  @Input()
  readOnly = false;

  constructor(
    protected globalEventsManager: GlobalEventManagerService,
  ) {
    super(globalEventsManager);
  }

  ngOnInit(): void {
  }

  public generateForm(value: any): UntypedFormGroup {
    return generateFormFromMetadata(ApiProductDataSharingAgreement.formMetadata(), value, ApiProductDataSharingAgreementValidationScheme);
  }

}
