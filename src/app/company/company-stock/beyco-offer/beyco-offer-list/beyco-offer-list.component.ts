import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ValidatorFn, Validators} from '@angular/forms';
import {ApiBeycoCoffeeVariety} from '../../../../../api/model/apiBeycoCoffeeVariety';
import {ApiBeycoCoffeeQuality} from '../../../../../api/model/apiBeycoCoffeeQuality';
import {ApiBeycoCoffeeGrade} from '../../../../../api/model/apiBeycoCoffeeGrade';
import {ApiBeycoCoffeeCertificate} from '../../../../../api/model/apiBeycoCoffeeCertificate';
import {ApiBeycoOrderCoffees} from '../../../../../api/model/apiBeycoOrderCoffees';
import {ApiBeycoCoffee} from '../../../../../api/model/apiBeycoCoffee';
import {ApiBeycoOrderFields} from '../../../../../api/model/apiBeycoOrderFields';
import {BeycoOrderControllerService} from '../../../../../api/api/beycoOrderController.service';
import {ActivatedRoute, Router} from '@angular/router';
import {ApiBeycoPortOfExport} from '../../../../../api/model/apiBeycoPortOfExport';
import {GlobalEventManagerService} from '../../../../core/global-event-manager.service';
import {BeycoTokenService} from '../../../../shared-services/beyco-token.service';
import {Subscription} from 'rxjs';
import { SelectedUserCompanyService } from '../../../../core/selected-user-company.service';
import { switchMap } from 'rxjs/operators';
import { getBeycoOfferErrorMessage } from './beyco-offer-error';

@Component({
  selector: 'app-beyco-offer-list',
  templateUrl: './beyco-offer-list.component.html',
  styleUrls: ['./beyco-offer-list.component.scss']
})
export class BeycoOfferListComponent implements OnInit, OnDestroy {

  subscriptions: Subscription[] = [];

  generalForm: FormGroup;
  coffeeInfoForms: FormGroup[] = [];

  private companyId = null;

  readonly Variety = ApiBeycoCoffeeVariety.TypeEnum;
  readonly QualitySegment = ApiBeycoCoffeeQuality.TypeEnum;
  readonly Grade = ApiBeycoCoffeeGrade.TypeEnum;
  readonly Certificate = ApiBeycoCoffeeCertificate.TypeEnum;
  readonly Currency = ApiBeycoOrderCoffees.CurrencyEnum;
  readonly PriceUnit = ApiBeycoOrderCoffees.PriceUnitEnum;
  readonly Process = ApiBeycoCoffee.ProcessEnum;
  readonly Species = ApiBeycoCoffee.SpeciesEnum;
  readonly Incoterms = ApiBeycoOrderCoffees.IncotermsEnum;

  constructor(
    private fb: FormBuilder,
    private beycoOrderService: BeycoOrderControllerService,
    private route: ActivatedRoute,
    private router: Router,
    private globalEventManager: GlobalEventManagerService,
    private beycoTokenService: BeycoTokenService,
    private selUserCompanyService: SelectedUserCompanyService
  ) { }

  ngOnInit(): void {

    this.subscriptions.push(

      this.selUserCompanyService.selectedCompanyProfile$
        .pipe(
          switchMap(cp => {
            if (cp) {
              this.companyId = cp.id;
              return this.route.queryParams;
            }
          })
        )
        .subscribe(query => {

          if (!this.beycoTokenService.beycoToken || !query || !query['id']) {
            this.router.navigate(['my-stock', 'all-stock', 'tab']).then();
            return;
          }

          this.globalEventManager.showLoading(true);
          this.beycoOrderService.getBeycoOrderFieldsForSelectedStockOrders([query['id']], this.companyId)
            .subscribe(
              res => {
                this.generalForm = this.buildGeneralForm(res.data);
                for (const coffeeOrder of res.data.offerCoffees) {
                  const coffeeForm = this.buildCoffeeInfoForm(coffeeOrder);
                  this.subscriptions.push(
                    coffeeForm.get('cuppingScore').valueChanges.subscribe((cuppingScore) => this.isSpecialityCoffee(cuppingScore, coffeeForm)),
                    coffeeForm.get('varieties').valueChanges.subscribe(() => this.resetValidatorOnCustomVariety(coffeeForm)),
                    coffeeForm.get('grades').valueChanges.subscribe(() => this.resetValidatorOnQualityDescription(coffeeForm)),
                    coffeeForm.get('incoterms').valueChanges.subscribe(() => this.resetValidatorOnCustomIncoterms(coffeeForm))
                  );
                  this.coffeeInfoForms.push(coffeeForm);
                }
              },
              () => this.router.navigate(['my-stock', 'all-stock', 'tab']),
              () => this.globalEventManager.showLoading(false)
            );
        })
    );
  }

