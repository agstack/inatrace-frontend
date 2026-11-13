import { Component, OnInit, Input, Host, ChangeDetectionStrategy } from '@angular/core';
import { ContentsSectionDirective } from '../contents-section.directive';
import { ContentsDirective } from '../contents.directive';
import { BehaviorSubject, Subscription } from 'rxjs';

@Component({
    selector: '[parent-content-section]',
    templateUrl: './parent-content-section.component.html',
    styleUrls: ['./parent-content-section.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ParentContentSectionComponent implements OnInit {
    // @Input()
    // data = null

    currentSection = new BehaviorSubject(null)
    sub: Subscription = null

    constructor(
        @Host() public contentsSection: ContentsSectionDirective,
        @Host() public contents: ContentsDirective,
    ) { }

    get data() {
        if(this.contentsSection) {
            return this.contentsSection.contentsSection
        }
        return null
    }

    get isActive() {
        return this.contentsSection.contentsSection.anchor === this.currentSection.value
    }

    ngOnInit() {
        this.sub = this.contents._activeParentSection$.subscribe(val => {
            this.currentSection.next(val)
        })
        // this.unsubscribeScrollEventListener();
        // this.subscribeScrollEventListener();
    }


}
