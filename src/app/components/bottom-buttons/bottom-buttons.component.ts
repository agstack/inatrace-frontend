import { Component, OnInit, Output, EventEmitter, Input, ChangeDetectionStrategy } from '@angular/core';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { UntypedFormGroup } from '@angular/forms';
import { Location } from '@angular/common';

@Component({
    selector: 'bottom-buttons',
    templateUrl: './bottom-buttons.component.html',
    styleUrls: ['./bottom-buttons.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class BottomButtonsComponent implements OnInit {

  @Input()
  saveButtonLabel: string = $localize`:@@bottomButoms.button.save:Save`

  @Input()
  backButton = true

  @Input()
  downloadButton = false

  @Input()
  updateButton = false

  @Input()
  form: UntypedFormGroup = null

  // Either we use form or fields 'changed' and 'invalid'
  @Input()
  changed = false;

  @Input()
  invalid = false;

  @Input()
  error = false;

  @Input()
  success = false;

  @Input()
  ignoreErrorsOnSave=false

  @Input()
  floatingSave = true

  @Input()
  floatingSaveTitle = $localize`:@@bottomButoms.button.floatingSave:Save`

  @Input()
  floatingValidate = false

  @Input()
  floatingValidateTitle = $localize`:@@bottomButoms.button.floatingValidate:Validation check`

  @Input()
  ignoreOnSubmitDirty = false

  @Input()
  submitTitle: string = $localize`:@@bottomButoms.button.submit:Submit`

  @Input()
  onSubmitMessage: string = $localize`:@@bottomButoms.message.onSubmit:Do you want to submit an application?`

  @Input()
  customBackFn = false; //In case of nested forms, such as product label

  @Output() onBack = new EventEmitter<boolean>();
  @Output() onValidate = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<boolean>();
  @Output() onSubmit = new EventEmitter<boolean>();
  @Output() onDownload = new EventEmitter<boolean>();
  @Output() onUpdate = new EventEmitter<boolean>();

  constructor(
    private globalEventsManager: GlobalEventManagerService,
    private location: Location
  ) { }

  ngOnInit() { }


  isBack() {
    return this.backButton
  }

  backEnabled() {
    return true;
  }

  lastPress = null;

  async back() {
    this.lastPress = 'BACK'
    if (!this.isBack()) return;
    if ((this.form && this.form.dirty) || (!this.form && this.changed)) {
      const result = await this.globalEventsManager.openMessageModal({
        type: 'warning',
        title: $localize`:@@bottomButoms.back.error.title:Changes not saved!`,
        message: $localize`:@@bottomButoms.back.error.message:The form contains unsaved changes that will be discarded.`,
        options: { centered: true },
        dismissable: false,
        buttonTitles: { ok: 'Discard change', cancel: 'Go back' }
      });
      if (result !== "ok") return;
    }
    if (this.customBackFn) this.onBack.next(true)
    else this.location.back()
  }

  isValidate() {
    return this.onValidate.observers.length > 0 && ((this.form && this.form.enabled === true) || !this.form);
  }

  validateEnabled() {
    if(!this.isValidate()) return false;
    // if(this.form && this.form.dirty) return false;
    return true;
  }

  validate() {
    this.lastPress = 'VALIDATE'
    if(!this.isValidate()) return;
    // if(this.form && this.form.dirty) {
    //   this.globalEventsManager.push(
    //     {
    //         action: 'error',
    //         notificationType: 'warning' ,
    //         title: "Shranite!",
    //         message: "Prosimo, da najprej shranite podatke."
    //       }
    //   )
    // } else

    if((this.form && this.form.invalid) || (!this.form && this.invalid)) {
      this.globalEventsManager.push(
        {
            action: 'error',
            notificationType: 'error' ,
            title: $localize`:@@bottomButoms.validate.error.title:Invalid or missing input!`,
            message: $localize`:@@bottomButoms.validate.error.message:Check and correct the input`
          }
      )
    }
    this.onValidate.next(true)
  }

  isSubmit() {
    return this.onSubmit.observers.length > 0 && ((this.form && this.form.enabled === true) || !this.form)
  }

  submitEnabled() {
    return !this.form || (this.form && (this.ignoreOnSubmitDirty || !this.form.dirty) && this.form.valid === true)
  }

  async submit() {
    this.lastPress = 'SUBMIT'
    if(!this.isSubmit()) return;
    if(((this.form && this.form.dirty) || (!this.form && this.changed)) && !this.ignoreOnSubmitDirty) {
      this.globalEventsManager.push(
        {
            action: 'error',
            notificationType: 'warning' ,
            title: $localize`:@@bottomButoms.submit.warning.title:Save the data!`,
            message: $localize`:@@bottomButoms.submit.warning.message:Please, save the data before continuing`
          }
      )
    } else if((this.form && this.form.invalid) || (!this.form && this.invalid)) {
      this.globalEventsManager.push(
        {
            action: 'error',
            notificationType: 'error' ,
            title: $localize`:@@bottomButoms.submit.error.title:Invalid or missing input!`,
            message: $localize`:@@bottomButoms.submit.error.message:Check and correct the input`
          }
      )
    } else if (!this.ignoreOnSubmitDirty) {
      const result = await this.globalEventsManager.openMessageModal({
          type: 'warning',
          message: this.onSubmitMessage
      });
      if (result !== "ok") return;
    }
    this.onSubmit.next(true)
  }

  isSave() {
    return this.onSave.observers.length > 0 && ((this.form && this.form.enabled === true) || !this.form);
  }

  saveEnabled() {
    return (this.form && this.form.dirty) || (!this.form && this.changed)
  }

  save() {
    // console.log("SV", this.form, this.changed)
    this.lastPress = 'SAVE'
    if(!this.isSave()) return;
    if((this.form && !this.form.dirty) || (!this.form && !this.changed)) return;
    this.onSave.next(true)
  }

  isDownload() {
    return this.downloadButton && ((this.form && this.form.enabled === false) || !this.form);
  }

  downloadEnabled() {
    return this.downloadButton && ((this.form && this.form.enabled === false) || !this.form);
  }

  download() {
    this.lastPress = 'DOWNLOAD'
    if(!this.isDownload()) return;
    this.onDownload.next(true)
  }

  isUpdate() {
    return this.updateButton && ((this.form && this.form.enabled === false) || !this.form);
  }

  updateEnabled() {
    return this.updateButton && ((this.form && this.form.enabled === false) || !this.form);
  }

  update() {
    this.lastPress = 'UPDATE'
    if(!this.isUpdate()) return;
    this.onUpdate.next(true)
  }
}
