import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BeycoOfferListComponent } from './beyco-offer-list/beyco-offer-list.component';

const routes: Routes = [
    {
        path: 'list',
        component: BeycoOfferListComponent,
        data: {
            drobtinice: {
                title: ' / ' + $localize`:@@breadCrumb.purchasesOrders.myStock:My stock` + ' / ' + $localize`:@@breadCrumb.stockOrders.stockOrderView:Stock order details` + ' / ' +
                $localize`:@@breadCrumb.stockOrders.beycoOrder: Export to Beyco`,
                route: 'my-stock/all-stock/tab'
            }
        }
    },
    {
        path: '',
        redirectTo: '/my-stock/all-stock/tab',
        pathMatch: 'full'
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class BeycoOfferRoutingModule { }
