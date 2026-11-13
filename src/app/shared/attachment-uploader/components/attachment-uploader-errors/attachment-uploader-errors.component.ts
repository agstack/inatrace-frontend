import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'attachment-uploader-errors',
    templateUrl: './attachment-uploader-errors.component.html',
    styleUrls: ['./attachment-uploader-errors.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AttachmentUploaderErrorsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
