import { Directive, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
// import { Settings } from 'src/app/settings';
// import { validEvents } from '@tinymce/tinymce-angular/editor/Events';

export interface SectionError {
    section: string,
    error: boolean
}

@Directive({
    selector: '[contents]',
    exportAs: 'contents',
    standalone: false
})
export class ContentsDirective implements OnInit, OnChanges, OnDestroy {
    @Input() scrollingView: HTMLElement;
    @Input() initialValue = null
    @Input() initialParentValue = null

    @Input()
    initialScrollOffset = null

    @Input() faqs = []

    _submitted = false
    @Input() set submitted(value: boolean) {
        this._submitted = value
        if(this._errorSections$) {
            this._errorSections$.next(this.currentErrorSections)  // ping
        }
    }

    get submitted(): boolean {
        return this._submitted
    }

    _onScroll$: Subject<Event> = new Subject<Event>();
    _activeSection$: BehaviorSubject<string>;
    _activeParentSection$: BehaviorSubject<string>;
    _errorSections$: BehaviorSubject<any>;
    _errorReporter$ = new BehaviorSubject<SectionError>(null);

    private scrollFun: EventListenerOrEventListenerObject = (event: Event) => this._onScroll$.next(event);

    constructor(
        // public settings: Settings
    ) {
    }

    public faqsForSection(section: string) {
        return this.faqs.filter(x => x.tag === section).sort((a, b) => (a.date > b.date) ? 1 : -1)
    }


    get scrollOffset() {
        if(this.initialScrollOffset == null) {
            return 250
        }
        return this.initialScrollOffset
    }

    subError: Subscription;
    currentErrorSections = {}

    ngOnInit() {
        this._activeSection$ = new BehaviorSubject<string>(this.initialValue);
        this._activeParentSection$ = new BehaviorSubject<string>(this.initialParentValue);
        this._errorSections$ = new BehaviorSubject<any>({})
        this.subError = this._errorReporter$.subscribe((error: SectionError) =>{
            if(error) {
                this.currentErrorSections[error.section] = error.error
                this._errorSections$.next(this.currentErrorSections)
            }
        })
        this.unsubscribeScrollEventListener();
        this.subscribeScrollEventListener();
    }

    ngOnChanges() {
        this.unsubscribeScrollEventListener();
        this.subscribeScrollEventListener();
    }

    ngOnDestroy() {
        this.unsubscribeScrollEventListener();
        if(this.subError) this.subError.unsubscribe()
    }

    // Subscribe to scrollingView scroll events. Sections will detectChanges() on scroll changes.
    subscribeScrollEventListener() {
        (this.scrollingView || document).addEventListener('scroll', this.scrollFun, false);
    }

    unsubscribeScrollEventListener() {
        (this.scrollingView || document).removeEventListener('scroll', this.scrollFun, false);
    }

    activeSection(): Observable<string> {
        return this._activeSection$.pipe(
            filter(section => !!section)
        )
    }

    activeParentSection(): Observable<string> {
        return this._activeParentSection$.pipe(
            filter(section => !!section)
        )
    }

}
