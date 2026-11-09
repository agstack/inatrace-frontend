import { GeneralSifrantService } from './general-sifrant.service';
import { ApiFacility } from '../../api/model/apiFacility';
import {
  FacilityControllerService, ListAvailableSellingFacilitiesForCompany
} from '../../api/api/facilityController.service';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpErrorResponse, HttpEvent, HttpResponse } from '@angular/common/http';
import { PagedSearchResults } from '../../interfaces/CodebookHelperService';
import { catchError, expand, filter, map, reduce, shareReplay, tap } from 'rxjs/operators';
import { ApiPaginatedResponseApiFacility } from '../../api/model/apiPaginatedResponseApiFacility';

export type SupplierFacilityState = 'idle' | 'loading' | 'empty' | 'ready' | 'error' | 'forbidden';

export class AvailableSellingFacilitiesForCompany extends GeneralSifrantService<ApiFacility> {

  readonly supplierState$ = new BehaviorSubject<SupplierFacilityState>('idle');

  requestParams = {
    limit: 1000,
    offset: 0,
  } as ListAvailableSellingFacilitiesForCompany.PartialParamMap;

  private allItems$: Observable<ApiFacility[]> = null;

  constructor(
    private facilityControllerService: FacilityControllerService,
    private companyId: number,
    private semiProductId?: number,
    private finalProductId?: number
  ) {
    super();
  }

  textRepresentation(el: ApiFacility): string {
    return `${el.name} (${el.company?.name || ''})`;
  }

  identifier(el: ApiFacility) {
    return el.id;
  }

  placeholder(): string {
    return $localize`:@@activeCollectingFacility.input.placehoder:Select facility`;
  }

  /**
   * A codebook instance is bound to a single company/product context, so its cache is scoped to
   * that context. A product or action change creates a new instance instead of invalidating this one.
   */
  makeQuery(key: string, params?: any): Observable<PagedSearchResults<ApiFacility>> {

    const limit = params && params.limit ? params.limit : this.limit();
    const term = (key || '').trim().toLocaleLowerCase();

    // Only the first query of a context shows the loading state. Cached pages are replayed
    // synchronously, so emitting loading again would leave the selector in a stale state.
    if (!this.allItems$) {
      this.supplierState$.next('loading');
    }

    return this.loadAllItems().pipe(
      map((all: ApiFacility[]) => {
        const results = all.filter(item => this.textRepresentation(item).toLocaleLowerCase().includes(term));
        return { results, offset: 0, limit, totalCount: results.length };
      })
    );
  }

  private loadAllItems(): Observable<ApiFacility[]> {
    if (!this.allItems$) {
      this.allItems$ = this.fetchAllPages().pipe(
        tap((all: ApiFacility[]) => this.supplierState$.next(all.length ? 'ready' : 'empty')),
        catchError(error => {
          // Failed queries must not stay cached, otherwise retry would replay the failure.
          this.allItems$ = null;
          this.supplierState$.next(this.isPermissionError(error) ? 'forbidden' : 'error');
          return of([]);
        }),
        shareReplay(1)
      );
    }
    return this.allItems$;
  }

  private fetchAllPages(): Observable<ApiFacility[]> {

    const reqParams: ListAvailableSellingFacilitiesForCompany.PartialParamMap = {
      id: this.companyId,
      semiProductId: this.semiProductId,
      finalProductId: this.finalProductId,
      ...this.requestParams
    };

    const fetchPage = (offset: number): Observable<ApiPaginatedResponseApiFacility> =>
      this.facilityControllerService.listAvailableSellingFacilitiesForCompanyByMap({ ...reqParams, offset }, 'events').pipe(
        map((event: HttpEvent<ApiPaginatedResponseApiFacility>) => {
          // TokenInterceptor turns HTTP failures into a value (of(err)). With the default
          // 'body' observe mode HttpClient drops that event and completes empty, which would
          // be indistinguishable from a successful empty result. Consuming the events keeps
          // the failure visible here.
          if (event instanceof HttpErrorResponse) { throw event; }
          if (!(event instanceof HttpResponse)) { return null; }
          const res = event.body;
          if (!res || !res.data || !Array.isArray(res.data.items) || typeof res.data.count !== 'number') {
            throw res;
          }
          return res;
        }),
        filter((res): res is ApiPaginatedResponseApiFacility => !!res)
      );

    let nextOffset = 0;
    return fetchPage(0).pipe(
      expand(res => {
        nextOffset += res.data.items.length;
        if (nextOffset >= res.data.count) { return of(); }
        if (res.data.items.length === 0) { return throwError(new Error('Incomplete supplier facility response')); }
        return fetchPage(nextOffset);
      }),
      reduce((all: ApiFacility[], res) => all.concat(res.data.items), [])
    );
  }

  private isPermissionError(error: any): boolean {
    return !!error && (error.status === 401 || error.status === 403);
  }

}
