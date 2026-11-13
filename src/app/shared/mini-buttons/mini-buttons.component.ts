import { Component, OnInit, Output, EventEmitter, ElementRef, ViewChild, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'mini-buttons',
    templateUrl: './mini-buttons.component.html',
    styleUrls: ['./mini-buttons.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MiniButtonsComponent implements OnInit {

    @Input()
    error = false

    @Input()
    cancelButtonOnly = false

    @Output() onSave = new EventEmitter<any>();

    @Output() onCancel = new EventEmitter<any>();

    constructor() { }

    @ViewChild('okButton', {static: false}) okButton: ElementRef;
    @ViewChild('cancelButton', {static: false}) cancelButton: ElementRef;

    ngOnInit() {
    }

    save(event) {
        this.onSave.next(event)
        this.okButton.nativeElement.blur()   // odstranjevanje fokusa iz gumba, da se ne zaganja na klik v tipkovnici
    }

    cancel(event) {
        this.onCancel.next(event)
        if (!this.cancelButtonOnly) this.okButton.nativeElement.blur()
    }
}
