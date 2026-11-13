import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-number-row',
    templateUrl: './number-row.component.html',
    styleUrls: ['./number-row.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class NumberRowComponent implements OnInit {

  @Input()
  label = null;
  constructor() { }

  ngOnInit(): void {
  }

}