  ngOnDestroy() {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }

  fc(form: FormGroup, fieldName: string): FormControl {
    return form.get(fieldName) as FormControl;
  }

  submit() {

    let isInvalid = false;
    this.generalForm.markAllAsTouched();
    if (this.generalForm.invalid) { isInvalid = true; }
    for (const form of this.coffeeInfoForms) {
      form.markAllAsTouched();
      if (form.invalid) { isInvalid = true; }
    }

    if (isInvalid) {
      this.globalEventManager.push({
        action: 'error',
        notificationType: 'error',
        title: $localize`:@@beycoOrderList.notification.invalidFields.title:Invalidated fields`,
        message: $localize`:@@beycoOrderList.notification.invalidFields.message:Please, check fields!`
      });
      return;
    }

    this.globalEventManager.showLoading(true);
    this.beycoOrderService.sendBeycoOrder(this.beycoTokenService.beycoToken.accessToken, this.companyId, this.buildApiBeycoOrderFields())
        .subscribe(
            () => {
              this.globalEventManager.push({
                action: 'success',
                notificationType: 'success',
                title: $localize`:@@beycoOrderList.notification.successfulOrder.title:Beyco order created`,
                message: $localize`:@@beycoOrderList.notification.successfulOrder.message:You successfuly created Beyco order!`
              });
              this.router.navigate(['my-stock', 'all-stock', 'tab']).then();
            },
            (error) => {
              this.globalEventManager.push({
                action: 'error',
                notificationType: 'error',
                title: $localize`:@@beycoOrderList.notification.unsuccessfulOrder.title:Beyco order unsuccessful`,
                message: getBeycoOfferErrorMessage(error.error)
              });
            },
            () => this.globalEventManager.showLoading(false)
        );
  }

  buildGeneralForm(fieldValues: ApiBeycoOrderFields): FormGroup {
    return this.fb.group({
      title: [fieldValues?.title, [Validators.required, Validators.maxLength(70)]],
      availableAt: [fieldValues?.availableAt, Validators.required],
      address: [fieldValues?.portOfExport.address, Validators.required],
      country: [fieldValues?.portOfExport.country, Validators.required],
      latitude: [fieldValues?.portOfExport.latitude, Validators.required],
      longitude: [fieldValues?.portOfExport.longitude, Validators.required]
    });
  }

  buildCoffeeInfoForm(coffee: ApiBeycoOrderCoffees): FormGroup {
    return this.fb.group({
      title: [coffee?.coffee.name, { disabled: true }],
      name: [coffee?.coffee.name, Validators.required],
      quantity: [coffee?.coffee.quantity, [Validators.required, Validators.min(0), Validators.max(999999999999999999)]],
      price: [coffee?.price, [Validators.required, Validators.min(0), Validators.max(999999999999999999)]],
      priceUnit: [coffee?.priceUnit, Validators.required],
      currency: [coffee?.currency, Validators.required],
      harvestAt: [coffee?.coffee.harvestAt, Validators.required],
      region: [coffee?.coffee.region],
      country: [coffee?.coffee.country, Validators.required],
      incoterms: [coffee?.incoterms, Validators.required],
      customIncoterms: [coffee?.customIncoterms],
      species: [coffee?.coffee.species, Validators.required],
      process: [coffee?.coffee.process],
      minScreenSize: [
        coffee?.coffee.minScreenSize,
        [Validators.required, Validators.min(8), Validators.max(20)]
      ],
      maxScreenSize: [
        coffee?.coffee.maxScreenSize,
        [Validators.required, Validators.min(8), Validators.max(20)]
      ],
      cuppingScore: [
        coffee?.coffee.cuppingScore,
        [Validators.required, Validators.min(60), Validators.max(100)]
      ],
      varieties: [coffee?.coffee.varieties?.map(v => v.type), Validators.required],
      customVariety: [coffee?.coffee.varieties?.find(v => v.type === ApiBeycoCoffeeVariety.TypeEnum.Other)?.customVariety],
      qualitySegments: [coffee?.coffee.qualitySegments?.map(v => v.type), Validators.required],
      grades: [coffee?.coffee.grades?.map(v => v.type), Validators.required],
      additionalQualityDescriptors: [coffee?.coffee.additionalQualityDescriptors],
      certificates: [coffee?.coffee.certificates?.map(v => v.type)]
    }, { validators: this.validateScreenSizes });
  }

