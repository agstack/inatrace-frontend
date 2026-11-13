import { CommonModule, Location } from '@angular/common';
import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { CompanyControllerService } from '../../../../api/api/companyController.service';
import { FarmerImportConfirmationService } from '../../../../api/api/farmerImportConfirmation.service';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';
import { SelectedUserCompanyService } from '../../../core/selected-user-company.service';
import { CompanyFarmersImportComponent } from './company-farmers-import.component';

@Pipe({
    name: 'formatFarmerImportValidationError',
    standalone: false
})
class FakeValidationPipe implements PipeTransform {
  transform(value: string): string { return value; }
}

describe('Farmer import duplicate controls', () => {
  let fixture: ComponentFixture<CompanyFarmersImportComponent>;
  let confirmation: jasmine.SpyObj<any>;

  beforeEach(waitForAsync(() => {
    confirmation = jasmine.createSpyObj('confirmation', ['confirmImportedFarmerPlots', 'createSeparateImportedFarmer']);
    confirmation.confirmImportedFarmerPlots.and.returnValue(of({}));
    TestBed.configureTestingModule({
      declarations: [CompanyFarmersImportComponent, FakeValidationPipe],
      imports: [CommonModule, ReactiveFormsModule],
      providers: [
        { provide: CompanyControllerService, useValue: {} },
        { provide: FarmerImportConfirmationService, useValue: confirmation },
        { provide: ToastrService, useValue: jasmine.createSpyObj('toast', ['success', 'error', 'warning']) },
        { provide: Location, useValue: {} },
        { provide: GlobalEventManagerService, useValue: {} },
        { provide: SelectedUserCompanyService, useValue: { selectedCompanyProfile$: of({ id: 12 }) } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompanyFarmersImportComponent);
    (fixture.componentInstance as any).importedDocumentId = 34;
    fixture.componentInstance.duplicates = [{ name: 'Ada', surname: 'Test', location: { address: { city: 'Testville', village: 'Village' } } }];
    fixture.detectChanges();
  });

  it('renders separate attach, create and skip actions and confirms only on click', () => {
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const attach = buttons.find(button => button.textContent.trim() === 'Add plots to existing farmer');
    expect(buttons.some(button => button.textContent.trim() === 'Create separate farmer')).toBe(true);
    expect(buttons.some(button => button.textContent.trim() === 'Skip')).toBe(true);
    expect(confirmation.confirmImportedFarmerPlots).not.toHaveBeenCalled();
    attach.click();
    expect(confirmation.confirmImportedFarmerPlots).toHaveBeenCalledWith(12, 34,
        jasmine.objectContaining({ name: 'Ada' }), undefined, []);
  });

  it('identifies a duplicate by the city used for matching, not the village', () => {
    expect(fixture.nativeElement.textContent).toContain('Testville');
    expect(fixture.nativeElement.textContent).not.toContain('Village');
  });

  it('keeps the sheet choices and records an explicit selection', () => {
    const component = fixture.componentInstance;
    component.fileForm.setValue({ id: 34 });
    component.selectionDocumentId = 34;
    component.koboSheets = [{ id: '1', name: 'plots', headers: ['_parent_index', 'Location'], selected: '' }];

    expect(component.koboSheets[0].headers).toContain('Location');
    expect(component.koboSheets[0].headers).toContain('_parent_index');

    component.koboSheets[0].selected = '1';
    expect(component.koboSheets[0].selected).toBe('1');
  });
});
