import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-system-left-panel',
    templateUrl: './system-left-panel.component.html',
    styleUrls: ['./system-left-panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SystemLeftPanelComponent implements OnInit {

  @Input()
  title: string = null;

  @Input()
  isAdmin = false;

  constructor() { }

  ngOnInit(): void {
  }

}
