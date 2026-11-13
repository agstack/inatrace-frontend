import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'deliveries',
    pathMatch: 'full'
  },
  {
    path: 'deliveries',
    loadChildren: () => import('./stock-deliveries/stock-deliveries.module').then(m => m.StockDeliveriesModule)
  },
  {
    path: 'processing',
    loadChildren: () => import('./stock-processing/stock-processing.module').then(m => m.StockProcessingModule)
  },
  {
    path: 'payments',
    loadChildren: () => import('./stock-payments/stock-payments.module').then(m => m.StockPaymentsModule)
  },
  {
    path: 'orders', // Used for Beyco redirect - after login they redirect to orders
    redirectTo: 'all-stock',
    pathMatch: 'full'
  },
  {
    path: 'all-stock', loadChildren: () => import('./stock-all-stock/stock-all-stock.module').then(m => m.StockAllStockModule)
  },
  {
    path: 'beyco',
    loadChildren: () => import('./beyco-offer/beyco-offer.module').then(m => m.BeycoOfferModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CompanyStockRoutingModule { }
