import { Component, OnInit, Input, HostBinding, Host } from '@angular/core';
// import { Subject } from 'rxjs/internal/Subject';
import { ContentsDirective } from '../contents.directive';
import { takeUntil } from 'rxjs/operators';
import { trigger, state, style, transition, animate } from '@angular/animations';
import {Subject} from 'rxjs';

@Component({
    selector: '[parent-content-link]',
    templateUrl: './parent-content-link.component.html',
    styleUrls: ['./parent-content-link.component.scss'],
    animations: [
        trigger('expandCollapse', [
            state('inactive', style({
                height: '0',
                overflow: 'hidden',
                opacity: '0',
                margin: '0',
                padding: '0'
            })),
            state('active', style({
                opacity: '1'
            })),
            transition(
                '*<=>*',
                animate('500ms ease-out')
            )
        ]),
    ]

})
export class ParentContentLinkComponent implements OnInit {

    ngUnsubscribe: Subject<void> = new Subject<void>();

    @HostBinding('@expandCollapse') get getExpandCollapse(): string {
        return this.active ? 'active' : 'inactive';
    }

    @Input() href;

    active = false;

    constructor(
        @Host() public contents: ContentsDirective,
    ) { }

    ngOnInit() {
        this.contents._activeParentSection$.pipe(
            takeUntil(this.ngUnsubscribe)
        ).subscribe((sectionName: string) => {
            // console.log(sectionName, this.href)
            this.active = `#${ sectionName }` === this.href;
        });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}
