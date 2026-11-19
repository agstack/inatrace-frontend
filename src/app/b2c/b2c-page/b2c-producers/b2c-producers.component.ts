import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { B2cPageComponent } from '../b2c-page.component';
import { ApiBusinessToCustomerSettings } from '../../../../api/model/apiBusinessToCustomerSettings';
import { ApiCompanyDocument } from '../../../../api/model/apiCompanyDocument';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'app-b2c-producers',
    templateUrl: './b2c-producers.component.html',
    styleUrls: ['./b2c-producers.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class B2cProducersComponent implements OnInit {

  b2cSettings: ApiBusinessToCustomerSettings;

  titleFarmers = $localize`:@@frontPage.producers.title.meetFarmers:Meet the farmers`;
  titleCooperative = $localize`:@@frontPage.producers.title.meetCooperative:Meet the cooperative`;

  videoRWurl = null;
  videoMeetTheFarmers;
  picsMeetTheFarmers: ApiCompanyDocument[];
  picsProduction: ApiCompanyDocument[];

  companyName: string = null;
  companyLogo = null;
  companyHeadquarters = null;
  companyAbout: string = null;
  companyEmail: string = null;
  companyNumber: string = null;
  companyPage: string = null;

  coopAbout: string = null;

  email = $localize`:@@frontPage.producers.title.email:Contact E-mail`;
  phone = $localize`:@@frontPage.producers.title.phone:Contact phone number`;
  webPage = $localize`:@@frontPage.producers.title.webPage:Company webpage URL`;
  headquarters = $localize`:@@frontPage.producers.title.headquarters:Company headquarters`;

  companyNameCooperative: string = null;

  lang = 'EN';

  productName = '';

  constructor(
      @Inject(B2cPageComponent) private b2cPage: B2cPageComponent,
      private sanitizer: DomSanitizer
  ) {
    this.b2cSettings = b2cPage.b2cSettings;
  }

  ngOnInit(): void {
    this.init();
  }

  init() {
    for (const item of this.b2cPage.publicProductLabel.fields) {
      if (item.name === 'name') {
        this.productName = item.value;
      }
      if (item.name === 'settings.language') {
        this.lang = item.value;
      }
    }

    if (this.b2cPage.publicProductLabel.videoMeetTheFarmers) {
      this.videoMeetTheFarmers = this.sanitizer.bypassSecurityTrustResourceUrl(this.b2cPage.publicProductLabel.videoMeetTheFarmers.link.replace('youtu.be', 'youtube.com/embed'));
    }
    this.picsMeetTheFarmers = this.b2cPage.publicProductLabel.photosMeetTheFarmers;
    this.picsProduction = this.b2cPage.publicProductLabel.productionRecords;
  }

}
