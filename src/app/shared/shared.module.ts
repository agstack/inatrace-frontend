import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
// tslint:disable-next-line:max-line-length
import { faAlignJustify, faBuilding, faBullseye, faCheck, faChevronDown, faChevronUp, faEllipsisH, faExclamation, faExternalLinkAlt, faEye, faEyeSlash, faFileUpload, faGavel, faLightbulb, faMapMarkerAlt, faPaperclip, faPen, faPlus, faPlusCircle, faTimes, faTrashAlt, faUndo, faQrcode, faQuestion, faInfoCircle, faInfo } from '@fortawesome/free-solid-svg-icons';
import { NgbModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { EditorModule } from '@tinymce/tinymce-angular';
import { FileUploadModule } from 'ng2-file-upload';
import { EllipsisModule } from 'ngx-ellipsis';
import { NgbModalImprovedModule } from '../core/ngb-modal-improved/ngb-modal-improved.module';
import { AccordionPanelComponent } from './accordion/accordion-panel.component';
import { AccordionComponent } from './accordion/accordion.component';
import { CheckboxGroupMultiChoiceComponent } from './checkbox-group-multi-choice/checkbox-group-multi-choice.component';
import { CheckboxInputComponent } from './checkbox-input/checkbox-input.component';
import { CheckboxInputErrorsComponent } from './checkbox-input/helpers/checkbox-input-errors/checkbox-input-errors.component';
import { CheckboxInputRichLabelComponent } from './checkbox-input/helpers/checkbox-input-rich-label/checkbox-input-rich-label.component';
import { CreateUpdateDeleteButtonsComponent } from './create-update-delete-buttons/create-update-delete-buttons.component';
import { AutofocusDirective } from './directives/autofocus.directive';
import { AutosizeDirective } from './directives/autosize.directive';
import { HeavyLabelPrimaryDirective } from './directives/heavy-label-primary.directive';
import { HeavyLabelDirective } from './directives/heavy-label.directive';
import { LinkDirective } from './directives/link.directive';
import { Link2Directive } from './directives/link2.directive';
import { GenericEditableItemComponent } from './generic-editable-item/generic-editable-item.component';
import { ListEditorErrorsComponent } from './list-editor-errors/list-editor-errors.component';
import { ListEditorItemsComponent } from './list-editor-items/list-editor-items.component';
import { ListEditorComponent } from './list-editor/list-editor.component';
import { MiniButtonsComponent } from './mini-buttons/mini-buttons.component';
import { DefaultPipe } from './pipes/default.pipe';
import { FormatDatePipe } from './pipes/format-date.pipe';
import { FormatLongTextPipe } from './pipes/format-long-text.pipe';
import { ListFilterPipe } from './pipes/list-filter.pipe';
import { SingleChoiceComponent } from './single-choice/single-choice.component';
import { SmartTagClosedComponent } from './smart-tag-closed/smart-tag-closed.component';
import { SmartTagOpenComponent } from './smart-tag-open/smart-tag-open.component';
import { SmartTagComponent } from './smart-tag/smart-tag.component';
import { SubformFormComponent } from './subform-form/subform-form.component';
import { SubformLayoutComponent } from './subform-layout/subform-layout.component';
import { SubformMiniButtonsComponent } from './subform-mini-buttons/subform-mini-buttons.component';
import { TagListTagComponent } from './tag-list-tag/tag-list-tag.component';
import { TagListComponent } from './tag-list/tag-list.component';
import { TextinputModalComponent } from './textinput-modal/textinput-modal.component';
import { TextinputComponent } from './textinput/textinput.component';
import { TinymceTextareaComponent } from './tinymce-textarea/tinymce-textarea.component';
import { AttachmentUploaderComponent } from './attachment-uploader/attachment-uploader.component';
import { AttachmentUploaderContentComponent } from './attachment-uploader/components/attachment-uploader-content/attachment-uploader-content.component';
import { AttachmentUploaderErrorsComponent } from './attachment-uploader/components/attachment-uploader-errors/attachment-uploader-errors.component';
import { ImageViewerComponent } from './image-viewer/image-viewer.component';
import { ResultSorterComponent } from './result-sorter/result-sorter.component';
import { ClosableComponent } from './closable/closable.component';
import { ClosableTextinputComponent } from './closable-textinput/closable-textinput.component';
import { VersionComponent } from './version/version.component';
import { ImagePreloadDirective } from './directives/image-preload.directive';
import { ScrollPositionDirective } from './directives/scroll-position.directive';
import { ScrollContainerDirective } from './directives/scroll-container.directive';
import { DatepickerComponent } from './datepicker/datepicker.component';
import { SearchTextinputComponent } from './search-textinput/search-textinput.component';
import { LocationFormComponent } from './location-form/location-form.component';
import { GoogleMapsModule } from '@angular/google-maps';
import { ContactFormComponent } from './contact-form/contact-form.component';
import { CompanyDocumentItemComponent } from './company-document-item/company-document-item.component';
import { CompanyDocumentCategoryFilterPipe } from './pipes/company-document-category-filter.pipe';
import { CertificationAndStandardItemComponent } from './certification-and-standard-item/certification-and-standard-item.component';
import { LocationFormNewComponent } from './location-form-new/location-form-new.component';
import { GeoaddressFormComponent } from './geoaddress-form/geoaddress-form.component';
import { ColorInputComponent } from './color-input/color-input.component';
import { DocumentPreviewComponent } from './document-preview/document-preview.component';
import { ToggleSwitchComponent } from './toggle-switch/toggle-switch.component';
import { MapComponent } from './map/map.component';
import { QrCodeComponent } from './qr-code/qr-code.component';

@NgModule({ declarations: [
        TagListComponent,
        SingleChoiceComponent,
        TextinputComponent,
        HeavyLabelDirective,
        ListEditorComponent,
        LinkDirective,
        Link2Directive,
        ListFilterPipe,
        DefaultPipe,
        TextinputModalComponent,
        FormatLongTextPipe,
        HeavyLabelPrimaryDirective,
        GenericEditableItemComponent,
        SmartTagComponent,
        SmartTagClosedComponent,
        SmartTagOpenComponent,
        MiniButtonsComponent,
        SubformLayoutComponent,
        SubformFormComponent,
        SubformMiniButtonsComponent,
        FormatDatePipe,
        AccordionComponent,
        AccordionPanelComponent,
        TagListTagComponent,
        AutosizeDirective,
        CreateUpdateDeleteButtonsComponent,
        CheckboxInputComponent,
        CheckboxGroupMultiChoiceComponent,
        TinymceTextareaComponent,
        ListEditorItemsComponent,
        ListEditorErrorsComponent,
        CheckboxInputErrorsComponent,
        CheckboxInputRichLabelComponent,
        AutofocusDirective,
        AttachmentUploaderComponent,
        AttachmentUploaderContentComponent,
        AttachmentUploaderErrorsComponent,
        ImageViewerComponent,
        ResultSorterComponent,
        ClosableComponent,
        ClosableTextinputComponent,
        VersionComponent,
        ImagePreloadDirective,
        ScrollPositionDirective,
        ScrollContainerDirective,
        DatepickerComponent,
        SearchTextinputComponent,
        LocationFormComponent,
        MapComponent,
        ContactFormComponent,
        CertificationAndStandardItemComponent,
        CompanyDocumentItemComponent,
        CompanyDocumentCategoryFilterPipe,
        LocationFormNewComponent,
        GeoaddressFormComponent,
        ColorInputComponent,
        DocumentPreviewComponent,
        ToggleSwitchComponent,
        QrCodeComponent
    ],
    exports: [
        QrCodeComponent,
        TagListComponent,
        SingleChoiceComponent,
        TextinputComponent,
        HeavyLabelDirective,
        ListEditorComponent,
        LinkDirective,
        Link2Directive,
        ListFilterPipe,
        DefaultPipe,
        TextinputModalComponent,
        FormatDatePipe,
        AccordionComponent,
        AccordionPanelComponent,
        AutosizeDirective,
        CheckboxInputComponent,
        SmartTagComponent,
        SmartTagClosedComponent,
        SmartTagOpenComponent,
        SubformLayoutComponent,
        SubformFormComponent,
        SubformMiniButtonsComponent,
        MiniButtonsComponent,
        CheckboxGroupMultiChoiceComponent,
        TinymceTextareaComponent,
        ListEditorItemsComponent,
        ListEditorErrorsComponent,
        CheckboxInputRichLabelComponent,
        CheckboxInputErrorsComponent,
        AttachmentUploaderComponent,
        AttachmentUploaderContentComponent,
        AttachmentUploaderErrorsComponent,
        ImageViewerComponent,
        ResultSorterComponent,
        ClosableComponent,
        ClosableTextinputComponent,
        ScrollPositionDirective,
        ScrollContainerDirective,
        ImagePreloadDirective,
        DatepickerComponent,
        SearchTextinputComponent,
        LocationFormComponent,
        MapComponent,
        CertificationAndStandardItemComponent,
        CompanyDocumentItemComponent,
        CompanyDocumentCategoryFilterPipe,
        LocationFormNewComponent,
        GeoaddressFormComponent,
        ColorInputComponent,
        DocumentPreviewComponent,
        ToggleSwitchComponent,
        NgSelectModule
    ], imports: [
        CommonModule,
        FontAwesomeModule,
        EditorModule,
        NgbTypeaheadModule,
        NgbModule,
        NgbModalImprovedModule,
        NgSelectModule,
        EllipsisModule,
        FileUploadModule,
        DragDropModule,
        ReactiveFormsModule,
        FormsModule,
        GoogleMapsModule,
        RouterModule], providers: [provideHttpClient(withXhr(), withInterceptorsFromDi())] })
export class SharedModule {
    constructor(library: FaIconLibrary) {
        library.addIcons(
            faPlus,
            faTimes,
            faFileUpload,
            faChevronDown,
            faChevronUp,
            faCheck,
            faPen,
            faUndo,
            faTrashAlt,
            faAlignJustify,
            faMapMarkerAlt,
            faBullseye,
            faPlusCircle,
            faEye, faEyeSlash, faEllipsisH, faLightbulb, faExternalLinkAlt,
            faBuilding, faExclamation, faGavel, faPaperclip,
            faQrcode, faQuestion, faInfo, faInfoCircle
        );
    }
}
