import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'default',
    standalone: false
})
export class DefaultPipe<T> implements PipeTransform {

    transform(value: T | null | undefined, defaultValue: T): T {
        // value == null matches both null and undefined
        return value != null ? value : defaultValue;
    }

}
