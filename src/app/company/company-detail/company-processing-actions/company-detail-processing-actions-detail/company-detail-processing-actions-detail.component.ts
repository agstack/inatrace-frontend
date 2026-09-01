import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyDetailTabManagerComponent } from '../../company-detail-tab-manager/company-detail-tab-manager.component';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { EnumSifrant } from '../../../../shared-services/enum-sifrant';
import { ProcessingEvidenceTypeService } from '../../../../shared-services/processing-evidence-types.service';
import { ProcessingEvidenceTypeControllerService } from '../../../../../api/api/processingEvidenceTypeController.service';
import { ProcessingEvidenceFieldsService } from '../../../../shared-services/processing-evidence-fields.service';
import {
  ProcessingEvidenceFieldControllerService
} from '../../../../../api/api/processingEvidenceFieldController.service';
import { ProcessingActionControllerService } from '../../../../../api/api/processingActionController.service';
import { CodebookTranslations } from '../../../../shared-services/codebook-translations';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ApiProcessingAction } from '../../../../../api/model/apiProcessingAction';
import { take } from 'rxjs/operators';
import { defaultEmptyObject, generateFormFromMetadata } from '../../../../../shared/utils';
import { ApiProcessingActionValidationScheme } from './validation';
import { ApiSemiProduct } from '../../../../../api/model/apiSemiProduct';
import { ApiProcessingEvidenceType } from '../../../../../api/model/apiProcessingEvidenceType';
import { SemiProductControllerService } from '../../../../../api/api/semiProductController.service';
import { ApiProcessingEvidenceField } from '../../../../../api/model/apiProcessingEvidenceField';
import { AuthService } from '../../../../core/auth.service';
import { FinalProductsForCompanyService } from '../../../../shared-services/final-products-for-company.service';
import { FinalProductControllerService } from '../../../../../api/api/finalProductController.service';
import { Subscription } from 'rxjs';
import { ApiValueChain } from '../../../../../api/model/apiValueChain';
import { CompanyFacilitiesService } from '../../../../shared-services/company-facilities.service';
import { ApiFacility } from '../../../../../api/model/apiFacility';
import { FacilityControllerService } from '../../../../../api/api/facilityController.service';
import { SemiProductsForValueChainsService } from '../../../../shared-services/semi-products-for-value-chains.service';
import { ListNotEmptyValidator } from '../../../../../shared/validation';
import { ApiMeasureUnitType } from '../../../../../api/model/apiMeasureUnitType';
import { CompanyControllerService } from '../../../../../api/api/companyController.service';
import { CompanyValueChainsService } from '../../../../shared-services/company-value-chains.service';
import { ApiFinalProduct } from '../../../../../api/model/apiFinalProduct';
import { ApiProcessingActionOutputSemiProduct } from '../../../../../api/model/apiProcessingActionOutputSemiProduct';

@Component({
  selector: 'app-company-detail-processing-actions',
  templateUrl: './company-detail-processing-actions-detail.component.html',
  styleUrls: ['./company-detail-processing-actions-detail.component.scss']
})
export class CompanyDetailProcessingActionsDetailComponent extends CompanyDetailTabManagerComponent implements OnInit, OnDestroy {

  rootTab = 3;
  prepared = false;
  submitted = false;

  title: string;
  editMode: boolean;
  companyId: number;
  form: FormGroup;
  action: ApiProcessingAction;

  codebookProcessingTransaction = EnumSifrant.fromObject(this.processingActionType);

  outputSemiProductInputForm: FormControl;
  semiProductsForValueChainsService: SemiProductsForValueChainsService;

  processingEvidenceTypeService: ProcessingEvidenceTypeService;
  processingEvidenceFieldService: ProcessingEvidenceFieldsService;
  evidenceDocInputForm: FormControl;
  evidenceFieldInputForm: FormControl;

  supportedFacilitiesInputForm: FormControl;
  supportedFacilitiesService: CompanyFacilitiesService;

  finalProductsForCompanyCodebook: FinalProductsForCompanyService;

