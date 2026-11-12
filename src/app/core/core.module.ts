import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ErrorModalComponent } from './error-modal/error-modal.component';
import { MessageModalComponent } from './message-modal/message-modal.component';
import { NgbModalImprovedModule } from './ngb-modal-improved/ngb-modal-improved.module';
import { PageNotFoundComponent } from './page-not-found.component';

@NgModule({
    declarations: [
        PageNotFoundComponent,
        ErrorModalComponent,
        MessageModalComponent
    ],
    imports: [
        CommonModule,
        FontAwesomeModule,
        NgbModalImprovedModule
    ],
    exports: [
        MessageModalComponent,
        PageNotFoundComponent,
    ]
})
export class CoreModule { }
