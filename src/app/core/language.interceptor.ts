import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LanguageCodeHelper } from '../language-code-helper';

@Injectable()
export class LanguageInterceptor implements HttpInterceptor {

  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const newRequest = request.clone({
      headers: request.headers.append('language', LanguageCodeHelper.getCurrentLocale().toUpperCase())
    });
    return next.handle(newRequest);
  }
}
