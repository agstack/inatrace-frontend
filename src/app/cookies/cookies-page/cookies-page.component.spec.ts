import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CookiesPageComponent } from './cookies-page.component';
import { TESTING_IMPORTS, TESTING_PROVIDERS } from '../../../testing/shared-testing';

describe('CookiesPageComponent', () => {
  let component: CookiesPageComponent;
  let fixture: ComponentFixture<CookiesPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      imports: TESTING_IMPORTS,
      providers: TESTING_PROVIDERS,
      declarations: [ CookiesPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CookiesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
