import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-faq-modal',
    templateUrl: './faq-modal.component.html',
    styleUrls: ['./faq-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FaqModalComponent implements OnInit {

    @Input()
    faqs = []

    @Input()
    dismissable = true;

    constructor(public activeModal: NgbActiveModal) { }

    ngOnInit() {
    }

}
