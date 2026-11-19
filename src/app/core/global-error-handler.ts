import { ErrorHandler, Injectable } from '@angular/core';
// import { I18n } from '@ngx-translate/i18n-polyfill';
import { ErrorModalComponent } from './error-modal/error-modal.component';
import { NgbModalImproved } from './ngb-modal-improved/ngb-modal-improved.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

    constructor(private modalService: NgbModalImproved) {}

    handleError(error: any) {
        // this.i18n = this.injector.get(I18n);
        // console.log("ERROR");
        // console.log(error);
        // const message: I18nDef = {
        //     id: "error.message",
        //     value: "A si zagnal mock server (task: Mock server run)? Če ne, ga zaženi in pritisni pritisni gumb za ponovno nalaganje."
        // }
        // const message = this.i18n({
        //     id: 'error.message',
        //     value: 'A si zagnal mock server (task: Mock server run)? Če ne, ga zaženi in pritisni pritisni gumb za ponovno nalaganje.'
        // });
        //
        // const title = this.i18n({
        //     id: 'error.title',
        //     value: 'System error'
        // });
        // const closeButtonText = this.i18n({
        //     id: 'error.closeButtonText',
        //     value: 'Reload'
        // });

        this.showError(
            // message.value,
            error.stack,
            // title,
            // closeButtonText
            // this.i18n(this.message),
            // this.i18n(title),
            // this.i18n(closeButtonText)
        );
    }

    private showError(
        message: string = $localize`:@@globalErrorHandler.message:Error`,
        title: string = $localize`:@@globalErrorHandler.title:Error`,
        closeButtonText: string = $localize`:@@globalErrorHandler.closeButtonText:Close`,
        dismissable= false,
        closeCallback: () => void = () => window.location.reload()
    ){
        const modalRef = this.modalService.open(ErrorModalComponent, { centered: true });
        Object.assign(modalRef.componentInstance, {
            errorMessage: message,
            title,
            closeButtonText,
            dismissable: false,
            closeCallback: () => window.location.reload()
        });

    }
}
