import {Directive, TemplateRef} from '@angular/core';

@Directive({
    selector: '[dir-link]',
    standalone: false
})
export class LinkDirective {
    constructor(public template: TemplateRef<any>) { }
}
