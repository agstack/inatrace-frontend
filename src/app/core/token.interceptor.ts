import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { catchError } from 'rxjs/operators';
import { GlobalEventManagerService } from './global-event-manager.service';
import { ActivatedRoute, Router } from '@angular/router';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor(
    public auth: AuthService,
    public toasterService: ToastrService,
    public globalEventsManager: GlobalEventManagerService,
    public route: ActivatedRoute,
    private router: Router
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    return next.handle(request).pipe(
      catchError((err: any) => {
        if (err instanceof HttpErrorResponse) {
          try {
            if (err.status === 401) {
              if (err.url.endsWith('/login')) {
                const message = $localize`:@@tokenInterceptor.login.message:Wrong username or password`;
                const title = $localize`:@@tokenInterceptor.login.title:Error`;
                this.toasterService.error(message, title);
              } else if (err.url.endsWith('/logout')) {
                // nothing to do
              } else if (err.url.endsWith('/user/profile') && this.pathsToIgnore()) {
                // landing or get started page, ignore
              } else {
                this.auth.logout().then();
                const message = $localize`:@@tokenInterceptor.logout.message:Your session has expired`;
                const title = $localize`:@@tokenInterceptor.logout.title:Error`;
                this.toasterService.error(message, title);
              }
            } else if (err.status === 403) {
              const message = $localize`:@@tokenInterceptor.403.message:Unauthorized access`;
              const title = $localize`:@@tokenInterceptor.403.title:Error`;
              this.toasterService.error(message, title);
            } else if (err.status === 400) {
              const message = err.error && err.error.errorMessage
                ? err.error.errorMessage
                : $localize`:@@tokenInterceptor.400.message:Request could not be completed. Please review the entered data and try again.`;
              const title = $localize`:@@tokenInterceptor.400.title:Communication error!`;
              this.toasterService.error(message, title);
            } else {
              const message = $localize`:@@tokenInterceptor.other.message:Please reload the page.`;
              const title = $localize`:@@tokenInterceptor.other.title:Communication error!`;
              this.toasterService.error(message, title);
            }
          } catch (e) {
            const message = $localize`:@@tokenInterceptor.catch.message:Please reload the page.`;
            const title = $localize`:@@tokenInterceptor.catch.title:Communication error!`;
            this.toasterService.error(message, title);
          } finally {
            this.globalEventsManager.showLoading(false);
          }
        }
        return of(err);
      })
    );
  }

  pathsToIgnore(){
    const landingUrlTemplate = '/([a-z]{2})/';
    return (Array.isArray(window.location.pathname.match(landingUrlTemplate)) && this.router.url === '/');
  }

}
