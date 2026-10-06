import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { faCut, faFemale, faLeaf, faQrcode, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FormArray, FormControl } from '@angular/forms';
import { ApiFacility } from '../../../../../../api/model/apiFacility';
import { CompanyFacilitiesForStockUnitProductService } from '../../../../../shared-services/company-facilities-for-stock-unit-product.service';
import { AvailableSellingFacilitiesForCompany } from '../../../../../shared-services/available-selling-facilities-for.company';
import { ProcessingActionType } from '../../../../../../shared/types';
import { GetAvailableStockForStockUnitInFacility, StockOrderControllerService } from '../../../../../../api/api/stockOrderController.service';
import { dateISOString } from '../../../../../../shared/utils';
import { debounceTime, take } from 'rxjs/operators';
import { ApiStockOrder } from '../../../../../../api/model/apiStockOrder';
import { ApiProcessingAction } from '../../../../../../api/model/apiProcessingAction';
import { ApiStockOrderSelectable } from '../stock-processing-order-details.model';
import { GenerateQRCodeModalComponent } from '../../../../../components/generate-qr-code-modal/generate-qr-code-modal.component';
import { ClipInputTransactionModalComponent } from './clip-input-transaction-modal/clip-input-transaction-modal.component';
import { ClipInputTransactionModalResult } from './clip-input-transaction-modal/model';
import { Subscription } from 'rxjs';
import { NgbModalImproved } from '../../../../../core/ngb-modal-improved/ngb-modal-improved.service';
import ApiTransactionStatus = ApiTransaction.StatusEnum;
import { ApiTransaction } from '../../../../../../api/model/apiTransaction';
import { ApiSemiProduct } from '../../../../../../api/model/apiSemiProduct';
import { ApiFinalProduct } from '../../../../../../api/model/apiFinalProduct';
import StatusEnum = ApiTransaction.StatusEnum;
import OrderTypeEnum = ApiStockOrder.OrderTypeEnum;

interface AvailableStockOrdersResult {
  stockOrders: ApiStockOrderSelectable[];
  failed: boolean;
}

@Component({
  selector: 'app-processing-order-input',
  templateUrl: './processing-order-input.component.html',
  styleUrls: ['./processing-order-input.component.scss', '../stock-processing-order-details-common.scss']
})
export class ProcessingOrderInputComponent implements OnInit, OnDestroy {

  // FontAwesome icons
  readonly faTimes = faTimes;
  readonly faQrcode = faQrcode;
  readonly faCut = faCut;
  readonly faLeaf = faLeaf;
  readonly faFemale = faFemale;

  selectedInputFacility: ApiFacility = null;

  // Input stock orders filter controls
  dateFromFilterControl = new FormControl(null);
  dateToFilterControl = new FormControl(null);
  internalLotNameSearchControl = new FormControl(null);
  womenOnlyFilterControl = new FormControl(null);
  organicOnlyFilterControl = new FormControl(null);

  // Input stock orders properties and controls
  organicOnlyInputStockOrders = false;
  womenOnlyInputStockOrders = false;
  cbSelectAllControl = new FormControl(false);

  // Input stock orders properties and controls
  availableInputStockOrders: ApiStockOrderSelectable[] = [];
  selectedInputStockOrders: ApiStockOrderSelectable[] = [];
  availableStockOrdersLoading = false;
  availableStockOrdersError = false;
  private availableStockRequestId = 0;

  // List for holding references to observable subscriptions
  subscriptions: Subscription[] = [];

  @Input()
  processingUserId: number;

  @Input()
  editing: boolean;

  @Input()
  submitted: boolean;

  @Input()
  companyId: number;

  @Input()
  selectedProcAction: ApiProcessingAction;

  @Input()
  inputFacilitiesCodebook: CompanyFacilitiesForStockUnitProductService | AvailableSellingFacilitiesForCompany;

  @Input()
  inputFacilityControl: FormControl;

