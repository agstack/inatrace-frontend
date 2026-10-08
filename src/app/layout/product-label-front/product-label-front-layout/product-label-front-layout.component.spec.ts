import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductLabelFrontLayoutComponent } from './product-label-front-layout.component';
import { TESTING_IMPORTS, TESTING_PROVIDERS } from '../../../../testing/shared-testing';

describe('ProductLabelFrontLayoutComponent', () => {
  let component: ProductLabelFrontLayoutComponent;
  let fixture: ComponentFixture<ProductLabelFrontLayoutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
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
