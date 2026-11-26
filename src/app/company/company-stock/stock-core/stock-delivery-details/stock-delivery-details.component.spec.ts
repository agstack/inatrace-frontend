import { CommonModule, Location } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { of } from 'rxjs';
import { FacilityControllerService } from '../../../../../api/api/facilityController.service';
import { CompanyControllerService } from '../../../../../api/api/companyController.service';
import { SemiProductControllerService } from '../../../../../api/api/semiProductController.service';
import { StockOrderControllerService } from '../../../../../api/api/stockOrderController.service';
import { ApiStockOrder } from '../../../../../api/model/apiStockOrder';
import { AuthService } from '../../../../core/auth.service';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { SelectedUserCompanyService } from '../../../../core/selected-user-company.service';
import { CodebookTranslations } from '../../../../shared-services/codebook-translations';
import { generateFormFromMetadata } from '../../../../../shared/utils';
import { StockDeliveryDetailsComponent } from './stock-delivery-details.component';
import { ApiStockOrderValidationScheme } from './validation';

describe('StockDeliveryDetailsComponent open balance', () => {
  let fixture: ComponentFixture<StockDeliveryDetailsComponent>;
  let component: StockDeliveryDetailsComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [StockDeliveryDetailsComponent],
      imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: {}, data: { action: 'update', mode: 'PURCHASE_ORDER' } } }
        },
        { provide: Location, useValue: {} },
        { provide: GlobalEventManagerService, useValue: {} },
        { provide: FacilityControllerService, useValue: {} },
        { provide: CompanyControllerService, useValue: {} },
        { provide: StockOrderControllerService, useValue: {} },
        { provide: SemiProductControllerService, useValue: {} },
        { provide: CodebookTranslations, useValue: {} },
        { provide: AuthService, useValue: { userProfile$: of(null) } },
        { provide: SelectedUserCompanyService, useValue: { selectedCompanyProfile$: of(null) } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StockDeliveryDetailsComponent);
    component = fixture.componentInstance;
  });

  function createForm(values: any): UntypedFormGroup {
    return generateFormFromMetadata(
      ApiStockOrder.formMetadata(),
      {
        orderType: 'PURCHASE_ORDER',
        identifier: 'PT-OPEN-BALANCE',
        productionDate: '2026-11-20',
        totalGrossQuantity: 1000,
        pricePerUnit: 750,
        cost: 750000,
        paid: 750000,
        balance: 0,
        currency: 'NGN',
        preferredWayOfPayment: 'CASH',
        organic: false,
        womenShare: false,
        ...values
      },
      ApiStockOrderValidationScheme('PURCHASE_ORDER')
    );
  }

  function renderDelivery(values: any, update: boolean): void {
    component.update = update;
    component.stockOrderForm = createForm(values);
    component.companyProfile = { currency: { code: 'NGN' }, users: [] } as any;
    component.selectedCurrency = 'NGN';
    (component as any).facility = {
      displayMayInvolveCollectors: false,
      displayOrganic: false,
      displayPriceDeductionDamage: false,
      displayWeightDeductionDamage: false
    };
    fixture.detectChanges();
  }

  it('keeps the persisted balance of a fully paid existing delivery', () => {
    renderDelivery({}, true);

    expect(fixture.nativeElement.querySelector('[placeholder="Open balance"]')).not.toBeNull();
    expect(component.stockOrderForm.get('balance').value).toBe(0);
  });

  it('keeps the persisted balance of a partially paid existing delivery', () => {
    renderDelivery({ paid: 300000, balance: 450000 }, true);

    expect(component.stockOrderForm.get('balance').value).toBe(450000);
  });

  it('shows the base payment as the initial balance of a new delivery', () => {
    renderDelivery({ paid: null, balance: null }, false);

    expect(component.stockOrderForm.get('cost').value).toBe('750000.00');
    expect(component.stockOrderForm.get('balance').value).toBe('750000.00');
  });

  it('clears the balance when the price is not determined', () => {
    renderDelivery({ pricePerUnit: null, cost: null, paid: null, balance: null }, false);

    expect(component.stockOrderForm.get('cost').value).toBeNull();
    expect(component.stockOrderForm.get('balance').value).toBeNull();
  });

  function renderForSubmit(values: any = {}): void {
    component.update = true;
    component.stockOrderForm = createForm(values);
    component.companyProfile = { currency: { code: 'NGN' }, users: [] } as any;
    component.selectedCurrency = values.currency === null ? '-' : 'NGN';
    (component as any).facility = {
      displayMayInvolveCollectors: false,
      displayOrganic: false,
      displayTare: false,
      displayPriceDeductionDamage: false,
      displayWeightDeductionDamage: false,
      displayWomenOnly: false
    };
    component.searchFarmers.setValue({ id: 1 });
    component.employeeForm.setValue('1');
    component.searchWomenCoffeeForm.setValue('NO');
    component.modelChoice = 3;
    component.stockOrderForm.get('semiProduct').setValue({ id: 3 });
    component.stockOrderForm.get('producerUserCustomer').setValue({ id: 1 });
    component.stockOrderForm.get('preferredWayOfPayment').setValue('CASH');
    component.stockOrderForm.get('productionDate').setValue('2026-11-23');
    component.stockOrderForm.get('totalGrossQuantity').setValue(100);
    component.stockOrderForm.get('pricePerUnit').setValue(10);
    component.stockOrderForm.get('currency').setValue(values.currency === null ? null : 'NGN');
  }

  it('shows the blocking fields instead of silently ignoring an invalid save', async () => {
    renderForSubmit({ currency: null });
    const events = jasmine.createSpyObj('GlobalEventManagerService', ['push', 'showLoading']);
    const stockApi = jasmine.createSpyObj('StockOrderControllerService', ['createOrUpdateStockOrder']);
    (component as any).globalEventsManager = events;
    (component as any).stockOrderControllerService = stockApi;

    await component.createOrUpdatePurchaseOrder(false);

    expect(stockApi.createOrUpdateStockOrder).not.toHaveBeenCalled();
    expect(events.push).toHaveBeenCalledWith(jasmine.objectContaining({ notificationType: 'error' }));
    expect(events.push.calls.mostRecent().args[0].message).toContain('Company currency');
    expect(component.validationErrors).toContain('Company currency');
    expect(component.updatePOInProgress).toBeFalse();
  });

  it('does not require women’s only when the facility does not display it', () => {
    renderForSubmit();
    component.searchWomenCoffeeForm.setValue(null);

    component.updateValidators();

    expect(component.searchWomenCoffeeForm.errors).toBeNull();
    expect(component.stockOrderForm.get('womenShare').errors).toBeNull();
  });

  it('requires women’s only when the facility displays it', () => {
    renderForSubmit();
    (component as any).facility.displayWomenOnly = true;
    component.searchWomenCoffeeForm.setValue(null);

    component.updateValidators();

    expect(component.searchWomenCoffeeForm.errors).toEqual(jasmine.objectContaining({ required: true }));
  });

  it('saves a valid delivery and clears the validation summary', async () => {
    renderForSubmit();
    const events = jasmine.createSpyObj('GlobalEventManagerService', ['push', 'showLoading']);
    const stockApi = jasmine.createSpyObj('StockOrderControllerService', ['createOrUpdateStockOrder']);
    stockApi.createOrUpdateStockOrder.and.returnValue(of({ status: 'OK' } as any));
    (component as any).globalEventsManager = events;
    (component as any).stockOrderControllerService = stockApi;
    spyOn(component as any, 'reloadOrder').and.stub();

    await component.createOrUpdatePurchaseOrder(false);

    expect(stockApi.createOrUpdateStockOrder).toHaveBeenCalledTimes(1);
    expect(events.push).not.toHaveBeenCalled();
    expect(component.validationErrors).toEqual([]);
    expect(component.updatePOInProgress).toBeFalse();
  });

  it('shows a visible warning when the company has no base currency', () => {
    renderForSubmit({ currency: null });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('company has no base currency');
  });
});
