// source https://afana.me/archive/2018/10/28/angular-internationalization/, https://github.com/NadeemAfana/angular-internationalization/tree/store-locale-in-url/src
export abstract class LanguageCodeHelper {

  public static defaultLocaleId = 'en';
  public static implementedLocales = ['de', 'rw', 'es', 'fr', LanguageCodeHelper.defaultLocaleId];

  public static setCurrentLocale(localeId: string) {

    const urlLocaleId = LanguageCodeHelper.getCultureFromCurrentUrl();
    if (urlLocaleId === localeId) {
      return;
    }
    if (urlLocaleId) {

      if (window.location.href.endsWith('/login')) {
        window.location.href = window.location.href.replace(`/${ urlLocaleId }/login`, `/${ localeId.toLowerCase() }/home`);
      } else {
        window.location.href = window.location.href.replace(`/${ urlLocaleId }/`, `/${ localeId.toLowerCase() }/`);
      }
    } else {

      let newUrl;
      if (window.location.pathname === '/') {
        newUrl = window.location.href + localeId + '/';
      } else {
        newUrl = window.location.href.replace(window.location.pathname, `/${ localeId }` + window.location.pathname);
      }

      if (newUrl !== window.location.href) {
        window.history.replaceState(null, '', newUrl);
      }
    }
  }

  public static isDefaultLocaleSet(): boolean {
    return LanguageCodeHelper.getCurrentLocale() === this.defaultLocaleId;
  }

  private static getCultureFromCurrentUrl(): string {
    // Retrieve localeId from the url if any.
    const matches = window.location.pathname.match(/^\/[a-z]{2}?\//gi);
    let urlLocaleId = null;
    if (matches) {
      urlLocaleId = matches[0].replace(/\//gi, '');
    }
    return urlLocaleId;
  }

  public static getCurrentLocale(): string {

    // Retrieve localeId from the url if any; otherwise, default to 'en-US'.
    // The first time the app loads, check the browser language.
    const storedLocaleId = LanguageCodeHelper.getCultureFromCurrentUrl();

    if (storedLocaleId == null) {
      let partialLocaleMatch = null;
      // tslint:disable-next-line:forin
      for (const id in LanguageCodeHelper.implementedLocales) {
        const implemetedLocaleId = LanguageCodeHelper.implementedLocales[id];

        // Check for stored locale in local storage
        const inatraceLocale = localStorage.getItem('inatraceLocale');
        if (inatraceLocale === implemetedLocaleId) {
          return inatraceLocale;
        } else if (navigator.language === implemetedLocaleId) {
          // Exact match, return.
          return implemetedLocaleId;
        } else if (navigator.language.startsWith(implemetedLocaleId)) {
          // For example, browser has `es-CL` and the implemented locale is `es`.
          partialLocaleMatch = implemetedLocaleId;
        } else if (implemetedLocaleId.startsWith(navigator.language)) {
          // For example, browser has `es` and the implemented locale is `es-CL`.
          partialLocaleMatch = implemetedLocaleId;
        }
      }
      if (partialLocaleMatch != null) { return partialLocaleMatch; }
    }
    // if not implemented return default
    if (LanguageCodeHelper.implementedLocales.indexOf(storedLocaleId) < 0) {
      this.setCurrentLocale(this.defaultLocaleId);
      return this.defaultLocaleId;
    }
    return storedLocaleId || this.defaultLocaleId;
  }
}
