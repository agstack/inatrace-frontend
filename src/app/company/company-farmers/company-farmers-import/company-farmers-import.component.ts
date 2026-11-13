import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Location} from '@angular/common';
import { UntypedFormControl } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, take } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { faFileExcel} from '@fortawesome/free-solid-svg-icons';
import { ApiUserCustomer } from '../../../../api/model/apiUserCustomer';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';
import { LanguageCodeHelper } from '../../../language-code-helper';
import { SelectedUserCompanyService } from '../../../core/selected-user-company.service';
import { ApiUserCustomerImportRowValidationError } from '../../../../api/model/apiUserCustomerImportRowValidationError';
import { FarmerImportConfirmationService } from '../../../../api/api/farmerImportConfirmation.service';

@Component({
    selector: 'app-company-farmers-import',
    templateUrl: './company-farmers-import.component.html',
    styleUrls: ['./company-farmers-import.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CompanyFarmersImportComponent implements OnInit {

  private companyId: number;
  fileForm = new UntypedFormControl();

  mimeError = $localize`:@@companyDetail.farmers.uploadSpreadsheet.error:Upload only file types XLS or XLSX.`;

  faFileExcel = faFileExcel;
  
  duplicates: Array<ApiUserCustomer> = [];

  validationErrors: Array<ApiUserCustomerImportRowValidationError> = [];

  importInProgress = false;
  duplicateInProgress = false;
  private importedDocumentId: number;
  selectionDocumentId: number;
  koboSheets: Array<{id: string, name: string, headers: string[], selected: string}> = [];
  private koboSelections: string[] = [];

  farmerImportTemplateHref = '';

  constructor(
      private confirmationService: FarmerImportConfirmationService,
      private toastService: ToastrService,
      private location: Location,
      private globalEventsManager: GlobalEventManagerService,
      private selUserCompanyService: SelectedUserCompanyService
  ) { }

  ngOnInit(): void {
    this.selUserCompanyService.selectedCompanyProfile$.pipe(take(1)).subscribe(cp => {
      if (cp) {
        this.companyId = cp.id;

        // Depending on the selected user company, set the appropriate farmer import template for download
        const companyCountryCode = cp.headquarters?.country?.code;
        if (companyCountryCode === 'RW') {
          this.farmerImportTemplateHref = '/assets/farmer-import/Template_list_of_farmers_Rwanda_en.xlsx';
        } else if (companyCountryCode === 'HN') {
          this.farmerImportTemplateHref = '/assets/farmer-import/Plantilla_listado_de_agricultores_Honduras_es.xlsx';
        } else if (LanguageCodeHelper.getCurrentLocale() === 'es') {
          this.farmerImportTemplateHref = '/assets/farmer-import/Plantilla_listado_de_agricultores_otros_paises_es.xlsx';
        } else {
          this.farmerImportTemplateHref = '/assets/farmer-import/Template_list_of_farmers_other_countries_en.xlsx';
        }
      }
    });
  }

  import() {

    if (this.importInProgress) {
      return;
    }

    if (this.fileForm && this.fileForm.value) {

      this.importInProgress = true;
      // Never keep decisions or errors from a previous file: acting on a stale duplicate
      // card would confirm the row against a document that is no longer selected.
      this.duplicates = [];
      this.validationErrors = [];
      this.importedDocumentId = undefined;
      this.globalEventsManager.showLoading(true);

      const documentId = this.fileForm.value.id;
      if (this.selectionDocumentId !== documentId) {
        this.koboSheets = [];
        this.koboSelections = [];
        this.selectionDocumentId = documentId;
      }
      if (this.koboSheets.length) {
        if (this.koboSheets.some(sheet => sheet.selected === '')) {
          this.toastService.warning($localize`:@@companyDetail.farmers.import.kobo.required:Choose an action for every sheet before importing.`);
          this.importInProgress = false;
          this.globalEventsManager.showLoading(false);
          return;
        }
        this.koboSelections = this.koboSheets.map(sheet => sheet.id + ':' + sheet.selected);
      }
      this.confirmationService.importFarmersSpreadsheet(this.companyId, documentId, undefined, this.koboSelections)
          .pipe(
              take(1),
              finalize(() => {
                this.importInProgress = false;
                this.globalEventsManager.showLoading(false);
              })
          )
          .subscribe(value => {
            if (value) {

              if (value.unresolvedKoboSheets && Object.keys(value.unresolvedKoboSheets).length) {
                this.koboSheets = Object.keys(value.unresolvedKoboSheets).map(key => {
                  const separator = key.indexOf(':');
                  return { id: key.substring(0, separator), name: key.substring(separator + 1),
                    headers: value.unresolvedKoboSheets[key], selected: '' };
                });
                return;
              }

              // If there are validation errors present, display error
              if (value.validationErrors && value.validationErrors.length > 0) {

                this.toastService.error($localize`:@@companyDetail.farmers.import.validationErrors.message:There are validation errors in the provided spreadsheet of farmers. Please check them below.`);
                this.validationErrors = value.validationErrors;
                return;
              } else {

                if (value.successful === 0 && value.duplicates && value.duplicates.length === 0) {
                  this.toastService.error($localize`:@@companyDetail.farmers.import.noFarmers.error:No farmers imported`);
                  return;
                }
                if (value.successful > 0 && value.duplicates && value.duplicates.length === 0) {
                  this.toastService.success($localize`:@@companyDetail.farmers.import.success.label:Farmers successfully imported. Please check the data on Company > Farmers tab`);
                  this.location.back();
                  return;
                }
                if (value.duplicates && value.duplicates.length > 0) {
                  this.toastService.warning($localize`:@@companyDetail.farmers.import.duplicates.choose:Some farmers may already exist. Choose how to handle each one.`);
                  this.importedDocumentId = documentId;
                  this.duplicates = value.duplicates;
                  return;
                }
              }
            }
          }, (error: HttpErrorResponse) => {
            const message = error.status === 400 && typeof error.error?.errorMessage === 'string'
                ? error.error.errorMessage
                : $localize`:@@companyDetail.farmers.import.request.error:Could not import the file. Check the data and try again.`;
            this.toastService.error(message, undefined, { enableHtml: false });
          });
    }
  }

  acceptDuplicate(user: ApiUserCustomer, index: number) {
    if (this.duplicateInProgress) { return; }
    this.duplicateInProgress = true;
    this.confirmationService.createSeparateImportedFarmer(this.companyId, this.importedDocumentId, user, undefined, this.koboSelections)
        .pipe(take(1), finalize(() => this.duplicateInProgress = false))
        .subscribe(() => this.toastService.success($localize`:@@companyDetail.farmers.import.success.single: Farmer successfully imported`),
                () => this.toastService.error($localize`:@@companyDetail.farmers.import.request.error:Could not import the file. Check the data and try again.`),
            () => this.duplicates.splice(index, 1));
  }

  confirmPlots(user: ApiUserCustomer, index: number) {
    if (this.duplicateInProgress) { return; }
    this.duplicateInProgress = true;
    this.confirmationService.confirmImportedFarmerPlots(this.companyId, this.importedDocumentId, user, undefined, this.koboSelections)
        .pipe(take(1), finalize(() => this.duplicateInProgress = false))
        .subscribe(() => {
          this.toastService.success($localize`:@@companyDetail.farmers.import.plots.success:Plots added to the existing farmer.`);
          this.duplicates.splice(index, 1);
        }, () => this.toastService.error($localize`:@@companyDetail.farmers.import.plots.error:Could not add plots. Check the farmer and try again.`));
  }

  rejectDuplicate(user: ApiUserCustomer, index: number) {
    this.duplicates.splice(index, 1);
  }

}
