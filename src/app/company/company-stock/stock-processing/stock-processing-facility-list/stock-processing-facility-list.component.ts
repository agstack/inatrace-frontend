import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { FacilityControllerService } from '../../../../../api/api/facilityController.service';
import { ApiPaginatedResponseApiFacility } from '../../../../../api/model/apiPaginatedResponseApiFacility';
import { ApiPaginatedListApiFacility } from '../../../../../api/model/apiPaginatedListApiFacility';
import { ApiFacility } from '../../../../../api/model/apiFacility';
import { ProcessingActionControllerService } from '../../../../../api/api/processingActionController.service';
import { ApiProcessingAction } from '../../../../../api/model/apiProcessingAction';
import { ApiPaginatedResponseApiProcessingAction } from '../../../../../api/model/apiPaginatedResponseApiProcessingAction';

@Component({
  selector: 'app-stock-processing-facility-list',
  templateUrl: './stock-processing-facility-list.component.html',
  styleUrls: ['./stock-processing-facility-list.component.scss']
})
export class StockProcessingFacilityListComponent implements OnInit {

  @Input()
  reloadPingList$ = new BehaviorSubject<boolean>(false);

  @Input()
  companyId: number;

  @Output()
  showing = new EventEmitter<number>();

  @Output()
  countAll = new EventEmitter<number>();

  allFacilities = 0;
  showedFacilities = 0;

  facilities$: Observable<ApiPaginatedListApiFacility>;

  categoryOne = [];
  categoryTwo = [];
  categoryThree = [];
  categoryFour = [];
  categoryFive = [];
  categoryOther = [];

  processingActions: ApiProcessingAction[] = [];

  constructor(
    private globalEventsManager: GlobalEventManagerService,
    private facilityControllerService: FacilityControllerService,
    private processingActionControllerService: ProcessingActionControllerService
  ) { }

  ngOnInit(): void {

    this.facilities$ = combineLatest([this.reloadPingList$])
      .pipe(
        tap(() => this.globalEventsManager.showLoading(true)),
        switchMap(() => this.processingActionControllerService.listProcessingActionsByCompany(this.companyId)),
        tap((res: ApiPaginatedResponseApiProcessingAction) => {
          if (res) {
            this.processingActions = res.data.items;
          }
        }),
        switchMap(() => this.loadEntityList()),
        map((res: ApiPaginatedResponseApiFacility) => {
          if (res) {
            this.showedFacilities = res.data.count;
            this.showing.emit(this.showedFacilities);
            this.arrangeFacilities(res.data.items);
            return res.data;
          } else {
            return null;
          }
        }),
        tap((res) => {
          if (res) {
            this.allFacilities = res.count;
          } else {
            this.allFacilities = 0;
          }
          this.countAll.emit(this.allFacilities);
        }),
        tap(() => this.globalEventsManager.showLoading(false))
      );
  }

  loadEntityList(): Observable<ApiPaginatedResponseApiFacility> {
    return this.facilityControllerService.listFacilitiesByCompanyByMap({ id: this.companyId });
  }

  arrangeFacilities(facilities: ApiFacility[]) {

    this.categoryOne = [];
    this.categoryTwo = [];
    this.categoryThree = [];
    this.categoryFour = [];
    this.categoryFive = [];
    this.categoryOther = [];

    for (const facility of facilities) {
      switch (facility.facilityType?.code) {
        case 'WASHING_STATION':
        case 'DRYING_BED':
        case 'BENEFICIO_HUMEDO':
          this.categoryOne.push(facility);
          break;

        case 'STORAGE':
        case 'ALMACEN':
          this.categoryTwo.push(facility);
          break;

        case 'HULLING_STATION':
        case 'MAQUILADO_CAFE':
        case 'BENEFICIO_SECO':
          this.categoryThree.push(facility);
          break;

        case 'GREEN_COFFEE_STORAGE':
        case 'ALMACEN_CAFE_ORO':
          this.categoryFour.push(facility);
          break;
        case 'ROASTED_COFFEE_STORAGE':
          this.categoryFive.push(facility);
          break;
        default:
          // Custom facility types (for example cocoa) must remain reachable.
          this.categoryOther.push(facility);
          break;
      }
    }
  }

}
