import { of } from 'rxjs';
import { QrCodeRedirectComponent } from './qr-code-redirect.component';

describe('QrCodeRedirectComponent', () => {

  let router: any;
  let route: any;
  let publicController: any;

  beforeEach(() => {
    router = {
      url: '',
      navigate: jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true))
    };
    route = {
      snapshot: {
        paramMap: {
          get: (key: string) => key === 'uuid' ? 'test-uuid' : 'test-tag'
        }
      }
    };
    publicController = {
      logPublicRequest: jasmine.createSpy('logPublicRequest').and.returnValue(of({}))
    };
  });

  function createComponent(url: string): QrCodeRedirectComponent {
    router.url = url;
    const component = new QrCodeRedirectComponent(route, router, publicController);
    component.ngOnInit();
    return component;
  }

  it('redirects the legacy /q/:uuid QR to the current B2C page with EMPTY', () => {
    createComponent('/q/test-uuid');

    expect(router.navigate).toHaveBeenCalledWith(
      ['p-cd', 'test-uuid', 'EMPTY'],
      { replaceUrl: true }
    );
  });

  it('redirects the legacy /p/:uuid page to the current B2C page with EMPTY', () => {
    createComponent('/p/test-uuid');

    expect(router.navigate).toHaveBeenCalledWith(
      ['p-cd', 'test-uuid', 'EMPTY'],
      { replaceUrl: true }
    );
  });

  it('keeps the current QR tag for /q-cd/:uuid/:qrTag', () => {
    createComponent('/q-cd/test-uuid/test-tag');

    expect(router.navigate).toHaveBeenCalledWith(
      ['p-cd', 'test-uuid', 'test-tag'],
      { replaceUrl: true }
    );
  });

  it('logs the public QR visit', () => {
    createComponent('/q/test-uuid');

    expect(publicController.logPublicRequest).toHaveBeenCalled();
    expect(publicController.logPublicRequest.calls.mostRecent().args[0].logKey).toBe('test-uuid');
  });
});
