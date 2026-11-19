import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { B2cPageComponent } from '../b2c-page.component';
import { ApiBusinessToCustomerSettings } from '../../../../api/model/apiBusinessToCustomerSettings';
import { take } from 'rxjs/operators';
import { PublicControllerService } from '../../../../api/api/publicController.service';
import { ApiCertification } from '../../../../api/model/apiCertification';

@Component({
    selector: 'app-b2c-quality',
    templateUrl: './b2c-quality.component.html',
    styleUrls: ['./b2c-quality.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class B2cQualityComponent implements OnInit {

  b2cSettings: ApiBusinessToCustomerSettings;

  title = $localize`:@@frontPage.quality.title:Quality and Certificates`;

  flavourProfileTitle = $localize`:@@frontPage.quality.flavourProfile:Flavor profile`;
  flavourProfile: string | null = null;

  roastingProfileTitle = $localize`:@@frontPage.quality.roastingProfile:Roasting profile`;
  roastingProfile: string | null = null;

  certificatesSectionTitle = $localize`:@@frontPage.quality.certificates:Certificates`;
  certificates: ApiCertification[] = [];

  lang = 'EN';

  grade = null;
  gradeHeight = 160;

  qualityChartLabel = $localize`:@@frontPage.quality.chart.label1:80 points = specialty coffee`;

  productName = '';

  constructor(
      @Inject(B2cPageComponent) private b2cPage: B2cPageComponent,
      private publicController: PublicControllerService
  ) {
    this.b2cSettings = b2cPage.b2cSettings;
  }

  ngOnInit(): void {

    this.prepareCertificatesDataAndCharts();

    // Calculate grade if cupping score is available
    if (this.b2cPage.qrProductLabel?.cuppingScore) {
      this.grade = this.b2cPage.qrProductLabel.cuppingScore;
      this.gradeHeight = 2 * this.grade;
    }

    // Set flavour profile if available
    if (this.b2cPage.qrProductLabel?.cuppingFlavour) {
      this.flavourProfile = this.b2cPage.qrProductLabel.cuppingFlavour;
    }

    // Set roasting profile if available
    if (this.b2cPage.qrProductLabel?.roastingProfile) {
      this.roastingProfile = this.b2cPage.qrProductLabel.roastingProfile;
    }
  }

  prepareCertificatesDataAndCharts() {

    for (const item of this.b2cPage.publicProductLabel.fields) {
      if (item.name === 'name') {
        this.productName = item.value;
      }
      if (item.name === 'settings.language') {
        this.lang = item.value;
      }
    }

    this.certificates = this.b2cPage.qrProductLabel?.certificates ?? [];
  }

  async downloadCert(data) {

    const res = await this.publicController.getPublicDocument(data.storageKey).pipe(take(1)).toPromise();
    if (res) {
      const a = document.createElement('a');
      const blobURL = URL.createObjectURL(res);
      a.download = data.name;
      a.href = blobURL;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

}
