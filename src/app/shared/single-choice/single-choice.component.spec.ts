import { async, ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';

import { SingleChoiceComponent } from './single-choice.component';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

describe('SingleChoiceComponent', () => {
  let component: SingleChoiceComponent;
  let fixture: ComponentFixture<SingleChoiceComponent>;

  const supplierCodebook = () => {
    const queries: string[] = [];
    const codebook = {
      queries,
      supplierState$: new BehaviorSubject('ready'),
      autocompleteCandidates: (key$: any) => key$.pipe(map((key: string) => {
        queries.push(key);
        return { results: [], offset: 0, limit: 10, totalCount: 0 };
      })),
      isEnumFormControl: () => false,
      placeholder: () => 'Select ...',
      formatter: () => (item: any) => `${item}`
    };
    return codebook;
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SingleChoiceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SingleChoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('only displays supplier guidance for a successful empty result', () => {
    const state = new BehaviorSubject('loading');
    component.supplierFeedback = true;
    (component as any)._codebookService = { supplierState$: state, placeholder: () => '' };
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('No eligible supplier facilities');
    state.next('empty');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No eligible supplier facilities');
    state.next('error');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('No eligible supplier facilities');
    expect(fixture.nativeElement.textContent).toContain('Try again');
    state.next('forbidden');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('do not have permission');
    expect(fixture.nativeElement.textContent).not.toContain('Try again');
    state.next('ready');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Try again');
  });

  it('queries supplier facilities exactly once when mounted', fakeAsync(() => {
    const localFixture = TestBed.createComponent(SingleChoiceComponent);
    const localComponent = localFixture.componentInstance;
    const codebook = supplierCodebook();

    localComponent.supplierFeedback = true;
    localComponent.codebookService = codebook as any;
    localFixture.detectChanges();
    tick(250);

    expect(codebook.queries.length).toBe(1);
    localFixture.destroy();
    flush();
  }));

  it('queries exactly once when the supplier codebook is replaced', fakeAsync(() => {
    const localFixture = TestBed.createComponent(SingleChoiceComponent);
    const localComponent = localFixture.componentInstance;
    const first = supplierCodebook();
    const second = supplierCodebook();

    localComponent.supplierFeedback = true;
    localComponent.codebookService = first as any;
    localFixture.detectChanges();
    tick(250);
    expect(first.queries.length).toBe(1);

    localComponent.codebookService = second as any;
    tick(250);

    expect(first.queries.length).toBe(1);
    expect(second.queries.length).toBe(1);
    localFixture.destroy();
    flush();
  }));

  it('ignores a late supplier state from the previous codebook', fakeAsync(() => {
    const localFixture = TestBed.createComponent(SingleChoiceComponent);
    const localComponent = localFixture.componentInstance;
    const first = supplierCodebook();
    const second = supplierCodebook();

    localComponent.supplierFeedback = true;
    localComponent.codebookService = first as any;
    localFixture.detectChanges();
    tick(250);

    localComponent.codebookService = second as any;
    tick(250);
    localFixture.detectChanges();

    first.supplierState$.next('error');
    localFixture.detectChanges();
    expect(localFixture.nativeElement.textContent).not.toContain('could not be loaded');

    second.supplierState$.next('empty');
    localFixture.detectChanges();
    expect(localFixture.nativeElement.textContent).toContain('No eligible supplier facilities');

    localFixture.destroy();
    flush();
  }));

  it('issues exactly one new query when the supplier lookup is retried', fakeAsync(() => {
    const localFixture = TestBed.createComponent(SingleChoiceComponent);
    const localComponent = localFixture.componentInstance;
    const codebook = supplierCodebook();

    localComponent.supplierFeedback = true;
    localComponent.codebookService = codebook as any;
    localFixture.detectChanges();
    tick(250);
    expect(codebook.queries.length).toBe(1);

    localComponent.retrySupplierQuery();
    tick(250);

    expect(codebook.queries.length).toBe(2);
    localFixture.destroy();
    flush();
  }));

  it('does not preload selectors that do not use suppliers', fakeAsync(() => {
    const localFixture = TestBed.createComponent(SingleChoiceComponent);
    const localComponent = localFixture.componentInstance;
    const codebook = supplierCodebook();

    localComponent.codebookService = codebook as any;
    localFixture.detectChanges();
    tick(250);

    expect(codebook.queries.length).toBe(0);
    localFixture.destroy();
    flush();
  }));
});
