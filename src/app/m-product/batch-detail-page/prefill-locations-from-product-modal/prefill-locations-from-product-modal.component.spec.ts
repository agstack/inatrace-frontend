import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrefillLocationsFromProductModalComponent } from './prefill-locations-from-product-modal.component';
import { TESTING_IMPORTS, TESTING_PROVIDERS } from '../../../../testing/shared-testing';

describe('PrefillLocationsFromProductModalComponent', () => {
  let component: PrefillLocationsFromProductModalComponent;
  let fixture: ComponentFixture<PrefillLocationsFromProductModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: TESTING_IMPORTS,
      providers: TESTING_PROVIDERS,
      declarations: [ PrefillLocationsFromProductModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrefillLocationsFromProductModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
