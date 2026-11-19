import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PublicControllerService } from 'src/api/api/publicController.service';
import { environment } from 'src/environments/environment';
import { take } from 'rxjs/operators';
import { ApiLogRequest } from 'src/api/model/apiLogRequest';

@Component({
    selector: 'app-qr-code-redirect',
    templateUrl: './qr-code-redirect.component.html',
    styleUrls: ['./qr-code-redirect.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class QrCodeRedirectComponent implements OnInit {

  private static readonly EMPTY_QR_TAG = 'EMPTY';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private publicController: PublicControllerService
  ) { }

  ngOnInit(): void {

    const labelId = this.route.snapshot.paramMap.get('uuid');
    const urlA = this.router.url.split('/');
    if (urlA.length >= 2) {
      if (urlA[1] === 'q-cd') {
        const qrTag = this.route.snapshot.paramMap.get('qrTag');
        this.router.navigate(['p-cd', labelId, qrTag], { replaceUrl: true }).then();
      }
      if (urlA[1] === 'q' || urlA[1] === 'p') {
        this.router.navigate(['p-cd', labelId, QrCodeRedirectComponent.EMPTY_QR_TAG], { replaceUrl: true }).then();
      }
    }

    this.publicController
      .logPublicRequest({ token: environment.tokenForPublicLogRoute, type: ApiLogRequest.TypeEnum.VISITQR, logKey: labelId })
      .pipe(take(1))
      .toPromise().then();
  }

}
