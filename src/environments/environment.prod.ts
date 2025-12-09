// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: true,
    environmentName: window['env']['environmentName'] || '',
    basePath: '',
    appBaseUrl: window['env']['appBaseUrl'] || '',
    qrCodeBasePath: window['env']['qrCodeBasePath'] || '',
    chainRelativeFileUploadUrl: '',
    chainRelativeFileDownloadUrl: '',
    relativeFileUploadUrl: window['env']['relativeFileUploadUrl'] || '',
    relativeFileUploadUrlManualType: window['env']['relativeFileUploadUrlManualType'] || '',
    relativeImageUploadUrl: window['env']['relativeImageUploadUrl'] || '',
    relativeImageUploadUrlAllSizes: window['env']['relativeImageUploadUrlAllSizes'] || '',
    version: '2.41.0-SNAPSHOT',

    googleMapsApiKey: window['env']['googleMapsApiKey'] || '',
    googleAnalyticsId: '',
    mapboxAccessToken: window['env']['mapboxAccessToken'] || '',
    facebookPixelId: null,
    intercomAppId: null,
    chatApp: null,
    rocketChatServer: null,
    tokenForPublicLogRoute: window['env']['tokenForPublicLogRoute'] || '',
    appName: 'INATrace',
    reloadDelay: 500,
    harcodedLabelForPrivacyOnRegisterPage: '',
    beycoAuthURL: window['env']['beycoAuthURL'] || '',
    beycoClientId: window['env']['beycoClientId'] || ''
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
