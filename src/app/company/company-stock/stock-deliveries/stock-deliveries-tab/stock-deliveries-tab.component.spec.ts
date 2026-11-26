import { of, throwError } from 'rxjs';
import { StockDeliveriesTabComponent } from './stock-deliveries-tab.component';
import { ApiFacility } from '../../../../../api/model/apiFacility';

describe('StockDeliveriesTabComponent facility selection', () => {
  let component: StockDeliveriesTabComponent;
  let router: jasmine.SpyObj<any>;
  let route: any;
  let facilityController: jasmine.SpyObj<any>;
  let facilities: ApiFacility[];

  function facility(id: number, name: string): ApiFacility {
    return { id, name } as ApiFacility;
  }

  function createComponent(): StockDeliveriesTabComponent {
    return new StockDeliveriesTabComponent(
      router,
      route,
      { openMessageModal: jasmine.createSpy('openMessageModal').and.returnValue(Promise.resolve('ok')) } as any,
      facilityController,
      { userProfile$: of({ id: 1 }) } as any,
      { getCompanyUsers: () => of({ status: 'OK', data: [] }) } as any,
      null,
      null,
      null,
      { selectedCompanyProfile$: of({ id: 1 }) } as any,
      null
    );
  }

  beforeEach(() => {
    facilities = [facility(1, 'Coffee Collection Point')];
    router = jasmine.createSpyObj('Router', ['navigate']);
    router.navigate.and.returnValue(Promise.resolve(true));
    route = { snapshot: { data: {}, queryParams: {} } };
    facilityController = jasmine.createSpyObj('FacilityControllerService', [
      'listCollectingFacilitiesByCompanyByMap',
      'getFacility'
    ]);
    facilityController.listCollectingFacilitiesByCompanyByMap.and.callFake(() =>
      of({ data: { items: facilities, count: facilities.length } })
    );
    facilityController.getFacility.and.returnValue(of({ data: { facilitySemiProductList: [] } }));

    component = createComponent();
    spyOn(component as any, 'isAuthorisedCompanyRole').and.returnValue(Promise.resolve());
  });

  afterEach(() => component.ngOnDestroy());

  it('restores the facility written to the query string', async () => {
    route.snapshot.queryParams = { facilityId: '1' };

    await component.ngOnInit();

    expect(component.selectedFacilityId).toBe(1);
    expect(component.facilityForStockOrderForm.value).toEqual(facilities[0]);
    expect(router.navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({ queryParams: { facilityId: '1' } })
    );
  });

  it('preselects the only collecting facility when there is no query id', async () => {
    await component.ngOnInit();

    expect(component.selectedFacilityId).toBe(1);
    expect(component.facilityForStockOrderForm.value).toEqual(facilities[0]);
    expect(router.navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({ queryParams: { facilityId: '1' } })
    );
  });

  it('keeps the selection empty when there are several facilities and no query id', async () => {
    facilities = [facility(1, 'North'), facility(2, 'South')];
    facilityController.listCollectingFacilitiesByCompanyByMap.and.callFake(() =>
      of({ data: { items: facilities, count: facilities.length } })
    );

    await component.ngOnInit();

    expect(component.selectedFacilityId).toBeUndefined();
    expect(component.facilityForStockOrderForm.value).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('restores the matching facility when several are available', async () => {
    facilities = [facility(1, 'North'), facility(2, 'South')];
    facilityController.listCollectingFacilitiesByCompanyByMap.and.callFake(() =>
      of({ data: { items: facilities, count: facilities.length } })
    );
    route.snapshot.queryParams = { facilityId: '2' };

    await component.ngOnInit();

    expect(component.selectedFacilityId).toBe(2);
    expect(component.facilityForStockOrderForm.value).toEqual(facilities[1]);
  });

  it('drops a stale query id instead of selecting an unavailable facility', async () => {
    route.snapshot.queryParams = { facilityId: '99' };

    await component.ngOnInit();

    expect(component.selectedFacilityId).toBeUndefined();
    expect(component.facilityForStockOrderForm.value).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({ queryParams: {} })
    );
  });

  it('stays usable when the facility list cannot be loaded', async () => {
    const log = spyOn(console, 'error').and.stub();
    facilityController.listCollectingFacilitiesByCompanyByMap.and.returnValue(throwError(new Error('offline')));
    route.snapshot.queryParams = { facilityId: '1' };

    await component.ngOnInit();

    expect(component.selectedFacilityId).toBeUndefined();
    expect(component.facilityForStockOrderForm.value).toBeNull();
    expect(log).toHaveBeenCalled();
  });
});
