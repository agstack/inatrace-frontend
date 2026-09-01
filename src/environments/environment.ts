// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: false,
    environmentName: window['env']['environmentName'] || '',
    basePath: window['env']['basePath'] || '',
    appBaseUrl: window['env']['appBaseUrl'] || '',
    qrCodeBasePath: window['env']['qrCodeBasePath'] || '',
    chainRelativeFileUploadUrl: window['env']['chainRelativeFileUploadUrl'] || '',
    chainRelativeFileDownloadUrl: window['env']['chainRelativeFileDownloadUrl'] || '',
    relativeFileUploadUrl: window['env']['relativeFileUploadUrl'] || '',
    relativeFileUploadUrlManualType: window['env']['relativeFileUploadUrlManualType'] || '',
    relativeImageUploadUrl: window['env']['relativeImageUploadUrl'] || '',
    relativeImageUploadUrlAllSizes: window['env']['relativeImageUploadUrlAllSizes'] || '',
    version: window['env']['version'] || '',

    googleMapsApiKey: window['env']['googleMapsApiKey'] || '',
    googleAnalyticsId: window['env']['googleAnalyticsId'] || '',
    mapboxAccessToken: window['env']['mapboxAccessToken'] || '',
    facebookPixelId: window['env']['facebookPixelId'] || null,
    intercomAppId: window['env']['intercomAppId'] || null,
    chatApp: window['env']['chatApp'] || null,
    rocketChatServer: window['env']['rocketChatServer'] || null,
    tokenForPublicLogRoute: window['env']['tokenForPublicLogRoute'] || '',
    appName: 'INATrace',
    reloadDelay: window['env']['reloadDelay'] || '',
    harcodedLabelForPrivacyOnRegisterPage: window['env']['harcodedLabelForPrivacyOnRegisterPage'] || '',
    beycoAuthURL: window['env']['beycoAuthURL'] || '',
    beycoClientId: window['env']['beycoClientId'] || '',
    whispApiKey: window['env']['whispApiKey'] || '',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
