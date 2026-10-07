import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ApiProcessingAction } from '../../../../../api/model/apiProcessingAction';
import { ApiProcessingEvidenceField } from '../../../../../api/model/apiProcessingEvidenceField';
import { ProcessingOrderControllerService } from '../../../../../api/api/processingOrderController.service';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { StockProcessingOrderDetailsComponent } from './stock-processing-order-details.component';

describe('StockProcessingOrderDetailsComponent save failures', () => {
  let component: StockProcessingOrderDetailsComponent;
  let globalEventsManager: jasmine.SpyObj<GlobalEventManagerService>;
  let processingOrderController: jasmine.SpyObj<ProcessingOrderControllerService>;
  let location: jasmine.SpyObj<Location>;

  beforeEach(() => {
    location = jasmine.createSpyObj('Location', ['back']);
    globalEventsManager = jasmine.createSpyObj('GlobalEventManagerService', ['push', 'showLoading']);
    processingOrderController = jasmine.createSpyObj('ProcessingOrderControllerService', [
      'createOrUpdateProcessingOrder'
    ]);

    component = new StockProcessingOrderDetailsComponent(
      location,
      null,
      globalEventsManager,
      null,
      processingOrderController,
      null,
      null,
      null,
      null,
      null
    );
    component.procOrderGroup = new FormGroup({
      processingAction: new FormControl({
        type: ApiProcessingAction.TypeEnum.PROCESSING,
        repackedOutputFinalProducts: false,
        requiredEvidenceFields: []
      }),
      inputTransactions: new FormArray([new FormControl({ id: 100 })]),
      targetStockOrders: new FormArray([new FormGroup({
        id: new FormControl(200),
        requiredProcEvidenceFieldGroup: new FormControl({})
      })])
    });
    (component as any).input = {
      oneInputStockOrderRequired: false,
      prepInputTransactionsFromStockOrders: () => [{ id: 101 }]
    };
    (component as any).output = {
      notAllOutputQuantityIsUsed: () => false
    };
  });

  it('keeps the form open and reports an unexpected save failure', async () => {
    processingOrderController.createOrUpdateProcessingOrder.and.returnValue(
      throwError(new Error('server failure')) as any
    );

    await component.saveProcessingOrder();

    expect(location.back).not.toHaveBeenCalled();
    expect(globalEventsManager.push).toHaveBeenCalledWith(jasmine.objectContaining({
      notificationType: 'error'
    }));
    expect(component.saveInProgress).toBe(false);
    expect(globalEventsManager.showLoading).toHaveBeenCalledWith(false);
  });

  [400, 403, 500].forEach(status => {
    it(`keeps the form open when TokenInterceptor emits an HTTP ${status} error`, async () => {
      processingOrderController.createOrUpdateProcessingOrder.and.returnValue(
        of(new HttpErrorResponse({ status, url: '/api/chain/processing-order' })) as any
      );

      await component.saveProcessingOrder();

      expect(location.back).not.toHaveBeenCalled();
      expect(globalEventsManager.push).not.toHaveBeenCalled();
      expect(component.saveInProgress).toBe(false);
      expect(globalEventsManager.showLoading).toHaveBeenCalledWith(false);
    });
  });

  it('sends one unchanged payload after a failed save is retried', async () => {
    processingOrderController.createOrUpdateProcessingOrder.and.returnValues(
      of(new HttpErrorResponse({ status: 500, url: '/api/chain/processing-order' })) as any,
      of({ status: 'OK' }) as any
    );

    await component.saveProcessingOrder();
    await component.saveProcessingOrder();

    const payloads = processingOrderController.createOrUpdateProcessingOrder.calls.allArgs()
      .map(args => args[0]);
    expect(payloads.length).toBe(2);
    expect(payloads[0].inputTransactions).toEqual([{ id: 100 }, { id: 101 }]);
    expect(payloads[1].inputTransactions).toEqual(payloads[0].inputTransactions);
    expect(payloads[1].targetStockOrders).toEqual(payloads[0].targetStockOrders);
    expect(component.inputTransactionsArray.value).toEqual([{ id: 100 }]);
    expect(location.back).toHaveBeenCalledTimes(1);
  });
});

describe('StockProcessingOrderDetailsComponent', () => {
  it('loads the complete action definition, including evidence fields, before rebuilding an order', async () => {
    const completeAction = {
      id: 17,
      name: 'Mock drying',
      requiredEvidenceFields: [{
        id: 5,
        fieldName: 'MOCK_MOISTURE_CONTENT',
        type: ApiProcessingEvidenceField.TypeEnum.NUMBER
      }]
    } as ApiProcessingAction;
    const processingActionController = {
      getProcessingActionDetail: jasmine.createSpy('getProcessingActionDetail').and.returnValue(of({status: 'OK', data: completeAction}))
    };
    const changeDetectorRef = {
      detectChanges: jasmine.createSpy('detectChanges')
    };
    const component = new StockProcessingOrderDetailsComponent(
      null, null, null, null, null, processingActionController as any, null, null, null, changeDetectorRef as any
    );

    const action = await (component as any).loadCompleteProcessingAction(17);

    expect(processingActionController.getProcessingActionDetail).toHaveBeenCalledWith(17);
    expect(action.requiredEvidenceFields).toEqual(completeAction.requiredEvidenceFields);
  });
});
