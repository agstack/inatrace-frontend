import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { CompanyControllerService } from 'src/api/api/companyController.service';
import { ApiCompanyUser } from 'src/api/model/apiCompanyUser';
import { generateFormFromMetadata } from 'src/shared/utils';
import { ApiCompanyUserValidationScheme } from '../company-detail/validation';
import { EnumSifrant } from '../../shared-services/enum-sifrant';
import { UsersService } from '../../shared-services/users.service';
import { GenericEditableItemComponent } from '../../shared/generic-editable-item/generic-editable-item.component';
import { GlobalEventManagerService } from '../../core/global-event-manager.service';
import { ApiCompanyActionRequest } from '../../../api/model/apiCompanyActionRequest';
import { AuthService } from '../../core/auth.service';

@Component({
    selector: 'app-company-user-role',
    templateUrl: './company-user-role.component.html',
    styleUrls: ['./company-user-role.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CompanyUserRoleComponent extends GenericEditableItemComponent<ApiCompanyUser> implements OnInit {

  constructor(
    protected globalEventsManager: GlobalEventManagerService,
    protected router: Router,
    public userSifrant: UsersService,
    private companyController: CompanyControllerService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {
    super(globalEventsManager);
  }
  @Input()
  disableDelete = false;

  @Input()
  formTitle = null;

  @Input()
  readonly = false;

  userForm = new UntypedFormControl(null, Validators.required);

  codebookRoles = EnumSifrant.fromObject(this.roles);

  ngOnInit() {
    if (this.contentObject && this.contentObject.name) {
      this.userForm.setValue(this.contentObject);
    }
  }

  public generateForm(value: any): UntypedFormGroup {
    return generateFormFromMetadata(ApiCompanyUser.formMetadata(), value, ApiCompanyUserValidationScheme);
  }

  setUser($event) {
    if ($event) {
      const role = this.form.get('companyRole').value;
      const data = { ...$event, companyRole: role };
      this.form.setValue(data);
    }
  }

  get roles() {
    const obj = {};
    obj['ACCOUNTANT'] = $localize`:@@companyUserRole.roles.accountant:Accountant`;
    obj['MANAGER'] = $localize`:@@companyUserRole.roles.manager:Manager`;
    obj['COMPANY_USER'] = $localize`:@@companyUserRole.roles.companyUser:Company user`;
    obj['COMPANY_ADMIN'] = $localize`:@@companyUserRole.roles.companyAdmin:Company admin`;
    return obj;
  }

  async firstSendToServer() {

    this.submitted = true;
    if (this.form && this.form.value && this.form.value.id && this.form.value.companyRole) {
      const id = this.route.snapshot.params.id;
      if (this.contentObject && !this.contentObject.name) {

        // Adding new user to the company
        const resAdd = await this.companyController.executeCompanyAction('ADD_USER_TO_COMPANY', {companyId: id, userId: this.form.value.id}).pipe(take(1)).toPromise();
        if (resAdd.status === 'OK') {
          const resSet = await this.companyController.executeCompanyAction('SET_USER_COMPANY_ROLE',
            {companyId: id, userId: this.form.value.id, companyUserRole: this.form.value.companyRole}).pipe(take(1)).toPromise();
          if (resSet.status === 'OK') {
            this.submitted = false;
            this.save();
            this.reloadPageIfLoggedInUser(this.form.value.id);
          }
        }
      } else {
        const res = await this.companyController.executeCompanyAction('SET_USER_COMPANY_ROLE',
          {companyId: id, userId: this.form.value.id, companyUserRole: this.form.value.companyRole}).pipe(take(1)).toPromise();
        if (res.status === 'OK') {
          this.submitted = false;
          this.save();
          this.reloadPageIfLoggedInUser(this.form.value.id);
        }
      }
    }
  }

  async delete() {
    if (this.listEditorManager && this.listEditorManagerPosition != null) {
      const companyId = this.route.snapshot.params.id;

      const removeRequest: ApiCompanyActionRequest = {
        companyId,
        userId: this.form.value.id
      };

      const res = await this.companyController.executeCompanyAction('REMOVE_USER_FROM_COMPANY', removeRequest).pipe(take(1)).toPromise();

      if (res && res.status === 'OK') {
        this.listEditorManager.delete(this.listEditorManagerPosition);
        this.reloadPageIfLoggedInUser(this.form.value.id);
      }
    }
  }

  private reloadPageIfLoggedInUser(userId: number) {
    this.authService.userProfile$.pipe(take(1)).subscribe(userProfile => {
      if (userProfile.id === userId) {
        window.location.reload();
      }
    });
  }

}
