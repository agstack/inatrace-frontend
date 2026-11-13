import { Component, OnInit, Input, ViewChildren, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UntypedFormControl } from '@angular/forms';

@Component({
    selector: 'app-textinput-modal',
    templateUrl: './textinput-modal.component.html',
    styleUrls: ['./textinput-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class TextinputModalComponent implements OnInit {
    @Input()
    label: string;

    @Input()
    form: UntypedFormControl;

    @Input()
    rows?: number = 5;

    @Input()
    id?: number;

    @Input()
    title?: string;

    @Input()
    public cancelCallback: () => void;

    @Input()
    submitted = false // ??

    @Input()
    public saveCallback: () => string;

    @Input()
    public dismissable: string;

    @Input()
    public maxLength?: number;

    @Input()
    public counter: number;

    constructor(public activeModal: NgbActiveModal) { }

    @ViewChildren('textinput') vnos;

    ngOnInit() {
    }

    ngAfterViewInit() {
        // hack da dela initial autoresize
        setTimeout(() => {
            const input = this.vnos?.first?.textareafield?.first?.nativeElement;
            input?.focus();
        })
    }

    onSave() {
        if(this.saveCallback) {
            this.saveCallback()
        }
        this.activeModal.close('Save click')
    }

    onCancel() {
        if(this.cancelCallback) {
            this.cancelCallback()
        }
        this.activeModal.close('Cancel click')
    }
}