  @Input()
  totalInputQuantityControl: FormControl;

  @Input()
  currentInputStockUnit: ApiSemiProduct | ApiFinalProduct;

  @Input()
  remainingQuantityControl: FormControl;

  @Input()
  targetStockOrdersArray: FormArray;

  @Input()
  inputTransactionsArray: FormArray;

  @Input()
  inputTransactions: ApiTransaction[];

  @Input()
  totalOutputQuantity: number;

  @Output()
  calcRemainingQuantity = new EventEmitter<void>();

  constructor(
    private stockOrderController: StockOrderControllerService,
    private modalService: NgbModalImproved
  ) { }

  get actionType(): ProcessingActionType {
    return this.selectedProcAction ? this.selectedProcAction.type : null;
  }

  get womenOnlyStatusValue() {
    if (this.womenOnlyFilterControl.value != null) {
      if (this.womenOnlyFilterControl.value) { return $localize`:@@productLabelStockProcessingOrderDetail.womensOnlyStatus.womenCoffee:Women coffee`; }
      else { return $localize`:@@productLabelStockProcessingOrderDetail.womensOnlyStatus.nonWomenCoffee:Non-women coffee`; }
    }
    return null;
  }

  get organicOnlyStatusValue() {
    if (this.organicOnlyFilterControl.value != null) {
      if (this.organicOnlyFilterControl.value) {
        return $localize`:@@productLabelStockProcessingOrderDetail.organicOnlyStatus.organicCoffee:Organic coffee`;
      } else {
        return $localize`:@@productLabelStockProcessingOrderDetail.organicOnlyStatus.nonOrganicCoffee:Non-organic coffee`;
      }
    }
  }

  get leftSideEnabled() {
    const facility = this.inputFacilityControl.value as ApiFacility;
    if (!facility) { return true; }
    if (!this.editing) { return true; }
    return this.companyId === facility.company?.id;
  }

  get hideAvailableStock() {
    const facility = this.inputFacilityControl.value as ApiFacility;
    return !facility || facility.company?.id !== this.companyId;
  }

  get oneInputStockOrderRequired() {

    if (this.actionType === 'SHIPMENT') { return false; }

    const existingInputTRCount = this.inputTransactions ? this.inputTransactions.length : 0;
    const selectedInputSOCount = this.selectedInputStockOrders ? this.selectedInputStockOrders.length : 0;

    return existingInputTRCount + selectedInputSOCount === 0;
  }

  ngOnInit(): void {

    // Register value change listeners for input controls
    this.registerInternalLotSearchValueChangeListener();
    this.registerInputFacilityValueChangeListener();
  }

