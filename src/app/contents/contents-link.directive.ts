import { Directive, Host, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscribable, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ContentsDirective } from './contents.directive';


@Directive({
    selector: '[contentsLink]',
    exportAs: 'contentsLink',
    standalone: false
})
export class ContentsLinkDirective implements OnInit, OnDestroy {
    ngUnsubscribe: Subject<void> = new Subject<void>();

    @Input() href;
    @HostBinding('class.active') active = false;

    @HostBinding('class.link-error') isError = true;

    constructor(
        @Host() public contents: ContentsDirective,
    ) { }

    subError: Subscription;

    get sectionId() {
        if(!this.href) return null
        return this.href.slice(1)
    }
    ngOnInit() {
        this.contents._activeSection$.pipe(
            takeUntil(this.ngUnsubscribe)
        ).subscribe((sectionName: string) => {
            this.active = `#${ sectionName }` === this.href;
        });
        this.contents._errorSections$.subscribe(sectionErrors => {
            this.isError = this.contents.submitted && sectionErrors[this.sectionId]
        })
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}
