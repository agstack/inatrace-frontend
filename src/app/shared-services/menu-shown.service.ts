import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MenuShownService {
    private menuShownSubject = new BehaviorSubject<boolean>(false);

    public menuShown$ = this.menuShownSubject.asObservable();

    public set(value: boolean) {
        if (value != this.menuShownSubject.value) {
            this.menuShownSubject.next(value);
        }
    }

    public toggle() {
        this.menuShownSubject.next(!this.menuShownSubject.value);
    }

    constructor() {

    }
}
