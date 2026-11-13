import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-privacy-page',
    templateUrl: './privacy-page.component.html',
    styleUrls: ['./privacy-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PrivacyPageComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
