import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FarmerImportConfirmationService } from '../../../../api/api/farmerImportConfirmation.service';
import { Configuration } from '../../../../api/configuration';
import { environment } from '../../../../environments/environment';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

describe('FarmerImportConfirmationService', () => {
  let service: FarmerImportConfirmationService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
    schemas: [NO_ERRORS_SCHEMA],
    imports: [],
    providers: [{ provide: Configuration, useValue: new Configuration({ basePath: environment.basePath }) }, provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()]
});
    service = TestBed.inject(FarmerImportConfirmationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('confirms the selected farmer against the original uploaded document', () => {
    const farmer = { name: 'Ada', surname: 'Test' };
    service.confirmImportedFarmerPlots(12, 34, farmer).subscribe();
    const request = http.expectOne(environment.basePath + '/api/company/userCustomers/import/farmers/12/34/confirm-plots');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(farmer);
    request.flush({});
  });

  it('creates a separate farmer from the original uploaded document', () => {
    const farmer = { name: 'Ada', surname: 'Test' };
    service.createSeparateImportedFarmer(12, 34, farmer).subscribe();
    const request = http.expectOne(environment.basePath + '/api/company/userCustomers/import/farmers/12/34/create-separate');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(farmer);
    request.flush({});
  });
});
