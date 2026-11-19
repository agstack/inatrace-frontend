import { ValidatorFn, UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { Observable, BehaviorSubject } from 'rxjs';

export interface PagedSearchResults<T> {
    results: T[];
    offset: number;
    limit: number;
    totalCount: number;
}

export interface CodebookHelperService<T> {
    autocompleteMinPrefix: number;
    maxAllCandidates: number;
    insertNullPrefixResultIfNonEmpty: boolean;
    hasAutocomplete(): boolean;
    autocompleteCandidates(key: Observable<string>, selectedObjects: Observable<T[]>, params?: Observable<any>, organizationId?: string): Observable<PagedSearchResults<T>>;
    makeQuery(key: string, params?: any, organizationId?: string): Observable<PagedSearchResults<T>>;
    getAllCandidates(): Observable<T[]>;
    initializeCodebook(): void;
    formatter(): (x:T) => string;
    addElement(arr: UntypedFormArray, el: T): void;
    removeElement(arr: UntypedFormArray, index: number): void;
    // makeEmpty(grp: FormGroupTyped<T>): void;
    // isEmpty(grp: FormGroupTyped<T>): boolean;
    // clearArray(arr: FormArrayTyped<T>): void;
    // setArray(arr: FormArrayTyped<T>, arrt: T[]): void;
    formGenerator(): (x: T, validators?: ValidatorFn[]) => UntypedFormGroup; // (x: T, validators: Array<ValidatorFn>) => FormGroupTyped<T> | FormControl;
    // isMultipleChoice(): boolean;
    allowDuplicateSelection(): boolean;
    valid(model: T, input: string): boolean;
    limit(): number;
    onTheFlyCodebook(key: Observable<string>, selectedObjects: Observable<T[]>, params: Observable<any>): Observable<PagedSearchResults<T>>;
    textRepresentation(el: T): string;
    identifier(el: T): any;
    canAddNew(): boolean;
    makeNewForInput(input: string): T;
    placeholder(): string;
    isEnumFormControl(): boolean;
    enumValueToObject(val: any, enumOptions: T[]): T;
    enumOptions(): BehaviorSubject<T[]>;
    objectToEnumValue(el: T): any;
}
