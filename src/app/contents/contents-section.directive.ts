import { Directive, ElementRef, Host, HostBinding, Input, OnDestroy, OnInit, SkipSelf, Optional } from '@angular/core';
import { Subject, combineLatest, Subscription, BehaviorSubject } from 'rxjs';
import { takeUntil, startWith } from 'rxjs/operators';
import { ContentsDirective, SectionError } from './contents.directive';
import { documentOffset, getAbsoluteHeight } from './html-utils';
import { AbstractControl } from '@angular/forms';


@Directive({
    selector: '[contentsSection]',
    exportAs: 'contentsSection',
    standalone: false
})
export class ContentsSectionDirective implements OnInit, OnDestroy {
    ngUnsubscribe: Subject<void> = new Subject<void>();

    // @Input()
    // scrollOffset = 0

    @Input()
    isParent = false

    // @HostBinding('id') @Input() contentsSection: string;

    @Input() contentsSection: any;

    _forms: AbstractControl[] = null
    @Input() set forms(value: AbstractControl[]) {
        const initial = this._forms == null
        this._forms = value;

        if(!initial) {
            this.resubscribe()  // prvi resubscribe je v init
        }

    }

    get forms(): AbstractControl[] {
        return this._forms
    }

    _errors: any[] = null
    @Input() set errors(value: any[]) {
        const initial = this._errors == null
        this._errors = value;

        if(!initial) {
            this.resubscribe()  // prvi resubscribe je v init
        }

    }

    get errors(): any[] {
        return this._errors
    }



    @HostBinding('id') get id() {
        return this.contentsSection.anchor
    }

    // za parent komponente
    subError: Subscription;
    currentErrorSections = {}
    _errorSections$: BehaviorSubject<any>;
    _errorReporter$ = new BehaviorSubject<SectionError>(null);

    error$ = new BehaviorSubject<boolean>(false)

    constructor(
        @Host() @SkipSelf() public contents: ContentsDirective,
        @Host() @SkipSelf() @Optional() public parentContentsSection: ContentsSectionDirective,
        // @Host() @Self() @Optional() public parentContentsSection: ParentContentSectionComponent,
        private elementRef: ElementRef
    ) { }

    // get isParent() {  // TODO: kako ugotoviti, da si parent, brez da mu poveš
    //     if(this.parentContentsSection) return true
    //     return false;
    // }

    get scrollOffset() {
        if(!this.contents) return 0
        return this.contents.scrollOffset
    }


    errorReportSub: Subscription;
    errorSub: Subscription;

    ngOnInit() {
        setTimeout(() => this.detectActiveChanges(), 200);
        this.contents._onScroll$.pipe(
            takeUntil(this.ngUnsubscribe)
        ).subscribe((event: Event) => {
            this.detectActiveChanges();
        });
        if(this.isParent) {
            this._errorSections$ = new BehaviorSubject<any>({})
            this.subError = this._errorReporter$.subscribe((error: SectionError) =>{
                if(error) {
                    this.currentErrorSections[error.section] = error.error
                    this._errorSections$.next(this.currentErrorSections)
                }
            })
        }
        this.resubscribe()
        if(this.isParent) {
            this.contents._errorReporter$.next({
                section: this.contentsSection.anchor,
                error: Object.values(this.currentErrorSections).some(x => x)
            })

            this.errorSub = this._errorSections$.subscribe(val => {
                const error = Object.values(val).some(x => x)
                this.contents._errorReporter$.next({
                    section: this.contentsSection.anchor,
                    error: error
                })
            })
        }
    }

    resubscribe() {
        if(this.forms || this.errors) {
            const err = (this.forms && this.forms.some((x: AbstractControl) => x.invalid))
                      || (this.errors && this.errors.some(x => !!x))
            this.contents._errorReporter$.next({
                section: this.contentsSection.anchor,
                error: err
            })
            if(this.parentContentsSection) {
                this.parentContentsSection._errorReporter$.next({
                    section: this.contentsSection.anchor,
                    error: err
                })
            }
            if(this.errorReportSub) this.errorReportSub.unsubscribe()
            this.errorReportSub = combineLatest(...(this.forms.map((x: AbstractControl) => x.statusChanges.pipe(startWith(x.status)))), function(...args) {
                return [...args]
            }).subscribe(statuses => {
                const error = statuses.some(status => status == 'INVALID')
                if(!this.isParent) {
                    this.contents._errorReporter$.next({
                        section: this.contentsSection.anchor,
                        error: error
                    })
                }
                if(this.parentContentsSection) {
                    this.parentContentsSection._errorReporter$.next({
                        section: this.contentsSection.anchor,
                        error: error
                    })
                }
            })

            //
            if(!this.isParent) {
                if(this.errorSub) this.errorSub.unsubscribe()
                this.errorSub = this.contents._errorSections$.subscribe(val => {
                    this.error$.next((val && val[this.contentsSection.anchor]))
                })
            }
        }
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        if(this.errorReportSub) this.errorReportSub.unsubscribe()
        if(this.subError) this.subError.unsubscribe()
    }

    // || !this.contents._activeSection$.value

    detectActiveChanges() {
        if (this.isInRange()) {
            if(this.isParent) {
                this.contents._activeParentSection$.next(this.contentsSection.anchor)
            } else {
                this.contents._activeSection$.next(this.contentsSection.anchor);
            }
        } else {
            if(this.isParent) {
                if(this.contents._activeParentSection$.value === this.contentsSection.anchor) {
                    this.contents._activeParentSection$.next(null)
                }
            }
        }
    }

    isInRange(): boolean {
        const pageOffset: number = this.contents.scrollingView ? this.contents.scrollingView.scrollTop : documentOffset();
        const element: HTMLElement = this.elementRef.nativeElement;
        const offset: number = element.offsetTop;
        const height: number = getAbsoluteHeight(element);

        return pageOffset >= offset - this.scrollOffset && pageOffset <= offset + height - this.scrollOffset;
    }
}
