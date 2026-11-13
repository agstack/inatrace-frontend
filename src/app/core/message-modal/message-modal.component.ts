import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MessageButtonStringDict, MessageResultType, MessageModalLabelsService, MessageType } from './message-modal-labels.service';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faInfoCircle, faExclamationTriangle, faExclamationCircle, faQuestionCircle, faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-message-modal',
    templateUrl: './message-modal.component.html',
    styleUrls: ['./message-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MessageModalComponent implements OnInit {
    constructor(
        public activeModal: NgbActiveModal,
        public messageLabels: MessageModalLabelsService
    ) { }

    @Input()
    public type: MessageType = 'info';

    @Input()
    public title: string = null;

    @Input()
    public message: string;

    @Input()
    public buttons: Array<MessageResultType> = ['cancel', 'ok'];

    @Input()
    public focusButton: MessageResultType = 'ok';

    /**
     * Show close (x) button at top left
     */
    @Input()
    public dismissable: boolean = true;

    @Input()
    buttonTitles: Partial<MessageButtonStringDict> = this.messageLabels.buttons;

    @Input()
    buttonClasses: Partial<MessageButtonStringDict> = { ok: 'sp-btn-pri', cancel: 'sp-btn-ter' };

    faTimes = faTimes;

    icons: { [key in MessageType]?: IconDefinition } = {
        info: faInfoCircle,
        question: faQuestionCircle,
        warning: faExclamationTriangle,
        error: faExclamationCircle,
    }

    ngOnInit() {
    }
}
