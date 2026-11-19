import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit, Host, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { faBars, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { AccordionComponent } from './accordion.component';
import { Subscribable, Subscription } from 'rxjs';

@Component({
    selector: 'app-accordion-panel',
    templateUrl: './accordion-panel.component.html',
    styleUrls: ['./accordion-panel.component.scss'],
    animations: [
        trigger('slideOpen', [
            state('closed', style({
                display: 'none'
            })),
            state('open', style({
                display: 'block'
            })),
            transition('closed => open', [
                style({ display: 'block', height: 0 }),
                animate('200ms ease-in-out', style({ height: '*' }))
            ]),
            transition('open => closed', [
                animate('200ms ease-in-out', style({ height: 0 }))
            ])
        ]),
        trigger('rotateIconOpen', [
            state('closed', style({
                'transform': 'rotate(0deg)',
                'transform-origin': '50% 50%'
            })),
            state('open', style({
                'transform': 'rotate(90deg)',
                'transform-origin': '50% 50%'
            })),
            transition('closed <=> open', animate('200ms'))
        ])
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AccordionPanelComponent implements OnInit, OnDestroy {
    @Input()
    startOpen = false;

    @Input()
    title: string;

    @Input()
    htmlTitle: string;

    @Input()
    panelId: number = null;

    @Input()
    masterMode = false

    @Input()
    showArrow = true

    open = false;

    constructor(@Host() public accordion: AccordionComponent) { }

    faChevronRight = faChevronRight;
    faBars = faBars;

    ngOnInit() {
        this.open = this.startOpen;
        if(this.masterMode && this.panelId != null && this.accordion) {
            this.sub = this.accordion.open$.subscribe(val => {
                if(val === this.panelId) {
                    if(!this.open) this.open = true
                } else {
                    if(this.open) this.open = false;
                }
            })
        }
    }

    notify() {
        if(this.masterMode && this.panelId != null) {
            if(this.open) {
                this.accordion.open$.next(this.panelId)
            } else {
                this.accordion.open$.next(null)
            }
        }
    }

    toggle() {
        this.open = !this.open;
        this.notify()
    }

    sub: Subscription = null
    ngOnDestroy(): void {
        if(this.sub) this.sub.unsubscribe()
    }

}
