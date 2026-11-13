import { Injectable } from '@angular/core';
// import { I18n } from '@ngx-translate/i18n-polyfill';

export type MessageType = 'general' | 'question' | 'info' | 'warning' | 'error';

export type MessageResultType = 'ok' | 'cancel';

export type MessageButtonStringDict = Record<MessageResultType, string>;

@Injectable({
    providedIn: 'root'
})
export class MessageModalLabelsService {
    constructor(
      // private i18n: I18n
    ) { }

    public buttons: MessageButtonStringDict = {
      ok: $localize`:@@messageModalLabels.button.ok:Confirm`, //this.i18n({ value: 'Potrdi', id: 'messageModal.buttons.ok', meaning: 'message dialog ok button text' }),
      cancel: $localize`:@@messageModalLabels.button.cancel:Cancel` //this.i18n({ value: 'Prekliči', id: 'messageModal.buttons.cancel', meaning: 'message dialog cancel button text' }),
    }

    public titles: Record<MessageType, string> = {
      general: $localize`:@@messageModalLabels.title.general:Message`, // this.i18n({ value: 'Sporočilo', id: 'messageModal.titles.general', meaning: 'message dialog title' }),
      question: $localize`:@@messageModalLabels.title.question:Question`, //this.i18n({ value: 'Vprašanje', id: 'messageModal.titles.question', meaning: 'message dialog title' }),
      info: $localize`:@@messageModalLabels.title.info:Message`, //this.i18n({ value: 'Sporočilo', id: 'messageModal.titles.info', meaning: 'message dialog title' }),
      warning: $localize`:@@messageModalLabels.title.warning:Warning`, // this.i18n({ value: 'Opozorilo', id: 'messageModal.titles.warning', meaning: 'message dialog title' }),
      error: $localize`:@@messageModalLabels.title.error:Error` //this.i18n({ value: 'Napaka', id: 'messageModal.titles.error', meaning: 'message dialog title' }),
    }
}
