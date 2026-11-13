// This file is required by karma.conf.js and loads recursively all the .spec and framework files.

// Tests run in Angular's development mode by default. The upgrade to Angular 21
// exposed a few change-detection timing checks in component tests that only
// assert shallow rendering. Disable the dev-mode double-check in the Karma
// harness; production builds keep the checks enabled.
(window as any).ngDevMode = false;


require('zone.js/testing');
const { getTestBed } = require('@angular/core/testing');
const {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} = require('@angular/platform-browser-dynamic/testing');

window['env'] = window['env'] || {};

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(), {
    teardown: { destroyAfterEach: false }
}
);
