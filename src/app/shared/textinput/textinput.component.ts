import { Component, Input, OnInit, ViewChildren, ViewChild, Output, EventEmitter, Optional, Host, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl, AbstractControl, UntypedFormArray } from '@angular/forms';
import cloneDeep from 'lodash/cloneDeep';
import { NgbModalImproved } from 'src/app/core/ngb-modal-improved/ngb-modal-improved.service';
import { TextinputModalComponent } from '../textinput-modal/textinput-modal.component';
import { BehaviorSubject, combineLatest, Subscription, Subject, merge, of, Observable } from 'rxjs';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { map, shareReplay, startWith, distinctUntilChanged, filter, debounceTime, delay } from 'rxjs/operators';
import { CodebookHelperService } from 'src/interfaces/CodebookHelperService';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { uuidv4 } from 'src/shared/utils';
import { ClosableComponent } from '../closable/closable.component';

@Component({
    selector: 'textinput',
    templateUrl: './textinput.component.html',
    styleUrls: ['./textinput.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class TextinputComponent implements OnInit {

  @ViewChild('inputfield') input: ElementRef;

  @Input()
  label: string;

  @Input()
  htmlLabel: string;

  _form = null;
  @Input() set form(value: UntypedFormControl) {
    this._form = value;
    if (value) {
      this.resubscribe();
    }
  }

  get form(): UntypedFormControl {
    return this._form;
  }

  @Input()
  value: any;

  @Input()
  valueTextInput = false;

  @Input()
  editableLanguages = ['sl'];

  @Input()
  showTranslatedOnly = true;

  @Input()
  codebookService?: CodebookHelperService<any>;

  @Input()
  organizationId?: string = null;

  @Input()
  autocompleteSearchAdditionalParams?: any;

  @Input()
  autocompleteHeaderText = null

  @Input()
  autocomplete = 'off';
  @Input()
  type = 'text';
  @Input()
  step;
  @Input()
  min;

  @Input()
  hideLabel = false;

  @Input()
  placeholder = '';

  @Input()
  resultFormatter = (value: any) => value

  @Input()
  inputFormatter = (value: any) => value

  @Input()
  showInputField = true;

  @Input()
  helpText: string = null;

  @Input()
  prefix: string | null = null;

  @Input()
  suffix: string | null = null;

  @Input()
  smallInput = false;

  @Output() onKeyUpEnter = new EventEmitter<any>();
  @Output() onFocus = new EventEmitter<any>();
  @Output() onBlur = new EventEmitter<any>();

  autocompleteSearchAdditionalParams$ = new BehaviorSubject<any>(null)

  private _languageFormArray: UntypedFormArray;

  @Input() set languageFormArray(value: UntypedFormArray) {
    this._languageFormArray = value;
    if (value) {
      this.resubscribe()
    }
  }

  get languageFormArray(): UntypedFormArray {
    return this._languageFormArray;
  }

  @Input()
  textarea?: boolean = false;

  @Input()
  rows?: number = 5;

  @Input()
  id: string = uuidv4();

  @Input()
  modal?: boolean = false;

  @Input()
  modalTitle?: string;

  @Input()
  counter: boolean = false;

  @Input()
  autosize: boolean = false;

  @Input()
  isInvalid?: boolean = false;

  @Input()
  biggerTextInput: boolean = false;

  @Input()
  withoutBorder: boolean = false;

  @Input()
  searchInput: boolean = false;

  @Input()
  markRequired?: boolean;

  @Input()
  hideAsterisk: boolean = false;

  @Input()
  maxLength?: number;

  @Input()
  hideCounterForModalView?: boolean = false;

  @Input()
  disabled: boolean = false;

  @Input()
  autofocus = false

  @Input()
  readOnly: boolean = false

  @Output() itemMatching = new EventEmitter<any>();

  @Output() isActive = new EventEmitter<any>();

  // @Input()
  // forceNumeric?: boolean = false;

  public model: string = null;

  showAll: boolean = false;

  constructor(
    private modalService: NgbModalImproved,
    public globalEventsManager: GlobalEventManagerService,
    @Optional() @Host() public closable: ClosableComponent
  ) { }

  numericError: boolean = false;

  languages() {
    return this.globalEventsManager.languages()
  }

  pushToFormControlSubscription: Subscription = null;


  pushAutocompleteParameters() {
    if (this.autocompleteSearchAdditionalParams) {
      this.autocompleteSearchAdditionalParams$.next(this.autocompleteSearchAdditionalParams)
    }
  }
  onFocusHandler(event) {
    if (this.typeaheadEnabled()) {
      this.focus$.next(event.target.value)
      this.pushAutocompleteParameters()
    }
    this.isActive.next(true)
    this.onFocus.next(event)
  }

  onBlurHandler(event) {
    this.isActive.next(false)
    this.onBlur.next(event)
    if (this.typeaheadEnabled()) {
      this.instance.dismissPopup()
    }
    if (this.forceNumeric()) {
      this.model = this.formatNumber(this.form.value)  // resetiraj
      this.inputfield.first.nativeElement.value = this.model
    }
  }

  labelClosedIndicator = !this.showInputField
  closableSub: Subscription
  closableSub2: Subscription
  ngOnInit() {
    if (this.closable && this.closable.mode === 'intelligent') {
      this.closable.form = this.form
      this.showInputField = !this.closable.controlledHideField$.value
      this.labelClosedIndicator = this.closable.hideField$.value
      this.closableSub = this.closable.controlledHideField$.subscribe(val => {
        this.showInputField = !val
      });
      this.closableSub2 = this.closable.hideField$.subscribe(val => {
        this.labelClosedIndicator = val
      })

    }
    if (this.autofocus) {
      setTimeout(() => { this.inputfield.first.nativeElement.focus() }, 500)
    }
    if (!this.textarea && this.forceNumeric()) {
      this.model = this.formatNumber(this.form.value)
    }
    if (this.typeaheadEnabled()) {
      this.pushAutocompleteParameters()
      if (this.pushToFormControlSubscription) this.pushToFormControlSubscription.unsubscribe()
      this.pushToFormControlSubscription = this.input$.subscribe(x => {
        this.form.setValue(x);
        this.form.markAsDirty()
      })
    }
  }

  toggleShowAll() {
    this.showAll = !this.showAll;
  }

  forceNumeric(): boolean {
    if (!this.form || !this.form.validator) return false;
    const validator = this.form.validator({} as AbstractControl);
    if (validator && validator.NaN) {
      return true
    }
    return false
  }


  itemSelected = null;

  selectedItem(event: any) {
    this.itemSelected = true;
    this.form.setValue(event.item)
    this.form.markAsDirty()
    this.itemMatching.next(event.item)
  }

  formatNumber(value, locale = 'sl-SI', useGrouping = false) {
    // uporabljamo samo slovenski locale, t.j. decimalna vejica in . kot separator tisočic.
    if (value === null) return ''
    return new Intl.NumberFormat(locale, { useGrouping: useGrouping, minimumSignificantDigits: 1 }).format(value)
  }

  decimalSeparator(locale = "sl-SI") {
    const example = Intl.NumberFormat(locale).format(1.1);
    return example.charAt(1)
  }

  thousandsSeparator(locale = "sl-SI") {
    let sep = this.decimalSeparator(locale)
    return sep === '.' ? ',' : '.'
  }

  parseNumber(value, locale = "sl-SI") {
    if (value.trim() === '') return null
    let sep = this.decimalSeparator(locale)
    let sep1000 = this.thousandsSeparator(locale)
    if (value.indexOf(sep1000) >= 0) return NaN
    let cleaned1000 = value.replace(sep1000, '')
    const normalized = cleaned1000.replace(sep, '.');
    // return parseFloat(normalized);
    return Number(normalized)
  }

  onChange(event) {
    // used only if forceNumeric() = true
    // this.model = event; // - model se bo nastavil preko subscriptiona

    this.numericError = false
    // if(typeof this.model === "number") {
    //     this.form.setValue(this.model)
    //     this.form.markAsDirty()
    // } else
    // if(!isNaN(Number(this.model))) {
    //     if(this.model.trim() === "") {
    //         this.form.setValue(null)
    //     } else {
    //         this.form.setValue(Number(this.model))
    //     }
    //     this.form.markAsDirty()
    // } else {
    //     this.form.setValue(event)   // pusti isto vpisano
    //     this.numericError = true
    // }
    let thsep = this.thousandsSeparator()
    if (event.indexOf(thsep) >= 0) {
      this.numericError = true
    }
    let parsed = this.parseNumber(event)
    if (!isNaN(parsed)) {
      if (event.trim() === "") {
        this.form.setValue(null)
      } else {
        this.form.setValue(parsed)
      }
      this.model = event
      this.form.markAsDirty()
    } else {
      // this.form.setValue(event)   // pusti isto vpisano
      this.numericError = true
    }
  }

  isNaN() {
    return this.form && this.form.errors && this.form.errors.NaN
  }
  isRequired() {
    if (this.markRequired) return true
    if (!this.form) {
      if (!this.languageFormArray) {
        return false;
        // throw Error("Vsaj eden izmed form oz. languageFormArray mora biti različen od null")
      }
      if (!this.languageFormArray.validator) {
        return false
      }
      let validator = this.languageFormArray.validator({} as AbstractControl);
      return (validator && validator.required);
    }
    if (!this.form.validator) {
      return false;
    }
    const validator = this.form.validator({} as AbstractControl);
    return (validator && validator.required);
  }

  getValue() {
    return this.form && !this.languageFormArray
      ? this.form.value
      : (this.languageFormArray
        ? this.languageFormControl.value || ''
        : ''
      )
  }

  getSteviloZnakov() {
    let val = this.getValue()
    if (val) return val.length
    return 0
  }

  getMaxLength() {
    if (this.language && this.maxLength) return this.maxLength;  // pri večjezični varianti moramo nastaviti.
    if (!this.form) return null  // če ne nastavimo pri večjezični varianti
    if (!this.form.validator) {
      return null;
    }
    // tako nekako bi dobili omejitev, a je to preveč potratno
    // const validator = this.form.validator(new FormControl("x".repeat(10000)));
    // return validator && validator.maxlength ? validator.maxlength.requiredLength : null;
    return null;
  }

  tooManyCharacters() {
    return this.getMaxLength() && this.getSteviloZnakov() > this.getMaxLength()
  }

  editModal() {
    const modalRef = this.modalService.open(TextinputModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: "xl",
      scrollable: true
    });
    const formCopy = cloneDeep(this.form);
    Object.assign(modalRef.componentInstance, {
      title: this.modalTitle,
      form: formCopy,
      label: this.label,
      rows: this.rows,
      counter: true,
      id: this.id,
      dismissable: false,
      maxLength: this.getMaxLength(),
      cancelCallback: () => { },
      saveCallback: () => {
        this.form.setValue(formCopy.value, { emitModelToViewChange: false });
        this.form.markAsDirty();
      }
    })
  }

  @ViewChildren('textareafield') textareafield;
  @ViewChildren('inputfield') inputfield;

  // @ViewChild("newTagInput", { static: false })
  // newTagInputField: ElementRef<HTMLInputElement>;

  focus() {
    if (this.textarea) {
      this.textareafield.first.nativeElement.focus();
    } else {
      this.inputfield.first.nativeElement.focus();
    }

  }

  ///////////////////////////////////////////////////////////
  /// Jezikovne nastavitve
  ///////////////////////////////////////////////////////////

  get language(): string {
    return this.currentLanguage$.value
  }

  languageFormControl = new UntypedFormControl(null)
  lastLanguage = 'sl'
  currentLanguage$ = new BehaviorSubject<string>(this.lastLanguage)
  langAndTextSubscription: Subscription = null;
  availableLanguages$ // = new BehaviorSubject<Array<string>>([]);
  original = false;  // podatki se smatrajo kot originalni (nismo naredili sprememb)
  modelSub: Subscription = null

  resubscribe() {
    if (this.languageFormArray) {
      this.original = true
      if (this.langAndTextSubscription) this.langAndTextSubscription.unsubscribe()
      this.langAndTextSubscription = combineLatest(this.currentLanguage$, this.languageFormControl.valueChanges,
        (language: string, text: string) => ({ language: language, text: text })
      ).pipe(
        distinctUntilChanged(
          (prev, curr) => prev.language === curr.language
            && prev.text === curr.text
        )
      ).subscribe(val => {
        if (val.language) {
          this.setForLanguage(val.language, val.text)
          this.original = false
        }
      })

      this.availableLanguages$ = this.languageFormArray.valueChanges.pipe(
        startWith(this.languageFormArray.value),
        map(arr => arr.map(x => x.key)),
        shareReplay(1)
      )
      this.initializeLanguage(this.currentLanguage$.value);  // nujno mora biti po subscriptionu, da se bo this.original pravilno nastavil
    }
    if (this.forceNumeric()) {
      this.model = this.formatNumber(this._form.value)
      if (this.modelSub) this.modelSub.unsubscribe()
      this.modelSub = this._form.valueChanges.subscribe(val => {
        this.model = this.formatNumber(val)
      })
    }
  }

  changeLanguage(language) {
    if (this.currentLanguage$.value === language) return
    this.currentLanguage$.next(null)  // preprečimo spreminjanje podatkov
    this.initializeLanguage(language)
    this.currentLanguage$.next(language)
  }

  setForLanguage(language: string, text: string) {
    if (!language) return;
    let res: Array<any> = this.languageFormArray.controls.filter(x => {
      return (x as UntypedFormControl).value.key == language
    })
    if (res.length == 0) {
      if (text) {
        this.languageFormArray.push(new UntypedFormControl(
          {
            key: language,
            value: text
          }
        ))
        this.languageFormArray.markAsDirty()
        this.languageFormArray.updateValueAndValidity()
      }
    } else if (res.length > 1) {
      throw Error("languageFormArray ne sme vsebovati večkratnih vnosov za jezik: " + language)
    } else {
      let fc = (res[0] as UntypedFormControl)
      if (this.lastLanguage == language) {  // zavedi spremembo samo, če ni bilo spremembe jezika
        fc.setValue(
          {
            key: language,
            value: text
          }
        );
        if (!this.original) {
          fc.markAsDirty()
          fc.updateValueAndValidity()
        }
      }
      if (this.clearEmptyLanguages()) {
        if (!this.original) {
          this.languageFormArray.markAsDirty()
          this.languageFormArray.updateValueAndValidity()
        }
      }
    }
    this.lastLanguage = language;
  }

  clearEmptyLanguages() {
    let i = 0;
    for (let el of this.languageFormArray.controls) {
      let val = (el as UntypedFormControl).value.value
      if (!val) {
        this.languageFormArray.removeAt(i);
        this.clearEmptyLanguages();
        return true;
      }
      i++;
    }
    return false;
  }

  initializeLanguage(language: string) {
    let res: Array<any> = this.languageFormArray.controls.filter(x => {
      return (x as UntypedFormControl).value.key == language
    })
    if (res.length > 1) {
      throw Error("večkratni prevodi v languageFormArray za jezik:  " + this.language)
    }
    if (res.length == 0) {
      this.languageFormControl.setValue(null);
    } else {
      this.languageFormControl.setValue(res[0].value.value)
    }
    if (this.editableLanguages.find(x => x === language)) {
      this.languageFormControl.enable()
    } else {
      this.languageFormControl.disable()
    }
  }

  focus$ = new Subject<string>();
  click$ = new Subject<string>();
  input$ = new Subject<string>();
  keydown$ = new Subject<any>();
  // specialKeys$ = new Subject<string>();

  autocompleteSelection$ = null
  noAutocompleteSelections$ = null // true if autocomplete has no choices
  showNoChoicesWarning$ = null
  selectedObjects$ = new BehaviorSubject<Array<any>>([]);   // list of currently selected objects

  isNew: boolean = false;   // new object creation mode

  autocompleteMatch$ = null

  @ViewChild('instance', { static: false }) instance: NgbTypeahead;

  typeaheadEnabled() {
    if (this.codebookService == null) return false;
    if (!this.codebookService.hasAutocomplete()) return false;
    return true;
  }

  typeaheadSearch = (text$: Observable<string>) => {
    if (!this.typeaheadEnabled()) return of([]);
    const clicksWithClosedPopup$ = this.click$.pipe(
      filter(() => !this.instance.isPopupOpen())
    );
    const inputFocus$ = this.focus$;

    // rebrodcasting current choices back to component
    this.autocompleteSelection$ = this.codebookService.autocompleteCandidates(
      merge(
        this.input$.pipe(
          debounceTime(200),
          distinctUntilChanged()
        ),
        inputFocus$.pipe(
          delay(0)   // delay a bit focus for possible autocompleteSearchAdditionalParams to be pushed
        ),
        clicksWithClosedPopup$
      ),
      this.selectedObjects$,
      this.autocompleteSearchAdditionalParams$,
      this.organizationId
    ).pipe(
      map(x => x.results),
      shareReplay(1)
    )
    this.noAutocompleteSelections$ = this.autocompleteSelection$.pipe(
      map((choices: Array<any>) => this.inputfield.first && this.inputfield.first.nativeElement.value.length > 0 && choices.length == 0)
    )

    this.autocompleteMatch$ = combineLatest(
      this.input$,
      this.autocompleteSelection$.pipe(
        map((x: Array<any>) => {
          if (x && x.length === 1) return x[0];
          return null
        })
      ),
      (key: string, sel: any) => {
        if (typeof sel == "string" && sel === key) {
          return key
        }
        return null
      }
    )

    this.autocompleteMatch$.subscribe(x => {
      this.itemMatching.next(x)
    })

    // mora biti v drugem "threadu", če ne dobimo 'ExpressionChangedAfterItHasBeenCheckedError'
    setTimeout(() => {
      this.showNoChoicesWarning$ = this.noAutocompleteSelections$.pipe(
        map((show: boolean) => show && !this.codebookService.canAddNew())
      )
    })
    return this.autocompleteSelection$
  }

  ngOnDestroy(): void {
    if (this.langAndTextSubscription) this.langAndTextSubscription.unsubscribe()
    if (this.modelSub) this.modelSub.unsubscribe()
    if (this.pushToFormControlSubscription) this.pushToFormControlSubscription.unsubscribe()
    if (this.closableSub) this.closableSub.unsubscribe()
    if (this.closableSub2) this.closableSub2.unsubscribe()
  }

  focusOnInput() {
    this.input.nativeElement.focus();
  }
}
