import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StockProcessingTabComponent } from './stock-processing-tab/stock-processing-tab.component';
import { StockProcessingOrderDetailsComponent } from './stock-processing-order-details/stock-processing-order-details.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'tab',
    pathMatch: 'full'
  },
  {
    path: 'tab',
    component: StockProcessingTabComponent,
    data: {
      tab: 'processing',
      drobtinice: null
    }
  },
  {
    path: ':procActionId/facility/:inputFacilityId/new',
    component: StockProcessingOrderDetailsComponent, pathMatch: 'full',
    data: {
      mode: 'create',
      drobtinice: {
        title: ' / ' + $localize`:@@breadCrumb.processing.myStock:My stock` + ' / ' + $localize`:@@breadCrumb.processing.order:Processing order`,
        route: 'my-stock/processing',
        goBack: true
      }
    }
  },
  {
    path: 'update/:stockOrderId',
    component: StockProcessingOrderDetailsComponent, pathMatch: 'full',
    data: {
      mode: 'edit',
      drobtinice: {
        title: ' / ' + $localize`:@@breadCrumb.processing.myStock:My stock` + ' / ' + $localize`:@@breadCrumb.processing.order:Processing order`,
        route: 'my-stock/processing',
        goBack: true
      }
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StockProcessingRoutingModule { }
