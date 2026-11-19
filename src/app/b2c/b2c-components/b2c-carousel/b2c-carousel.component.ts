import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { ApiBusinessToCustomerSettings } from '../../../../api/model/apiBusinessToCustomerSettings';

@Component({
    selector: 'app-b2c-carousel',
    templateUrl: './b2c-carousel.component.html',
    styleUrls: ['./b2c-carousel.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class B2cCarouselComponent implements OnInit {

  constructor() { }

  @Input()
  slides;

  @Input()
  productionRecords = false;
  
  @Input()
  b2cSettings: ApiBusinessToCustomerSettings;

  currentSlide = 0;

  ngOnInit(): void {
  }

  onPreviousClick() {
    const previous = this.currentSlide - 1;
    this.currentSlide = previous < 0 ? this.slides.length - 1 : previous;
  }

  onNextClick() {
    const next = this.currentSlide + 1;
    this.currentSlide = next === this.slides.length ? 0 : next;
  }

}
