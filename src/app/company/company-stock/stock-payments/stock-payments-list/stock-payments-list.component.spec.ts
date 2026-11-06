import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';

import { StockPaymentsListComponent } from './stock-payments-list.component';
import { FormatWayOfPaymentPipe } from '../../../../components/pipes/format-way-of-payment.pipe';
import { ActivatedRoute, Router } from '@angular/router';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { AuthService } from 'src/app/core/auth.service';
import { PaymentControllerService } from '../../../../../api/api/paymentController.service';
import { ApiPayment } from '../../../../../api/model/apiPayment';
import { ApiPaginatedResponseApiPayment } from '../../../../../api/model/apiPaginatedResponseApiPayment';

describe('StockPaymentsListComponent', () => {
  let fixture: ComponentFixture<StockPaymentsListComponent>;
  let component: StockPaymentsListComponent;
  let api: jasmine.SpyObj<PaymentControllerService>;
  let globalEventManager: any;

  const UNCONFIRMED = ApiPayment.PaymentStatusEnum.UNCONFIRMED;
  const CONFIRMED = ApiPayment.PaymentStatusEnum.CONFIRMED;

  function payment(overrides: Partial<ApiPayment> = {}): ApiPayment {
    return { id: 7, amount: 10, currency: 'EUR', paymentStatus: UNCONFIRMED, ...overrides } as ApiPayment;
  }

  function response(payments: ApiPayment[]): ApiPaginatedResponseApiPayment {
    return { status: 'OK' as any, data: { items: payments, count: payments.length } };
  }

  beforeEach(async(() => {
    api = jasmine.createSpyObj<PaymentControllerService>('PaymentControllerService',
        ['listPaymentsByCompanyByMap', 'createOrUpdatePayment']);
    api.createOrUpdatePayment.and.returnValue(of({ status: 'OK' } as any));
    globalEventManager = {
      openMessageModal: jasmine.createSpy('openMessageModal').and.returnValue(Promise.resolve('ok')),
      push: jasmine.createSpy('push'),
      showLoading: jasmine.createSpy('showLoading')
    };

    TestBed.configureTestingModule({
      declarations: [StockPaymentsListComponent, FormatWayOfPaymentPipe],
      imports: [CommonModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: GlobalEventManagerService, useValue: globalEventManager },
        { provide: AuthService, useValue: {} },
        { provide: PaymentControllerService, useValue: api }
      ]
    }).compileComponents();
  }));

  function create(options: { readOnly?: boolean, paymentStatus?: ApiPayment.PaymentStatusEnum } = {}): ApiPayment {
    const row = payment({ paymentStatus: options.paymentStatus || UNCONFIRMED });
    api.listPaymentsByCompanyByMap.and.returnValue(of(response([row])) as any);
    fixture = TestBed.createComponent(StockPaymentsListComponent);
    component = fixture.componentInstance;
    component.readOnly = options.readOnly === true;
    fixture.detectChanges();
    return row;
  }

  function confirmLinks(): HTMLAnchorElement[] {
    const links = Array.from(fixture.nativeElement.querySelectorAll('a.company-action')) as HTMLAnchorElement[];
    return links.filter(link => link.textContent.trim() === 'Confirm');
  }

  it('offers Confirm for an unconfirmed payment on an editable list', () => {
    create();
    expect(confirmLinks().length).toBe(1);
  });

  it('does not offer Confirm on a read-only list', () => {
    create({ readOnly: true });
    expect(confirmLinks().length).toBe(0);
  });

  it('does not offer Confirm for a payment that is already confirmed', () => {
    create({ paymentStatus: CONFIRMED });
    expect(confirmLinks().length).toBe(0);
  });

  it('wires the row action to confirmPayment', () => {
    create();
    const confirm = spyOn(component, 'confirmPayment');
    confirmLinks()[0].click();
    expect(confirm).toHaveBeenCalledWith(jasmine.objectContaining({ id: 7 }));
  });

  it('does nothing when the confirmation is cancelled', async () => {
    create();
    globalEventManager.openMessageModal.and.returnValue(Promise.resolve('cancel'));

    await component.confirmPayment(component.currentData[0]);

    expect(api.createOrUpdatePayment).not.toHaveBeenCalled();
  });

  it('sends a copy with CONFIRMED and leaves the row untouched', async () => {
    const row = create();
    spyOn(component, 'reloadPage');

    await component.confirmPayment(row);

    expect(api.createOrUpdatePayment).toHaveBeenCalledTimes(1);
    const sent = api.createOrUpdatePayment.calls.mostRecent().args[0];
    expect(sent).not.toBe(row);
    expect(sent.paymentStatus).toBe(CONFIRMED);
    expect(row.paymentStatus).toBe(UNCONFIRMED);
    expect(component.reloadPage).toHaveBeenCalledTimes(1);
  });

  it('keeps the payment unconfirmed and reports when the backend refuses', async () => {
    const row = create();
    api.createOrUpdatePayment.and.returnValue(of({ status: 'ERROR' } as any));
    spyOn(component, 'reloadPage');

    await component.confirmPayment(row);

    expect(row.paymentStatus).toBe(UNCONFIRMED);
    expect(component.reloadPage).not.toHaveBeenCalled();
    expect(globalEventManager.push).toHaveBeenCalledWith(jasmine.objectContaining({ notificationType: 'error' }));
  });

  it('keeps the payment unconfirmed and reports when the request fails', async () => {
    const row = create();
    api.createOrUpdatePayment.and.returnValue(throwError(new Error('403')));
    spyOn(component, 'reloadPage');

    await component.confirmPayment(row);

    expect(row.paymentStatus).toBe(UNCONFIRMED);
    expect(component.reloadPage).not.toHaveBeenCalled();
    expect(globalEventManager.push).toHaveBeenCalledWith(jasmine.objectContaining({ notificationType: 'error' }));
  });

  it('sends a double click once', async () => {
    const row = create();

    await Promise.all([component.confirmPayment(row), component.confirmPayment(row)]);

    expect(api.createOrUpdatePayment).toHaveBeenCalledTimes(1);
  });
});
