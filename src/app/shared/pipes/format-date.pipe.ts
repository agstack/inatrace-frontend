import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '@angular/common';
// import { LocalizationService } from 'src/app/directives/localization.service';

export type FormatDateStyle = 'date' | 'time' | 'datetime' | 'datetimedesc';

@Pipe({
    name: 'formatDate',
    standalone: false
})
export class FormatDatePipe implements PipeTransform {

    constructor(
      // private localizationService: LocalizationService
    ) {}
    transform(value: number | string | Date, style: FormatDateStyle = 'date'): any {
      return null // TODO
        // if (value == null) return null;
        // switch (style) {
        //     case "date":
        //         return formatDate(value, 'd. M. yyyy', this.localizationService.locale);
        //     case "time":
        //         return formatDate(value, 'H:mm', this.localizationService.locale);
        //     case "datetime":
        //         return formatDate(value, 'd. M. yyyy H:mm', this.localizationService.locale);
        //     case "datetimedesc":
        //         return formatDate(value, 'd. M. yyyy', this.localizationService.locale) + ' ob ' + formatDate(value, 'H:mm', this.localizationService.locale);
        // }
    }

}
