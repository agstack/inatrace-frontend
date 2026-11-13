import { Directive, ElementRef } from '@angular/core';

@Directive({
    selector: '[appScrollContainer]',
    standalone: false
})
export class ScrollContainerDirective {

  constructor(
    private elRef: ElementRef,
  ) { }

  public get x() {
    return this.elRef.nativeElement.getBoundingClientRect().x;
  }

  public get y() {
    return this.elRef.nativeElement.getBoundingClientRect().y;
  }

  public get width() {
    return this.elRef.nativeElement.getBoundingClientRect().width;
  }

  public get height() {
    return this.elRef.nativeElement.getBoundingClientRect().height;
  }

}
