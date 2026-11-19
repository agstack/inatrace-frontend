import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'tag-open',
    templateUrl: './smart-tag-open.component.html',
    styleUrls: ['./smart-tag-open.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SmartTagOpenComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
