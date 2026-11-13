import { Directive, ElementRef, Renderer2, AfterViewInit } from '@angular/core';

@Directive({
    selector: '[dir-heavyLabel-primary]',
    standalone: false
})
export class HeavyLabelPrimaryDirective implements AfterViewInit {

    constructor(private el: ElementRef, private renderer: Renderer2) {
    }

    ngAfterViewInit() {
        const label = this.el.nativeElement.querySelector('label');
        if(label) {
            this.renderer.addClass(label, 'heavy-label');
            this.renderer.addClass(label, 'text-primary');
        } else {
            this.renderer.addClass(this.el.nativeElement, 'heavy-label');
            this.renderer.addClass(this.el.nativeElement, 'text-primary');
        }

    }


}
