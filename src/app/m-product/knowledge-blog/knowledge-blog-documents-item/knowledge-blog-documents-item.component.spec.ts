import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { KnowledgeBlogDocumentsItemComponent } from './knowledge-blog-documents-item.component';
import { TESTING_IMPORTS, TESTING_PROVIDERS } from '../../../../testing/shared-testing';

describe('KnowledgeBlogDocumentsItemComponent', () => {
  let component: KnowledgeBlogDocumentsItemComponent;
  let fixture: ComponentFixture<KnowledgeBlogDocumentsItemComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      imports: TESTING_IMPORTS,
      providers: TESTING_PROVIDERS,
      declarations: [ KnowledgeBlogDocumentsItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KnowledgeBlogDocumentsItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
