import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../core/auth.service';
import { ActiveCompaniesService } from '../../shared-services/active-companies.service';
import { ApiUserGet } from '../../../api/model/apiUserGet';

@Component({
    selector: 'app-selected-user-company-modal',
    templateUrl: './selected-user-company-modal.component.html',
    styleUrls: ['./selected-user-company-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SelectedUserCompanyModalComponent implements OnInit {

  @Input()
  codebookMyCompanies: ActiveCompaniesService;

  @Input()
  userProfile: ApiUserGet;

  title = $localize`:@@selectUserCompany.title:Select company`;
  instructionsHtml = $localize`:@@selectUserCompany.instructionsHtml:Select a company you would like to continue with:`;

  @Input()
  onSelectedCompany: (company: any) => {};

  companyForm = new UntypedFormControl(null);
  userHasCompanies = false;

  constructor(
    private activeModal: NgbActiveModal,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.userHasCompanies = this.userProfile?.companyIds?.length > 0;
  }

  cancel() {
    this.activeModal.close();
  }

  onConfirm(): void {
    if (this.companyForm.value) {
      this.activeModal.close(this.companyForm.value);
    }
  }

  logout(): void {
    this.authService.logout().then(() => this.activeModal.dismiss());
  }

}
