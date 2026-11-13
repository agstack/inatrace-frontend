// Synchronises the runtime translation catalogs in src/assets/locale.
//
// The English catalog is the source of truth. New keys are copied to the other
// locales; keys that no longer exist in English are removed. To inspect new
// source messages, run `npx ng extract-i18n` and compare its output with en.json.
const fs = require('fs');
const path = require('path');

const localeFolder = './src/assets/locale/';
const enLocaleFile = './src/assets/locale/en.json';
const enLocale = 'en';

const enJSON = JSON.parse(fs.readFileSync(enLocaleFile, 'utf8'));
const files = fs.readdirSync(localeFolder).filter(file => path.extname(file).toLowerCase() === '.json');

files.forEach(file => {
  const locale = JSON.parse(fs.readFileSync(localeFolder + file, 'utf8'));
  if (locale.locale === enLocale) {
    return;
  }
  Object.entries(enJSON.translations).forEach(([key, value]) => {
    if (!Object.prototype.hasOwnProperty.call(locale.translations, key)) {
      locale.translations[key] = value;
    }
  });
  Object.keys(locale.translations).forEach(key => {
    if (!Object.prototype.hasOwnProperty.call(enJSON.translations, key)) {
      delete locale.translations[key];
    }
  });
  fs.writeFileSync(localeFolder + file, JSON.stringify(locale, null, 2) + '\n');
});

console.log('Translation catalogs synchronised from ' + enLocaleFile);
