import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ActiveFacilityTypeService } from '../../../shared-services/active-facility-types.service';
import { ApiFacilityType } from '../../../../api/model/apiFacilityType';
import { UntypedFormControl, UntypedFormGroup, Validators } from "@angular/forms";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { CompanyValueChainsService } from "../../../shared-services/company-value-chains.service";
import { CompanyControllerService } from "../../../../api/api/companyController.service";
import { ActivatedRoute, Router } from "@angular/router";
import { ApiValueChain } from "../../../../api/model/apiValueChain";
import { ListNotEmptyValidator } from "../../../../shared/validation";
import { SemiProductsForValueChainsService } from "../../../shared-services/semi-products-for-value-chains.service";
import { CodebookTranslations } from "../../../shared-services/codebook-translations";
import { SemiProductControllerService } from "../../../../api/api/semiProductController.service";
import { ApiSemiProduct } from "../../../../api/model/apiSemiProduct";
import { FinalProductsForCompanyService } from "../../../shared-services/final-products-for-company.service";
import { FinalProductControllerService } from "../../../../api/api/finalProductController.service";
import { ApiFinalProduct } from "../../../../api/model/apiFinalProduct";
import { defaultEmptyObject, generateFormFromMetadata } from "../../../../shared/utils";
import { ApiFacility } from "../../../../api/model/apiFacility";
import { ApiFacilityValidationScheme } from "../company-detail-facility-add/validation";
import { ApiFacilityLocation } from "../../../../api/model/apiFacilityLocation";
import { ApiAddress } from "../../../../api/model/apiAddress";
import { ApiFacilityTranslation } from "../../../../api/model/apiFacilityTranslation";
import LanguageEnum = ApiFacilityTranslation.LanguageEnum;
import { FacilityControllerService } from "../../../../api/api/facilityController.service";
import { SelfOnboardingService } from "../../../shared-services/self-onboarding.service";

