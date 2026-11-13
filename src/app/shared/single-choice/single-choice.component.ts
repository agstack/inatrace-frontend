import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild, ElementRef, ChangeDetectionStrategy, AfterViewInit, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, merge, startWith, tap, shareReplay } from 'rxjs/operators';
import { CodebookHelperService, PagedSearchResults } from 'src/interfaces/CodebookHelperService';
import { SimpleValidationScheme } from 'src/interfaces/Validation';
import { isRequired, pripraviSifrant } from 'src/shared/utils';
import { UntypedFormControl } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';

@Component({
    selector: 'single-choice',
    templateUrl: './single-choice.component.html',
    styleUrls: ['./single-choice.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SingleChoiceComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input()
    label: string;

    @Input() supplierFeedback = false;

    @Input()
    forceAllInLowercase = false;

    @Input()
    markRequired?: boolean;

    private _formControl: UntypedFormControl = null;
    @Input() set formControlInput(value: UntypedFormControl) {
        this._formControl = value;
        if (value) {
            this.resubscribe()
        }
    }

    get formControlInput(): UntypedFormControl {
        return this._formControl;
    }

    private initialized = false;

    private _codebookService: CodebookHelperService<any>;
    @Input() set codebookService(value: CodebookHelperService<any>) {
      const changed = value !== this._codebookService;
      if (changed && this.supplierFeedback) {
        this.options = [];
      }
      this._codebookService = value;
      if (value) {
        this.resubscribe()
        // The emission must happen after resubscribe(), otherwise it either reaches the previous
        // subscription or is lost because the new one is not installed yet.
        if (changed && this.initialized && this.supplierFeedback) {
          this.typeahead$.next(null);
        }
      }
    }

    get codebookService(): CodebookHelperService<any> {
        return this._codebookService;
    }

    @Input()
    allowMultiple = false;

    @Input()
    enumChoices?: any;

    @Input()
    enumFormatter: (x: any) => string = null

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
    onChangeDistinctCallback?: () => void = null

    @Input()
    isInvalidChoice?: boolean = false;

    // @Input()
    // validationScheme: SimpleValidationScheme<any> = null;

    @Input()
    forbiddenElements: (val: any) => boolean = (val: any) => false

    @Input()
    showPagingInFooter = false

    supplierState: string = null;
    notFoundText: string = $localize`:@@ui.singleChoice.niIzbir.text:Nothing found`;
    private supplierStateSub: Subscription = null;

    private subscribeSupplierState(): void {
        if (this.supplierStateSub) {
            this.supplierStateSub.unsubscribe();
            this.supplierStateSub = null;
        }
        const state$ = this.supplierFeedback && this.codebookService
            ? (this.codebookService as any).supplierState$ : null;
        if (state$) {
            this.supplierStateSub = state$.subscribe((value: string) => this.supplierState = value);
        } else {
            this.supplierState = null;
        }
    }

    get supplierNotFoundText(): string {
        return this.notFoundText;
    }

    retrySupplierQuery() {
        this.options = [];
        this.resubscribeCodebook();
        this.typeahead$.next(null);
    }

    _value = null;
    @Input() set value(val: any) {
        this._value = val
        this.modelChoice = val;
    }

    get value(): any {
        return this._value;
    }

    @Input()
    autofocus = false

    @Input()
    noMargin = false

    iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    @ViewChild('ngSelect', { static: false }) ngSelect: NgSelectComponent;
    ngAfterViewInit() {
        if (this.autofocus) {
            setTimeout(() => {
                this.ngSelect.focus();
            });
        }
        if(this.iOS && this.ngSelect && this.ngSelect.element) {
            const el = this.ngSelect.element.querySelector('.ng-placeholder')
            el.setAttribute('style', 'padding-left: 0.5rem');    // iOS left padding hack
        }
    }

    @Input()
    useSimpleStyle = false

    @Input()
    skipItemId: number = null;

    @Input()
    organizationId: string = null;

    @Input()
    touchedOnBlur = false;

    @Output() onChange = new EventEmitter<any>();

    @Output() isActive = new EventEmitter<any>();

    options$: Observable<any[]> = null;
    options: any[] = []
    allOptions: any[] = []

    keys$: Observable<string> = null

    public modelChoice: any = null;   // corresponding model
    public modelChoiceArr: any[] = null;   // corresponding model

    constructor() {

    }

    autocompleteSelection$ = null
    selectedObjects$ = null;   // list of currently selected objects

    typeahead$: EventEmitter<string> = new EventEmitter<string>();

    isBooleanSelector() {
        return this.booleanTrue != null && this.booleanFalse != null;
    }

    valueSelectedObjects$ = new BehaviorSubject<any[]>([]);

    modelChoiceSubscription = null;
    optionsSubscription = null;

    pagingData$ = new BehaviorSubject<PagedSearchResults<any>>(null);
    pagingParams$ = new BehaviorSubject<any>(
        {
            offset: 0,
            limit: 10
        }
    )
    currentPaging = null

    resubscribeSub = null
    resubscribeCodebook() {
        if (this.formControlInput && this.value) {
            throw Error("Pri uporabi codebookService lahko uporabiš le enega izmed inputov formControl ali value")
        }

        if (this.formControlInput) {
            if (this.codebookService.isEnumFormControl()) {
                this.resubscribeSub = this.codebookService.enumOptions().subscribe(options => {
                    if (options) {
                        this.modelChoice = this.codebookService.enumValueToObject(this.formControlInput.value, options)
                        // setTimeout(() => this.resubscribeSub.unsubscribe(), 0)
                    }
                })
            } else {
                this.modelChoice = this.formControlInput.value;
            }
            if (this.modelChoiceSubscription) this.modelChoiceSubscription.unsubscribe();
            this.modelChoiceSubscription = this.formControlInput.valueChanges.subscribe(val => {
                if (this.codebookService.isEnumFormControl()) {
                    const sub = this.codebookService.enumOptions().subscribe(options => {
                        if (options) {
                            this.modelChoice = this.codebookService.enumValueToObject(val, options)
                            // sub.unsubscribe()
                        }
                    })
                } else {
                    this.modelChoice = this.formControlInput.value;
                }
                this.typeahead$.next(null)   // vedno počisti typeahead
            })

            if (this.codebookService.isEnumFormControl()) {
                this.selectedObjects$ = combineLatest(this.codebookService.enumOptions(), this.formControlInput.valueChanges,
                    (options: any[], val: any) => {
                        if (options) {
                            return this.codebookService.enumValueToObject(val, options)
                        } else {
                            return null
                        }
                    }
                ).pipe(
                    startWith(null),
                    shareReplay()
                )
            } else {
                this.selectedObjects$ = this.formControlInput.valueChanges.pipe(
                    startWith(this.formControlInput.value),
                    shareReplay()
                )
            }
        } else {
            this.modelChoice = this.value
            this.selectedObjects$ = this.valueSelectedObjects$
            this.valueSelectedObjects$.next(this.value ? [this.value] : [])
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
                if (this.showPagingInFooter) this.pagingData$.next(x)
            }),
            map(x => x.results),
            // merge(this.codebookService.getAllCandidates()),
            map(lst => lst.filter(x => this.forbiddenElements && !this.forbiddenElements(x)))
        )
        if (this.optionsSubscription) {
            this.optionsSubscription.unsubscribe()
        }
        this.optionsSubscription = this.autocompleteSelection$.subscribe((choices) => {
            setTimeout(() => this.options = choices);
        })
    }

    isRequired() {
        if (this.markRequired) {
            return true;
        }
        if (this.formControlInput) {
            return isRequired(this.formControlInput)
        }
        return false;
    }

    isDisabled() {
        if (this.formControlInput) {
            return this.formControlInput.enabled === false
        }
        return false
    }

    lastTypeaheadValue = null;

    resubscribeEnum() {
        this.allOptions = pripraviSifrant(this.enumChoices, this.forceAllInLowercase)
        if (!this.formControlInput) {
            throw Error("formControlInput ne sme biti null pri izbiri enumChoices")
        }
        const val = this.formControlInput.value

        if (this.allowMultiple) {
            this.modelChoiceArr = this.allOptions.filter(x => {
                if (val == null) return false;
                if (this.forceAllInLowercase) {
                    return val.map(v => v.toLocaleLowerCase()).includes(x.value.toLocaleLowerCase());
                }
                return val.includes(x.value);
            })
        } else {
            this.modelChoice = this.allOptions.find(x => {
                if (this.forceAllInLowercase) {
                    if (val == null) return false;
                    return x.value.toLocaleLowerCase() === (val as string).toLocaleLowerCase()
                }
                return x.value === val
            })
        }
        if (this.modelChoiceSubscription) {
            this.modelChoiceSubscription.unsubscribe();
        }
        this.modelChoiceSubscription = this.formControlInput.valueChanges.subscribe(val => {
            if (this.allowMultiple) {
                this.modelChoiceArr = this.allOptions.filter(x => val?.includes(x.value))
            } else {
                this.modelChoice = this.allOptions.find(x => x.value === val)
            }
        })
        if (this.optionsSubscription) {
            this.optionsSubscription.unsubscribe()
        }
        this.optionsSubscription = this.typeahead$.pipe(
            debounceTime(200),
            distinctUntilChanged()
        ).pipe(
            map(key => {
                const lkey = key ? key.toLocaleLowerCase() : ''
                return this.allOptions.filter(x => String(x.value).toLocaleLowerCase().indexOf(lkey) >= 0)
            }),
            startWith(this.allOptions)
        ).subscribe((choices) => {
            setTimeout(() => this.options = choices);
        })
    }

    resubscribeBoolean() {
        this.options = [
            this.booleanTrue,
            this.booleanFalse
        ]
        const val = this.formControlInput.value
        if (val === true) {
            this.modelChoice = this.options[0]
        } else if (val === false) {
            this.modelChoice = this.options[1]
        } else {
            this.modelChoice = null
        }
        if (this.modelChoiceSubscription) {
            this.modelChoiceSubscription.unsubscribe();
        }
        this.modelChoiceSubscription = this.formControlInput.valueChanges.subscribe(val => {
            if (val === true) {
                this.modelChoice = this.options[0]
            } else if (val === false) {
                this.modelChoice = this.options[1]
            } else {
                this.modelChoice = null
            }
        })
    }

    resubscribe() {
        this.subscribeSupplierState();
        if (this.codebookService) {
            this.resubscribeCodebook()
        } else if (this.enumChoices) {
            this.resubscribeEnum()
        } else if (this.isBooleanSelector()) {
            this.resubscribeBoolean()
        }
    }

    ngOnInit() {
        this.resubscribe()
        this.initialized = true;
        if (this.supplierFeedback && this.codebookService) {
            this.typeahead$.next(null);
        }
    }

    formatter(item: any) {
      if (this.skipItemId && item.id && item.id == this.skipItemId) return
        if (this.codebookService) {
            return this.codebookService.formatter()(item);
        } else if (this.enumChoices || this.isBooleanSelector()) {
            if (this.enumFormatter) {
                return this.enumFormatter(item)
            } else {
                return item.value || "Wrong formatter."
            }

        }
    }

    onChangeHandler(event) {
        if (!event) return;   // handled by onClear
        const lastValueId = this.modelChoice ? this.modelChoice.id : null
        const newValueId = event ? event.id : null

        if (this.formControlInput) {
            if (this.enumChoices || this.isBooleanSelector()) {
                if (event == null) {
                    this.formControlInput.setValue(null)
                } else if (event instanceof Array) {
                    this.formControlInput.setValue(event.map(e => e.value))
                } else {
                    this.formControlInput.setValue(event.value)
                }
            } else {
                if (this.codebookService && this.codebookService.isEnumFormControl()) {
                    this.formControlInput.setValue(this.codebookService.objectToEnumValue(event))
                } else {
                    this.formControlInput.setValue(event)
                }
            }
            this.formControlInput.markAsDirty()
        } else {
            this.valueSelectedObjects$.next(this.value ? [this.value] : [])
        }
        this.typeahead$.next(null)
        if (this.codebookService && this.codebookService.isEnumFormControl()) {
            this.onChange.next(this.codebookService.objectToEnumValue(event))
        } else {
            this.onChange.next(event)
        }
        if (newValueId != lastValueId && this.onChangeDistinctCallback) {
            this.onChangeDistinctCallback()
        }
    }

    onClear(event) {
        if (this.formControlInput) {
            this.formControlInput.setValue(null)
            this.formControlInput.markAsDirty()
        } else {
            this.modelChoice = null
        }
        this.typeahead$.next(null)
        this.onChange.next(null)
    }

    onBlur(event) {
        if (this.touchedOnBlur) this._formControl.markAsTouched();
        this.typeahead$.next(null)   // vedno počisti typeahead
        this.isActive.next(false)
    }

    onFocus(event) {
        this.typeahead$.next(null)
        this.isActive.next(true)
    }

    ngOnDestroy() {
        if (this.modelChoiceSubscription) {
            this.modelChoiceSubscription.unsubscribe();
        }
        if (this.optionsSubscription) {
            this.optionsSubscription.unsubscribe()
        }
    }

    min(x, y) {
        return Math.min(x, y)
    }

    isPagePrev() {
        const tmp = this.pagingData$.getValue()
        return tmp && tmp.offset > 0
    }

    isPageNext() {
        const tmp = this.pagingData$.getValue()
        return tmp && tmp.offset + tmp.limit < tmp.totalCount
    }

    onPagePrev() {
        const tmp = this.pagingData$.getValue()
        this.pagingParams$.next(
            {
                offset: Math.max(0, tmp.offset - tmp.limit),
                limit: tmp.limit
            }
        )
    }

    onPageNext() {
        const tmp = this.pagingData$.getValue()
        this.pagingParams$.next(
            {
                offset: Math.min(tmp.offset + tmp.limit, tmp.totalCount),
                limit: tmp.limit
            }
        )
    }

    resetPaging() {

    }
}
