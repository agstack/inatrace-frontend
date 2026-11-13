import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: '[form-position-box]',
    templateUrl: './form-position-box.component.html',
    styleUrls: ['./form-position-box.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FormPositionBoxComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
