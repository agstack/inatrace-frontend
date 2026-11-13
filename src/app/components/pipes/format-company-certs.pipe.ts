import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formatCompanyCerts',
    standalone: false
})
export class FormatCompanyCertsPipe implements PipeTransform {

  transform(value: string): any {
    switch (value) {
      case 'EU_ORGANIC':
        return $localize`:@@formatCompanyCerts.certificationTypes.EUorganic:EU Organic`
      case 'RAINFOREST_ALLIANCE':
        return $localize`:@@formatCompanyCerts.certificationTypes.rainforestAlliance:Rainforest Alliance`
      case 'CARBON_NEUTRAL':
        return $localize`:@@formatCompanyCerts.certificationTypes.carbonNeutral:Carbon Neutral`
      case 'FAIRTRADE':
        return $localize`:@@formatCompanyCerts.certificationTypes.fairtrade:Fairtrade`
      default:
        return "-"
    }
  }

}
