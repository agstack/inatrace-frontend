import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingPageTopNavComponent } from './landing-page-top-nav.component';
import { TESTING_IMPORTS, TESTING_PROVIDERS } from '../../../../testing/shared-testing';

describe('LandingPageTopNavComponent', () => {
  let component: LandingPageTopNavComponent;
  let fixture: ComponentFixture<LandingPageTopNavComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: TESTING_IMPORTS,
      providers: TESTING_PROVIDERS,
      declarations: [ LandingPageTopNavComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LandingPageTopNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
