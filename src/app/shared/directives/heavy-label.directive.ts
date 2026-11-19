import { Directive, ElementRef, Renderer2, AfterViewInit } from '@angular/core';

@Directive({
    selector: '[dir-heavyLabel]',
    standalone: false
})
export class HeavyLabelDirective implements AfterViewInit {

    constructor(private el: ElementRef, private renderer: Renderer2) {
    }

    ngAfterViewInit() {
        const label = this.el.nativeElement.querySelector('label');
        if(label) {
            this.renderer.addClass(label, 'heavy-label');
        } else {
            this.renderer.addClass(this.el.nativeElement, 'heavy-label');
        }

    }

}
