import {Component, Input, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {UntypedFormControl} from '@angular/forms';

@Component({
    selector: 'app-toggle-switch',
    templateUrl: './toggle-switch.component.html',
    styleUrls: ['./toggle-switch.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ToggleSwitchComponent implements OnInit {

  @Input()
  formControlCheckbox = new UntypedFormControl(false);

  @Input()
  disabled: boolean = false;

  constructor() { }

  ngOnInit(): void {
    if (this.disabled) {
      this.formControlCheckbox.disable();
    }
  }

}
