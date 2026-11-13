import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormGroup, ValidationErrors, UntypedFormControl, Validators } from '@angular/forms';
import { multiFieldValidator } from 'src/shared/validation';
import { ActivatedRoute, Router } from '@angular/router';
import { UserControllerService } from 'src/api/api/userController.service';
import { BehaviorSubject } from 'rxjs';
import { GlobalEventManagerService } from '../../core/global-event-manager.service';

@Component({
    selector: 'app-reset-password',
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ResetPasswordComponent implements OnInit {

  passwordsDoNotMatch(group: UntypedFormGroup): ValidationErrors | null {
    const password = group && group.value && group.value.password
    const confirmPassword = group && group.value && group.value.confirmPassword
    if (!password && !confirmPassword) return null
    return password === confirmPassword
      ? null
      : { doNotMatch: true }
  }

  form = new UntypedFormGroup({
    password: new UntypedFormControl(null, [Validators.required, Validators.minLength(8)]),
    confirmPassword: new UntypedFormControl(null, [Validators.required, Validators.minLength(8)])
  }, [multiFieldValidator(['confirmPassword'], this.passwordsDoNotMatch.bind(this), ['doNotMatch'])])

  submitted: boolean = false;
  _resetPassErrorStatus$: BehaviorSubject<string>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userController: UserControllerService,
    protected globalEventsManager: GlobalEventManagerService
  ) { }

  ngOnInit(): void {
    this._resetPassErrorStatus$ = new BehaviorSubject<string>("");
  }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) return
    this.globalEventsManager.showLoading(true);
    this.route.params.subscribe(params => {
      this.userController.resetPassword({ token: params.token, password: this.form.get('password').value})
        .subscribe(val => {
          this.router.navigate(['home']);
          this.globalEventsManager.showLoading(false);
        },
          error => {
            this._resetPassErrorStatus$.next(error.error.status);
            this.globalEventsManager.showLoading(false);
          }
        )
    });
  }

  toLogin(): void {
    this.router.navigate(['login']);
  }
}
