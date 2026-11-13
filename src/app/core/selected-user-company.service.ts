import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { ReplaySubject } from 'rxjs';
import { ApiCompanyGet } from '../../api/model/apiCompanyGet';
import { CompanyControllerService } from '../../api/api/companyController.service';
import { ApiUserGet } from '../../api/model/apiUserGet';
import { SelectedUserCompanyModalComponent } from '../user/selected-user-company-modal/selected-user-company-modal.component';
import { NgbModalImproved } from './ngb-modal-improved/ngb-modal-improved.service';
import { ActiveCompaniesService } from '../shared-services/active-companies.service';
import { ApiCompanyListResponse } from '../../api/model/apiCompanyListResponse';

@Injectable({
  providedIn: 'root'
})
export class SelectedUserCompanyService {

  private readonly selectedCompanyProfileSubject = new ReplaySubject<ApiCompanyGet>(1);
  selectedCompanyProfile$ = this.selectedCompanyProfileSubject.asObservable();

  constructor(
    private authService: AuthService,
    private companyControllerService: CompanyControllerService,
    private modalService: NgbModalImproved,
  ) {
    this.authService.userProfile$.subscribe(userProfile => this.selectUserCompany(userProfile));
  }

  private async selectUserCompany(user: ApiUserGet): Promise<void> {

    if (user) {

      // If there is already selected company, check that the user has access to it (if not, remove it from local storage)
      let currentlySelectedCompany = localStorage.getItem('selectedUserCompany');
      if (user.companyIds == null || user.companyIds.length === 0 || !user.companyIds.includes(Number(currentlySelectedCompany))) {
        localStorage.removeItem('selectedUserCompany');
        this.selectedCompanyProfileSubject.next(null);
        currentlySelectedCompany = null;
      }

      // If there is no current company selected, selected one or present modal dialog with list of available companies
      if (currentlySelectedCompany == null) {
        if (user.companyIds && user.companyIds.length === 1) {
          const companyProfile = await this.fetchCompanyProfile(user.companyIds[0]);
          if (companyProfile) {
            this.setSelectedCompany(companyProfile);
          }
          return;
        }

        this.listMyCompanies(user).then();
      } else {

        const companyProfile = await this.fetchCompanyProfile(Number(currentlySelectedCompany));
        if (companyProfile) {
          this.setSelectedCompany(companyProfile);
        }
      }

    } else {
      this.clearSelectedCompany();
    }
  }

  private async listMyCompanies(userProfile: ApiUserGet): Promise<void> {

    if (this.modalService.hasOpenModals()) {
      return;
    }

    const codebookMyCompanies = new ActiveCompaniesService(this.companyControllerService);

    const modalRef = this.modalService.open(SelectedUserCompanyModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false });
    Object.assign(modalRef.componentInstance, {
      codebookMyCompanies,
      userProfile
    });

    const company = await modalRef.result as ApiCompanyListResponse;
    if (company) {
      const previousCompanyId = localStorage.getItem('selectedUserCompany');
      this.setSelectedCompany(await this.fetchCompanyProfile(company.id));

      // The modal is shown after the application booted, so the page behind it was rendered
      // with the previous company (or with none). Reload it to let every screen fetch data for
      // the company that was just selected.
      if (!previousCompanyId || previousCompanyId !== String(company.id)) {
        this.reloadCurrentPage();
      }
    }
  }

  protected reloadCurrentPage(): void {
    window.location.reload();
  }

  private async fetchCompanyProfile(id: number): Promise<ApiCompanyGet | null> {

    const resp = await this.companyControllerService.getCompany(id).toPromise();
    if (resp && resp.status === 'OK' && resp.data) {
      return resp.data;
    }

    return null;
  }

  private clearSelectedCompany(): void {
    localStorage.removeItem('selectedUserCompany');
    this.selectedCompanyProfileSubject.next(null);
  }

  public setSelectedCompany(companyProfile: ApiCompanyGet): void {
    localStorage.setItem('selectedUserCompany', String(companyProfile.id));
    this.selectedCompanyProfileSubject.next(companyProfile);
  }

}
