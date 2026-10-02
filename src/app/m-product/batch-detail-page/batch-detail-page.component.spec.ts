import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchDetailPageComponent } from './batch-detail-page.component';
import { TESTING_IMPORTS, TESTING_PROVIDERS } from '../../../testing/shared-testing';

describe('BatchDetailPageComponent', () => {
  let component: BatchDetailPageComponent;
  let fixture: ComponentFixture<BatchDetailPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: TESTING_IMPORTS,
      providers: TESTING_PROVIDERS,
      declarations: [ BatchDetailPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BatchDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