  companyValueChainsCodebook: CompanyValueChainsService;
  valueChainsForm = new FormControl(null);
  valueChains: Array<ApiValueChain> = [];
  selectedCompanyValueChainsControl = new FormControl(null, [ListNotEmptyValidator()]);

  languages = ['EN', 'DE', 'RW', 'FR', 'ES'];
  selectedLanguage = 'EN';
  faTimes = faTimes;

  booleanTrue = {
    id: true,
    value: true,
  };

  booleanFalse = {
    id: false,
    value: false,
  };

  private valueChainSubs: Subscription;

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected globalEventsManager: GlobalEventManagerService,
      protected codebookTranslations: CodebookTranslations,
      private processingEvidenceTypeControllerService: ProcessingEvidenceTypeControllerService,
      private processingEvidenceFieldControllerService: ProcessingEvidenceFieldControllerService,
      private facilitiesController: FacilityControllerService,
      private processingActionControllerService: ProcessingActionControllerService,
      private semiProductControllerService: SemiProductControllerService,
      private finalProductController: FinalProductControllerService,
      protected companyController: CompanyControllerService,
      private cdr: ChangeDetectorRef,
      protected authService: AuthService
  ) {
    super(router, route, authService, companyController);
  }

  get processingActionType() {
    const obj = {};
    obj['SHIPMENT'] = $localize`:@@companyDetailProcessingActions.singleChoice.type.quote:Quote`;
    obj['PROCESSING'] = $localize`:@@companyDetailProcessingActions.singleChoice.type.processing:Processing`;
    obj['FINAL_PROCESSING'] = $localize`:@@companyDetailProcessingActions.singleChoice.type.finalProcessing:Final processing`;
    obj['TRANSFER'] = $localize`:@@companyDetailProcessingActions.singleChoice.type.transfer:Transfer`;
    obj['GENERATE_QR_CODE'] = $localize`:@@companyDetailProcessingActions.singleChoice.type.generateQrCode:Generate QR code`;
    return obj;
  }

  get maxOutputFinalProductQuantityLabel() {
    const outputMeasurementUnit: string = (this.outputFinalProductControl.value as ApiFinalProduct)?.measurementUnitType?.label ?? '';
    return $localize`:@@companyDetailProcessingActions.field.maxOutputWeight.label:Max output quantity in ${outputMeasurementUnit}`;
  }

  get estimatedOutputQuantityLabel() {
    const outputMeasureUnitLabel = this.inputMeasurementUnit?.label;
    return $localize`:@@companyDetailProcessingActions.textInput.estimatedOutputQuantity.label:Estimated output quantity per` +
      ` ${outputMeasureUnitLabel ? outputMeasureUnitLabel : '-'}`;
  }

  private get inputMeasurementUnit(): ApiMeasureUnitType {

    if (!this.inputSemiProductControl?.value) {
      return;
    }

    return (this.inputSemiProductControl.value as ApiSemiProduct).measurementUnitType;
  }

  public get outputSemiProductsArray(): FormArray {
    return this.form.get('outputSemiProducts') as FormArray;
  }

  private get outputFinalProductControl(): FormControl {
    return this.form.get('outputFinalProduct') as FormControl;
  }

  private get repackedOutputFinalProductsControl(): FormControl {
    return this.form.get('repackedOutputFinalProducts') as FormControl;
  }

  private get maxOutputFinalProductsWeightControl(): FormControl {
    return this.form.get('maxOutputWeight') as FormControl;
  }

  private get inputSemiProductControl(): FormControl {
    return this.form.get('inputSemiProduct') as FormControl;
  }

  ngOnInit(): void {

    super.ngOnInit();

    this.companyId = +this.route.snapshot.paramMap.get('id');

    this.globalEventsManager.showLoading(true);

    // Initialize codebook service for final products for the selected company
    this.finalProductsForCompanyCodebook = new FinalProductsForCompanyService(this.finalProductController, this.companyId);

    this.evidenceDocInputForm = new FormControl(null);
    this.evidenceFieldInputForm = new FormControl(null);
    this.supportedFacilitiesInputForm = new FormControl(null);
    this.outputSemiProductInputForm = new FormControl(null);

    this.initInitialData().then(
        () => {
          if (this.editMode) {
            this.editAction();
          } else {
            this.newAction();
          }
          this.finalizeForm();

          // Initialize codebook service for company facilities
          this.supportedFacilitiesService = new CompanyFacilitiesService(this.facilitiesController, this.companyId);

          this.companyValueChainsCodebook = new CompanyValueChainsService(this.companyController, this.companyId);

          this.valueChainSubs = this.form.get('valueChains').valueChanges.subscribe((valueChains: ApiValueChain[]) => {

            if (valueChains && valueChains.length > 0) {
              const valueChainIds = valueChains?.map(valueChain => valueChain.id);

              // Initialize codebook services for proc. evidence types and proc. evidence fields
              this.processingEvidenceTypeService =
                new ProcessingEvidenceTypeService(this.processingEvidenceTypeControllerService, this.codebookTranslations, 'DOCUMENT', valueChainIds);
              this.processingEvidenceFieldService =
                new ProcessingEvidenceFieldsService(this.processingEvidenceFieldControllerService, this.codebookTranslations, valueChainIds);
              this.semiProductsForValueChainsService =
                new SemiProductsForValueChainsService(this.semiProductControllerService, this.codebookTranslations, valueChainIds);

            } else {

              this.processingEvidenceTypeService = null;
              this.processingEvidenceFieldService = null;
              this.semiProductsForValueChainsService = null;
            }
          });
        }
    );
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    if (this.valueChainSubs) {
      this.valueChainSubs.unsubscribe();
    }
  }

  emptyObject() {

    const obj = defaultEmptyObject(ApiProcessingAction.formMetadata()) as ApiProcessingAction;
    obj.inputSemiProduct = defaultEmptyObject(ApiSemiProduct.formMetadata()) as ApiSemiProduct;

    obj.finalProductAction = false;
    return obj;
  }

  finalizeForm() {

    if (!this.form.contains('outputSemiProducts')) {
      this.form.addControl('outputSemiProducts', new FormArray([]));
    }

    if (!this.form.contains('requiredEvidenceFields')) {
      this.form.addControl('requiredEvidenceFields', new FormArray([]));
    }

    if (!this.form.contains('requiredDocumentTypes')) {
      this.form.addControl('requiredDocumentTypes', new FormArray([]));
    }

    if (!this.form.contains('supportedFacilities')) {
      this.form.addControl('supportedFacilities', new FormArray([]));
    }

    if (!this.form.contains('translations')) {
      this.form.addControl('translations', new FormArray([]));
    }

    // Create form controls
    const translations = this.form.get('translations').value;
    this.form.removeControl('translations');
    this.form.addControl('translations', new FormArray([]));
    for (const lang of this.languages) {
      const translation = translations.find(t => t.language === lang);
      (this.form.get('translations') as FormArray).push(new FormGroup({
        language: new FormControl(lang),
        name: new FormControl(translation ? translation.name : ''),
        description: new FormControl(translation ? translation.description : '')
      }));
    }

    this.prepared = true;
    this.globalEventsManager.showLoading(false);
  }

  newAction() {

    this.form = generateFormFromMetadata(ApiProcessingAction.formMetadata(), this.emptyObject(), ApiProcessingActionValidationScheme);
    this.form.setControl('valueChains', this.selectedCompanyValueChainsControl);
    this.inputSemiProductControl.setValue(null);
    this.maxOutputFinalProductsWeightControl.setValue(null);
    this.maxOutputFinalProductsWeightControl.disable();
  }

  editAction() {

    // Generate form group from the Processing action data
    this.form = generateFormFromMetadata(ApiProcessingAction.formMetadata(), this.action, ApiProcessingActionValidationScheme);

    // Set form control for the Value chains (we overwrite the existing one with separate form control where we are going to subscribe later)
    this.form.setControl('valueChains', this.selectedCompanyValueChainsControl);

    if (!this.repackedOutputFinalProductsControl.value) {
      this.maxOutputFinalProductsWeightControl.setValue(null);
      this.maxOutputFinalProductsWeightControl.disable();
    }

    // If the Processing action has output semi-products set, initialize the form array with form groups
    if (this.action.outputSemiProducts?.length > 0) {
      this.outputSemiProductsArray.clear();

      this.action.outputSemiProducts.forEach(apiPaOSM => {
        const apiPaOSMFormGroup = generateFormFromMetadata(ApiProcessingActionOutputSemiProduct.formMetadata(), apiPaOSM);
        apiPaOSMFormGroup.get('maxOutputWeight').setValidators(Validators.required);
        apiPaOSMFormGroup.get('maxOutputWeight').disable({ emitEvent: false });
        if (apiPaOSM.repackedOutput) {
          apiPaOSMFormGroup.get('maxOutputWeight').enable({ emitEvent: false });
        }

        // Add selected output semi-product to the array
        this.outputSemiProductsArray.push(apiPaOSMFormGroup);
      });

      this.outputSemiProductsArray.markAsPristine();
    }
  }

  async initInitialData() {
    const action = this.route.snapshot.data.action;

    if (action === 'new') {
      this.title = $localize`:@@companyDetailProcessingActions.title.new:New processing action`;
      this.editMode = false;

      const defaultValChainCheck = await this.companyController.getCompanyValueChains(this.companyId).pipe(take(1)).toPromise();
      if (defaultValChainCheck && defaultValChainCheck.status === 'OK') {
        if (defaultValChainCheck.data.count === 1) {
          this.valueChains = defaultValChainCheck.data.items;
          setTimeout(() => this.selectedCompanyValueChainsControl.setValue(this.valueChains));
        }
      }

    } else if (action === 'edit') {
      this.title = $localize`:@@companyDetailProcessingActions.title.edit:Edit processing action`;
      this.editMode = true;
      const paId = this.route.snapshot.params.paId;
      const resp = await this.processingActionControllerService
          .getProcessingActionDetail(paId)
          .pipe(take(1))
          .toPromise();

      if (resp && resp.status === 'OK') {
        this.action = resp.data;
        this.valueChains = this.action?.valueChains ? this.action?.valueChains : [];

        setTimeout(() => this.selectedCompanyValueChainsControl.setValue(this.valueChains));
      }

    } else {
      throw Error('Wrong action.');
    }
  }

  async addSelectedValueChain(valueChain: ApiValueChain) {
    if (!valueChain) {
      return;
    }
    if (this.valueChains.some(vch => vch?.id === valueChain?.id)) {
      setTimeout(() => this.valueChainsForm.setValue(null));
      return;
    }
    this.valueChains.push(valueChain);
    setTimeout(() => {
      this.selectedCompanyValueChainsControl.setValue(this.valueChains);
      this.form.markAsDirty();
      this.valueChainsForm.setValue(null);
    });
  }

  deleteValueChain(idx: number) {
    this.confirmValueChainRemove().then(confirmed => {
      if (confirmed) {
        this.valueChains.splice(idx, 1);
        setTimeout(() => this.selectedCompanyValueChainsControl.setValue(this.valueChains));
        this.form.markAsDirty();
        if (idx >= 0) {
          // also remove already selected fields and document types
          this.removeAllEvidenceFields();
          this.removeAllEvidenceDocs();
          this.removeAllSemiProducts();
        }
      }
    });
  }

  private async confirmValueChainRemove(): Promise<boolean> {

    const result = await this.globalEventsManager.openMessageModal({
      type: 'warning',
      message: $localize`:@@companyDetailProcessingActions.removeValueChain.confirm.message:Are you sure you want to remove the value chain? Proceeding will reset the selected semi-products, evidence fields and types.`,
      options: {
        centered: true
      }
    });

    return result === 'ok';
  }

  async addSelectedEvidenceDoc(doc: ApiProcessingEvidenceType) {
    if (!doc) { return; }
    const formArray = this.form.get('requiredDocumentTypes') as FormArray;

    // If selected element is already present in array, clear input field
    if (formArray.value.some(x => x.id === doc.id)) {
      setTimeout(() => this.evidenceDocInputForm.setValue(null));
      return;
    }

    // Add selected element to array
    formArray.push(new FormControl({
      ...doc,
      mandatory: false,
      requiredOnQuote: false,
      requiredOneOfGroupIdForQuote: null
    }));
    formArray.markAsDirty();

    // Clear input field
    setTimeout(() => this.evidenceDocInputForm.setValue(null));
  }

  private removeAllSemiProducts() {
    const formArray = this.outputSemiProductsArray;
    formArray.clear(); // delete  all elements
  }

  async removeEvidenceDoc(doc: ApiProcessingEvidenceType) {
    if (!doc) { return; }
    const formArray = this.form.get('requiredDocumentTypes') as FormArray;
    const index = (formArray.value as ApiProcessingEvidenceType[]).findIndex(x => x.id === doc.id);
    if (index >= 0) {
      formArray.removeAt(index);
      formArray.markAsDirty();
    }
  }

  private removeAllEvidenceDocs() {
    const formArray = this.form.get('requiredDocumentTypes') as FormArray;
    formArray.clear();
  }

  async addSelectedEvidenceField(field: ApiProcessingEvidenceField) {
    if (!field) { return; }
    const formArray = this.form.get('requiredEvidenceFields') as FormArray;

    // If selected element is already present in array, clear input field
    if (formArray.value.some(x => x.id === field.id)) {
      setTimeout(() => this.evidenceFieldInputForm.setValue(null));
      return;
    }

    // Add selected element to array
    formArray.push(new FormControl({
      ...field,
      mandatory: false,
      requiredOnQuote: false
    }));
    formArray.markAsDirty();

    // Clear input field
    setTimeout(() => this.evidenceFieldInputForm.setValue(null));
  }

  async removeEvidenceField(field: ApiProcessingEvidenceField) {
    if (!field) { return; }
    const formArray = this.form.get('requiredEvidenceFields') as FormArray;
    const index = (formArray.value as ApiProcessingEvidenceField[]).findIndex(x => x.id === field.id);
    if (index >= 0) {
      formArray.removeAt(index);
      formArray.markAsDirty();
    }
  }

  private removeAllEvidenceFields() {
    const formArray = this.form.get('requiredEvidenceFields') as FormArray;
    formArray.clear();
  }

  async addSelectedSupportedFacility(facility: ApiFacility) {

    if (!facility) { return; }
    const formArray = this.form.get('supportedFacilities') as FormArray;

    // If selected facility is already present in array, clear input field
    if (formArray.value.some(x => x.id === facility.id)) {
      setTimeout(() => this.supportedFacilitiesInputForm.setValue(null));
      return;
    }

    // Add selected element to array
    formArray.push(new FormControl({...facility}));
    formArray.markAsDirty();

    // Clear input field
    setTimeout(() => this.supportedFacilitiesInputForm.setValue(null));
  }

  async removeSupportedFacility(facility: ApiFacility) {

    if (!facility) { return; }
    const formArray = this.form.get('supportedFacilities') as FormArray;
    const index = (formArray.value as ApiFacility[]).findIndex(x => x.id === facility.id);
    if (index >= 0) {
      formArray.removeAt(index);
      formArray.markAsDirty();
    }
  }

  async addSelectedOutputSemiProduct(semiProduct: ApiSemiProduct) {

    if (!semiProduct) { return; }

    const formArray = this.outputSemiProductsArray;

    // If selected output semi-product is already present in the array, clear input field and end execution
    if (formArray.value.some(x => x.id === semiProduct.id)) {
      setTimeout(() => this.outputSemiProductInputForm.setValue(null));
      return;
    }

    const semiProductForm = generateFormFromMetadata(ApiProcessingActionOutputSemiProduct.formMetadata(), semiProduct);
    semiProductForm.get('maxOutputWeight').disable();
    semiProductForm.get('maxOutputWeight').setValidators(Validators.required);

    // Add selected output semi-product to the array
    formArray.push(semiProductForm);
    formArray.markAsDirty();

    // Clear input field
    setTimeout(() => this.outputSemiProductInputForm.setValue(null));
  }

  async removeOutputSemiProduct(index: number) {
    this.outputSemiProductsArray.removeAt(index);
    this.outputSemiProductsArray.markAsDirty();
  }

  repackOutputSemiProductChecked(index: number) {

    const repackChecked: boolean = this.outputSemiProductsArray.at(index).get('repackedOutput').value;

    const maxOutputWeightControl = this.outputSemiProductsArray.at(index).get('maxOutputWeight');

    if (repackChecked) {
      maxOutputWeightControl.enable();
    } else {
      maxOutputWeightControl.disable();
      maxOutputWeightControl.setValue(null);
    }
  }

  groupDecided(doc: ApiProcessingEvidenceType) {
    if (doc.requiredOneOfGroupIdForQuote) {
      doc.requiredOneOfGroupIdForQuote = null;
      return;
    }
    doc.requiredOnQuote = null;
    let group = 1;
    const lst: ApiProcessingEvidenceType[] = this.form.get('requiredDocumentTypes').value || [];
    const res = lst.map(x => x.requiredOneOfGroupIdForQuote)
        .filter(x => x && /^\+?(0|[1-9]\d*)$/.test(x))
        .map(x => Number(x));
    if (res.length === 0) {
      doc.requiredOneOfGroupIdForQuote = '' + group;
    } else {
      group = Math.max(...res) + 1;
      doc.requiredOneOfGroupIdForQuote = '' + group;
    }
    this.cdr.detectChanges();
  }

  cbSelectedSP(sp, i: number, mode: 'mandatory' | 'quote') {
    if (mode === 'mandatory') {
      sp.mandatory = !sp.mandatory;
    }
    if (mode === 'quote') {
      sp.requiredOnQuote = !sp.requiredOnQuote;
      if (sp.requiredOnQuote) {
        sp.requiredOneOfGroupIdForQuote = null;
      }
    }
  }

  changeRequiredOneOf(event: string, sp) {
    sp.requiredOneOfGroupIdForQuote = event;
  }

  selectLanguage(lang: string) {
    this.selectedLanguage = lang;
  }

  repackedOutputFinalProductsFormatter(x: any) {
    return x.value
        ? $localize`:@@companyDetailProcessingActions.singleChoice.repackedOutputFinalProducts.yes:Yes`
        : $localize`:@@companyDetailProcessingActions.singleChoice.repackedOutputFinalProducts.no:No`;
  }

  finalProductActionFormatter(x: any) {
    return x.value
      ? $localize`:@@companyDetailProcessingActions.singleChoice.finalProductAction.yes:Yes`
      : $localize`:@@companyDetailProcessingActions.singleChoice.finalProductAction.no:No`;
  }

  repackedOutputFinalProductsSet(x: any) {
    if (!x || !x.value) {
      this.maxOutputFinalProductsWeightControl.setValue(null);
      this.maxOutputFinalProductsWeightControl.disable();
    } else {
      this.maxOutputFinalProductsWeightControl.enable();
    }
  }

  async saveProcessingAction() {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    const data = this.form.value;
    if (!data.company || !data.company.id) {
      data.company = { id: this.companyId };
    }

    try {
      this.globalEventsManager.showLoading(true);
      const res = await this.processingActionControllerService
          .createOrUpdateProcessingAction(data)
          .pipe(take(1))
          .toPromise();

      if (res && res.status === 'OK') {
        this.goBack();
      }
    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  goBack() {
    this.router.navigate(['companies', this.companyId, 'processingActions']).then();
  }

  canDeactivate(): boolean {
    return true;
  }

}
