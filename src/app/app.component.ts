import { Component, OnInit, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { GlobalEventManagerService } from './core/global-event-manager.service';
import { environment } from 'src/environments/environment';
import { CookieManagementService } from './shared/directives/cookie-management.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AppComponent implements OnInit {

  title = environment.appName;

  constructor(
    public globalEventsManager: GlobalEventManagerService,
    private cookieManagementService: CookieManagementService,
    private ngZone: NgZone
    ){}

  ngOnInit() {
    this.loadGoogleMaps();
    this.cookieManagementService.loadConsentedCookies();
  }

  loadGoogleMaps(): void {

    // Requesting the SDK without a key still loads it, but every map then renders a
    // "This page can't load Google Maps correctly" dialog over our own UI and watermarks the
    // tiles. Skipping the request leaves isGoogleMapsLoaded false, which the map components
    // already handle by not rendering a map at all.
    if (!environment.googleMapsApiKey) {
      console.warn('Google Maps API key is not configured; map features are disabled.');
      this.globalEventsManager.loadedGoogleMaps(false);
      return;
    }

    // With loading=async the bootstrap calls initMap before the versioned loader attaches
    // importLibrary and Map. @angular/google-maps initialises the map in ngOnInit and needs
    // one of them, so only report the maps as ready once the loader is usable.
    window['initMap'] = () => {
      let attempts = 0;
      // The script calls this callback outside the Angular zone, so every emission has to
      // re-enter it: otherwise the map components never re-render with the loaded flag.
      const report = (loaded: boolean) => this.ngZone.run(() => this.globalEventsManager.loadedGoogleMaps(loaded));
      const waitForLoader = () => {
        const maps = (window as any).google?.maps;
        if (maps && (typeof maps.importLibrary === 'function' || maps.Map)) {
          report(true);
          return;
        }
        if (attempts++ > 100) {
          console.error('Google Maps loader did not become available; map features are disabled.');
          report(false);
          return;
        }
        setTimeout(waitForLoader, 50);
      };
      this.ngZone.run(() => waitForLoader());
    };
    const gmScript = document.createElement('script');
    gmScript.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&v=weekly&loading=async&callback=initMap`;
    gmScript.defer = true;
    gmScript.async = true;
    gmScript.onerror = () => {
      console.error('Google Maps could not be loaded; map features are disabled.');
      this.globalEventsManager.loadedGoogleMaps(false);
    };

    document.head.appendChild(gmScript);

  }

  hasDefinedConsentToAllCookies() {
    return this.cookieManagementService.hasDefinedConsentToAllActiveCookies();
  }

  consentToAllCookies() {
    this.cookieManagementService.consentToAllCookies();
  }

  get cookieInfoUrl() {
    return this.cookieManagementService.cookieInfoUrl;
  }

}
