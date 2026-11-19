import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PrefillLocationsFromProductModalComponent } from './prefill-locations-from-product-modal.component';
import { TESTING_IMPORTS, TESTING_PROVIDERS } from '../../../../testing/shared-testing';

describe('PrefillLocationsFromProductModalComponent', () => {
  let component: PrefillLocationsFromProductModalComponent;
  let fixture: ComponentFixture<PrefillLocationsFromProductModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
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
