import { Injectable } from '@angular/core';
import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { objectSlice } from 'src/shared/utils';
import { NgbModalImproved } from '../ngb-modal-improved/ngb-modal-improved.service';
import { MessageButtonStringDict, MessageResultType, MessageType } from './message-modal-labels.service';
import { MessageModalComponent } from './message-modal.component';

export interface MessageModalDefinition {
    type: MessageType,
    title?: string,
    message: string,
    buttons?: MessageResultType[],
    focusButton?: MessageResultType,
    dismissable?: boolean,
    buttonTitles?: Partial<MessageButtonStringDict>,
    buttonClasses?: Partial<MessageButtonStringDict>,
    options?: NgbModalOptions,
}

@Injectable({
    providedIn: 'root'
})
export class MessageModalService {
    constructor(private ngbModal: NgbModalImproved) { }

    public defaultNgbModalOptions: NgbModalOptions = {
        centered: true,
    }

    public open(definition: MessageModalDefinition): Promise<MessageResultType> {
        const options = Object.assign({}, this.defaultNgbModalOptions, definition.options || {});
        const inputs = objectSlice(definition, ['type', 'title', 'message', 'buttons', 'focusButton', 'dismissable', 'buttonTitles', 'buttonClasses']);
        const modalRef = this.ngbModal.open(MessageModalComponent, options, inputs);
        return modalRef.result;
    }
}
