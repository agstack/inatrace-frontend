import { getBeycoOfferErrorMessage } from './beyco-offer-error';

describe('getBeycoOfferErrorMessage', () => {
  it('reads the backend error envelope', () => {
    expect(getBeycoOfferErrorMessage({status: 'UPSTREAM_HTTP_ERROR', errorMessage: 'Beyco service request failed'}))
        .toBe('Beyco service request failed');
  });

  it('preserves an existing plain text error', () => {
    expect(getBeycoOfferErrorMessage('Provider unavailable')).toBe('Provider unavailable');
  });

  it('uses a fallback for missing or non-text errors', () => {
    expect(getBeycoOfferErrorMessage(null)).toContain('There was an error');
    expect(getBeycoOfferErrorMessage({errorMessage: {}})).toContain('There was an error');
  });
});
