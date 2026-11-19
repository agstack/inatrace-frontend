import { Directive, Host, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ContentsDirective } from './contents.directive';


@Directive({
    selector: '[contentsLinkParent]',
    exportAs: 'contentsLinkParent',
    standalone: false
})
export class ContentsLinkParentDirective implements OnInit, OnDestroy {
    ngUnsubscribe: Subject<void> = new Subject<void>();

    @Input() href;
    @HostBinding('class.active') active = false;

    @HostBinding('class.link-error') isError = true;

    constructor(
        @Host() public contents: ContentsDirective,
    ) { }

    get sectionId() {
        if(!this.href) return null
        return this.href.slice(1)
    }

    ngOnInit() {
        this.contents._activeParentSection$.pipe(
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
