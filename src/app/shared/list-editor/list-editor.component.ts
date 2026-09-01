import { Component, OnInit, Input, ContentChildren, QueryList, TemplateRef, ViewChild, ElementRef, ViewChildren, Optional, Host } from '@angular/core';
import { LinkDirective } from '../directives/link.directive';
// import { CdkDragDrop } from '@angular/cdk/drag-drop';

import {
    trigger,
    state,
    style,
    animate,
    transition,
    keyframes,
} from '@angular/animations';
import { faHandMiddleFinger, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { AbstractControl, FormGroup, FormArray } from '@angular/forms';
import { ClosableComponent } from '../closable/closable.component';
import { Subscription, Subject } from 'rxjs';
// import { Subject } from 'rxjs/internal/Subject';

@Component({
    selector: 'list-editor',
    templateUrl: './list-editor.component.html',
    styleUrls: ['./list-editor.component.scss'],
    animations: [
        trigger('expandCollapse', [
            state('closed', style({
                height: '0',
                overflow: 'hidden',
                opacity: '0',
                margin: '0',
                padding: '0'
            })),
            state('open', style({
                opacity: '1'
            })),
            transition(
                'closed=>open',
                animate("200ms")
            ),
            transition(
                'open=>closed',
                animate('200ms ease-out')
            )
        ]),
        trigger('expandCollapse2', [
            state('closed', style({
                height: '0',
                overflow: 'hidden',
                opacity: '0',
                margin: '0',
                padding: '0'
            })),
            state('open', style({
                opacity: '1'
            })),
            transition(
                'closed=>open',
                animate("200ms")
            ),
            transition(
                'open=>closed',
                animate('200ms ease-out')
            )
        ]),
        trigger('expandCollapse3', [
            state('closed', style({
                height: '0',
                overflow: 'hidden',
                opacity: '0',
                margin: '0',
                padding: '0'
            })),
            state('open', style({
                opacity: '1'
            })),
            transition(
                'closed=>open',
                animate("200ms")
            ),
            transition(
                'open=>closed',
                animate('200ms ease-out')
            )
        ]),

    ]
})
export class ListEditorComponent implements OnInit {
    @Input()
    label: string;

    @Input()
    defaultEmptyObjectFactory: () => any;

    @Input()
    headerTemplate: TemplateRef<any>;

    @Input()
    formArray: FormArray;

    @Input()
    headerFormatter: (any) => string

    @Input()
    initCallback?: () => void = null

    @Input()
    saveCallback?: () => boolean = null

    @Input()
    cancelCallback?: () => void = null;

    @Input()
    deleteCallback?: () => void = null;

    @Input()
    toggleCallback?: (state: boolean) => void

    @Input()
    addText = $localize`:@@listEditor.addText:Add`

    @Input()
    invalid = false

    @Input()
    listEditorManager = null;

    @Input()
    disabled: boolean = false;

    @Input()
    canAdd = true

    @Input()
    hideItems = false

    @Input()
    addExternalSubj: Subject<boolean>;

    @ContentChildren(LinkDirective)
    links: QueryList<LinkDirective>;

    open: number = -1

    constructor(
      @Optional() @Host() public closable: ClosableComponent
    ) { }

    labelClosedIndicator = this.hideItems
    closableSub: Subscription
    closableSub2: Subscription

    ngOnInit() {
      if(this.closable && this.closable.mode === 'intelligent') {
        this.closable.openOnValueChange = (value: any[]) => {return value.length > 0}
        this.closable.form = this.listEditorManager.formArray
        this.hideItems = this.closable.controlledHideField$.value
        this.labelClosedIndicator = this.closable.hideField$.value
        this.closableSub = this.closable.controlledHideField$.subscribe(val => {
          this.hideItems = val
        })
        this.closableSub2 = this.closable.hideField$.subscribe(val => {
          this.labelClosedIndicator = val
        })
      }

      if (this.addExternalSubj) {
          this.addExternalSubj.asObservable().subscribe(() => {
             if (this.addElementEnabled()) {
                 this.addElement();
             }
          });
      }
    }

    ngOnDestroy() {
      if(this.closableSub) this.closableSub.unsubscribe()
      if(this.closableSub2) this.closableSub2.unsubscribe()
    }

    ngAfterViewInit() {
    }

    @ViewChild("target", { static: false })
    targetElement: ElementRef<HTMLInputElement>;

    @ViewChildren("addNewLink") addNewLink

    faPlusCircle = faPlusCircle;

    onDrop(event) {
        if (this.listEditorManager) {
            this.listEditorManager.onDrop(event)
        }
        // let ctrl: AbstractControl = this.formArray.controls[event.previousIndex];
        // this.formArray.removeAt(event.previousIndex)
        // this.formArray.insert(event.currentIndex, ctrl);
        // this.formArray.markAsDirty()
        // this.formArray.updateValueAndValidity()
        // if (this.saveCallback) {
        //     this.saveCallback()
        // }
    }

    addElementEnabled() {
        if (this.listEditorManager) {
            return this.listEditorManager.open < 0;
        }
        // return this.open < 0
    }

    scrollToTarget(n = 10) {
        if (n == 0) return
        window.setTimeout(() => {
            if (this.targetElement) {   // scrolanje novega podokna v vidno polje
                this.targetElement.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
            } else {
                this.scrollToTarget(n - 1)
            }
        }, 200)
    }

    isDisabled() {
        return this.disabled || (this.listEditorManager && this.listEditorManager.isDisabled())
    }
    addElement() {
        if (this.listEditorManager) {
            this.listEditorManager.addNew(this.addNewLink.first.nativeElement)
            return;
        }
        // if(this.formArray) {
        //     let form: FormGroup = this.defaultEmptyObjectFactory()
        //     let oldLength = this.links.length
        //     this.formArray.push(form)
        //     this.toggle(oldLength)
        //     this.formArray.markAsDirty()
        //     form.markAsDirty()
        //     this.scrollToTarget()
        //     // if(this.targetElement) {   // scrolanje novega podokna v vidno polje
        //     //     window.setTimeout(() => {
        //     //         this.targetElement.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        //     //     }, 200)
        //     // }
        // }
    }

    toggle(i: number) {
        this.open = this.open == i ? -1 : i
        this.scrollToTarget()
        // if(this.targetElement) {   // scrolanje podokna v vidno polje
        //     window.setTimeout(() => {
        //         this.targetElement.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        //     }, 200)
        // }
        if (this.toggleCallback) {
            this.toggleCallback(this.open >= 0)
        }
    }

    save(i: number) {
        if (this.saveCallback) {
            if (this.saveCallback()) {
                this.toggle(i)
            }
        }

    }

    delete(i: number) {
        this.removeAt(i);
        if (this.saveCallback) {
            this.saveCallback();
        }
        if (this.deleteCallback) {
            this.deleteCallback()
        }
    }

    cancel(i: number) {
        if (this.cancelCallback) {
            this.cancelCallback()
        }
        this.toggle(i)
    }

    init(i: number) {
        if (this.listEditorManager) {
            this.listEditorManager.toggle(i)
        }
        if (this.initCallback) {
            this.initCallback()
        }
        this.toggle(i)
    }

    isOpen(i: number) {
        if (!this.links) return false;
        return i == this.open
    }

    removeAt(i: number) {
        if (this.formArray) {
            this.formArray.removeAt(i)
            this.formArray.markAsDirty()
            this.formArray.markAsTouched()  // nujno zaradi testa pri updateArray
        }
    }

    formattedMessageForHeader(i: number) {
        if (this.headerFormatter) {
            return this.headerFormatter((this.formArray.controls[i] as FormGroup).getRawValue());
        }
    }

    contentObject(i: number): any {
        // TODO: what if not FormGroup?
        return (this.formArray.at(i) as FormGroup).getRawValue()
    }

    itemHeaderComponent(): TemplateRef<any> {
        return this.headerTemplate;
    }

    get textPrazno() {
        let emptyText = $localize`:@@listEditor.emptyText:Empty`
        if(this.isDisabled()) {
          return emptyText;  // Prevedljivo
        }
        return this.addText || 'Add'
    }
}
