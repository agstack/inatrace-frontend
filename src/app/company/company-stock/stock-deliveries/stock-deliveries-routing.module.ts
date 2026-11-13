import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StockDeliveriesTabComponent } from './stock-deliveries-tab/stock-deliveries-tab.component';
import { StockDeliveryDetailsComponent } from '../stock-core/stock-delivery-details/stock-delivery-details.component';
import {StockBulkDeliveryDetailsComponent} from '../stock-core/stock-bulk-delivery-details/stock-bulk-delivery-details.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'tab',
    pathMatch: 'full'
  },
  {
    path: 'tab',
    component: StockDeliveriesTabComponent,
    pathMatch: 'full',
    data: {
      tab: 'deliveries',
      drobtinice: null
    }
  },
  {
    path: 'facility/:facilityId/:fromTabType/new-bulk',
    component: StockBulkDeliveryDetailsComponent,
    pathMatch: 'full',
    data: {
      action: 'new',
      mode: 'PURCHASE_ORDER',
      drobtinice: {
        title: ' / ' + $localize`:@@breadCrumb.purchasesOrders.myStock:My stock` + ' / ' + $localize`:@@breadCrumb.purchaseOrders.purchase:Purchase`,
        route: 'my-stock/:fromTabType'
      }
    }
  },
  {
    path: 'facility/:facilityId/:fromTabType/new',
    component: StockDeliveryDetailsComponent,
    pathMatch: 'full',
    data: {
      action: 'new',
      mode: 'PURCHASE_ORDER',
      drobtinice: {
        title: ' / ' + $localize`:@@breadCrumb.purchasesOrders.myStock:My stock` + ' / ' + $localize`:@@breadCrumb.purchaseOrders.purchase:Purchase`,
        route: 'my-stock/:fromTabType'
      }
    }
  },
  {
    path: 'update/:purchaseOrderId',
    component: StockDeliveryDetailsComponent,
    pathMatch: 'full',
    data: {
      action: 'update',
      mode: 'PURCHASE_ORDER',
      drobtinice: {
        title: ' / ' + $localize`:@@breadCrumb.purchasesOrders.myStock:My stock` + ' / ' + $localize`:@@breadCrumb.purchaseOrders.purchase:Purchase`,
        route: 'my-stock/deliveries'
      }
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StockDeliveriesRoutingModule { }
