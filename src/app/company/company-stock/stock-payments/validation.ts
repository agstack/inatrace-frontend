import { SimpleValidationScheme } from '../../../../interfaces/Validation';
import { ApiPayment } from '../../../../api/model/apiPayment';
import { UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { multiFieldValidator } from '../../../../shared/validation';
import PaymentPurposeTypeEnum = ApiPayment.PaymentPurposeTypeEnum;

function atLeastOnePayableTo(control: UntypedFormGroup): ValidationErrors | null {
    const toCompany = control.value && control.value['recipientCompany'];
    const toFarmer = control.value && control.value['recipientUserCustomer'];
    return toCompany == null && toFarmer == null
        ? { atLeastOnePayableTo: true }
        : null;
}

function onlyOnePayableTo(control: UntypedFormGroup): ValidationErrors | null {
    const toCompany = control.value && control.value['recipientOrganizationId'];
    const toFarmer = control.value && control.value['recipientUserCustomerId'];
    return toCompany != null && toFarmer != null
        ? { onlyOnePayableTo: true }
        : null;
}

function requireReceiptDocument(control: UntypedFormGroup): ValidationErrors | null {
    const paymentPurposeType = control.value && control.value['paymentPurposeType'];
    const receiptDocument = control.value && control.value['receiptDocument'];
    return paymentPurposeType === PaymentPurposeTypeEnum.FIRSTINSTALLMENT && !receiptDocument
        ? { required: true }
        : null;
}

export const ApiPaymentValidationScheme = {
    validators: [
        multiFieldValidator(['recipientCompany', 'recipientUserCustomer'], atLeastOnePayableTo, ['atLeastOnePayableTo']),
        multiFieldValidator(['recipientCompany', 'recipientUserCustomer'], onlyOnePayableTo, ['onlyOnePayableTo']),
        multiFieldValidator(['receiptDocument'], requireReceiptDocument, ['required'])
    ],
    fields: {
              amountPaidToTheCollector: {
                  validators: []
              },
              amount: {
                  validators: [Validators.required, Validators.min(0)]
              },
              createdBy: {
                  validators: []
              },
              currency: {
                  validators: [Validators.required]
              },
              formalCreationTime: {
                  validators: [Validators.required]
              },
              id: {
                  validators: []
              },
              payingCompany: {
                  validators: [Validators.required]
              },
              paymentConfirmedAtTime: {
                  validators: []
              },
              paymentConfirmedByUser: {
                  validators: []
              },
              paymentPurposeType: {
                  validators: [Validators.required]
              },
              paymentStatus: {
                  validators: []
              },
              paymentType: {
                  validators: [Validators.required]
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
                  validators: [Validators.required]
              },
              receiptNumber: {
                  validators: [Validators.required]
              },
              recipientCompany: {
                  validators: [/*Validators.required*/]
              },
              recipientCompanyCustomer: {
                  validators: []
              },
              recipientType: {
                  validators: [Validators.required]
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
                  validators: [Validators.required]
              },
              totalPaid: {
                  validators: []
              },
              updatedBy: {
                  validators: []
              },
    }
} as SimpleValidationScheme<ApiPayment>;
