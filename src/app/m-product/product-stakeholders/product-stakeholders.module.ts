import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbDropdownModule, NgbPaginationModule, NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { EllipsisModule } from 'ngx-ellipsis';
import { NgxPageScrollModule } from 'ngx-page-scroll';
import { ComponentsModule } from 'src/app/components/components.module';
import { ContentsModule } from 'src/app/contents/contents.module';
import { LayoutModule } from 'src/app/layout/layout.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { CoreModule } from 'src/app/core/core.module';
import { CompanyCardComponent } from './company-card/company-card.component';
import { ProductLabelStakeholdersComponent } from './product-label-stakeholders/product-label-stakeholders.component';
import { StakeholdersValueChainComponent } from './product-label-stakeholders/stakeholders-value-chain/stakeholders-value-chain.component';
import { ProductStakeholdersRoutingModule } from './product-stakeholders-routing.module';
import { ProductCommonModule } from '../product-common/product-common.module';
import { DataSharingAgreementItemComponent } from './product-label-stakeholders/stakeholders-value-chain/data-sharing-agreement-item/data-sharing-agreement-item.component';

@NgModule({
declarations: [
    CompanyCardComponent,
    ProductLabelStakeholdersComponent,
    StakeholdersValueChainComponent,
    DataSharingAgreementItemComponent
  ],
  imports: [
    CommonModule,
    ProductStakeholdersRoutingModule,
    ProductCommonModule,
    // Clean up unnecessary
    CoreModule,
    ComponentsModule,
    LayoutModule,
    FontAwesomeModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    NgxPageScrollModule,
    ContentsModule,
    EllipsisModule,
    NgbTimepickerModule,
    NgbDropdownModule,
    NgbPaginationModule,
    GoogleMapsModule,
    DragDropModule,
  ]
})
export class ProductStakeholdersModule { }
