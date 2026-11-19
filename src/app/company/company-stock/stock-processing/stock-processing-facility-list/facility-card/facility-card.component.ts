import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { ApiFacility } from '../../../../../../api/model/apiFacility';
import { ApiProcessingAction } from '../../../../../../api/model/apiProcessingAction';
import TypeEnum = ApiProcessingAction.TypeEnum;

@Component({
    selector: 'app-facility-card',
    templateUrl: './facility-card.component.html',
    styleUrls: ['./facility-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FacilityCardComponent implements OnInit {

  private readonly FACILITY_COLOR_CLASSES: string[] = [
    'af-card-section-content af-card-section-content--red',
    'af-card-section-content af-card-section-content--orange',
    'af-card-section-content af-card-section-content--yellow',
    'af-card-section-content af-card-section-content--green',
    'af-card-section-content af-card-section-content--cyan'
  ];

  description = '';

  menuOptions: { id: any; name: string }[] = [];

  @Input()
  facility: ApiFacility;

  @Input()
  indexInList: number;

  @Input()
  companyId: number;

  @Input()
  actions: ApiProcessingAction[] = [];

  constructor(
    private router: Router
  ) { }

  ngOnInit(): void {
    this.semiAndFinalProductsIncluded().then();
    this.setMenuOptions();
  }

  whereIsIt(facility: ApiFacility) {

    if (facility.facilityLocation && facility.facilityLocation.address && facility.facilityLocation.address.country) {

      if (facility.facilityLocation.address.country.code === 'RW') {
        return facility.facilityLocation.address.village;
      } else if (facility.facilityLocation.address.country.code === 'HN') {
        return facility.facilityLocation.address.hondurasVillage;
      }
      else {
        return facility.facilityLocation.address.city;
      }
    }
  }

  facilityType() {

    switch (this.facility.facilityType.code) {
      case 'WASHING_STATION':
      case 'BENEFICIO_HUMEDO':
        return 'af-card-icon-shape af-card-icon-shape--seedling';
      case 'DRYING_BED':
        return 'af-card-icon-shape af-card-icon-shape--proto';
      case 'STORAGE':
      case 'ALMACEN':
      case 'GREEN_COFFEE_STORAGE':
      case 'ALMACEN_CAFE_ORO':
      case 'ROASTED_COFFEE_STORAGE':
        return 'af-card-icon-shape af-card-icon-shape--home';
      case 'HULLING_STATION':
      case 'MAQUILADO_CAFE':
      case 'BENEFICIO_SECO':
        return 'af-card-icon-shape af-card-icon-shape--cogwheel';
      default:
        return 'af-card-icon-shape af-card-icon-shape--cogwheel';
    }
  }

  facilityTypeColor() {
    return this.FACILITY_COLOR_CLASSES[(this.indexInList ?? 0) % this.FACILITY_COLOR_CLASSES.length];
  }

  private async semiAndFinalProductsIncluded() {

    for (const item of this.facility.facilitySemiProductList || []) {
      if (item?.name) {
        this.description += item.name + ', ';
      }
    }

    for (const item of this.facility.facilityFinalProducts || []) {
      if (item?.name) {
        this.description += `${item.name}${item.product?.name ? ` (${item.product.name})` : ''}` + ', ';
      }
    }

    if (this.description.length > 0) {
      this.description = this.description.substring(0, this.description.length - 2);
    }
  }

  private setMenuOptions() {

    for (const action of this.actions) {

      // Filter-out processing actions of type 'SHIPMENT' (Quote orders)
      if (action.type === TypeEnum.SHIPMENT) {
        continue;
      }

      // If processing action has specified supported facilities check if this facility is specified (if not, skip the processing action)
      if (action.supportedFacilities && action.supportedFacilities.length > 0 && action.supportedFacilities.findIndex(sf => sf.id === this.facility.id) === -1) {
        continue;
      }

      const facilitySemiProd = (this.facility.facilitySemiProductList || []).find(fsp => fsp.id === action.inputSemiProduct?.id);
      if (facilitySemiProd) {
        this.menuOptions.push({
          id: action.id,
          name: action.name
        });
      }

      const facilityFinalProd = (this.facility.facilityFinalProducts || []).find(ffp => ffp.id === action.inputFinalProduct?.id);
      if (facilityFinalProd) {
        this.menuOptions.push({
          id: action.id,
          name: action.name
        });
      }
    }
  }

  goTo(actionId) {
    this.router.navigate(['my-stock', 'processing', actionId, 'facility', this.facility.id, 'new']).then();
  }

}
