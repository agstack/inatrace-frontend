import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AboutAppInfoService } from './about-app-info.service';
import { TESTING_IMPORTS, TESTING_PROVIDERS } from '../testing/shared-testing';

describe('AboutAppInfoService', () => {
  let service: AboutAppInfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      imports: TESTING_IMPORTS,
      providers: TESTING_PROVIDERS
    });
    service = TestBed.inject(AboutAppInfoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
