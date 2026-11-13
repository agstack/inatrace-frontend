import { Component, OnInit, Input, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { faBars} from '@fortawesome/free-solid-svg-icons';
import { Router, ActivatedRoute } from '@angular/router';
import { UnsubscribeList } from 'src/shared/rxutils';
import { switchMap, take } from 'rxjs/operators';
import { AboutAppInfoService } from 'src/app/about-app-info.service';
import { AuthService } from 'src/app/core/auth.service';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { ProductControllerService } from 'src/api/api/productController.service';
import { ApiUserGet } from '../../../api/model/apiUserGet';
import { SelectedUserCompanyService } from '../../core/selected-user-company.service';

@Component({
    selector: 'app-user-box',
    templateUrl: './user-box.component.html',
    styleUrls: ['./user-box.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class UserBoxComponent implements OnInit, OnDestroy {

  userDisplayName: string | null = null;
  companyDisplayName: string | null = null;

  private companyId: string | null = null;
  productId = this.route.snapshot.params.id;

  faBars = faBars;

  isAdmin = false;
  isCompanyAdmin = false;

  showProductNav = false;
  showSystemNav = false;

  showProductStakeholdersTabs = false;

  showSettingsTabs = false;
  showCompaniesTabs = false;

  constructor(
    private route: ActivatedRoute,
    public authService: AuthService,
    private router: Router,
    private aboutAppInfoService: AboutAppInfoService,
    private globalEventManager: GlobalEventManagerService,
    private productController: ProductControllerService,
    private selUserCompanyService: SelectedUserCompanyService
  ) { }

  unsubscribeList = new UnsubscribeList();

  ngOnInit(): void {

    this.showProductNav = this.router.url.startsWith('/product-labels/');

    this.showSystemNav =
      this.router.url.startsWith('/companies') ||
      this.router.url.startsWith('/users') ||
      this.router.url.startsWith('/settings') ||
      this.router.url.startsWith('/value-chains') ||
      this.router.url.startsWith('/currencies');

    this.showProductStakeholdersTabs = this.router.url.startsWith(`/product-labels/${this.productId}/stakeholders`);

    this.showSettingsTabs = this.router.url.startsWith('/settings/');
    this.showCompaniesTabs = this.router.url.startsWith('/companies/');

    let user: ApiUserGet | null = null;
    this.unsubscribeList.add(
      this.authService.userProfile$
        .pipe(
          switchMap(userProfile => {
            user = userProfile;
            return this.selUserCompanyService.selectedCompanyProfile$;
          })
        )
        .subscribe(companyProfile => {

          if (user) {
            this.isAdmin = 'SYSTEM_ADMIN' === user.role;
            this.userDisplayName = user.name;

            if (companyProfile) {
              this.isCompanyAdmin = user.companyIdsAdmin.includes(companyProfile.id);
              this.companyId = String(companyProfile.id);
              this.companyDisplayName = companyProfile.name;
            }
          }
        })
    );
  }

  ngOnDestroy() {
    this.unsubscribeList.cleanup();
  }

  logout() {
    this.authService.logout().then();
  }

  aboutUser() {
    this.router.navigate(['user-profile'], {queryParams: {returnUrl: this.router.routerState.snapshot.url}}).then();
   }

  companyProfile() {
    if (!this.companyId) { return; }
    this.router.navigate(['companies', this.companyId, 'company']).then();
  }

  aboutApp() {
    this.aboutAppInfoService.openAboutApp();
  }

  goTo(type) {
    const arr = type.split('/');
    return this.router.navigate(['/product-labels', this.productId].concat(arr));
  }

  async deleteCurrentProduct() {

    const productId = this.productId;
    const result = await this.globalEventManager.openMessageModal({
      type: 'warning',
      message: $localize`:@@productLabel.deleteCurrentProduct.warning.message:Are you sure you want to delete the product? This will delete all labels and batches attached to the product as well!`,
      options: { centered: true },
      dismissable: false
    });
    if (result !== 'ok') { return; }
    const res = await this.productController.deleteProduct(productId).pipe(take(1)).toPromise();
    if (res && res.status === 'OK') {
      this.globalEventManager.push({
        action: 'success',
        notificationType: 'success',
        title: $localize`:@@productLabel.deleteCurrentProduct.success.title:Deleted`,
        message: $localize`:@@productLabel.deleteCurrentProduct.success.message:Product was successfuly deleted`
      });
      this.router.navigate(['/product-labels']).then();
      return;
    }
    this.globalEventManager.push({
      action: 'error',
      notificationType: 'error',
      title: $localize`:@@productLabel.deleteCurrentProduct.error.title:Error`,
      message: $localize`:@@productLabel.deleteCurrentProduct.error.message:Product cannot be deleted. Please try again.`
    });
  }

  goToCompany(type) {
    const companyId = this.route.snapshot.params.id;
    return this.router.navigate(['/companies', companyId, type]);
  }

}
