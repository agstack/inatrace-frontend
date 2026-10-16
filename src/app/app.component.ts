import { Component, OnInit } from '@angular/core';
import { GlobalEventManagerService } from './core/global-event-manager.service';
import { environment } from 'src/environments/environment';
import { CookieManagementService } from './shared/directives/cookie-management.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  title = environment.appName;

  constructor(
    public globalEventsManager: GlobalEventManagerService,
    private cookieManagementService: CookieManagementService
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

    window['initMap'] = () => {
      this.globalEventsManager.loadedGoogleMaps(true);
    };
    const gmScript = document.createElement('script');
    gmScript.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&loading=async&callback=initMap`;
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
