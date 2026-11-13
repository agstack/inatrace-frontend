import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbModalImproved } from 'src/app/core/ngb-modal-improved/ngb-modal-improved.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-cookie-management-modal',
    templateUrl: './cookie-management-modal.component.html',
    styleUrls: ['./cookie-management-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CookieManagementModalComponent implements OnInit {

    @Input()
    dismissable = true;

    checked1

    constructor(
        public activeModal: NgbActiveModal,
        private modalService: NgbModalImproved
    ) { }

    form = new UntypedFormGroup({
        googleAnalytics: new UntypedFormControl(null),
        facebookPixel: new UntypedFormControl(null),
        intercom: new UntypedFormControl(null),
        rocket: new UntypedFormControl(null)
    })
    ngOnInit() {
        this.form.get('googleAnalytics').setValue(JSON.parse(localStorage.getItem('cookieConsentGoogleAnalytics')))
        this.form.get('facebookPixel').setValue(JSON.parse(localStorage.getItem('cookieConsentFacebookPixel')))
        this.form.get('intercom').setValue(JSON.parse(localStorage.getItem('cookieConsentIntercom')))
        this.form.get('rocket').setValue(JSON.parse(localStorage.getItem('cookieConsentRocket')))
        // console.log(this.form)
        // this.form.valueChanges.subscribe(val => {
        //     console.log(val)
        // })
    }

    isAnyConsent() {
        return localStorage.getItem('cookieConsentGoogleAnalytics')
            || localStorage.getItem('cookieConsentFacebookPixel')
            || localStorage.getItem('cookieConsentIntercom')
            || localStorage.getItem('cookieConsentRocket')
            || localStorage.getItem('cookieConsent')
    }

    isAllConsent() {
        return localStorage.getItem('cookieConsentGoogleAnalytics')
            && localStorage.getItem('cookieConsentFacebookPixel')
            && localStorage.getItem('cookieConsentIntercom')
            && localStorage.getItem('cookieConsentRocket')
            && localStorage.getItem('cookieConsent')
    }

    save() {
        localStorage.setItem('cookieConsentGoogleAnalytics', JSON.stringify(!!this.form.get('googleAnalytics').value))
        localStorage.setItem('cookieConsentFacebookPixel', JSON.stringify(!!this.form.get('facebookPixel').value))
        localStorage.setItem('cookieConsentIntercom', JSON.stringify(!!this.form.get('intercom').value))
        localStorage.setItem('cookieConsentRocket', JSON.stringify(!!this.form.get('rocket').value))
        window.location.reload()
    }

    static openCookieManagement(modalService: NgbModalImproved) {
        const modalRef = modalService.open(CookieManagementModalComponent, { centered: true });
        Object.assign(modalRef.componentInstance, {
        })
    }

    get chatEngine() {
        return environment.chatApp
    }
}
