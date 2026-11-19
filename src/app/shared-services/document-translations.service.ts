import { Injectable } from '@angular/core';

export type FieldType = 'string' | 'text' | 'number' | 'integer' | 'date' | 'object' | 'array' | 'price' | 'exchange_rate' | 'boolean';
export interface KeyFieldDescription {
  id: string;
  field?: string;
  type?: FieldType;
  label: string;
  placeholder?: string;
  requiredMessage?: string;
  group?: 'FIRST' | 'SECOND';
  leftOnQuote?: boolean;
}

export const codeToFieldInfoList: KeyFieldDescription[] = [
  {
    id: 'CUSTOMER',
    field: 'consumerCompanyCustomer',
    type: 'object',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.customer:Customer`,
    placeholder: $localize`:@@productLabelProcessingAction.newProcessingAction.field.customer.placeholder:Choose customer)`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.customer.requiredMessage:Customer is required`,
    group: 'FIRST',
    // leftOnQuote: true
  },
  {
    id: 'PRICE_PER_UNIT',
    field: 'pricePerUnit',
    type: 'price',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.pricePerUnit:Price (RWF) / kg for Producer`,
    placeholder: $localize`:@@productLabelProcessingAction.newProcessingAction.field.pricePerUnit.placeholder:Enter price (RWF) / kg for Producer `,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.pricePerUnit.requiredMessage:Price is required`,
    group: 'FIRST',
    // leftOnQuote: true
  },
  {
    id: 'GRADE',
    field: 'gradeAbbreviation',
    type: 'object',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.grade:Grade`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.grade.requiredMessage:Grade is required`,
    group: 'FIRST',
  },
  {
    id: 'LOT_EXPORT_NUMBER',
    field: 'lotNumber',
    type: 'string',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.lotExternalNumber:Export lot number`,
    placeholder: $localize`:@@productLabelProcessingAction.newProcessingAction.field.lotExternalNumber.placeholder:Enter export lot number`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.lotExternalNumber.requiredMessage:Export lot number is required`,
    group: 'FIRST',
  },
  {
    id: 'SCREEN_SIZE',
    field: 'screenSize',
    type: 'string',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.screenSize:Screen size`,
    placeholder: $localize`:@@productLabelProcessingAction.newProcessingAction.field.screenSize.placeholder:Enter screen size`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.screenSize.requiredMessage:Screen size is required`,
    group: 'FIRST',
  },
  {
    id: 'LOT_LABEL',
    field: 'lotLabel',
    type: 'string',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.lotLabel:Lot label`,
    placeholder: $localize`:@@productLabelProcessingAction.newProcessingAction.field.lotLabel.placeholder:Enter lot label`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.lotLabel.requiredMessage:Lot label is required`,
    group: 'FIRST'
  },
  {
    id: 'START_OF_DRYING',
    field: 'startOfDrying',
    type: 'date',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.startOfDrying:Start of drying`,
    placeholder: $localize`:@@productLabelProcessingAction.newProcessingAction.field.startOfDrying.placeholder:Enter date`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.startOfDrying.requiredMessage:Start of drying is required`,
    group: 'FIRST'
  },
  {
    id: 'CLIENT_NAME',
    field: 'clientId',
    type: 'object',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.clientName:Client's name`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.clientName.requiredMessage:Client name is required`,
    group: 'FIRST'
  },
  {
    id: 'CERTIFICATES_IDS',
    field: 'certificates',
    type: 'array',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.certificatesIds:Certificates`,
    group: 'FIRST'
  },
  // {
  //   id: 'TRANSACTION_TYPE',
  //   field: 'actionType',
  //   type: 'object',
  //   label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.transactionType:Type of transaction`,
  //   requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.transactionType.requiredMessage:Transaction type is required`,
  //   group: 'FIRST'
  // },
  {
    id: 'FLAVOUR_PROFILE',
    field: 'flavourProfile',
    type: 'string',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.flavourProfile:Flavour profile`,
    placeholder: $localize`:@@productLabelProcessingAction.newProcessingAction.field.flavourProfile.placeholder:Enter flavour profile`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.flavourProfile.requiredMessage:Flavour profile is required`,
    group: 'FIRST'
  },
  {
    id: 'REQUIRED_WOMENS_COFFEE',
    field: 'requiredWomensCoffee',
    type: 'boolean',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.requiredWomensCoffee:Required women's only coffee`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.flavourProfile.requiredMessage:Choice is required`,
    group: 'SECOND',
    leftOnQuote: true
  },
  {
    id: 'REQUIRED_GRADE',
    field: 'requiredQuality',
    type: 'object',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.requiredQuality:Required quality`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.requiredQuality.requiredMessage:Quality is required`,
    group: 'SECOND',
    leftOnQuote: true
  },

  {
    id: 'TRIGGER_ORDERS',
    field: 'triggerOrders',
    type: 'object',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.triggerOrder:Trigger orders`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.triggerOrder.requiredMessage:At least one trigger order is required`,
    placeholder: $localize`:@@productLabelProcessingAction.newProcessingAction.field.triggerOrder.placeholder:Type to search ...`,
    group: 'SECOND',
    // leftOnQuote: true
  },
  {
    id: 'WOMENS_COFFEE',
    field: 'womenShare',
    type: 'number',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.womenShare: Women's share`,
    group: 'FIRST',

  },
  // 'COMMENT': {
  //   field: 'comment',
  //   type: 'text',
  //   label: $localize`:@@productLabelProcessingAction.newProcessingAction.field
  // },
  {
    id: 'PRICE_FOR_OWNER',
    field: 'pricePerUnitForOwner',
    type: 'price',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.priceOwner:Price (USD) / kg for Owner`,
    placeholder: $localize`:@@productLabelProcessingAction.newProcessingAction.field.priceOwner.placeholder:Enter price`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.priceOwner.requiredMessage:Price is required`,
    group: 'SECOND'
  },
  {
    id: 'PRICE_FOR_BUYER',
    field: 'pricePerUnitForBuyer',
    type: 'price',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.priceBuyer:Price (EUR) / kg for Buyer`,
    placeholder: $localize`:@@productLabelProcessingAction.newProcessingAction.field.priceBuyer.placeholder:Enter price`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.priceBuyer.requiredMessage:Price is required`,
    group: 'SECOND',
    leftOnQuote: true
  },
  {
    id: 'EXC_RATE_AT_BUYER',
    field: 'exchangeRateAtBuyer',
    type: 'exchange_rate',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.rateBuyer:Exchange rate at Buyer (1 EUR = X RWF)`,
    placeholder: $localize`:@@productLabelProcessingAction.newProcessingAction.field.rateBuyer.placeholder:Enter rate`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.rateBuyer.requiredMessage:Rate is required`,
    group: 'SECOND',
    leftOnQuote: true
  },
  {
    id: 'PRICE_FOR_END_CUSTOMER',
    field: 'pricePerUnitForEndCustomer',
    type: 'price',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.priceEndCustomer:Price (EUR) / kg for End customer`,
    placeholder: $localize`:@@productLabelProcessingAction.newProcessingAction.field.priceEndCustomer.placeholder:Enter price`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.priceEndCustomer.requiredMessage:Price is required`,
    group: 'SECOND',
    leftOnQuote: true
  },
  {
    id: 'EXC_RATE_AT_END_CUSTOMER',
    field: 'exchangeRateAtEndCustomer',
    type: 'exchange_rate',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.rateEndCustomer:Exchange rate at End customer (1 EUR = X RWF)`,
    placeholder: $localize`:@@productLabelProcessingAction.newProcessingAction.field.rateEndCustomer.placeholder:Enter rate`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.rateEndCustomer.requiredMessage:Rate is required`,
    group: 'SECOND',
    leftOnQuote: true
  },
  {
    id: 'CUPPING_RESULT',
    field: 'cuppingResult',
    type: 'text',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.cuppingResult:Cupping results`,
    placeholder: $localize`:@@productLabelProcessingAction.newProcessingAction.field.cuppingResult.placeholder:Enter cupping result`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.cuppingResult.requiredMessage:Cupping result is required`,
    group: 'SECOND',
    leftOnQuote: true
  },
  {
    id: 'CUPPING_GRADE',
    field: 'cuppingGrade',
    type: 'string',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.cuppingGrade:Cupping score`,
    placeholder: $localize`:@@productLabelProcessingAction.newProcessingAction.field.cuppingGrade.placeholder:Enter cupping score`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.cuppingGrade.requiredMessage:Cupping score is required`,
    group: 'SECOND',
    leftOnQuote: true
  },
  {
    id: 'CUPPING_FLAVOUR',
    field: 'cuppingFlavour',
    type: 'text',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.cuppingFlavour:Cupping flavour`,
    placeholder: $localize`:@@productLabelProcessingAction.newProcessingAction.field.cuppingFlavour.placeholder:Enter cupping flavour`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.cuppingFlavour.requiredMessage:Cupping flavour is required`,
    group: 'SECOND',
    leftOnQuote: true
  },
  {
    id: 'ROASTING_DATE',
    field: 'roastingDate',
    type: 'date',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.roastingDate:Roasting date`,
    placeholder: $localize`:@@productLabelProcessingAction.newProcessingAction.field.roastingDate.placeholder:Enter roasting date`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.roastingDate.requiredMessage:Date is required`,
    group: 'SECOND',
    leftOnQuote: true
  },
  {
    id: 'ROASTING_PROFILE',
    field: 'roastingProfile',
    type: 'string',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.roastingProfile:Roasting profile`,
    placeholder: $localize`:@@productLabelProcessingAction.newProcessingAction.field.roastingProfile.placeholder:Enter roasting profile`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.roastingProfile.requiredMessage:Date is required`,
    group: 'SECOND',
    leftOnQuote: true
  },
  {
    id: 'SHIPPER_DETAILS',
    field: 'shipperDetails',
    type: 'string',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.shipperDetails:Shipper details`,
    placeholder: $localize`:@@productLabelProcessingAction.newProcessingAction.field.shipperDetails.placeholder:Enter shipper details`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.shipperDetails.requiredMessage:Shipper details are required`,
    group: 'SECOND',
    leftOnQuote: true
  },
  {
    id: 'CARRIER_DETAILS',
    field: 'carrierDetails',
    type: 'string',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.carrierDetails:Carrier details`,
    placeholder: $localize`:@@productLabelProcessingAction.newProcessingAction.field.carrierDetails.placeholder:Enter carrier details`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.carrierDetails.requiredMessage:Carrier details are required`,
    group: 'SECOND',
    leftOnQuote: true
  },
  {
    id: 'PORT_OF_LOADING',
    field: 'portOfLoading',
    type: 'string',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.portOfLoading:Port of loading`,
    placeholder: $localize`:@@productLabelProcessingAction.newProcessingAction.field.portOfLoading.placeholder:Enter port of loading`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.portOfLoading.requiredMessage:Port of loading is required`,
    group: 'SECOND',
    leftOnQuote: true
  },
  {
    id: 'PORT_OF_DISCHARGE',
    field: 'portOfDischarge',
    type: 'string',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.portOfDischarge:Port of discharge`,
    placeholder: $localize`:@@productLabelProcessingAction.newProcessingAction.field.portOfDischarge.placeholder:Enter port discharge`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.portOfDischarge.requiredMessage:Port of discharge is required`,
    group: 'SECOND',
    leftOnQuote: true
  },
  {
    id: 'LOCATION_OF_END_DELIVERY',
    field: 'locationOfEndDelivery',
    type: 'string',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.LocationOfEndDelivery:Location of end delivery`,
    placeholder: $localize`:@@productLabelProcessingAction.newProcessingAction.field.portOfDischarge.placeholder:Enter location`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.LocationOfEndDelivery.requiredMessage:Location is required`,
    group: 'SECOND',
    leftOnQuote: true
  },
  {
    id: 'SHIPPED_AT_DATE_FROM_ORIGIN_PORT',
    field: 'shippedAtDateFromOriginPort',
    type: 'date',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.shippedAtDateFromOriginPort:Shipped at date from origin port`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.shippedAtDateFromOriginPort.requiredMessage:Date is required`,
    group: 'SECOND',
    leftOnQuote: true
  },
  {
    id: 'ARRIVED_AT_DATE_TO_DESTINATION_PORT',
    field: 'arrivedAtDateToDestinationPort',
    type: 'date',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.field.arrivedAtDateToDestinationPort:Arrived at date to destination port`,
    requiredMessage: $localize`:@@productLabelProcessingAction.newProcessingAction.field.arrivedAtDateToDestinationPort.requiredMessage:Date is required`,
    group: 'SECOND',
    leftOnQuote: true
  },
]


export const codeToDocumentList: KeyFieldDescription[] = [
  {
    id: 'BILL_OF_LADING',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.billOfLading:Bill of lading`
  },
  {
    id: 'CEPAR_SLIP',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.ceparPayingSlip:CEPAR paying slip`
  },
  {
    id: 'CLIENT_INFORMATION',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.ClientInformation:Client information`
  },
  {
    id: 'CUPPING_FORM_REPORT',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.cuppingFormReport:Cupping form report`
  },
  {
    id: 'DELIVERY_NOTE_BUYER',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.deliveryNoteToBuyer:Delivery note to buyer`
  },
  {
    id: 'DELIVERY_NOTE_NAEB',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.deliveryNoteToNAEB:Delivery note to NAEB`
  },
  {
    id: 'DELIVERY_NOTE_ROASTER',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.deliveryNoteToRoaster:Delivery note to roaster`
  },
  {
    id: 'DRAINAGE_LABEL',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.drainageLabel:Drainage label`
  },
  {
    id: 'EXP_DOC_QUALITY_CERTIFICATE',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.exportDoc1QualityCertificate:Export Doc. 1 - Quality certificate`
  },
  {
    id: 'EXP_DOC_PHYTOSANITARY_CERT',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.exportDoc2PhitosanityCertificate:Export Doc. 2 - Phytosanitary certificate`
  },
  {
    id: 'EXT_DOC_WEIGHT_NOTE',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.exportDoc3WeightNote:Export Doc. 3 - Weight note`
  },
  {
    id: 'EXP_DOC_ORIGIN_CERT',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.exportDoc4OriginCertificate:Export Doc. 4 - Origin certificate`
  },
  {
    id: 'EXPORT_LOT_NUMBER',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.exportLotNumberDoc:Export lot number`
  },
  {
    id: 'FAIRTRADE_CERTIFICATE',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.fairtradeCertificate:Fairtrade certificate`
  },
  {
    id: 'FERMENTATION_LABEL',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.fermentationLabel:Fermentation label`
  },
  {
    id: 'HAND_SORTING_SHEET',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.handSortingSheet:Hand-sorting sheet`
  },
  {
    id: 'HULLING_REPORT',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.hullingReport:Hulling Report`
  },
  {
    id: 'INVOICE_BUYER_TO_CUST',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.invoiceBuyerToCustomer:Invoice: Buyer -> Customer`
  },
  {
    id: 'INVOICE_OWNER_TO_BUYER',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.invoiceOwnerToBuyer:Invoice: Owner -> Buyer`
  },
  {
    id: 'INVOICE_PRODUCER_TO_OWNER',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.invoiceProducerToOwner:Invoice: Producer -> Owner`
  },
  {
    id: 'INVOICE_ROASTER_TO_OWNER',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.invoiceRoasterToOwner:Invoice: Roaster -> Owner`
  },
  {
    id: 'INVOICE_SHIPPER_TO_OWNER',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.invoiceShipperToOwner:Invoice: Shipper -> Owner`
  },
  {
    id: 'INVOICE_STORAGE_TO_OWNER',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.invoiceStorageToOwner:Invoice: Storage -> Owner`
  },
  {
    id: 'LOT_LABEL_DOC',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.lotLabel:Lot label sticker`
  },
  {
    id: 'PURCHASE_SHEET',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.purchaseSheet:Purchase sheet`
  },
  {
    id: 'ROASTING_ORDER',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.roastingOrder:Roasting order`
  },
  {
    id: 'SAMPLE_DELIVERY_NOTE',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.sampleDeliveryNote:Sample delivery note`
  },
  {
    id: 'SAMPLE_DIALOGUE',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.sampleDialogue:Sample dialogue`
  },
  {
    id: 'STOCK_LEDGER',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.stockLedger:Stock ledger`
  },
  {
    id: 'WEIGHT_NOTE_ARR_HULLING',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.weightArrivalHullingStation:Weight note arrival hulling station`
  },
  {
    id: 'WEIGHT_TICKET_NAEB',
    label: $localize`:@@productLabelProcessingAction.newProcessingAction.document.weightTicketAtNAEB:Weight ticket at NAEB`
  },
]




export const codeToFieldInfo: Record<string, KeyFieldDescription> = {}
codeToFieldInfoList.forEach(x => codeToFieldInfo[x.id] = x)

export const codeToDocumentInfo: Record<string, KeyFieldDescription> = {}
codeToDocumentList.forEach(x => codeToDocumentInfo[x.id] = x)

@Injectable({
  providedIn: 'root'
})
export class DocumentTranslations {

  constructor() {
  }

  public translate(fieldOrDocumentId: string) {
    let fieldInfo = codeToFieldInfo[fieldOrDocumentId]
    if (fieldInfo) return fieldInfo.label
    fieldInfo = codeToDocumentInfo[fieldOrDocumentId]
    if (fieldInfo) return fieldInfo.label
    return fieldOrDocumentId
  }


}
