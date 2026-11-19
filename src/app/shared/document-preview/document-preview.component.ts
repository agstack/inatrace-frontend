import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';

@Component({
    selector: 'app-document-preview',
    templateUrl: './document-preview.component.html',
    styleUrls: ['./document-preview.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class DocumentPreviewComponent implements OnInit {

  constructor() { }

  @Input()
  document: UntypedFormControl;

  ngOnInit(): void {
  }

}
