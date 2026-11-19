import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { CompanyFarmersImportComponent } from './company-farmers-import.component';

describe('CompanyFarmersImportComponent duplicate decisions', () => {
  let component: CompanyFarmersImportComponent;
  let confirmation: jasmine.SpyObj<any>;
  let company: jasmine.SpyObj<any>;
  let toast: jasmine.SpyObj<any>;

  beforeEach(() => {
    confirmation = jasmine.createSpyObj('confirmation', ['confirmImportedFarmerPlots', 'createSeparateImportedFarmer', 'importFarmersSpreadsheet']);
    company = jasmine.createSpyObj('company', ['addUserCustomer', 'importFarmersSpreadsheet']);
    toast = jasmine.createSpyObj('toast', ['success', 'error', 'warning']);
    const events = jasmine.createSpyObj('events', ['showLoading']);
    component = new CompanyFarmersImportComponent(confirmation, toast, {} as any, events, {} as any);
    (component as any).companyId = 12;
    (component as any).importedDocumentId = 34;
    component.duplicates = [{ name: 'Ada' }];
  });

  it('attaches only after confirmation and removes the resolved item', () => {
    confirmation.confirmImportedFarmerPlots.and.returnValue(of({}));
    component.confirmPlots(component.duplicates[0], 0);
    expect(confirmation.confirmImportedFarmerPlots).toHaveBeenCalledWith(12, 34, { name: 'Ada' }, undefined, []);
    expect(company.addUserCustomer).not.toHaveBeenCalled();
    expect(component.duplicates.length).toBe(0);
  });

  it('keeps the item when the backend rejects confirmation', () => {
    confirmation.confirmImportedFarmerPlots.and.returnValue(throwError('failure'));
    component.confirmPlots(component.duplicates[0], 0);
    expect(component.duplicates.length).toBe(1);
    expect(component.duplicateInProgress).toBe(false);
  });

  it('skips without invoking a mutation', () => {
    component.rejectDuplicate(component.duplicates[0], 0);
    expect(confirmation.confirmImportedFarmerPlots).not.toHaveBeenCalled();
    expect(company.addUserCustomer).not.toHaveBeenCalled();
    expect(component.duplicates.length).toBe(0);
  });

  it('creates a separate farmer from the original import', () => {
    confirmation.createSeparateImportedFarmer.and.returnValue(of({}));
    component.acceptDuplicate(component.duplicates[0], 0);
    expect(confirmation.createSeparateImportedFarmer).toHaveBeenCalledWith(12, 34, { name: 'Ada' }, undefined, []);
    expect(company.addUserCustomer).not.toHaveBeenCalled();
    expect(component.duplicates.length).toBe(0);
  });

  it('shows the actionable import error returned by the backend', () => {
    confirmation.importFarmersSpreadsheet.and.returnValue(throwError(new HttpErrorResponse({
      status: 400, error: { errorMessage: 'Unable to resolve GeoID in cell AI6' }
    })));
    component.fileForm.setValue({ id: 34 });
    component.import();
    expect(toast.error).toHaveBeenCalledWith('Unable to resolve GeoID in cell AI6', undefined, { enableHtml: false });
  });

  it('requires an explicit choice and reuses it when confirming a duplicate', () => {
    confirmation.importFarmersSpreadsheet.and.returnValues(
      of({ unresolvedKoboSheets: { '1:plots': ['_parent_index', 'location'] } }),
      of({ successful: 0, duplicates: [{ name: 'Ada' }] }));
    confirmation.confirmImportedFarmerPlots.and.returnValue(of({}));
    component.fileForm.setValue({ id: 34 });
    component.import();
    component.import();
    expect(confirmation.importFarmersSpreadsheet.calls.count()).toBe(1);
    component.koboSheets[0].selected = '1';
    component.import();
    expect(confirmation.importFarmersSpreadsheet).toHaveBeenCalledWith(12, 34, undefined, ['1:1']);
    component.confirmPlots(component.duplicates[0], 0);
    expect(confirmation.confirmImportedFarmerPlots).toHaveBeenCalledWith(12, 34, { name: 'Ada' }, undefined, ['1:1']);
  });

  it('discards decisions and errors from the previous file before starting a new import', () => {
    confirmation.importFarmersSpreadsheet.and.returnValue(of({ successful: 0, duplicates: [], validationErrors: [] }));
    component.validationErrors = [{ rowIndex: 1 } as any];
    component.duplicates = [{ name: 'Old' } as any];
    component.fileForm.setValue({ id: 99 });
    component.import();
    expect(component.duplicates.length).toBe(0);
    expect(component.validationErrors.length).toBe(0);
    expect((component as any).importedDocumentId).toBeUndefined();
  });
});
