import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { GenericEditableItemComponent } from '../../../shared/generic-editable-item/generic-editable-item.component';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { generateFormFromMetadata } from '../../../../shared/utils';
import { ApiFacilityType } from '../../../../api/model/apiFacilityType';
import {
  ApiFacilityTypeValidationScheme
} from '../../../settings/type-detail-modal/validation';
import { ActiveFacilityTypeService } from '../../../shared-services/active-facility-types.service';
import { ApiMeasureUnitType } from '../../../../api/model/apiMeasureUnitType';
import { ActiveMeasureUnitTypeService } from '../../../shared-services/active-measure-unit-types.service';
import { ApiSemiProductValidationScheme, ApiVCMeasureUnitTypeValidationScheme, ApiVCProcessingEvidenceFieldValidationScheme,
  ApiVCProcessingEvidenceTypeValidationScheme, } from '../validation';
import { ApiProcessingEvidenceType } from '../../../../api/model/apiProcessingEvidenceType';
import { ProcessingEvidenceTypeService } from '../../../shared-services/processing-evidence-types.service';
import { ProcessingEvidenceTypeControllerService } from '../../../../api/api/processingEvidenceTypeController.service';
import { CodebookTranslations } from '../../../shared-services/codebook-translations';
import { ApiSemiProduct } from '../../../../api/model/apiSemiProduct';
import { ActiveSemiProductsService } from '../../../shared-services/active-semi-products.service';
import { ListEditorManager } from '../../../shared/list-editor/list-editor-manager';
import { ProcessingEvidenceFieldControllerService } from '../../../../api/api/processingEvidenceFieldController.service';
import { ProcessingEvidenceFieldsService } from '../../../shared-services/processing-evidence-fields.service';
import { ApiProcessingEvidenceField } from '../../../../api/model/apiProcessingEvidenceField';

@Component({
    selector: 'app-value-chain-config-item',
    templateUrl: './value-chain-config-item.component.html',
    styleUrls: ['./value-chain-config-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ValueChainConfigItemComponent extends GenericEditableItemComponent<any> implements OnInit {

  @Input()
  configItemType: string;

  @Input()
  readOnly = false;

  configItemForm = new UntypedFormControl(null, Validators.required);

  procEvidenceTypesCodebook: ProcessingEvidenceTypeService;
  procEvidenceFieldsCodebook: ProcessingEvidenceFieldsService;

  private selectedExistingValue = false;

  constructor(
    private codebookTranslations: CodebookTranslations,
    private procEvidenceTypeController: ProcessingEvidenceTypeControllerService,
    private procEvidenceFieldController: ProcessingEvidenceFieldControllerService,
    protected globalEventsManager: GlobalEventManagerService,
    public facilityTypesCodebook: ActiveFacilityTypeService,
    public measureUnitTypesCodebook: ActiveMeasureUnitTypeService,
    public semiProductsCodebook: ActiveSemiProductsService
  ) {
    super(globalEventsManager);
  }

  ngOnInit(): void {
    this.procEvidenceTypesCodebook = new ProcessingEvidenceTypeService(this.procEvidenceTypeController, this.codebookTranslations, null);
    this.procEvidenceFieldsCodebook = new ProcessingEvidenceFieldsService(this.procEvidenceFieldController, this.codebookTranslations);
  }

  public generateForm(value: any): UntypedFormGroup {

    if (this.configItemType === 'facility-types') {
      return generateFormFromMetadata(ApiFacilityType.formMetadata(), value, ApiFacilityTypeValidationScheme);
    }

    if (this.configItemType === 'measure-unit-types') {
      return generateFormFromMetadata(ApiMeasureUnitType.formMetadata(), value, ApiVCMeasureUnitTypeValidationScheme);
    }

    if (this.configItemType === 'processing-evidence-types') {
      return generateFormFromMetadata(ApiProcessingEvidenceType.formMetadata(), value, ApiVCProcessingEvidenceTypeValidationScheme);
    }

    if (this.configItemType === 'processing-evidence-fields') {
      return generateFormFromMetadata(ApiProcessingEvidenceField.formMetadata(), value, ApiVCProcessingEvidenceFieldValidationScheme);
    }

    if (this.configItemType === 'semi-products') {
      return generateFormFromMetadata(ApiSemiProduct.formMetadata(), value, ApiSemiProductValidationScheme);
    }
  }

  setSelectedValue($event) {
    if ($event) {

      this.selectedExistingValue = this.existingValue($event);
      if (this.selectedExistingValue) {
        this.form.reset();
        return;
      }

      if (this.configItemType === 'facility-types') {
        this.form.setValue({...$event});
      }

      if (this.configItemType === 'measure-unit-types') {
        this.form.setValue({...$event, underlyingMeasurementUnitType: null, weight: null});
      }

      if (this.configItemType === 'processing-evidence-types') {
        this.form.setValue({ ...$event,
          fairness: null,
          provenance: null,
          quality: null,
          mandatory: null,
          requiredOnQuote: null,
          requiredOneOfGroupIdForQuote: null,
          translations: [] } as ApiProcessingEvidenceType);
      }

      if (this.configItemType === 'processing-evidence-fields') {
        this.form.setValue({ ...$event,
          mandatory: null,
          requiredOnQuote: null,
          translations: [] } as ApiProcessingEvidenceField);
      }

      if (this.configItemType === 'semi-products') {
        this.form.setValue({
          ...$event,
          skuendCustomer: null,
          sku: null,
          buyable: null,
          translations: []
        } as ApiSemiProduct);
      }

      this.form.markAsDirty();
    }
  }

  save() {

    if (!this.selectedExistingValue) {
      super.save();
    } else {
      super.cancel().then();
    }
  }

  private existingValue(selectedValue: any): boolean {

    const listEditorManager: ListEditorManager<any> = this.listEditorManager;
    let existing = false;

    const formControls: UntypedFormControl[] = listEditorManager.formArray?.controls as UntypedFormControl[];
    if (formControls) {
      for (const formControl of formControls) {
        existing = selectedValue.id === formControl.value.id;
        if (existing) {
          break;
        }
      }
    }

    return existing;
  }

}
