import { HttpErrorResponse, HttpHandler, HttpRequest } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from './auth.service';
import { GlobalEventManagerService } from './global-event-manager.service';
import { TokenInterceptor } from './token.interceptor';

describe('TokenInterceptor', () => {
  let auth: jasmine.SpyObj<AuthService>;
  let toaster: jasmine.SpyObj<ToastrService>;
  let globalEventsManager: jasmine.SpyObj<GlobalEventManagerService>;
  let interceptor: TokenInterceptor;

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['logout']);
    auth.logout.and.returnValue(Promise.resolve());
    toaster = jasmine.createSpyObj('ToastrService', ['error']);
    globalEventsManager = jasmine.createSpyObj('GlobalEventManagerService', ['showLoading']);
    interceptor = new TokenInterceptor(
      auth,
      toaster,
      globalEventsManager,
      {} as ActivatedRoute,
      { url: '/company' } as Router
    );
  });

  function interceptError(status: number, url: string, error: any = null) {
    const request = new HttpRequest('GET', url);
    const response = new HttpErrorResponse({ status, url, error });
    const handler = {
      handle: () => throwError(response)
    } as HttpHandler;
    const values = [];

    interceptor.intercept(request, handler).subscribe(value => values.push(value));

    expect(values).toEqual([response]);
    expect(globalEventsManager.showLoading).toHaveBeenCalledWith(false);
  }

  it('shows a safe fallback for a 400 response without a body', () => {
    interceptError(400, '/api/chain/processing-order');

    expect(toaster.error).toHaveBeenCalledTimes(1);
    expect(toaster.error.calls.mostRecent().args[0]).toContain('Request could not be completed');
  });

  it('shows one authorization notification for a 403 response', () => {
    interceptError(403, '/api/chain/stock-order/list');

    expect(toaster.error).toHaveBeenCalledTimes(1);
    expect(toaster.error.calls.mostRecent().args[0]).toContain('Unauthorized access');
  });

  it('shows one generic notification for a server failure', () => {
    interceptError(500, '/api/chain/processing-order');

    expect(toaster.error).toHaveBeenCalledTimes(1);
    expect(toaster.error.calls.mostRecent().args[0]).toContain('Please reload the page.');
  });

  it('reports wrong credentials without ending the session', () => {
    interceptError(401, '/api/login');

    expect(auth.logout).not.toHaveBeenCalled();
    expect(toaster.error).toHaveBeenCalledTimes(1);
    expect(toaster.error.calls.mostRecent().args[0]).toContain('Wrong username or password');
  });

  it('does not notify when a logout request receives a 401 response', () => {
    interceptError(401, '/api/logout');

    expect(auth.logout).not.toHaveBeenCalled();
    expect(toaster.error).not.toHaveBeenCalled();
  });

  it('ends an expired session and reports it once', () => {
    interceptError(401, '/api/chain/processing-order');

    expect(auth.logout).toHaveBeenCalledTimes(1);
    expect(toaster.error).toHaveBeenCalledTimes(1);
    expect(toaster.error.calls.mostRecent().args[0]).toContain('Your session has expired');
  });
});
