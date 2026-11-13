import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../auth.service';
import { take } from 'rxjs/operators';
import { ApiUserGet } from '../../../api/model/apiUserGet';

@Injectable({
  providedIn: 'root'
})
export class ActivatedUserGuardService  {

  constructor(
      private router: Router,
      private authService: AuthService
  ) { }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    const res = await this.authService.userProfile$.pipe(take(1)).toPromise();

    return res && res.status === ApiUserGet.StatusEnum.ACTIVE;
  }
}
