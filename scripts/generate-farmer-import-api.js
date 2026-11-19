/* Generate the import confirmation client from the backend OpenAPI contract.
 * Keep this focused until the whole existing API client can be regenerated reproducibly.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const child = require('child_process');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const check = args[0] === '--check';
const contractPath = args[check ? 1 : 0];
if (!contractPath || args.length !== (check ? 2 : 1)) {
  throw new Error('Usage: node scripts/generate-farmer-import-api.js [--check] <backend-openapi.json>');
}
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const prefix = '/api/company/userCustomers/import/farmers/{companyId}/{documentId}';
const actions = { '': 'importFarmersSpreadsheet', '/confirm-plots': 'confirmImportedFarmerPlots', '/create-separate': 'createSeparateImportedFarmer' };
const paths = {};
for (const [suffix, operationId] of Object.entries(actions)) {
  const key = prefix + suffix;
  const entry = contract.paths && contract.paths[key];
  if (!entry || !entry.post || entry.post.operationId !== operationId) throw new Error('Missing expected operation: ' + key);
  paths[key] = { post: Object.assign({}, entry.post, { tags: ['farmer-import-confirmation'] }) };
}
const reduced = Object.assign({}, contract, { paths, servers: [{ url: 'http://localhost:8080/' }] });
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'inatrace-farmer-client-'));
try {
  const input = path.join(temporary, 'openapi.json');
  const output = path.join(temporary, 'generated');
  fs.writeFileSync(input, JSON.stringify(reduced));
  child.execFileSync(process.execPath, [path.join(root, 'node_modules/openapi-typescript-angular-generator/bin/ng-ts-codegen.js'),
    '-i', input, '-o', output], { cwd: root, stdio: 'inherit' });
  const files = ['api/farmerImportConfirmation.service.ts', 'model/apiUserCustomerImportColumnValidationError.ts', 'model/apiUserCustomerImportResponse.ts'];
  const generated = files.map(file => fs.readFileSync(path.join(output, file)));
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const target = path.join(root, 'src/api', file);
    if (check) {
      if (!fs.existsSync(target) || !generated[i].equals(fs.readFileSync(target))) {
        throw new Error('Generated file differs from the contract: ' + file);
      }
    } else {
      fs.writeFileSync(target, generated[i]);
    }
  }
} finally {
  fs.rmdirSync(temporary, { recursive: true });
}
