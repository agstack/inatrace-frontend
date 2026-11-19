import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';

@Component({
    selector: 'app-color-input',
    templateUrl: './color-input.component.html',
    styleUrls: ['./color-input.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ColorInputComponent implements OnInit {

  constructor() { }

  @Input()
  control: UntypedFormControl;

  @Input()
  disabled = false;

  ngOnInit(): void {
  }

}
