import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
    NgbDropdownModule,
    NgbPaginationModule,
    NgbTimepickerModule,
    NgbTooltipModule
} from '@ng-bootstrap/ng-bootstrap';
import { EllipsisModule } from 'ngx-ellipsis';
import { NgxPageScrollModule } from 'ngx-page-scroll';
import { ComponentsModule } from '../components/components.module';
import { ContentsModule } from '../contents/contents.module';
import { SharedModule } from '../shared/shared.module';
import { CoreModule } from '../core/core.module';
import { AuthorisedLayoutComponent } from './authorised/authorised-layout/authorised-layout.component';
import { AuthorisedSideNavTogglerComponent } from './authorised/authorised-side-nav-toggler/authorised-side-nav-toggler.component';
import { AuthorisedSideNavComponent } from './authorised/authorised-side-nav/authorised-side-nav.component';
import { AuthorisedTopNavComponent } from './authorised/authorised-top-nav/authorised-top-nav.component';
import { GuestLayoutComponent } from './guest/guest-layout/guest-layout.component';
import { GuestSideNavComponent } from './guest/guest-side-nav/guest-side-nav.component';
import { GuestTopNavComponent } from './guest/guest-top-nav/guest-top-nav.component';
import { LandingPageFooterComponent } from './landing-page/landing-page-footer/landing-page-footer.component';
import { LandingPageLayoutComponent } from './landing-page/landing-page-layout/landing-page-layout.component';
import { LandingPageTopNavComponent } from './landing-page/landing-page-top-nav/landing-page-top-nav.component';
import { PageContentComponent } from './page-content/page-content.component';
import { ProductLabelFrontLayoutComponent } from './product-label-front/product-label-front-layout/product-label-front-layout.component';
import { ProductLabelFrontTopNavComponent } from './product-label-front/product-label-front-top-nav/product-label-front-top-nav.component';
import { UserBoxComponent } from './user-box/user-box.component';

@NgModule({
  declarations: [
    AuthorisedLayoutComponent,
    AuthorisedSideNavComponent,
    AuthorisedSideNavTogglerComponent,
    AuthorisedTopNavComponent,
    GuestLayoutComponent,
    GuestSideNavComponent,
    GuestTopNavComponent,
    LandingPageFooterComponent,
    LandingPageLayoutComponent,
    LandingPageTopNavComponent,
    PageContentComponent,
    ProductLabelFrontLayoutComponent,
    ProductLabelFrontTopNavComponent,
    UserBoxComponent
  ],
    imports: [
        CommonModule,
        // Clean up unnecessary
        RouterModule,
        CoreModule,
        ComponentsModule,
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
        NgbTooltipModule
    ],
  exports: [
    AuthorisedLayoutComponent,
    AuthorisedSideNavComponent,
    AuthorisedSideNavTogglerComponent,
    AuthorisedTopNavComponent,
    GuestLayoutComponent,
    GuestSideNavComponent,
    GuestTopNavComponent,
    LandingPageFooterComponent,
    LandingPageLayoutComponent,
    LandingPageTopNavComponent,
    PageContentComponent,
    ProductLabelFrontLayoutComponent,
    ProductLabelFrontTopNavComponent,
    UserBoxComponent
  ]
})
export class LayoutModule { }
