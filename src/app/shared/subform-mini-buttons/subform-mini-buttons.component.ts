import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'subform-mini-buttons',
    templateUrl: './subform-mini-buttons.component.html',
    styleUrls: ['./subform-mini-buttons.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SubformMiniButtonsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
