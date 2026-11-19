import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbDropdownModule, NgbPaginationModule, NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { EllipsisModule } from 'ngx-ellipsis';
import { NgxPageScrollModule } from 'ngx-page-scroll';
import { ContentsModule } from '../contents/contents.module';
import { SharedModule } from '../shared/shared.module';
import { CoreModule } from '../core/core.module';
import { BottomButtonsComponent } from './bottom-buttons/bottom-buttons.component';
import { CardComponent } from './card/card.component';
import { DropdownComponent } from './dropdown/dropdown.component';
import { FormDetailsLeftPanelComponent } from './form-details-left-panel/form-details-left-panel.component';
import { FormPositionBoxComponent } from './form-position-box/form-position-box.component';
import { LastSeenTagComponent } from './last-seen-tag/last-seen-tag.component';
import { FormatAvailabilityPipe } from './pipes/format-availability.pipe';
import { FormatProcessingActionTypePipe } from './pipes/format-processing-action-type.pipe';
import { FormatProcessingEvidenceTypeTypePipe } from './pipes/format-processing-evidence-type-type.pipe';
import { FormatStockOrderTypePipe } from './pipes/format-stock-order-type.pipe';
import { FormatTransactionStatusPipe } from './pipes/format-transaction-status.pipe';
import { FormatTransactionTypePipe } from './pipes/format-transaction-type.pipe';
import { RedirectClearCacheComponent } from './redirect-clear-cache/redirect-clear-cache.component';
import { FormatWayOfPaymentPipe } from './pipes/format-way-of-payment.pipe';
import { TranslateCodebookPipe } from './pipes/translate-codebook';
import { FormatCompanyCertsPipe } from './pipes/format-company-certs.pipe';
import { GenerateQRCodeModalComponent } from './generate-qr-code-modal/generate-qr-code-modal.component';
import { FormatPaymentPurposeTypePipe } from './pipes/format-payment-purpose-type';
import { FormatProcessingEvidenceFieldTypePipe } from './pipes/format-processing-evidence-field-type.pipe';
import { ProductCardComponent } from './product-card/product-card.component';
import { FormatPaymentStatusPipe } from './pipes/format-payment-status.pipe';
import { QrCodeRedirectComponent } from './qr-code-redirect/qr-code-redirect.component';

@NgModule({
  declarations: [
    BottomButtonsComponent,
    DropdownComponent,
    FormDetailsLeftPanelComponent,
    FormPositionBoxComponent,
    LastSeenTagComponent,
    FormatAvailabilityPipe,
    FormatStockOrderTypePipe,
    RedirectClearCacheComponent,
    CardComponent,
    FormatTransactionTypePipe,
    FormatTransactionStatusPipe,
    FormatProcessingActionTypePipe,
    FormatProcessingEvidenceTypeTypePipe,
    FormatWayOfPaymentPipe,
    TranslateCodebookPipe,
    FormatCompanyCertsPipe,
    GenerateQRCodeModalComponent,
    FormatPaymentPurposeTypePipe,
    FormatProcessingEvidenceFieldTypePipe,
    ProductCardComponent,
    FormatPaymentStatusPipe,
    QrCodeRedirectComponent
  ],
  imports: [
    CommonModule,
    // Clean up unnecessary
    RouterModule,
    CoreModule,
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
    GoogleMapsModule
  ],
  exports: [
    BottomButtonsComponent,
    DropdownComponent,
    FormDetailsLeftPanelComponent,
    FormPositionBoxComponent,
    LastSeenTagComponent,
    FormatAvailabilityPipe,
    FormatStockOrderTypePipe,
    RedirectClearCacheComponent,
    RedirectClearCacheComponent,
    FormatTransactionTypePipe,
    FormatTransactionStatusPipe,
    FormatProcessingActionTypePipe,
    FormatProcessingEvidenceTypeTypePipe,
    FormatWayOfPaymentPipe,
    TranslateCodebookPipe,
    FormatCompanyCertsPipe,
    GenerateQRCodeModalComponent,
    FormatPaymentPurposeTypePipe,
    FormatProcessingEvidenceFieldTypePipe,
    ProductCardComponent,
    FormatPaymentStatusPipe
  ],
  providers: [
    FormatPaymentPurposeTypePipe
  ]
})
export class ComponentsModule { }
