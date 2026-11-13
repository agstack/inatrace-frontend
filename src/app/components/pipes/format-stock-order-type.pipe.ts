import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formatStockOrderType',
    standalone: false
})
export class FormatStockOrderTypePipe implements PipeTransform {

  transform(value: string): any {
    switch (value) {
      case 'GENERAL_ORDER':
        return $localize`:@@stockOrderTypePipe.quoteOrder: QUO`;
      case 'PROCESSING_ORDER':
        return $localize`:@@stockOrderTypePipe.processingOrder: PRO`;
      case 'PURCHASE_ORDER':
        return $localize`:@@stockOrderTypePipe.purchaseOrder: PO`;
      case 'TRANSFER_ORDER':
        return $localize`:@@stockOrderTypePipe.transferOrder: TO`;
      default:
        return '-';
    }
  }

}
