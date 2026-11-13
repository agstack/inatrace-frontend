import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Subscription } from 'rxjs';
import { CookieManagementService } from 'src/app/shared/directives/cookie-management.service';

@Component({
    selector: 'app-clear-cookie-consent',
    templateUrl: './clear-cookie-consent.component.html',
    styleUrls: ['./clear-cookie-consent.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ClearCookieConsentComponent implements OnInit, OnDestroy {

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private cookieManagementService: CookieManagementService
    ) { }

    sub: Subscription = null
    ngOnInit() {

        this.sub = this.route.paramMap.pipe(
            map(m => {
                return {
                    type: m.get('type'),
                    value: m.get('value'),
                }
            })
        ).subscribe(val => {
            if ([...this.cookieManagementService.activeCookies, 'ALL', 'CHAT'].indexOf(val.type) < 0) return
            if (['true', 'false', 'null'].indexOf(val.value) < 0) return
            let type = val.type
            let value = JSON.parse(val.value)

            if (type === 'ALL') {
                this.cookieManagementService.activeCookies.forEach(typ => this.cookieManagementService.consentToCookie(typ, value))
            } else if (type === 'CHAT') {
                if (environment.chatApp === 'intercom') {
                    this.cookieManagementService.consentToCookie('INTERCOM', value)
                }
                if (environment.chatApp === 'rocket') {
                    this.cookieManagementService.consentToCookie('ROCKET', value)
                }
            } else {
                this.cookieManagementService.consentToCookie(type, value)
            }
            window.location.href = '/s/cookies'
        })
    }

    ngOnDestroy() {
        if (this.sub) this.sub.unsubscribe()
    }
}
