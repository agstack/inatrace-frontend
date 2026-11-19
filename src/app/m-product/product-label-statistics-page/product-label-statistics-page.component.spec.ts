import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ProductLabelStatisticsPageComponent } from './product-label-statistics-page.component';
import { TESTING_IMPORTS, TESTING_PROVIDERS } from '../../../testing/shared-testing';

describe('ProductLabelStatisticsPageComponent', () => {
  let component: ProductLabelStatisticsPageComponent;
  let fixture: ComponentFixture<ProductLabelStatisticsPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      imports: TESTING_IMPORTS,
      providers: TESTING_PROVIDERS,
      declarations: [ ProductLabelStatisticsPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductLabelStatisticsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
