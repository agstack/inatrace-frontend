import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ActiveCompaniesService } from 'src/app/shared-services/active-companies.service';

@Component({
    selector: 'app-company-select-modal',
    templateUrl: './company-select-modal.component.html',
    styleUrls: ['./company-select-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CompanySelectModalComponent implements OnInit {

  @Input()
  dismissable = true;

  @Input()
  title = null;

  @Input()
  instructionsHtml = null;

  @Input()
  onSelectedCompany: (company: any) => {};

  companyForm = new UntypedFormControl(null);

  constructor(
    public activeModal: NgbActiveModal,
    public sifrantCompany: ActiveCompaniesService
  ) { }

  ngOnInit(): void {
  }

  cancel() {
    this.activeModal.close();
  }

  onConfirm() {
    if (this.companyForm.value) {
      this.activeModal.close(this.companyForm.value);
    }
  }
}
