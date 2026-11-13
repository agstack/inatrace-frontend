import { Injectable } from '@angular/core';
import { ComponentCanDeactivate } from './component-can-deactivate';


@Injectable({
  providedIn: 'root'
})
export class DeactivateGuardService  {
  canDeactivate(component: ComponentCanDeactivate): boolean {
    if(!component.canDeactivate()){
      const message = $localize`:@@deactivateGuard.message:Changes you made so far will not be saved. Do you want to continue?`
        if (confirm(message)) {
            return true;
        } else {
            return false;
        }
    }
    return true;
  }
}
