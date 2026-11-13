import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { KnowledgeBlogFrontComponent } from './knowledge-blog-front.component';
import { TESTING_IMPORTS, TESTING_PROVIDERS } from '../../testing/shared-testing';

describe('KnowledgeBlogFrontComponent', () => {
  let component: KnowledgeBlogFrontComponent;
  let fixture: ComponentFixture<KnowledgeBlogFrontComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      imports: TESTING_IMPORTS,
      providers: TESTING_PROVIDERS,
      declarations: [ KnowledgeBlogFrontComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KnowledgeBlogFrontComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
