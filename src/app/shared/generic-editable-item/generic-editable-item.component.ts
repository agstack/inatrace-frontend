import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { SimpleValidationScheme } from 'src/interfaces/Validation';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';

@Component({
    template: '',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class GenericEditableItemComponent<T> implements OnInit {

    @Input()
    title = null;
    @Input()
    rawObjectData?: any;
    @Input()
    isOpen = false;
    @Input()
    listEditorManager = null;
    @Input()
    listEditorManagerPosition = null;
    @Input()
    set formControlInput(value: UntypedFormControl) {
        if (!value || value.value == null) {
            throw Error('It\'s possible that \'null\' Editable component is not supported.');
        }
        this.originalFormControl = value;
        this.submitted = false;
        this.tmpFormGroup = this.generateForm(value.value);
        this.onFormChanged();
    }

    @Output()
    onSave = new EventEmitter<boolean>();
    @Output()
    onCancel = new EventEmitter<any>();
    @Output()
    onDelete = new EventEmitter<any>();
    @Output()
    onToggle = new EventEmitter<boolean>();

    originalFormControl: UntypedFormControl = null;
    tmpFormGroup: UntypedFormGroup = null;

    validationScheme: SimpleValidationScheme<T> = null;

    submitted = false;

    onFormChanged() { }

    get formControlInput(): UntypedFormControl {
        return this.originalFormControl;
    }

    get form(): UntypedFormGroup {
        return this.tmpFormGroup;
    }

    constructor(
        protected globalEventsManager: GlobalEventManagerService
    ) { }

    // should be set in the constructor of the extended class

    public stripResult(obj: any) {
        return obj;
    }

    save() {
        if (this.form.invalid) {
            this.form.markAsTouched();
            this.form.markAsDirty();
            this.submitted = true;
            this.globalEventsManager.push({
                action: 'error',
                notificationType: 'error',
                title: $localize`:@@genericEditableItem.save.error.title:Errors or incomplete entries!`,
                message: $localize`:@@genericEditableItem.save.error.message:Check and correct data.`
            });
            return;
        }
        if (this.form.dirty) {   // predpostavka: če generiramo prazen objekt, ga moramo vsaj malo dopolniti (ni defaultov)
            const tmpVal = this.stripResult(this.form.getRawValue());
            this.formControlInput.setValue(tmpVal);
            this.formControlInput.markAsTouched();
            this.formControlInput.markAsDirty();
            this.formControlInput.updateValueAndValidity();
            this.onSave.next(true);
        } else {
            this.onSave.next(false);
        }
        if (this.listEditorManager && this.listEditorManagerPosition != null) {
            this.listEditorManager.save(this.listEditorManagerPosition);
        }
    }

    async cancel() {
        const okButtonText = $localize`:@@genericEditableItem.cancel.warning.okButtonText:Discard change`;
        const cancelButtonText = $localize`:@@genericEditableItem.cancel.warning.cancelButtonText:Go back`;
        if (this.form && this.form.dirty) {
            const result = await this.globalEventsManager.openMessageModal({
                type: 'warning',
                title: $localize`:@@genericEditableItem.cancel.warning.title:Changes not saved!`,
                message: $localize`:@@genericEditableItem.cancel.warning.title:The form contains unsaved changes that will be discarded.`,
                options: { centered: true },
                dismissable: false,
                buttonTitles: { ok: okButtonText, cancel: cancelButtonText}
            });
            if (result !== 'ok') {
                return;
            }
        }

        this.submitted = false;
        this.tmpFormGroup = this.generateForm(this.originalFormControl.value);

        if (this.listEditorManager && this.listEditorManagerPosition != null) {
            this.listEditorManager.cancel(this.listEditorManagerPosition);
        }

        this.onCancel.next(true);
    }

    delete() {
        if (this.listEditorManager && this.listEditorManagerPosition != null) {
            this.listEditorManager.delete(this.listEditorManagerPosition);
        }
        this.onDelete.next(true);
    }

    toggle(returnFocusElement) {
        if (this.listEditorManager && this.listEditorManagerPosition != null) {
            this.listEditorManager.toggle(this.listEditorManagerPosition, returnFocusElement);
        }
        this.onToggle.next(true);
        // tukaj racunamo, da cancel resetira formo
        this.form.markAsPristine();
    }

    // should be overriden, takes care of
    public generateForm(value: any): UntypedFormGroup {
        throw Error('Not yet implemented');
    }

    public updateCustomFormControl(key: string, value: any) {
        if (!this.tmpFormGroup) {
            throw Error('Cannot update custom form control \'' + key + '\'. FormGroup null.');
        }
        if (!this.tmpFormGroup.controls[key]) {
            throw Error('Missing custom form control \'' + key + '\'.');
        }

        const fk = this.tmpFormGroup.controls[key];
        fk.setValue(value);
        // do not signal the change!
    }

    get contentObject() {
        if (this.formControlInput && this.rawObjectData) {
            throw Error('FormControlInput and rawObjectData cannot be used together!');
        }
        if (this.formControlInput) {
            return this.formControlInput.value;
        }
        if (this.rawObjectData) {
            return this.rawObjectData;
        }
    }

    ngOnInit() {
    }
}
