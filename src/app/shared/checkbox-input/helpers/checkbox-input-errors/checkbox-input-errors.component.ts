import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'checkbox-input-errors',
    templateUrl: './checkbox-input-errors.component.html',
    styleUrls: ['./checkbox-input-errors.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CheckboxInputErrorsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
