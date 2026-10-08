import { TestBed } from '@angular/core/testing';

import { AboutAppInfoService } from './about-app-info.service';
import { TESTING_IMPORTS, TESTING_PROVIDERS } from '../testing/shared-testing';

describe('AboutAppInfoService', () => {
  let service: AboutAppInfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: TESTING_IMPORTS,
      providers: TESTING_PROVIDERS
    });
    service = TestBed.inject(AboutAppInfoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
