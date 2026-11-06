const assert = require('assert');
const child = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const contract = process.argv[2];
if (!contract) throw new Error('Usage: node scripts/test-farmer-import-api.js <backend-openapi.json>');
const generator = path.join(root, 'scripts/generate-farmer-import-api.js');
const generatedFile = path.join(root, 'src/api/api/farmerImportConfirmation.service.ts');
const before = fs.readFileSync(generatedFile);
const run = file => child.spawnSync(process.execPath, [generator, '--check', file], { cwd: root, encoding: 'utf8' });

const good = run(contract);
assert.strictEqual(good.status, 0, good.stderr);
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'inatrace-farmer-contract-test-'));
try {
  const bad = JSON.parse(fs.readFileSync(contract, 'utf8'));
  delete bad.paths['/api/company/userCustomers/import/farmers/{companyId}/{documentId}/confirm-plots'];
  const invalidPath = path.join(temporary, 'openapi.json');
  fs.writeFileSync(invalidPath, JSON.stringify(bad));
  const failure = run(invalidPath);
  assert.notStrictEqual(failure.status, 0, 'missing operation must be rejected');
  assert(before.equals(fs.readFileSync(generatedFile)), '--check must not modify generated output');
} finally {
  fs.rmdirSync(temporary, { recursive: true });
}
console.log('Farmer import API contract checks passed.');
