import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../../../core/core.module';
import { ComponentsModule } from '../../../components/components.module';
import { LayoutModule } from '../../../layout/layout.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedModule } from '../../../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StockCoreTabComponent } from './stock-core-tab/stock-core-tab.component';
import { StockDeliveryDetailsComponent } from './stock-delivery-details/stock-delivery-details.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AdditionalProofItemComponent } from './additional-proof-item/additional-proof-item.component';
import { StockBulkDeliveryDetailsComponent } from './stock-bulk-delivery-details/stock-bulk-delivery-details.component';
import { BatchHistoryComponent } from './batch-history/batch-history.component';
import { GroupStockUnitListComponent } from './group-stock-unit-list/group-stock-unit-list.component';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FieldOrDocInfoComponent } from './batch-history/field-or-doc-info/field-or-doc-info.component';

@NgModule({
  declarations: [
    StockCoreTabComponent,
    StockDeliveryDetailsComponent,
    StockBulkDeliveryDetailsComponent,
    AdditionalProofItemComponent,
    BatchHistoryComponent,
    GroupStockUnitListComponent,
    FieldOrDocInfoComponent
  ],
    imports: [
        CommonModule,
        CoreModule,
        ComponentsModule,
        LayoutModule,
        FontAwesomeModule,
        SharedModule,
        FormsModule,
        ReactiveFormsModule,
        NgSelectModule,
        DragDropModule,
        NgbPaginationModule
    ],
    exports: [
        StockDeliveryDetailsComponent,
        StockBulkDeliveryDetailsComponent,
        AdditionalProofItemComponent,
        GroupStockUnitListComponent
    ]
})
export class StockCoreModule { }
