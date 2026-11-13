import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formatProcessingEvidenceTypeType',
    standalone: false
})
export class FormatProcessingEvidenceTypeTypePipe implements PipeTransform {

  transform(value: string): any {
    switch (value) {
      case 'DOCUMENT':
        return $localize`:@@processingEvidenceTypeType.document:Document`
      case 'FIELD':
        return $localize`:@@processingEvidenceTypeType.field:Field`
      case 'CALCULATED':
        return $localize`:@@processingEvidenceTypeType.calculated:Calculated`
      default:
        return "-"
    }
  }


}