@Component({
    selector: 'app-company-detail-facility-add-wizard',
    templateUrl: './company-detail-facility-add-wizard.component.html',
    styleUrls: ['./company-detail-facility-add-wizard.component.scss', '../company-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CompanyDetailFacilityAddWizardComponent implements OnInit {

  protected readonly faTimes = faTimes;

  // Step 1
  facilityTypes: ApiFacilityType[] = [];
  selectedFacilityType: ApiFacilityType;

  // Step 2
  facilityNameControl = new UntypedFormControl(null, Validators.required);

  // Step 3
  collectionFacility = false;

  // Step 4
  mayInvolveCollectors = new UntypedFormControl(false);
  mayContainOrganic = new UntypedFormControl(false);
  mayContainWomenOnly = new UntypedFormControl(false);
  ableToDocumentTare = new UntypedFormControl(false);
  priceDeductionDamage = new UntypedFormControl(false);
  weightDeductionDamage = new UntypedFormControl(false);
  priceDeterminedLater = new UntypedFormControl(false);
  isPublic = new UntypedFormControl(false);

  // Step 5
  companyValueChainsCodebook: CompanyValueChainsService;
  valueChains: ApiValueChain[] = [];
  valueChainsForm = new UntypedFormControl(null);
  selectedCompanyValueChainsControl = new UntypedFormControl(null, [ListNotEmptyValidator()]);

  // Step 6
  semiProductsForValueChainsService: SemiProductsForValueChainsService;
  semiProducts: ApiSemiProduct[] = [];
  selectedSemiProducts: ApiSemiProduct[] = [];

  // Step 7
  finalProductsForCompanyService: FinalProductsForCompanyService;
  finalProducts: ApiFinalProduct[] = [];
  selectedFinalProducts: ApiFinalProduct[] = [];

  // Step 8
  facilityLocationParentForm = generateFormFromMetadata(ApiFacility.formMetadata(), this.emptyObject(), ApiFacilityValidationScheme);
  submittedFacilityLocationForm = false;

  currentStep = 1;

  @Input()
  companyId: string;

  constructor(
      private router: Router,
      private activeModal: NgbActiveModal,
      public activeFacilityTypeService: ActiveFacilityTypeService,
      private companyController: CompanyControllerService,
      private codebookTranslations: CodebookTranslations,
      private semiProductControllerService: SemiProductControllerService,
      private finalProductController: FinalProductControllerService,
      private facilityControllerService: FacilityControllerService,
      private selfOnboardingService: SelfOnboardingService
  ) { }

  ngOnInit(): void {

    this.activeFacilityTypeService.getAllCandidates().subscribe(value => {
      this.facilityTypes = value;
    });

    this.companyValueChainsCodebook = new CompanyValueChainsService(this.companyController, Number(this.companyId));

    this.finalProductsForCompanyService = new FinalProductsForCompanyService(this.finalProductController, Number(this.companyId));
    this.finalProductsForCompanyService.getAllCandidates().subscribe(value => {
      this.finalProducts = value;
    });
  }

  private emptyObject() {
    const object = defaultEmptyObject(ApiFacility.formMetadata()) as ApiFacility;
    object.facilityLocation = defaultEmptyObject(ApiFacilityLocation.formMetadata()) as ApiFacilityLocation;
    object.facilityLocation.address = defaultEmptyObject(ApiAddress.formMetadata()) as ApiAddress;
    return object;
  }

  setSelectedFacilityType(facilityType: ApiFacilityType) {
    this.selectedFacilityType = facilityType;
    this.currentStep++;
  }

  setSelectedFacilityName() {
    this.facilityNameControl.markAsDirty();
    if (this.facilityNameControl.valid) {
      this.currentStep++;
    }
  }

  setCollectionFacility(isCollectionFacility: boolean) {
    this.collectionFacility = isCollectionFacility;
    this.currentStep++
  }

  setFacilityConfiguration() {
    this.currentStep++;
  }

  setFacilityValueChain() {

    this.selectedCompanyValueChainsControl.markAsDirty();
    if (this.selectedCompanyValueChainsControl.valid) {

      // Initialize the semi-products codebook service
      const valueChainIds = (this.selectedCompanyValueChainsControl.value as ApiValueChain[]).map(valueChain => valueChain.id);
      this.semiProductsForValueChainsService = new SemiProductsForValueChainsService(this.semiProductControllerService, this.codebookTranslations, valueChainIds);
      this.semiProductsForValueChainsService.getAllCandidates().subscribe(semiProducts => {
        this.semiProducts = semiProducts;
      });

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

  setFacilitySemiProducts() {
    this.currentStep++;
  }

  selectSemiProduct(semiProduct: ApiSemiProduct) {

    const index = this.selectedSemiProducts.findIndex(sp => sp.id === semiProduct.id);
    if (index > -1) {
      this.selectedSemiProducts.splice(index, 1);
    } else {
      this.selectedSemiProducts.push(semiProduct);
    }
  }

  selectFinalProduct(finalProduct: ApiFinalProduct) {
    const index = this.selectedFinalProducts.findIndex(fp => fp.id === finalProduct.id);
    if (index > -1) {
      this.selectedFinalProducts.splice(index, 1);
    } else {
      this.selectedFinalProducts.push(finalProduct);
    }
  }

  setFacilityFinalProducts() {
    this.currentStep++;
  }

  setFacilityLocation() {

    this.submittedFacilityLocationForm = true;

    const facilityLocationForm = this.facilityLocationParentForm.get('facilityLocation') as UntypedFormGroup;
    if (facilityLocationForm.valid) {
      this.createNewFacility(facilityLocationForm.value);
    }
  }

  createNewFacility(facilityLocation: ApiFacilityLocation) {

    const facility: ApiFacility = {
      company: {
        id: Number(this.companyId)
      },
      facilityLocation: facilityLocation,
      translations: [
        { name: this.facilityNameControl.value, language: LanguageEnum.EN },
        { name: this.facilityNameControl.value, language: LanguageEnum.DE },
        { name: this.facilityNameControl.value, language: LanguageEnum.RW },
        { name: this.facilityNameControl.value, language: LanguageEnum.ES }
      ],
      facilityType: this.selectedFacilityType,
      facilityValueChains: this.selectedCompanyValueChainsControl.value,
      facilitySemiProductList: this.selectedSemiProducts,
      facilityFinalProducts: this.selectedFinalProducts,
      isCollectionFacility: this.collectionFacility,
      isPublic: this.isPublic.value,
      displayMayInvolveCollectors: this.mayInvolveCollectors.value,
      displayOrganic: this.mayContainOrganic.value,
      displayPriceDeductionDamage: this.priceDeductionDamage.value,
      displayWeightDeductionDamage: this.weightDeductionDamage.value,
      displayPriceDeterminedLater: this.priceDeterminedLater.value,
      displayTare: this.ableToDocumentTare.value,
      displayWomenOnly: this.mayContainWomenOnly.value
    }

    this.facilityControllerService.createOrUpdateFacility(facility).subscribe(() => {
      this.selfOnboardingService.setAddFacilityCurrentStep('success');
      this.activeModal.dismiss();
      this.router.navigate(['/home']).then();
    });
  }

}
