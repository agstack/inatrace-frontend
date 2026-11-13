import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'checkbox-input-rich-label',
    templateUrl: './checkbox-input-rich-label.component.html',
    styleUrls: ['./checkbox-input-rich-label.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CheckboxInputRichLabelComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
