import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription, combineLatest } from 'rxjs';
import { AbstractControl, UntypedFormControl } from '@angular/forms';
import { map, shareReplay } from 'rxjs/operators';
import { faPlusSquare, faMinusSquare, faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';

@Component({
    selector: 'app-closable',
    templateUrl: './closable.component.html',
    styleUrls: ['./closable.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ClosableComponent implements OnInit, OnDestroy {
  public hideField$ = new BehaviorSubject<boolean>(true);

  private reorderMode$ = new BehaviorSubject<boolean>(false);

  public _controlledHideField$ = combineLatest(this.hideField$, this.reorderMode$,
    (hide: boolean, reorder: boolean) => {
      return reorder || hide
    }
  ).pipe(
    shareReplay(1)
  )

  controlledHideField$ = new BehaviorSubject<boolean>(true);

  faPlusSquare = faPlusSquare;
  faMinusSquare = faMinusSquare;
  faEye = faEye;
  faEyeSlash = faEyeSlash

  @Output() onToggle = new EventEmitter<boolean>();
  _form = null
  @Input() set form(value: AbstractControl) {
    this._form = value;
    if(this._form) {
      this.resubscribe()
      this.initialized = true;
    }
  }

  initialized = false;

  get form(): AbstractControl {
    return this._form;
  }

  @Input() openOnValueChange = (value) => !!value   // test for value to open

  @Input()
  fieldKey = null

  @Input()
  mode: 'intelligent' | 'simple' = 'intelligent'

  @Input()
  label = null

  _visibilityForm: UntypedFormControl = null;
  @Input() set visibilityForm(value: UntypedFormControl) {
      this._visibilityForm = value;
      if(value) {
        this.resubscribeVisibility()
      }
  }

  get visibilityForm(): UntypedFormControl {
    return this._visibilityForm
  }
  _reorderMode = false;
  @Input() set reorderMode(value: boolean) {
    this._reorderMode = value;
    this.reorderMode$.next(value)
  }
  _nonClosable = false;
  @Input() set nonClosable(value: boolean) {
    if(value) {
      this.hideField$.next(false)
    }
    this._nonClosable = value;
  }

  get nonClosable(): boolean {
    return this._nonClosable
  }


  get reorderMode(): boolean {
    return this._reorderMode;
  }

  subCtrlHide: Subscription = null;

  constructor() {
    this.subCtrlHide = this._controlledHideField$.subscribe(val => {
      this.controlledHideField$.next(val);
    })
   }

  hideSub: Subscription = null;
  ngOnInit(): void {
      this.hideSub = this.hideField$.subscribe(val => this.onToggle.next(val))
  }

  visibilitySub: Subscription = null;
  resubscribeVisibility() {
      if(this.nonClosable) {
        this.hideField$.next(false)
      } else {
        this.hideField$.next(!this.visibilityForm.value)
      }
      if(this.visibilitySub) this.visibilitySub.unsubscribe()
      this.visibilitySub = this.hideField$.subscribe(val => {
        const oldValue = this.visibilityForm.value;
        this.visibilityForm.setValue(!val);
        if(oldValue != !val) {
          this.visibilityForm.markAsDirty();
        }
      })
  }
  public _internalShowField$ = this.controlledHideField$.pipe(
    map(val => {
      if(this.mode === 'intelligent') return true;
      return !val;
    }),
    shareReplay(1)
  )

  public _internalDoNotShowField$ = this._internalShowField$.pipe(
    map(x => !x),
    shareReplay(1)
  )

  sub: Subscription = null;
  resubscribe() {
    if(!this.initialized && this.openOnValueChange(this.form.value)) {
      if(!this.visibilityForm) this.hideField$.next(false);
    }
    if(this.sub) this.sub.unsubscribe()
    this.sub = this.form.valueChanges.subscribe(val => {
      if(this.openOnValueChange(val) && !this.visibilityForm) {
        this.hideField$.next(false);
      }
    })
  }

  toggleField(): void {
    if(!this.nonClosable) {
      this.hideField$.next(!this.hideField$.value);
    }
  }

  ngOnDestroy() {
    if(this.sub) this.sub.unsubscribe()
    if(this.hideSub) this.hideField$.unsubscribe()
    if(this.subCtrlHide) this.subCtrlHide.unsubscribe()
    if(this.visibilitySub) this.visibilitySub.unsubscribe()
  }
}
