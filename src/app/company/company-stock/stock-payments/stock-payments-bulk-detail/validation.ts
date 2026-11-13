import { UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { SimpleValidationScheme } from '../../../../../interfaces/Validation';
import { ApiBulkPayment } from '../../../../../api/model/apiBulkPayment';
import { ApiPayment } from '../../../../../api/model/apiPayment';
import { ApiStockOrder } from '../../../../../api/model/apiStockOrder';
import { ApiActivityProof } from '../../../../../api/model/apiActivityProof';
import { multiFieldValidator } from '../../../../../shared/validation';

function payingEqualOrLessThanBalance(control: UntypedFormGroup): ValidationErrors | null {

    // Paying and balance controls are required.
    if (!control.contains('balance') || !control.contains('paid')) {
        return { payingEqualOrLessThanBalance: true };
    }

    const balance = control.value && control.value['balance'];
    const paying = control.value && control.value['paid'];

    return Number(paying) > balance
        ? { payingEqualOrLessThanBalance: true }
        : null;
}


export const ApiBulkPaymentValidationScheme = {
    validators: [],
    fields: {
              additionalCost: {
                  validators: []
              },
              additionalCostDescription: {
                  validators: []
              },
              additionalProofs: {
                  validators: []
              },
              createdBy: {
                  validators: []
              },
              currency: {
                  validators: []
              },
              formalCreationDate: {
                  validators: [Validators.required]
              },
              id: {
                  validators: []
              },
              payingCompany: {
                  validators: [Validators.required]
              },
              payments: {
                  validators: []
              },
              paymentDescription: {
                  validators: [Validators.required]
              },
              paymentPurposeType: {
                  validators: [Validators.required]
              },
              receiptNumber: {
                  validators: [Validators.required]
              },
              totalAmount: {
                  validators: [Validators.required]
              },
    }
} as SimpleValidationScheme<ApiBulkPayment>;

export const ApiPaymentValidationScheme = {
    validators: [],
    fields: {
              amountPaidToTheCollector: {
                  validators: []
              },
              amount: {
                  validators: []
              },
              createdBy: {
                  validators: []
              },
              currency: {
                  validators: []
              },
              formalCreationTime: {
                  validators: []
              },
              id: {
                  validators: []
              },
              payingCompany: {
                  validators: []
              },
              paymentConfirmedAtTime: {
                  validators: []
              },
              paymentConfirmedByUser: {
                  validators: []
              },
              paymentPurposeType: {
                  validators: []
              },
              paymentStatus: {
                  validators: []
              },
              paymentType: {
                  validators: []
              },
              preferredWayOfPayment: {
                  validators: []
              },
              productionDate: {
                  validators: []
              },
              purchased: {
                  validators: []
              },
              receiptDocument: {
                  validators: []
              },
              receiptDocumentType: {
                  validators: []
              },
              receiptNumber: {
                  validators: []
              },
              recipientCompany: {
                  validators: []
              },
              recipientCompanyCustomer: {
                  validators: []
              },
              recipientType: {
                  validators: []
              },
              recipientUserCustomer: {
                  validators: []
              },
              representativeOfRecipientCompany: {
                  validators: []
              },
              representativeOfRecipientUserCustomer: {
                  validators: []
              },
              stockOrder: {
                  validators: []
              },
              totalPaid: {
                  validators: []
              },
              updatedBy: {
                  validators: []
              },
              updatedTimestamp: {
                  validators: []
              },
    }
} as SimpleValidationScheme<ApiPayment>;

export const ApiStockOrderValidationScheme = {
    validators: [
        multiFieldValidator(['balance', 'paid'], payingEqualOrLessThanBalance, ['payingEqualOrLessThanBalance']),
    ],
    fields: {
              activityProofs: {
                  validators: []
              },
              available: {
                  validators: []
              },
              availableQuantity: {
                  validators: []
              },
              balance: {
                  validators: []
              },
              comments: {
                  validators: []
              },
              company: {
                  validators: []
              },
              consumerCompanyCustomer: {
                  validators: []
              },
              cost: {
                  validators: []
              },
              createdBy: {
                  validators: []
              },
              creatorId: {
                  validators: []
              },
              currency: {
                  validators: []
              },
              damagedPriceDeduction: {
                  validators: []
              },
              deliveryTime: {
                  validators: []
              },
              facility: {
                  validators: []
              },
              fulfilledQuantity: {
                  validators: []
              },
              id: {
                  validators: []
              },
              identifier: {
                  validators: []
              },
              internalLotNumber: {
                  validators: []
              },
              isAvailable: {
                  validators: []
              },
              measureUnitType: {
                  validators: []
              },
              openOrder: {
                  validators: []
              },
              orderType: {
                  validators: []
              },
              organic: {
                  validators: []
              },
              otherEvidenceDocuments: {
                  validators: []
              },
              paid: {
                  validators: [Validators.min(0)]
              },
              preferredWayOfPayment: {
                  validators: []
              },
              pricePerUnit: {
                  validators: []
              },
              processingOrder: {
                  validators: []
              },
              producerUserCustomer: {
                  validators: []
              },
              productOrder: {
                  validators: []
              },
              productionDate: {
                  validators: []
              },
              productionLocation: {
                  validators: []
              },
              purchaseOrder: {
                  validators: []
              },
              quoteCompany: {
                  validators: []
              },
              quoteFacility: {
                  validators: []
              },
              representativeOfProducerUserCustomer: {
                  validators: []
              },
              requiredEvidenceFieldValues: {
                  validators: []
              },
              requiredEvidenceTypeValues: {
                  validators: []
              },
              sacNumber: {
                  validators: []
              },
              semiProduct: {
                  validators: []
              },
              tare: {
                  validators: []
              },
              totalGrossQuantity: {
                  validators: []
              },
              totalQuantity: {
                  validators: []
              },
              updateTimestamp: {
                  validators: []
              },
              updatedBy: {
                  validators: []
              },
              womenShare: {
                  validators: []
              },
    }
} as SimpleValidationScheme<ApiStockOrder>;

export const ApiActivityProofValidationScheme = {
    validators: [],
    fields: {
              document: {
                  validators: [Validators.required]
              },
              formalCreationDate: {
                  validators: [Validators.required]
              },
              id: {
                  validators: []
              },
              type: {
                  validators: [Validators.required]
              },
              validUntil: {
                  validators: []
              },
    }
} as SimpleValidationScheme<ApiActivityProof>;
