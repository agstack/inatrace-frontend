import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StockAllStockTabComponent } from './stock-all-stock-tab/stock-all-stock-tab.component';
import { BatchHistoryComponent } from '../stock-core/batch-history/batch-history.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'tab',
    pathMatch: 'full'
  },
  {
    path: 'tab',
    component: StockAllStockTabComponent,
    data: {
      tab: 'all-stock',
      mode: 'COMPANY_ADMIN',
      drobtinice: null
    }
  },
  {
    path: 'stock-order/:stockOrderId/view',
    component: BatchHistoryComponent,
    pathMatch: 'full',
    data: {
      drobtinice: {
        title: ' / ' + $localize`:@@breadCrumb.purchasesOrders.myStock:My stock` + ' / ' + $localize`:@@breadCrumb.stockOrders.stockOrderView:Stock order details`,
        route: 'my-stock/all-stock'
      }
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StockAllStockRoutingModule { }
