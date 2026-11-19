import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from "@angular/router";
import { ApiEnumWithLabelString, EnumSifrant } from "../../../../shared-services/enum-sifrant";
import { ApiProcessingAction } from "../../../../../api/model/apiProcessingAction";
import { take } from "rxjs/operators";
import { UntypedFormControl, Validators } from "@angular/forms";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { CompanyValueChainsService } from "../../../../shared-services/company-value-chains.service";
import { ApiValueChain } from "../../../../../api/model/apiValueChain";
import { ListNotEmptyValidator } from "../../../../../shared/validation";
import { SemiProductsForValueChainsService } from "../../../../shared-services/semi-products-for-value-chains.service";
import { CompanyControllerService } from "../../../../../api/api/companyController.service";
import { SemiProductControllerService } from "../../../../../api/api/semiProductController.service";
import { CodebookTranslations } from "../../../../shared-services/codebook-translations";
import { FinalProductsForCompanyService } from "../../../../shared-services/final-products-for-company.service";
import { FinalProductControllerService } from "../../../../../api/api/finalProductController.service";
import { ApiSemiProduct } from "../../../../../api/model/apiSemiProduct";
import { ApiFacility } from "../../../../../api/model/apiFacility";
import { CompanyFacilitiesService } from "../../../../shared-services/company-facilities.service";
import { FacilityControllerService } from "../../../../../api/api/facilityController.service";
import { ApiProcessingActionTranslation } from "../../../../../api/model/apiProcessingActionTranslation";
import LanguageEnum = ApiProcessingActionTranslation.LanguageEnum;
import TypeEnum = ApiProcessingAction.TypeEnum;
import { ProcessingActionControllerService } from "../../../../../api/api/processingActionController.service";
import { SelfOnboardingService } from "../../../../shared-services/self-onboarding.service";

