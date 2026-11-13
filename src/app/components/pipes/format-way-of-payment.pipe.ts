import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formatWayOfPayment',
    standalone: false
})
export class FormatWayOfPaymentPipe implements PipeTransform {

  transform(value: string): string {
    switch (value) {
      case 'CASH':
        return $localize`:@@wayOfPaymentPipe.cash: Cash`;
      case 'CASH_VIA_COLLECTOR':
        return $localize`:@@wayOfPaymentPipe.cashViaCollector: Cash via collector`;
      case 'BANK_TRANSFER':
        return $localize`:@@wayOfPaymentPipe.bankTransfer: Bank transfer`;
      case 'CHEQUE':
        return $localize`:@@preferredWayOfPayment.cheque: Cheque`;
      case 'OFFSETTING':
        return $localize`:@@preferredWayOfPayment.offsetting: Offsetting`;
      case 'UNKNOWN':
        return $localize`:@@wayOfPaymentPipe.unknown: Unknown`;
      default:
        return '-';
    }
  }

}
