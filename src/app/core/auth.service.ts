import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of, ReplaySubject } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { UserControllerService } from 'src/api/api/userController.service';
import { ApiUserGet } from 'src/api/model/apiUserGet';
import { LanguageCodeHelper } from '../language-code-helper';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly pathsToIgnoreRefresh = ['login', 'p-cd', 'q-cd', 'q', 'p'];

  private readonly userProfileSubject = new ReplaySubject<ApiUserGet | null>(1);
  userProfile$ = this.userProfileSubject.asObservable();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userController: UserControllerService
  ) {

    let skipRefresh = false;
    this.route.snapshot.children.forEach(routeChild => {
      skipRefresh = routeChild.url.map(urlSegment => urlSegment.path).some(path => this.pathsToIgnoreRefresh.includes(path));
      if (skipRefresh) { return; }
    });

    if (!skipRefresh) {
      setTimeout(() => this.refreshUserProfile());
    }
  }

  private async refreshUserProfile() {

    try {

      const resp = await this.userController.getProfileForUser().toPromise();

      if (resp) {
        if (resp.data.language) {
          LanguageCodeHelper.setCurrentLocale(resp.data.language.toLowerCase());
          localStorage.setItem('inatraceLocale', resp.data.language.toLowerCase());
        }
        this.userProfileSubject.next(resp.data);
      } else {
        this.userProfileSubject.next(null);
      }
    } catch (error) {
      this.userProfileSubject.next(null);
    }
  }

  login(username: string, password: string, redirect = null) {

    this.userController.login(
      {
        username,
        password
      }
    ).pipe(
      catchError(() => {
        return of(null);
      })
    ).subscribe(() => {

      this.refreshUserProfile().then(() => {
        if (redirect !== null) {
          if (typeof redirect === 'string') {
            this.router.navigate([redirect]).then();
          }
          if (Array.isArray(redirect)) {
            this.router.navigate(redirect).then();
          }
        }
      });
    });
  }

  async logout() {

    sessionStorage.clear();

    await this.userController.logout().pipe(take(1)).toPromise();
    this.router.navigate(['login']).then(() => this.userProfileSubject.next(null));
  }

  register(email, password, name, surname, redirect = null) {
    this.userController.createUser(
      {
        email,
        name,
        password,
        surname
      }
    ).pipe(
      catchError(() => {
        return of(null);
      })
    ).subscribe(() => {
      if (redirect !== null) {
        this.router.navigate([redirect]).then();
      }
    });
  }

}
