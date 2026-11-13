import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { B2cPageComponent } from '../b2c-page.component';
import { Router } from '@angular/router';
import { ApiBusinessToCustomerSettings } from '../../../../api/model/apiBusinessToCustomerSettings';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-b2c-intro',
    templateUrl: './b2c-intro.component.html',
    styleUrls: ['./b2c-intro.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class B2cIntroComponent implements OnInit {

  uuid: string;
  qrTag: string;
  b2cSettings: ApiBusinessToCustomerSettings;
  appBaseUrl: string;

  constructor(
      @Inject(B2cPageComponent) private b2cPage: B2cPageComponent,
      private router: Router
  ) {
    this.uuid = b2cPage.uuid;
    this.qrTag = b2cPage.qrTag;
    this.b2cSettings = b2cPage.b2cSettings;
    this.appBaseUrl = environment.appBaseUrl;
  }

  productName: string;

  ngOnInit(): void {
    this.productName = this.b2cPage.productName;
  }

  openJourney() {
    this.router.navigate(['/', 'p-cd', this.uuid, this.qrTag, 'journey']);
  }

  get landingPageImage() {
    return this.appBaseUrl + '/api/public/document/' + this.b2cSettings.landingPageImage.storageKey;
  }

  get landingPageBackgroundImage() {
    if (this.b2cSettings.landingPageBackgroundImage) {
      return this.appBaseUrl + '/api/public/document/' + this.b2cSettings.landingPageBackgroundImage.storageKey;
    }
    return undefined;
  }

}
