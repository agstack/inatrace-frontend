import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formatPaymentStatus',
    standalone: false
})
export class FormatPaymentStatusPipe implements PipeTransform {

  transform(value: string): any {
    switch (value) {
      case 'CONFIRMED':
        return $localize`:@@productLabelStock.filter.paymentStatus.confirmed:Confirmed`;
      case 'UNCONFIRMED':
        return $localize`:@@productLabelStock.filter.paymentStatus.unconfirmed:Unconfirmed`;
      default:
        return '-';
    }
  }

}
