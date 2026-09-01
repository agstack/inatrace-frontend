

const localeFolder = './src/assets/locale/';
const fs = require('fs');
const readline = require('readline');

const enLocaleFile = './src/assets/locale/en.json';
const deLocaleFile = './src/assets/locale/de.json';
const rwLocaleFile = './src/assets/locale/rw.json';
const frLocaleFile = './src/assets/locale/fr.json';
var enJSON = JSON.parse(fs.readFileSync(enLocaleFile));
var deJSON = JSON.parse(fs.readFileSync(deLocaleFile));
var rwJSON = JSON.parse(fs.readFileSync(rwLocaleFile));
var frJSON = JSON.parse(fs.readFileSync(frLocaleFile));
const csvFile = './src/assets/locale/translations-Table.txt'; //copy from google sheets to semicolon separated file and remove header

const readTranslations = readline.createInterface({
  input: fs.createReadStream(csvFile),
  output: process.stdout,
  terminal: false
});

let data = enJSON.translations;
let keys = Object.keys(data);


let changed = {};

(async () => {
  readTranslations.on('line', (line) => {
    splitLine = line.split(';');

    id = splitLine[0];
    en = splitLine[1];
    // console.log(id)
    if (data[id] && data[id].trim() != en) {

      if (id != "cookies.cookiePage"
        && id != "privacy.PrivacyPolicyPage"
        && id != "terms.termAndConditionsPage"
        && id != "productLabel.labelsInfo.messageWithLink"
        && id != "welcomeScreen.modal.bodyText"
        && id != "ui.attachmentUploader.nalozeno") {
        changed[id] = {pr: en, now: data[id]};
        console.log("*** ", id)
        console.log("PR:", en)
        console.log("NO:", data[id])
      }
// console.log(changed)
    }

  })

})()



csvString = "ID;English;German;Kinyarwanda;french" + "\n";
for (let key of keys) {
  csvString += key + ";"
  csvString += enJSON.translations[key] + ";"
  csvString += deJSON.translations[key] + ";"
  csvString += rwJSON.translations[key] + ";"
  csvString += frJSON.translations[key] + "\n"
}

var today = new Date();
var dd = String(today.getDate()).padStart(2, '0');
var mm = String(today.getMonth() + 1).padStart(2, '0');
var yyyy = today.getFullYear();
today = mm + '-' + dd + '-' + yyyy;

fs.writeFileSync(localeFolder + 'tr_' + today + '.csv', csvString);
