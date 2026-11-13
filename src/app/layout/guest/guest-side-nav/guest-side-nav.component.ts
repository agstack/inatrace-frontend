import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-guest-side-nav',
    templateUrl: './guest-side-nav.component.html',
    styleUrls: ['./guest-side-nav.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class GuestSideNavComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
