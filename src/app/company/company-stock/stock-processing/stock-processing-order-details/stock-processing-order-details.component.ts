import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { CompanyProcessingActionsService } from '../../../../shared-services/company-processing-actions.service';
import { ProcessingActionControllerService } from '../../../../../api/api/processingActionController.service';
import { ApiProcessingAction } from '../../../../../api/model/apiProcessingAction';
import { ProcessingActionType } from '../../../../../shared/types';
import { Location } from '@angular/common';
import { ListEditorManager } from '../../../../shared/list-editor/list-editor-manager';
import { ApiActivityProof } from '../../../../../api/model/apiActivityProof';
import { ApiActivityProofValidationScheme } from '../../stock-core/additional-proof-item/validation';
import { dateISOString, deleteNullFields, generateFormFromMetadata } from '../../../../../shared/utils';
import { CompanyFacilitiesForStockUnitProductService } from '../../../../shared-services/company-facilities-for-stock-unit-product.service';
import { AvailableSellingFacilitiesForCompany } from '../../../../shared-services/available-selling-facilities-for.company';
import { StockOrderControllerService } from '../../../../../api/api/stockOrderController.service';
import { FacilityControllerService } from '../../../../../api/api/facilityController.service';
import { Subscription } from 'rxjs';
import { ApiStockOrder } from '../../../../../api/model/apiStockOrder';
import { take } from 'rxjs/operators';
import { faTimes, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { ApiSemiProduct } from '../../../../../api/model/apiSemiProduct';
import { ApiFinalProduct } from '../../../../../api/model/apiFinalProduct';
import { ApiTransaction } from '../../../../../api/model/apiTransaction';
import { ApiCompanyGet } from '../../../../../api/model/apiCompanyGet';
import { AuthService } from '../../../../core/auth.service';
import { ProcessingOrderControllerService } from '../../../../../api/api/processingOrderController.service';
import { ApiProcessingOrder } from '../../../../../api/model/apiProcessingOrder';
import { ApiProcessingOrderValidationScheme, ApiStockOrderValidationScheme } from './validation';
import { StaticSemiProductsService } from './static-semi-products.service';
import { StockProcessingOrderDetailsHelper } from './stock-processing-order-details.helper';
import TypeEnum = ApiProcessingAction.TypeEnum;
import OrderTypeEnum = ApiStockOrder.OrderTypeEnum;
import { uuidv4 } from 'src/shared/utils';
import { SelectedUserCompanyService } from '../../../../core/selected-user-company.service';
import { ProcessingOrderInputComponent } from './processing-order-input/processing-order-input.component';
import { ProcessingOrderOutputComponent } from './processing-order-output/processing-order-output.component';
import { ToastrService } from 'ngx-toastr';

type PageMode = 'create' | 'edit';

interface RepackedTargetStockOrder extends ApiStockOrder {
  repackedOutputsArray: ApiStockOrder[];
}

@Component({
  selector: 'app-stock-processing-order-details',
  templateUrl: './stock-processing-order-details.component.html',
  styleUrls: ['./stock-processing-order-details.component.scss', './stock-processing-order-details-common.scss']
})
export class StockProcessingOrderDetailsComponent implements OnInit, AfterViewInit, OnDestroy {

  // FontAwesome icons
  faTimes = faTimes;
  faTrashAlt = faTrashAlt;

  title: string;

  // Holds the ID of the current user that is doing the processing
  processingUserId: number;

  // Holds the current company profile which executes the processing action
  companyProfile: ApiCompanyGet;

  // Holds the input facility ID provided as path param in the route (can be null)
  facilityIdPathParam: number | null = null;

  // Properties and controls used for display and selection of processing action
  procActionsCodebook: CompanyProcessingActionsService;
  procActionLotPrefixControl = new FormControl({ value: null, disabled: true });
  qrCodeForFinalProductControl = new FormControl({ value: null, disabled: true });

  // Properties and controls used for display and selection of input facility
  inputFacilitiesCodebook: CompanyFacilitiesForStockUnitProductService | AvailableSellingFacilitiesForCompany;
  inputFacilityControl = new FormControl(null, Validators.required);

  // Input stock orders properties and controls
  totalInputQuantityControl = new FormControl({ value: null, disabled: true });
  remainingQuantityControl = new FormControl({ value: null, disabled: true });

  // Input stock unit (Semi-product or Final product)
  currentInputStockUnit: ApiSemiProduct | ApiFinalProduct;

  // Processing order properties (the Processing order connects the input transactions with the target - to be created Stock orders)
  procOrderGroup: FormGroup;

  // Output stock orders properties and controls
  totalOutputQuantityControl = new FormControl({ value: null, disabled: true });
  commentsControl = new FormControl(null);
  private totalOutQuantityRangeLow: number = null;
  private totalOutQuantityRangeHigh: number = null;

  // Properties and controls for displaying output final-product and output semi-product
  finalProductOutputFacilitiesCodebook: CompanyFacilitiesForStockUnitProductService;
  currentOutputFinalProduct: ApiFinalProduct;
  outputFinalProductNameControl = new FormControl({ value: null, disabled: true });
  outputSemiProductsCodebook: StaticSemiProductsService;
  semiProductOutputFacilitiesCodebooks: Map<number, CompanyFacilitiesForStockUnitProductService>;

  // Processing evidence controls
  requiredProcessingEvidenceArray = new FormArray([]);
  otherProcessingEvidenceArray = new FormArray([]);
  processingEvidenceListManager = null;

  submitted = false;
  editing = false;

  saveInProgress = false;

  // List for holding references to observable subscriptions
  subscriptions: Subscription[] = [];

  @ViewChild('input')
  private input: ProcessingOrderInputComponent;

  @ViewChild('output')
  private output: ProcessingOrderOutputComponent;

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private globalEventsManager: GlobalEventManagerService,
    private stockOrderController: StockOrderControllerService,
    private processingOrderController: ProcessingOrderControllerService,
    private procActionController: ProcessingActionControllerService,
    private facilityController: FacilityControllerService,
    private authService: AuthService,
    private selUserCompanyService: SelectedUserCompanyService,
    private toastr: ToastrService
  ) { }

  get selectedProcAction(): ApiProcessingAction {
    return this.procOrderGroup?.get('processingAction')?.value as ApiProcessingAction ?? null;
  }

  get actionType(): ProcessingActionType {
    return this.selectedProcAction && this.selectedProcAction.type !== undefined
      ? this.selectedProcAction.type as ProcessingActionType
      : null;
  }

  get rightSideEnabled(): boolean {

    if (this.targetStockOrdersArray.length > 0) {
      const tso = this.targetStockOrdersArray.at(0).value as ApiStockOrder;
      if (!tso.facility) {
        return true;
      }
      return this.companyId === tso.facility.company?.id;
    }

    return true;
  }

  get inputTransactions(): ApiTransaction[] {
    return this.inputTransactionsArray.value ? this.inputTransactionsArray.value : [];
  }

  get totalOutputQuantity() {
    return this.totalOutputQuantityControl.value ? parseFloat(this.totalOutputQuantityControl.value) : 0;
  }

  get totalInputQuantity() {
    return this.totalInputQuantityControl.value ? parseFloat(this.totalInputQuantityControl.value) : 0;
  }

  get totalOutputQuantityTooLarge() {

    if (this.actionType === 'SHIPMENT' || this.totalInputQuantityControl.value == null) {
      return false;
    }

    return this.totalOutputQuantity > this.totalInputQuantity;
  }

  get outputQuantityNotInRange() {

    if (this.actionType !== 'PROCESSING' || !this.selectedProcAction?.estimatedOutputQuantityPerUnit ||
        !this.totalOutQuantityRangeLow || !this.totalOutQuantityRangeHigh) {
      return false;
    }

    if (!this.totalOutputQuantity) {
      return false;
    }

    if (!(this.totalOutputQuantity >= this.totalOutQuantityRangeLow && this.totalOutputQuantity <= this.totalOutQuantityRangeHigh)) {
      return true;
    }
  }

  get expectedOutputQuantityHelpText() {

    if (this.actionType !== 'PROCESSING' || !this.selectedProcAction?.estimatedOutputQuantityPerUnit) {
      return null;
    }

    let quantityFrom = '/';
    let quantityTo = '/';

    if (this.totalInputQuantity) {

      let expectedOutputQuantity;
      expectedOutputQuantity = this.totalInputQuantity * this.selectedProcAction.estimatedOutputQuantityPerUnit;

      this.totalOutQuantityRangeLow = Number(expectedOutputQuantity * 0.8);
      this.totalOutQuantityRangeHigh = Math.min(Number(expectedOutputQuantity * 1.2), this.totalInputQuantity);

      quantityFrom = this.totalOutQuantityRangeLow.toFixed(2);
      quantityTo = this.totalOutQuantityRangeHigh.toFixed(2);
    } else {

      this.totalOutQuantityRangeLow = null;
      this.totalOutQuantityRangeHigh = null;
    }

    return $localize`:@@productLabelStockProcessingOrderDetail.textinput.outputQuantity.expectedOutputHelpText:Expected output quantity range:` +
        ` ${quantityFrom} ~ ${quantityTo} (${this.currentInputStockUnit.measurementUnitType.label})`;
  }

  get targetStockOrdersArray(): FormArray {
    return this.procOrderGroup.get('targetStockOrders') as FormArray;
  }

  get productOrderId(): string | null {

    if (this.targetStockOrdersArray.length > 0) {
      const so = this.targetStockOrdersArray.at(0).value as ApiStockOrder;
      return so.productOrder?.orderId ?? null;
    }

    return null;
  }

  get quoteOrderOwnerCompany(): string | null {

    if (this.targetStockOrdersArray.length > 0) {
      const so = this.targetStockOrdersArray.at(0).value as ApiStockOrder;
      return so.facility?.company?.name;
    }

    return null;
  }

  get processingDateLabel() {
    if (this.actionType === 'SHIPMENT') {
      return $localize`:@@productLabelStockProcessingOrderDetail.datepicker.date.orderDate:Order date`;
    } else {
      return $localize`:@@productLabelStockProcessingOrderDetail.datepicker.date.processingDate:Processing date`;
    }
  }

  get inputQuantityLabel() {
    if (this.actionType === 'SHIPMENT') {
      return $localize`:@@productLabelStockProcessingOrderDetail.textinput.fulfilledQuantityLabelWithUnits.label: Quantity fulfilled by supplier in ${
        this.currentInputStockUnit ? this.currentInputStockUnit.measurementUnitType.label : ''
      }`;
    } else {

      return $localize`:@@productLabelStockProcessingOrderDetail.textinput.inputQuantityLabelWithUnits.label: Input quantity in ${
        this.currentInputStockUnit ? this.currentInputStockUnit.measurementUnitType.label : ''
      }`;
    }

  }

  get remainingQuantityLabel() {
    return $localize`:@@productLabelStockProcessingOrderDetail.textinput.remainingQuantityLabelWithUnits.label: Remaining quantity in ${
      this.currentInputStockUnit ? this.currentInputStockUnit.measurementUnitType.label : ''
    }`;
  }

  get totalOutputQuantityLabel() {
    if (this.actionType === 'SHIPMENT') {
      return $localize`:@@productLabelStockProcessingOrderDetail.textinput.totalOrderedQuantityLabelWithUnits.label: Total ordered quantity in ${
        this.currentInputStockUnit ? this.currentInputStockUnit.measurementUnitType.label : ''
      }`;
    } else {

      return $localize`:@@productLabelStockProcessingOrderDetail.textinput.totalOutputQuantityLabelWithUnits.label: Total output quantity in ${
        this.currentInputStockUnit ? this.currentInputStockUnit.measurementUnitType.label : ''
      }`;
    }

  }

  get companyId(): number {
    return this.companyProfile.id;
  }

  get inputTransactionsArray(): FormArray {
    return this.procOrderGroup.get('inputTransactions') as FormArray;
  }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {

    // Start loading of data and prepare form groups
    this.globalEventsManager.showLoading(true);
    this.initializeData().then(
      async () => this.globalEventsManager.showLoading(false),
      reason => {
        this.globalEventsManager.showLoading(false);
        throw reason;
      }
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  processingActionSelected(event: ApiProcessingAction): void {
    // Execute the update in separate cycle
    setTimeout(() => this.processingActionUpdated(event));
  }

  private async processingActionUpdated(procAction: ApiProcessingAction) {

    this.submitted = false;

    StockProcessingOrderDetailsHelper.setRequiredProcessingEvidence(procAction, this.requiredProcessingEvidenceArray).then();
    this.input?.clearInputPropsAndControls();
    this.input?.clearInputFacility();
    this.clearOutputPropsAndControls();

    if (procAction) {

      // Set the LOT prefix for the selected Processing action
      this.procActionLotPrefixControl.setValue(procAction.prefix);

      // If we have Processing action for generating QR code, set the final product form
      if (procAction && procAction.type === 'GENERATE_QR_CODE' && procAction.qrCodeForFinalProduct) {
        this.qrCodeForFinalProductControl
          .setValue(`${ procAction.qrCodeForFinalProduct.name } (${ procAction.qrCodeForFinalProduct.product.name })`);
      }

      await this.defineInputAndOutputStockUnits(procAction);

      // With the data provided from the Processing action, initialize the facilities codebook services (for input and output facilities)
      this.initializeFacilitiesCodebooks();

      // Add new initial output (if not in edit mode)
      setTimeout(() => {
        if (!this.editing) {
          this.output.addNewOutput();
        }
      });

      // Load and the facilities that are applicable for the processing action
      await this.loadFacilities();

    } else {

      this.procActionLotPrefixControl.reset();
      this.qrCodeForFinalProductControl.reset();
    }

    // Set the page title depending on the page mode and the Processing action type
    this.updatePageTitle();
  }

  async saveProcessingOrder() {

    if (this.saveInProgress) {
      return;
    }

    this.submitted = true;

    if (this.procOrderGroup.invalid || this.input.oneInputStockOrderRequired) {
      return;
    }

    // Validate the all the entered output quantity is being used
    let notAllOutputQuantityIsUsed = false;
    for (const tsoGroup of this.targetStockOrdersArray.controls) {
      notAllOutputQuantityIsUsed = this.output.notAllOutputQuantityIsUsed(tsoGroup);
      if (notAllOutputQuantityIsUsed) {
        break;
      }
    }

    if (notAllOutputQuantityIsUsed) {
      return;
    }

    this.saveInProgress = true;
    this.globalEventsManager.showLoading(true);
    try {

      // Get the raw value from the form group
      const processingOrder = this.procOrderGroup.getRawValue() as ApiProcessingOrder;

      // Create input transactions from the selected Stock orders
      processingOrder.inputTransactions.push(...this.input.prepInputTransactionsFromStockOrders());

      // If we have 'TRANSFER' order, the target Stock order present is just temporary (holds entered info)
      // We need to create the actual target Stock orders from the selected input Stock orders
      if (this.actionType === 'TRANSFER') {
        processingOrder.targetStockOrders = this.input.prepareTransferTargetStockOrders(processingOrder.targetStockOrders[0]);
      }
      else if (this.selectedProcAction.repackedOutputFinalProducts) {

        // If we have processing with repacking, the target Stock order present is just temporary (holds entered info)
        // We have to create the actual target Stock orders from the generated repacked output stock orders (repackedOutputsArray)
        processingOrder.targetStockOrders = this.prepareRepackedTargetStockOrders(processingOrder.targetStockOrders[0] as RepackedTargetStockOrder);
      } else {

        const processedTargetStockOrders: ApiStockOrder[] = [];

        processingOrder.targetStockOrders.forEach(targetStockOrder => {

          if ((targetStockOrder as RepackedTargetStockOrder).repackedOutputsArray?.length > 0) {
            processedTargetStockOrders.push(...this.prepareRepackedTargetStockOrders(targetStockOrder as RepackedTargetStockOrder));
          } else {
            processedTargetStockOrders.push(targetStockOrder);
          }
        });

        processingOrder.targetStockOrders = processedTargetStockOrders;
      }

      // Add common shared data (processing evidences, comments, etc.) to all target output Stock order
      this.enrichTargetStockOrders(processingOrder.targetStockOrders);

      // if(processingOrder.targetStockOrders[0].requiredEvidenceTypeValues?.length == 0) {
      //    this.toastr.info('Vous devez renseigner un document associé', 'Processing Evidence');
       
      //   return;
      // }

      const res = await this.processingOrderController
        .createOrUpdateProcessingOrder(processingOrder).pipe(take(1)).toPromise();

      if (!res || res.status !== 'OK') {
        throw Error('Error while creating processing order for order type: ' + this.actionType);
      } else {
        this.dismiss();
      }

    } finally {
      this.saveInProgress = false;
      this.globalEventsManager.showLoading(false);
    }
  }

  dismiss() {
    this.location.back();
  }

  private async initializeData() {

    // Get the page mode
    const pageMode = this.route.snapshot.data.mode as PageMode;
    if (!pageMode) {
      return;
    }

    // Load and set current user that is doing the processing
    this.loadProcessingUser();

    // Get the current user selected company from the local storage and load company profile
    await this.loadCompanyProfile();

    // Initialize list managers
    this.initProcEvidenceListManager();

    // Initialize the processing actions codebook
    this.procActionsCodebook =
      new CompanyProcessingActionsService(this.procActionController, this.companyId);

    if (pageMode === 'create') {

      this.editing = false;

      // Initialize the Processing order form group
      this.prepareNewProcOrderGroup();

      // Get the processing action ID from the route (this is user to load the Processing action)
      const procActionIdPathParam = this.route.snapshot.params.procActionId;

      // If the path param is not 'NEW' means that we are provided with Processing action ID (load the Processing action with this ID)
      if (procActionIdPathParam !== 'NEW') {
        this.facilityIdPathParam = Number(this.route.snapshot.params.inputFacilityId);
        await this.loadProcessingAction(procActionIdPathParam);

        // If processing action ID is provided in route, disable the Proc. action control
        this.procOrderGroup?.get('processingAction')?.disable({ emitEvent: false });
      }

      this.updatePageTitle();

    } else if (pageMode === 'edit') {

      this.editing = true;

      // Load the processing order that we are editing
      await this.loadProcessingOrder();

    } else {
      throw Error('Unsupported page mode.');
    }

    // Depending on the page mode set some form controls as disabled
    this.setFormControlsDisabledState();
  }

  private loadProcessingUser() {
    this.authService.userProfile$.pipe(take(1)).toPromise().then(profile => this.processingUserId = profile.id);
  }

  private async loadCompanyProfile() {

    const cp = await this.selUserCompanyService.selectedCompanyProfile$.pipe(take(1)).toPromise();
    if (cp) {
      this.companyProfile = cp;
    } else {
      throw Error('Cannot get company profile.');
    }
  }

  private async loadProcessingAction(procActionId: number) {

    const respProcAction = await this.procActionController.getProcessingAction(procActionId)
      .pipe(take(1)).toPromise();
    if (respProcAction && respProcAction.status === 'OK' && respProcAction.data) {
      this.procOrderGroup.get('processingAction').setValue(respProcAction.data);

      // Execute Proc. action updated in separate cycle
      setTimeout(() => this.processingActionUpdated(respProcAction.data));
    }
  }

  private async loadProcessingOrder() {

    // First get the Stock order ID provided in route (we fetch the Processing order using the Stock order ID)
    const stockOrderId = this.route.snapshot.params.stockOrderId as string;
    if (!stockOrderId) { throw Error('No Stock order ID in path!'); }

    // Get the Processing order for the Stock order with the provided ID
    const respProcessingOrder = await this.stockOrderController.getStockOrderProcessingOrder(Number(stockOrderId))
        .pipe(take(1)).toPromise();

    if (!respProcessingOrder || respProcessingOrder.status !== 'OK') {
      throw new Error('Cannot retrieve the processing order!');
    } else if (respProcessingOrder.data.targetStockOrders?.length === 0) {
      throw new Error('Processing order does not contain any target Stock orders!');
    }

    // Initialize the Processing order group using the fetched data
    this.prepareEditingProcOrderGroup(respProcessingOrder.data);

    // Execute the rest part in separate cycle
    setTimeout(async () => {
      await this.processingActionUpdated(respProcessingOrder.data.processingAction);

      // After Processing order and Processing action are loaded and initialized, set the existing evidence documents
      const firstTSO = this.targetStockOrdersArray.at(0) as FormGroup;
      StockProcessingOrderDetailsHelper.loadExistingOtherEvidenceDocuments(firstTSO, this.otherProcessingEvidenceArray);
      StockProcessingOrderDetailsHelper.loadExistingRequiredEvidenceDocuments(firstTSO, this.requiredProcessingEvidenceArray);

      // Calculate and set the total output and total input quantity
      this.calcTotalOutputQuantity();
      this.input.calcInputQuantity(true);

      // Set required fields for every target Stock order
      this.targetStockOrdersArray.controls.forEach(tso => this.output.setRequiredFieldsAndListenersForTSO(tso as FormGroup));
    });
  }

  private async loadFacilities() {

    if (this.editing) {

      // If Processing action type is 'SHIPMENT' - Quote order, set the input facility from the quote facility set in the target Stock order
      if (this.selectedProcAction.type === TypeEnum.SHIPMENT) {

        const quoteFacility = this.targetStockOrdersArray.value[0].quoteFacility;
        this.inputFacilityControl.setValue(quoteFacility);
        await this.input.setInputFacility(this.inputFacilityControl.value);
      } else {

        // In the other case, we set the input facility from the sourceFacility in the first input transaction
        const sourceFacility = this.inputTransactions[0].sourceFacility;
        this.inputFacilityControl.setValue(sourceFacility);
        await this.input.setInputFacility(this.inputFacilityControl.value);
      }

    } else {

      // Get all the applicable facilities
      const facilities = await this.inputFacilitiesCodebook.getAllCandidates().toPromise();

      // If facility ID is provided in path, set that facility if applicable
      if (this.facilityIdPathParam != null) {

        // Find the facility with the provided ID and set it
        const facility = facilities.find(f => f.id === this.facilityIdPathParam);
        if (facility) {
          this.inputFacilityControl.setValue(facility);
          await this.input.setInputFacility(this.inputFacilityControl.value);
          return;
        }
      }

      if (facilities && facilities.length === 1) {
        this.inputFacilityControl.setValue(facilities[0]);
        await this.input.setInputFacility(this.inputFacilityControl.value);
      }
    }
  }

  private initializeFacilitiesCodebooks() {

    // Reset the hashmap that's holding the facilities codebooks per output semi-product and also reset the
    // codebook for the output final product facility
    this.semiProductOutputFacilitiesCodebooks = null;
    this.finalProductOutputFacilitiesCodebook = null;

    const inputSemiProductId = this.selectedProcAction.inputSemiProduct?.id;
    const inputFinalProductId = this.selectedProcAction.inputFinalProduct?.id;

    const outputFinalProductId = this.currentOutputFinalProduct?.id;

    let supportedFacilitiesIds: number[] | undefined;
    if (this.selectedProcAction.supportedFacilities?.length > 0) {
      supportedFacilitiesIds = this.selectedProcAction.supportedFacilities.map(f => f.id);
    }

    // If there is input semi-product or input final product set, initialize input facility codebook
    if (inputSemiProductId || inputFinalProductId) {

      // If we have shipment action (quote processing action), get the selling facilities that the current company can order from
      if (this.actionType === 'SHIPMENT') {
        this.inputFacilitiesCodebook =
          new AvailableSellingFacilitiesForCompany(this.facilityController, this.companyId, inputSemiProductId, inputFinalProductId);
      } else {
        this.inputFacilitiesCodebook =
          new CompanyFacilitiesForStockUnitProductService(this.facilityController, this.companyId, inputSemiProductId, inputFinalProductId, supportedFacilitiesIds);
      }
    }

    // If there is output final product set, initialize output facility codebook for this output final product
    if (outputFinalProductId) {
      if (this.actionType === 'SHIPMENT') {
        this.finalProductOutputFacilitiesCodebook =
            new CompanyFacilitiesForStockUnitProductService(this.facilityController, this.companyId, undefined, outputFinalProductId, supportedFacilitiesIds);
      } else {
        this.finalProductOutputFacilitiesCodebook =
            new CompanyFacilitiesForStockUnitProductService(this.facilityController, this.companyId, undefined, outputFinalProductId);
      }
    }

    // If the selected Processing action has defined output semi-product, we need to create facility codebook instance per semi-product
    if (this.selectedProcAction.outputSemiProducts?.length > 0) {

      this.semiProductOutputFacilitiesCodebooks = new Map<number, CompanyFacilitiesForStockUnitProductService>();
      this.selectedProcAction.outputSemiProducts.forEach(osp => {
        let facilityCodebook;
        if (this.actionType === 'SHIPMENT') {
          facilityCodebook = new CompanyFacilitiesForStockUnitProductService(this.facilityController,
            this.companyId, osp.id, undefined, supportedFacilitiesIds);
        } else {
          facilityCodebook = new CompanyFacilitiesForStockUnitProductService(this.facilityController,
            this.companyId, osp.id);
        }

        this.semiProductOutputFacilitiesCodebooks.set(osp.id, facilityCodebook);
      });
    }
  }

  private async defineInputAndOutputStockUnits(procAction: ApiProcessingAction) {

    // Reset the current output final product
    this.currentOutputFinalProduct = null;
    this.outputFinalProductNameControl.reset();

    // Reset the output semi products codebook service
    this.outputSemiProductsCodebook = null;

    switch (procAction.type) {
      case ApiProcessingAction.TypeEnum.PROCESSING:
      case ApiProcessingAction.TypeEnum.GENERATEQRCODE:

        this.currentInputStockUnit = procAction.inputSemiProduct;
        this.outputSemiProductsCodebook = new StaticSemiProductsService(procAction.outputSemiProducts);
        break;

      case ApiProcessingAction.TypeEnum.FINALPROCESSING:

        this.currentInputStockUnit = procAction.inputSemiProduct;
        this.currentOutputFinalProduct = procAction.outputFinalProduct;
        this.outputFinalProductNameControl
            .setValue(this.currentOutputFinalProduct ? `${this.currentOutputFinalProduct.name} (${this.currentOutputFinalProduct.product.name})` : null);
        break;

      case ApiProcessingAction.TypeEnum.TRANSFER:
      case ApiProcessingAction.TypeEnum.SHIPMENT:

        // Is it a final product only involvement
        if (procAction.finalProductAction) {

          this.currentInputStockUnit = procAction.inputFinalProduct;
          this.currentOutputFinalProduct = procAction.outputFinalProduct;
          this.outputFinalProductNameControl
              .setValue(this.currentOutputFinalProduct ? `${this.currentOutputFinalProduct.name} (${this.currentOutputFinalProduct.product.name})` : null);

        } else {

          this.currentInputStockUnit = procAction.inputSemiProduct;
          this.outputSemiProductsCodebook = new StaticSemiProductsService(procAction.outputSemiProducts);
        }
    }
  }

  private initProcEvidenceListManager() {

    this.processingEvidenceListManager = new ListEditorManager<ApiActivityProof>(
      this.otherProcessingEvidenceArray,
      StockProcessingOrderDetailsHelper.ApiActivityProofEmptyObjectFormFactory(),
      ApiActivityProofValidationScheme
    );
  }

  private prepareNewProcOrderGroup() {

    this.procOrderGroup =
      generateFormFromMetadata(ApiProcessingOrder.formMetadata(), {}, ApiProcessingOrderValidationScheme);

    // Set values for common controls
    this.procOrderGroup.get('initiatorUserId').setValue(this.processingUserId);
    this.procOrderGroup.get('processingDate').setValue(dateISOString(new Date()));
  }

  private prepareEditingProcOrderGroup(processingOrder: ApiProcessingOrder) {

    this.procOrderGroup =
      generateFormFromMetadata(ApiProcessingOrder.formMetadata(), processingOrder, ApiProcessingOrderValidationScheme);

    // First clear the target stock orders array, we have to prepare and push FormGroups for each Stock order
    this.targetStockOrdersArray.clear();

    // Iterate over the target stock orders in the Processing order and group stock orders that are repacked (have the same 'repackedOriginStockOrderId')
    const repackedStockOrdersMap: Map<string, ApiStockOrder[]> = new Map<string, ApiStockOrder[]>();

    processingOrder.targetStockOrders.forEach((tso, index) => {

      // Get the comment content from the first target Stock order (all Stock orders have same comments content)
      if (index === 0) {
        this.commentsControl.setValue(tso.comments);
      }

      if (tso.repackedOriginStockOrderId != null) {
        const repackedTSOs = repackedStockOrdersMap.get(tso.repackedOriginStockOrderId);
        if (repackedTSOs) {
          repackedTSOs.push(tso);
        } else {
          repackedStockOrdersMap.set(tso.repackedOriginStockOrderId, [tso]);
        }
      } else {

        // Push new FormGroup created from the target Stock order data
        this.targetStockOrdersArray.push(generateFormFromMetadata(ApiStockOrder.formMetadata(), tso, ApiStockOrderValidationScheme));
      }
    });

    // For each repacked grouped of target Stock orders, prepare form group and push them repackedOutputsArray
    for (const repackedOriginStockOrderId of repackedStockOrdersMap.keys()) {

      const repackedTargetStockOrders = repackedStockOrdersMap.get(repackedOriginStockOrderId);

      // Find the maximum allowed weight for the repacked Stock orders
      let maxOutputWeight: number | undefined = this.selectedProcAction.maxOutputWeight;
      if (maxOutputWeight == null) {
        processingOrder.processingAction.outputSemiProducts.forEach(apiProcActionOSM => {
          if (apiProcActionOSM.id === repackedTargetStockOrders[0].semiProduct?.id) {
            maxOutputWeight = apiProcActionOSM.maxOutputWeight;
            repackedTargetStockOrders[0].semiProduct = apiProcActionOSM;
          }
        });
      }

      // Create target Stock order FormGroup from the first repacked Stock order
      const targetStockOrderGroup = generateFormFromMetadata(ApiStockOrder.formMetadata(), repackedTargetStockOrders[0], ApiStockOrderValidationScheme);

      // Add repacked outputs FormArray
      targetStockOrderGroup.addControl('repackedOutputsArray', new FormArray([]));

      // Set the first Stock order as a target Stock order in the target Stock orders array
      this.targetStockOrdersArray.push(targetStockOrderGroup);

      // Add all the repacked Stock orders as repacked output stock order in the repackedOutputStockOrdersArray
      let totalOutputQuantity = 0;
      repackedTargetStockOrders.forEach(tso => {

        const repackedStockOrderGroup = generateFormFromMetadata(ApiStockOrder.formMetadata(), tso, ApiStockOrderValidationScheme);
        repackedStockOrderGroup.get('totalQuantity').setValidators([Validators.required, Validators.max(maxOutputWeight)]);
        repackedStockOrderGroup.get('sacNumber').setValidators([Validators.required]);

        (targetStockOrderGroup.get('repackedOutputsArray') as FormArray).push(repackedStockOrderGroup);
        totalOutputQuantity += tso.totalQuantity;
      });

      // Set the total output quantity (calculated above) to the target Stock order
      targetStockOrderGroup.get('totalQuantity').setValue(totalOutputQuantity);

      const lastSlashIndex = repackedTargetStockOrders[0].internalLotNumber.lastIndexOf('/');
      if (lastSlashIndex !== -1) {
        targetStockOrderGroup.get('internalLotNumber').setValue(repackedTargetStockOrders[0].internalLotNumber.substring(0, lastSlashIndex));
      }
    }
  }

  private clearOutputPropsAndControls() {

    // If editing existing order exit
    if (this.editing) {
      return;
    }

    // Clear all the target Stock orders
    this.targetStockOrdersArray.clear();

    this.totalOutputQuantityControl.reset();
    this.commentsControl.reset();
  }

  calcRemainingQuantity() {

    const inputQuantity = this.totalInputQuantityControl.value ? parseFloat(this.totalInputQuantityControl.value) : null;
    const outputQuantity = this.totalOutputQuantity;

    if (this.actionType === 'SHIPMENT') {

      this.remainingQuantityControl.setValue(Number(this.totalOutputQuantity - inputQuantity ?? 0).toFixed(2));
      return;

    } else if (inputQuantity != null) {
      let remainingQuantity = inputQuantity - outputQuantity;
      remainingQuantity = Math.max(0, remainingQuantity);
      this.remainingQuantityControl.setValue(Number(remainingQuantity).toFixed(2));
      return;
    }

    this.remainingQuantityControl.reset();
  }

  /**
   * Calculates the total output quantity normalized in the input measuring unit (from current input stock unit).
   */
  calcTotalOutputQuantity() {

    let sumInKGs = 0;
    (this.targetStockOrdersArray.getRawValue() as ApiStockOrder[]).forEach(tso => {

      const measuringUnit = tso.measureUnitType;
      const quantityInMeasureUnit = tso.totalQuantity != null ? tso.totalQuantity : null;

      if (measuringUnit != null && quantityInMeasureUnit != null) {

        // Calculate the quantity in KGs
        const quantityInKGs = quantityInMeasureUnit * measuringUnit.weight;
        sumInKGs += quantityInKGs;
      }
    });

    // Convert the sum in the input stock unit measure unit
    if (sumInKGs) {

      const sumInInputMeasureUnit = sumInKGs / this.currentInputStockUnit.measurementUnitType.weight;
      this.totalOutputQuantityControl.setValue(Number(sumInInputMeasureUnit).toFixed(2));
      return;
    }

    this.totalOutputQuantityControl.reset();
  }

  private updatePageTitle() {

    if (!this.editing) {

      switch (this.actionType) {
        case TypeEnum.SHIPMENT:
          this.title = $localize`:@@productLabelStockProcessingOrderDetail.newQuoteOrderTitle:Place new order`;
          break;
        case TypeEnum.TRANSFER:
          this.title = $localize`:@@productLabelStockProcessingOrderDetail.newTransferTitle:Add transfer action`;
          break;
        case TypeEnum.FINALPROCESSING:
          this.title = $localize`:@@productLabelStockProcessingOrderDetail.newFinalProcessingTitle:Add final processing action`;
          break;
        case TypeEnum.PROCESSING:
        case TypeEnum.GENERATEQRCODE:
          this.title = $localize`:@@productLabelStockProcessingOrderDetail.newProcessingTitle:Add new processing action`;
          break;
        default:
          this.title = $localize`:@@productLabelStockProcessingOrderDetail.newProcessingTitle:Add new processing action`;
      }
    } else {

      switch (this.actionType) {
        case TypeEnum.SHIPMENT:

          if (this.rightSideEnabled) {
            this.title = $localize`:@@productLabelStockProcessingOrderDetail.updateQuoteOrderTitle:Update existing order`;
          } else {
            this.title = $localize`:@@productLabelStockProcessingOrderDetail.fulfillQuoteOrderTitle:Fulfill order`;
          }
          break;
        case TypeEnum.TRANSFER:
          this.title = $localize`:@@productLabelStockProcessingOrderDetail.updateTransferTitle:Update transfer action`;
          break;
        case TypeEnum.PROCESSING:
        case TypeEnum.GENERATEQRCODE:
          this.title = $localize`:@@productLabelStockProcessingOrderDetail.updateProcessingTitle:Update processing action`;
          break;
        case TypeEnum.FINALPROCESSING:
          this.title = $localize`:@@productLabelStockProcessingOrderDetail.updateFinalProcessingTitle:Update final processing action`;
          break;
      }
    }
  }

  private setFormControlsDisabledState() {

    if (this.editing) {
      this.procOrderGroup.get('processingAction').disable();
      this.inputFacilityControl.disable();
    }
  }

  private prepareRepackedTargetStockOrders(sourceStockOrder: RepackedTargetStockOrder): ApiStockOrder[] {

    const repackedTSOId = sourceStockOrder.repackedOriginStockOrderId ?? uuidv4();

    return sourceStockOrder.repackedOutputsArray.map(repackedSacUnit => {

      const newStockOrder = {...repackedSacUnit};
      newStockOrder.creatorId = sourceStockOrder.creatorId;
      newStockOrder.internalLotNumber = sourceStockOrder.internalLotNumber;
      newStockOrder.facility = sourceStockOrder.facility;
      newStockOrder.semiProduct = sourceStockOrder.semiProduct;
      newStockOrder.finalProduct = sourceStockOrder.finalProduct;
      newStockOrder.productionDate = sourceStockOrder.productionDate;
      newStockOrder.orderType = OrderTypeEnum.PROCESSINGORDER;

      // Set generated ID, so we can group the repacked stock orders when viewing or editing the Processing order
      newStockOrder.repackedOriginStockOrderId = repackedTSOId;

      // Add the injected FormGroup for processing evidence fields
      newStockOrder['requiredProcEvidenceFieldGroup'] = sourceStockOrder['requiredProcEvidenceFieldGroup'];

      return newStockOrder;
    });
  }

  private enrichTargetStockOrders(targetStockOrders: ApiStockOrder[]) {

    // Common computed properties
    const requiredEvidenceTypeValues = StockProcessingOrderDetailsHelper.prepareRequiredEvidenceTypeValues(this.requiredProcessingEvidenceArray);
    const otherEvidenceDocuments = StockProcessingOrderDetailsHelper.prepareOtherEvidenceDocuments(this.otherProcessingEvidenceArray);

    targetStockOrders.forEach(tso => {

      // Set shared properties
      tso.requiredEvidenceTypeValues = requiredEvidenceTypeValues;
      tso.otherEvidenceDocuments = otherEvidenceDocuments;
      tso.comments = this.commentsControl.value;
      tso.fulfilledQuantity = 0;
      tso.availableQuantity = 0;

      // Set specific properties
      tso.requiredEvidenceFieldValues = StockProcessingOrderDetailsHelper.prepareRequiredEvidenceFieldValues(tso['requiredProcEvidenceFieldGroup'], this.selectedProcAction);

      // Delete null and not need properties
      delete tso['requiredProcEvidenceFieldGroup'];
      deleteNullFields(tso);
    });
  }

}
