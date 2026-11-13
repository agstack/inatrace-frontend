import { Component, OnInit, Input, Output, EventEmitter, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { GlobalEventManagerService } from '../../core/global-event-manager.service';
import { UntypedFormControl } from '@angular/forms';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { startWith, debounceTime, tap, switchMap, map, shareReplay, take } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { TypeDetailModalComponent } from '../type-detail-modal/type-detail-modal.component';
import { NgbModalImproved } from '../../core/ngb-modal-improved/ngb-modal-improved.service';
import { environment } from 'src/environments/environment';
import { FacilityTypeControllerService } from '../../../api/api/facilityTypeController.service';
import { MeasureUnitTypeControllerService } from '../../../api/api/measureUnitTypeController.service';
import { ProcessingEvidenceTypeControllerService } from '../../../api/api/processingEvidenceTypeController.service';
import { SortOption } from '../../shared/result-sorter/result-sorter-types';
import { SemiProductControllerService } from '../../../api/api/semiProductController.service';
import { ProcessingEvidenceFieldControllerService } from '../../../api/api/processingEvidenceFieldController.service';
import { ProductTypeControllerService } from '../../../api/api/productTypeController.service';
import { AuthService } from '../../core/auth.service';

@Component({
    selector: 'app-type-list',
    templateUrl: './type-list.component.html',
    styleUrls: ['./type-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class TypeListComponent implements OnInit, OnChanges {

  constructor(
    private facilityTypeService: FacilityTypeControllerService,
    private measureUnitTypeService: MeasureUnitTypeControllerService,
    private processingEvidenceTypeService: ProcessingEvidenceTypeControllerService,
    private processingEvidenceFieldService: ProcessingEvidenceFieldControllerService,
    private semiProductsService: SemiProductControllerService,
    private productTypesService: ProductTypeControllerService,
    private route: ActivatedRoute,
    private modalService: NgbModalImproved,
    protected globalEventsManager: GlobalEventManagerService,
    private authService: AuthService
  ) { }

  @Input()
  type;

  @Input()
  parentReload: boolean;

  @Output()
  showing = new EventEmitter<number>();

  @Output()
  countAll = new EventEmitter<number>();

  searchName = new UntypedFormControl(null);
  reloadPingList$ = new BehaviorSubject<boolean>(false);

  pagingParams$ = new BehaviorSubject({});
  sortingParams$ = new BehaviorSubject({ sortBy: 'name', sort: 'ASC' });
  paging$ = new BehaviorSubject<number>(1);
  page = 1;
  pageSize = 10;

  showed = 0;
  all = 0;

  title = '';

  searchParams$ = combineLatest(
    this.searchName.valueChanges.pipe(
      startWith(null),
      debounceTime(200)
    ),
    (query: string) => {
      return { query };
    }
  );

  types$ = combineLatest(this.reloadPingList$, this.paging$, this.searchParams$, this.sortingParams$,
      (ping: boolean, page: number, search: any, sorting: any) => {
        return {
          ...search,
          ...sorting,
          offset: (page - 1) * this.pageSize,
          limit: this.pageSize
        };
      }).pipe(
      tap(() => this.globalEventsManager.showLoading(true)),
      switchMap(params => {
        return this.apiLink(params);
      }),
      map((resp) => {
        if (resp) {
          this.showed = 0;
          if (resp.data && resp.data.count && (this.pageSize - resp.data.count > 0)) { this.showed = resp.data.count; }
          else if (resp.data && resp.data.count && (this.pageSize - resp.data.count <= 0)) {
            const temp = resp.data.count - (this.pageSize * (this.page - 1));
            this.showed = temp >= this.pageSize ? this.pageSize : temp;
          }
          this.showing.emit(this.showed);
          return resp.data;
        }
      }),
      tap(() => this.globalEventsManager.showLoading(false)),
      shareReplay(1)
  );

  sortOptions: SortOption[] = [
    {
      key: 'id',
      name: $localize`:@@settingsTypes.sortOptions.id.name:Id`,
      inactive: true
    },
    {
      key: 'label',
      name: $localize`:@@settingsTypes.sortOptions.label.name:Label`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'actions',
      name: $localize`:@@settingsTypes.sortOptions.actions.name:Actions`,
      inactive: true
    },
  ];

  sortOptionsFPQ: SortOption[] = [
    {
      key: 'id',
      name: $localize`:@@settingsTypes.sortOptions.id.name:Id`,
      inactive: true
    },
    {
      key: 'label',
      name: $localize`:@@settingsTypes.sortOptions.label.name:Label`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'type',
      name: $localize`:@@settingsTypes.sortOptions.label.type:Type`,
      inactive: true
    },
    {
      key: 'fairness',
      name: $localize`:@@settingsTypes.sortOptions.fairness.name:Fairness`,
      inactive: true
    },
    {
      key: 'provenance',
      name: $localize`:@@settingsTypes.sortOptions.provenance.name:Provenance`,
      inactive: true
    },
    {
      key: 'quality',
      name: $localize`:@@settingsTypes.sortOptions.quality.name:Quality`,
      inactive: true
    },
    {
      key: 'actions',
      name: $localize`:@@settingsTypes.sortOptions.actions.name:Actions`,
      inactive: true
    },
  ];

  sortOptionsEvidenceFields: SortOption[] = [
    {
      key: 'fieldName',
      name: $localize`:@@procEvidenceField.fieldName.label:Field name`,
      inactive: true
    },
    {
      key: 'label',
      name: $localize`:@@settingsTypes.sortOptions.label.name:Label`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'type',
      name: $localize`:@@settingsTypes.sortOptions.label.type:Type`,
      inactive: true
    },
    {
      key: 'actions',
      name: $localize`:@@settingsTypes.sortOptions.actions.name:Actions`,
      inactive: true
    },
  ];

  sortOptionsSemiProducts: SortOption[] = [
    {
      key: 'name',
      name: $localize`:@@settingsTypes.sortOptions.semiProducts.name:Name`
    },
    {
      key: 'description',
      name: $localize`:@@settingsTypes.sortOptions.semiProducts.description:Description`
    },
    {
      key: 'buyable',
      name: $localize`:@@settingsTypes.sortOptions.semiProducts.buyable:Buyable`,
      inactive: true
    },
    {
      key: 'sku',
      name: $localize`:@@settingsTypes.sortOptions.semiProducts.sku:SKU`,
      inactive: true
    },
    {
      key: 'skuendCustomer',
      name: $localize`:@@settingsTypes.sortOptions.semiProducts.skuendCustomer:SKU end customer`,
      inactive: true
    },
    {
      key: 'actions',
      name: $localize`:@@settingsTypes.sortOptions.actions.name:Actions`,
      inactive: true
    }
  ];

  sortOptionsProductTypes: SortOption[] = [
    {
      key: 'code',
      name: $localize`:@@settingsTypes.sortOptions.productTypes.code:Code`
    },
    {
      key: 'name',
      name: $localize`:@@settingsTypes.sortOptions.productTypes.name:Name`
    },
    {
      key: 'description',
      name: $localize`:@@settingsTypes.sortOptions.productTypes.description:Description`
    },
    {
      key: 'actions',
      name: $localize`:@@settingsTypes.sortOptions.actions.name:Actions`,
      inactive: true
    }
  ];

  isRegionalAdmin = false;

  ngOnInit(): void {

    this.authService.userProfile$.pipe(take(1)).subscribe(up => {
      this.isRegionalAdmin = up?.role === 'REGIONAL_ADMIN';
    });

    this.setAll().then();
    if (this.type === 'facility-types') { this.title = $localize`:@@settingsTypes.typeList.title.facility:Facility types`; }
    if (this.type === 'measurement-unit-types') { this.title = $localize`:@@settingsTypes.typeList.title.measurement:Measurement unit types`; }
    if (this.type === 'action-types') { this.title = $localize`:@@settingsTypes.typeList.title.actions:Action types`; }
    if (this.type === 'processing-evidence-types') { this.title = $localize`:@@settingsTypes.typeList.title.processingEvidenceTypes:Processing evidence types`; }
    if (this.type === 'processing-evidence-fields') { this.title = $localize`:@@settingsTypes.typeList.title.processingEvidenceFields:Processing evidence fields`; }
    if (this.type === 'semi-products') { this.title = $localize`:@@settingsTypes.typeList.title.semiProducts:Semi-products`; }
    if (this.type === 'product-types') { this.title = $localize`:@@settingsTypes.typeList.title.productTypes:Product types`; }
  }

  ngOnChanges() {
    this.reloadPage();
  }

  onPageChange(event) {
    this.paging$.next(event);
  }

  reloadPage(delay = true) {
    if (delay) {
      setTimeout(() => {
        this.setAll().then();
        this.reloadPingList$.next(true);
      }, environment.reloadDelay);
    } else {
      this.setAll().then();
      this.reloadPingList$.next(true);
    }
  }

  changeSort(event) {
    this.sortingParams$.next({ sortBy: event.key, sort: event.sortOrder });
  }

  apiLink(params) {
    if (this.type === 'facility-types') {
      return this.facilityTypeService.getFacilityTypeListByMap({ ...params });
    }
    if (this.type === 'measurement-unit-types') {
      return this.measureUnitTypeService.getMeasureUnitTypeListByMap({ ...params });
    }
    if (this.type === 'processing-evidence-types') {
      return this.processingEvidenceTypeService.getProcessingEvidenceTypeListByMap({ ...params });
    }
    if (this.type === 'processing-evidence-fields') {
      return this.processingEvidenceFieldService.getProcessingEvidenceFieldListByMap({ ...params });
    }
    if (this.type === 'semi-products') {
      return this.semiProductsService.getSemiProductListByMap({ ...params });
    }
    if (this.type === 'product-types') {
      return this.productTypesService.getProductTypesByMap({ ...params });
    }
  }

  edit(type) {
    let editTitle = '';
    if (this.type === 'facility-types') {
      editTitle = $localize`:@@settingsTypes.editFacilityType.editTitle:Edit facility type`;
    }
    if (this.type === 'measurement-unit-types') {
      editTitle = $localize`:@@settingsTypes.editMeasurementUnitType.editTitle:Edit measurement unit type`;
    }
    if (this.type === 'action-types') {
      editTitle = $localize`:@@settingsTypes.editActionType.editTitle:Edit action type`;
    }
    if (this.type === 'processing-evidence-types') {
      editTitle = $localize`:@@settingsTypes.editProcessingEvidenceType.editTitle:Edit processing evidence type`;
    }
    if (this.type === 'processing-evidence-fields') {
      editTitle = $localize`:@@settingsTypes.editProcessingEvidenceField.editTitle:Edit processing evidence field`;
    }
    if (this.type === 'semi-products') {
      editTitle = $localize`:@@settingsTypes.editSemiProduct.editTitle:Edit semi-product`;
    }
    if (this.type === 'product-types') {
      editTitle = $localize`:@@settingsTypes.editProductType.editTitle:Edit product type`;
    }

    this.modalService.open(TypeDetailModalComponent, {
      centered: true
    }, {
      update: true,
      title: editTitle,
      type: this.type,
      typeElement: type,
      saveCallback: () => {
        this.reloadPage();
      }
    });
  }

  async delete(type) {

    // fallback if type.label not available
    const label = type.label ? type.label : type.name;

    const result = await this.globalEventsManager.openMessageModal({
      type: 'warning',
      message: $localize`:@@settingsTypes.remove.warning.message:Are you sure you want to remove ${ label }?`,
      options: { centered: true },
      dismissable: false
    });
    if (result !== 'ok') { return; }

    try {
      this.globalEventsManager.showLoading(true);
      if (this.type === 'facility-types') {
        const res = await this.facilityTypeService.deleteFacilityType(type.id).pipe(take(1)).toPromise();
        if (res && res.status === 'OK') {
          this.reloadPage();
        }
      }
      if (this.type === 'measurement-unit-types') {
        const res = await this.measureUnitTypeService.deleteMeasurementUnitType(type.id).pipe(take(1)).toPromise();
        if (res && res.status === 'OK') {
          this.reloadPage();
        }
      }
      if (this.type === 'processing-evidence-types') {
        const res = await this.processingEvidenceTypeService.deleteProcessingEvidenceType(type.id).pipe(take(1)).toPromise();
        if (res && res.status === 'OK') {
          this.reloadPage();
        }
      }
      if (this.type === 'processing-evidence-fields') {
        const res = await this.processingEvidenceFieldService.deleteProcessingEvidenceField(type.id).pipe(take(1)).toPromise();
        if (res && res.status === 'OK') {
          this.reloadPage();
        }
      }
      if (this.type === 'semi-products') {
        const res = await this.semiProductsService.deleteSemiProduct(type.id).pipe(take(1)).toPromise();
        if (res && res.status === 'OK') {
          this.reloadPage();
        }
      }
    } catch (e) {
    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  showPagination() {
    return ((this.showed - this.pageSize) === 0 && this.all >= this.pageSize) || this.page > 1;
  }

  async setAll() {

    if (this.type === 'facility-types') {
      const res = await this.facilityTypeService.getFacilityTypeList().pipe(take(1)).toPromise();
      if (res && res.status === 'OK' && res.data && res.data.count >= 0) {
        this.all = res.data.count;
        this.countAll.emit(res.data.count);
      }
    }
    if (this.type === 'measurement-unit-types') {
      const res = await this.measureUnitTypeService.getMeasureUnitTypeList().pipe(take(1)).toPromise();
      if (res && res.status === 'OK' && res.data && res.data.count >= 0) {
        this.all = res.data.count;
        this.countAll.emit(res.data.count);
      }
    }
    if (this.type === 'processing-evidence-types') {
      const res = await this.processingEvidenceTypeService.getProcessingEvidenceTypeList().pipe(take(1)).toPromise();
      if (res && res.status === 'OK' && res.data && res.data.count >= 0) {
        this.all = res.data.count;
        this.countAll.emit(res.data.count);
      }
    }
    if (this.type === 'processing-evidence-fields') {
      const res = await this.processingEvidenceFieldService.getProcessingEvidenceFieldList().pipe(take(1)).toPromise();
      if (res && res.status === 'OK' && res.data && res.data.count >= 0) {
        this.all = res.data.count;
        this.countAll.emit(res.data.count);
      }
    }
    if (this.type === 'semi-products') {
      const res = await this.semiProductsService.getSemiProductList().pipe(take(1)).toPromise();
      if (res && res.status === 'OK' && res.data && res.data.count >= 0) {
        this.all = res.data.count;
        this.countAll.emit(res.data.count);
      }
    }
    if (this.type === 'product-types') {
      const res = await this.productTypesService.getProductTypes().pipe(take(1)).toPromise();
      if (res && res.status === 'OK' && res.data && res.data.count >= 0) {
        this.all = res.data.count;
        this.countAll.emit(res.data.count);
      }
    }
  }

  getBooleanSign(value: boolean) {
    if (value) { return '✓'; }
    return null;
  }

}
