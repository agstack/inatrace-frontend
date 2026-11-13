import { Component, OnInit, Input, EventEmitter, Output, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import {
    trigger,
    state,
    style,
    animate,
    transition,
    keyframes
} from '@angular/animations';
import { initial } from 'lodash-es';


@Component({
    selector: 'tag-list-tag',
    templateUrl: './tag-list-tag.component.html',
    styleUrls: ['./tag-list-tag.component.scss'],
    animations: [
        trigger('deleteAnimate', [
            state('active', style({})),
            state('deleted', style({
                opacity: '0',
                width: '0',
                minWidth: '0',
                paddingLeft: '0',
                paddingRight: '0'
            })),
            transition('active=>deleted', animate("300ms"))
        ])
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class TagListTagComponent implements OnInit {

    @Input()
    text: string = null

    @Output() onRemove = new EventEmitter<any>();

    deleted = false

    constructor() { }

    ngOnInit() {
    }

    onDelete(event) {
        this.deleted = true
    }

    initialWidth = 0;

    startAnimation(event) {
        if (event.fromState === 'active' && event.toState === 'deleted') {
            this.initialWidth = this.tagElement.nativeElement.offsetWidth
        }
    }

    @ViewChild('tagElement', {static: false}) tagElement : ElementRef;

    deleteAfterAnimation(event) {
        if(event.fromState === 'active' && event.toState === 'deleted') {
            this.onRemove.next(event)
        }
    }
}
