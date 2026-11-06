import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { StockCoreTabComponent } from '../../stock-core/stock-core-tab/stock-core-tab.component';
import { ActivatedRoute, Router } from '@angular/router';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { FacilityControllerService } from '../../../../../api/api/facilityController.service';
import { ApiPayment } from '../../../../../api/model/apiPayment';
import { take } from 'rxjs/operators';
import { PaymentControllerService } from '../../../../../api/api/paymentController.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';
import { NgbModalImproved } from '../../../../core/ngb-modal-improved/ngb-modal-improved.service';
import { StockPaymentsSelectorForNewPaymentModalComponent } from '../stock-payments-selector-for-new-payment-modal/stock-payments-selector-for-new-payment-modal.component';
import { AuthService } from '../../../../core/auth.service';
import { CompanyControllerService } from '../../../../../api/api/companyController.service';
import { FileSaverService } from 'ngx-filesaver';
import { SelectedUserCompanyService } from '../../../../core/selected-user-company.service';
import { SelfOnboardingService } from '../../../../shared-services/self-onboarding.service';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-stock-payments-tab',
  templateUrl: './stock-payments-tab.component.html',
  styleUrls: ['./stock-payments-tab.component.scss']
})
export class StockPaymentsTabComponent extends StockCoreTabComponent implements OnInit, OnDestroy, AfterViewInit {

  rootTab = 2;

  showedPayments = 0;
  allPayments = 0;
  showedBulkPayments = 0;
  allBulkPayments = 0;

  // currency code
  currency: string;

  confirmingPayments = false;

  reloadPaymentPingList$ = new BehaviorSubject<boolean>(false);

  searchFarmerNameAndSurname = new FormControl(null);
  searchFarmerNameSurnamePing$ = new BehaviorSubject<string>(null);

  subs: Subscription;

  @ViewChild('paymentsTitleTooltip')
  paymentsTitleTooltip: NgbTooltip;

  @ViewChild('addPaymentButtonTooltip')
  addPaymentButtonTooltip: NgbTooltip;

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected globalEventManager: GlobalEventManagerService,
      protected modalService: NgbModalImproved,
      protected facilityControllerService: FacilityControllerService,
      protected authService: AuthService,
      protected companyController: CompanyControllerService,
      private paymentControllerService: PaymentControllerService,
      private fileSaverService: FileSaverService,
      protected selUserCompanyService: SelectedUserCompanyService,
      protected selfOnboardingService: SelfOnboardingService
  ) {
    super(router, route, globalEventManager, facilityControllerService, authService, companyController, selUserCompanyService);
  }

  async ngOnInit(): Promise<void> {

    await super.ngOnInit();

    if (this.companyProfile) {
      this.currency = this.companyProfile.currency.code;
    }
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();

    this.subs = this.selfOnboardingService.guidedTourStep$.subscribe(step => {

      setTimeout(() => {
        this.paymentsTitleTooltip.close();
        this.addPaymentButtonTooltip.close();
      }, 50);

      if (step === 8) {
        setTimeout(() => this.paymentsTitleTooltip.open(), 50);
      } else if (step === 9) {
        setTimeout(() => this.addPaymentButtonTooltip.open(), 50);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subs) {
      this.subs.unsubscribe();
    }
  }

  async newPayment() {
    const modalRef = this.modalService.open(StockPaymentsSelectorForNewPaymentModalComponent, {centered: true});
    Object.assign(modalRef.componentInstance, {
      companyId: this.companyId,
    });
    const stockOrder = await modalRef.result;
    if (stockOrder) {
      await this.router.navigate(['my-stock', 'payments', 'delivery', stockOrder.id, 'new']);
    }
  }

  searchPaymentByFarmerNameInput(event) {
    this.searchFarmerNameSurnamePing$.next(event);
  }

  async confirmPayments(){
    if (this.confirmingPayments || !this.selectedPayments || this.selectedPayments.length === 0) {
      return;
    }
    this.confirmingPayments = true;
    let confirmed = 0;
    try {
      const result = await this.globalEventManager.openMessageModal({
        type: 'warning',
        message: $localize`:@@productLabelPayments.confirmPayments.error.message:Are you sure you want to confirm payments?`,
        options: { centered: true }
      });
      if (result !== 'ok') {
        return;
      }

      for (const payment of [...this.selectedPayments]) {
        // A copy: the rows keep showing UNCONFIRMED until the backend accepted each one.
        const payload: ApiPayment = { ...payment, paymentStatus: ApiPayment.PaymentStatusEnum.CONFIRMED };
        delete (payload as any).selected;

        const res = await this.paymentControllerService.createOrUpdatePayment(payload)
            .pipe(take(1))
            .toPromise();

        if (!res || res.status !== 'OK') {
          throw new Error('The payment could not be confirmed');
        }
        confirmed++;
      }
      this.reloadPage();
      this.selectedPayments = [];
      this.selectedIdsChanged(this.selectedPayments);
    } catch (e) {
      // Show what really happened: the ones already confirmed stay confirmed.
      if (confirmed > 0) {
        this.reloadPage();
      }
      this.selectedPayments = [];
      this.selectedIdsChanged(this.selectedPayments);
      this.globalEventManager.push({
        action: 'error',
        notificationType: 'error',
        title: $localize`:@@frontPage.feedback.error.title:Something went wrong`,
        message: $localize`:@@productLabelPayments.confirmPayments.partial.error.toast:Some selected payments could not be confirmed. Please check the list and try again.`
      });
    } finally {
      this.confirmingPayments = false;
    }
  }

  async exportPaymentsExcel(): Promise<void> {

    this.globalEventManager.showLoading(true);
    try {
      const res = await this.paymentControllerService.exportPaymentsByCompany(this.companyId)
          .pipe(take(1))
          .toPromise();

      this.fileSaverService.save(res, 'payments.xlsx');
    } finally {
      this.globalEventManager.showLoading(false);
    }
  }

  async exportBulkPaymentsExcel(): Promise<void> {

    const res = await this.paymentControllerService.exportBulkPaymentsByCompany(this.companyId)
        .pipe(take(1))
        .toPromise();

    this.fileSaverService.save(res, 'bulk_payments.xlsx');
  }

  onShowPayments(event) {
    this.showedPayments = event;
  }

  onCountAllPayments(event) {
    this.allPayments = event;
  }

  onShowBulkPayments(event) {
    this.showedBulkPayments = event;
  }

  onCountAllBulkPayments(event) {
    this.allBulkPayments = event;
  }

  reloadPage() {
    this.reloadPaymentPingList$.next(true);
  }

  continueGuidedTourToAllStock() {
    this.selfOnboardingService.guidedTourNextStep(10);
    this.router.navigate(['my-stock', 'all-stock']).then();
  }

}
