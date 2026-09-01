import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { generateFormFromMetadata, defaultEmptyObject } from 'src/shared/utils';
import { take } from 'rxjs/operators';
import {
  ApiFacilityTypeValidationScheme,
  ApiMeasureUnitTypeValidationScheme,
  ApiProcessingEvidenceTypeValidationScheme,
  ApiSemiProductValidationScheme,
  ApiProcessingEvidenceFieldValidationScheme, ApiProductTypeValidationScheme
} from './validation';
import _ from 'lodash-es';
import { EnumSifrant } from '../../shared-services/enum-sifrant';
import { ActiveMeasureUnitTypeService } from '../../shared-services/active-measure-unit-types.service';
import { FacilityTypeControllerService } from '../../../api/api/facilityTypeController.service';
import { MeasureUnitTypeControllerService } from '../../../api/api/measureUnitTypeController.service';
import { ProcessingEvidenceTypeControllerService } from '../../../api/api/processingEvidenceTypeController.service';
import { ApiFacilityType } from '../../../api/model/apiFacilityType';
import { ApiMeasureUnitType } from '../../../api/model/apiMeasureUnitType';
import { ApiProcessingEvidenceType } from '../../../api/model/apiProcessingEvidenceType';
import { SemiProductControllerService } from '../../../api/api/semiProductController.service';
import { ApiSemiProduct } from '../../../api/model/apiSemiProduct';
import { ProcessingEvidenceFieldControllerService } from '../../../api/api/processingEvidenceFieldController.service';
import { ApiProcessingEvidenceField } from '../../../api/model/apiProcessingEvidenceField';
import { ApiSemiProductTranslation } from '../../../api/model/apiSemiProductTranslation';
import LanguageEnum = ApiSemiProductTranslation.LanguageEnum;
import { ProductTypeControllerService } from '../../../api/api/productTypeController.service';
import { ApiProductType } from '../../../api/model/apiProductType';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-type-detail-modal',
  templateUrl: './type-detail-modal.component.html',
  styleUrls: ['./type-detail-modal.component.scss']
})
export class TypeDetailModalComponent implements OnInit {

  @Input()
  title: string = null;

  @Input()
  type: string = null;

  @Input()
  update = false;

  @Input()
  typeElement = null;

  @Input()
  public saveCallback: () => string;

  form: FormGroup;
  submitted = false;

  codebookProcessingEvidenceTypeType = EnumSifrant.fromObject(this.processingEvidenceTypeType);
  codebookProcessingEvidenceFieldType = EnumSifrant.fromObject(this.processingEvidenceFieldType);

  languages = [LanguageEnum.EN, LanguageEnum.DE, LanguageEnum.RW, LanguageEnum.FR, LanguageEnum.ES];
  selectedLanguage = LanguageEnum.EN;

  isRegionalAdmin = false;

  constructor(
    public activeModal: NgbActiveModal,
    private facilityTypeService: FacilityTypeControllerService,
    private measureUnitTypeService: MeasureUnitTypeControllerService,
    private processingEvidenceTypeService: ProcessingEvidenceTypeControllerService,
    private processingEvidenceFieldService: ProcessingEvidenceFieldControllerService,
    private semiProductService: SemiProductControllerService,
    private productTypeService: ProductTypeControllerService,
    public activeMeasureUnitTypeService: ActiveMeasureUnitTypeService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.authService.userProfile$.pipe(take(1)).subscribe(up => {
      this.isRegionalAdmin = up?.role === 'REGIONAL_ADMIN';
      this.init().then();
    });
  }

  dismiss() {
    this.activeModal.dismiss();
  }

