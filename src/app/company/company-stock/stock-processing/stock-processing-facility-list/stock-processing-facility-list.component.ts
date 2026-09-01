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

    for (const facility of facilities) {
      const code = facility.facilityType.code.toUpperCase(); // Normalisation en majuscules
      if (['WASHING_STATION', 'DRYING_BED', 'BENEFICIO_HUMEDO'].includes(code)) {
        this.categoryOne.push(facility);
      }
      else if (code === 'ALMACEN' || code.includes('STORAGE')) {
        // Vérifier les exceptions de stockage spécialisées
        if (code === 'GREEN_COFFEE_STORAGE') {
          this.categoryFour.push(facility);
        }
        else if (code === 'ROASTED_COFFEE_STORAGE') {
          this.categoryFive.push(facility);
        }
        // Cas général STORAGE et ALMACEN
        else {
          this.categoryTwo.push(facility);
        }
      }
      else if (['HULLING_STATION', 'MAQUILADO_CAFE', 'BENEFICIO_SECO'].includes(code)) {
        this.categoryThree.push(facility);
      }
      else{
        this.categoryThree.push(facility);

      }
    }
  }

}