  ngOnDestroy(): void {

    this.clearInputPropsAndControls();
    this.clearInputFacility();

    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async setWomenOnlyStatus(status: boolean) {
    if (!this.leftSideEnabled) {
      return;
    }

    this.womenOnlyFilterControl.setValue(status);
    if (this.selectedInputFacility) {
      this.dateSearch().then();
    }
  }

  async setOrganicOnlyStatus(organicOnly: boolean) {
    if (!this.leftSideEnabled) {
      return;
    }

    this.organicOnlyFilterControl.setValue(organicOnly);
    if (this.selectedInputFacility) {
      this.dateSearch().then();
    }
  }

  async dateSearch() {

    if (!this.leftSideEnabled) { return; }
    if (!this.selectedInputFacility) { return; }

    const from = this.dateFromFilterControl.value;
    const to = this.dateToFilterControl.value;

    // Prepare initial request params
    const requestParams: GetAvailableStockForStockUnitInFacility.PartialParamMap = {
      limit: 500,
      offset: 0,
      facilityId: this.selectedInputFacility.id,
      semiProductId: this.selectedProcAction.inputSemiProduct?.id,
      finalProductId: this.selectedProcAction.inputFinalProduct?.id,
      isWomenShare: this.womenOnlyFilterControl.value,
      organicOnly: this.organicOnlyFilterControl.value,
      internalLotName: this.internalLotNameSearchControl.value
    };

    // Prepare date filters
    if (from && to) {
      requestParams.productionDateStart = dateISOString(from);
      requestParams.productionDateEnd = dateISOString(to);
    } else if (from) {
      requestParams.productionDateStart = dateISOString(from);
    } else if (to) {
      requestParams.productionDateEnd = dateISOString(to);
    }

    // Get the available stock in the provided facility for the provided semi-product
    const result = await this.fetchAvailableStockOrders(requestParams);
    if (!result) {
      return;
    }
    this.availableInputStockOrders = result.stockOrders;

    if (result.failed) {
      this.clearAvailableStockOrderSelection();
      return;
    }

    // Reinitialize selections
    const tmpSelected = [];
    for (const item of this.availableInputStockOrders) {
      for (const selected of this.selectedInputStockOrders) {
        if (selected.id === item.id) {
          tmpSelected.push(item);
          item.selected = true;
          item.selectedQuantity = selected.availableQuantity;
        }
      }
    }
    this.selectedInputStockOrders = tmpSelected;
    this.calcInputQuantity(true);
  }

  private registerInternalLotSearchValueChangeListener() {
    this.subscriptions.push(
      this.internalLotNameSearchControl.valueChanges
        .pipe(debounceTime(350))
        .subscribe(() => this.dateSearch())
    );
  }

  private registerInputFacilityValueChangeListener() {
    this.subscriptions.push(
      this.inputFacilityControl.valueChanges.subscribe((facility: ApiFacility) => {

        // If we are creating new Quote order, set the quoteFacility when input facility is selected
        if (!this.editing && this.actionType === 'SHIPMENT' && this.targetStockOrdersArray?.length > 0) {
          this.targetStockOrdersArray.at(0).get('quoteFacility').setValue(facility);
        }
      })
    );
  }

  private async fetchAvailableStockOrders(params: GetAvailableStockForStockUnitInFacility.PartialParamMap): Promise<AvailableStockOrdersResult | null> {

    const requestId = ++this.availableStockRequestId;
    this.availableStockOrdersLoading = true;
    this.availableStockOrdersError = false;

    // Final product is defined for 'FINAL_PROCESSING' and Quote or Transfer for a final product
    const finalProduct = this.selectedProcAction.outputFinalProduct;

    try {
      const res = await this.stockOrderController
        .getAvailableStockForStockUnitInFacilityByMap(params)
        .pipe(take(1))
        .toPromise();

      if (requestId !== this.availableStockRequestId) {
        return null;
      }

      if (!res || res.status !== 'OK' || !res.data || !Array.isArray(res.data.items)) {
        this.availableStockOrdersError = true;
        return { stockOrders: [], failed: true };
      }

      let stockOrders = res.data.items || [];

      // If we are editing an existing order, do not offer its existing output orders as new input.
      if (this.editing) {
        stockOrders = stockOrders.filter(stockOrder => !this.targetStockOrdersArray.value.some(target => target.id === stockOrder.id));
      }

      // If generating QR code, filter all stock orders that already have a generated QR code tag.
      if (this.selectedProcAction.type === 'GENERATE_QR_CODE') {
        stockOrders = stockOrders.filter(stockOrder => !stockOrder.qrCodeTag);
      } else if (finalProduct) {
        // A final-product action can only use a matching QR code tag.
        stockOrders = stockOrders.filter(stockOrder => !stockOrder.qrCodeTag || stockOrder.qrCodeTagFinalProduct.id === finalProduct.id);
      }

      return { stockOrders, failed: false };
    } catch (error) {
      if (requestId !== this.availableStockRequestId) {
        return null;
      }

      this.availableStockOrdersError = true;
      return { stockOrders: [], failed: true };
    } finally {
      if (requestId === this.availableStockRequestId) {
        this.availableStockOrdersLoading = false;
      }
    }
  }

  async setInputFacility(facility: ApiFacility) {

    this.clearInputPropsAndControls();

    if (facility) {
      this.selectedInputFacility = facility;

      const requestParams: GetAvailableStockForStockUnitInFacility.PartialParamMap = {
        limit: 500,
        offset: 0,
        facilityId: facility.id,
        semiProductId: this.selectedProcAction.inputSemiProduct?.id,
        finalProductId: this.selectedProcAction.inputFinalProduct?.id
      };

      const result = await this.fetchAvailableStockOrders(requestParams);
      if (result) {
        this.availableInputStockOrders = result.stockOrders;
      }
    } else {
      this.clearInputFacility();
    }
  }

  cbSelectAllClick() {

    if (!this.leftSideEnabled) { return; }
    if (this.hideAvailableStock) { return; }

    if (this.cbSelectAllControl.value) {

      this.selectedInputStockOrders = [];
      for (const item of this.availableInputStockOrders) {
        this.selectedInputStockOrders.push(item);
      }

      this.availableInputStockOrders.map(item => { item.selected = true; item.selectedQuantity = item.availableQuantity; return item; });

      if (this.actionType === 'SHIPMENT') {
        this.clipInputQuantity();
      }

    } else {

      this.selectedInputStockOrders = [];
      this.availableInputStockOrders.map(item => { item.selected = false; item.selectedQuantity = 0; return item; });
    }

    this.calcInputQuantity(true);
    this.setOrganicAndWomenOnly();
  }

  cbSelectClick(stockOrder: ApiStockOrderSelectable, index: number) {

    if (!this.leftSideEnabled) { return; }

    if (this.cbSelectAllControl.value) {
      this.cbSelectAllControl.setValue(false);
    }

    if (!this.availableInputStockOrders[index].selected) {

      const outputQuantity = this.totalOutputQuantity as number || 0;
      const inputQuantity = this.calcInputQuantity(false);

      const toFill = Number((outputQuantity - inputQuantity).toFixed(2));

      const currentAvailable = this.availableInputStockOrders[index].availableQuantity;

      if (this.actionType === 'SHIPMENT') {

        // In case of 'SHIPMENT' we always clip the input quantity
        if (toFill > 0 && currentAvailable > 0) {
          this.availableInputStockOrders[index].selected = true;
          this.availableInputStockOrders[index].selectedQuantity = toFill < currentAvailable ? toFill : currentAvailable;
        } else {

          // We have to set first to true due tu change detection in checkbox component
          this.availableInputStockOrders[index].selected = true;
          this.availableInputStockOrders[index].selectedQuantity = 0;
          setTimeout(() => this.availableInputStockOrders[index].selected = false);
        }
      } else {
        this.availableInputStockOrders[index].selected = true;
        this.availableInputStockOrders[index].selectedQuantity = currentAvailable;
      }
    } else {
      this.availableInputStockOrders[index].selected = false;
      this.availableInputStockOrders[index].selectedQuantity = 0;
    }

    this.selectInputStockOrder(stockOrder);
  }

  openInputStockOrderQRCode(order: ApiStockOrder) {

    if (!order.qrCodeTag) {
      return;
    }

    const modalRef = this.modalService.open(GenerateQRCodeModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });

    Object.assign(modalRef.componentInstance, {
      qrCodeTag: order.qrCodeTag,
      qrCodeFinalProduct: order.qrCodeTagFinalProduct
    });
  }

