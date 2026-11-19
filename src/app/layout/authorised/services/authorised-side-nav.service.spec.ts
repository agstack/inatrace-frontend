import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthorisedSideNavService } from './authorised-side-nav.service';

describe('AuthorisedSideNavService', () => {
  let service: AuthorisedSideNavService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],});
    service = TestBed.inject(AuthorisedSideNavService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
