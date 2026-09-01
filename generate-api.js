import { environment} from "./src/environments/environment";

var fs = require('fs');
var converter = require('api-spec-converter');
var child_process = require('child_process');
var fetch = require("node-fetch");

var swagger_docs_host = environment.basePath+ '/v3/api-docs';
const https = require('https');

function afterBuild(code) {
    if (code === 0) {
        fs.unlinkSync('src/api/index.ts');
        fs.unlinkSync('src/api/api/api.ts');
        fs.unlinkSync('src/api/model/models.ts');
        console.log("Conversion successful.");
    } else {
        console.error("Conversion finished with status ", code);
    }
}

console.log("Generating form: " + swagger_docs_host);

if (!fs.existsSync('src/api')) {
    fs.mkdirSync('src/api');
}

fetch(swagger_docs_host).then(function(res) {
    res.json().then(function() {

        // generate TS API
        var proc = child_process.fork("node_modules/openapi-typescript-angular-generator/bin/ng-ts-codegen.js", [
            '-i', swagger_docs_host,
            '-o', 'src/api'
        ]);
        proc.on('exit', afterBuild);
    })
})
