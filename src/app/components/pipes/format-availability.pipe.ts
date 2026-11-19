import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formatAvailability',
    standalone: false
})
export class FormatAvailabilityPipe implements PipeTransform {

  transform(value: boolean): string {
    return value
      ? $localize`:@@stockOrderAvailability.available:Available`
      : $localize`:@@stockOrderAvailability.notAvailable:Not available`;
  }

}
