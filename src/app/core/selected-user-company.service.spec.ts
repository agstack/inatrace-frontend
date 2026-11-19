import { of } from 'rxjs';
import { SelectedUserCompanyService } from './selected-user-company.service';

describe('SelectedUserCompanyService', () => {

  let reloadSpy: jasmine.Spy;

  const createService = (): SelectedUserCompanyService => {
    const authService = { userProfile$: of(null) } as any;
    const companyController = {
      getCompany: (id: number) => of({ status: 'OK', data: { id, name: 'Company ' + id } })
    } as any;
    const modalService = {
      hasOpenModals: () => false,
      open: () => ({ result: Promise.resolve({ id: 2, name: 'Coffee Buyer Co' }), componentInstance: {} })
    } as any;

    const service = new SelectedUserCompanyService(authService, companyController, modalService);
    reloadSpy = spyOn(service as any, 'reloadCurrentPage');
    return service;
  };

  afterEach(() => localStorage.removeItem('selectedUserCompany'));

  it('reloads the current page when the modal selects a different company', async () => {
    const service = createService();
    localStorage.setItem('selectedUserCompany', '1');

    await (service as any).listMyCompanies({});

    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it('reloads the current page when there was no company selected yet', async () => {
    const service = createService();

    await (service as any).listMyCompanies({});

    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it('keeps the page when the selected company is already the active one', async () => {
    const service = createService();
    localStorage.setItem('selectedUserCompany', '2');

    await (service as any).listMyCompanies({});

    expect(reloadSpy).not.toHaveBeenCalled();
  });
});
