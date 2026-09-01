// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: true,
    environmentName: window['env']['environmentName'] || 'PROD',
    basePath: window['env']['basePath'] || '',
    appBaseUrl: window['env']['appBaseUrl'] || '',
    qrCodeBasePath: window['env']['qrCodeBasePath'] || '',
    chainRelativeFileUploadUrl: '/api/common/document',
    chainRelativeFileDownloadUrl: '/api/common/document',
    relativeFileUploadUrl: '/api/common/document',
    relativeFileUploadUrlManualType: '/api/common/document',
    relativeImageUploadUrl: '/api/common/image',
    relativeImageUploadUrlAllSizes: '/api/common/image',
    version: '2.40',

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
    beycoClientId: window['env']['beycoClientId'] || '',
    whispApiKey: 'a7ba19c9-6d7b-44d2-b8ca-598d2b5127d3'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
