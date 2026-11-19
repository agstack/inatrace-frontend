import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StakeholdersValueChainComponent } from './product-label-stakeholders/stakeholders-value-chain/stakeholders-value-chain.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'value-chain',
    pathMatch: 'full'
  },
  {
    path: 'value-chain',
    component: StakeholdersValueChainComponent,
    pathMatch: 'full',
    data: {
      drobtinice: null,
      tab: 'value-chain'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductStakeholdersRoutingModule { }
