import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-landing-page-layout',
    templateUrl: './landing-page-layout.component.html',
    styleUrls: ['./landing-page-layout.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class LandingPageLayoutComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
