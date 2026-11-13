import { UntypedFormArray, UntypedFormGroup, ValidatorFn } from '@angular/forms';
import { isEqual } from 'lodash';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { CodebookHelperService, PagedSearchResults } from 'src/interfaces/CodebookHelperService';

export class GeneralSifrantService<T> implements CodebookHelperService<T> {

    constructor() { }

    insertNullPrefixResultIfNonEmpty = false;
    lastKey = null;

    sifrant$: Observable<PagedSearchResults<T>> = null;
    enumOptions$: BehaviorSubject<T[]> = new BehaviorSubject<T[]>([]);

    autocompleteMinPrefix = 2;
    maxAllCandidates = 100;

    public formGenerator(): (x: T, validators?: Array<ValidatorFn>) => UntypedFormGroup {
        throw new Error('Method not implemented.');
    }

    public initializeCodebook(): void {
        throw new Error('Method not implemented.');
    }

    public hasAutocomplete(): boolean {
        return true;
    }

    public limit(): number {
        return 10;
    }

    public makeQuery(key: string, params?: any, organizationId?: string): Observable<PagedSearchResults<T>> {
        throw new Error('Method not implemented.');
    }

    public onTheFlyCodebook(key$: Observable<string>,
                            selectedObjects$: Observable<Array<T>>,
                            params$: Observable<any>,
                            organizationId?: string): Observable<PagedSearchResults<T>> {

        return combineLatest([key$, selectedObjects$, params$]).pipe(
            distinctUntilChanged((prev, curr) => isEqual(prev, curr)),
            tap(val => {
                this.lastKey = val[0];
            }),
            switchMap((val) => {
                const pars = { ...val[2] };
                if (!pars.offset) {
                    pars.offset = 0;
                }
                if (!pars.limit) {
                    pars.limit = this.limit();
                }
                return this.makeQuery(val[0], pars, organizationId);
            })
        );
    }

    enumOptions(): BehaviorSubject<T[]> {
        return this.enumOptions$;
    }

    public autocompleteCandidates(key$: Observable<string>,
                                  selectedObjects$: Observable<Array<T>>,
                                  params?: Observable<any>, organizationId?: string): Observable<PagedSearchResults<T>> {

        let paramStream$ = params;
        if (!paramStream$) {
            paramStream$ = new BehaviorSubject<any>(null);
        }
        return combineLatest(
            key$,
            this.onTheFlyCodebook(key$, selectedObjects$, paramStream$, organizationId),
            selectedObjects$,
            (key: string, sifrant: PagedSearchResults<T>, selectedObjects: Array<T>) => {
                const choices = sifrant.results.filter((x: T) =>
                        (this.allowDuplicateSelection()
                            || !(selectedObjects.find(el => this.identifier(el) === this.identifier(x)))
                        )
                );

                if (this.insertNullPrefixResultIfNonEmpty && choices.length > 0) {
                    choices.splice(0, 0, null);
                }

                return {
                    results: choices,
                    offset: sifrant && sifrant.offset ? sifrant.offset : 0,
                    limit: sifrant ? sifrant.limit : 0,
                    totalCount: sifrant ? sifrant.totalCount : 0
                };
            }
        );
    }

    public getAllCandidates(): Observable<Array<T>> {
        return this.makeQuery('',
            {
                offset: 0,
                limit: this.maxAllCandidates
            }
        ).pipe(
            map(x => x.results),
            shareReplay(1)
        );
    }

    public formatter(): (x: T) => string {
        return ((x: T) => this.textRepresentation(x));
    }
    public addElement(arr: UntypedFormArray, el: T): void {
        throw new Error('Method not implemented.');
    }
    public removeElement(arr: UntypedFormArray, index: number): void {
        arr.removeAt(index);
        arr.markAsDirty();
        arr.updateValueAndValidity();
    }

    public makeNewForInput(input: string): T {
        throw new Error('Method not implemented.');
    }

    public allowDuplicateSelection(): boolean {
        return false;
    }

    public valid(model: T, input: string): boolean {
        if (!model) { return false; }
        return typeof this.identifier(model) !== 'undefined' && this.identifier(model) != null;
    }

    public textRepresentation(el: T) {
        throw new Error('Method not implemented.');
        return '';
    }

    public identifier(el: T) {
        throw new Error('Method not implemented.');
    }

    public canAddNew() {
        return false;
    }

    public placeholder(): string {
        return $localize`:@@generalSifrant.input.placehoder:Select an option ...`;
    }

    public pack(results: T[]): PagedSearchResults<T> {
        return {
            results,
            offset: 0,
            limit: results.length,
            totalCount: results.length
        };
    }

    public isEnumFormControl(): boolean {
        return false;
    }

    public enumValueToObject(val: any, enumOptions: T[]): T {
        throw new Error('Method not implemented.');
    }

    public objectToEnumValue(el: T): any {
        throw new Error('Method not implemented.');
    }
}
