import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../auth.service';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SystemOrRegionalAdminGuardService  {

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {

    const res = await this.authService.userProfile$.pipe(take(1)).toPromise();
    if (res && ('SYSTEM_ADMIN' === res.role || 'REGIONAL_ADMIN' === res.role)) { return true; }
    else { this.router.navigate(['/', 'home']).then(); }
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean |
    Observable<boolean> | Promise<boolean> {
    return this.canActivate(route, state);
  }

}
