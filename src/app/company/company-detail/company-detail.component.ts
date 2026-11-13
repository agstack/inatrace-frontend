import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, forkJoin, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { CompanyControllerService } from 'src/api/api/companyController.service';
import { ApiCompany } from 'src/api/model/apiCompany';
import { ApiCompanyGet } from 'src/api/model/apiCompanyGet';
import { defaultEmptyObject, generateFormFromMetadata } from 'src/shared/utils';
import { CountryService } from '../../shared-services/countries.service';
import { GlobalEventManagerService } from '../../core/global-event-manager.service';
import {
  ApiCompanyDocumentValidationScheme,
  ApiCompanyGetValidationScheme,
} from './validation';
import { environment } from 'src/environments/environment';
import { ApiResponseApiBaseEntity } from 'src/api/model/apiResponseApiBaseEntity';
import { ApiCertification } from 'src/api/model/apiCertification';
import { ListEditorManager } from '../../shared/list-editor/list-editor-manager';
import {
  ApiCertificationValidationScheme
} from '../../m-product/product-label/validation';
import { ApiCompanyDocument } from 'src/api/model/apiCompanyDocument';
import { CompanyDetailTabManagerComponent } from './company-detail-tab-manager/company-detail-tab-manager.component';
import { CurrenciesService } from '../../shared-services/currencies.service';
import { AuthService } from '../../core/auth.service';
import { ApiValueChain } from '../../../api/model/apiValueChain';
import { ActiveValueChainService } from '../../shared-services/active-value-chain.service';
import { ValueChainControllerService } from '../../../api/api/valueChainController.service';
import { ListNotEmptyValidator } from '../../../shared/validation';

