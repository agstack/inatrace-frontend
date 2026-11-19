import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'attachment-uploader-content',
    templateUrl: './attachment-uploader-content.component.html',
    styleUrls: ['./attachment-uploader-content.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AttachmentUploaderContentComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
