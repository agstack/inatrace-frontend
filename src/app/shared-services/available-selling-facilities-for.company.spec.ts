import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { AvailableSellingFacilitiesForCompany } from './available-selling-facilities-for.company';

describe('AvailableSellingFacilitiesForCompany', () => {
  let controller: any;
  let service: AvailableSellingFacilitiesForCompany;

  const response = (body: any) => new HttpResponse({ status: 200, body });

  beforeEach(() => {
    controller = { listAvailableSellingFacilitiesForCompanyByMap: jasmine.createSpy('list') };
    service = new AvailableSellingFacilitiesForCompany(controller, 12, undefined, 34);
  });

  it('distinguishes loading and a successful empty list', () => {
    const events = new Subject<any>();
    controller.listAvailableSellingFacilitiesForCompanyByMap.and.returnValue(events);
    service.makeQuery('').subscribe();
    expect(service.supplierState$.value).toBe('loading');
    events.next(response({ data: { items: [], count: 0 } }));
    events.complete();
    expect(service.supplierState$.value).toBe('empty');
  });

  it('filters by facility or company without treating no search matches as no suppliers', () => {
    controller.listAvailableSellingFacilitiesForCompanyByMap.and.returnValue(of(response({ data: {
      items: [{ id: 1, name: 'Mill', company: { name: 'Acme' } }], count: 1
    } })));
    let result: any;
    service.makeQuery('missing').subscribe(value => result = value);
    expect(result.results.length).toBe(0);
    expect(service.supplierState$.value).toBe('ready');
    service.makeQuery('ACME').subscribe(value => result = value);
    expect(result.results.length).toBe(1);
  });

  it('retrieves all pages before filtering', () => {
    controller.listAvailableSellingFacilitiesForCompanyByMap.and.callFake(params => of(response({ data: {
      items: [{ id: params.offset + 1, name: params.offset ? 'Second' : 'First', company: { name: 'Supplier' } }], count: 2
    } })));
    let result: any;
    service.makeQuery('second').subscribe(value => result = value);
    expect(result.results.map(item => item.name)).toEqual(['Second']);
    expect(controller.listAvailableSellingFacilitiesForCompanyByMap.calls.count()).toBe(2);
  });

  it('fetches the supplier pages once per context and filters later searches locally', () => {
    controller.listAvailableSellingFacilitiesForCompanyByMap.and.returnValue(of(response({ data: {
      items: [{ id: 1, name: 'Mill', company: { name: 'Acme' } }], count: 1
    } })));

    let result: any;
    service.makeQuery('').subscribe(value => result = value);
    service.makeQuery('acme').subscribe(value => result = value);
    service.makeQuery('missing').subscribe(value => result = value);

    expect(controller.listAvailableSellingFacilitiesForCompanyByMap.calls.count()).toBe(1);
    expect(result.results.length).toBe(0);
    expect(service.supplierState$.value).toBe('ready');
  });

  it('does not cache a failed query and refetches when retried', () => {
    controller.listAvailableSellingFacilitiesForCompanyByMap.and.returnValues(
      of(new HttpErrorResponse({ status: 500 })),
      of(response({ data: { items: [{ id: 9, name: 'Recovered', company: { name: 'Acme' } }], count: 1 } }))
    );

    let firstResult: any;
    service.makeQuery('').subscribe(value => firstResult = value);
    expect(firstResult.results).toEqual([]);
    expect(service.supplierState$.value).toBe('error');

    let retryResult: any;
    service.makeQuery('').subscribe(value => retryResult = value);

    expect(controller.listAvailableSellingFacilitiesForCompanyByMap.calls.count()).toBe(2);
    expect(service.supplierState$.value).toBe('ready');
    expect(retryResult.results.map(item => item.name)).toEqual(['Recovered']);
  });

  it('handles errors returned as values or thrown and allows retry', () => {
    controller.listAvailableSellingFacilitiesForCompanyByMap.and.returnValues(
      of(new HttpErrorResponse({ status: 500 })), throwError(new Error('network')),
      of(response({ data: { items: [], count: 0 } }))
    );
    service.makeQuery('').subscribe();
    expect(service.supplierState$.value).toBe('error');
    service.makeQuery('').subscribe();
    expect(service.supplierState$.value).toBe('error');
    service.makeQuery('').subscribe();
    expect(service.supplierState$.value).toBe('empty');
  });

  it('keeps permission failures distinct from an empty result', () => {
    controller.listAvailableSellingFacilitiesForCompanyByMap.and.returnValue(of(new HttpErrorResponse({ status: 403 })));
    service.makeQuery('').subscribe();
    expect(service.supplierState$.value).toBe('forbidden');
  });
});
