import {Directive, HostListener} from '@angular/core';

@Directive({
    selector: 'textinput[appWholeNumber][type=number]',
    standalone: false
})
export class WholeNumberDirective {

  constructor() { }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (!event.ctrlKey && !event.metaKey) {
      if (
          /^\d$/.test(event.key) ||
          event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight' ||
          event.key === 'Backspace' || event.key === 'Delete' ||
          event.key === 'Home' || event.key === 'End' || event.key === 'Tab'
      ) {
        return;
      }
    }

    event.preventDefault();
  }

}