@Component({
    selector: 'app-company-detail',
    templateUrl: './company-detail.component.html',
    styleUrls: ['./company-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CompanyDetailComponent extends CompanyDetailTabManagerComponent implements OnInit, OnDestroy {

  rootTab = 0;

  company: ApiCompany = {
    headquarters: {}
  };

  _companyErrorStatus$: BehaviorSubject<string>;
  companyDetailForm: UntypedFormGroup;
  countries: any = [];
  socialMediaForm: UntypedFormGroup;
  socialMediaDEForm: UntypedFormGroup;
  _hideWebPageField$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  _hideFacebookField$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  _hideInstagramField$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  _hideTwitterField$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  _hideYouTubeField$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  _hideOtherField$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  faTimes = faTimes;

  rootImageUrl: string = environment.relativeImageUploadUrlAllSizes;

  submitted = false;
  title = '';

  sub: Subscription;
  valueChainsCodebook: ActiveValueChainService;
  valueChainsForm = new UntypedFormControl(null);

  valueChains: Array<ApiValueChain> = [];
  selectedCompanyValueChainsControl = new UntypedFormControl(null, [ListNotEmptyValidator()]);

  certificationListManager = null;
  videosListManager = null;
  productionRecordListManager = null;
  meetTheFarmerListManager = null;

  companySection = {
    anchor: 'COMPANY_GENERAL',
    title: $localize`:@@companyDetail.companySection.general:Company`
  };

  companyHeadquartersSection = {
    anchor: 'COMPANY_HEADQUARTERS',
    title: $localize`:@@companyDetail.companySection.headquarters:Company headquarters`
  };

  socialMediaSection = {
    anchor: 'COMPANY_SOCIAL_MEDIA',
    title: $localize`:@@companyDetail.companySection.socialMedia:Social media`,
  };

  toc = [
    this.companySection,
    this.companyHeadquartersSection,
    this.socialMediaSection
  ];

  constructor(
    protected route: ActivatedRoute,
    private location: Location,
    protected companyController: CompanyControllerService,
    private valueChainController: ValueChainControllerService,
    protected globalEventsManager: GlobalEventManagerService,
    public countryCodes: CountryService,
    public currencyCodes: CurrenciesService,
    protected router: Router,
    protected authService: AuthService
  ) {
    super(router, route, authService, companyController);
  }

  static generateSocialMediaForm() {
    return new UntypedFormGroup({
      facebook: new UntypedFormControl(null),
      instagram: new UntypedFormControl(null),
      twitter: new UntypedFormControl(null),
      youtube: new UntypedFormControl(null),
      other: new UntypedFormControl(null),
    });
  }

  static ApiCertificationCreateEmptyObject(): ApiCertification {
    const obj = ApiCertification.formMetadata();
    return defaultEmptyObject(obj) as ApiCertification;
  }

  static ApiCertificationEmptyObjectFormFactory(): () => UntypedFormControl {
    return () => {
      return new UntypedFormControl(CompanyDetailComponent.ApiCertificationCreateEmptyObject(), ApiCertificationValidationScheme.validators);
    };
  }

  static ApiCompanyDocumentCreateEmptyObject(): ApiCompanyDocument {
    const obj = ApiCompanyDocument.formMetadata();
    return defaultEmptyObject(obj) as ApiCompanyDocument;
  }

  static ApiCompanyDocumentEmptyObjectFormFactory(): () => UntypedFormControl {
    return () => {
      return new UntypedFormControl(CompanyDetailComponent.ApiCompanyDocumentCreateEmptyObject(), ApiCompanyDocumentValidationScheme.validators);
    };
  }

  ngOnInit(): void {
    super.ngOnInit();
    this._companyErrorStatus$ = new BehaviorSubject<string>('');
    if (this.mode === 'update') {
      this.title = $localize`:@@companyDetail.title.edit:Edit company`;
      this.getCompany();
    } else {
      this.title = $localize`:@@companyDetail.title.add:Add company`;
      this.newCompany();
    }

    this.valueChainsCodebook = new ActiveValueChainService(this.valueChainController);
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    if (this.sub) { this.sub.unsubscribe(); }
  }

  public canDeactivate(): boolean {
    return !this.companyDetailForm || !this.companyDetailForm.dirty;
  }

  openOnStart(value: any) {
    return true;
  }

  async addSelectedValueChain(valueChain: ApiValueChain) {
    if (!valueChain) {
      return;
    }
    if (this.valueChains.some(vch => vch?.id === valueChain?.id)) {
      setTimeout(() => this.valueChainsForm.setValue(null));
      return;
    }
    this.valueChains.push(valueChain);
    setTimeout(() => {
      this.selectedCompanyValueChainsControl.setValue(this.valueChains);
      this.companyDetailForm.markAsDirty();
      this.valueChainsForm.setValue(null);
    });
  }

  deleteValueChain(idx: number) {
    this.confirmValueChainRemove().then(confirmed => {
      if (confirmed) {
        this.valueChains.splice(idx, 1);
        setTimeout(() => this.selectedCompanyValueChainsControl.setValue(this.valueChains));
        this.companyDetailForm.markAsDirty();
      }
    });
  }

  private async confirmValueChainRemove(): Promise<boolean> {

    const result = await this.globalEventsManager.openMessageModal({
      type: 'warning',
      message: $localize`:@@companyDetailValueChainModal.removeValueChain.confirm.message:Are you sure you want to remove the value chain? Processing on these value chains will not work anymore.`,
      options: {
        centered: true
      }
    });

    return result === 'ok';
  }

  get mode() {
    const id = this.route.snapshot.params.id;
    return id == null ? 'create' : 'update';
  }

  getCompany(): void {
    this._companyErrorStatus$.next('');
    this.globalEventsManager.showLoading(true);
    const id = +this.route.snapshot.paramMap.get('id');

    this.sub = forkJoin([
      this.companyController.getCompany(id).pipe(take(1))
    ]).subscribe({
      next: ([company]) => {
        this.company = company.data;
        if (!this.company.headquarters) {
          this.company.headquarters = this.emptyObject().headquarters;
        }

        if (company.data.valueChains) {
          this.valueChains = company.data.valueChains ? company.data.valueChains : [];
          this.selectedCompanyValueChainsControl.setValue(this.valueChains);
        }

        this.companyDetailForm = generateFormFromMetadata(ApiCompanyGet.formMetadata(), company.data, ApiCompanyGetValidationScheme);
        this.socialMediaForm = CompanyDetailComponent.generateSocialMediaForm();
        (this.companyDetailForm as UntypedFormGroup).setControl('mediaLinks', this.socialMediaForm);
        (this.companyDetailForm as UntypedFormGroup).setControl('valueChains', this.selectedCompanyValueChainsControl);
        this.companyDetailForm.updateValueAndValidity();

        this.fillWebPageAndSocialMediaForm();
        this.initializeListManagers();

        // If user is not enrolled in company enrolled, disable the form
        if (!this.isCompanyAdmin) {
          this.companyDetailForm.disable();
          this.valueChainsForm.disable();
        }

        this.globalEventsManager.showLoading(false);
      },
      error: (error) => {
        this._companyErrorStatus$.next(error.error.status);
        this.globalEventsManager.showLoading(false);
      }
    });
  }

  emptyObject() {
    return {
      headquarters: {
        address: null,
        city: null,
        country: null,
        state: null,
        zip: null
      }
    } as ApiCompanyGet;
  }

  newCompany() {
    this.companyDetailForm = generateFormFromMetadata(ApiCompanyGet.formMetadata(), this.emptyObject(), ApiCompanyGetValidationScheme);
    this.socialMediaForm = CompanyDetailComponent.generateSocialMediaForm();
    (this.companyDetailForm as UntypedFormGroup).setControl('mediaLinks', this.socialMediaForm);
    (this.companyDetailForm as UntypedFormGroup).setControl('valueChains', this.selectedCompanyValueChainsControl);
    this.companyDetailForm.updateValueAndValidity();
    this.initializeListManagers();
  }

  fillWebPageAndSocialMediaForm(): void {
    if (!!this.company.webPage) { this._hideWebPageField$.next(false); }
    for (const [key, value] of Object.entries(this.company.mediaLinks)) {
      if (key === 'facebook' && !!value) {
        this._hideFacebookField$.next(false);
        this.socialMediaForm.get('facebook').setValue(value);
      }
      if (key === 'instagram' && !!value) {
        this._hideInstagramField$.next(false);
        this.socialMediaForm.get('instagram').setValue(value);
      }
      if (key === 'twitter' && !!value) {
        this._hideTwitterField$.next(false);
        this.socialMediaForm.get('twitter').setValue(value);
      }
      if (key === 'youtube' && !!value) {
        this._hideYouTubeField$.next(false);
        this.socialMediaForm.get('youtube').setValue(value);
      }
      if (key === 'other' && !!value) {
        this._hideOtherField$.next(false);
        this.socialMediaForm.get('other').setValue(value);
      }
    }
    this.companyDetailForm.updateValueAndValidity();
  }

  get changed() {
    return this.companyDetailForm.dirty;
  }

  goBack(): void {
    this.router.navigate(['companies']).then(() => window.location.reload());
  }

  async saveCompany() {
    this.submitted = true;
    if (this.companyDetailForm.invalid) {
      this.globalEventsManager.push({
        action: 'error',
        notificationType: 'error',
        title: $localize`:@@companyDetail.saveCompany.error.title:Error`,
        message: $localize`:@@companyDetail.saveCompany.error.message:Errors on page. Please check!`
      });
      return;
    }

    try {
      this.globalEventsManager.showLoading(true);
      const params = this.route.snapshot.params;
      const res: ApiResponseApiBaseEntity = await this.companyController
          .updateCompany({ ...params, ...this.companyDetailForm.value }).pipe(take(1)).toPromise();
      if (res && res.status === 'OK') {
        this.companyDetailForm.markAsPristine();
      }
    } catch (e) {

    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  async create() {
    this.submitted = true;
    this._companyErrorStatus$.next('');

    if (this.companyDetailForm.invalid) {
      this.globalEventsManager.push({
        action: 'error',
        notificationType: 'error',
        title: $localize`:@@companyDetail.create.error.title:Error`,
        message: $localize`:@@companyDetail.create.error.message:Errors on page. Please check!`
      });
      return;
    }

    try {
      this.globalEventsManager.showLoading(true);
      const res: ApiResponseApiBaseEntity = await this.companyController
          .createCompany(this.companyDetailForm.value).pipe(take(1)).toPromise();
      if (res && res.status === 'OK') {
        this.companyDetailForm.markAsPristine();
        this.goBack();
      }
    } catch (e) {
    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  onFileUpload(event) {
    // console.log(event)
  }
  validate() {
    this.submitted = true;
  }

  initializeListManagers() {

    this.certificationListManager = new ListEditorManager<ApiCertification>(
      (this.companyDetailForm.get('certifications')) as UntypedFormArray,
      CompanyDetailComponent.ApiCertificationEmptyObjectFormFactory(),
      ApiCertificationValidationScheme
    );
    this.videosListManager = new ListEditorManager<ApiCompanyDocument>(
      (this.companyDetailForm.get('documents')) as UntypedFormArray,
      CompanyDetailComponent.ApiCompanyDocumentEmptyObjectFormFactory(),
      ApiCompanyDocumentValidationScheme
    );
    this.productionRecordListManager = new ListEditorManager<ApiCompanyDocument>(
      (this.companyDetailForm.get('documents')) as UntypedFormArray,
      CompanyDetailComponent.ApiCompanyDocumentEmptyObjectFormFactory(),
      ApiCompanyDocumentValidationScheme
    );
    this.meetTheFarmerListManager = new ListEditorManager<ApiCompanyDocument>(
      (this.companyDetailForm.get('documents')) as UntypedFormArray,
      CompanyDetailComponent.ApiCompanyDocumentEmptyObjectFormFactory(),
      ApiCompanyDocumentValidationScheme
    );
  }

}
