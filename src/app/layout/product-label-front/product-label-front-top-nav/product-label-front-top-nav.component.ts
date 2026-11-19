import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-product-label-front-top-nav',
    templateUrl: './product-label-front-top-nav.component.html',
    styleUrls: ['./product-label-front-top-nav.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ProductLabelFrontTopNavComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
