import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AuthorisedSideNavComponent } from './authorised-side-nav.component';
import { TESTING_IMPORTS, TESTING_PROVIDERS } from '../../../../testing/shared-testing';

describe('AuthorisedSideNavComponent', () => {
  let component: AuthorisedSideNavComponent;
  let fixture: ComponentFixture<AuthorisedSideNavComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      imports: TESTING_IMPORTS,
      providers: TESTING_PROVIDERS,
      declarations: [ AuthorisedSideNavComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthorisedSideNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
