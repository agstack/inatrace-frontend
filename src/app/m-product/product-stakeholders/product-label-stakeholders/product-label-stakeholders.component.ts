import { AfterViewInit, Component, HostListener, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { ProductControllerService } from 'src/api/api/productController.service';
import { ActivatedRoute, Router } from '@angular/router';
import { take, filter, tap, switchMap, catchError, map } from 'rxjs/operators';
import { ApiProductCompany } from 'src/api/model/apiProductCompany';
import { BehaviorSubject, combineLatest, of, Subscription } from 'rxjs';
import { UnsubscribeList } from 'src/shared/rxutils';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { CompanySelectModalComponent } from 'src/app/company/company-common/company-select-modal/company-select-modal.component';
import { TabCommunicationService } from 'src/app/shared/tab-communication.service';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { NgbModalImproved } from 'src/app/core/ngb-modal-improved/ngb-modal-improved.service';
import { AuthorisedLayoutComponent } from 'src/app/layout/authorised/authorised-layout/authorised-layout.component';
import { ApiProduct } from '../../../../api/model/apiProduct';
import { AuthService } from '../../../core/auth.service';
import { ApiUserGet } from '../../../../api/model/apiUserGet';
import { defaultEmptyObject, generateFormFromMetadata } from '../../../../shared/utils';
import { ApiProductDataSharingAgreementValidationScheme, ApiProductValidationScheme } from './stakeholders-value-chain/validation';
import { ListEditorManager } from '../../../shared/list-editor/list-editor-manager';
import { ApiProductDataSharingAgreement } from '../../../../api/model/apiProductDataSharingAgreement';
import { SelectedUserCompanyService } from '../../../core/selected-user-company.service';
import RoleEnum = ApiUserGet.RoleEnum;

@Component({
    template: '',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ProductLabelStakeholdersComponent implements OnInit, AfterViewInit {

  buyers: ApiProductCompany[] = [];
  importers: ApiProductCompany[] = [];
  exporters: ApiProductCompany[] = [];
  owners: ApiProductCompany[] = [];
  producers: ApiProductCompany[] = [];
  associations: ApiProductCompany[] = [];
  processors: ApiProductCompany[] = [];
  traders: ApiProductCompany[] = [];

  isOwner = false;
  isSystemAdmin = false;
  isRegionalAdmin = false;

  // TABS ////////////////
  @ViewChild(AuthorisedLayoutComponent)
  authorizedLayout;

  rootTab = 0;
  selectedTab: Subscription;

  tabs = [
    $localize`:@@productLabelStakeholders.tab0.title:Value chain`
  ];

  tabNames = [
    'value-chain'
  ];

  buyersSection = {
    anchor: 'BUYERS',
    title: $localize`:@@productLabelStakeholders.title.buyers:Buyers`
  };

  ownersSection = {
    anchor: 'OWNERS',
    title: $localize`:@@productLabelStakeholders.title.owners:Product admins`
  };

  producersSection = {
    anchor: 'PRODUCERS',
    title: $localize`:@@productLabelStakeholders.title.producers:Producers`
  };

  roastersSection = {
    anchor: 'ROASTERS',
    title: $localize`:@@productLabelStakeholders.title.roasters:Roasters`
  };

  associationsSection = {
    anchor: 'ASSOCIATIONS',
    title: $localize`:@@productLabelStakeholders.title.associations:Associations`
  };

  productId = this.route.snapshot.params.id;
  unsubscribeList = new UnsubscribeList();
  currentProduct;
  productForm: UntypedFormGroup;
  submitted = false;
  companyId: number | null = null;

  public reloadValueChainPing$ = new BehaviorSubject<boolean>(false);

  dataSharingAgreementListManager: ListEditorManager<ApiProductDataSharingAgreement>;

  product$ = combineLatest(this.reloadValueChainPing$, of(this.productId),
      (ping: any, id: string) => {
        return ping && id != null ? Number(id) : null;
      }
  ).pipe(
      filter(val => val != null),
      tap(() => { this.globalEventsManager.showLoading(true); }),
      switchMap(id => this.productController.getProduct(id).pipe(
          catchError(() => of(null))
      )),
      filter(resp => !!resp),
      map(resp => {
        return resp.data;
      }),
      tap(() => { this.globalEventsManager.showLoading(false); }),
      tap((data: ApiProduct) => {

        this.currentProduct = data;
        this.productForm = generateFormFromMetadata(ApiProduct.formMetadata(), this.currentProduct, ApiProductValidationScheme);
        this.initListManagers();

        this.isOwner = data.associatedCompanies.some(value => value.type === ApiProductCompany.TypeEnum.OWNER && value.company.id === this.companyId);

        this.buyers = [];
        this.importers = [];
        this.exporters = [];
        this.owners = [];
        this.producers = [];
        this.associations = [];
        this.processors = [];
        this.traders = [];

        for (const ac of this.currentProduct.associatedCompanies) {
          switch (ac.type) {
            case ApiProductCompany.TypeEnum.BUYER: this.buyers.push(ac); break;
            case ApiProductCompany.TypeEnum.IMPORTER: this.importers.push(ac); break;
            case ApiProductCompany.TypeEnum.EXPORTER: this.exporters.push(ac); break;
            case ApiProductCompany.TypeEnum.OWNER: this.owners.push(ac); break;
            case ApiProductCompany.TypeEnum.PRODUCER: this.producers.push(ac); break;
            case ApiProductCompany.TypeEnum.ASSOCIATION: this.associations.push(ac); break;
            case ApiProductCompany.TypeEnum.PROCESSOR: this.processors.push(ac); break;
            case ApiProductCompany.TypeEnum.TRADER: this.traders.push(ac); break;
          }
        }
      })
  );

  constructor(
    protected productController: ProductControllerService,
    protected globalEventsManager: GlobalEventManagerService,
    protected modalService: NgbModalImproved,
    protected route: ActivatedRoute,
    protected router: Router,
    protected authService: AuthService,
    protected selUserCompanyService: SelectedUserCompanyService
  ) { }

  static ApiProductDataSharingAgreementCreateEmptyObject(): ApiProductDataSharingAgreement {
    const obj = ApiProductDataSharingAgreement.formMetadata();
    return defaultEmptyObject(obj) as ApiProductDataSharingAgreement;
  }

  static ApiProductDataSharingAgreementEmptyObjectFormFactory(): () => UntypedFormControl {
    return () => {
      return new UntypedFormControl(ProductLabelStakeholdersComponent.ApiProductDataSharingAgreementCreateEmptyObject(),
        ApiProductDataSharingAgreementValidationScheme.validators);
    };
  }

  get tabCommunicationService(): TabCommunicationService {
    return this.authorizedLayout ? this.authorizedLayout.tabCommunicationService : null;
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event) {
    this.reload();
  }

  targetNavigate(segment: string) {
    this.router.navigate([segment], { relativeTo: this.route.parent }).then();
  }

  async ngOnInit(): Promise<void> {

    this.companyId = (await this.selUserCompanyService.selectedCompanyProfile$.pipe(take(1)).toPromise())?.id;

    this.unsubscribeList.add(
      this.authService.userProfile$.subscribe(userProfile => {
        if (userProfile) {
          this.isSystemAdmin = userProfile.role === ApiUserGet.RoleEnum.SYSTEMADMIN;
          this.isRegionalAdmin = userProfile.role === RoleEnum.REGIONALADMIN;
        }
      })
    );

    this.reload();
  }

  ngAfterViewInit() {
    this.selectedTab = this.tabCommunicationService.subscribe(this.tabs, this.tabNames, this.rootTab, this.targetNavigate.bind(this));
  }

  initListManagers() {
    this.dataSharingAgreementListManager = new ListEditorManager<ApiProductDataSharingAgreement>(
      (this.productForm.get('dataSharingAgreements')) as UntypedFormArray,
      ProductLabelStakeholdersComponent.ApiProductDataSharingAgreementEmptyObjectFormFactory(),
      ApiProductDataSharingAgreementValidationScheme
    );
  }

  reload() {
    this.reloadValueChainPing$.next(true);
  }

  async addStakeholderToProduct(cId, cType) {
    try {
      this.globalEventsManager.showLoading(true);
      this.currentProduct.associatedCompanies.push({ company: { id: cId }, type: cType });
      const res = await this.productController.updateProduct(this.currentProduct).pipe(take(1)).toPromise();
      if (res && res.status === 'OK') {
        this.reload();
      }
    } catch (e) {
    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  async newBuyer() {
    if (this.owners && this.owners.length === 0) {
      await this.dialogEmptyOwner();
      return;
    }
    const modalRef = this.modalService.open(CompanySelectModalComponent, { centered: true });
    Object.assign(modalRef.componentInstance, {
      title: $localize`:@@productLabelStakeholders.modal.buyer.title:Add buyer`,
      instructionsHtml: $localize`:@@productLabelStakeholders.modal.buyer.instructionsHtml:Select buyer company`
    });
    const company = await modalRef.result;
    if (company) {
      this.addStakeholderToProduct(company.id, ApiProductCompany.TypeEnum.BUYER).then();
    }
  }

  async newImporter() {
    if (this.owners && this.owners.length === 0) {
      await this.dialogEmptyOwner();
      return;
    }
    const modalRef = this.modalService.open(CompanySelectModalComponent, { centered: true });
    Object.assign(modalRef.componentInstance, {
      title: $localize`:@@productLabelStakeholders.modal.importer.title:Add importer`,
      instructionsHtml: $localize`:@@productLabelStakeholders.modal.importer.instructionsHtml:Select importer company`
    });
    const company = await modalRef.result;
    if (company) {
      this.addStakeholderToProduct(company.id, ApiProductCompany.TypeEnum.IMPORTER).then();
    }
  }

  async newExporter() {
    if (this.owners && this.owners.length === 0) {
      await this.dialogEmptyOwner();
      return;
    }
    const modalRef = this.modalService.open(CompanySelectModalComponent, { centered: true });
    Object.assign(modalRef.componentInstance, {
      title: $localize`:@@productLabelStakeholders.modal.exporter.title:Add exporter`,
      instructionsHtml: $localize`:@@productLabelStakeholders.modal.exporter.instructionsHtml:Select exporter company`
    });
    const company = await modalRef.result;
    if (company) {
      this.addStakeholderToProduct(company.id, ApiProductCompany.TypeEnum.EXPORTER).then();
    }
  }

  async newProducer() {
    if (this.owners && this.owners.length === 0) {
      await this.dialogEmptyOwner();
      return;
    }
    const modalRef = this.modalService.open(CompanySelectModalComponent, { centered: true });
    Object.assign(modalRef.componentInstance, {
      title: $localize`:@@productLabelStakeholders.modal.producer.title:Add producer`,
      instructionsHtml: $localize`:@@productLabelStakeholders.modal.producer.instructionsHtml:Select producer company`
    });
    const company = await modalRef.result;
    if (company) {
      this.addStakeholderToProduct(company.id, ApiProductCompany.TypeEnum.PRODUCER).then();
    }
  }

  async newOwner() {
    const modalRef = this.modalService.open(CompanySelectModalComponent, { centered: true });
    Object.assign(modalRef.componentInstance, {
      title: $localize`:@@productLabelStakeholders.modal.owner.title:Add product admin`,
      instructionsHtml: $localize`:@@productLabelStakeholders.modal.owner.instructionsHtml:Select product admin company`
    });
    const company = await modalRef.result;
    if (company) {
      this.addStakeholderToProduct(company.id, ApiProductCompany.TypeEnum.OWNER).then();
    }
  }

  async newAssociation() {
    if (this.owners && this.owners.length === 0) {
      await this.dialogEmptyOwner();
      return;
    }
    const modalRef = this.modalService.open(CompanySelectModalComponent, { centered: true });
    Object.assign(modalRef.componentInstance, {
      title: $localize`:@@productLabelStakeholders.modal.association.title:Add association`,
      instructionsHtml: $localize`:@@productLabelStakeholders.modal.association.instructionsHtml:Select association company`
    });
    const company = await modalRef.result;
    if (company) {
      this.addStakeholderToProduct(company.id, ApiProductCompany.TypeEnum.ASSOCIATION).then();
    }
  }

  async newProcessor() {
    if (this.owners && this.owners.length === 0) {
      await this.dialogEmptyOwner();
      return;
    }
    const modalRef = this.modalService.open(CompanySelectModalComponent, { centered: true });
    Object.assign(modalRef.componentInstance, {
      title: $localize`:@@productLabelStakeholders.modal.processor.title:Add processor`,
      instructionsHtml: $localize`:@@productLabelStakeholders.modal.processor.instructionsHtml:Select processor company`
    });
    const company = await modalRef.result;
    if (company) {
      this.addStakeholderToProduct(company.id, ApiProductCompany.TypeEnum.PROCESSOR).then();
    }
  }

  async newTrader() {
    if (this.owners && this.owners.length === 0) {
      await this.dialogEmptyOwner();
      return;
    }
    const modalRef = this.modalService.open(CompanySelectModalComponent, { centered: true });
    Object.assign(modalRef.componentInstance, {
      title: $localize`:@@productLabelStakeholders.modal.trader.title:Add trader`,
      instructionsHtml: $localize`:@@productLabelStakeholders.modal.trader.instructionsHtml:Select trader company`
    });
    const company = await modalRef.result;
    if (company) {
      this.addStakeholderToProduct(company.id, ApiProductCompany.TypeEnum.TRADER).then();
    }
  }

  async remove(company) {
    if (!this.editable()) {
      return;
    }
    if (company.type === ApiProductCompany.TypeEnum.OWNER && this.owners.length <= 1) {
      await this.globalEventsManager.openMessageModal({
        type: 'error',
        message: $localize`:@@productLabelStakeholders.modal.owner.remove.error.title:The product must have at least one owner. If you want to delete the current owner, add another owner first.`,
        options: {
          centered: true
        },
        dismissable: false
      });
      return;
    }
    const result = await this.globalEventsManager.openMessageModal({
      type: 'warning',
      message: $localize`:@@productLabelStakeholders.remove.warning.message:Are you sure you want to remove ${company.company.name}?`,
      options: { centered: true },
      dismissable: false
    });
    if (result !== 'ok') {
      return;
    }

    try {
      this.globalEventsManager.showLoading(true);
      this.currentProduct.associatedCompanies = this.currentProduct.associatedCompanies.filter(c => c !== company);
      const res = await this.productController.updateProduct(this.currentProduct).pipe(take(1)).toPromise();
      if (res && res.status === 'OK') {
        this.reload();
      }
    } catch (e) {
    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  async dialogEmptyOwner() {
    await this.globalEventsManager.openMessageModal({
      type: 'warning',
      message: $localize`:@@productLabelStakeholders.modal.owner.add.warning.title:Please add an owner first.`,
      options: {
        centered: true
      },
      dismissable: false
    });
  }

  showWarning() {
    const buttonOkText = $localize`:@@productLabelStakeholders.warning.button.ok:OK`;
    this.globalEventsManager.openMessageModal({
      type: 'warning',
      title: $localize`:@@productLabelStakeholders.warning.title:Missing company`,
      message: $localize`:@@productLabelStakeholders.warning.message:Please select company before continuing`,
      options: { centered: true },
      dismissable: false,
      buttons: ['ok'],
      buttonTitles: { ok: buttonOkText }
    });
  }

  editable() {
    return this.isSystemAdmin || this.isRegionalAdmin;
  }

  async saveDataSharingAgreements() {

    this.submitted = true;
    if (!this.productForm.dirty) {
      return;
    }

    // Update the product
    try {
      this.globalEventsManager.showLoading(true);
      const data = this.productForm.value;
      const res = await this.productController.updateProduct(data).pipe(take(1)).toPromise();
      if (res && res.status === 'OK') {
        this.productForm.markAsPristine();
        this.reload();
      }
    } catch (e) {
    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

}
