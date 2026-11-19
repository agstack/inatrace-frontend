import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-landing-page-footer',
    templateUrl: './landing-page-footer.component.html',
    styleUrls: ['./landing-page-footer.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class LandingPageFooterComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
