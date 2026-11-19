import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompanyDetailComponent } from './company/company-detail/company-detail.component';
import { CompanyListComponent } from './company/company-list/company-list.component';
import { ConfirmEmailComponent } from './user/confirm-email/confirm-email.component';
import { ClearCookieConsentComponent } from './cookies/clear-cookie-consent/clear-cookie-consent.component';
import { CookiesPageComponent } from './cookies/cookies-page/cookies-page.component';
import { PrivacyPageComponent } from './cookies/privacy-page/privacy-page.component';
import { TermsAndConditionsPageComponent } from './cookies/terms-and-conditions-page/terms-and-conditions-page.component';
import { KnowledgeBlogFrontComponent } from './knowledge-blog-front/knowledge-blog-front.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { GuestLayoutComponent } from './layout/guest/guest-layout/guest-layout.component';
import { LandingPageLayoutComponent } from './layout/landing-page/landing-page-layout/landing-page-layout.component';
import { ProductLabelFrontLayoutComponent } from './layout/product-label-front/product-label-front-layout/product-label-front-layout.component';
import { LoginComponent } from './user/login/login.component';
import { QrCodeRedirectComponent } from './components/qr-code-redirect/qr-code-redirect.component';
import { PageNotFoundComponent } from './core/page-not-found.component';
import { RegisterActivationComponent } from './user/register-activation/register-activation.component';
import { RegisterComponent } from './user/register/register.component';
import { ResetPasswordRequestComponent } from './user/reset-password-request/reset-password-request.component';
import { ResetPasswordComponent } from './user/reset-password/reset-password.component';
import { SettingsAdditionalComponent } from './settings/settings-additional/settings-additional.component';
import { SettingsTypesComponent } from './settings/settings-types/settings-types.component';
import { SystemOrRegionalAdminGuardService } from './core/guards/system-or-regional-admin-guard.service';
import { DeactivateGuardService } from './shared-services/deactivate-guard.service';
import { VersionComponent } from './shared/version/version.component';
import { UserDetailComponent } from './user/user-detail/user-detail.component';
import { UserHomeComponent } from './user/user-home/user-home.component';
import { UserListComponent } from './user/user-list/user-list.component';
import { ValueChainListComponent } from './value-chain/value-chain-list/value-chain-list.component';
import { ValueChainDetailComponent } from './value-chain/value-chain-detail/value-chain-detail.component';
import { CompanyDetailUsersComponent } from './company/company-detail/company-detail-users/company-detail-users.component';
import { CompanyDetailFacilitiesComponent } from './company/company-detail/company-detail-facilities/company-detail-facilities.component';
import { CompanyDetailFacilityAddComponent } from './company/company-detail/company-detail-facility-add/company-detail-facility-add.component';
import { CompanyProcessingActionsComponent } from './company/company-detail/company-processing-actions/company-processing-actions.component';
import { CurrencyListComponent } from './currency-list/currency-list.component';
import {
  CompanyDetailProcessingActionsDetailComponent
} from './company/company-detail/company-processing-actions/company-detail-processing-actions-detail/company-detail-processing-actions-detail.component';
import { AdminOrCompanyAdminGuardService } from './core/guards/admin-or-company-admin-guard.service';
import { ActivatedUserGuardService } from './core/guards/activated-user-guard.service';
import { CompanyAdminGuardService } from './core/guards/company-admin-guard.service';
import { CompanyDashboardComponent } from './company/company-dashboard/company-dashboard.component';

export function loginMatcher(url) {
  if (url.length > 0 && url[0].path === 'login') {
    return {
      consumed: url
    };
  }
  return null;
}

