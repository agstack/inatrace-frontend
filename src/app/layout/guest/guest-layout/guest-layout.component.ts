import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-guest-layout',
    templateUrl: './guest-layout.component.html',
    styleUrls: ['./guest-layout.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class GuestLayoutComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
