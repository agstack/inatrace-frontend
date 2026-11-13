import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompanyFarmersListComponent } from './company-farmers-list/company-farmers-list.component';
import { LayoutModule } from '../../layout/layout.module';
import { CompanyCommonModule } from '../company-common/company-common.module';
import { CompanyFarmersRoutingModule } from './company-farmers-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CompanyFarmersDetailsComponent } from './company-farmers-details/company-farmers-details.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CompanyFarmersImportComponent } from './company-farmers-import/company-farmers-import.component';
import { ReactiveFormsModule } from '@angular/forms';
import {
  OpenPlotDetailsExternallyModalComponent
} from './open-plot-details-externally-modal/open-plot-details-externally-modal.component';



@NgModule({
  declarations: [CompanyFarmersListComponent, CompanyFarmersDetailsComponent, CompanyFarmersImportComponent, OpenPlotDetailsExternallyModalComponent],
    imports: [
        CommonModule,
        LayoutModule,
        CompanyCommonModule,
        CompanyFarmersRoutingModule,
        SharedModule,
        NgbPaginationModule,
        DragDropModule,
        FontAwesomeModule,
        ReactiveFormsModule,
        NgbTooltipModule
    ]
})
export class CompanyFarmersModule { }
