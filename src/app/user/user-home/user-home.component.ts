import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { GlobalEventManagerService } from '../../core/global-event-manager.service';
import { ProductControllerService } from '../../../api/api/productController.service';
import { ApiPaginatedResponseApiProductListResponse } from '../../../api/model/apiPaginatedResponseApiProductListResponse';
import { SelectedUserCompanyService } from '../../core/selected-user-company.service';
import { ApiCompanyGet } from '../../../api/model/apiCompanyGet';
import StatusEnum = ApiPaginatedResponseApiProductListResponse.StatusEnum;
import CompanyRolesEnum = ApiCompanyGet.CompanyRolesEnum;
import { NgbModalImproved } from '../../core/ngb-modal-improved/ngb-modal-improved.service';
import { ApiUserGet } from '../../../api/model/apiUserGet';
import {
  SelfOnboardingWelcomeModalComponent
} from '../self-onboarding-welcome-modal/self-onboarding-welcome-modal.component';
import {
  SelfOnboardingAssistantModalComponent
} from '../self-onboarding-assistant-modal/self-onboarding-assistant-modal.component';
import { SelfOnboardingService } from '../../shared-services/self-onboarding.service';
import {
  ChecklistAddProductSuccessModalComponent
} from '../self-onboarding-checklist-modal/checklist-add-product-success-modal/checklist-add-product-success-modal.component';
import {
  ChecklistAddFacilitySuccessModalComponent
} from "../self-onboarding-checklist-modal/checklist-add-facility-success-modal/checklist-add-facility-success-modal.component";
import {
  ChecklistAddProcessingActionSuccessModalComponent
} from "../self-onboarding-checklist-modal/checklist-add-processing-action-success-modal/checklist-add-processing-action-success-modal.component";
import { CompanyControllerService } from "../../../api/api/companyController.service";
import {
  ChecklistAddFarmersSuccessModalComponent
} from "../self-onboarding-checklist-modal/checklist-add-farmers-success-modal/checklist-add-farmers-success-modal.component";
import { NgbTooltip } from "@ng-bootstrap/ng-bootstrap";
import { Router } from "@angular/router";
import {
  GuidedTourSuccessModalComponent
} from "../self-onboarding-checklist-modal/guided-tour-success-modal/guided-tour-success-modal.component";

