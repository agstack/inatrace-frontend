import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild, ElementRef } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, merge, startWith, tap, shareReplay } from 'rxjs/operators';
import { CodebookHelperService, PagedSearchResults } from 'src/interfaces/CodebookHelperService';
import { SimpleValidationScheme } from 'src/interfaces/Validation';
import { isRequired, pripraviSifrant } from 'src/shared/utils';
import { FormControl } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';

@Component({
    selector: 'single-choice',
    templateUrl: './single-choice.component.html',
    styleUrls: ['./single-choice.component.scss']
})
export class SingleChoiceComponent implements OnInit {
    @Input() set formControlInput(value: FormControl) {
        this._formControl = value;
        if (value) {
            this.resubscribe();
        }
    }

    get formControlInput(): FormControl {
        return this._formControl;
    }
    @Input() set codebookService(value: CodebookHelperService<any>) {
      this._codebookService = value;
      if (value) {
        this.resubscribe();
      }
    }

    get codebookService(): CodebookHelperService<any> {
        return this._codebookService;
    }
    @Input() set value(val: any) {
        this._value = val;
        this.modelChoice = val;
    }

    get value(): any {
        return this._value;
    }

    constructor() {

    }
    @Input()
    label: string;

    @Input()
    forceAllInLowercase = false;

    @Input()
    markRequired?: boolean;

    private _formControl: FormControl = null;

    private _codebookService: CodebookHelperService<any>;

    @Input()
    allowMultiple = false;

    @Input()
    enumChoices?: any;

    @Input()
    enumFormatter: (x: any) => string = null;

    @Input()
    booleanTrue: any = null;

    @Input()
    booleanFalse: any = null;

    @Input()
    enumPlaceholder?: string;

    @Input()
    clearable = true;

    @Input()
    readonly = false;

    @Input()
    headerTemplate?: TemplateRef<any>;

    @Input()
    onChangeDistinctCallback?: () => void = null;

    @Input()
    isInvalidChoice = false;

    @Input()
    showPagingInFooter = false;

    _value = null;

    @Input()
    autofocus = false;

    @Input()
    noMargin = false;

    iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    @ViewChild('ngSelect', { static: false }) ngSelect: NgSelectComponent;

    @Input()
    useSimpleStyle = false;

    @Input()
    skipItemId: number = null;

    @Input()
    organizationId: string = null;

    @Input()
    touchedOnBlur = false;

    @Output() onChange = new EventEmitter<any>();

    @Output() isActive = new EventEmitter<any>();

    options$: Observable<Array<any>> = null;
    options: Array<any> = null;
    allOptions: Array<any> = null;

    keys$: Observable<string> = null;

    public modelChoice: any = null;   // corresponding model
    public modelChoiceArr: any[] = null;   // corresponding model

    autocompleteSelection$ = null;
    selectedObjects$ = null;   // list of currently selected objects

    typeahead$: EventEmitter<string> = new EventEmitter<string>();

    valueSelectedObjects$ = new BehaviorSubject<Array<any>>([]);

    modelChoiceSubscription = null;
    optionsSubscription = null;

    pagingData$ = new BehaviorSubject<PagedSearchResults<any>>(null);
    pagingParams$ = new BehaviorSubject<any>(
        {
            offset: 0,
            limit: 10
        }
    );
    currentPaging = null;

    resubscribeSub = null;

    lastTypeaheadValue = null;

    // @Input()
    // validationScheme: SimpleValidationScheme<any> = null;

    @Input()
    forbiddenElements: (val: any) => boolean = (val: any) => false
    ngAfterViewInit() {
        if (this.autofocus) {
            setTimeout(() => {
                this.ngSelect.focus();
            });
        }
        if (this.iOS && this.ngSelect && this.ngSelect.element) {
            const el = this.ngSelect.element.querySelector('.ng-placeholder');
            el.setAttribute('style', 'padding-left: 0.5rem');    // iOS left padding hack
        }
    }

