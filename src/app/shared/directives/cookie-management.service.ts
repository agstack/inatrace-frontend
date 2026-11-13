import { Injectable } from '@angular/core';
// import { Intercom } from 'ng-intercom'; ---- uncomment if needed
import { Angulartics2Facebook, Angulartics2GoogleGlobalSiteTag } from 'angulartics2';
import { environment } from 'src/environments/environment';
import { Router, ActivatedRoute } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class CookieManagementService {

  constructor(
    // public intercom: Intercom, ---- uncomment if needed
    private angulartics2GoogleAnalyticsGtag: Angulartics2GoogleGlobalSiteTag,
    private angulariticsFacebookPixel: Angulartics2Facebook,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ///////////// FUNKCIJE ZA NALAGANJE IN INICIALIZIRANJE FUNKCIONALNOSTI POVEZANIH S COOKIE-JI

  loadGoogleAnalytics(trackingID: string): void {
    let gaScript = document.createElement('script');
    gaScript.setAttribute('async', 'true');
    gaScript.setAttribute('src', `https://www.googletagmanager.com/gtag/js?id=${trackingID}`);

    let gaScript2 = document.createElement('script');
    gaScript2.innerText = `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag(\'js\', new Date());gtag(\'config\', \'${trackingID}\');`;

    document.documentElement.firstChild.appendChild(gaScript);
    document.documentElement.firstChild.appendChild(gaScript2);

    this.angulartics2GoogleAnalyticsGtag.startTracking();
  }

  loadFacebookPixelAnalytics(): void {
    (function (f: any, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ?
          n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s)
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    // (window as any).fbq.disablePushState = true; //not recommended, but can be done
    (window as any).fbq('init', environment.facebookPixelId);
    (window as any).fbq('track', 'PageView');

    this.angulariticsFacebookPixel.startTracking();
  }

  //  ---- uncomment if needed
  // loadIntercom(appId) {
  //     if(environment.chatApp != 'intercom') return;
  //     this.intercom.boot({
  //         app_id: appId,
  //         // Supports all optional configuration.
  //         widget: {
  //             "activator": "#intercom"
  //         }
  //     });
  // }

  loadRocketChat() {
    if (environment.chatApp != 'rocket') return;
    (function (w: any, d, s, u) {
      w.RocketChat = function (c) { w.RocketChat._.push(c) };
      w.RocketChat._ = [];
      w.RocketChat.url = u;
      var h = d.getElementsByTagName(s)[0],
        j = d.createElement(s) as any;
      j.async = true; j.src = environment.rocketChatServer + '/rocketchat-livechat.min.js?_=201903270000' //+ Math.random(); //201903270000';
      h.parentNode.insertBefore(j, h);
    })(window, document, 'script', environment.rocketChatServer);
  }

  //////// DEFINICIJA KLJUČEV ZA COOKIE. Prvi ključ je za uporabo v kodi, drugi (value) je ključ v localStorage
  // Ko se doda novi cookie, je treba zgoraj napisati funkcijo za nalaganje, tukaj pa si zmisliti ključe in povezati
  // z njimi funkcije za nalaganje.
  readonly allCookieKeys = {
    'GA': 'cookieConsentGoogleAnalytics',
    'FB': 'cookieConsentFacebookPixel',
    'INTERCOM': 'cookieConsentIntercom',
    'ROCKET': 'cookieConsentRocket'
  }

  get activeCookies() {
    let res = ['GA', 'FB']
    if (environment.chatApp === 'intercom') {
      res.push('INTERCOM')
    }
    if (environment.chatApp === 'rocket') {
      res.push('ROCKET')
    }
    return res
  }

  loadForKey(key: string) {
    switch (key) {
      case 'GA':
        this.loadGoogleAnalytics(environment.googleAnalyticsId);
        return;
      case 'FB':
        // ---- uncomment if needed
        // this.loadFacebookPixelAnalytics()
        return
      case 'ROCKET':
        this.loadRocketChat()
        return
      case 'INTERCOM':
        // ---- uncomment if needed
        // if(!environment.gcs) {
        //     this.loadIntercom(environment.intercomAppId)
        // }
        return
      default:
        return
    }
  }

  ////// Pomožne funkcije

  consentToCookie(type: string, consent: boolean) {
    let key = this.allCookieKeys[type]
    if (key) {
      if (consent === true) {
        localStorage.setItem(key, 'true')
      } else if (consent === false) {
        localStorage.setItem(key, 'false')
      } else {
        localStorage.removeItem(key)
      }
    }
  }

  consentToAllCookies() {
    Object.keys(this.allCookieKeys).forEach(key => this.consentToCookie(key, true))
    this.loadGoogleAnalytics(environment.googleAnalyticsId)
    // ---- uncomment if needed
    // this.loadFacebookPixelAnalytics()
    // if(!environment.gcs) {
    //     this.loadIntercom(environment.intercomAppId)
    // }
    this.loadRocketChat()
    if (this.router.url.startsWith('/p/')) {
      let labelId = this.route.firstChild.snapshot.params.uuid;
      this.router.navigate(["/", "q", labelId], { replaceUrl: true })
    }

  }

  getForKey(key: string) {
    let kkey = this.allCookieKeys[key]
    if (kkey) {
      return JSON.parse(localStorage.getItem(kkey))
    }
    return null
  }

  hasDefinedConsentToAllCookies() {
    return Object.keys(this.allCookieKeys).every(key => this.isDefinedForKey(key))
  }

  hasDefinedConsentToAllActiveCookies() {
    return this.activeCookies.every(key => this.isDefinedForKey(key))
  }

  isDefinedForKey(key: string) {
    let val = this.getForKey(key)
    return val === true || val === false
  }

  hasConsentedForKey(key: string) {
    return this.getForKey(key) === true
  }

  loadConsentedCookies() {
    Object.keys(this.allCookieKeys).forEach(key => {
      if (this.hasConsentedForKey(key)) {
        this.loadForKey(key)
      }
    })
  }

  // Ruta do statične strani z opisi cookie-jev
  get cookieInfoUrl() {
    return 's/cookies'
  }

}
