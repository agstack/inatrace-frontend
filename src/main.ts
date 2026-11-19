import './polyfills';

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { environment } from './environments/environment';
import { loadTranslations } from '@angular/localize';
import { LanguageCodeHelper } from './app/language-code-helper';

const languageCode = LanguageCodeHelper.getCurrentLocale();

if (environment.production) {
  enableProdMode();
}

async function loadLocaleTranslations(locale: string): Promise<void> {
  const response = await fetch(`./assets/locale/${locale}.json`);
  if (!response.ok) {
    throw new Error(`Could not load translations for ${locale}: ${response.status}`);
  }
  const data = await response.json();
  loadTranslations(data.translations as any);
}

if (languageCode) {
  loadLocaleTranslations(languageCode).then(
    () => {
      import('./app/app.module').then(module => {
        platformBrowserDynamic()
          .bootstrapModule(module.AppModule)
          .catch(err => console.error(err));
      }).catch(err => console.error('first', err));
    }
  ).catch(err => console.error('Could not load translations', err));
} else {
  import('./app/app.module').then(module => {
    platformBrowserDynamic().bootstrapModule(module.AppModule).then();
  }).catch(err => console.error(err));
}
