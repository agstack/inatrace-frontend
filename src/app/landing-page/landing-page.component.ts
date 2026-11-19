import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ApiLogRequest } from 'src/api/model/apiLogRequest';
import { PublicControllerService } from 'src/api/api/publicController.service';
import { take } from 'rxjs/operators';

@Component({
    selector: 'app-landing-page',
    templateUrl: './landing-page.component.html',
    styleUrls: ['./landing-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class LandingPageComponent implements OnInit {

  appName: string = environment.appName;
  constructor(
    private publicController: PublicControllerService
  ) { }

  ngOnInit(): void {
    this.publicController
      .logPublicRequest({token: environment.tokenForPublicLogRoute, type: ApiLogRequest.TypeEnum.LANDINGPAGE})
      .pipe(take(1)).toPromise().then();
  }

}
