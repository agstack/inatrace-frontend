import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReceivedOrdersComponent } from './received-orders/received-orders.component';
import { PlacedOrdersComponent } from './placed-orders/placed-orders.component';
import { AddCustomerOrderComponent } from './placed-orders/add-customer-order/add-customer-order.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'received-orders',
    pathMatch: 'full'
  },
  {
    path: 'received-orders',
    component: ReceivedOrdersComponent,
    pathMatch: 'full',
    data: {
      drobtinice: null
    }
  },
  {
    path: 'placed-orders',
    component: PlacedOrdersComponent,
    pathMatch: 'full',
    data: {
      drobtinice: null
    }
  },
  {
    path: 'customer-order/add',
    component: AddCustomerOrderComponent,
    pathMatch: 'full',
    data: {
      drobtinice: {
        title: ' / ' + $localize`:@@breadCrumb.purchasesOrders.myStock:Orders` + ' / ' + $localize`:@@breadCrumb.orders.globalOrder:Order`,
        route: 'my-orders/placed-orders'
      }
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CompanyOrdersRoutingModule { }