  async init() {
    if (this.type === 'facility-types') {
      if (!this.update) {
        this.form = generateFormFromMetadata(ApiFacilityType.formMetadata(),
          defaultEmptyObject(ApiFacilityType.formMetadata()) as ApiFacilityType, ApiFacilityTypeValidationScheme);
      } else {
        this.form = generateFormFromMetadata(ApiFacilityType.formMetadata(), this.typeElement, ApiFacilityTypeValidationScheme);
      }
    }

    if (this.type === 'measurement-unit-types') {
      if (!this.update) {
        this.form = generateFormFromMetadata(ApiMeasureUnitType.formMetadata(),
          defaultEmptyObject(ApiMeasureUnitType.formMetadata()) as ApiMeasureUnitType, ApiMeasureUnitTypeValidationScheme);
      } else {
        this.form = generateFormFromMetadata(ApiMeasureUnitType.formMetadata(), this.typeElement, ApiMeasureUnitTypeValidationScheme);
      }
    }

    if (this.type === 'processing-evidence-types') {
      if (!this.update) {
        this.form = generateFormFromMetadata(
          ApiProcessingEvidenceType.formMetadata(),
          defaultEmptyObject(ApiProcessingEvidenceType.formMetadata()) as ApiProcessingEvidenceType,
          ApiProcessingEvidenceTypeValidationScheme);
      } else {
        this.form = generateFormFromMetadata(
          ApiProcessingEvidenceType.formMetadata(), this.typeElement, ApiProcessingEvidenceTypeValidationScheme);
      }
      this.updateProcessingEvidenceTypeTranslations();
    }

    if (this.type === 'processing-evidence-fields') {
      if (!this.update) {
        this.form = generateFormFromMetadata(
            ApiProcessingEvidenceField.formMetadata(),
            defaultEmptyObject(ApiProcessingEvidenceField.formMetadata()) as ApiProcessingEvidenceField,
            ApiProcessingEvidenceFieldValidationScheme);
      } else {
        this.form = generateFormFromMetadata(
            ApiProcessingEvidenceField.formMetadata(), this.typeElement, ApiProcessingEvidenceFieldValidationScheme);
      }
      this.updateProcessingEvidenceFieldTranslations();
    }

    if (this.type === 'semi-products') {
      if (!this.update) {
        this.form = generateFormFromMetadata(ApiSemiProduct.formMetadata(),
          defaultEmptyObject(ApiSemiProduct.formMetadata()) as ApiSemiProduct, ApiSemiProductValidationScheme);
      } else {
        this.form = generateFormFromMetadata(ApiSemiProduct.formMetadata(), this.typeElement, ApiSemiProductValidationScheme);
      }
      this.finalizeForm();
    }

    if (this.type === 'product-types') {
      if (!this.update) {
        this.form = generateFormFromMetadata(ApiProductType.formMetadata(),
          defaultEmptyObject(ApiProductType.formMetadata()) as ApiProductType, ApiProductTypeValidationScheme);
      } else {
        this.form = generateFormFromMetadata(ApiProductType.formMetadata(), this.typeElement, ApiProductTypeValidationScheme);
      }
      this.finalizeForm();
    }

    // If in edit mode and logged in as a Regional admin, disable the form (Regional admin cannot edit, only create)
    if (this.update && this.isRegionalAdmin) {
      this.form.disable();
    }
  }

  async save() {
    if (this.type === 'processing-evidence-types' || this.type === 'processing-evidence-fields') {
      this.form.get('label').setValue(this.form.get('translations.0.label').value);
    }
    this.submitted = true;
    if (this.form.invalid) { return; }
    if (this.type === 'measurement-unit-types' && (!this.form.value.weight || this.form.value.weight.toString().trim() === '')) {
      this.form.get('weight').setValue(null);
    }
    const data = _.cloneDeep(this.form.value);
    Object.keys(data).forEach((key) => (data[key] == null) && delete data[key]);

    let res = null;

    if (this.type === 'facility-types') {
      res = await this.facilityTypeService.createOrUpdateFacilityType(data).pipe(take(1)).toPromise();
    }

    if (this.type === 'measurement-unit-types') {
      res = await this.measureUnitTypeService.createOrUpdateMeasurementUnitType(data).pipe(take(1)).toPromise();
    }

    if (this.type === 'processing-evidence-types') {
      res = await this.processingEvidenceTypeService.createOrUpdateProcessingEvidenceType(data).pipe(take(1)).toPromise();
    }

    if (this.type === 'processing-evidence-fields') {
      res = await this.processingEvidenceFieldService.createOrUpdateProcessingEvidenceField(data).pipe(take(1)).toPromise();
    }

    if (this.type === 'semi-products') {
      res = await this.semiProductService.createOrUpdateSemiProduct(data).pipe(take(1)).toPromise();
    }

    if (this.type === 'product-types') {
      if (data.id) {
        res = await this.productTypeService.updateProductType(data).pipe(take(1)).toPromise();
      } else {
        res = await this.productTypeService.createProductType(data).pipe(take(1)).toPromise();
      }
    }

    if (res && res.status === 'OK') {
      if (this.saveCallback) { this.saveCallback(); }
      this.dismiss();
    }
  }

