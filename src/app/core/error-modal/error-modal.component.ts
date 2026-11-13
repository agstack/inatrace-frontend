import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-error-modal',
    templateUrl: './error-modal.component.html',
    styleUrls: ['./error-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ErrorModalComponent implements OnInit {
    @Input()
    title: string;

    @Input()
    public errorMessage: string;

    @Input()
    public closeCallback: () => void;

    @Input()
    public dismissable: string;

    constructor(public activeModal: NgbActiveModal) { }

    ngOnInit() {
    }

}
