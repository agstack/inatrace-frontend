import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'listFilter',
    standalone: false
})
export class ListFilterPipe<T> implements PipeTransform {
    transform(list: T[], key: string, match: string, multiplicity: 'MULTI'): T[];
    transform(list: T[], key: string, match: string, multiplicity: 'SINGLE'): T;

    transform(list: T[], key: string, match: string, multiplicity: 'MULTI' | 'SINGLE' = 'MULTI'): T[] | T {
        const filtered = (list || []).filter(obj => new RegExp('^' + match + '$', 'gi').test(obj[key]));
        if (multiplicity === 'MULTI') return filtered;
        return filtered.length > 0 ? filtered[0] : null;
    }
}