@Component({
    selector: 'app-user-home',
    templateUrl: './user-home.component.html',
    styleUrls: ['./user-home.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class UserHomeComponent implements OnInit, OnDestroy, AfterViewInit {

  sub: Subscription;

  private paging$ = new BehaviorSubject(1);
  page = 0;
  pageSize = 10;

  myProductsCount = 0;

  products$ = combineLatest([
    this.paging$
  ]).pipe(
    map(([page]) => {
      return {
        offset: (page - 1) * this.pageSize,
        limit: this.pageSize
      };
    }),
    tap(() => this.globalEventManager.showLoading(true)),
    switchMap(reqParams => this.productControllerService.listProductsByMap(reqParams)),
    map((response: ApiPaginatedResponseApiProductListResponse) => {
      if (response && response.status === StatusEnum.OK) {
        this.myProductsCount = response.data.count;
        return response.data;
      }
    }),
    tap(() => this.globalEventManager.showLoading(false))
  );

  showCollectorsNavButton = false;
  showMyCustomersNavButton = false;

  user: ApiUserGet | null = null;

  @ViewChild('farmersNavButtonTooltip')
  farmersNavButtonTooltip: NgbTooltip;

  @ViewChild('myStockNavButtonTooltip')
  myStockNavButtonTooltip: NgbTooltip;

  constructor(
      private globalEventManager: GlobalEventManagerService,
      private productControllerService: ProductControllerService,
      private selUserCompanyService: SelectedUserCompanyService,
      public authService: AuthService,
      private modalService: NgbModalImproved,
      protected selfOnboardingService: SelfOnboardingService,
      private companyControllerService: CompanyControllerService,
      private router: Router
  ) { }

  ngOnInit(): void {

    this.sub = this.authService.userProfile$
        .pipe(
            switchMap(user => {
              this.user = user;
              return this.selUserCompanyService.selectedCompanyProfile$;
            })
        )
        .subscribe(async company => {

          if (this.user != null && company != null) {

            const addProductStep = await this.selfOnboardingService.addProductCurrentStep$.pipe(take(1)).toPromise();
            const addFacilityStep = await this.selfOnboardingService.addFacilityCurrentStep$.pipe(take(1)).toPromise();
            const addProcessingActionStep = await this.selfOnboardingService.addProcessingActionCurrentStep$.pipe(take(1)).toPromise();
            const addFarmersStep = await this.selfOnboardingService.addFarmersCurrentStep$.pipe(take(1)).toPromise();

            const guidedTourStep = await this.selfOnboardingService.guidedTourStep$.pipe(take(1)).toPromise();

            const companyOnboardingState = await this.companyControllerService.getCompanyOnboardingState(company.id).toPromise();

            if (addProductStep === 'success') {
              this.modalService.open(ChecklistAddProductSuccessModalComponent, {
                centered: true,
                backdrop: 'static',
                keyboard: false,
                size: 'lg'
              });
            } else if (addFacilityStep === 'success') {
              this.modalService.open(ChecklistAddFacilitySuccessModalComponent, {
                centered: true,
                backdrop: 'static',
                keyboard: false,
                size: 'lg'
              });
            } else if (addProcessingActionStep === 'success') {
              this.modalService.open(ChecklistAddProcessingActionSuccessModalComponent, {
                centered: true,
                backdrop: 'static',
                keyboard: false,
                size: 'lg'
              });
            } else if (addFarmersStep === 'success') {
              this.modalService.open(ChecklistAddFarmersSuccessModalComponent, {
                centered: true,
                backdrop: 'static',
                keyboard: false,
                size: 'lg'
              });
            } else if (guidedTourStep === 'success') {
              this.modalService.open(GuidedTourSuccessModalComponent, {
                centered: true,
                backdrop: 'static',
                keyboard: false,
                size: 'lg'
              });
            } else {

              const dismissedOnboardingWelcomeModal = sessionStorage.getItem('dismissedOnboardingWelcomeModal');

              if (companyOnboardingState.data?.hasCreatedProduct == false &&
              companyOnboardingState.data?.hasCreatedFacility == false &&
              companyOnboardingState.data?.hasCreatedProcessingAction == false &&
              companyOnboardingState.data?.hasAddedFarmers == false &&
              dismissedOnboardingWelcomeModal != 'true') {
                const modalRef = this.modalService.open(SelfOnboardingWelcomeModalComponent, {
                  centered: true,
                  backdrop: 'static',
                  keyboard: false,
                  size: 'lg',
                });
                const userProfile = this.user;
                Object.assign(modalRef.componentInstance, {
                  userProfile,
                  companyOnboardingState: companyOnboardingState
                });
              }
            }
          }

          this.showCollectorsNavButton = company?.supportsCollectors;

          company?.companyRoles?.forEach(cr => {
            if (cr === CompanyRolesEnum.BUYER) {
              this.showMyCustomersNavButton = true;
            }
          });
        });
  }

  ngAfterViewInit() {

    this.sub.add(
      this.selfOnboardingService.addFarmersCurrentStep$.subscribe(currentStep => {
        if (currentStep === 1) {
          this.farmersNavButtonTooltip?.open();
        } else {
          this.farmersNavButtonTooltip?.close();
        }
      })
    );

    this.sub.add(
        this.selfOnboardingService.guidedTourStep$.subscribe(step => {
          if (step === 1) {
            this.myStockNavButtonTooltip?.open();
          } else {
            this.myStockNavButtonTooltip?.close();
          }
        })
    );
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  onPageChange(event: number) {
    this.paging$.next(event);
  }

  showPagination() {
    return (this.myProductsCount >= this.pageSize) || this.page > 1;
  }

  openAssistantModal() {

    if (!this.modalService.hasOpenModals()) {
      const modalRef = this.modalService.open(SelfOnboardingAssistantModalComponent, {
        centered: true,
        backdrop: 'static',
        keyboard: false,
        size: 'lg',
      });
      Object.assign(modalRef.componentInstance, {
        userProfile: this.user
      });
    }
  }

  async openMyFarmers() {

    const currentAddFarmerStep = await this.selfOnboardingService.addFarmersCurrentStep$.pipe(take(1)).toPromise();
    if (currentAddFarmerStep === 1) {
      this.selfOnboardingService.setAddFarmersCurrentStep(2);
    }

    this.router.navigate(['/my-farmers']).then();
  }

  continueGuidedTourToMyStock() {
    this.selfOnboardingService.guidedTourNextStep(2);
    this.router.navigate(['/my-stock']).then();
  }

}
