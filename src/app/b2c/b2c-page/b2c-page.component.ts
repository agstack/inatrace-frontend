import { Component, HostListener, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { take } from 'rxjs/operators';
import { PublicControllerService } from '../../../api/api/publicController.service';
import { ActivatedRoute } from '@angular/router';
import { B2cJourneyComponent } from './b2c-journey/b2c-journey.component';
import { B2CTab } from '../b2c-tabs/b2c-tabs.component';
import { B2cFairPricesComponent } from './b2c-fair-prices/b2c-fair-prices.component';
import { B2cProducersComponent } from './b2c-producers/b2c-producers.component';
import { B2cQualityComponent } from './b2c-quality/b2c-quality.component';
import { B2cFeedbackComponent } from './b2c-feedback/b2c-feedback.component';
import { ApiBusinessToCustomerSettings } from '../../../api/model/apiBusinessToCustomerSettings';
import { ApiProductLabelFieldValue } from '../../../api/model/apiProductLabelFieldValue';
import { ViewportScroller } from '@angular/common';
import { B2cTermsComponent } from './b2c-terms/b2c-terms.component';
import { B2cPrivacyComponent } from './b2c-privacy/b2c-privacy.component';
import { environment } from 'src/environments/environment';
import { ApiProductLabelValuesExtended } from '../../../api/model/apiProductLabelValuesExtended';
import { ApiQRTagPublic } from '../../../api/model/apiQRTagPublic';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-b2c-page',
    templateUrl: './b2c-page.component.html',
    styleUrls: ['./b2c-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class B2cPageComponent implements OnInit {

  uuid = this.route.snapshot.params.uuid;
  qrTag = this.route.snapshot.params.qrTag;

  tab: B2CTab;

  constructor(
      private route: ActivatedRoute,
      private publicController: PublicControllerService,
      private scroll: ViewportScroller
  ) {
    route.url.subscribe({
      next: () => {
        switch (route.snapshot.firstChild.component) {
          case B2cJourneyComponent:
            this.tab = B2CTab.JOURNEY;
            break;
          case B2cFairPricesComponent:
            this.tab = B2CTab.FAIR_PRICES;
            break;
          case B2cProducersComponent:
            this.tab = B2CTab.PRODUCERS;
            break;
          case B2cQualityComponent:
            this.tab = B2CTab.QUALITY;
            break;
          case B2cFeedbackComponent:
            this.tab = B2CTab.FEEDBACK;
            break;
          case B2cTermsComponent:
          case B2cPrivacyComponent:
            this.tab = B2CTab.NONE;
            break;
          default:
            this.tab = undefined;
        }
      }
    });
  }

  loading = true;

  productName: string;

  headerColor: string;
  footerColor: string;

  b2cSettings: ApiBusinessToCustomerSettings;
  publicProductLabel: ApiProductLabelValuesExtended;
  qrProductLabel: ApiQRTagPublic;

  // Social links
  facebook;
  twitter;
  instagram;
  youtube;
  other;

  termsText: string;
  privacyText: string;

  pageYOffset = 0;

  @HostListener('window:scroll', ['$event']) onScroll(event) {
    this.pageYOffset = window.pageYOffset;
  }

  ngOnInit(): void {
    forkJoin([
      this.publicController.getPublicProductLabelValues(this.uuid).pipe(take(1)),
      this.publicController.getQRTagPublicData(this.qrTag, true).pipe(take(1))
    ]).subscribe({
      next: ([label, qrTag]) => {
        this.processFields(label.data.fields);

        this.publicProductLabel = label.data;

        this.b2cSettings = label.data.businessToCustomerSettings;

        if (this.b2cSettings.productFont) {
          const node = document.createElement('style');
          node.innerHTML = `
            @font-face {
              font-family: 'custom-product';
              font-style: normal;
              font-weight: 400;
              src: url(${this.productFontHref});
            }`;
          document.body.appendChild(node);
        }

        if (this.b2cSettings.textFont) {
          const node = document.createElement('style');
          node.innerHTML = `
            @font-face {
              font-family: 'custom-text';
              font-style: normal;
              font-weight: 400;
              src: url(${this.textFontHref});
            }`;
          document.body.appendChild(node);
        }

        this.qrProductLabel = qrTag.data;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  processFields(fields) {
    this.extractName(fields);
    this.extractLinks(fields);
    this.extractTerms(fields);
    this.extractPrivacy(fields);
  }

  extractName(fields: ApiProductLabelFieldValue[]) {
    for (const field of fields) {
      if (field.name === 'name') {
        this.productName = field.value;
        break;
      }
    }
  }

  extractLinks(fields: ApiProductLabelFieldValue[]) {
    for (const field of fields) {
      if (field.name === 'company.mediaLinks.facebook' && field.value) {
        this.facebook = this.checkExternalLink(field.value);
      }
      if (field.name === 'company.mediaLinks.twitter' && field.value) {
        this.twitter = this.checkExternalLink(field.value);
      }
      if (field.name === 'company.mediaLinks.instagram' && field.value) {
        this.instagram = this.checkExternalLink(field.value);
      }
      if (field.name === 'company.mediaLinks.youtube' && field.value) {
        this.youtube = this.checkExternalLink(field.value);
      }
      if (field.name === 'company.mediaLinks.other' && field.value) {
        this.other = this.checkExternalLink(field.value);
      }
    }
  }

  extractTerms(fields: ApiProductLabelFieldValue[]) {
    for (const field of fields) {
      if (field.name === 'settings.termsOfUseText') {
        this.termsText = field.value;
      }
    }
  }

  extractPrivacy(fields: ApiProductLabelFieldValue[]) {
    for (const field of fields) {
      if (field.name === 'settings.privacyPolicyText') {
        this.privacyText = field.value;
      }
    }
  }

  checkExternalLink(link: string): string {
    if (!link) { return '#'; }
    if (!link.startsWith('https://') && !link.startsWith('http://')) {
      return 'http://' + link;
    }
    return link;
  }

  get showScrollToTop() {
    return this.pageYOffset > 0;
  }

  scrollToTop() {
    this.scroll.scrollToPosition([0, 0]);
  }

  get productFontHref() {
    return this.b2cSettings.productFont?.storageKey
      ? `${environment.appBaseUrl}/api/public/document/${this.b2cSettings.productFont.storageKey}`
      : null;
  }

  get textFontHref() {
    return this.b2cSettings.textFont?.storageKey
      ? `${environment.appBaseUrl}/api/public/document/${this.b2cSettings.textFont.storageKey}`
      : null;
  }

}
