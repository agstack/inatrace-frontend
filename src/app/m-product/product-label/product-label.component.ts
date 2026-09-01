import { animate, state, style, transition, trigger } from '@angular/animations';
import { Location } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';
import { GoogleMap, MapInfoWindow } from '@angular/google-maps';
import { ActivatedRoute, Router } from '@angular/router';
import { faCompass, faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { faArrowDown, faArrowsAlt, faArrowUp, faCodeBranch, faEye, faQrcode, faSlidersH, faTimes } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { catchError, filter, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { CommonControllerService } from 'src/api/api/commonController.service';
import { CompanyControllerService } from 'src/api/api/companyController.service';
import { ProductControllerService } from 'src/api/api/productController.service';
import { ApiAddress } from 'src/api/model/apiAddress';
import { ApiCompany } from 'src/api/model/apiCompany';
import { ApiProcess } from 'src/api/model/apiProcess';
import { ApiProduct } from 'src/api/model/apiProduct';
import { ApiProductLabel } from 'src/api/model/apiProductLabel';
import { ApiProductOrigin } from 'src/api/model/apiProductOrigin';
import { ApiResponseApiBaseEntity } from 'src/api/model/apiResponseApiBaseEntity';
import { ApiResponsibility } from 'src/api/model/apiResponsibility';
import { ApiSustainability } from 'src/api/model/apiSustainability';
import { CompanyDetailComponent } from 'src/app/company/company-detail/company-detail.component';
import { ComponentCanDeactivate } from 'src/app/shared-services/component-can-deactivate';
import { TextinputComponent } from 'src/app/shared/textinput/textinput.component';
import { AuthService } from 'src/app/core/auth.service';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { NgbModalImproved } from 'src/app/core/ngb-modal-improved/ngb-modal-improved.service';
import { environment } from 'src/environments/environment';
import { UnsubscribeList } from 'src/shared/rxutils';
import { defaultEmptyObject, generateFormFromMetadata } from 'src/shared/utils';
import { PrefillProductSelectionModalComponent } from './prefill-product-selection-modal/prefill-product-selection-modal.component';
import {
  ApiBusinessToCustomerSettingsValidationScheme,
  ApiCompanyValidationScheme,
  ApiProductOriginValidationScheme,
  ApiProductValidationScheme,
  ApiValueChainValidationScheme,
  pricingTransparencyFormMetadata,
  pricingTransparencyValidationScheme
} from './validation';
import { EnumSifrant } from 'src/app/shared-services/enum-sifrant';
import { ApiProductSettings } from 'src/api/model/apiProductSettings';
import { ApiProductLabelContent } from 'src/api/model/apiProductLabelContent';
import { LanguageForLabelModalComponent } from './language-for-label-modal/language-for-label-modal.component';
import { ValueChainControllerService } from '../../../api/api/valueChainController.service';
import { ApiValueChain } from '../../../api/model/apiValueChain';
import { ApiProductCompany } from '../../../api/model/apiProductCompany';
import { LanguageForLabelModalResult } from './language-for-label-modal/model';
import { ApiBusinessToCustomerSettings } from '../../../api/model/apiBusinessToCustomerSettings';
import { ApiProductLabelCompanyDocument } from '../../../api/model/apiProductLabelCompanyDocument';
import { ImageViewerComponent } from '../../shared/image-viewer/image-viewer.component';
import { maxActiveArrayControls } from '../../../shared/validation';
import { SelectedUserCompanyService } from '../../core/selected-user-company.service';

@Component({
  selector: 'app-product-label',
  templateUrl: './product-label.component.html',
  styleUrls: ['./product-label.component.scss'],
  animations: [
    trigger('expandCollapse', [
      state('closed', style({
        height: '0',
        overflow: 'hidden',
        opacity: '0',
        margin: '0',
        padding: '0'
      })),
      state('open', style({
        opacity: '1'
      })),
      transition(
        'closed=>open',
        animate('150ms')
      ),
      transition(
        'open=>closed',
        animate('150ms ease-out')
      )
    ]),
  ]
})
export class ProductLabelComponent extends ComponentCanDeactivate implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild(GoogleMap) set map(gMap: GoogleMap) {
    if (gMap) {
      this.gMap = gMap;
      this.googleMapsIsLoaded();
    }
  }

  @ViewChild(MapInfoWindow) set infoWindow(infoWindow: MapInfoWindow) {
    if (infoWindow) { this.gInfoWindow = infoWindow; }
  }

  get currentLabelName() {
    // if(this.currentLabel && this.currentLabel.title) return this.currentLabel.title
    const noName = $localize`:@@productLabel.qrLabels.untitled:NO NAME`;
    if (!this.currentLabel) { return noName; }
    return this.labelTitleForm.value || noName;
  }

  get mode() {
    const id = this.route.snapshot.params.id;
    return id == null ? 'create' : 'update';
  }

  // origin location helper methods
  get originLocations(): FormArray {
    return this.productForm.get('origin.locations') as FormArray;
  }

  get isGoogleMapsLoaded() {  // fix of a Google Maps glitch
    return !!window.google;
  }

  get labelChanged() {
    return (this.visibilityForm && this.visibilityForm.dirty) || this.labelTitleForm.dirty;
  }

  get productChanged() {
    return this.productForm.dirty;
  }

  get mediaChanged() {
    return this.mediaForm && this.mediaForm.dirty;
  }

  get changed(): boolean {
    return this.productChanged || this.labelChanged || this.mediaChanged;
  }

  get invalid() {
    return this.productForm.invalid || (this.visibilityForm && this.visibilityForm.invalid) || (this.mediaForm && this.mediaForm.invalid);
  }
  get publishText() {
    if (!this.currentLabel) { return this.publishString; }
    if (this.currentLabel.status === ApiProductLabel.StatusEnum.PUBLISHED) { return this.unpublishString; }
    if (this.currentLabel.status === ApiProductLabel.StatusEnum.UNPUBLISHED) { return this.publishString; }
    return this.publishString;
  }

  get downloadFileName() {
    const productName = this.productForm.get('name').value;
    const LabelName = this.currentLabelName;
    return productName + '-' + LabelName + '-' + 'instructions.pdf';
  }

  get languageCodes() {
    const obj = {};
    obj['EN'] = $localize`:@@productLabel.languageCodes.en:EN`;
    obj['DE'] = $localize`:@@productLabel.languageCodes.de:DE`;
    obj['FR'] = $localize`:@@productLabel.languageCodes.fr:FR`;
    return obj;
  }

  get graphicFairPriceUnits() {
    const obj = {};

    obj['DISABLED'] = 'Disabled';
    obj['PER_CONTAINER'] = 'Per container';
    obj['PER_KG'] = 'Per kg';
    obj['PERCENT_VALUE'] = '% value';

    return obj;
  }

  gMap = null;
  gInfoWindow = null;
  gInfoWindowText = '';
  productForm: FormGroup;
  countries: any = [];
  markers: any = [];
  journeyMarkers: any[] = [];
  defaultCenter = {
    lat: 5.274054,
    lng: 21.514503
  };
  defaultZoom = 3;
  bounds: any;
  initialBounds: any = [];

  faTimes = faTimes;
  faArrowsAlt = faArrowsAlt;
  faTrashAlt = faTrashAlt;
  faCodeBranch = faCodeBranch;
  faEye = faEye;
  faCompass = faCompass;
  faSlidersH = faSlidersH;
  faQrcode = faQrcode;
  faArrowDown = faArrowDown;
  faArrowUp = faArrowUp;

  rootImageUrl: string = environment.relativeImageUploadUrlAllSizes;
  submitted = false;

  redirectToCertainLabel = null;
  initialReload = false;

  editInfoLabelLink = '';

  valueChainName: string;

  companyId: number | null = null;
  isOwner = false;

  unsubscribeList = new UnsubscribeList();

  currentLabel: ApiProductLabel = null;

  showLabelInfoLink = false;

  action = this.route.snapshot.data.action;

  availableMedia: ApiProductLabelCompanyDocument[];
  mediaForm = new FormGroup({});

  viewIcon = faEye;

  reloadPing$ = new BehaviorSubject(false);

  id$ = this.route.paramMap.pipe(
    map(m => m.get('id')),
    shareReplay(1)
  );

  product$ = combineLatest(this.reloadPing$, this.id$,
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
    tap(() => {
      this.reloadLabels();
      if (this.action === 'labels') {
        this.reloadLabel();
      } else {
        if (this.currentLabel) { this.labelSelect$.next({ id: this.currentLabel.id, preventEmit: true, selected: false }); }
        this.currentLabel = null;
      }
    }),
    tap(() => { this.globalEventsManager.showLoading(false); }),
    tap((data: ApiProduct) => {

      const product = data;

      this.productForm = generateFormFromMetadata(ApiProduct.formMetadata(), product, ApiProductValidationScheme);

      const pricingTransparencyForm = generateFormFromMetadata(pricingTransparencyFormMetadata(), product.settings.pricingTransparency, pricingTransparencyValidationScheme);
      (this.productForm.get('settings') as FormGroup).setControl('pricingTransparency', pricingTransparencyForm);

      const companyFormMediaLinks = CompanyDetailComponent.generateSocialMediaForm();
      const oldMediaLinks = this.productForm.get('company.mediaLinks').value;
      companyFormMediaLinks.setValue({ ...companyFormMediaLinks.value, ...oldMediaLinks });
      (this.productForm.get('company') as FormGroup).setControl('mediaLinks', companyFormMediaLinks);

      const businessToCustomerSettings = generateFormFromMetadata(ApiBusinessToCustomerSettings.formMetadata(),
          product.businessToCustomerSettings, ApiBusinessToCustomerSettingsValidationScheme);
      this.productForm.setControl('businessToCustomerSettings', businessToCustomerSettings);

      const valueChainForm = generateFormFromMetadata(ApiValueChain.formMetadata(), product.valueChain, ApiValueChainValidationScheme);
      this.productForm.setControl('valueChain', valueChainForm);
      this.productForm.updateValueAndValidity();
      this.initializeOriginLocations();
      this.initializeMarkers();
      this.isOwner = product.associatedCompanies.some(value => value.type === ApiProductCompany.TypeEnum.OWNER && value.company.id === this.companyId);
    }),
    shareReplay(1)
  );

  labelsReload$ = new BehaviorSubject<boolean>(false);

  pId = this.route.snapshot.params.id;

  labels$ = combineLatest(this.labelsReload$, of(this.pId),
    (ping: boolean, pId: number) => {
      if (ping && pId != null) { return Number(pId); }
      return null;
    }
  ).pipe(
    filter(val => val != null),
    switchMap(id => this.productController.getProductLabels(id).pipe(
      catchError(() => of(null))
    )),
    filter(val => val != null),
    map(resp => {
      return resp.data;
    }),
    // tap(val => console.log("LAB:", val)),
    shareReplay(1)
  );

  reloadLabel$ = new BehaviorSubject<number>(null);

  initialized$ = new BehaviorSubject<boolean>(false);

  currentLabel$ = combineLatest(this.initialized$, this.reloadLabel$,
    (initialized: boolean, labelId: number) => {
      return initialized ? labelId : null;
    }).pipe(
      filter(val => val != null),
      switchMap(id => this.productController.getProductLabel(id).pipe(
        catchError(() => of(null))
      )),
      filter(x => x != null),
      tap(() => {
        this.fadeInProductOnRefresh();
      }),
      map(resp => {
        return resp.data;
      }),
      tap(label => this.initializeByLabel(label)),
      shareReplay(1)
    );

  farmerPhotosListManager = null;

  labelsSection = {
    anchor: 'PRODUCT_LABELS',
    title: $localize`:@@productLabel.labelsSection.labels:QR labels`,
    icon: 'info'
  };

  emptyField = '-';

// PRODUCT
  @ViewChild('productName', { static: false })
  productNameTmpl: TemplateRef<any>;

  @ViewChild('productLogo', { static: false })
  productLogoTmpl: TemplateRef<any>;

  @ViewChild('productDescription', { static: false })
  productDescriptionTmpl: TemplateRef<any>;

  @ViewChild('origin', { static: false })
  originValueTmpl: TemplateRef<any>;

  productElements: any[] = [];

  // PROCESS
  @ViewChild('production', { static: false })
  productionTmpl: TemplateRef<any>;

  processElements: any[] = [];

  // SOCIAL RESPONSIBILITY
  @ViewChild('laborPolicies', { static: false })
  laborPoliciesTmpl: TemplateRef<any>;

  socialResponsibilityElements: any[] = [];

  // ENVIRONMENTAL SUSTAINABILITY
  @ViewChild('environmentalyFriendlyProduction', { static: false })
  environmentalyFriendlyProductionTmpl: TemplateRef<any>;

  @ViewChild('sustainablePackaging', { static: false })
  sustainablePackagingTmpl: TemplateRef<any>;

  @ViewChild('co2Footprint', { static: false })
  co2FootprintTmpl: TemplateRef<any>;

  environmentalSustainabilityElements: any[] = [];

  // COMPANY
  @ViewChild('companyName', { static: false })
  companyNameTmpl: TemplateRef<any>;

  @ViewChild('companyLogo', { static: false })
  companyLogoTmpl: TemplateRef<any>;

  @ViewChild('companyHeadquarters', { static: false })
  companyHeadquartersTmpl: TemplateRef<any>;

  @ViewChild('aboutTheCompany', { static: false })
  aboutTheCompanyTmpl: TemplateRef<any>;

  @ViewChild('nameOfManagerCEO', { static: false })
  nameOfManagerCEOTmpl: TemplateRef<any>;

  @ViewChild('contactEmail', { static: false })
  contactEmailTmpl: TemplateRef<any>;

  @ViewChild('contactPhoneNumber', { static: false })
  contactPhoneNumberTmpl: TemplateRef<any>;

  @ViewChild('companyWebPage', { static: false })
  companyWebPageTmpl: TemplateRef<any>;

  @ViewChild('facebook', { static: false })
  facebookTmpl: TemplateRef<any>;

  @ViewChild('instagram', { static: false })
  instagramTmpl: TemplateRef<any>;

  @ViewChild('twitter', { static: false })
  twitterTmpl: TemplateRef<any>;

  @ViewChild('youtube', { static: false })
  youtubeTmpl: TemplateRef<any>;

  @ViewChild('other', { static: false })
  otherTmpl: TemplateRef<any>;

  companyElements: any[] = [];

  // B2C
  @ViewChild('b2cPrimaryColor', { static: false })
  b2cPrimaryColor: TemplateRef<any>;

  @ViewChild('b2cSecondaryColor', { static: false })
  b2cSecondaryColor: TemplateRef<any>;

  @ViewChild('b2cTertiaryColor', { static: false })
  b2cTertiaryColor: TemplateRef<any>;

  @ViewChild('b2cQuaternaryColor', { static: false })
  b2cQuaternaryColor: TemplateRef<any>;

  @ViewChild('b2cProductTitleColor', { static: false })
  b2cProductTitleColor: TemplateRef<any>;

  @ViewChild('b2cHeadingColor', { static: false })
  b2cHeadingColor: TemplateRef<any>;

  @ViewChild('b2cTextColor', { static: false })
  b2cTextColor: TemplateRef<any>;

  @ViewChild('b2cTabFairPrices', { static: false })
  b2cTabFairPrices: TemplateRef<any>;

  @ViewChild('b2cTabProducers', { static: false })
  b2cTabProducers: TemplateRef<any>;

  @ViewChild('b2cTabQuality', { static: false })
  b2cTabQuality: TemplateRef<any>;

  @ViewChild('b2cTabFeedback', { static: false })
  b2cTabFeedback: TemplateRef<any>;

  @ViewChild('b2cProductFont', { static: false })
  b2cProductFont: TemplateRef<any>;

  @ViewChild('b2cTextFont', { static: false })
  b2cTextFont: TemplateRef<any>;

  @ViewChild('b2cLandingPageImage', { static: false })
  b2cLandingPageImage: TemplateRef<any>;

  @ViewChild('b2cLandingPageBackgroundImage', { static: false })
  b2cLandingPageBackgroundImage: TemplateRef<any>;

  @ViewChild('b2cHeaderBackgroundImage', { static: false })
  b2cHeaderBackgroundImage: TemplateRef<any>;

  @ViewChild('b2cMedia', { static: false })
  b2cMedia: TemplateRef<any>;

  @ViewChild('b2cPricePaidToProducerGraphic', { static: false })
  b2cPricePaidToProducer: TemplateRef<any>;

  @ViewChild('b2cFarmGatePriceGraphic', { static: false })
  b2cFarmGatePrice: TemplateRef<any>;

  @ViewChild('b2cPrices', { static: false })
  b2cPrices: TemplateRef<any>;

  @ViewChild('b2cGraphicQuality', { static: false })
  b2cGraphicQuality: TemplateRef<any>;

  b2cElements: any[] = [];

  // SETTINGS
  @ViewChild('language', { static: false })
  languageTmpl: TemplateRef<any>;

  @ViewChild('gdprText', { static: false })
  gdprTextTmpl: TemplateRef<any>;

  @ViewChild('privacyPolicyText', { static: false })
  privacyPolicyTextTmpl: TemplateRef<any>;

  @ViewChild('termsOfUseText', { static: false })
  termsOfUseTextTmpl: TemplateRef<any>;

  settingsElements: any[] = [];

  visibilityForm: FormGroup = null;

  sectionToNameToObj = new Map();

  labelSelect$ = new BehaviorSubject(null);

  visibilityMap = new Map();

  reorderMode = false;

  labelTitleForm = new FormControl(null);
  editTitleMode = false;

  @ViewChild('labelTitleInput', { static: false })
  labelTitleInput: TextinputComponent;

  publishString = $localize`:@@productLabel.qrLabels.publish:Publish`;
  unpublishString = $localize`:@@productLabel.qrLabels.unpublish:Unpublish`;

  fadeInProduct = false;

  graphicFairPricesCodes = EnumSifrant.fromObject(this.graphicFairPriceUnits);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private productController: ProductControllerService,
    protected globalEventsManager: GlobalEventManagerService,
    public companyController: CompanyControllerService,
    public valueChainController: ValueChainControllerService,
    private modalService: NgbModalImproved,
    private authService: AuthService,
    private commonController: CommonControllerService,
    private selUserCompanyService: SelectedUserCompanyService
  ) {
    super();
    this.generateLabelMaps();
    if (this.router.getCurrentNavigation().extras.state && this.router.getCurrentNavigation().extras.state.labelId) {
      this.redirectToCertainLabel = this.router.getCurrentNavigation().extras.state.labelId;
      this.initialReload = true;
    }
  }

  ngOnInit(): void {

    this.unsubscribeList.add(
      this.authService.userProfile$
        .pipe(
          switchMap(up => {
            if (up) {
              this.showLabelInfoLink = 'SYSTEM_ADMIN' === up.role;
              return this.selUserCompanyService.selectedCompanyProfile$;
            }
          })
        )
        .subscribe(cp => {

          this.companyId = cp?.id;
          this.initializeLabelsHelperLink().then();

          if (this.mode === 'update') {
            this.unsubscribeList.add(
              this.product$.subscribe(() => { }),
            );
            this.unsubscribeList.add(
              this.currentLabel$.subscribe(label => {
                this.currentLabel = label;
              })
            );
            this.reload();
          } else {
            this.newProduct().then();
          }
        })
    );
  }

  ngAfterViewInit() {   // ViewChildren for templates works only after ngAfterViewInit
    setTimeout(() => {
      this.generateDefaultElements();
      this.initialized$.next(true);
    });
  }

  ngOnDestroy() {
    this.unsubscribeList.cleanup();
  }

  public canDeactivate(): boolean {
    return !this.productForm || !(this.changed);
  }

  reload() {
    this.reloadPing$.next(true);
  }

  reloadLabels() {
    this.labelsReload$.next(true);
  }

  reloadLabel() {
    if (this.currentLabel) {
      this.reloadLabel$.next(this.currentLabel.id);
    }
  }

  loadLabel(label) {
    if (this.changed) {
      this.globalEventsManager.push({
        action: 'error',
        notificationType: 'warning',
        title: $localize`:@@productLabel.loadLabel.warning.title:Error`,
        message: $localize`:@@productLabel.loadLabel.warning.message:Unsaved data. Please save changes before creating a new label.`
      });
      if (this.currentLabel) {
        this.labelSelect$.next({ id: this.currentLabel.id, preventEmit: true });
      }
      return;
    }

    if (this.initialReload) {
      this.initialReload = false;
      this.labelSelect$.next({ id: this.redirectToCertainLabel, preventEmit: true });
      this.reloadLabel$.next(this.redirectToCertainLabel);
      this.reload();
    }
    else {
      this.reloadLabel$.next(label.id);
      this.labelTitleForm.setValue(null);
    }
  }

  async prepareForm(data) {

    const product = data;

    this.productForm = generateFormFromMetadata(ApiProduct.formMetadata(), product, ApiProductValidationScheme);

    const pricingTransparencyForm = generateFormFromMetadata(pricingTransparencyFormMetadata(), product.settings.pricingTransparency, pricingTransparencyValidationScheme);
    (this.productForm.get('settings') as FormGroup).setControl('pricingTransparency', pricingTransparencyForm);

    const companyFormMediaLinks = CompanyDetailComponent.generateSocialMediaForm();
    const oldMediaLinks = this.productForm.get('company.mediaLinks').value;
    companyFormMediaLinks.setValue({ ...companyFormMediaLinks.value, ...oldMediaLinks });
    (this.productForm.get('company') as FormGroup).setControl('mediaLinks', companyFormMediaLinks);

    const businessToCustomerSettings = generateFormFromMetadata(ApiBusinessToCustomerSettings.formMetadata(),
        product.businessToCustomerSettings, ApiBusinessToCustomerSettingsValidationScheme);
    this.productForm.setControl('businessToCustomerSettings', businessToCustomerSettings);

    this.productForm.updateValueAndValidity();
    this.initializeOriginLocations();
    this.initializeMarkers();
  }

  emptyObject() {
    const obj = defaultEmptyObject(ApiProduct.formMetadata()) as ApiProduct;
    obj.process = defaultEmptyObject(ApiProcess.formMetadata());
    obj.responsibility = defaultEmptyObject(ApiResponsibility.formMetadata());
    obj.sustainability = defaultEmptyObject(ApiSustainability.formMetadata());
    obj.settings = defaultEmptyObject(ApiProductSettings.formMetadata());
    obj.company = defaultEmptyObject(ApiCompany.formMetadata());
    obj.company.headquarters = defaultEmptyObject(ApiAddress.formMetadata());
    return obj;
  }

  async newProduct() {

    this.isOwner = true;

    this.productForm = generateFormFromMetadata(ApiProduct.formMetadata(), this.emptyObject(), ApiProductValidationScheme);

    const pricingTransparencyForm = generateFormFromMetadata(pricingTransparencyFormMetadata(), {}, pricingTransparencyValidationScheme);
    (this.productForm.get('settings') as FormGroup).setControl('pricingTransparency', pricingTransparencyForm);

    const originForm = generateFormFromMetadata(ApiProductOrigin.formMetadata(), {}, ApiProductOriginValidationScheme);
    this.productForm.setControl('origin', originForm);

    const businessToCustomerSettings = generateFormFromMetadata(ApiBusinessToCustomerSettings.formMetadata(),
        {
          primaryColor: '#25265E',
          secondaryColor: '#5DBCCF',
          tertiaryColor: '#F7F7F7',
          quaternaryColor: '#25265E',
          headingColor: '#000000',
          textColor: '#000000',
          tabFairPrices: true,
          tabProducers: true,
          tabQuality: true,
          tabFeedback: true,
          orderFairPrices: 1,
          orderProducers: 2,
          orderQuality: 3,
          orderFeedback: 4,
          graphicFairPrices: true,
          graphicIncreaseOfIncome: true,
          graphicQuality: true
        },
        ApiBusinessToCustomerSettingsValidationScheme);
    this.productForm.setControl('businessToCustomerSettings', businessToCustomerSettings);

    const companyFormMediaLinks = CompanyDetailComponent.generateSocialMediaForm();
    (this.productForm.get('company') as FormGroup).setControl('mediaLinks', companyFormMediaLinks);
    this.productForm.updateValueAndValidity();
    const companyId = this.route.snapshot.params.companyId;
    const valueChainId = this.route.snapshot.params.valueChainId;
    try {
      this.globalEventsManager.showLoading(true);
      let resp = await this.companyController.getCompany(Number(companyId)).pipe(take(1)).toPromise();
      const company = resp.data;
      const companyForm = generateFormFromMetadata(ApiCompany.formMetadata(), company, ApiCompanyValidationScheme);
      this.productForm.setControl('company', companyForm);
      resp = await this.valueChainController.getValueChain(Number(valueChainId)).toPromise();
      const valueChain = resp.data;
      const valueChainForm = generateFormFromMetadata(ApiValueChain.formMetadata(), valueChain, ApiValueChainValidationScheme);
      this.productForm.setControl('valueChain', valueChainForm);
      this.productForm.updateValueAndValidity();
      this.productForm.get('settings.language').setValue('EN');
    } catch (e) {

      this.globalEventsManager.push({
        action: 'error',
        notificationType: 'error',
        title: $localize`:@@productLabel.newProduct.error.title:Error`,
        message: $localize`:@@productLabel.newProduct.error.message:Wrong company data. Cannot create a product.`
      });
      this.router.navigate(['product-labels']).then();
    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  goBack(): void {
    this.router.navigate(['product-labels']).then();
  }

  async save() {
    this.submitted = true;
    if (!this.changed) { return; } // nothing to save
    if (!this.currentLabel) {   // No labels
      const res = await this.saveProduct(true);   // save and reload product
      if (res) {
        this.submitted = false;
      }
      return res;
    } else {
      const res = await this.saveCurrentLabel(true);
      if (res) {
        this.submitted = false;
      }

      return res;
    }
  }

  // returns true if no error
  async saveProduct(reload = true) {
    this.submitted = true;
    if (this.productForm.invalid) {
      this.globalEventsManager.push({
        action: 'error',
        notificationType: 'error',
        title: $localize`:@@productLabel.saveProduct.error.title:Error`,
        message: $localize`:@@productLabel.saveProduct.error.message:Errors on page. Please check!`
      });
      return false;
    }

    let result = false;
    try {
      this.globalEventsManager.showLoading(true);
      const data = this.productForm.value;
      const res = await this.productController.updateProduct(data).pipe(take(1)).toPromise();
      if (res && res.status === 'OK') {
        this.productForm.markAsPristine();
        if (this.visibilityForm) { this.visibilityForm.markAsPristine(); }
        if (reload) {
          this.reload();
        }
        result = true;
      }
    } catch (e) {

    } finally {
      this.globalEventsManager.showLoading(false);
    }
    return result;
  }

  async saveCurrentLabel(reload = false) {
    this.submitted = true;
    if (this.mediaForm.invalid) {
      this.globalEventsManager.push({
        action: 'error',
        notificationType: 'error',
        title: $localize`:@@productLabel.saveProduct.error.title:Error`,
        message: $localize`:@@productLabel.saveProduct.error.message:Errors on page. Please check!`
      });
      return false;
    }

    const labels = this.currentLabelFields();
    const res = await this.productController.updateProductLabel(
      {
        ...this.currentLabel,
        fields: labels,
        title: this.labelTitleForm.value
      },
    ).pipe(take(1)).toPromise();

    if (res && res.status === 'OK') {
      const data = this.productForm.value;

      data['labelId'] = this.currentLabel.id;
      data['id'] = this.pId;

      const resC = await this.productController.updateProductLabelContent(data as ApiProductLabelContent).pipe(take(1)).toPromise();
      if (resC && resC.status === 'OK') { this.productForm.markAsPristine(); }

      const labelDocuments: ApiProductLabelCompanyDocument[] = this.mediaForm.get('video').value
          .concat(this.mediaForm.get('farmers').value, this.mediaForm.get('productionRecord').value);
      const resLD = await this.productController.updateCompanyDocumentsForProductLabel(this.currentLabel.id, labelDocuments).pipe(take(1)).toPromise();
      if (resLD && resLD.status === 'OK') {
        this.mediaForm.markAsPristine();
      }

      this.visibilityForm.markAsPristine();
      this.labelTitleForm.setValue(null);
      this.labelTitleForm.markAsPristine();

      if (reload) {
        this.reloadLabels();
      }
      return true;
    }
    return false;
  }

  async create() {
    this.submitted = true;

    if (this.productForm.invalid) {
      this.globalEventsManager.push({
        action: 'error',
        notificationType: 'error',
        title: $localize`:@@productLabel.create.error.title:Error`,
        message: $localize`:@@productLabel.create.error.message:Errors on page. Please check!`
      });
      return;
    }

    try {
      this.globalEventsManager.showLoading(true);
      const data = this.productForm.value;
      delete data['id'];
      const res: ApiResponseApiBaseEntity = await this.productController.createProduct(data).pipe(take(1)).toPromise();
      if (res && res.status === 'OK') {
        this.productForm.markAsPristine();
        this.goBack();
      }
    } catch (e) {

    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  createOrFillOriginLocationsItem(loc: any, create: boolean): FormGroup {
    return new FormGroup({
      latitude: new FormControl(create ? loc.lat : loc.latitude),
      longitude: new FormControl(create ? loc.lng : loc.longitude),
      pinName: new FormControl(create ? null : loc.pinName),
      numberOfFarmers: new FormControl(create ? null : loc.numberOfFarmers),
    });
  }

  initializeOriginLocations(): void {
    const tmp = new FormArray([]);
    for (const loc of this.originLocations.value) {
      tmp.push(this.createOrFillOriginLocationsItem(loc, false));
    }
    (this.productForm.get('origin') as FormGroup).setControl('locations', tmp);
    this.productForm.updateValueAndValidity();
  }

  initializeMarkers(): void {
    this.markers = [];
    for (const loc of this.originLocations.value) {
      const tmp = {
        position: {
          lat: loc.latitude,
          lng: loc.longitude
        },
        label: {
          text: loc.numberOfFarmers ? String(loc.numberOfFarmers) : ' '
        },
        infoText: loc.pinName
      };
      this.markers.push(tmp);
      this.initialBounds.push(tmp.position);
    }
  }

  addOriginLocations(loc) {
    const tmp = {
      position: loc,
      label: {
        text: ' '
      },
      infoText: ' '
    };
    this.markers.push(tmp);
    this.originLocations.push(this.createOrFillOriginLocationsItem(loc, true) as FormGroup);
    this.productForm.markAsDirty();
  }

  removeOriginLocation(index: number) {
    if (this.canEdit()) {
      this.originLocations.removeAt(index);
      this.markers.splice(index, 1);
      this.productForm.markAsDirty();
    }
  }

  updateMarkerLocation(loc, index) {
    this.originLocations.at(index).get('latitude').setValue(loc.lat);
    this.originLocations.at(index).get('longitude').setValue(loc.lng);
    const tmpCurrent = this.markers[index];
    const tmp = {
      position: loc,
      label: tmpCurrent.label,
      infoText: tmpCurrent.infoText
    };
    this.markers.splice(index, 1, tmp);
  }
  updateInfoWindow(infoText, index) {
    const tmpCurrent = this.markers[index];
    const tmp = {
      position: tmpCurrent.position,
      label: tmpCurrent.label,
      infoText
    };
    this.markers.splice(index, 1, tmp);
  }

  dblClick(event: google.maps.MouseEvent) {
    if (this.canEdit()) {
      this.addOriginLocations(event.latLng.toJSON());
    }
  }

  dragend(event, index) {
    this.updateMarkerLocation(event.latLng.toJSON(), index);
  }

  openInfoWindow(gMarker, marker) {
    this.gInfoWindowText = marker.infoText;
    this.gInfoWindow.open(gMarker);
  }
  
  removeJourneyMarker(i: number) {
    this.journeyMarkersCtrl.removeAt(i);
    this.journeyMarkersCtrl.markAsDirty();
  }
  
  moveJourneyMarkerUp(i: number) {
    if (i > 0) {
      const values = this.journeyMarkersCtrl.value;
      const newValues = this.swapJourneyMarkers(values, i - 1, i);
      this.journeyMarkersCtrl.setValue(newValues);
      this.journeyMarkersCtrl.markAsDirty();
    }
  }
  
  moveJourneyMarkerDown(i: number) {
    const values = this.journeyMarkersCtrl.value;
    if (i < values.length - 1) {
      const newValues = this.swapJourneyMarkers(values, i, i + 1);
      this.journeyMarkersCtrl.setValue(newValues);
      this.journeyMarkersCtrl.markAsDirty();
    }
  }
  
  private swapJourneyMarkers(arr: any[], index1: number, index2: number) {
    arr = [...arr];
    const temp = arr[index1];
    arr[index1] = arr[index2];
    arr[index2] = temp;
    return arr;
  }

  onKey(event, index) {
    this.updateInfoWindow(event.target.value, index);
  }

  googleMapsIsLoaded() {
    if (this.initialBounds.length === 0) { return; }
    this.bounds = new google.maps.LatLngBounds();
    for (const bound of this.initialBounds) {
      this.bounds.extend(bound);
    }
    if (this.bounds.isEmpty()) {
      this.gMap.googleMap.setCenter(this.defaultCenter);
      this.gMap.googleMap.setZoom(this.defaultZoom);
      return;
    }
    const center = this.bounds.getCenter();
    const offset = 0.02;
    const northEast = new google.maps.LatLng(
      center.lat() + offset,
      center.lng() + offset
    );
    const southWest = new google.maps.LatLng(
      center.lat() - offset,
      center.lng() - offset
    );
    const minBounds = new google.maps.LatLngBounds(southWest, northEast);
    this.gMap.fitBounds(this.bounds.union(minBounds));
  }

  resetMap() {
    this.initialBounds = [];
    for (const m of this.markers) {
      this.initialBounds.push(m.position);
    }
    this.googleMapsIsLoaded();
  }

  openOnStart() {
    return true;
  }

  generateProductElements() {
    this.productElements = [
      { name: 'name', section: 'product', visible: new FormControl(true), template: this.productNameTmpl, disableDrag: true },
      { name: 'photo', section: 'product', visible: new FormControl(true), template: this.productLogoTmpl, disableDrag: true },
      { name: 'description', section: 'product', visible: new FormControl(true), template: this.productDescriptionTmpl, disableDrag: true },
      { name: 'origin', section: 'product', visible: new FormControl(true), template: this.originValueTmpl },
      { name: 'journeyMarkers', section: 'product', visible: new FormControl(true), disableDrag: true }
    ];
  }

  generateProcessElements() {
    this.processElements = [
      { name: 'process.production', section: 'process', visible: new FormControl(false), template: this.productionTmpl }
    ];
  }

  generateSocialResponsibilityElements() {
    this.socialResponsibilityElements = [
      { name: 'responsibility.laborPolicies', section: 'responsibility', visible: new FormControl(false), template: this.laborPoliciesTmpl }
    ];
  }

  generateEnvironmentalSustainabilityElements() {
    this.environmentalSustainabilityElements = [
      { name: 'sustainability.production', section: 'sustainability', visible: new FormControl(false), template: this.environmentalyFriendlyProductionTmpl },
      { name: 'sustainability.packaging', section: 'sustainability', visible: new FormControl(false), template: this.sustainablePackagingTmpl },
      { name: 'sustainability.co2Footprint', section: 'sustainability', visible: new FormControl(false), template: this.co2FootprintTmpl },
    ];
  }

  generateCompanyElements() {
    this.companyElements = [
      { name: 'company.name', section: 'company', visible: new FormControl(false), template: this.companyNameTmpl },
      { name: 'company.logo', section: 'company', visible: new FormControl(false), template: this.companyLogoTmpl },
      { name: 'company.headquarters', section: 'company', visible: new FormControl(false), template: this.companyHeadquartersTmpl },
      { name: 'company.about', section: 'company', visible: new FormControl(false), template: this.aboutTheCompanyTmpl },
      { name: 'company.manager', section: 'company', visible: new FormControl(false), template: this.nameOfManagerCEOTmpl },
      { name: 'company.email', section: 'company', visible: new FormControl(false), template: this.contactEmailTmpl },
      { name: 'company.phone', section: 'company', visible: new FormControl(false), template: this.contactPhoneNumberTmpl },
      { name: 'company.webPage', section: 'company', visible: new FormControl(false), template: this.companyWebPageTmpl },
      { name: 'company.mediaLinks.facebook', section: 'company', visible: new FormControl(false), template: this.facebookTmpl },
      { name: 'company.mediaLinks.instagram', section: 'company', visible: new FormControl(false), template: this.instagramTmpl },
      { name: 'company.mediaLinks.twitter', section: 'company', visible: new FormControl(false), template: this.twitterTmpl },
      { name: 'company.mediaLinks.youtube', section: 'company', visible: new FormControl(false), template: this.youtubeTmpl },
      { name: 'company.mediaLinks.other', section: 'company', visible: new FormControl(false), template: this.otherTmpl },
    ];
  }

  generateSettingsElements() {
    if (this.action === 'labels') {
      this.settingsElements = [
        { name: 'settings.language', section: 'settings', visible: new FormControl(false), template: this.languageTmpl },
        { name: 'settings.gdprText', section: 'settings', visible: new FormControl(false), template: this.gdprTextTmpl },
        { name: 'settings.privacyPolicyText', section: 'settings', visible: new FormControl(false), template: this.privacyPolicyTextTmpl },
        { name: 'settings.termsOfUseText', section: 'settings', visible: new FormControl(false), template: this.termsOfUseTextTmpl }
      ];
      return;
    }
    this.settingsElements = [
      { name: 'settings.language', section: 'settings', visible: new FormControl(false), template: this.languageTmpl },
      { name: 'settings.gdprText', section: 'settings', visible: new FormControl(false), template: this.gdprTextTmpl },
      { name: 'settings.privacyPolicyText', section: 'settings', visible: new FormControl(false), template: this.privacyPolicyTextTmpl },
      { name: 'settings.termsOfUseText', section: 'settings', visible: new FormControl(false), template: this.termsOfUseTextTmpl }
    ];
  }

  generateBusinessToCustomerSettingsElements() {
    this.b2cElements = [
      { name: 'businessToCustomerSettings.primaryColor', section: 'businessToCustomerSettings', visible: new FormControl(false), template: this.b2cPrimaryColor },
      { name: 'businessToCustomerSettings.secondaryColor', section: 'businessToCustomerSettings', visible: new FormControl(false), template: this.b2cSecondaryColor },
      { name: 'businessToCustomerSettings.tertiaryColor', section: 'businessToCustomerSettings', visible: new FormControl(false), template: this.b2cTertiaryColor },
      { name: 'businessToCustomerSettings.quaternaryColor', section: 'businessToCustomerSettings', visible: new FormControl(false), template: this.b2cQuaternaryColor },
      { name: 'businessToCustomerSettings.productTitleColor', section: 'businessToCustomerSettings', visible: new FormControl(false), template: this.b2cProductTitleColor },
      { name: 'businessToCustomerSettings.headingColor', section: 'businessToCustomerSettings', visible: new FormControl(false), template: this.b2cHeadingColor },
      { name: 'businessToCustomerSettings.textColor', section: 'businessToCustomerSettings', visible: new FormControl(false), template: this.b2cTextColor },
      { name: 'businessToCustomerSettings.tabFairPrices', section: 'businessToCustomerSettings', visible: new FormControl(false), template: this.b2cTabFairPrices },
      { name: 'businessToCustomerSettings.tabProducers', section: 'businessToCustomerSettings', visible: new FormControl(false), template: this.b2cTabProducers },
      { name: 'businessToCustomerSettings.tabQuality', section: 'businessToCustomerSettings', visible: new FormControl(false), template: this.b2cTabQuality },
      { name: 'businessToCustomerSettings.tabFeedback', section: 'businessToCustomerSettings', visible: new FormControl(false), template: this.b2cTabFeedback },
      { name: 'businessToCustomerSettings.productFont', section: 'businessToCustomerSettings', visible: new FormControl(false), template: this.b2cProductFont },
      { name: 'businessToCustomerSettings.textFont', section: 'businessToCustomerSettings', visible: new FormControl(false), template: this.b2cTextFont },
      { name: 'businessToCustomerSettings.landingPageImage', section: 'businessToCustomerSettings', visible: new FormControl(false), template: this.b2cLandingPageImage },
      { name: 'businessToCustomerSettings.landingPageBackgroundImage', section: 'businessToCustomerSettings',
        visible: new FormControl(false), template: this.b2cLandingPageBackgroundImage },
      { name: 'businessToCustomerSettings.headerBackgroundImage', section: 'businessToCustomerSettings', visible: new FormControl(false), template: this.b2cHeaderBackgroundImage },
      { name: 'businessToCustomerSettings.graphicPriceToProducer', section: 'businessToCustomerSettings', visible: new FormControl(false), template: this.b2cPricePaidToProducer },
      { name: 'businessToCustomerSettings.graphicFarmGatePrice', section: 'businessToCustomerSettings', visible: new FormControl(false), template: this.b2cFarmGatePrice },
      { name: 'businessToCustomerSettings.prices', section: 'businessToCustomerSettings', visible: new FormControl(false), template: this.b2cPrices },
      { name: 'businessToCustomerSettings.graphicQuality', section: 'businessToCustomerSettings', visible: new FormControl(false), template: this.b2cGraphicQuality},
    ];
    if (this.action === 'labels') {
      this.b2cElements.push(
          { name: 'businessToCustomerSettings.media', section: 'businessToCustomerSettings', visible: new FormControl(false), template: this.b2cMedia }
      );
    }
  }

  generateDefaultElements() {
    this.generateProductElements();
    this.generateProcessElements();
    this.generateSocialResponsibilityElements();
    this.generateEnvironmentalSustainabilityElements();
    this.generateSettingsElements();
    this.generateCompanyElements();
    this.generateBusinessToCustomerSettingsElements();

    this.generateJointVisibilityForm();
  }

  generateJointVisibilityForm() {
    const allList = [...this.productElements, ...this.processElements, ...this.socialResponsibilityElements,
    ...this.environmentalSustainabilityElements, ...this.settingsElements, ...this.companyElements];
    const formObj = {};
    allList.forEach(element => {
      const fixedKey = element.name.replace(/\./g, '_');
      formObj[fixedKey] = element.visible;
    });
    this.visibilityForm = new FormGroup(formObj);
  }

  generateLabelMaps() {

    const productMap = new Map();
    this.processElements.forEach(el => {
      productMap.set(el.name, el);
    });

    const processMap = new Map();
    this.processElements.forEach(el => {
      processMap.set(el.name, el);
    });

    const socialResponsibilityMap = new Map();
    this.socialResponsibilityElements.forEach(el => {
      socialResponsibilityMap.set(el.name, el);
    });

    const environmentalSustainabilityMap = new Map();
    this.environmentalSustainabilityElements.forEach(el => {
      environmentalSustainabilityMap.set(el.name, el);
    });

    const settingsMap = new Map();
    this.settingsElements.forEach(el => {
      settingsMap.set(el.name, el);
    });

    const companyMap = new Map();
    this.companyElements.forEach(el => {
      companyMap.set(el.name, el);
    });

    this.sectionToNameToObj.set('product', productMap);
    this.sectionToNameToObj.set('process', processMap);
    this.sectionToNameToObj.set('responsibility', socialResponsibilityMap);
    this.sectionToNameToObj.set('sustainability', environmentalSustainabilityMap);
    this.sectionToNameToObj.set('settings', settingsMap);
    this.sectionToNameToObj.set('company', companyMap);
  }

  async createLabel() {

    if (this.changed) {
      this.globalEventsManager.push({
        action: 'error',
        notificationType: 'warning',
        title: $localize`:@@productLabel.createLabel.warning.title:Error`,
        message: $localize`:@@productLabel.createLabel.warning.message:Unsaved data. Please save changes before creating a new label.`
      });
      return;
    }

    if (this.mode === 'create') {
      this.globalEventsManager.push({
        action: 'error',
        notificationType: 'error',
        title: $localize`:@@productLabel.createLabel.error.title:Error`,
        message: $localize`:@@productLabel.createLabel.error.message:Cannot create a label. Please create and save the product first.`
      });
      return;
    }

    this.setLanguageForLabel().then();
  }

  async deleteLabel(labelMessage) {

    const position = labelMessage.position;
    const label = labelMessage.label;

    if (this.changed) {
      this.globalEventsManager.push({
        action: 'error',
        notificationType: 'warning',
        title: $localize`:@@productLabel.deleteLabel.warning.title:Error`,
        message: $localize`:@@productLabel.deleteLabel.warning.message:Unsaved data. Please save changes before deleting the label.`
      });
      return;
    }

    const res = await this.productController.deleteProductLabel(label.id).pipe(take(1)).toPromise();
    if (res && res.status === 'OK') {
      if (label.id === this.currentLabel.id) {
        this.labelSelect$.next({ position, preventEmit: false });
      }
      this.reload();
    }
  }

  prepareProductElements(): any[] {
    const elts = [];
    this.productElements.forEach(elt => elts.push(elt));
    return elts;
  }

  prepareSocialResponsibilityElements(): any[] {
    const elts = [];
    this.socialResponsibilityElements.forEach(elt => elts.push(elt));
    return elts;
  }

  currentLabelFields() {
    const labels = [];
    const allSocialResponsibilityElements = this.prepareSocialResponsibilityElements();
    const allProductElements = this.prepareProductElements();
    const allList = [allProductElements, this.processElements, allSocialResponsibilityElements,
      this.environmentalSustainabilityElements, this.settingsElements, this.companyElements];
    allList.forEach(list => {
      list.forEach(val => {
        if (val.name === 'journeyMarkers') {
          labels.push({
            name: val.name,
            section: val.section,
            visible: true,
          });
        } else {
          labels.push({
            name: val.name,
            section: val.section,
            visible: val.visible.value
          });
        }
      });
    });
    return labels;
  }

  get videoList(): AbstractControl[] {
    return this.mediaForm && this.mediaForm.get('video') ? (this.mediaForm.get('video') as FormArray).controls : [];
  }

  get farmerList(): AbstractControl[] {
    return this.mediaForm && this.mediaForm.get('farmers') ? (this.mediaForm.get('farmers') as FormArray).controls : [];
  }

  get productionRecordList(): AbstractControl[] {
    return this.mediaForm && this.mediaForm.get('productionRecord') ? (this.mediaForm.get('productionRecord') as FormArray).controls : [];
  }

  showImage(storageKey: string) {
    const modalRef = this.modalService.open(ImageViewerComponent, { centered: true });
    Object.assign(modalRef.componentInstance, {
      modal: false,
      fileInfo: {
        storageKey
      },
      chainApi: false
    });
  }

  async initializeByLabel(label: ApiProductLabel) {

    const media = await this.productController.getCompanyDocumentsForProductLabel(label.id).pipe(take(1)).toPromise();
    if (media && media.status === 'OK' && media.data) {
      this.availableMedia = media.data;

      this.mediaForm.setControl('video', new FormArray([], maxActiveArrayControls(1)));
      this.mediaForm.setControl('farmers', new FormArray([]));
      this.mediaForm.setControl('productionRecord', new FormArray([]));

      this.availableMedia.map(value => {
        switch (value.category) {
          case ApiProductLabelCompanyDocument.CategoryEnum.VIDEO:
            (this.mediaForm.get('video') as FormArray).push(generateFormFromMetadata(ApiProductLabelCompanyDocument.formMetadata(), value));
            break;
          case ApiProductLabelCompanyDocument.CategoryEnum.MEETTHEFARMER:
            (this.mediaForm.get('farmers') as FormArray).push(generateFormFromMetadata(ApiProductLabelCompanyDocument.formMetadata(), value));
            break;
          case ApiProductLabelCompanyDocument.CategoryEnum.PRODUCTIONRECORD:
            (this.mediaForm.get('productionRecord') as FormArray).push(generateFormFromMetadata(ApiProductLabelCompanyDocument.formMetadata(), value));
            break;
        }
      });
    }

    if (!this.currentLabel) { this.currentLabel = label; this.labelSelect$.next({ id: this.currentLabel.id, preventEmit: true }); }
    const res = await this.productController.getProductLabelContent(label.id).pipe(take(1)).toPromise();
    if (res && res.status === 'OK' && res.data) {
      this.prepareForm(res.data).then();
    }

    const newFieldMap = new Map();
    const sortOrderMap = new Map();
    let increaseVisible = false;
    this.generateDefaultElements();

    const allList = [...this.productElements, ...this.processElements, ...this.socialResponsibilityElements,
    ...this.environmentalSustainabilityElements, ...this.settingsElements, ...this.companyElements];
    let i = 0;
    allList.forEach(el => {    // default order
      sortOrderMap.set(el.name, i);
      i++;
    });
    i = 0;

    label.fields.forEach(field => {
      if (field.name === 'settings.incomeIncreaseDescription') { increaseVisible = field.visible; }
      newFieldMap.set(field.name, field);
      sortOrderMap.set(field.name, i);
      i++;
    });
    this.productElements.sort((a, b) => sortOrderMap.get(a.name) < sortOrderMap.get(b.name) ? -1 : 1);
    this.processElements.sort((a, b) => sortOrderMap.get(a.name) < sortOrderMap.get(b.name) ? -1 : 1);
    this.socialResponsibilityElements.sort((a, b) => sortOrderMap.get(a.name) < sortOrderMap.get(b.name) ? -1 : 1);
    this.environmentalSustainabilityElements.sort((a, b) => sortOrderMap.get(a.name) < sortOrderMap.get(b.name) ? -1 : 1);
    this.settingsElements.sort((a, b) => sortOrderMap.get(a.name) < sortOrderMap.get(b.name) ? -1 : 1);
    this.companyElements.sort((a, b) => sortOrderMap.get(a.name) < sortOrderMap.get(b.name) ? -1 : 1);
    this.visibilityMap = new Map();
    allList.forEach(el => {    // set visibility forms
      const field = newFieldMap.get(el.name);
      if (field) {
        el.visible.setValue(field.visible);
      } else {
        el.visible.setValue(false);
      }

      if (el.name === 'settings.increaseIncome') { el.visible.setValue(increaseVisible); }
      this.visibilityMap.set(el.name, el.visible);
    });

    this.visibilityForm.markAsPristine();
    this.labelTitleForm.setValue(label.title);
    this.labelTitleForm.markAsPristine();
  }

  toggleEditTitleMode(mode?: boolean) {
    if (mode == null) {
      this.editTitleMode = !this.editTitleMode;
    } else {
      this.editTitleMode = mode;
    }
    if (this.editTitleMode) {
      this.labelTitleInput.focus();
    }
  }

  async togglePublish() {

    if (this.changed) {
      return;
    }

    const successTitlePublished = $localize`:@@productLabel.togglePublish.success.title.published:Published`;
    const successTitleWithdrawn = $localize`:@@productLabel.togglePublish.success.title.withdrawn:Withdrawn`;
    const successMessagePublished = $localize`:@@productLabel.togglePublish.success.message.published:Label has been successfully published.`;
    const successMessageWithdrawn = $localize`:@@productLabel.togglePublish.success.message.withdrawn:Label is not published anymore.`;
    if (!this.currentLabel || !this.currentLabel.status) { return; }
    const toBePublished = this.currentLabel.status === ApiProductLabel.StatusEnum.UNPUBLISHED;
    const action = toBePublished ? 'PUBLISH_LABEL' : 'UNPUBLISH_LABEL';
    const res = await this.productController.executeProductAction(action as any, this.currentLabel).pipe(take(1)).toPromise();
    if (res && res.status === 'OK') {
      this.reloadLabel();
      this.reloadLabels(); // this is needed for label-card updating (maybe there is a better way of doing)
      this.globalEventsManager.push({
        action: 'success',
        notificationType: 'success',
        title: toBePublished ? successTitlePublished : successTitleWithdrawn,
        message: toBePublished ? successMessagePublished : successMessageWithdrawn
      });
    } else {
      this.globalEventsManager.push({
        action: 'error',
        notificationType: 'error',
        title: $localize`:@@productLabel.togglePublish.error.title:Error`,
        message: $localize`:@@productLabel.togglePublish.error.message:Operation cannot be executed. Please try again.`
      });
    }
  }

  async deleteCurrentProduct() {
    if (this.changed) { return; }
    const productId = Number(this.pId);
    const result = await this.globalEventsManager.openMessageModal({
      type: 'warning',
      message: $localize`:@@productLabel.deleteCurrentProduct.warning.message:Are you sure you want to delete the product? This will delete all labels and batches attached to the product as well!`,
      options: { centered: true },
      dismissable: false
    });
    if (result !== 'ok') { return; }
    const res = await this.productController.deleteProduct(productId).pipe(take(1)).toPromise();
    if (res && res.status === 'OK') {
      this.globalEventsManager.push({
        action: 'success',
        notificationType: 'success',
        title: $localize`:@@productLabel.deleteCurrentProduct.success.title:Deleted`,
        message: $localize`:@@productLabel.deleteCurrentProduct.success.message:Product was successfuly deleted`
      });
      this.router.navigate(['/product-labels']);
      return;
    }
    this.globalEventsManager.push({
      action: 'error',
      notificationType: 'error',
      title: $localize`:@@productLabel.deleteCurrentProduct.error.title:Error`,
      message: $localize`:@@productLabel.deleteCurrentProduct.error.message:Product cannot be deleted. Please try again.`
    });
  }

  fadeInProductOnRefresh() {
    this.fadeInProduct = true;
    setTimeout(() => {
      this.fadeInProduct = false;
    }, 500);
  }

  batches() {
    if (!this.currentLabel) { return; }
    if (this.changed) { return; }
    const productId = this.route.snapshot.params.id;
    const labelId = this.currentLabel.id;
    this.router.navigate(['/product-labels', productId, 'labels', labelId, 'batches']).then();
  }

  statistics() {
    if (!this.currentLabel) { return; }
    if (this.changed) { return; }
    const productId = this.route.snapshot.params.id;
    const labelId = this.currentLabel.id;
    this.router.navigate(['/product-labels', productId, 'labels', labelId, 'statistics']).then();
  }

  viewLabel() {
    if (this.changed) { return; }
    if (this.currentLabel) {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(['/p-cd', this.currentLabel.uuid, 'EMPTY'])
      );
      if (this.productForm.value && this.productForm.value.settings && this.productForm.value.settings.language) {
        window.open(this.productForm.value.settings.language.toLowerCase() + url, '_blank');
      } else {
        window.open(url, '_blank');
      }
    }
  }

  downloadInstructions() {
    if (this.changed) { return; }
    if (this.currentLabel) {
      const sub = this.productController.getProductLabelInstructions(this.currentLabel.id).subscribe(
        blob => {
          const a = document.createElement('a');
          const blobURL = URL.createObjectURL(blob);
          a.download = this.downloadFileName;
          a.href = blobURL;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        },
        () => {
          this.globalEventsManager.push({
            action: 'error',
            notificationType: 'error',
            title: $localize`:@@productLabel.downloadInstructions.error.title:Error`,
            message: $localize`:@@productLabel.downloadInstructions.error.message:PDF cannot be generated. Please try again.`
          });
        }
      );
      this.unsubscribeList.add(sub);
    }
  }

  feedbacks() {
    if (!this.currentLabel) { return; }
    if (this.changed) { return; }
    const productId = this.route.snapshot.params.id;
    const labelId = this.currentLabel.id;
    this.router.navigate(['/product-labels', productId, 'labels', labelId, 'feedback'], {state: {data: this.currentLabel.uuid}}).then();
   }

  async prefillFromOther(fromSocialResp: boolean) {
    const modalRef = this.modalService.open(PrefillProductSelectionModalComponent, { centered: true });
    Object.assign(modalRef.componentInstance, {
      title: $localize`:@@productLabel.prefillFromOther.title:Products`,
      instructionsHtmlProduct: $localize`:@@productLabel.prefillFromOther.instructionsHtmlProduct:Select a product`,
      skipItemId: this.productForm.get('id').value
    });
    const product = await modalRef.result;
    if (product) {
      this.productController.getProduct(product.id).pipe(take(1))
        .subscribe(resp => {
          if (resp.status === 'OK') {
            this.prefillFields(fromSocialResp, resp.data);
          }
        }
        );
    }
  }

  prefillFields(fromSocialResp: boolean, data: any) {
    if (fromSocialResp) {
      if (data.responsibility.laborPolicies) {
        this.productForm.get('responsibility.laborPolicies').setValue(data.responsibility.laborPolicies);
      }
    } else {
      if (data.sustainability.production) {
        this.productForm.get('sustainability.production').setValue(data.sustainability.production);
      }
      if (data.sustainability.packaging) {
        this.productForm.get('sustainability.packaging').setValue(data.sustainability.packaging);
      }
      if (data.sustainability.co2Footprint) {
        this.productForm.get('sustainability.co2Footprint').setValue(data.sustainability.co2Footprint);
      }
    }
    this.productForm.markAsDirty();
  }

  checkExternalLink(link: string): string {
    if (!link) { return '#'; }
    if (!link.startsWith('https://') && !link.startsWith('http://')) {
      return 'http://' + link;
    }
    return link;
  }

  async initializeLabelsHelperLink() {
    const resp = await this.commonController.getGlobalSettings(this.globalEventsManager.globalSettingsKeys('PRODUCT_LABELS_HELPER_LINK')).pipe(take(1)).toPromise();
    if (resp && resp.data && resp.data.value) { this.editInfoLabelLink = resp.data.value; }
  }

  productNameLabelAndPlaceholder(type, field) {
    if (this.currentLabel) {
      if (type === 'LABEL' && field === 'name') { return $localize`:@@productLabel.label.textinput.label.name:Label name`; }
      if (type === 'LABEL' && field === 'photo') { return $localize`:@@productLabel.label.textinput.label.photo:Label photo`; }
      if (type === 'LABEL' && field === 'description') { return $localize`:@@productLabel.label.textinput.label.description:Label description`; }
      if (type === 'PLACEHOLDER' && field === 'name') { return $localize`:@@productLabel.label.textinput.placeholder.name:Enter label name`; }

    } else {
      if (type === 'LABEL' && field === 'name') { return $localize`:@@productLabel.product.textinput.label.name:Product name`; }
      if (type === 'LABEL' && field === 'photo') { return $localize`:@@productLabel.product.textinput.label.photo:Product photo`; }
      if (type === 'LABEL' && field === 'description') { return $localize`:@@productLabel.product.textinput.label.description:Product description`; }
      if (type === 'PLACEHOLDER' && field === 'name') { return $localize`:@@productLabel.product.textinput.placeholder.name:Enter product name`; }
    }
  }

  async setLanguageForLabel() {

    const modalRef = this.modalService.open(LanguageForLabelModalComponent, { centered: true });
    Object.assign(modalRef.componentInstance, {
      title: $localize`:@@productLabel.newLabelModal.title:Create new label`
    });

    const modalResult: LanguageForLabelModalResult = await modalRef.result;
    if (modalResult) {

      const labels = this.currentLabelFields();
      const productId = this.pId;
      const res = await this.productController.createProductLabel(
        {
          productId,
          title: modalResult.title,
          language: modalResult.lang,
          fields: labels
        }
      ).pipe(take(1)).toPromise();

      if (res && res.status === 'OK') {
        const resp = await this.productController.getProductLabelContent(res.data.id).pipe(take(1)).toPromise();
        if (resp && resp.status === 'OK' && resp.data) {
          if (modalResult.lang !== 'EN') {
            const data = resp.data;
            data.settings.language = modalResult.lang;
            data['labelId'] = res.data.id;
            delete data['id'];
            const resC = await this.productController.updateProductLabelContent(data as ApiProductLabelContent).pipe(take(1)).toPromise();
            if (resC && resC.status === 'OK') {
              this.fadeInProductOnRefresh();
              this.labelSelect$.next({ id: res.data.id, preventEmit: false });
              this.reload();
            }
          } else {
            this.fadeInProductOnRefresh();
            this.labelSelect$.next({ id: res.data.id, preventEmit: false });
            this.reload();
          }
        }
      }
    }
  }

  canEdit() {
    return this.isOwner;
  }

  public get journeyMarkersCtrl(): FormArray {
    return this.productForm.get('journeyMarkers') as FormArray;
  }
}
