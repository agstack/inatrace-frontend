import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {from, of, ReplaySubject} from 'rxjs';
import {catchError, filter, switchMap, take} from 'rxjs/operators';
import { UserControllerService } from 'src/api/api/userController.service';
import { ApiUserGet } from 'src/api/model/apiUserGet';
import { LanguageCodeHelper } from '../language-code-helper';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly pathsToIgnoreRefresh = ['login', 'p-cd', 'q-cd'];

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

  // login(username: string, password: string, redirect: string | string[] | null = null) {
  //   this.userController.login({ username, password }) // 1️⃣ Appel de l'API de login
  //       .pipe(
  //           catchError((error) => {
  //             console.error('Erreur lors de la connexion :', error);
  //             return of(null); // Retourne un observable `null` pour éviter la rupture du flux
  //           }),
  //           filter(response => !!response), // 2️⃣ Vérifie que la connexion a réussi avant de continuer
  //           switchMap(() => {
  //             console.log('Connexion réussie, mise à jour du profil...');
  //             return from(this.refreshUserProfile()); // 3️⃣ Attend la fin de `refreshUserProfile()`
  //           })
  //       )
  //       .subscribe({
  //         next: () => {
  //           console.log('Profil mis à jour avec succès.');
  //           if (redirect) {
  //             console.log(`Redirection vers : ${redirect}`);
  //             this.router.navigate(Array.isArray(redirect) ? redirect : [redirect]); // 4️⃣ Redirection après la mise à jour
  //           }
  //         },
  //         error: (err) => {
  //           console.error('Une erreur est survenue :', err);
  //         }
  //       });
  // }



  async logout() {

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
