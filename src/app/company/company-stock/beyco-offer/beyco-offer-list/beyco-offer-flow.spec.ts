import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { throwError } from 'rxjs';
import { TokenInterceptor } from '../../../../core/token.interceptor';
import { BeycoOfferListComponent } from './beyco-offer-list.component';

describe('Beyco offer provider failure', () => {
  it('shows the error without reporting success or logging out', () => {
    const auth = {logout: jasmine.createSpy('logout')};
    const toaster = {error: jasmine.createSpy('error')};
    const events = {showLoading: jasmine.createSpy('showLoading'), push: jasmine.createSpy('push')};
    const router = {navigate: jasmine.createSpy('navigate')};
    const interceptor = new TokenInterceptor(auth as any, toaster as any, events as any, {} as any, router as any);
    const failure = new HttpErrorResponse({
      status: 503,
      url: '/api/chain/beyco-order/company/1/order',
      error: {status: 'UPSTREAM_HTTP_ERROR', errorMessage: 'Beyco service request failed'}
    });
    const service = {sendBeycoOrder: jasmine.createSpy('sendBeycoOrder').and.callFake(() =>
      interceptor.intercept(new HttpRequest('POST', failure.url, {}), {handle: () => throwError(failure)} as any)
    )};
    const component = new BeycoOfferListComponent(new FormBuilder(), service as any, {} as any,
        router as any, events as any, {beycoToken: {accessToken: 'synthetic'}} as any, {} as any);
    component.generalForm = new FormBuilder().group({});
    spyOn(component, 'buildApiBeycoOrderFields').and.returnValue({} as any);

    component.submit();

    expect(service.sendBeycoOrder).toHaveBeenCalledTimes(1);
    expect(events.push).toHaveBeenCalledTimes(1);
    expect(events.push.calls.mostRecent().args[0].notificationType).toBe('error');
    expect(events.push.calls.mostRecent().args[0].message).toBe('Beyco service request failed');
    expect(auth.logout).not.toHaveBeenCalled();
    expect(toaster.error).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('keeps the existing interceptor behavior for other 503 responses', () => {
    const auth = {logout: jasmine.createSpy('logout')};
    const toaster = {error: jasmine.createSpy('error')};
    const events = {showLoading: jasmine.createSpy('showLoading')};
    const interceptor = new TokenInterceptor(auth as any, toaster as any, events as any, {} as any, {} as any);
    const failure = new HttpErrorResponse({status: 503, url: '/api/product/list'});
    let received: any;

    interceptor.intercept(new HttpRequest('GET', failure.url), {handle: () => throwError(failure)} as any)
        .subscribe(result => received = result);

    expect(received).toBe(failure);
    expect(toaster.error).toHaveBeenCalledTimes(1);
    expect(auth.logout).not.toHaveBeenCalled();
  });
});