  get processingEvidenceTypeType() {
    const obj = {};
    obj['DOCUMENT'] = $localize`:@@processingEvidenceTypeType.document:Document`;
    obj['FIELD'] = $localize`:@@processingEvidenceTypeType.field:Field`;
    obj['CALCULATED'] = $localize`:@@processingEvidenceTypeType.calculated:Calculated`;
    return obj;
  }

  get processingEvidenceFieldType() {
    const obj = {};
    obj['STRING'] = $localize`:@@processingEvidenceFieldType.string:String`;
    obj['TEXT'] = $localize`:@@processingEvidenceFieldType.text:Text`;
    obj['NUMBER'] = $localize`:@@processingEvidenceFieldType.number:Number`;
    obj['INTEGER'] = $localize`:@@processingEvidenceFieldType.integer:Integer`;
    obj['DATE'] = $localize`:@@processingEvidenceFieldType.date:Date`;
    obj['OBJECT'] = $localize`:@@processingEvidenceFieldType.object:Object`;
    obj['PRICE'] = $localize`:@@processingEvidenceFieldType.price:Price`;
    obj['EXCHANGE_RATE'] = $localize`:@@processingEvidenceFieldType.exchange_rate:Exchange rate`;
    obj['TIMESTAMP'] = $localize`:@@processingEvidenceFieldType.timestamp:Timestamp`;
    return obj;
  }

  selectLanguage(lang: LanguageEnum) {
    this.selectedLanguage = lang;
  }

  finalizeForm() {
    if (!this.form.contains('translations')) {
      this.form.addControl('translations', new FormArray([]));
    }

    const translations = this.form.get('translations').value;
    this.form.removeControl('translations');
    this.form.addControl('translations', new FormArray([]));

    for (const lang of this.languages) {
      const translation = translations.find(t => t.language === lang);
      (this.form.get('translations') as FormArray).push(new FormGroup({
        name: new FormControl(translation ? translation.name : ''),
        description: new FormControl(translation ? translation.description : ''),
        language: new FormControl(lang)
      }));
    }
  }

  get languageEnum() {
    return LanguageEnum;
  }

  updateProcessingEvidenceFieldTranslations() {
    if (!this.form.contains('translations')) {
      this.form.addControl('translations', new FormArray([]));
    }

    const translations = this.form.get('translations').value;
    this.form.removeControl('translations');
    this.form.addControl('translations', new FormArray([]));

    for (const lang of this.languages) {
      const translation = translations.find(t => t.language === lang);
      (this.form.get('translations') as FormArray).push(new FormGroup({
        label: new FormControl(translation ? translation.label : ''),
        language: new FormControl(lang)
      }));
    }
  }

  updateProcessingEvidenceTypeTranslations() {
    if (!this.form.contains('translations')) {
      this.form.addControl('translations', new FormArray([]));
    }

    const translations = this.form.get('translations').value;
    this.form.removeControl('translations');
    this.form.addControl('translations', new FormArray([]));

    for (const lang of this.languages) {
      const translation = translations.find(t => t.language === lang);
      (this.form.get('translations') as FormArray).push(new FormGroup({
        label: new FormControl(translation ? translation.label : ''),
        language: new FormControl(lang)
      }));
    }
  }

}
