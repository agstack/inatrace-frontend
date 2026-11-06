import { of, throwError } from 'rxjs';

import { StockPaymentsTabComponent } from './stock-payments-tab.component';
import { ApiPayment } from '../../../../../api/model/apiPayment';

describe('StockPaymentsTabComponent (bulk confirmation)', () => {
  let api: jasmine.SpyObj<any>;
  let globalEventManager: any;
  let tab: StockPaymentsTabComponent;

  const UNCONFIRMED = ApiPayment.PaymentStatusEnum.UNCONFIRMED;
  const CONFIRMED = ApiPayment.PaymentStatusEnum.CONFIRMED;

  function payment(id: number): ApiPayment {
    return { id, amount: 10 * id, currency: 'EUR', paymentStatus: UNCONFIRMED } as ApiPayment;
  }

  beforeEach(() => {
    api = jasmine.createSpyObj('PaymentControllerService', ['createOrUpdatePayment']);
    api.createOrUpdatePayment.and.returnValue(of({ status: 'OK' } as any));
    globalEventManager = {
      openMessageModal: jasmine.createSpy('openMessageModal').and.returnValue(Promise.resolve('ok')),
      push: jasmine.createSpy('push'),
      showLoading: jasmine.createSpy('showLoading')
    };
    tab = new StockPaymentsTabComponent(
        null, null, globalEventManager, null, null, null, null, api, null, null, null);
  });

  function select(...payments: ApiPayment[]): void {
    tab.selectedPayments = payments;
  }

  it('does nothing without a selection', async () => {
    await tab.confirmPayments();
    expect(globalEventManager.openMessageModal).not.toHaveBeenCalled();
    expect(api.createOrUpdatePayment).not.toHaveBeenCalled();
  });

  it('keeps the selection when the confirmation is cancelled', async () => {
    select(payment(1));
    globalEventManager.openMessageModal.and.returnValue(Promise.resolve('cancel'));

    await tab.confirmPayments();

    expect(api.createOrUpdatePayment).not.toHaveBeenCalled();
    expect(tab.selectedPayments.length).toBe(1);
  });

  it('sends a CONFIRMED copy of each selected payment and reloads once', async () => {
    const first = payment(1);
    const second = payment(2);
    select(first, second);
    spyOn(tab, 'reloadPage');
    spyOn(tab, 'selectedIdsChanged');

    await tab.confirmPayments();

    expect(api.createOrUpdatePayment).toHaveBeenCalledTimes(2);
    const sent = api.createOrUpdatePayment.calls.allArgs().map(args => args[0]);
    expect(sent.map(row => row.id)).toEqual([1, 2]);
    sent.forEach(row => expect(row.paymentStatus).toBe(CONFIRMED));
    expect(first.paymentStatus).toBe(UNCONFIRMED);
    expect(second.paymentStatus).toBe(UNCONFIRMED);
    expect(tab.reloadPage).toHaveBeenCalledTimes(1);
    expect(tab.selectedPayments).toEqual([]);
    expect(tab.selectedIdsChanged).toHaveBeenCalledWith([]);
  });

  it('stops at the first refusal, shows what was confirmed and reports the failure', async () => {
    const first = payment(1);
    const second = payment(2);
    const third = payment(3);
    select(first, second, third);
    api.createOrUpdatePayment.and.returnValues(of({ status: 'OK' } as any), of({ status: 'ERROR' } as any));
    spyOn(tab, 'reloadPage');
    spyOn(tab, 'selectedIdsChanged');

    await tab.confirmPayments();

    expect(api.createOrUpdatePayment).toHaveBeenCalledTimes(2);
    expect(tab.reloadPage).toHaveBeenCalledTimes(1);
    expect(globalEventManager.push).toHaveBeenCalledWith(jasmine.objectContaining({ notificationType: 'error' }));
    expect(tab.selectedPayments).toEqual([]);
  });

  it('reports a failure on the first payment without reloading', async () => {
    select(payment(1));
    api.createOrUpdatePayment.and.returnValue(throwError(new Error('403')));
    spyOn(tab, 'reloadPage');

    await tab.confirmPayments();

    expect(tab.reloadPage).not.toHaveBeenCalled();
    expect(globalEventManager.push).toHaveBeenCalledWith(jasmine.objectContaining({ notificationType: 'error' }));
  });

  it('sends a double click once', async () => {
    select(payment(1));

    await Promise.all([tab.confirmPayments(), tab.confirmPayments()]);

    expect(api.createOrUpdatePayment).toHaveBeenCalledTimes(1);
  });
});
