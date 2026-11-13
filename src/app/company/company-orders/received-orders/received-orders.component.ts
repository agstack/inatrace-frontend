import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { OrdersTabComponent } from '../orders-tab/orders-tab.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FacilityControllerService } from '../../../../api/api/facilityController.service';
import { UntypedFormControl } from '@angular/forms';
import { FacilitySemiProductsCodebookService } from '../../../shared-services/facility-semi-products-codebook.service';
import { setNavigationParameter } from '../../../../shared/utils';
import { BehaviorSubject, Subscription } from 'rxjs';
import { CodebookTranslations } from '../../../shared-services/codebook-translations';
import { ApiSemiProduct } from '../../../../api/model/apiSemiProduct';
import { SelectedUserCompanyService } from '../../../core/selected-user-company.service';

@Component({
    selector: 'app-received-orders',
    templateUrl: './received-orders.component.html',
    styleUrls: ['./received-orders.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ReceivedOrdersComponent extends OrdersTabComponent implements OnInit, OnDestroy {

  rootTab = 0;

  // Semi-product dropdown selection component
  semiProductFrom = new UntypedFormControl(null);
  semiProductsInFacilityCodebook: FacilitySemiProductsCodebookService;
  semiProductId = null;
  semiProductId$ = new BehaviorSubject<number>(null);

  facilityChangedSubs: Subscription;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected facilityController: FacilityControllerService,
    private codebookTranslations: CodebookTranslations,
    protected selUserCompanyService: SelectedUserCompanyService
  ) {
    super(router, route, facilityController, selUserCompanyService);
  }

  async ngOnInit(): Promise<void> {

    await super.ngOnInit();

    this.facilityChangedSubs = this.selectedFacilityId$.subscribe(facilityId => {
      if (facilityId !== null && facilityId !== undefined) {
        this.semiProductsInFacilityCodebook = new FacilitySemiProductsCodebookService(this.facilityController, facilityId, this.codebookTranslations);
      }
      else {
        this.semiProductsInFacilityCodebook = null;
      }

      this.selectSemiProduct(null);
    });
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    if (this.facilityChangedSubs) {
      this.facilityChangedSubs.unsubscribe();
    }
  }

  selectSemiProduct(event: ApiSemiProduct) {

    if (event) {
      this.semiProductId = event.id;
    } else {
      this.semiProductId = null;
      this.semiProductFrom.setValue(null);
    }

    this.semiProductId$.next(this.semiProductId);
    setNavigationParameter(this.router, this.route, 'semiProductId', this.semiProductId);
  }

}
