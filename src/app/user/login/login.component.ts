import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { EmailValidator } from 'src/shared/validation';
import { ActivatedRoute } from '@angular/router';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { BehaviorSubject } from 'rxjs';
import { ApiResponseApiUser } from 'src/api/model/apiResponseApiUser';
import { AuthService } from '../../core/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class LoginComponent implements OnInit {

  submitted = false;

  loginErrorStatus$: BehaviorSubject<string>;
  userProfile: ApiResponseApiUser;

  loginForm = new UntypedFormGroup({
    username: new UntypedFormControl(null, [Validators.required, EmailValidator()]),
    password: new UntypedFormControl(null, Validators.required),
  });

  constructor(
    protected globalEventsManager: GlobalEventManagerService,
    private route: ActivatedRoute,
    private authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.loginErrorStatus$ = new BehaviorSubject<string>('');
  }

  login() {
    this.submitted = true;
    if (this.loginForm.invalid) { return; }
    let goTo = this.route.snapshot.url.slice(1).map(x => x.path);
    if (goTo.length === 0) {
        goTo = ['home'];
    }
    this.authService.login(this.loginForm.get('username').value, this.loginForm.get('password').value, goTo);
  }

}
