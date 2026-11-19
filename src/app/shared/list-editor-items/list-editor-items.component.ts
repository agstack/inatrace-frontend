import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'list-editor-items',
    templateUrl: './list-editor-items.component.html',
    styleUrls: ['./list-editor-items.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ListEditorItemsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