  async clipInputTransaction(item: ApiStockOrderSelectable, index: number) {

    if (!this.leftSideEnabled) { return; }

    const modalRef = this.modalService.open(ClipInputTransactionModalComponent, { centered: true, keyboard: false, backdrop: 'static' });
    Object.assign(modalRef.componentInstance, {
      stockOrder: item,
      currentSelectedQuantity: this.availableInputStockOrders[index].selectedQuantity
    });

    const result: ClipInputTransactionModalResult = await modalRef.result;
    if (!result) {
      return;
    }

    if (result.selectedQuantity > 0) {

      // If this transaction was not selected, trigger selection
      if (!this.availableInputStockOrders[index].selected) {
        this.selectInputStockOrder(item);
      }

      this.availableInputStockOrders[index].selected = true;
      this.availableInputStockOrders[index].selectedQuantity = result.selectedQuantity;
    } else {

      // If this transaction was selected, trigger unselect
      if (this.availableInputStockOrders[index].selected) {
        this.selectInputStockOrder(item);
      }

      this.availableInputStockOrders[index].selected = false;
      this.availableInputStockOrders[index].selectedQuantity = 0;
    }

    this.calcInputQuantity(true);
  }

  deleteTransaction(i: number) {

    if (!this.leftSideEnabled) { return; }

    switch (this.actionType) {
      case 'PROCESSING':
      case 'FINAL_PROCESSING':
      case 'GENERATE_QR_CODE':
      case 'SHIPMENT':
        this.inputTransactionsArray.removeAt(i);
        this.calcInputQuantity(true);
        break;
      case 'TRANSFER':
        this.inputTransactionsArray.removeAt(i);
        this.targetStockOrdersArray.removeAt(i);
        this.calcInputQuantity(true);
    }
  }

