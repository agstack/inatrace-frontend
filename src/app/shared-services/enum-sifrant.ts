import { FormArray, FormGroup } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { PagedSearchResults } from 'src/interfaces/CodebookHelperService';
import { generateFormFromMetadata } from 'src/shared/utils';
import { GeneralSifrantService } from './general-sifrant.service';

export interface ApiEnumWithLabelString {
  id?: string,
  name?: string;
}


export class EnumSifrant extends GeneralSifrantService<ApiEnumWithLabelString> {
    constructor(
        private keys: string[],
        private keyTitle: (key: string) => string,
    ) {
        super();
        this.initializeCodebook();
    }

    _placeholder = $localize`:@@enumSifrant.placeholder:Select option ... `

    public placeholder() {
      return this._placeholder
    }

    public setPlaceholder(value: string) {
        this._placeholder = value;
    }

    public identifier(el: ApiEnumWithLabelString) {
        return el.id;
    }

    public textRepresentation(el: ApiEnumWithLabelString) {
        return el.name;
    }

    // public formGenerator() {
        // return (el: ApiEnumWithLabelString) => generateFormFromMetadata(ApiEnumWithLabelString.formMetadata(), el);
    // }

    // public addElement(arr: FormArray, el: ApiEnumWithLabelString): void {
    //     arr.push(this.formGenerator()(el) as FormGroup);
    //     arr.markAsDirty()
    // }

    public static fromObject(obj: any) {
        return new EnumSifrant(Object.keys(obj), key => obj[key]);
    }

    _rawSifrant = null;

    get rawSifrant() {
        return this._rawSifrant;
    }

    public makeQuery(key: string, params?: any): Observable<PagedSearchResults<ApiEnumWithLabelString>> {
        const lkey = key ? key.toLocaleLowerCase() : null
        return this.sifrant$.pipe(
            map((allChoices: PagedSearchResults<ApiEnumWithLabelString>) => {
                return {
                    results: allChoices.results.filter((x: ApiEnumWithLabelString) => lkey == null || x.name.toLocaleLowerCase().indexOf(lkey) >= 0),
                    offset: allChoices.offset,
                    limit: allChoices.limit,
                    totalCount: allChoices.totalCount
                }
            })
        )
    }

    public initializeEnumOptions() {
        this.sifrant$.subscribe((val: PagedSearchResults<ApiEnumWithLabelString>) => {
            this.enumOptions$.next(val.results)
        })
    }

    public initializeCodebook() {
        this.sifrant$ = this.sifrant$ || of(this.keys.map((key, i) => {
            return {
                id: key,
                name: this.keyTitle(key),
            } as ApiEnumWithLabelString;
        })).pipe(
            map((x: ApiEnumWithLabelString[]) => {
                return {
                    results: x,
                    offset: 0,
                    limit: x.length,
                    totalCount: x.length
                } as PagedSearchResults<ApiEnumWithLabelString>
            }),
            shareReplay(1)
        )
        this.initializeEnumOptions()
    }

    public isEnumFormControl(): boolean {
        return true;
    }

    public enumValueToObject(val: any, enumOptions: ApiEnumWithLabelString[]): ApiEnumWithLabelString {
        if (!enumOptions || enumOptions.length == 0) return null
        const res: ApiEnumWithLabelString = enumOptions.find(x => x.id === val);
        if (!res) return null;
        return {
            id: val,
            name: res.name
        } as ApiEnumWithLabelString
    }

    public objectToEnumValue(el: ApiEnumWithLabelString): any {
        return el.id
    }

}
