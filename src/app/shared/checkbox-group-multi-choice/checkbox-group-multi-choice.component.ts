import { Component, OnInit, EventEmitter, Input, Output, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormArray, UntypedFormControl } from '@angular/forms';
import { CodebookHelperService } from 'src/interfaces/CodebookHelperService';
import { Subscription, Subscriber } from 'rxjs';
import { uuidv4 } from 'src/shared/utils';

@Component({
    selector: 'checkbox-group-multi-choice',
    templateUrl: './checkbox-group-multi-choice.component.html',
    styleUrls: ['./checkbox-group-multi-choice.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CheckboxGroupMultiChoiceComponent implements OnInit, OnDestroy {

    _formArray: UntypedFormArray = null;

    @Input() set formArray(value: UntypedFormArray) {
        this._formArray = value;
        this.resubscribe()
    }

    get formArray(): UntypedFormArray {
        return this._formArray
    }

    @Input()
    useForm = false;

    _form = null;

    @Input() set form(value: any) {
        this._form = value;
        this.resubscribe()
    }

    get form(): any {
        return this._form
    }

    @Input()
    codebookService: CodebookHelperService<any>;

    @Input()
    label = null

    @Input()
    htmlLabel = null

    // @Input()
    // selected = null;

    @Input()
    horizontal = false;

    @Input()
    invalid = false

    @Input()
    noLabel = false;

    @Input()
    disabled = false;

    @Output() onSelect = new EventEmitter<string>();

    tmpUUID = uuidv4();

    // @Input()
    choiceArray = [];

    checkboxes = []

    constructor() { }

    choicesSub: Subscription = null

    ngOnInit() {
        this.resubscribe()
    }

    sub1: Subscription = null
    sub2: Subscription = null
    resubscribe() {
        if (this.codebookService) {
            this.sub1 = this.choicesSub = this.codebookService.enumOptions().subscribe(options => {
                this.choiceArray = options;
                this.checkboxes = this.choiceArray.map((x, i) => {
                    return {
                        title: this.codebookService.formatter()(x),
                        selection: x,
                        listId: i,
                        selected: this.useForm && this.form
                            ? !!(
                                this.codebookService.isEnumFormControl
                                    ? (x.id == this.form.value)
                                    : (x.id == this.form.value.id))
                            : !!this.formArray.value.find(y => x.id === (this.codebookService.isEnumFormControl ? y : y.id))
                    }
                })
            })
        }
        if (this.useForm && this.form) {
            this.sub2 = this.form.valueChanges.subscribe(newValue => {
                if (!this.checkboxes) return
                this.checkboxes = this.checkboxes.map(el => {
                    el.selected = !!(this.codebookService.isEnumFormControl ? (el.selection.id == newValue) : (el.selection.id == newValue.id))
                    return el
                })
            })
        } else {
            this.sub2 = this.formArray.valueChanges.subscribe(newValues => {
                if (!this.checkboxes) return
                this.checkboxes = this.checkboxes.map(el => {
                    el.selected = !!newValues.find(y => el.selection.id === (this.codebookService.isEnumFormControl ? y : y.id))
                    return el
                })
            })
        }
    }

    isDisabled() {
        if (this.disabled) {
            return true;
        }
        if (this.useForm && this.form) {
            return this.form.enabled === false
        }
        return this.formArray && this.formArray.enabled === false
    }

    onKey(event, i, selection) {
        if (event.target.checked) {
            if (this.useForm && this.form) {
                this.form.setValue(this.codebookService.isEnumFormControl() ? selection.id : selection)
            } else {
                const pos = this.formArray.value.findIndex(x => (this.codebookService.isEnumFormControl() ? x : x.id) === selection.id)
                if (pos >= 0) return
                const data = this.codebookService.isEnumFormControl()
                    ? selection.id
                    : selection;
                this.formArray.push(new UntypedFormControl(data))
            }
            this.checkboxes[i].selected = true
        } else {
            if (this.useForm && this.form) {
                this.form.setValue(null)   // ALEN: prej je bilo "" - mora biti null
            } else {
                const pos = this.formArray.value.findIndex(x => (this.codebookService.isEnumFormControl() ? x : x.id) === selection.id)
                if (pos < 0) return
                this.formArray.removeAt(pos)
            }
            this.checkboxes[i].selected = false
        }
        if (this.useForm && this.form) {
            this.form.markAsDirty()
            this.form.updateValueAndValidity()
        } else {
            this.formArray.markAsDirty()
            this.formArray.updateValueAndValidity()
        }
        // this.checkboxes.forEach((x, index) => {
        //   if(index === i && event.target.checked) x.selected = true
        //   else x.selected = false;
        // })
        // this.checkboxes[i].selected = event.target.checked
    }

    ngOnDestroy() {
        if (this.choicesSub) this.choicesSub.unsubscribe()
        if (this.sub1) this.sub1.unsubscribe()
        if (this.sub2) this.sub2.unsubscribe()
    }
}