@Component({
    selector: 'app-company-detail-processing-actions-add-wizard',
    templateUrl: './company-detail-processing-actions-add-wizard.component.html',
    styleUrls: ['./company-detail-processing-actions-add-wizard.component.scss', '../../company-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CompanyDetailProcessingActionsAddWizardComponent implements OnInit {

  protected readonly faTimes = faTimes;

  // Step 1
  processingActionTypesCodebookService = EnumSifrant.fromObject(this.processingActionType);
  processingActionTypes: ApiEnumWithLabelString[] = [];
  selectedProcActionType: ApiProcessingAction.TypeEnum;

  // Step 2
  procActionNameControl = new UntypedFormControl(null, Validators.required);

  // Step 3
  procActionLOTNameControl = new UntypedFormControl(null, Validators.required);

  // Step 4
  companyValueChainsCodebook: CompanyValueChainsService;
  valueChains: ApiValueChain[] = [];
  valueChainsForm = new UntypedFormControl(null);
  selectedCompanyValueChainsControl = new UntypedFormControl(null, [ListNotEmptyValidator()]);

  // Step 5
  selectedInputSemiProductControl = new UntypedFormControl(null, Validators.required);
  semiProductsForValueChainsService: SemiProductsForValueChainsService;

  // Step 6 - FINAL_PROCESSING case (one output final product)
  selectedOutputFinalProductControl = new UntypedFormControl(null, Validators.required);
  finalProductsForCompanyCodebook: FinalProductsForCompanyService;

  // Step 6 - PROCESSING case (multiple output semi-products)
  outputSemiProducts: ApiValueChain[] = [];
  outputSemiProductControl = new UntypedFormControl(null);
  selectedOutputSemiProductsControl = new UntypedFormControl(null, [ListNotEmptyValidator()]);

  // Step 7 - step only shown if selected proc. action type is GENERATE_QR_CODE
  qrCodeForFinalProductControl = new UntypedFormControl(null, Validators.required);

  // Step 8
  supportedFacilitiesService: CompanyFacilitiesService;
  facilities: ApiFacility[] = [];
  selectedProcActionFacilities: ApiFacility[] = [];

  currentStep = 1;

  @Input()
  companyId: string;

  constructor(
      private router: Router,
      private activeModal: NgbActiveModal,
      private companyController: CompanyControllerService,
      private semiProductControllerService: SemiProductControllerService,
      private codebookTranslations: CodebookTranslations,
      private finalProductController: FinalProductControllerService,
      private facilitiesController: FacilityControllerService,
      private processingActionControllerService: ProcessingActionControllerService,
      private selfOnboardingService: SelfOnboardingService
  ) { }

  ngOnInit(): void {

    this.processingActionTypesCodebookService.getAllCandidates().pipe(take(1)).subscribe(value => {
      this.processingActionTypes = value;
    });

    this.companyValueChainsCodebook = new CompanyValueChainsService(this.companyController, Number(this.companyId));

    this.finalProductsForCompanyCodebook = new FinalProductsForCompanyService(this.finalProductController, Number(this.companyId));

    this.supportedFacilitiesService = new CompanyFacilitiesService(this.facilitiesController, Number(this.companyId));
    this.supportedFacilitiesService.getAllCandidates().subscribe(value => {
      this.facilities = value;
    });
  }

  get processingActionType() {
    const obj = {};
    obj['PROCESSING'] = $localize`:@@companyDetailProcessingActions.singleChoice.type.processing:Processing`;
    obj['FINAL_PROCESSING'] = $localize`:@@companyDetailProcessingActions.singleChoice.type.finalProcessing:Final processing`;
    obj['TRANSFER'] = $localize`:@@companyDetailProcessingActions.singleChoice.type.transfer:Transfer`;
    obj['GENERATE_QR_CODE'] = $localize`:@@companyDetailProcessingActions.singleChoice.type.generateQrCode:Generate QR code`;
    return obj;
  }

  setSelectedProcActionType(procActionType: string) {
    this.selectedProcActionType = procActionType as ApiProcessingAction.TypeEnum;
    this.currentStep++;
  }

  setSelectedProcActionName() {
    this.procActionNameControl.markAsDirty();
    if (this.procActionNameControl.valid) {
      this.currentStep++;
    }
  }

  setSelectedProcActionLOTName() {
    this.procActionLOTNameControl.markAsDirty();
    if (this.procActionLOTNameControl.valid) {
      this.currentStep++;
    }
  }

  async addSelectedValueChain(valueChain: ApiValueChain) {

    if (!valueChain) {
      // no element is selected, only user input
      return;
    }

    if (this.valueChains.some(vch => vch?.id === valueChain?.id)) {
      // same element. do not add new, just refresh input form
      setTimeout(() => this.valueChainsForm.setValue(null));
      return;
    }

    this.valueChains.push(valueChain);
    setTimeout(() => {
      this.selectedCompanyValueChainsControl.setValue(this.valueChains);
      this.selectedCompanyValueChainsControl.markAsDirty();
      this.valueChainsForm.setValue(null);
    });
  }

  deleteValueChain(idx: number) {

    this.valueChains.splice(idx, 1);
    setTimeout(() => {
      this.selectedCompanyValueChainsControl.setValue(this.valueChains);
      this.selectedCompanyValueChainsControl.markAsDirty();
    });
  }

  setProcActionValueChains() {

    this.selectedCompanyValueChainsControl.markAsDirty();
    if (this.selectedCompanyValueChainsControl.valid) {

      const valueChainIds = (this.selectedCompanyValueChainsControl.value as ApiValueChain[]).map(valueChain => valueChain.id);
      this.semiProductsForValueChainsService =
          new SemiProductsForValueChainsService(this.semiProductControllerService, this.codebookTranslations, valueChainIds);

      this.currentStep++;
    }
  }

  setProcActionInputSemiProduct() {
    this.selectedInputSemiProductControl.markAsDirty();
    if (this.selectedInputSemiProductControl.valid) {

      switch (this.selectedProcActionType) {
        case ApiProcessingAction.TypeEnum.TRANSFER:
          this.currentStep = 8;
          break;
        case TypeEnum.GENERATEQRCODE:
          this.currentStep = 7;
          break;
        default:
          this.currentStep++;
      }
    }
  }

  addSelectedOutputSemiProduct(semiProduct: ApiSemiProduct) {

    if (!semiProduct) {
      // no element is selected, only user input
      return;
    }

    if (this.outputSemiProducts.some(osp => osp?.id === semiProduct?.id)) {
      // same element. do not add new, just refresh input form
      setTimeout(() => this.outputSemiProductControl.setValue(null));
      return;
    }

    this.outputSemiProducts.push(semiProduct);
    setTimeout(() => {
      this.selectedOutputSemiProductsControl.setValue(this.outputSemiProducts);
      this.selectedOutputSemiProductsControl.markAsDirty();
      this.outputSemiProductControl.setValue(null);
    });
  }


  deleteOutputSemiProduct(idx: number) {

    this.outputSemiProducts.splice(idx, 1);
    setTimeout(() => {
      this.selectedOutputSemiProductsControl.setValue(this.outputSemiProducts);
      this.selectedOutputSemiProductsControl.markAsDirty();
    });
  }

  setProcActionOutputSemiProducts() {
    this.selectedOutputSemiProductsControl.markAsDirty();
    if (this.selectedOutputSemiProductsControl.valid) {
      this.currentStep = 8;
    }
  }

  setProcActionOutputFinalProduct() {
    this.selectedOutputFinalProductControl.markAsDirty();
    if (this.selectedOutputFinalProductControl.valid) {
      this.currentStep = 8;
    }
  }

  setProcActionFinalProdQRCode() {
    this.qrCodeForFinalProductControl.markAsDirty();
    if (this.qrCodeForFinalProductControl.valid) {
      this.currentStep++;
    }
  }

  selectProcActionFacility(facility: ApiFacility) {

    const index = this.selectedProcActionFacilities.findIndex(f => f.id === facility.id);
    if (index > -1) {
      this.selectedProcActionFacilities.splice(index, 1);
    } else {
      this.selectedProcActionFacilities.push(facility);
    }
  }

  setProcActionFacilities() {
    this.createNewProcessingAction();
  }

  createNewProcessingAction() {

    const processingAction: ApiProcessingAction = {
      company: {
        id: Number(this.companyId)
      },
      type: this.selectedProcActionType,
      translations: [
        { name: this.procActionNameControl.value, description: "", language: LanguageEnum.EN },
        { name: this.procActionNameControl.value, description: "", language: LanguageEnum.DE },
        { name: this.procActionNameControl.value, description: "", language: LanguageEnum.RW },
        { name: this.procActionNameControl.value, description: "", language: LanguageEnum.ES },
      ],
      prefix: this.procActionLOTNameControl.value,
      valueChains: this.selectedCompanyValueChainsControl.value,
      inputSemiProduct: this.selectedInputSemiProductControl.value,
      supportedFacilities: this.selectedProcActionFacilities
    }

    switch (this.selectedProcActionType) {
      case TypeEnum.PROCESSING:
        processingAction.outputSemiProducts = this.selectedOutputSemiProductsControl.value;
        break;
      case TypeEnum.FINALPROCESSING:
        processingAction.outputFinalProduct = this.selectedOutputFinalProductControl.value;
        break;
      case TypeEnum.GENERATEQRCODE:
        processingAction.outputSemiProducts = [this.selectedInputSemiProductControl.value];
        processingAction.qrCodeForFinalProduct = this.qrCodeForFinalProductControl.value;
        break;
      default:
        processingAction.outputSemiProducts = [this.selectedInputSemiProductControl.value];
    }

    this.processingActionControllerService.createOrUpdateProcessingAction(processingAction).subscribe(() => {
      this.selfOnboardingService.setAddProcessingActionCurrentStep('success');
      this.activeModal.dismiss();
      this.router.navigate(['/home']).then();
    });
  }

}
