const csvFile = './src/assets/locale/Coffee-translations.csv'; //copy from google sheets
const fs = require('fs')
const readline = require('readline');

const localeFolder = './src/assets/locale/';
const enLocaleFile = './src/assets/locale/en.json';
const deLocaleFile = './src/assets/locale/de.json';
const esLocaleFile = './src/assets/locale/es.json';
const rwLocaleFile = './src/assets/locale/rw.json';
const frLocaleFile = './src/assets/locale/fr.json';

var enJSON = JSON.parse(fs.readFileSync(enLocaleFile));
var deJSON = JSON.parse(fs.readFileSync(deLocaleFile));
var esJSON = JSON.parse(fs.readFileSync(esLocaleFile));
var rwJSON = JSON.parse(fs.readFileSync(rwLocaleFile));
var frJSON = JSON.parse(fs.readFileSync(frLocaleFile));

const readTranslations = readline.createInterface({
  input: fs.createReadStream(csvFile),
  output: process.stdout,
  terminal: false
});

readTranslations.on('line', (line) => {
  splitLine = line.split(';');

  id = splitLine[0];
  en = splitLine[1];
  de = splitLine[2];
  es = splitLine[3];
  rw = splitLine[4];
  fr = splitLine[5];

  let enData = enJSON.translations;
  let rwData = rwJSON.translations;
  let deData = deJSON.translations;
  let esData = esJSON.translations;
  let frData = frJSON.translations;

  if (en) enData[id] = en;
  if (de) deData[id] = de;
  if (es) esData[id] = es;
  if (rw) rwData[id] = rw;
  if (fr) frData[id] = fr;

  let outputJSONen = JSON.stringify(enJSON, null, 2);
  fs.writeFileSync(enLocaleFile, outputJSONen);

  let outputJSONde = JSON.stringify(deJSON, null, 2);
  fs.writeFileSync(deLocaleFile, outputJSONde);

  let outputJSONes = JSON.stringify(esJSON, null, 2);
  fs.writeFileSync(esLocaleFile, outputJSONes);

  let outputJSONrw = JSON.stringify(rwJSON, null, 2);
  fs.writeFileSync(rwLocaleFile, outputJSONrw);

  let outputJSONfr = JSON.stringify(frJSON, null, 2);
  fs.writeFileSync(frLocaleFile, outputJSONfr);

});