    isBooleanSelector() {
        return this.booleanTrue != null && this.booleanFalse != null;
    }
    resubscribeCodebook() {
        if (this.formControlInput && this.value) {
            throw Error('Pri uporabi codebookService lahko uporabiš le enega izmed inputov formControl ali value');
        }

        if (this.formControlInput) {
            if (this.codebookService.isEnumFormControl()) {
                this.resubscribeSub = this.codebookService.enumOptions().subscribe(options => {
                    if (options) {
                        this.modelChoice = this.codebookService.enumValueToObject(this.formControlInput.value, options);
                        // setTimeout(() => this.resubscribeSub.unsubscribe(), 0)
                    }
                });
            } else {
                this.modelChoice = this.formControlInput.value;
            }
            if (this.modelChoiceSubscription) { this.modelChoiceSubscription.unsubscribe(); }
            this.modelChoiceSubscription = this.formControlInput.valueChanges.subscribe(val => {
                if (this.codebookService.isEnumFormControl()) {
                    const sub = this.codebookService.enumOptions().subscribe(options => {
                        if (options) {
                            this.modelChoice = this.codebookService.enumValueToObject(val, options);
                            // sub.unsubscribe()
                        }
                    });
                } else {
                    this.modelChoice = this.formControlInput.value;
                }
                this.typeahead$.next(null);   // vedno počisti typeahead
            });

            if (this.codebookService.isEnumFormControl()) {
                this.selectedObjects$ = combineLatest(this.codebookService.enumOptions(), this.formControlInput.valueChanges,
                    (options: any[], val: any) => {
                        if (options) {
                            return this.codebookService.enumValueToObject(val, options);
                        } else {
                            return null;
                        }
                    }
                ).pipe(
                    startWith(null),
                    shareReplay()
                );
            } else {
                this.selectedObjects$ = this.formControlInput.valueChanges.pipe(
                    startWith(this.formControlInput.value),
                    shareReplay()
                );
            }
        } else {
            this.modelChoice = this.value;
            this.selectedObjects$ = this.valueSelectedObjects$;
            this.valueSelectedObjects$.next(this.value ? [this.value] : []);
        }


        this.autocompleteSelection$ = this.codebookService.autocompleteCandidates(
            this.typeahead$.pipe(
                debounceTime(200),
                distinctUntilChanged()
            ),
            this.selectedObjects$.pipe(map(x => [])),   // Ne odstranjujemo selectanih v single-choice
            this.pagingParams$,
            this.organizationId
        ).pipe(
            tap(x => {
                if (this.showPagingInFooter) { this.pagingData$.next(x); }
            }),
            map(x => x.results),
            // merge(this.codebookService.getAllCandidates()),
            map(lst => lst.filter(x => this.forbiddenElements && !this.forbiddenElements(x)))
        );
        if (this.optionsSubscription) {
            this.optionsSubscription.unsubscribe();
        }
        this.optionsSubscription = this.autocompleteSelection$.subscribe((choices) => {
            this.options = choices;
        });
    }

    isRequired() {
        if (this.markRequired) {
            return true;
        }
        if (this.formControlInput) {
            return isRequired(this.formControlInput);
        }
        return false;
    }

    isDisabled() {
        if (this.formControlInput) {
            return this.formControlInput.enabled === false;
        }
        return false;
    }

    resubscribeEnum() {
        this.allOptions = pripraviSifrant(this.enumChoices, this.forceAllInLowercase);
        if (!this.formControlInput) {
            throw Error('formControlInput ne sme biti null pri izbiri enumChoices');
        }
        const val = this.formControlInput.value;

        if (this.allowMultiple) {
            this.modelChoiceArr = this.allOptions.filter(x => {
                if (val == null) { return false; }
                if (this.forceAllInLowercase) {
                    return val.map(v => v.toLocaleLowerCase()).includes(x.value.toLocaleLowerCase());
                }
                return val.includes(x.value);
            });
        } else {
            this.modelChoice = this.allOptions.find(x => {
                if (this.forceAllInLowercase) {
                    if (val == null) { return false; }
                    return x.value.toLocaleLowerCase() === (val as string).toLocaleLowerCase();
                }
                return x.value === val;
            });
        }
        if (this.modelChoiceSubscription) {
            this.modelChoiceSubscription.unsubscribe();
        }
        this.modelChoiceSubscription = this.formControlInput.valueChanges.subscribe(val => {
            if (this.allowMultiple) {
                this.modelChoiceArr = this.allOptions.filter(x => val?.includes(x.value));
            } else {
                this.modelChoice = this.allOptions.find(x => x.value === val);
            }
        });
        if (this.optionsSubscription) {
            this.optionsSubscription.unsubscribe();
        }
        this.optionsSubscription = this.typeahead$.pipe(
            debounceTime(200),
            distinctUntilChanged()
        ).pipe(
            map(key => {
                const lkey = key ? key.toLocaleLowerCase() : '';
                return this.allOptions.filter(x => String(x.value).toLocaleLowerCase().indexOf(lkey) >= 0);
            }),
            startWith(this.allOptions)
        ).subscribe((choices) => {
            this.options = choices;
        });
    }

