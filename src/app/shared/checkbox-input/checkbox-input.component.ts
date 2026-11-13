import { Component, OnInit, Input, Output, EventEmitter, ViewChildren, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl, AbstractControl } from '@angular/forms';
import { uuidv4 } from 'src/shared/utils';

@Component({
    selector: 'checkbox-input',
    templateUrl: './checkbox-input.component.html',
    styleUrls: ['./checkbox-input.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CheckboxInputComponent implements OnInit {

    @Input()
    form: UntypedFormControl = null;

    @Input()
    label: string = null;

    @Input()
    id: string = uuidv4();

    @Input()
    labelSpacer = true;

    @Input()
    checked = false;

    @Input()
    disabled: boolean = null;

    @Input()
    invalid = false;

    @Input()
    transparentBackgroud = false;

    @Output()
    onClick = new EventEmitter<any>();

    @Input()
    inTable = false;

    @Input()
    noBottomMargin = false;

    @ViewChildren('inputfield') inputfield;

    isDisabled() {
        if (this.disabled != null) {
            return this.disabled;
        }
        return this.form && this.form.enabled === false;
    }

    onToggle($event) {
        this.onClick.next($event);
    }

    constructor() { }

    ngOnInit() {
    }

    isRequired() {
        if (!this.form) {
            return false;
        }
        if (!this.form.validator) {
            return false;
        }
        const validator = this.form.validator({} as AbstractControl);
        return (validator && (validator.required || validator.notChecked));
    }

}
