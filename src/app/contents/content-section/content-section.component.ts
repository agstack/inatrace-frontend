import { Component, Host, Input, OnDestroy, OnInit, ViewChild, EventEmitter, Output, ChangeDetectionStrategy, OnChanges } from '@angular/core';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ContentsSectionDirective } from '../contents-section.directive';
import { ContentsDirective } from '../contents.directive';
import { documentOffset, getAbsoluteHeight } from '../html-utils';
import { NgbModalImproved } from 'src/app/core/ngb-modal-improved/ngb-modal-improved.service';
import { FaqModalComponent } from '../faq-modal/faq-modal.component';
import { map, shareReplay, tap } from 'rxjs/operators';
import { constants } from 'buffer';

@Component({
    selector: '[content-section]',
    templateUrl: './content-section.component.html',
    styleUrls: ['./content-section.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ContentSectionComponent implements OnInit, OnDestroy, OnChanges {
    @Input() title = ""

    @Input() scrollId = ''
    @Input() pageScrollOffset = 0

    @Input()
    spacingNedded = true;

    // @Input()
    // data = null

    @Output() onIconClickChange = new EventEmitter<any>();

    faQuestionCircle = faQuestionCircle
    private scrollFun: EventListenerOrEventListenerObject = (event: Event) => this.updateStickiness();

    sticky = true

    currentSection = new BehaviorSubject(null)
    constructor(
        @Host() public contentsSection: ContentsSectionDirective,
        @Host() public contents: ContentsDirective,
        private modalService: NgbModalImproved
    ) { }

    get isActive() {
        return this.contentsSection.contentsSection.anchor === this.currentSection.value
    }

    error$ = this.contentsSection.error$.pipe(
        map(val => this.contents.submitted && val),
        shareReplay(1)
    )
    // get isError() {
    //     return this.contents.submitted && this.contentsSection.isError
    // }
    get faqs() {
        return this.contents.faqsForSection(this.contentsSection.contentsSection.anchor)
    }

    get areFaqs() {
        return this.faqs.length > 0
    }
    get data() {
        if(this.contentsSection) {
            return this.contentsSection.contentsSection
        }
        return null
    }

    get titleIcon() {
      if (this.contentsSection && this.contentsSection.contentsSection) {
        return this.contentsSection.contentsSection.icon
      }
      return null
    }

    sub: Subscription = null
    ngOnInit() {
        this.sub = this.contents._activeSection$.subscribe(val => {
            this.currentSection.next(val)
        })
        // this.unsubscribeScrollEventListener();
        // this.subscribeScrollEventListener();
    }

    ngOnChanges() {
        // this.unsubscribeScrollEventListener();
        // this.subscribeScrollEventListener();
    }

    // // Subscribe to scrollingView scroll events. Sections will detectChanges() on scroll changes.
    // subscribeScrollEventListener() {
    //     document.addEventListener('scroll', this.scrollFun, false);
    // }

    // unsubscribeScrollEventListener() {
    //     document.removeEventListener('scroll', this.scrollFun, false);
    // }

    @ViewChild('sideTitle', { static: true }) sideTitle;
    @ViewChild('parent', { static: true }) parent;
    marginTop = `${this.pageScrollOffset}px`;;

    updateStickiness() {
        const pageOffset: number = documentOffset();
        const parentElement: HTMLElement = this.parent.nativeElement.parentNode;
        const parentOffset: number = parentElement.offsetTop;
        const parentHeight: number = getAbsoluteHeight(parentElement);
        const element = this.sideTitle.nativeElement;
        const elementInnerHeight: number = element.offsetHeight;

        // Edge case. Hasn't scrolled through the content yet.
        // Use a fixed margin-top of 0.
        if (pageOffset <= parentOffset) {
            this.marginTop = `${this.pageScrollOffset}px`;
            this.sticky = false;
            return;
        }

        // Edge case. Scrolling past the parent container.
        // Use a fixed margin-top based on the parent and element height.
        if (pageOffset + elementInnerHeight > parentOffset + parentHeight) {
            this.marginTop = `${ parentHeight - elementInnerHeight + this.pageScrollOffset}px`;
            this.sticky = false;
            return;
        }

        // Scrolling through the content.
        // Default (best browser performance): use a margin-top of 0 and position fixed while the user
        // is scrolling.
        // Fallback, when using a custom container: use a calculated margin to simulate a fixed position.
        // eslint-disable-next-line no-constant-condition
        if (false /*&& !this.scrollingView*/) {
            this.marginTop = '0px';
            this.sticky = true;
        } else { // Fallback.
            this.marginTop = `${ pageOffset - parentOffset + this.pageScrollOffset}px`;
            this.sticky = false;
        }
    }

    openFaqs() {
        const modalRef = this.modalService.open(FaqModalComponent, { centered: true });
        Object.assign(modalRef.componentInstance, {
            faqs: this.faqs
        })

    }

    ngOnDestroy(): void {
        if(this.sub) this.sub.unsubscribe()
        // this.unsubscribeScrollEventListener();
    }

  onIconClick() {
    this.onIconClickChange.emit();
  }

}
