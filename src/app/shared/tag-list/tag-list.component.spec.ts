import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';

import { TagListComponent } from './tag-list.component';
import { TESTING_IMPORTS, TESTING_PROVIDERS } from '../../../testing/shared-testing';

describe('TagListComponent', () => {
  let component: TagListComponent;
  let fixture: ComponentFixture<TagListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      imports: TESTING_IMPORTS,
      providers: TESTING_PROVIDERS,
      declarations: [ TagListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TagListComponent);
    component = fixture.componentInstance;
    // The codebook service is a required input; this stub offers no choices.
    component.codebookService = {
      formatter: () => (item: any) => String(item),
      autocompleteCandidates: () => of([]),
      hasAutocomplete: () => false,
      canAddNew: () => false,
      isEmpty: () => true,
      valid: () => true,
      makeNewForInput: () => null,
      addElement: () => {},
      removeElement: () => {}
    } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
