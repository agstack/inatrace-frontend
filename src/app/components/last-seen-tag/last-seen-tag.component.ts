import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { formatDateTimeWithDots } from 'src/shared/utils';

@Component({
    selector: 'app-last-seen-tag',
    templateUrl: './last-seen-tag.component.html',
    styleUrls: ['./last-seen-tag.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class LastSeenTagComponent implements OnInit {

  constructor() { }

  @Input()
  identifier;

  @Input()
  dateFormat;

  date;
  time;

  ngOnInit(): void {
    this.formatDateAndHour();
  }

  formatDateAndHour() {
    const date = new Date(this.dateFormat);
    this.date = formatDateTimeWithDots(this.dateFormat);
    this.time = date.getHours() + ':' + date.getMinutes().toString().padStart(2, '0');
  }

}
