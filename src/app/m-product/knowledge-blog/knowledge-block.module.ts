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
import { KnowledgeBlockRoutingModule } from './knowledge-block-routing.module';
import { KnowledgeBlogDocumentsItemComponent } from './knowledge-blog-documents-item/knowledge-blog-documents-item.component';
import { KnowledgeBlogPartComponent } from './knowledge-blog-part/knowledge-blog-part.component';
import { KnowledgeBlogSelectSectionModalComponent } from './knowledge-blog-select-section-modal/knowledge-blog-select-section-modal.component';
import { ProductLabelKnowledgeBlogComponent } from './product-label-knowledge-blog/product-label-knowledge-blog.component';
import { ProductCommonModule } from '../product-common/product-common.module';

@NgModule({
  declarations: [
    KnowledgeBlogDocumentsItemComponent,
    KnowledgeBlogPartComponent,
    KnowledgeBlogSelectSectionModalComponent,
    ProductLabelKnowledgeBlogComponent,
  ],
  imports: [
    CommonModule,
    KnowledgeBlockRoutingModule,
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
export class KnowledgeBlockModule { }
