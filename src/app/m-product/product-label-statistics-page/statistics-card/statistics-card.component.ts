import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-statistics-card',
    templateUrl: './statistics-card.component.html',
    styleUrls: ['./statistics-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class StatisticsCardComponent implements OnInit {

  @Input()
  text: string = null;

  @Input()
  value: number = null;

  @Input()
  faIcon = null;

  @Input()
  iconColor: string = null;

  constructor() { }

  ngOnInit(): void {
  }

}
