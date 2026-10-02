# Getting started

Running the INATrace web frontend against a local backend.

## Requirements
* Node 14.x. Later majors do not work: the Angular 10 development server stops at startup with
  `An unhandled exception occurred: No such module: http_parser`. Node 14 is past end of life, so
  install it next to your usual version with a version manager (nvm, asdf, volta) rather than
  system-wide. `.nvmrc` pins it, so `nvm use` in the project picks it.
* Chrome or Chromium, for the unit tests.
* Angular 10 comes from `npm install`; there is nothing to install separately, and the commands
  below use the project's own CLI.
* WebStorm or VS Code (recommended)
* VS Code pluggins:
  * Debugger for Chrome
  * EditorConfig for VS Code
  * npm support for VS Code
  * HTML Format (from Mohamed)
  * TSLint

## How to run
1. Clone the repository

2. Run ```npm install```

3. Open the project in IDE of choice

4. Add development environment as `environment.dev.ts` by copying `environment.ts` and adding default values for configuration keys besides window environment (e.g. `environmentName: window['env']['environmentName'] || 'DEV'`). The file is gitignored, so every checkout needs its own.
   1. `environmentName`: `'DEV'`
   2. `appBaseUrl`: `'http://localhost:4200'`
   3. `qrCodeBasePath`: `'q-cd'`
   4. `relativeFileUploadUrl`: `'/api/common/document'`
   5. `relativeFileUploadUrlManualType`: `'/api/common/document'`
   6. `relativeImageUploadUrl`: `'/api/common/image'`
   7. `relativeImageUploadUrlAllSizes`: `'/api/common/image'`
   8. `googleMapsApiKey`: have to obtain a key yourself
   9. `mapboxAccessToken`: have to obtain a key yourself; the plot map does not draw without it

5. If using Beyco integration, add the following configuration keys in `environment.ts` (the values should be obtained from Beyco):
   1. `beycoAuthURL`: `url`
   2. `beycoClientId`: `clientId`

6. Run Angular server with `npm run dev`

## Running the tests

The unit tests run with Karma in Chrome:

```
npm run test:ci   # once, in headless Chrome, as CI runs them
npm test          # watch mode in a Chrome window, re-running on every change
```

Karma finds Chrome in its usual install locations. Otherwise, point `CHROME_BIN` at a
Chrome or Chromium binary.

## Ports

The development server listens on **4200**: [http://localhost:4200/](http://localhost:4200/), which
redirects to `/en/`. It proxies `/api` to the backend on **8080** (see
`proxy.INATrace-local.conf.json`), so the browser only ever talks to 4200.

The landing page and login screen render without a backend. Everything that calls the API answers
504 until a backend is listening on 8080.

## Regenerating the API client

`src/api` is generated from the backend's OpenAPI document and is committed, so a normal run does
not need this step. To refresh it after the backend's API changes, start the backend and run
`npm run generate-api`, which reads `http://localhost:8080/v3/api-docs` and fails if nothing is
serving it.