  buildApiBeycoOrderFields(): ApiBeycoOrderFields {
    const apiObj: ApiBeycoOrderFields = {};
    apiObj.title = this.generalForm.get('title').value;
    apiObj.availableAt = this.generalForm.get('availableAt').value;
    apiObj.portOfExport = {
      address: this.generalForm.get('address').value,
      country: this.generalForm.get('country').value,
      longitude: this.generalForm.get('longitude').value,
      latitude: this.generalForm.get('latitude').value
    } as ApiBeycoPortOfExport;
    apiObj.offerCoffees = [];

    for (const form of this.coffeeInfoForms) {
      const apiCoffee: ApiBeycoOrderCoffees = {};
      apiCoffee.currency = form.get('currency').value;
      apiCoffee.price = Number(form.get('price').value);
      apiCoffee.priceUnit = form.get('priceUnit').value;
      apiCoffee.incoterms = form.get('incoterms').value;
      apiCoffee.customIncoterms = form.get('incoterms').value === 'Other' ? form.get('customIncoterms').value : null;
      apiCoffee.coffee = {
        certificates: form.get('certificates').value?.map(c => ({ type: c }) as ApiBeycoCoffeeCertificate),
        grades: form.get('grades').value?.map(g => ({ type: g }) as ApiBeycoCoffeeGrade),
        additionalQualityDescriptors: form.get('grades').value?.includes('Other') ? form.get('additionalQualityDescriptors').value : null,
        qualitySegments: form.get('qualitySegments').value?.map(q => ({ type: q }) as ApiBeycoCoffeeQuality),
        varieties: form.get('varieties').value?.map(v => ({
          type: v,
          customVariety: v === ApiBeycoCoffeeGrade.TypeEnum.Other ? form.get('customVariety').value : null
        }) as ApiBeycoCoffeeVariety),
        name: form.get('name').value,
        cuppingScore: Number(form.get('cuppingScore').value),
        maxScreenSize: Number(form.get('maxScreenSize').value),
        minScreenSize: Number(form.get('minScreenSize').value),
        process: form.get('process').value,
        species: form.get('species').value,
        country: form.get('country').value,
        region: form.get('region').value,
        harvestAt: form.get('harvestAt').value,
        quantity: Number(form.get('quantity').value)
      } as ApiBeycoCoffee;
      apiObj.offerCoffees.push(apiCoffee);
    }

    return apiObj;
  }

  isSpecialityCoffee(value: number, form: FormGroup) {
    if (value >= 80) {
      const qualitySegmentsControl = form.get('qualitySegments');
      if (!qualitySegmentsControl.value) {
        qualitySegmentsControl.setValue(['Specialty']);
      }
      else if (!qualitySegmentsControl.value.includes('Specialty')) {
        qualitySegmentsControl.value.push('Specialty');
        qualitySegmentsControl.setValue(qualitySegmentsControl.value);
      }
    }
  }

  validateScreenSizes: ValidatorFn = (form: FormGroup) => {
    const minScreenSize = form.get('minScreenSize').value;
    const maxScreenSize = form.get('maxScreenSize').value;

    if (minScreenSize && maxScreenSize && minScreenSize !== '' &&
        maxScreenSize !== '' && Number(minScreenSize) > Number(maxScreenSize)) {
      return { minIsMax: true };
    }
    return null;
  }

  titleCaseToSpacedString(x: any): string {
    if (x == null) {
      return x;
    }
    return x.value.split(/(?=[A-Z])|(\d+)/).join(' ');
  }

  toUpperCase(x: any): string {
    if (x == null) {
      return x;
    }
    return x.value.toUpperCase();
  }

  formatGrades(x: any): string {
    if (x == null) {
      return x;
    }
    return x.value.split(/(?=[A-Z])|(\d+)/).join(' ').toUpperCase();
  }

  resetValidatorOnCustomVariety(coffeeForm: FormGroup) {
    if (coffeeForm.get('varieties').value?.includes('Other')) {
      coffeeForm.get('customVariety').setValidators(Validators.required);
    } else {
      coffeeForm.get('customVariety').clearValidators();
    }
    coffeeForm.get('customVariety').updateValueAndValidity();
  }

  resetValidatorOnQualityDescription(coffeeForm: FormGroup) {
    if (coffeeForm.get('grades').value?.includes('Other')) {
      coffeeForm.get('additionalQualityDescriptors').setValidators(Validators.required);
    } else {
      coffeeForm.get('additionalQualityDescriptors').clearValidators();
    }
    coffeeForm.get('additionalQualityDescriptors').updateValueAndValidity();
  }

  resetValidatorOnCustomIncoterms(coffeeForm: FormGroup) {
    if (coffeeForm.get('incoterms').value === 'Other') {
      coffeeForm.get('customIncoterms').setValidators(Validators.required);
    } else {
      coffeeForm.get('customIncoterms').clearValidators();
    }
    coffeeForm.get('customIncoterms').updateValueAndValidity();
  }

}
