import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QrCodeRedirectComponent } from './qr-code-redirect.component';
import { TESTING_IMPORTS, TESTING_PROVIDERS } from '../../../testing/shared-testing';

describe('QrCodeRedirectComponent', () => {
  let component: QrCodeRedirectComponent;
  let fixture: ComponentFixture<QrCodeRedirectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: TESTING_IMPORTS,
      providers: TESTING_PROVIDERS,
      declarations: [ QrCodeRedirectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QrCodeRedirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
