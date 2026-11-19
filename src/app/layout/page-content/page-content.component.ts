import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-page-content',
    templateUrl: './page-content.component.html',
    styleUrls: ['./page-content.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PageContentComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
