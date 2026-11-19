import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ProductLabelFrontTopNavComponent } from './product-label-front-top-nav.component';

describe('ProductLabelFrontTopNavComponent', () => {
  let component: ProductLabelFrontTopNavComponent;
  let fixture: ComponentFixture<ProductLabelFrontTopNavComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [ ProductLabelFrontTopNavComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductLabelFrontTopNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
