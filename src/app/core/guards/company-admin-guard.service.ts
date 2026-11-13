import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Injectable } from '@angular/core';
import { AuthService } from '../auth.service';
import { take } from 'rxjs/operators';

/**
 * Guard that checks if the current user Company admin.
 */
@Injectable({
    providedIn: 'root'
})
export class CompanyAdminGuardService  {

    constructor(
        private router: Router,
        private authService: AuthService
    ) { }

    async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {

        const companyId = Number(route.params.id);

        const userProfile = await this.authService.userProfile$.pipe(take(1)).toPromise();
        if (userProfile && userProfile.companyIdsAdmin.includes(companyId)) {
            return true;
        }

        return this.router.createUrlTree(['/', 'home']);
    }

}
