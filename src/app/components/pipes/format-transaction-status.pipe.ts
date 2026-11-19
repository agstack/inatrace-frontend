import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formatTransactionStatus',
    standalone: false
})
export class FormatTransactionStatusPipe implements PipeTransform {

  transform(value: string): any {
    return value
      // ? $localize`:@@transactionType.processing:Processing`
      // : $localize`:@@transactionType.genera:General`
  }


}
