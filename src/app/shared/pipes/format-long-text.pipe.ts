import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formatLongText',
    standalone: false
})
export class FormatLongTextPipe implements PipeTransform {

  transform(value: string, length = 100): any {
    if (value && value.length > length) {
        return value.substring(0, length-3) + "...";
    } else {
        return value;
    }
  }

}
