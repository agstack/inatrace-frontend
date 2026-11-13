import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'tag-closed',
    templateUrl: './smart-tag-closed.component.html',
    styleUrls: ['./smart-tag-closed.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SmartTagClosedComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
