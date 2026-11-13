import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { ProductControllerService } from 'src/api/api/productController.service';
import { AuthService } from 'src/app/core/auth.service';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';

@Component({
    selector: 'app-product-label-left-panel-content',
    templateUrl: './product-label-left-panel-content.component.html',
    styleUrls: ['./product-label-left-panel-content.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ProductLabelLeftPanelContentComponent implements OnInit {

  @Input()
  title: string = $localize`:@@productLabelLeftPanelContent.title:Product`;

  @Input()
  showIcon = true;

  @Input()
  create = false;

  imgStorageKey: string = null;

  productId = this.route.snapshot.params.id;

  @Input()
  changed = false;

  isSystemAdmin = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private globalEventsManager: GlobalEventManagerService,
    private productController: ProductControllerService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {

    this.authService.userProfile$.pipe().subscribe(up => {
      this.isSystemAdmin = up?.role === 'SYSTEM_ADMIN';
    });

    if (this.create) { return; }
    this.preparePhoto().then();
  }

  async preparePhoto() {
    const resp = await this.productController.getProduct(this.productId).pipe(take(1)).toPromise();
    if (resp.status === 'OK' && resp.data && resp.data.photo) {
      this.imgStorageKey = resp.data.photo.storageKey;
    }
  }

  async deleteCurrentProduct() {
    const productId = this.productId;
    const result = await this.globalEventsManager.openMessageModal({
      type: 'warning',
      message: $localize`:@@productLabel.deleteCurrentProduct.warning.message:Are you sure you want to delete the product? This will delete all labels and batches attached to the product as well!`,
      options: { centered: true },
      dismissable: false
    });
    if (result !== 'ok') { return; }
    const res = await this.productController.deleteProduct(productId).pipe(take(1)).toPromise();
    if (res && res.status === 'OK') {
      this.globalEventsManager.push({
        action: 'success',
        notificationType: 'success',
        title: $localize`:@@productLabel.deleteCurrentProduct.success.title:Deleted`,
        message: $localize`:@@productLabel.deleteCurrentProduct.success.message:Product was successfuly deleted`
      });
      this.router.navigate(['/product-labels']).then();
      return;
    }
    this.globalEventsManager.push({
      action: 'error',
      notificationType: 'error',
      title: $localize`:@@productLabel.deleteCurrentProduct.error.title:Error`,
      message: $localize`:@@productLabel.deleteCurrentProduct.error.message:Product cannot be deleted. Please try again.`
    });
  }

  goToProduct() {
    this.router.navigate(['/', 'product-labels']).then();
  }

  goTo(type) {
    return ['/product-labels', this.productId, type];
  }

}
