import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-guest-top-nav',
    templateUrl: './guest-top-nav.component.html',
    styleUrls: ['./guest-top-nav.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class GuestTopNavComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
