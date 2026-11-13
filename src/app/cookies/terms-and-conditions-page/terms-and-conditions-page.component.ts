import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-terms-and-conditions-page',
    templateUrl: './terms-and-conditions-page.component.html',
    styleUrls: ['./terms-and-conditions-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class TermsAndConditionsPageComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
