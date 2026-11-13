import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductControllerService } from 'src/api/api/productController.service';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { NgbModalImproved } from 'src/app/core/ngb-modal-improved/ngb-modal-improved.service';
import { ProductLabelStakeholdersComponent } from '../product-label-stakeholders.component';
import { AuthService } from '../../../../core/auth.service';
import { AbstractControl, UntypedFormArray } from '@angular/forms';
import { ListEditorManager } from '../../../../shared/list-editor/list-editor-manager';
import { ApiProductDataSharingAgreement } from '../../../../../api/model/apiProductDataSharingAgreement';
import { SelectedUserCompanyService } from '../../../../core/selected-user-company.service';

@Component({
    selector: 'app-stakeholders-value-chain',
    templateUrl: './stakeholders-value-chain.component.html',
    styleUrls: ['./stakeholders-value-chain.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class StakeholdersValueChainComponent extends ProductLabelStakeholdersComponent implements OnInit {

  rootTab = 0;

  dataSharingAgreementListManager: ListEditorManager<ApiProductDataSharingAgreement>;

  constructor(
    protected productController: ProductControllerService,
    protected globalEventsManager: GlobalEventManagerService,
    protected modalService: NgbModalImproved,
    protected route: ActivatedRoute,
    protected router: Router,
    protected authService: AuthService,
    protected selUserCompanyService: SelectedUserCompanyService
  ) {
    super(productController, globalEventsManager, modalService, route, router, authService, selUserCompanyService);
  }

  get dataSharingAgreementsControls(): AbstractControl[] {
    return (this.productForm.get('dataSharingAgreements') as UntypedFormArray).controls;
  }

  async ngOnInit(): Promise<void> {
    await super.ngOnInit();
  }

}
