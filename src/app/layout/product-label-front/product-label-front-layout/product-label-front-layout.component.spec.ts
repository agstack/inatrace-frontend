import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ProductLabelFrontLayoutComponent } from './product-label-front-layout.component';
import { TESTING_IMPORTS, TESTING_PROVIDERS } from '../../../../testing/shared-testing';

describe('ProductLabelFrontLayoutComponent', () => {
  let component: ProductLabelFrontLayoutComponent;
  let fixture: ComponentFixture<ProductLabelFrontLayoutComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      imports: TESTING_IMPORTS,
      providers: TESTING_PROVIDERS,
      declarations: [ ProductLabelFrontLayoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductLabelFrontLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
