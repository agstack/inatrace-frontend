import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { AuthService } from 'src/app/core/auth.service';

@Component({
    selector: 'app-landing-page-top-nav',
    templateUrl: './landing-page-top-nav.component.html',
    styleUrls: ['./landing-page-top-nav.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class LandingPageTopNavComponent implements OnInit, OnDestroy {

  showNavButtons$: BehaviorSubject<boolean>;

  public userProfile;

  constructor(
    public authService: AuthService
  ) { }

  subUserProfile: Subscription;

  ngOnInit(): void {

    this.showNavButtons$ = new BehaviorSubject<boolean>(false);

    this.subUserProfile = this.authService.userProfile$.subscribe(val => {
      this.userProfile = val;
    });
  }

  toggleNavButtons(): void {
    this.showNavButtons$.next(!this.showNavButtons$.value);
  }

  ngOnDestroy() {
    if (this.subUserProfile) { this.subUserProfile.unsubscribe(); }
  }
}
