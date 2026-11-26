import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { CompanyFarmersDetailsComponent } from './company-farmers-details.component';

describe('CompanyFarmersDetailsComponent GeoJSON upload', () => {
  let component: CompanyFarmersDetailsComponent;
  let globalEventsManager: jasmine.SpyObj<any>;
  let httpClient: jasmine.SpyObj<any>;

  function uploadEvent(file: File | null): any {
    const input = {
      files: file ? [file] : [],
      value: file ? 'C:\\fakepath\\geo-data.json' : ''
    };
    return { target: input };
  }

  beforeEach(() => {
    globalEventsManager = jasmine.createSpyObj('GlobalEventManagerService', ['showLoading', 'push']);
    httpClient = jasmine.createSpyObj('HttpClient', ['post']);
    httpClient.post.and.returnValue(of({ status: 'OK' }));

    component = new CompanyFarmersDetailsComponent(
      null,
      { snapshot: { params: { id: '17' }, data: {} } } as any,
      { configuration: { basePath: '' } } as any,
      globalEventsManager,
      null,
      null,
      null,
      httpClient,
      null,
      null
    );
    component.update = true;
    component.farmer = { id: 17 } as any;
    spyOn(component, 'ngOnInit').and.stub();
  });

  it('uploads the file, reloads and clears the input on success', async () => {
    const file = new File(['{}'], 'valid.geojson', { type: 'application/json' });
    const event = uploadEvent(file);

    await component.geoJSONSelectedToUpload(event);

    expect(httpClient.post).toHaveBeenCalledTimes(1);
    const [url, body] = httpClient.post.calls.mostRecent().args;
    expect(url).toBe('/api/company/userCustomers/17/uploadGeoData');
    expect(body instanceof FormData).toBeTrue();
    expect(body.get('file')).toBe(file);
    expect(component.ngOnInit).toHaveBeenCalledTimes(1);
    expect(globalEventsManager.push).not.toHaveBeenCalled();
    expect(globalEventsManager.showLoading).toHaveBeenCalledWith(true);
    expect(globalEventsManager.showLoading).toHaveBeenCalledWith(false);
    expect(event.target.value).toBe('');
  });

  it('shows a localized error, does not reload and clears the input on 400', async () => {
    httpClient.post.and.returnValue(of(new HttpErrorResponse({
      status: 400,
      error: { status: 'INVALID_REQUEST', errorMessage: 'Invalid GeoJSON coordinates' }
    })));
    const event = uploadEvent(new File(['{}'], 'invalid.geojson', { type: 'application/json' }));

    await component.geoJSONSelectedToUpload(event);

    expect(httpClient.post).toHaveBeenCalledTimes(1);
    expect(component.ngOnInit).not.toHaveBeenCalled();
    expect(globalEventsManager.push).toHaveBeenCalledWith(jasmine.objectContaining({
      notificationType: 'error',
      title: 'Could not upload geo-data',
      message: 'Check the file and try again.'
    }));
    expect(globalEventsManager.showLoading).toHaveBeenCalledWith(false);
    expect(event.target.value).toBe('');
  });

  it('does not duplicate the global message for an intercepted server failure', async () => {
    httpClient.post.and.returnValue(of(new HttpErrorResponse({ status: 500 })));
    const event = uploadEvent(new File(['{}'], 'server-error.geojson'));

    await component.geoJSONSelectedToUpload(event);

    expect(component.ngOnInit).not.toHaveBeenCalled();
    expect(globalEventsManager.push).not.toHaveBeenCalled();
    expect(globalEventsManager.showLoading).toHaveBeenCalledWith(false);
    expect(event.target.value).toBe('');
  });

  it('shows an error for a generic upload failure', async () => {
    httpClient.post.and.returnValue(throwError(new Error('network')));

    await component.geoJSONSelectedToUpload(uploadEvent(new File(['{}'], 'error.geojson')));

    expect(component.ngOnInit).not.toHaveBeenCalled();
    expect(globalEventsManager.push).toHaveBeenCalledWith(jasmine.objectContaining({
      notificationType: 'error'
    }));
  });

  it('does nothing when no file is selected', async () => {
    await component.geoJSONSelectedToUpload(uploadEvent(null));

    expect(httpClient.post).not.toHaveBeenCalled();
    expect(globalEventsManager.push).not.toHaveBeenCalled();
  });

  it('does nothing when the farmer is not editable', async () => {
    component.update = false;

    await component.geoJSONSelectedToUpload(uploadEvent(new File(['{}'], 'valid.geojson')));

    expect(httpClient.post).not.toHaveBeenCalled();
    expect(globalEventsManager.push).not.toHaveBeenCalled();
  });
});
