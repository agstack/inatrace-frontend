import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formatTransactionType',
    standalone: false
})
export class FormatTransactionTypePipe implements PipeTransform {

  transform(value: boolean): any {
    return value
      ? $localize`:@@transactionType.processing:Processing`
      : $localize`:@@transactionType.genera:General`
  }


}