const routes: Routes = [
  {
    matcher: loginMatcher,
    component: GuestLayoutComponent,
    children: [
      { path: '', component: LoginComponent, pathMatch: 'full' },
    ]
  },
  {
    path: 'app-version',
    component: VersionComponent
  },
  {
    path: '',
    redirectTo: '/',
    pathMatch: 'full'
  },
  {
    path: '',
    component: LandingPageLayoutComponent,
    children: [
      { path: '', component: LandingPageComponent, pathMatch: 'full' },
    ]
  },
  {
    path: 'register',
    component: GuestLayoutComponent,
    children: [
      { path: '', component: RegisterComponent, pathMatch: 'full' },
    ]
  },
  {
    path: 'confirm-email/:token',
    component: GuestLayoutComponent,
    children: [
      { path: '', component: ConfirmEmailComponent, pathMatch: 'full' },
    ]
  },
  {
    path: 'home',
    component: UserHomeComponent,
    pathMatch: 'full',
    canActivate: [ActivatedUserGuardService],
    data: {
      drobtinice: null
    }
  },
  {
    path: 'user-profile',
    component: UserDetailComponent,
    pathMatch: 'full',
    canActivate: [ActivatedUserGuardService],
    canDeactivate: [DeactivateGuardService],
    data: {
      drobtinice: null
    }
  },
  {
    path: 'settings',
    redirectTo: 'settings/additional'
  },
  {
    path: 'settings/additional',
    component: SettingsAdditionalComponent,
    pathMatch: 'full',
    canActivate: [SystemOrRegionalAdminGuardService],
    canDeactivate: [DeactivateGuardService],
    data: {
      drobtinice: null
    }
  },
  {
    path: 'settings/types',
    component: SettingsTypesComponent,
    pathMatch: 'full',
    canActivate: [SystemOrRegionalAdminGuardService],
    canDeactivate: [DeactivateGuardService],
    data: {
      drobtinice: null
    }
  },
  {
    path: 'value-chains',
    component: ValueChainListComponent,
    pathMatch: 'full',
    canActivate: [SystemOrRegionalAdminGuardService],
    data: {
      drobtinice: null
    }
  },
  {
    path: 'value-chains/new',
    component: ValueChainDetailComponent,
    pathMatch: 'full',
    canActivate: [SystemOrRegionalAdminGuardService],
    canDeactivate: [DeactivateGuardService],
    data: {
      drobtinice: null
    }
  },
  {
    path: 'value-chains/:id',
    redirectTo: 'value-chains/:id/value-chain'
  },
  {
    path: 'value-chains/:id/value-chain',
    component: ValueChainDetailComponent,
    pathMatch: 'full',
    canActivate: [SystemOrRegionalAdminGuardService],
    canDeactivate: [DeactivateGuardService],
    data: {
      drobtinice: null
    }
  },
  {
    path: 'currencies',
    component: CurrencyListComponent,
    pathMatch: 'full',
    canActivate: [SystemOrRegionalAdminGuardService],
    data: {
      drobtinice: null
    }
  },
  {
    path: 'users',
    component: UserListComponent,
    pathMatch: 'full',
    canActivate: [SystemOrRegionalAdminGuardService],
    data: {
      drobtinice: null
    }
  },
  {
    path: 'users/:id',
    component: UserDetailComponent,
    pathMatch: 'full',
    canActivate: [SystemOrRegionalAdminGuardService],
    canDeactivate: [DeactivateGuardService],
    data: {
      drobtinice: null
    }
  },
  {
    path: 'companies',
    component: CompanyListComponent,
    pathMatch: 'full',
    canActivate: [SystemOrRegionalAdminGuardService],
    data: {
      drobtinice: null
    }
  },
  {
    path: 'companies/new',
    component: CompanyDetailComponent,
    pathMatch: 'full',
    canDeactivate: [DeactivateGuardService],
    data: {
      drobtinice: null
    }
  },
  {
    path: 'companies/:id',
    redirectTo: 'companies/:id/company'
  },
  {
    path: 'companies/:id/company',
    component: CompanyDetailComponent,
    pathMatch: 'full',
    canActivate: [AdminOrCompanyAdminGuardService],
    canDeactivate: [DeactivateGuardService],
    data: {
      drobtinice: null
    }
  },
  {
    path: 'companies/:id/processingActions',
    component: CompanyProcessingActionsComponent,
    pathMatch: 'full',
    canActivate: [CompanyAdminGuardService],
    canDeactivate: [DeactivateGuardService],
    data: {
      drobtinice: null
    }
  },
  {
    path: 'companies/:id/processingActions/new',
    component: CompanyDetailProcessingActionsDetailComponent,
    pathMatch: 'full',
    canActivate: [CompanyAdminGuardService],
    canDeactivate: [DeactivateGuardService],
    data: {
      action: 'new',
      drobtinice: null
    }
  },
  {
  path: 'companies/:id/processingActions/:paId/edit',
    component: CompanyDetailProcessingActionsDetailComponent,
    pathMatch: 'full',
    canActivate: [CompanyAdminGuardService],
    canDeactivate: [DeactivateGuardService],
    data: {
      action: 'edit',
      drobtinice: null
    }
  },
  {
    path: 'companies/:id/users',
    component: CompanyDetailUsersComponent,
    pathMatch: 'full',
    canActivate: [AdminOrCompanyAdminGuardService],
    data: {
      drobtinice: null
    }
  },
  {
    path: 'companies/:id/facilities',
    component: CompanyDetailFacilitiesComponent,
    pathMatch: 'full',
    canActivate: [CompanyAdminGuardService],
    data: {
      drobtinice: null
    }
  },
  {
    path: 'companies/:id/facilities/add',
    component: CompanyDetailFacilityAddComponent,
    pathMatch: 'full',
    canActivate: [CompanyAdminGuardService],
    data: {
      drobtinice: {
        title: '',
        goBack: true
      }
    }
  },
  {
    path: 'companies/:id/facilities/:facilityId/edit',
    component: CompanyDetailFacilityAddComponent,
    pathMatch: 'full',
    canActivate: [CompanyAdminGuardService],
    data: {
      drobtinice: {
        title: '',
        goBack: true
      }
    }
  },
  {
    path: 'my-stock',
    canActivate: [ActivatedUserGuardService],
    loadChildren: () => import('./company/company-stock/company-stock.module').then(m => m.CompanyStockModule)
  },
  {
    path: 'my-orders',
    canActivate: [ActivatedUserGuardService],
    loadChildren: () => import('./company/company-orders/company-orders.module').then(m => m.CompanyOrdersModule)
  },
  {
    path: 'my-farmers',
    canActivate: [ActivatedUserGuardService],
    loadChildren: () => import('./company/company-farmers/company-farmers.module').then(m => m.CompanyFarmersModule)
  },
  {
    path: 'my-collectors',
    canActivate: [ActivatedUserGuardService],
    loadChildren: () => import('./company/company-collectors/company-collectors.module').then(m => m.CompanyCollectorsModule)
  },
  {
    path: 'my-customers',
    canActivate: [ActivatedUserGuardService],
    loadChildren: () => import('./company/company-customers/company-customers.module').then(m => m.CompanyCustomersModule)
  },
  {
    path: 'company-dashboard',
    component: CompanyDashboardComponent,
    pathMatch: 'full',
    canActivate: [ActivatedUserGuardService],
    data: {
      drobtinice: null
    }
  },
  ///////////////////////
  ///////////////////////
  ///////////////////////
  ///////////////////////
  ///////////////////////
  {
    path: 'product-labels',
    canActivate: [ActivatedUserGuardService],
    loadChildren: () => import('./m-product/m-product.module').then(m => m.MProductModule)
  },
  {
    path: 'account-activation',
    component: GuestLayoutComponent,
    children: [
      { path: '', component: RegisterActivationComponent, pathMatch: 'full' },
    ]
  },
  {
    path: 'reset-password',
    component: GuestLayoutComponent,
    children: [
      { path: '', component: ResetPasswordRequestComponent, pathMatch: 'full' },
    ]
  },
  {
    path: 'reset-password/:token',
    component: GuestLayoutComponent,
    children: [
      { path: '', component: ResetPasswordComponent, pathMatch: 'full' },
    ]
  },
  {
    path: 's/cookies',
    component: ProductLabelFrontLayoutComponent,
    children: [
      { path: '', component: CookiesPageComponent, pathMatch: 'full' },
    ],
    data: {
      drobtinice: [
        {
          title: $localize`:@@breadCrumb.cookiesPage.home:Home`,
          route: '/'
        },
        {
          title: $localize`:@@breadCrumb.cookiesPage.cookiePolicy:Cookie policy`,
          route: null
        }
      ]
    }
  },
  {
    path: 's/clear-cookies/:type/:value',
    component: ProductLabelFrontLayoutComponent,
    children: [
      { path: '', component: ClearCookieConsentComponent, pathMatch: 'full' },
    ],
  },
  {
    path: 's/privacy',
    component: ProductLabelFrontLayoutComponent,
    children: [
      { path: '', component: PrivacyPageComponent, pathMatch: 'full' },
    ],
    data: {
      drobtinice: [
        {
          title: $localize`:@@breadCrumb.privacyPage.home:Home`,
          route: '/'
        },
        {
          title: $localize`:@@breadCrumb.privacyPage.privacyPolicy:Privacy policy`,
          route: null
        }
      ]
    }
  },
  {
    path: 's/terms-and-conditions',
    component: ProductLabelFrontLayoutComponent,
    children: [
      { path: '', component: TermsAndConditionsPageComponent, pathMatch: 'full' },
    ],
    data: {
      drobtinice: [
        {
          title: $localize`:@@breadCrumb.termsAndConditionsPage.home:Home`,
          route: '/'
        },
        {
          title: $localize`:@@breadCrumb.termsAndConditionsPage.termsAndConditions:Terms and conditions`,
          route: null
        }
      ]
    }
  },
  {
    path: 'blog/:productId/:type/:knowledgeBlogId',
    component: ProductLabelFrontLayoutComponent,
    children: [
      { path: '', component: KnowledgeBlogFrontComponent, pathMatch: 'full' },
    ],
    data: {
      drobtinice: [
        {
          title: $localize`:@@breadCrumb.KnowledgeBlogFrontComponent.home:Home`,
          route: '/'
        },
        {
          title: $localize`:@@breadCrumb.KnowledgeBlogFrontComponent.knowledgeBlog:Blog`,
          route: null
        }
      ]
    }
  },
  {
    path: 'p-cd',
    loadChildren: () => import('./b2c/b2c.module').then(m => m.B2cModule)
  },
  {
    path: 'q/:uuid',
    component: QrCodeRedirectComponent,
    pathMatch: 'full'
  },
  {
    path: 'q-cd/:uuid/:qrTag',
    component: QrCodeRedirectComponent,
    pathMatch: 'full'
  },
  {
    path: 'p/:uuid',
    component: QrCodeRedirectComponent,
    pathMatch: 'full'
  },
  {
    path: '**',
    component: PageNotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
