import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { ApiProcessingAction } from '../../../../../../api/model/apiProcessingAction';
import { StockOrderControllerService } from '../../../../../../api/api/stockOrderController.service';
import { NgbModalImproved } from '../../../../../core/ngb-modal-improved/ngb-modal-improved.service';
import { ProcessingOrderInputComponent } from './processing-order-input.component';

describe('ProcessingOrderInputComponent available stock requests', () => {
  let component: ProcessingOrderInputComponent;
  let stockOrderController: jasmine.SpyObj<StockOrderControllerService>;

  beforeEach(() => {
    stockOrderController = jasmine.createSpyObj('StockOrderControllerService', [
      'getAvailableStockForStockUnitInFacilityByMap'
    ]);
    component = new ProcessingOrderInputComponent(stockOrderController, null);
    component.selectedProcAction = { type: ApiProcessingAction.TypeEnum.PROCESSING } as ApiProcessingAction;
    component.targetStockOrdersArray = new FormArray([]);
  });

  it('keeps an HTTP failure distinct from a successful empty response', async () => {
    stockOrderController.getAvailableStockForStockUnitInFacilityByMap.and.returnValue(
      of(new HttpErrorResponse({ status: 403 })) as any
    );

    const result = await (component as any).fetchAvailableStockOrders({ facilityId: 1 });

    expect(result).toEqual({ stockOrders: [], failed: true });
    expect(component.availableStockOrdersError).toBe(true);
    expect(component.availableStockOrdersLoading).toBe(false);
  });

  it('treats an intercepted HTTP 500 as a failed request', async () => {
    stockOrderController.getAvailableStockForStockUnitInFacilityByMap.and.returnValue(
      of(new HttpErrorResponse({ status: 500 })) as any
    );

    const result = await (component as any).fetchAvailableStockOrders({ facilityId: 1 });

    expect(result).toEqual({ stockOrders: [], failed: true });
    expect(component.availableStockOrdersError).toBe(true);
  });

  it('marks a transport failure without exposing it as empty stock', async () => {
    stockOrderController.getAvailableStockForStockUnitInFacilityByMap.and.returnValue(
      throwError(new Error('network failure')) as any
    );

    const result = await (component as any).fetchAvailableStockOrders({ facilityId: 1 });

    expect(result).toEqual({ stockOrders: [], failed: true });
    expect(component.availableStockOrdersError).toBe(true);
  });

  it('retains the empty-result state for a successful query', async () => {
    stockOrderController.getAvailableStockForStockUnitInFacilityByMap.and.returnValue(
      of({ status: 'OK', data: { items: [] } }) as any
    );

    const result = await (component as any).fetchAvailableStockOrders({ facilityId: 1 });

    expect(result).toEqual({ stockOrders: [], failed: false });
    expect(component.availableStockOrdersError).toBe(false);
  });

  it('rejects malformed successful responses instead of displaying them as empty stock', async () => {
    stockOrderController.getAvailableStockForStockUnitInFacilityByMap.and.returnValue(
      of({ status: 'OK', data: null }) as any
    );

    const missingData = await (component as any).fetchAvailableStockOrders({ facilityId: 1 });

    expect(missingData).toEqual({ stockOrders: [], failed: true });

    stockOrderController.getAvailableStockForStockUnitInFacilityByMap.and.returnValue(
      of({ status: 'OK', data: {} }) as any
    );

    const missingItems = await (component as any).fetchAvailableStockOrders({ facilityId: 1 });

    expect(missingItems).toEqual({ stockOrders: [], failed: true });
  });

  it('keeps stock returned by a successful request available for selection', async () => {
    const stockOrder = { id: 17, availableQuantity: 40 } as any;
    stockOrderController.getAvailableStockForStockUnitInFacilityByMap.and.returnValue(
      of({ status: 'OK', data: { items: [stockOrder] } }) as any
    );

    const result = await (component as any).fetchAvailableStockOrders({ facilityId: 1 });

    expect(result).toEqual({ stockOrders: [stockOrder], failed: false });
    expect(component.availableStockOrdersError).toBe(false);
  });

  it('ignores a stale facility request when a newer request completes first', async () => {
    const firstRequest = new Subject<any>();
    const secondRequest = new Subject<any>();
    stockOrderController.getAvailableStockForStockUnitInFacilityByMap.and.returnValues(
      firstRequest as any,
      secondRequest as any
    );

    const firstResult = (component as any).fetchAvailableStockOrders({ facilityId: 1 });
    const secondResult = (component as any).fetchAvailableStockOrders({ facilityId: 2 });

    secondRequest.next({ status: 'OK', data: { items: [{ id: 2 }] } });
    secondRequest.complete();
    firstRequest.next({ status: 'OK', data: { items: [{ id: 1 }] } });
    firstRequest.complete();

    expect(await firstResult).toBeNull();
    expect(await secondResult).toEqual({ stockOrders: [{ id: 2 }], failed: false });
    expect(component.availableStockOrdersLoading).toBe(false);
  });
});

describe('ProcessingOrderInputComponent available stock feedback', () => {
  let component: ProcessingOrderInputComponent;
  let fixture: ComponentFixture<ProcessingOrderInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProcessingOrderInputComponent],
      imports: [ReactiveFormsModule],
      providers: [
        {
          provide: StockOrderControllerService,
          useValue: jasmine.createSpyObj('StockOrderControllerService', ['getAvailableStockForStockUnitInFacilityByMap'])
        },
        { provide: NgbModalImproved, useValue: null }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ProcessingOrderInputComponent);
    component = fixture.componentInstance;
    component.companyId = 1;
    component.selectedProcAction = { type: ApiProcessingAction.TypeEnum.PROCESSING } as ApiProcessingAction;
    component.inputFacilityControl = new FormControl({ id: 1, company: { id: 1 } });
    component.totalInputQuantityControl = new FormControl(null);
    component.remainingQuantityControl = new FormControl(null);
    component.targetStockOrdersArray = new FormArray([]);
    component.inputTransactionsArray = new FormArray([]);
    component.inputTransactions = [];
  });

  it('replaces the empty-stock message with request feedback after a failed query', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No relevant stock to add transactions in facility');

    component.availableStockOrdersError = true;
    fixture.detectChanges();

    spyOn(component, 'dateSearch');
    const retryButton = fixture.nativeElement.querySelector('button.btn-link');
    retryButton.click();

    expect(fixture.nativeElement.textContent).toContain('Available stock could not be loaded. Please try again.');
    expect(fixture.nativeElement.textContent).not.toContain('No relevant stock to add transactions in facility');
    expect(component.dateSearch).toHaveBeenCalled();
  });
});
