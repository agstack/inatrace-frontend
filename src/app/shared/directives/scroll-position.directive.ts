import { Directive, Host, ElementRef, HostListener, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { ScrollContainerDirective } from './scroll-container.directive';

@Directive({
    selector: '[appScrollPosition]',
    standalone: false
})
export class ScrollPositionDirective implements OnInit {

  @Input()
  cardWidth = 160;

  @Output() hasLeft = new EventEmitter<boolean>();
  @Output() hasRight = new EventEmitter<boolean>();

  constructor(
    private elRef: ElementRef,
    @Host() private scrollContainer: ScrollContainerDirective
  ) {

  }

  public get width() {
    return this.elRef.nativeElement.getBoundingClientRect().width;
  }

  public get height() {
    return this.elRef.nativeElement.getBoundingClientRect().height;
  }

  get canGoLeft() {
    return this.elRef.nativeElement.scrollLeft > 10
  }

  get canGoRight() {
    const el = this.elRef.nativeElement
    return el.scrollWidth - el.scrollLeft - 10 > this.scrollContainer.width;
  }


  @HostListener('scroll', ['$event']) onScroll($event:Event):void {
    this.hasLeft.next(this.canGoLeft);
    this.hasRight.next(this.canGoRight);
  };

  ngOnInit() {
    // console.log("INIT:", this.canGoLeft, this.canGoRight)
    setTimeout(() => {
      this.hasLeft.next(this.canGoLeft);
      this.hasRight.next(this.canGoRight);
    }, 500)
  }
}
