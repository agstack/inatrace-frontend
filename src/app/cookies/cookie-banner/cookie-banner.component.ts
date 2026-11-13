import {Component, OnInit, EventEmitter, Input, Output, ChangeDetectionStrategy} from '@angular/core';

@Component({
    selector: 'app-cookie-banner',
    templateUrl: './cookie-banner.component.html',
    styleUrls: ['./cookie-banner.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CookieBannerComponent implements OnInit {

    @Output() onAccept = new EventEmitter<boolean>();

    @Input()
    cookieInfoUrl = "#"

    constructor() {}

    ngOnInit() {
    }

}
