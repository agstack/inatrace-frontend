import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formatProcessingEvidenceFieldType',
    standalone: false
})
export class FormatProcessingEvidenceFieldTypePipe implements PipeTransform {

  transform(value: string): any {
    switch (value) {
      case 'STRING':
        return $localize`:@@processingEvidenceFieldType.string:String`;
      case 'TEXT':
        return $localize`:@@processingEvidenceFieldType.text:Text`;
      case 'NUMBER':
        return $localize`:@@processingEvidenceFieldType.number:Number`;
      case 'INTEGER':
        return $localize`:@@processingEvidenceFieldType.integer:Integer`;
      case 'DATE':
        return $localize`:@@processingEvidenceFieldType.date:Date`;
      case 'OBJECT':
        return $localize`:@@processingEvidenceFieldType.object:Object`;
      case 'ARRAY':
        return $localize`:@@processingEvidenceFieldType.array:Array`;
      case 'PRICE':
        return $localize`:@@processingEvidenceFieldType.price:Price`;
      case 'EXCHANGE_RATE':
        return $localize`:@@processingEvidenceFieldType.exchange_rate:Exchange rate`;
      case 'TIMESTAMP':
        return $localize`:@@processingEvidenceFieldType.timestamp:Timestamp`;
      case 'FILE':
        return $localize`:@@processingEvidenceFieldType.file:File`;
      default:
        return '-';
    }
  }
}
