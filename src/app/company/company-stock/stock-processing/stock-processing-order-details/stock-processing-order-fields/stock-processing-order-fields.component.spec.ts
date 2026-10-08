import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { ApiProcessingEvidenceField } from '../../../../../../api/model/apiProcessingEvidenceField';
import { StockProcessingOrderDetailsHelper } from '../stock-processing-order-details.helper';
import { StockProcessingOrderFieldsComponent } from './stock-processing-order-fields.component';

// tslint:disable:component-selector
@Component({selector: 'textinput', template: '<ng-content></ng-content>'})
class TextinputStubComponent {
  @Input() type: string;
  @Input() step: string | number;
  @Input() min: string | number;
  @Input() form: FormControl;
  @Input() label: string;
  @Input() isInvalid: boolean;
  @Input() textarea: boolean;
}

@Component({selector: 'app-datepicker', template: '<ng-content></ng-content>'})
class DatepickerStubComponent {
  @Input() form: FormControl;
  @Input() label: string;
  @Input() invalid: boolean;
}
// tslint:enable:component-selector

describe('StockProcessingOrderFieldsComponent', () => {
  let component: StockProcessingOrderFieldsComponent;
  let fixture: ComponentFixture<StockProcessingOrderFieldsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [StockProcessingOrderFieldsComponent, TextinputStubComponent, DatepickerStubComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StockProcessingOrderFieldsComponent);
    component = fixture.componentInstance;
    component.side = 'right';
  });

  function render(type: ApiProcessingEvidenceField.TypeEnum, value: any = null, errors = null): void {
    component.fieldInfo = {
      id: 1,
      fieldName: 'evidence',
      label: 'Evidence field',
      type
    };
    component.formGroup = new FormGroup({
      evidence: new FormControl(value, errors)
    });
    component.submitted = true;
    fixture.detectChanges();

  }

  function textInput(): TextinputStubComponent {
    return fixture.debugElement.query(By.directive(TextinputStubComponent)).componentInstance;
  }

  it('renders NUMBER as a decimal input without a fixed precision or minimum', () => {
    render(ApiProcessingEvidenceField.TypeEnum.NUMBER, 11.75);
    const input = textInput();

    expect(input.type).toBe('number');
    expect(input.step).toBe('any');
    expect(input.min).toBeUndefined();
  });

  it('renders INTEGER as a whole-number input', () => {
    render(ApiProcessingEvidenceField.TypeEnum.INTEGER, 7);
    const input = textInput();

    expect(input.type).toBe('number');
    expect(input.step).toBe(1);
  });

  it('shows integer validation feedback when an INTEGER contains a fraction', () => {
    render(ApiProcessingEvidenceField.TypeEnum.INTEGER, 7.5, StockProcessingOrderDetailsHelper.integerValidator);

    expect(fixture.nativeElement.textContent).toContain('Field must be a whole number');
  });

  it('shows required feedback when a mandatory NUMBER is empty', () => {
    render(ApiProcessingEvidenceField.TypeEnum.NUMBER, null, Validators.required);

    expect(fixture.nativeElement.textContent).toContain('Field is required');
  });

  it('continues to render existing evidence field types with their established controls', () => {
    render(ApiProcessingEvidenceField.TypeEnum.PRICE, 2.5);
    let input = textInput();
    expect(input.type).toBe('number');
    expect(input.step).toBe('0.01');
    expect(input.min).toBe('0');

    render(ApiProcessingEvidenceField.TypeEnum.EXCHANGERATE, 1.2);
    input = textInput();
    expect(input.type).toBe('number');
    expect(input.step).toBe('0.01');

    render(ApiProcessingEvidenceField.TypeEnum.STRING, 'Grade A');
    expect(textInput().textarea).toBeUndefined();

    render(ApiProcessingEvidenceField.TypeEnum.TEXT, 'Free-form processing note');
    expect(textInput().textarea).toBe(true);

    render(ApiProcessingEvidenceField.TypeEnum.DATE, new Date(2026, 9, 7));
    expect(fixture.debugElement.query(By.directive(DatepickerStubComponent)).componentInstance.form.value)
      .toEqual(new Date(2026, 9, 7));
  });
});
