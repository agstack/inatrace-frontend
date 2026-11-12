import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FacilityCardComponent } from './facility-card.component';

describe('FacilityCardComponent', () => {

  let router: any;

  beforeEach(() => {
    router = { navigate: jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true)) };
  });

  function facility(): any {
    return {
      id: 10,
      facilityType: { code: 'STORAGE' },
      facilitySemiProductList: [{ id: 1 }],
      facilityFinalProducts: [{ id: 2 }]
    };
  }

  function component(actions: any[]): FacilityCardComponent {
    const result = new FacilityCardComponent(router);
    result.facility = facility();
    result.actions = actions;
    result.ngOnInit();
    return result;
  }

  it('offers processing actions for matching semi-products', () => {
    const result = component([
      { id: 100, name: 'Dry', type: 'PROCESSING', inputSemiProduct: { id: 1 } }
    ]);

    expect(result.menuOptions).toEqual([{ id: 100, name: 'Dry' }]);
  });

  it('offers processing actions for matching final products', () => {
    const result = component([
      { id: 101, name: 'Pack', type: 'PROCESSING', inputFinalProduct: { id: 2 } }
    ]);

    expect(result.menuOptions).toEqual([{ id: 101, name: 'Pack' }]);
  });

  it('filters shipment actions and unsupported facilities', () => {
    const result = component([
      { id: 102, name: 'Ship', type: 'SHIPMENT', inputSemiProduct: { id: 1 } },
      { id: 103, name: 'Other facility', type: 'PROCESSING', inputSemiProduct: { id: 1 },
        supportedFacilities: [{ id: 99 }] },
      { id: 104, name: 'Wrong product', type: 'PROCESSING', inputSemiProduct: { id: 99 } }
    ]);

    expect(result.menuOptions).toEqual([]);
  });

  it('navigates to the processing order for the selected action', () => {
    const result = component([]);

    result.goTo(100);

    expect(router.navigate).toHaveBeenCalledWith(
      ['my-stock', 'processing', 100, 'facility', 10, 'new']
    );
  });
});

describe('FacilityCardComponent template', () => {

  let fixture: ComponentFixture<FacilityCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule, NgbDropdownModule],
      declarations: [FacilityCardComponent],
      providers: [{ provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FacilityCardComponent);
  });

  function render(actions: any[]): void {
    fixture.componentInstance.facility = {
      id: 10,
      facilityType: { code: 'STORAGE', label: 'Storage' },
      facilitySemiProductList: [{ id: 1 }],
      facilityFinalProducts: []
    };
    fixture.componentInstance.actions = actions;
    fixture.detectChanges();
  }

  it('renders a visible actions toggle when the facility has actions', () => {
    render([{ id: 100, name: 'Dry', type: 'PROCESSING', inputSemiProduct: { id: 1 } }]);

    expect(fixture.nativeElement.querySelector('button.af-card-actions-toggle')).not.toBeNull();
  });

  it('does not render the actions toggle without actions', () => {
    render([]);

    expect(fixture.nativeElement.querySelector('button.af-card-actions-toggle')).toBeNull();
  });
});
