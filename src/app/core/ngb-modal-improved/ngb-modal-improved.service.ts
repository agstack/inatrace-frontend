import { PlatformLocation } from '@angular/common';
import { Injectable, Injector } from '@angular/core';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

export interface NgbModalImprovedOptions extends NgbModalOptions {
    /**
     * This is true by default for NgbModal, but here it will be false so that click on back button or on shadow
     * doesn't throw exception.
     */
    errorOnDismiss?: boolean;

    /**
     * Value to return on dismiss.
     */
    dismissValue?: any;
}

/**
 * NgbModal that is automatically closed on press of back button.
 *
 * Cannot be providedIn: root, because it requires the current lazy model's injector to load modal content component.
 * So import NgbModalImprovedModule into every module where it will be used.
 */
@Injectable()
export class NgbModalImproved {
    constructor(
        private injector: Injector,
        private location: PlatformLocation
    ) {
    }

    private _ngbModal: NgbModal = null;

    protected get ngbModal(): NgbModal {
        if (this._ngbModal == null) {
            this._ngbModal = this.injector.get(NgbModal);
            // handle back button and location change
            this.location.onPopState(ev => { this._ngbModal.dismissAll('back_button'); })
            this.location.onHashChange(ev => { this._ngbModal.dismissAll('location_change'); })
        }
        return this._ngbModal;
    }

    /**
     * Opens a new modal window with the specified content and supplied options.
     *
     * Content can be provided as a `TemplateRef` or a component type. If you pass a component type as content,
     * then instances of those components can be injected with an instance of the `NgbActiveModal` class. You can then
     * use `NgbActiveModal` methods to close / dismiss modals from "inside" of your component.
     *
     * Object `inputs` is passed to the modal component as inputs.
     *
     * Also see the `NgbModalImprovedOptions` and [`NgbModalOptions`](#/components/modal/api#NgbModalOptions) for the list of supported options.
     */
    public open(content: any, options?: NgbModalImprovedOptions, inputs?: any): NgbModalRef {
        const opts = options || {};
        const modalRef = this.ngbModal.open(content, options);
        if (inputs) {
            Object.assign(modalRef.componentInstance, inputs);
        }
        // to prevent "Uncaught promise rejection", return value on dismiss instead of rejecting
        if (!opts.errorOnDismiss) {
            modalRef.result = modalRef.result.catch(err => {
                return opts.dismissValue;
            });
        }
        return modalRef;
    }

    public dismissAll(reason?: any): void {
        this.ngbModal.dismissAll(reason);
    }

    public hasOpenModals(): boolean {
        return this.ngbModal.hasOpenModals();
    }
}
