import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'list-editor-errors',
    templateUrl: './list-editor-errors.component.html',
    styleUrls: ['./list-editor-errors.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ListEditorErrorsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