    resubscribeBoolean() {
        this.options = [
            this.booleanTrue,
            this.booleanFalse
        ];
        const val = this.formControlInput.value;
        if (val === true) {
            this.modelChoice = this.options[0];
        } else if (val === false) {
            this.modelChoice = this.options[1];
        } else {
            this.modelChoice = null;
        }
        if (this.modelChoiceSubscription) {
            this.modelChoiceSubscription.unsubscribe();
        }
        this.modelChoiceSubscription = this.formControlInput.valueChanges.subscribe(val => {
            if (val === true) {
                this.modelChoice = this.options[0];
            } else if (val === false) {
                this.modelChoice = this.options[1];
            } else {
                this.modelChoice = null;
            }
        });
    }

    resubscribe() {
        if (this.codebookService) {
            this.resubscribeCodebook();
        } else if (this.enumChoices) {
            this.resubscribeEnum();
        } else if (this.isBooleanSelector()) {
            this.resubscribeBoolean();
        }
    }

    ngOnInit() {
        this.resubscribe();
    }

    formatter(item: any) {
      if (this.skipItemId && item.id && item.id == this.skipItemId) { return; }
      if (this.codebookService) {
            return this.codebookService.formatter()(item);
        } else if (this.enumChoices || this.isBooleanSelector()) {
            if (this.enumFormatter) {
                return this.enumFormatter(item);
            } else {
                return item.value || 'Wrong formatter.';
            }

        }
    }

    onChangeHandler(event) {
        if (!event) { return; }   // handled by onClear
        const lastValueId = this.modelChoice ? this.modelChoice.id : null;
        const newValueId = event ? event.id : null;

        if (this.formControlInput) {
            if (this.enumChoices || this.isBooleanSelector()) {
                if (event == null) {
                    this.formControlInput.setValue(null);
                } else if (event instanceof Array) {
                    this.formControlInput.setValue(event.map(e => e.value));
                } else {
                    this.formControlInput.setValue(event.value);
                }
            } else {
                if (this.codebookService && this.codebookService.isEnumFormControl()) {
                    this.formControlInput.setValue(this.codebookService.objectToEnumValue(event));
                } else {
                    this.formControlInput.setValue(event);
                }
            }
            this.formControlInput.markAsDirty();
        } else {
            this.valueSelectedObjects$.next(this.value ? [this.value] : []);
        }
        this.typeahead$.next(null);
        if (this.codebookService && this.codebookService.isEnumFormControl()) {
            this.onChange.next(this.codebookService.objectToEnumValue(event));
        } else {
            this.onChange.next(event);
        }
        if (newValueId != lastValueId && this.onChangeDistinctCallback) {
            this.onChangeDistinctCallback();
        }
    }

    onClear(event) {
        if (this.formControlInput) {
            this.formControlInput.setValue(null);
            this.formControlInput.markAsDirty();
        } else {
            this.modelChoice = null;
        }
        this.typeahead$.next(null);
        this.onChange.next(null);
    }

    onBlur(event) {
        if (this.touchedOnBlur) { this._formControl.markAsTouched(); }
        this.typeahead$.next(null);   // vedno počisti typeahead
        this.isActive.next(false);
    }

    onFocus(event) {
        this.typeahead$.next(null);
        this.isActive.next(true);
    }

    ngOnDestroy() {
        if (this.modelChoiceSubscription) {
            this.modelChoiceSubscription.unsubscribe();
        }
        if (this.optionsSubscription) {
            this.optionsSubscription.unsubscribe();
        }
    }

    min(x, y) {
        return Math.min(x, y);
    }

    isPagePrev() {
        const tmp = this.pagingData$.getValue();
        return tmp && tmp.offset > 0;
    }

    isPageNext() {
        const tmp = this.pagingData$.getValue();
        return tmp && tmp.offset + tmp.limit < tmp.totalCount;
    }

    onPagePrev() {
        const tmp = this.pagingData$.getValue();
        this.pagingParams$.next(
            {
                offset: Math.max(0, tmp.offset - tmp.limit),
                limit: tmp.limit
            }
        );
    }

    onPageNext() {
        const tmp = this.pagingData$.getValue();
        this.pagingParams$.next(
            {
                offset: Math.min(tmp.offset + tmp.limit, tmp.totalCount),
                limit: tmp.limit
            }
        );
    }

    resetPaging() {

    }
}
