import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductLabelFeedbackPageComponent } from './product-label-feedback-page.component';
import { TESTING_IMPORTS, TESTING_PROVIDERS } from '../../../testing/shared-testing';

describe('ProductLabelFeedbackPageComponent', () => {
  let component: ProductLabelFeedbackPageComponent;
  let fixture: ComponentFixture<ProductLabelFeedbackPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: TESTING_IMPORTS,
      providers: TESTING_PROVIDERS,
      declarations: [ ProductLabelFeedbackPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductLabelFeedbackPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
