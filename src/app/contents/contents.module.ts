import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedModule } from 'src/app/shared/shared.module';
import { ContentSectionComponent } from './content-section/content-section.component';
import { ContentsLinkParentDirective } from './contents-link-parent.directive';
import { ContentsLinkDirective } from './contents-link.directive';
import { ContentsSectionDirective } from './contents-section.directive';
import { ContentsTableDirective } from './contents-table.directive';
import { ContentsDirective } from './contents.directive';
import { FaqModalComponent } from './faq-modal/faq-modal.component';
import { ParentContentLinkComponent } from './parent-content-link/parent-content-link.component';
import { ParentContentSectionComponent } from './parent-content-section/parent-content-section.component';
import { InstructionsModalComponent } from './instructions-modal/instructions-modal.component';


@NgModule({
    imports: [
        CommonModule,
        FontAwesomeModule,
        SharedModule,
    ],
    declarations: [
        ContentsLinkDirective,
        ContentsLinkParentDirective,
        ContentsSectionDirective,
        ContentsTableDirective,
        ContentsDirective,
        ContentSectionComponent,
        ParentContentSectionComponent,
        ParentContentLinkComponent,
        FaqModalComponent,
        InstructionsModalComponent,
    ],
    exports: [
        ContentsLinkDirective,
        ContentsLinkParentDirective,
        ContentsSectionDirective,
        ContentsTableDirective,
        ContentsDirective,
        ContentSectionComponent,
        ParentContentSectionComponent,
        ParentContentLinkComponent,
    ],
    providers: []
})
export class ContentsModule { }
