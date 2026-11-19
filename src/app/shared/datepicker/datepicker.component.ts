import {Component, Input, OnInit, ViewChild, Output, EventEmitter, OnDestroy, ChangeDetectionStrategy} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { NgbDateParserFormatter, NgbDatepickerConfig, NgbInputDatepicker } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { NgbDateCustomParserFormatter } from './dateformat';

@Component({
    selector: 'app-datepicker',
    templateUrl: './datepicker.component.html',
    styleUrls: ['./datepicker.component.scss'],
    providers: [
        NgbDatepickerConfig,
        { provide: NgbDateParserFormatter, useClass: NgbDateCustomParserFormatter }
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class DatepickerComponent implements OnInit, OnDestroy {

    @Input() set form(value: AbstractControl) {
        this._form = value;
        if (value) {
            this.resubscribe();
        }
    }

    get form(): AbstractControl {
        return this._form;
    }

    constructor(private config: NgbDatepickerConfig) {
        config.minDate = { year: 1900, month: 1, day: 1 };
        config.maxDate = { year: 2099, month: 12, day: 31 };
        config.outsideDays = 'collapsed';
        this.minDate = this.makeDate(config.minDate);
        this.maxDate = this.makeDate(config.maxDate);
    }

    @Input()
    label: string;

    // @Input()
    // value: AbstractControl;

    private _form: AbstractControl = null;

    @Input()
    disabled: boolean = null;

    @Input()
    invalid = false;

    @Input()
    clearable = false;

    @Input()
    touchOnBlur = false;

    @Output()
    onChange = new EventEmitter<Date>();

    datepickerDate: object = null;

    minDate;
    maxDate;

    valueSubscription: Subscription = null;

    @ViewChild('d', { static: true }) datePicker: NgbInputDatepicker;
    @ViewChild('dateInput', { static: true }) datePickerInput;

    lastValue = null;
    lastCleanToNull = null;

    lastEvent = null;

    makeDate(conf) {
        const date = new Date();
        date.setHours(12, 0, 0, 0);   // 12h so that it doesn't change on UTC
        date.setDate(15);
        date.setFullYear(conf.year);
        date.setMonth(conf.month - 1);
        date.setDate(conf.day);
        date.setHours(12, 0, 0, 0);
        return date;
    }

    isValidDate(date: Date) {
        return !(date < this.minDate || date > this.maxDate);
    }
    ngOnInit() {
        this.resubscribe();
    }

    resubscribe() {
        if (this.form) {
            this.updateDisplay(this.form.value);
            if (this.valueSubscription) { this.valueSubscription.unsubscribe(); }
            this.valueSubscription = this.form.valueChanges.subscribe(v => this.updateDisplay(v));
        }
    }

    isDisabled() {
        if (this.disabled != null) { return this.disabled; }
        if (this.form && this.form.enabled === false) { return true; }
        return false;
    }

    onClick() {
        // hack da kurzor ne skače v Safariju, ko klikneš v polje
        const start = this.datePickerInput.nativeElement.selectionStart;
        const end = this.datePickerInput.nativeElement.selectionEnd;

        this.updateDisplay(this.form.value);
        setTimeout(() => this.datePicker.open());
        // fokus po odpiranju
        setTimeout(() => {
            this.datePickerInput.nativeElement.focus();
            this.datePickerInput.nativeElement.setSelectionRange(start, end);
        }, 100);
    }

    onBlur() {
        this.lastValue = null;
        this.lastCleanToNull = null;
        this.updateDisplay(this.form.value, false);   // glitch za brisanje (glej komentar spodaj ****)
        if (!this.form.value) {
            setTimeout(() => this.updateDisplay(null));
        }
        if (this.touchOnBlur) { this._form.markAsTouched(); }
    }

    ngOnDestroy() {
        if (this.valueSubscription) { this.valueSubscription.unsubscribe(); }
    }

    updateDisplay(value, cleanToNull = true) {

        if (value === this.lastValue && cleanToNull === this.lastCleanToNull) { return; }   // če ni tega guarda se na safariju zacikla

        this.lastValue = value;
        this.lastCleanToNull = cleanToNull;
        if (value) {

            let date = new Date(value);

            if (typeof value === 'string' && value.split('T').length < 2) {
                date = new Date(value + 'T00:00:00');
            }

            if (!this.isValidDate(date)) {
                return;
            }
            const start = this.datePickerInput.nativeElement.selectionStart;
            const end = this.datePickerInput.nativeElement.selectionEnd;

            this.datepickerDate = {
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                day: date.getDate()
            };
            // Safari fix za skakanje na konec inputa
            setTimeout(() => {
                if (document.activeElement === this.datePickerInput.nativeElement) {
                    // pazi, to na safariju sproži change, zato je zgoraj guard proti ciklanju, hkrati pa naredi focus na elementu
                    this.datePickerInput.nativeElement.setSelectionRange(start, end);
                }
            });

        } else {
            if (cleanToNull) {   // glitch - če hočeš, da se zbriše še input, moraš najprej vsa polja nastaviti na null, potem pa še enkrat celoto na null (****)
                this.datepickerDate = null;
            } else {
                this.datepickerDate = {
                        year: null,
                        month: null,
                        day: null
                    };
            }
        }
    }

    change(event) {
        this.lastEvent = event;
        if (event != null && typeof event !== 'string') {
            const datumOceneDate = new Date();
            // POMEMBNO: če delaš na ta način, moraš vedno najprej nastavit leto. Če ne je problem z dnevi kot je 31.5.2000, ki jih pretvori v 1.5.2000
            datumOceneDate.setHours(12, 0, 0, 0);   // 12h so that it doesn't change on UTC
            datumOceneDate.setDate(15);
            datumOceneDate.setFullYear(event['year']);
            datumOceneDate.setMonth(event['month'] - 1);
            datumOceneDate.setDate(event['day']);
            datumOceneDate.setHours(12, 0, 0, 0);   // 12h so that it doesn't change on UTC

            if (!this.isValidDate(datumOceneDate)) {   // če datum ni pravi, kar zapri datepicker (samo tipkanje)
                if (this.datePicker.isOpen) {
                    this.datePicker.close();
                }
                return;
            }
            this.datepickerDate = event;
            this.form.setValue(datumOceneDate);
            this.form.markAsDirty();
            this.form.updateValueAndValidity();
            this.onChange.emit(datumOceneDate);
        }
        else if (event == null) {   // vse zbrisano
            this.datepickerDate = null;
            this.form.setValue(null);
            this.form.markAsDirty();
            this.form.updateValueAndValidity();
            this.onChange.emit(null);
        } else if (typeof event === 'string') {  // delno napisano -> zapri datepicker
            if (this.datePicker.isOpen) {
                this.datePicker.close();
            }
        }
    }

    brisi() {
        this.form.setValue(null);
        this.form.markAsDirty();
        this.form.updateValueAndValidity();
        this.onChange.emit(null);
        // po brisanju spet nastavi fokus
        setTimeout(() => this.datePickerInput.nativeElement.focus(), 100);
    }

    onKeydown(event) {
        // if(["Backspace", "Delete"].indexOf(event.key) >= 0) {
        //     this.brisi()
        // }
    }

    isRequired() {
        if (!this.form) {
            return false;
        }
        if (!this.form.validator) {
            return false;
        }
        const validator = this.form.validator({} as AbstractControl);
        return (validator && validator.required);
    }

}
