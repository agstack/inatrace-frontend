import { Component, ElementRef, Input, OnInit, ViewChild, TemplateRef, ContentChild, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, UntypedFormArray, FormGroup, AbstractControl } from '@angular/forms';
import { Observable, of, Subject, merge, fromEvent, combineLatest, BehaviorSubject, Subscribable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith, filter, switchMap, tap, shareReplay } from 'rxjs/operators';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import {
    trigger,
    state,
    style,
    animate,
    transition,
  } from '@angular/animations';
import { CodebookHelperService } from 'src/interfaces/CodebookHelperService';

@Component({
    selector: 'tag-list',
    templateUrl: './tag-list.component.html',
    styleUrls: ['./tag-list.component.scss'],
    animations: [
        // Each unique animation requires its own trigger. The first argument of the trigger function is the name
        trigger('rotatedPlus', [
            state('closed', style({ transform: 'rotate(0)' })),
            state('open', style({ transform: 'rotate(45deg)' })),
            transition('open => closed', animate('300ms ease-out')),
            transition('closed => open', animate('300ms ease-in'))
        ]),
        trigger('expandCollapse', [
            state('closed', style({
                height: '0',
                overflow: 'hidden',
                opacity: '0',
                margin: '0',
                padding: '0'
            })),
            state('open', style({
                opacity: '1'
            })),
            transition('closed=>open', animate('300ms')), // uskladi trajanje s setTimeoutom za focus!
            transition('open=>closed', animate('300ms'))
        ]),
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class TagListComponent implements OnInit, OnDestroy {
    @Input()
    label: string;

    private _formArray: UntypedFormArray;

    @Input() set formArray(value: UntypedFormArray) {
        this._formArray = value;
        this.resubscribe()
    }

    get formArray(): UntypedFormArray {
        return this._formArray;
    }

    // private _arrayName: string;
    // @Input() set arrayName(value: string) {
    //     this._arrayName = value;
    //     this.resubscribe()
    // }

    // get arrayName(): string {
    //     return this._arrayName;
    // }

    @Input()
    autoCloseOnAdd = true

    @Input()
    codebookService: CodebookHelperService<any>;

    @Input()
    isInvalid?: boolean = false;

    @Input()
    sortable?: boolean = false;

    ///// POMEMBNO ///////
    // V modelChoice je objekt, ki vsebuje izbiro v typeaheadu, ne pa tekst ki se sproti piše
    // tekst, ki se sproti piše je v this.newTagInputField.nativeElement.value
    public modelChoice: any = null;   // corresponding model

    term: any = null;   // search term

    inputVisible = false;

    @ViewChild("newTagInput", { static: false })
    newTagInputField: ElementRef<HTMLInputElement>;
    // same object with different name and type
    @ViewChild('instance', { static: false }) instance: NgbTypeahead;

    formatter = (x: any) => "No format"

    itemSelected = false;

    focus$ = new Subject<string>();
    click$ = new Subject<string>();
    input$ = new Subject<string>();
    keydown$ = new Subject<any>();
    // specialKeys$ = new Subject<string>();

    autocompleteSelection$ = null
    noAutocompleteSelections$ = null // true if autocomplete has no choices
    showNoChoicesWarning$ = null
    selectedObjects$ = new BehaviorSubject<any[]>([]);   // list of currently selected objects

    isNew = false;   // new object creation mode
    constructor() {}


    buttonsPressed = false;
    onBlur() {
        setTimeout(() => {  // če kliknemo kljukico pri dodajanju sinonimov, to poskrbi, da se textinput ne zapre. Če kliknemo ven se zapre
            if(!this.buttonsPressed) {
                this.toggleAddTag(false)
            }
            this.buttonsPressed = false;
        }, 300)
    }

    onFocus() {

    }
    ngOnInit() {
        this.formatter = this.codebookService.formatter()
    }

    selectedObjectsSubscription: Subscription = null;

    resubscribe() {
        if(this.selectedObjectsSubscription) this.selectedObjectsSubscription.unsubscribe()
        this.selectedObjectsSubscription = this.formArray.valueChanges.pipe(
            startWith(this.rawFormArray())
        ).subscribe(val => {
            this.selectedObjects$.next(val)
        })
    }
    onDropFormArray(event) {
        // let formArray: FormArray = this.formArray()
        const ctrl: AbstractControl = this.formArray.controls[event.previousIndex];
        this.formArray.removeAt(event.previousIndex)
        this.formArray.insert(event.currentIndex, ctrl);
        this.formArray.markAsDirty()
        this.formArray.updateValueAndValidity()
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
                inputFocus$,
                clicksWithClosedPopup$
            ),
            this.selectedObjects$
        ).pipe(
            map(x => x.results)
        )
        this.noAutocompleteSelections$ = this.autocompleteSelection$.pipe(
            map((choices: any[]) => this.newTagInputField && this.newTagInputField.nativeElement.value.length > 0 && choices.length == 0)
        )
        // mora biti v drugem "threadu", če ne dobimo 'ExpressionChangedAfterItHasBeenCheckedError'
        setTimeout(() => {
            this.showNoChoicesWarning$ = this.noAutocompleteSelections$.pipe(
                map((show: boolean) => show && !this.codebookService.canAddNew())
            )
        })
        return this.autocompleteSelection$
    }

    rawFormArray(): any {
        return this.formArray.getRawValue()
    }

    typeaheadEnabled() {
        if (this.codebookService == null) return false;
        if (!this.codebookService.hasAutocomplete()) return false;
        return true;
    }

    toggleAddTag(visible = !this.inputVisible) {
        this.modelChoice = null;
        this.newTagInputField.nativeElement.value = null;
        this.inputVisible = visible;
        if (visible) {
            window.setTimeout(() => {
                this.newTagInputField.nativeElement.focus()
            }, 300);  // pazi timing glede na animacije - če ne se pop up ne pojavi na pravem mestu !!!
        }
    }

    startAddTag() {
        this.toggleAddTag(true);
    }

    stopAddTag() {
        this.modelChoice = null
        this.newTagInputField.nativeElement.value = null;
    }

    removeTag(event, tag: any) {
        this.codebookService.removeElement(this.formArray, tag)
    }

    newTagValid() {
        if(!this.newTagInputField) return false;
        return this.codebookService.valid(this.modelChoice, this.newTagInputField.nativeElement.value)
    }

    finishAddTag() {
        if (!this.newTagValid()) return;
        let toAdd = null;
        if(this.typeaheadEnabled()) {
            toAdd = this.modelChoice
        } else {
            toAdd = this.codebookService.makeNewForInput(this.newTagInputField.nativeElement.value)
        }
        this.codebookService.addElement(this.formArray, toAdd);

        this.isNew = false
        if(this.autoCloseOnAdd) {
            this.toggleAddTag()
        }
        this.stopAddTag();
    }

    selectedItem(event: any) {
        this.itemSelected = true;
    }

    onModelChange(event) {
        this.modelChoice = event;
        // enable direct item selection
        if(this.itemSelected) {
            setTimeout(() => {
                this.itemSelected = false
                this.finishAddTag()
            }
            , 0)
        }
    }

    enterKey(event) {
    }

    addNew() {
    }

    createNew() {
        this.isNew = true
    }

    resetNew() {
        this.isNew = false
    }

    ngOnDestroy() {
        if(this.selectedObjectsSubscription) this.selectedObjectsSubscription.unsubscribe()
    }

    createNewTag() {
        this.buttonsPressed = true;
        this.finishAddTag()
    }

    cancelCreateAddNewTag() {
        this.buttonsPressed = true;
        this.toggleAddTag()
    }

    mainCloseButtonToggle(){
        this.buttonsPressed = true;
        this.toggleAddTag()
    }
}
