import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { generateFormFromMetadata } from 'src/shared/utils';
import { UntypedFormGroup } from '@angular/forms';
import { ApiUserCustomerCooperativeValidationScheme } from '../../company-collectors/company-collectors-details/validation';
import { EnumSifrant } from 'src/app/shared-services/enum-sifrant';
import { GenericEditableItemComponent } from 'src/app/shared/generic-editable-item/generic-editable-item.component';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { ApiUserCustomerCooperative } from '../../../../api/model/apiUserCustomerCooperative';
import UserCustomerTypeEnum = ApiUserCustomerCooperative.UserCustomerTypeEnum;

@Component({
    selector: 'app-producers-item',
    templateUrl: './producers-item.component.html',
    styleUrls: ['./producers-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ProducersItemComponent extends GenericEditableItemComponent<ApiUserCustomerCooperative> implements OnInit {

  @Input()
  disableDelete = false;

  @Input()
  formTitle = null;

  @Input()
  codebookCoop;

  @Input()
  assocCoop;

  @Input()
  type: UserCustomerTypeEnum;

  readonly = false;

  codebookRoles: EnumSifrant;
  private rolesObj = {};

  constructor(
    protected globalEventsManager: GlobalEventManagerService,
    protected router: Router
  ) {
    super(globalEventsManager);
  }

  ngOnInit() {

    this.initRoles();

    if (this.type && this.form.get('userCustomerType') && this.form.get('userCustomerType').value == null) {
      this.form.get('userCustomerType').setValue(this.type);
    }

    if (this.codebookCoop && this.codebookCoop.keys.length === 1) {
      this.form.get('company.id').setValue(this.codebookCoop.keys[0]);
      this.readonly = true;
    }
    this.form.markAsDirty();
  }

  get name() {
    if (this.form.get('company').value && this.form.get('company.name').value && this.form.get('userCustomerType').value) {
      return this.form.get('company.name').value + ', ' + this.rolesObj[this.form.get('userCustomerType').value];
    }
    if (this.form.get('company').value && this.form.get('company.id').value) {
      return this.assocCoop[this.form.get('company.id').value.toString()] + ', ' + this.rolesObj[this.form.get('userCustomerType').value];
    }
  }

  public generateForm(value: any): UntypedFormGroup {
    return generateFormFromMetadata(ApiUserCustomerCooperative.formMetadata(), value, ApiUserCustomerCooperativeValidationScheme);
  }

  initRoles() {

    if (this.type === UserCustomerTypeEnum.FARMER) {
      this.rolesObj['FARMER'] = $localize`:@@collectorDetail.roles.farmer:Farmer`;
    } else {
      this.rolesObj['COLLECTOR'] = $localize`:@@collectorDetail.roles.collector:Collector`;
    }

    this.codebookRoles = EnumSifrant.fromObject(this.rolesObj);
  }

}
