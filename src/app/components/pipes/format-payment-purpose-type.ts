import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formatPaymentPurposeType',
    standalone: false
})
export class FormatPaymentPurposeTypePipe implements PipeTransform {

  transform(value: string): any {
    switch (value) {
      case 'ADVANCE_PAYMENT':
        return $localize`:@@paymentForm.paymentPurposeTypes.advancedPayment:Advanced payment`;
      case 'FIRST_INSTALLMENT':
        return $localize`:@@paymentForm.paymentPurposeTypes.firstInstallment:Cherry payment`;
      case 'SECOND_INSTALLMENT':
        return $localize`:@@paymentForm.paymentPurposeTypes.secondInstallment:Member bonus`;
      case 'WOMEN_PREMIUM':
        return $localize`:@@paymentForm.paymentPurposeTypes.womenPreminum:AF Women premium`;
      case 'INVOICE_PAYMENT':
        return $localize`:@@paymentForm.paymentPurposeTypes.invoicePayment:Invoice payment`;
      default:
        return '-';
    }
  }

}
