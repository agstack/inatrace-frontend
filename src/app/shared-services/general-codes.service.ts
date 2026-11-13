import { Injectable } from '@angular/core';
import {  ValidatorFn, UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { combineLatest, Observable, BehaviorSubject } from 'rxjs';
import { switchMap, map, tap, filter, distinctUntilChanged, shareReplay } from 'rxjs/operators';
import { isEqual } from 'lodash';
import { CodebookHelperService, PagedSearchResults } from 'src/interfaces/CodebookHelperService';



@Injectable({
  providedIn: 'root'
})
export class GeneralCodesService<T> implements CodebookHelperService<T>{

  constructor(
  ) {
  }

  insertNullPrefixResultIfNonEmpty = false
  public formGenerator(): (x: T, validators?: Array<ValidatorFn>) => UntypedFormGroup { //: (x: T, validators: Array<ValidatorFn>) => FormGroupTyped<T> | FormControl {
    throw new Error("Method not implemented.");
  }

  public initializeCodebook(): void {
    throw new Error("Method not implemented.");
  }

  public hasAutocomplete(): boolean {
    return true;
  }

  public limit(): number {
    return 10;
  }

  // makeQuery(key: string, params?: any): PagedSearchResults<T>,
  public makeQuery(key: string, params?: any): Observable<PagedSearchResults<T>> {
    throw new Error("Method not implemented.");
  }

  lastKey = null;

  public onTheFlyCodebook(key$: Observable<string>, selectedObjects$: Observable<Array<T>>, params$: Observable<any>): Observable<PagedSearchResults<T>> {
    return combineLatest(key$, selectedObjects$, params$).pipe(
      // map((val) => {
      //     if(!val[2]) return val;
      //     if(this.lastKey != val[0]) {
      //         let tmp = JSON.parse(JSON.stringify(val[2]))
      //         tmp.offset = 0
      //         return [val[0], val[1], tmp] as [string, Array<T>, any]
      //     }
      //     return val
      // }),
      distinctUntilChanged((prev, curr) => isEqual(prev, curr)),
      tap(val => {
        this.lastKey = val[0]
      }),
      switchMap((val) => {
        let pars = { ...val[2] }
        if (!pars.offset) {
          pars.offset = 0
        }
        if (!pars.limit) {
          pars.limit = this.limit()
        }
        return this.makeQuery(val[0], pars)
      })
    )
  }

  sifrant$: Observable<PagedSearchResults<T>> = null;
  enumOptions$: BehaviorSubject<T[]> = new BehaviorSubject<T[]>([])

  enumOptions(): BehaviorSubject<T[]> {
    return this.enumOptions$
  }


  public autocompleteCandidates(key$: Observable<string>, selectedObjects$: Observable<Array<T>>, params?: Observable<any>): Observable<PagedSearchResults<T>> {
    let paramStream$ = params;
    if (!paramStream$) {
      paramStream$ = new BehaviorSubject<any>(null)
    }
    let acomplete: Observable<PagedSearchResults<T>> = combineLatest(
      key$,
      this.onTheFlyCodebook(key$, selectedObjects$, paramStream$),
      selectedObjects$,
      (key: string, sifrant: PagedSearchResults<T>, selectedObjects: Array<T>) => {
        let choices = sifrant.results.filter((x: T) =>
          (this.allowDuplicateSelection()
          || !(selectedObjects.find(el => this.identifier(el) === this.identifier(x)))
          )
          // && this.textRepresentation(x).toLocaleLowerCase().startsWith(key.toLocaleLowerCase())
        )
        // if(this.canAddNew() && choices.length == 0) {
        //     return [null];
        // }
        if (this.insertNullPrefixResultIfNonEmpty && choices.length > 0) {
          choices.splice(0, 0, null)
        }
        return {
          results: choices,
          offset: sifrant && sifrant.offset ? sifrant.offset : 0,
          limit: sifrant ? sifrant.limit : 0,
          totalCount: sifrant ? sifrant.totalCount : 0
        };
      }
    )
    return acomplete;
  }

  autocompleteMinPrefix: number = 2;
  maxAllCandidates: number = 100

  public getAllCandidates(): Observable<Array<T>> {
    return this.makeQuery("",
      {
        offset: 0,
        limit: this.maxAllCandidates
      }
    ).pipe(
      map(x => x.results),
      shareReplay(1)
    )
  }

  public formatter(): (x: T) => string {
    return ((x: T) => this.textRepresentation(x));
  }
  public addElement(arr: UntypedFormArray, el: T): void {
    throw new Error("Method not implemented.");
  }
  public removeElement(arr: UntypedFormArray, index: number): void {
    arr.removeAt(index);
    arr.markAsDirty()
    arr.updateValueAndValidity()
  }
  // public makeEmpty(grp: FormGroupTyped<T>): void {
  //     throw new Error("Method not implemented.");
  // }
  // public isEmpty(grp: FormGroupTyped<T>): boolean {
  //     throw new Error("Method not implemented.");
  // }
  // public clearArray(arr: FormArrayTyped<T>): void {
  //     while(arr.length != 0) {
  //         arr.removeAt(0);
  //     }
  //     arr.markAsDirty();
  // }
  // public setArray(arr: FormArrayTyped<T>, arrt: T[]): void {
  //     throw new Error("Method not implemented.");
  // }
  public makeNewForInput(input: string): T {
    throw new Error("Method not implemented.");
  }
  // public isMultipleChoice(): boolean {
  //     return false;
  // }
  public allowDuplicateSelection(): boolean {
    return false;
  }

  public valid(model: T, input: string): boolean {
    if (!model) return false;
    return typeof this.identifier(model) != "undefined" && this.identifier(model) != null
  }

  public textRepresentation(el: T) {
    throw new Error("Method not implemented.");
    return "";
  }

  public identifier(el: T) {
    throw new Error("Method not implemented.");
  }

  public canAddNew() {
    return false;
  }

  public placeholder(): string {
    let placeholder = $localize`:@@generalCodes.input.placehoder:Select from codes ...`
    return placeholder
  }

  public pack(results: T[]): PagedSearchResults<T> {
    return {
      results: results,
      offset: 0,
      limit: results.length,
      totalCount: results.length
    }
  }

  public isEnumFormControl(): boolean {
    return false;
  }

  public enumValueToObject(val: any, enumOptions: T[]): T {
    throw new Error("Method not implemented.");
  }

  public objectToEnumValue(el: T): any {
    throw new Error("Method not implemented.");
  }
}
