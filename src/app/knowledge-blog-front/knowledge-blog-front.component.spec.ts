import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KnowledgeBlogFrontComponent } from './knowledge-blog-front.component';
import { TESTING_IMPORTS, TESTING_PROVIDERS } from '../../testing/shared-testing';

describe('KnowledgeBlogFrontComponent', () => {
  let component: KnowledgeBlogFrontComponent;
  let fixture: ComponentFixture<KnowledgeBlogFrontComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
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
