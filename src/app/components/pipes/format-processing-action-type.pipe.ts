import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formatProcessingActionType',
    standalone: false
})
export class FormatProcessingActionTypePipe implements PipeTransform {

  transform(value: string): any {
    switch (value) {
      case 'PROCESSING':
        return $localize`:@@formatProcessingActionType.processing:Processing`;
      case 'FINAL_PROCESSING':
        return $localize`:@@formatProcessingActionType.finalProcessing:Final processing`;
      case 'SHIPMENT':
        return $localize`:@@formatProcessingActionType.quote:Quote`;
      case 'TRANSFER':
        return $localize`:@@formatProcessingActionType.transfer:Transfer`;
      case 'GENERATE_QR_CODE':
        return $localize`:@@formatProcessingActionType.generateQrCode:Generate QR code`;
      default:
        return '-';
    }
  }

}
