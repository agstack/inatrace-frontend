import { of, throwError } from 'rxjs';
import { B2cPageComponent } from './b2c-page.component';

describe('B2cPageComponent', () => {

  const route = {
    snapshot: { params: { uuid: 'label-uuid', qrTag: 'qr-tag' }, firstChild: {} },
    url: of([])
  } as any;

  const scroll = { scrollToPosition: () => {} } as any;

  const createComponent = (labelResponse$, qrTagResponse$) => {
    const publicController = {
      getPublicProductLabelValues: () => labelResponse$,
      getQRTagPublicData: () => qrTagResponse$
    } as any;
    return new B2cPageComponent(route, publicController, scroll);
  };

  it('keeps safe defaults and flags the page as unavailable when the public data fails', () => {
    const component = createComponent(throwError(() => new Error('Internal server error')), of({ data: {} }));

    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(component.dataUnavailable).toBeTrue();
    expect(component.b2cSettings.quaternaryColor).toBe('#25265E');
    expect(component.b2cSettings.primaryColor).toBe('#25265E');
  });

  it('uses the label settings and clears the loading flag on success', () => {
    const settings = {
      primaryColor: '#111111',
      secondaryColor: '#222222',
      tertiaryColor: '#333333',
      quaternaryColor: '#444444'
    };
    const component = createComponent(
      of({ data: { businessToCustomerSettings: settings, fields: [] } }),
      of({ data: {} })
    );

    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(component.dataUnavailable).toBeFalse();
    expect(component.b2cSettings).toBe(settings);
  });
});