  private selectInputStockOrder(stockOrder: ApiStockOrderSelectable) {

    const index = this.selectedInputStockOrders.indexOf(stockOrder);
    if (index !== -1) {
      this.selectedInputStockOrders.splice(index, 1);
    } else {
      this.selectedInputStockOrders.push(stockOrder);
    }

    this.calcInputQuantity(true);
    this.setOrganicAndWomenOnly();
  }

  private setOrganicAndWomenOnly() {

    let countOrganic = 0;
    let countWomenShare = 0;

    const allSelected = this.selectedInputStockOrders.length;
    for (const item of this.selectedInputStockOrders) {
      if (item.organic) {
        countOrganic++;
      }

      if (item.womenShare) {
        countWomenShare++;
      }
    }

    this.organicOnlyInputStockOrders = countOrganic === allSelected && allSelected > 0;
    this.womenOnlyInputStockOrders = countWomenShare === allSelected && allSelected > 0;
  }

  private clipInputQuantity() {

    const outputQuantity = this.totalOutputQuantity;
    let tmpQuantity = 0;

    for (const tx of this.inputTransactions) {
      tmpQuantity += tx.outputQuantity;
    }

    for (const item of this.availableInputStockOrders) {

      if (!item.selected) { continue; }

      if (tmpQuantity + item.availableQuantity <= outputQuantity) {
        tmpQuantity += item.availableQuantity;
        item.selectedQuantity = item.availableQuantity;
        continue;
      }

      if (tmpQuantity >= outputQuantity) {
        item.selected = false;
        item.selectedQuantity = 0;
        continue;
      }

      item.selectedQuantity = Number((outputQuantity - tmpQuantity).toFixed(2));
      tmpQuantity = outputQuantity;
    }

    // Filter all selected Stock orders that are no longer selected (after clipping)
    this.selectedInputStockOrders = this.selectedInputStockOrders.filter(so => so.selected);
  }

  clearInputPropsAndControls() {

    this.availableStockRequestId++;
    this.availableStockOrdersLoading = false;
    this.availableStockOrdersError = false;

    this.dateFromFilterControl.setValue(null);
    this.dateToFilterControl.setValue(null);
    this.internalLotNameSearchControl.setValue(null, { emitEvent: false });

    this.womenOnlyFilterControl.setValue(null);
    this.organicOnlyFilterControl.setValue(null);

    this.availableInputStockOrders = [];
    this.selectedInputStockOrders = [];
    this.cbSelectAllControl.setValue(false);

    this.organicOnlyInputStockOrders = false;
    this.womenOnlyInputStockOrders = false;

    this.totalInputQuantityControl.reset();
    this.remainingQuantityControl.reset();
  }

