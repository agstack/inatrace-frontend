import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiProductLabelBatch } from 'src/api/model/apiProductLabelBatch';
import { ActiveCompaniesService } from 'src/app/shared-services/active-companies.service';
import { generateFormFromMetadata } from 'src/shared/utils';
import { ApiProductLabelBatchValidationScheme } from './validation';

@Component({
    selector: 'app-batch-edit-modal',
    templateUrl: './batch-edit-modal.component.html',
    styleUrls: ['./batch-edit-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class BatchEditModalComponent implements OnInit {
  // @Input()
  // company = null

  @Input()
  dismissable = true;

  @Input()
  title = null;

  // @Input()
  // onSave: (batch: ApiProductLabelBatch) => {}

  @Input()
  batch: ApiProductLabelBatch = null;

  form: UntypedFormGroup;
  saveTextButton: string = "Save";
  createTextButton: string = "Create";


  constructor(
    public activeModal: NgbActiveModal,
    public sifrantCompany: ActiveCompaniesService,
  ) { }

  ngOnInit(): void {
    if(this.batch) {
      this.form = generateFormFromMetadata(ApiProductLabelBatch.formMetadata(), this.batch, ApiProductLabelBatchValidationScheme)
    } else {
      this.form = generateFormFromMetadata(ApiProductLabelBatch.formMetadata(), {}, ApiProductLabelBatchValidationScheme)
    }
  }

  cancel() {
    this.activeModal.close()
  }

  get saveText() {
    return this.batch ? this.saveTextButton : this.createTextButton
  }

  submitted = false;
  onConfirm() {
    this.submitted = true;
    if(this.form.invalid) return;
    this.activeModal.close(this.form.value)
  }
}
