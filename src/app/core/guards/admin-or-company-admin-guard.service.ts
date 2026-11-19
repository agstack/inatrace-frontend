import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Injectable } from '@angular/core';
import { AuthService } from '../auth.service';
import { take } from 'rxjs/operators';
import { ApiUserGet } from '../../../api/model/apiUserGet';
import RoleEnum = ApiUserGet.RoleEnum;

/**
 * Guard that checks if the current user is either Company admin or a System admin.
 */
@Injectable({
    providedIn: 'root'
})
export class AdminOrCompanyAdminGuardService  {

    constructor(
        private router: Router,
        private authService: AuthService
    ) { }

    async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {

        const companyId = Number(route.params.id);

        const userProfile = await this.authService.userProfile$.pipe(take(1)).toPromise();

        if (userProfile) {
            if (userProfile.role === RoleEnum.SYSTEMADMIN) {
                return true;
            } else if (userProfile.role === RoleEnum.REGIONALADMIN && userProfile.companyIds.includes(companyId)) {
                return true;
            } else if (userProfile.companyIdsAdmin.includes(companyId)) {
                return true;
            }
        }

        return this.router.createUrlTree(['/', 'home']);
    }

}
