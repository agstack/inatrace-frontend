import { UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Location } from '@angular/common';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ApiCompanyGet } from '../../../../../api/model/apiCompanyGet';
import { ApiProcessingAction } from '../../../../../api/model/apiProcessingAction';
import { ApiProcessingEvidenceField } from '../../../../../api/model/apiProcessingEvidenceField';
import { ApiUserGet } from '../../../../../api/model/apiUserGet';
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
    component.procOrderGroup = new UntypedFormGroup({
      processingAction: new UntypedFormControl({
        type: ApiProcessingAction.TypeEnum.PROCESSING,
        repackedOutputFinalProducts: false,
        requiredEvidenceFields: []
      }),
      inputTransactions: new UntypedFormArray([new UntypedFormControl({ id: 100 })]),
      targetStockOrders: new UntypedFormArray([new UntypedFormGroup({
        id: new UntypedFormControl(200),
        requiredProcEvidenceFieldGroup: new UntypedFormControl({})
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

  it('offers the Products link when the user administers the affected company', async () => {
    component.currentUserProfile = { companyIdsAdmin: [3] } as ApiUserGet;
    component.companyProfile = { id: 3, name: 'Empty Test Co' } as ApiCompanyGet;
    processingOrderController.createOrUpdateProcessingOrder.and.returnValue(
      of(productAssociationResponse('3')) as any
    );

    await component.saveProcessingOrder();

    expect(component.productAssociationError).toEqual({
      companyId: 3,
      companyName: 'Empty Test Co',
      canManage: true
    });
    expect(component.productAssociationCompanyLabel).toBe('Empty Test Co (ID 3)');
    expect(globalEventsManager.push).not.toHaveBeenCalled();
    expect(location.back).not.toHaveBeenCalled();
    expect(component.procOrderGroup.getRawValue().inputTransactions).toEqual([{ id: 100 }]);
    expect(component.saveInProgress).toBe(false);
    expect(globalEventsManager.showLoading).toHaveBeenCalledWith(false);
    // HttpClient's body mode drops the error value returned by TokenInterceptor.
    expect(processingOrderController.createOrUpdateProcessingOrder.calls.mostRecent().args[2]).toBe('events');
  });

  it('resolves the affected company name from the input facility when it differs from the profile', async () => {
    component.currentUserProfile = { companyIdsAdmin: [3] } as ApiUserGet;
    component.companyProfile = { id: 9, name: 'Other Company' } as ApiCompanyGet;
    component.inputFacilityControl.setValue({ id: 7, company: { id: 3, name: 'Empty Test Co' } });
    processingOrderController.createOrUpdateProcessingOrder.and.returnValue(
      of(productAssociationResponse('3')) as any
    );

    await component.saveProcessingOrder();

    expect(component.productAssociationError.companyName).toBe('Empty Test Co');
    expect(component.productAssociationCompanyLabel).toBe('Empty Test Co (ID 3)');
  });

  it('does not offer the Products link when the user cannot administer the affected company', async () => {
    component.currentUserProfile = { companyIdsAdmin: [4] } as ApiUserGet;
    processingOrderController.createOrUpdateProcessingOrder.and.returnValue(
      of(productAssociationResponse('3')) as any
    );

    await component.saveProcessingOrder();

    expect(component.productAssociationError).toEqual({
      companyId: 3,
      companyName: null,
      canManage: false
    });
    expect(component.productAssociationCompanyLabel).toBe('ID 3');
    expect(globalEventsManager.push).not.toHaveBeenCalled();
    expect(location.back).not.toHaveBeenCalled();
  });

  it('offers the Products link to a system administrator', async () => {
    component.currentUserProfile = { role: ApiUserGet.RoleEnum.SYSTEMADMIN } as ApiUserGet;
    processingOrderController.createOrUpdateProcessingOrder.and.returnValue(
      of(productAssociationResponse('3')) as any
    );

    await component.saveProcessingOrder();

    expect(component.productAssociationError).toEqual({
      companyId: 3,
      companyName: null,
      canManage: true
    });
  });

  it('shows the product-association message without a link when the company ID is missing', async () => {
    component.currentUserProfile = { companyIdsAdmin: [3] } as ApiUserGet;
    processingOrderController.createOrUpdateProcessingOrder.and.returnValue(
      of(productAssociationResponse(null)) as any
    );

    await component.saveProcessingOrder();

    expect(component.productAssociationError).toEqual({
      companyId: null,
      companyName: null,
      canManage: false
    });
    expect(component.productAssociationCompanyLabel).toBeNull();
    expect(globalEventsManager.push).not.toHaveBeenCalled();
    expect(location.back).not.toHaveBeenCalled();
  });

  it('handles a thrown product-association response without the generic failure', async () => {
    component.currentUserProfile = { companyIdsAdmin: [3] } as ApiUserGet;
    processingOrderController.createOrUpdateProcessingOrder.and.returnValue(
      throwError(productAssociationResponse('3')) as any
    );

    await component.saveProcessingOrder();

    expect(component.productAssociationError).toEqual({
      companyId: 3,
      companyName: null,
      canManage: true
    });
    expect(globalEventsManager.push).not.toHaveBeenCalled();
    expect(location.back).not.toHaveBeenCalled();
  });

  function productAssociationResponse(errorDetails: string | null): HttpErrorResponse {
    return new HttpErrorResponse({
      status: 400,
      url: '/api/chain/processing-order',
      error: {
        status: 'PRODUCT_ASSOCIATION_REQUIRED',
        errorMessage: 'The company has no product association. Add a product association before processing.',
        errorDetails
      }
    });
  }

  it('sends one unchanged payload after a failed save is retried', async () => {
    processingOrderController.createOrUpdateProcessingOrder.and.returnValues(
      of(new HttpErrorResponse({ status: 500, url: '/api/chain/processing-order' })) as any,
      of(new HttpResponse({ status: 200, body: { status: 'OK' } })) as any
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