  private clearAvailableStockOrderSelection() {
    this.availableInputStockOrders = [];
    this.selectedInputStockOrders = [];
    this.cbSelectAllControl.setValue(false);
    this.calcInputQuantity(true);
    this.setOrganicAndWomenOnly();
  }

  clearInputFacility() {
    this.selectedInputFacility = null;
    this.inputFacilityControl.setValue(null);
  }

  calcInputQuantity(setValue: boolean) {

    let inputQuantity = 0;
    if (this.editing) {
      for (const item of this.availableInputStockOrders) {
        inputQuantity += item.selectedQuantity ? item.selectedQuantity : 0;
      }

      const txs = this.inputTransactions;

      if (txs) {
        for (const tx of txs) {
          if (tx.status !== ApiTransactionStatus.CANCELED) {
            inputQuantity += tx.outputQuantity;
          }
        }
      }
    } else {
      for (const item of this.availableInputStockOrders) {
        inputQuantity += item.selectedQuantity ? item.selectedQuantity : 0;
      }
    }

    // Set total input quantity value
    if (setValue) {

      if (inputQuantity) {
        switch (this.actionType) {
          case 'GENERATE_QR_CODE':
            // If generating QR code, the output is always the same with the input
            this.totalInputQuantityControl.setValue(Number(inputQuantity).toFixed(2));
            this.targetStockOrdersArray.at(0).get('totalQuantity').setValue(Number(inputQuantity).toFixed(2));
            break;
          default:
            this.totalInputQuantityControl.setValue(Number(inputQuantity).toFixed(2));
        }
      } else {
        this.totalInputQuantityControl.reset();
      }

      // Also update the remaining quantity
      this.calcRemainingQuantity.emit();
    }

    return inputQuantity;
  }

  prepInputTransactionsFromStockOrders(): ApiTransaction[] {

    const inputTransactions: ApiTransaction[] = [];

    // Common computed properties used in every transaction
    const isProcessing = this.actionType === 'PROCESSING' || this.actionType === 'FINAL_PROCESSING' || this.actionType === 'GENERATE_QR_CODE';
    const status: ApiTransaction.StatusEnum = this.actionType === 'SHIPMENT' ? StatusEnum.PENDING : StatusEnum.EXECUTED;

    for (const stockOrder of this.selectedInputStockOrders) {

      // Create transaction for current stock order from the list of selected stock orders
      const transaction: ApiTransaction = {
        isProcessing,
        company: { id: this.companyId },
        initiationUserId: this.processingUserId,
        sourceStockOrder: stockOrder,
        status,
        inputQuantity: stockOrder.selectedQuantity,
        outputQuantity: stockOrder.selectedQuantity
      };

      inputTransactions.push(transaction);
    }

    return inputTransactions;
  }

  prepareTransferTargetStockOrders(sourceStockOrder: ApiStockOrder): ApiStockOrder[] {

    const targetStockOrders: ApiStockOrder[] = [];

    for (const [index, selectedStockOrder] of this.selectedInputStockOrders.entries()) {
      const newStockOrder: ApiStockOrder = {
        facility: sourceStockOrder.facility,
        semiProduct: selectedStockOrder.semiProduct,
        finalProduct: selectedStockOrder.finalProduct,
        internalLotNumber: `${sourceStockOrder.internalLotNumber}/${index + 1 + 0}`,
        creatorId: this.processingUserId,
        productionDate: selectedStockOrder.productionDate ? selectedStockOrder.productionDate : (dateISOString(new Date()) as any),
        orderType: OrderTypeEnum.TRANSFERORDER,
        totalQuantity: selectedStockOrder.availableQuantity
      };

      // Set the temporary object that holds the processing evidence fields
      newStockOrder['requiredProcEvidenceFieldGroup'] = sourceStockOrder['requiredProcEvidenceFieldGroup'];

      targetStockOrders.push(newStockOrder);
    }

    return targetStockOrders;
  }

}
