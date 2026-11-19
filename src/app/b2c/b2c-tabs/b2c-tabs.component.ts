import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { ApiBusinessToCustomerSettings } from '../../../api/model/apiBusinessToCustomerSettings';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-b2c-tabs',
    templateUrl: './b2c-tabs.component.html',
    styleUrls: ['./b2c-tabs.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class B2cTabsComponent implements OnInit {

  constructor(
      private router: Router
  ) {
    this.appBaseUrl = environment.appBaseUrl;
  }

  appBaseUrl: string;

  tabEnum = B2CTab;

  @Input()
  tab: B2CTab;

  @Input()
  productName: string;

  @Input()
  uuid: string;

  @Input()
  qrTag: string;

  @Input()
  b2cSettings: ApiBusinessToCustomerSettings;

  tabList: B2CTab[] = [];

  ngOnInit(): void {
    this.generateTabList();
  }

  goTo(target: B2CTab) {
    this.router.navigate(['/', 'p-cd', this.uuid, this.qrTag, target]).then();
  }

  get headerBackgroundImage() {
    if (this.b2cSettings.headerBackgroundImage) {
      return this.appBaseUrl + '/api/public/document/' + this.b2cSettings.headerBackgroundImage.storageKey;
    }
    return undefined;
  }

  generateTabList() {
    const tempTabList: {number: number, tab: B2CTab}[] = [];
    if (this.b2cSettings.tabFairPrices) {
      tempTabList.push({number: this.b2cSettings.orderFairPrices, tab: B2CTab.FAIR_PRICES});
    }
    if (this.b2cSettings.tabProducers) {
      tempTabList.push({number: this.b2cSettings.orderProducers, tab: B2CTab.PRODUCERS});
    }
    if (this.b2cSettings.tabQuality) {
      tempTabList.push({number: this.b2cSettings.orderQuality, tab: B2CTab.QUALITY});
    }
    if (this.b2cSettings.tabFeedback) {
      tempTabList.push({number: this.b2cSettings.orderFeedback, tab: B2CTab.FEEDBACK});
    }

    tempTabList.sort((a, b) => a.number - b.number);

    this.tabList = tempTabList.map(value => value.tab);
  }

}

export enum B2CTab {
  NONE = 'none',
  JOURNEY = 'journey',
  FAIR_PRICES = 'fair-prices',
  PRODUCERS = 'producers',
  QUALITY = 'quality',
  FEEDBACK = 'feedback'
}
