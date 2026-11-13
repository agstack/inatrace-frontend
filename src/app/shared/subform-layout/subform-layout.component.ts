import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'subform-layout',
    templateUrl: './subform-layout.component.html',
    styleUrls: ['./subform-layout.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SubformLayoutComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
