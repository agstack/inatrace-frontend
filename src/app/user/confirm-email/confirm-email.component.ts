import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map, shareReplay, switchMap, catchError } from 'rxjs/operators';
import { UserControllerService } from 'src/api/api/userController.service';
import { of, Subscription } from 'rxjs';

@Component({
    selector: 'app-confirm-email',
    templateUrl: './confirm-email.component.html',
    styleUrls: ['./confirm-email.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ConfirmEmailComponent implements OnInit, OnDestroy {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userController: UserControllerService
  ) { }

  activationToken$ = this.route.paramMap.pipe(
    map(m => m.get('token')),
    shareReplay(1)
  );

  sub: Subscription;
  ngOnInit(): void {
    this.sub = this.activationToken$.pipe(
      switchMap(token => this.userController.confirmEmail({ token }).pipe(
        catchError(_ => of('_ERROR_'))
      ))
    ).subscribe(resp => {
      if (resp !== '_ERROR_') {
        this.router.navigate(['login']);
      } else {
        // console.log("ACCOUNT NOT CONFIRMED!")
      }
    });
  }
  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

}
