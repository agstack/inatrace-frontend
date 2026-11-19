import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CompanyDetailTabManagerComponent } from '../company-detail-tab-manager/company-detail-tab-manager.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FacilityControllerService } from '../../../../api/api/facilityController.service';
import { shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { ApiFacilityLocation } from '../../../../api/model/apiFacilityLocation';
import { GoogleMap, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';
import { ApiPaginatedResponseApiFacility } from '../../../../api/model/apiPaginatedResponseApiFacility';
import { ApiPaginatedListApiFacility } from '../../../../api/model/apiPaginatedListApiFacility';
import { AuthService } from '../../../core/auth.service';
import { SortOption } from '../../../shared/result-sorter/result-sorter-types';
import { CompanyControllerService } from '../../../../api/api/companyController.service';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { SelfOnboardingService } from '../../../shared-services/self-onboarding.service';
import { NgbModalImproved } from '../../../core/ngb-modal-improved/ngb-modal-improved.service';
import {
  CompanyDetailFacilityAddWizardComponent
} from '../company-detail-facility-add-wizard/company-detail-facility-add-wizard.component';

@Component({
    selector: 'app-company-detail-facilities',
    templateUrl: './company-detail-facilities.component.html',
    styleUrls: ['./company-detail-facilities.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CompanyDetailFacilitiesComponent extends CompanyDetailTabManagerComponent implements OnInit, OnDestroy, AfterViewInit {

  rootTab = 2;

  title = $localize`:@@companyDetailFacilities.title.edit:Company facilities`;

  allFacilities = 0;
  displayedFacilities = 0;
  pageSize = 10;
  page = 0;

  gMap = null;
  isGoogleMapsLoaded = false;
  markers: any = [];
  defaultCenter = {
    lat: 5.274054,
    lng: 21.514503
  };
  defaultZoom = 3;
  bounds: any;
  initialBounds: any = [];
  gInfoWindowText = '';

  public companyId;
  public facilities$: Observable<ApiPaginatedResponseApiFacility>;

  sortingParams$ = new BehaviorSubject({ sortBy: 'name', sort: 'ASC' });
  paging$ = new BehaviorSubject<number>(1);

  sortOptions: SortOption[] = [
    {
      key: 'name',
      name: $localize`:@@productLabelFacilities.sortOptions.name.name:Name`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'type',
      name: $localize`:@@productLabelFacilities.sortOptions.type.name:Facility type`,
      inactive: true
    },
    {
      key: 'sellabaleSemiProducts',
      name: $localize`:@@productLabelFacilities.sortOptions.sellabaleSemiProducts.name:Sellable semi-products or final products`,
      inactive: true
    },
    {
      key: 'location',
      name: $localize`:@@productLabelFacilities.sortOptions.location.name:Location`,
      inactive: true
    },
    {
      key: 'actions',
      name: $localize`:@@productLabelFacilities.sortOptions.actions.name:Actions`,
      inactive: true
    }
  ];

  private subscriptions: Subscription;

  @Input()
  reloadPingList$ = new BehaviorSubject<boolean>(false);

  @Output()
  showing = new EventEmitter<number>();

  @Output()
  countAll = new EventEmitter<number>();

  @ViewChild(GoogleMap) set map(map: GoogleMap) {
    if (map) { this.gMap = map; this.fitBounds(); }
  }

  @ViewChild(MapInfoWindow, { static: false })
  gInfoWindow: MapInfoWindow;

  @ViewChild('addFacilityButtonTooltip')
  addFacilityButtonTooltip: NgbTooltip;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected facilityControllerService: FacilityControllerService,
    protected globalEventsManager: GlobalEventManagerService,
    protected authService: AuthService,
    protected companyController: CompanyControllerService,
    private selfOnboardingService: SelfOnboardingService,
    private modalService: NgbModalImproved
  ) {
    super(router, route, authService, companyController);
  }

  ngOnInit(): void {

    super.ngOnInit();
    this.companyId = this.route.snapshot.params.id;
    this.initializeFacilitiesObservable();

    this.globalEventsManager.loadedGoogleMapsEmitter.subscribe(loaded => {
      if (loaded) {
        this.isGoogleMapsLoaded = true;
      }
    });
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();

    this.subscriptions = this.selfOnboardingService.addFacilityCurrentStep$.subscribe(step => {
      if (step === 3) {
        this.addFacilityButtonTooltip?.open();
      } else {
        this.addFacilityButtonTooltip?.close();
      }
    });
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }

  loadEntityList() {
    return this.facilityControllerService.listAllFacilitiesByCompanyByMap({ id: this.companyId });
  }

  canDeactivate(): boolean {
    return true;
  }

  async newFacility() {

    const addFacilityStep = await this.selfOnboardingService.addFacilityCurrentStep$.pipe(take(1)).toPromise();

    // In this case open the add facility wizard
    if (addFacilityStep === 3) {
      this.selfOnboardingService.setAddFacilityCurrentStep(4);
      const modalRef = this.modalService.open(CompanyDetailFacilityAddWizardComponent, {
        centered: true,
        backdrop: 'static',
        keyboard: false,
        size: 'lg'
      });
      Object.assign(modalRef.componentInstance, {
        companyId: this.companyId
      });
    } else {
      this.router.navigate(['companies', this.cId, 'facilities', 'add']).then();
    }
  }

  changeSort(event) {
    this.sortingParams$.next({ sortBy: event.key, sort: event.sortOrder });
  }
  
  publicSort(p: boolean) {
    return p ? '✓' : null;
  }

  locationName(location: ApiFacilityLocation) {
    if (location.address.cell != null && location.address.country) { return location.address.cell + ', ' + location.address.country.name; }
    if (location.address.city != null && location.address.country) { return location.address.city + ', ' + location.address.country.name; }
    if (location.address.country != null) { return location.address.country.name; }
    return '';
  }

  showPagination() {
    return ((this.displayedFacilities - this.pageSize) === 0 && this.allFacilities >= this.pageSize) || this.page > 1;
  }

  onPageChange(event) {
    this.paging$.next(event);
  }

  openInfoWindow(gMarker: MapMarker, marker) {
    this.gInfoWindowText = marker.infoText;
    this.gInfoWindow.open(gMarker);
  }

  fitBounds() {
    if (!this.gMap || this.gMap == null) { return; }
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

  initializeFacilitiesObservable() {
    this.facilities$ = combineLatest(this.reloadPingList$, this.paging$, this.sortingParams$,
        (ping: boolean, page: number, sorting: any) => {
          return {
            ...sorting,
            offset: (page - 1) * this.pageSize,
            limit: this.pageSize
          };
        }).pipe(
        tap(val => this.globalEventsManager.showLoading(true)),
        switchMap(() => {
          return this.loadEntityList();
        }),
        tap((resp: ApiPaginatedResponseApiFacility) => {
          if (resp) {
            this.intializeMarkers(resp.data);
            this.displayedFacilities = 0;
            if (resp.data && resp.data.count && (this.pageSize - resp.data.count > 0)) { this.displayedFacilities = resp.data.count; }
            else if (resp.data && resp.data.count && (this.pageSize - resp.data.count <= 0)) {
              const temp = resp.data.count - (this.pageSize * (this.page - 1));
              this.displayedFacilities = temp >= this.pageSize ? this.pageSize : temp;
            }
            this.showing.emit(this.displayedFacilities);
            return resp.data.items;
          } else {
            return null;
          }
        }),
        tap(val => {
          if (val) {
            this.allFacilities = val.data.count;
            this.countAll.emit(this.allFacilities);
          } else {
            this.allFacilities = 0;
            this.countAll.emit(0);
          }
        }),
        tap(val => this.globalEventsManager.showLoading(false)),
        shareReplay(1)
    );
  }

  intializeMarkers(data: ApiPaginatedListApiFacility) {
    if (!data) {
      return;
    }
    this.markers = [];
    this.initialBounds = [];
    for (const item of data.items) {
      if (item.facilityLocation && item.facilityLocation.publiclyVisible && item.facilityLocation.latitude && item.facilityLocation.longitude) {
        const tmp = {
          position: {
            lat: item.facilityLocation.latitude,
            lng: item.facilityLocation.longitude
          },
          infoText: item.name
        };
        this.markers.push(tmp);
        this.initialBounds.push(tmp.position);
      }
    }
    this.fitBounds();
  }

  async activateFacility(facilityId) {
    const resActivate = await this.facilityControllerService.activateFacility(facilityId).pipe(take(1)).toPromise();
    if (resActivate && resActivate.status === 'OK') {
      this.reloadPingList$.next(null);
    }
  }

  async deactivateFacility(facilityId) {
    const result = await this.globalEventsManager.openMessageModal({
      type: 'warning',
      message: $localize`:@@productLabelFacilities.deactivateFacility.delete:Are you sure you want to deactivate the facility?`,
      options: {
        centered: true
      }
    });
    if (result  !== 'ok') {
      return;
    }
    const resDeactivate = await this.facilityControllerService.deactivateFacility(facilityId).pipe(take(1)).toPromise();
    if (resDeactivate && resDeactivate.status === 'OK') {
      this.reloadPingList$.next(null);
    }
  }

}
