import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'subform-form',
    templateUrl: './subform-form.component.html',
    styleUrls: ['./subform-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SubformFormComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
