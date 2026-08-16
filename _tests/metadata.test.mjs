import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUPPORTED_LOCALES, LOCALES } from '../src/locales.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

describe('repository metadata & manifest parity', () => {
  it('validates package.json fields and canonical repository URLs', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));

    assert.equal(pkg.name, 'companion-for-agy');
    assert.equal(typeof pkg.version, 'string');
    assert.match(pkg.version, /^\d+\.\d+\.\d+/);
    assert.equal(pkg.main, 'src/agy-companion.mjs');
    assert.equal(pkg.bin['companion-for-agy'], 'src/agy-companion.mjs');
    assert.equal(pkg.bin['agy-companion'], 'src/agy-companion.mjs');
    assert.equal(pkg.type, 'module');
    assert.equal(pkg.license, 'MIT');
    assert.match(pkg.repository.url, /^git\+https:\/\/github\.com\/(dev-bricks|ellmos-ai)\/companion-for-agy\.git$/);
    assert.match(pkg.bugs.url, /^https:\/\/github\.com\/(dev-bricks|ellmos-ai)\/companion-for-agy\/issues$/);
    assert.match(pkg.homepage, /^https:\/\/github\.com\/(dev-bricks|ellmos-ai)\/companion-for-agy#readme$/);
  });

  it('validates ellmos-module.v2.json schema and repository reference', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'ellmos-module.v2.json'), 'utf8'));

    assert.equal(manifest.schema, 'ellmos.module.v2');
    assert.equal(manifest.id, 'companion-for-agy');
    assert.equal(manifest.category, 'connectors');
    assert.equal(manifest.kind, 'adapter');
    assert.equal(manifest.source_of_truth.repository, 'https://github.com/ellmos-ai/companion-for-agy');
    assert.ok(manifest.provides.includes('adapter.agy'));
  });

  it('verifies that all essential documentation files exist and are non-empty', () => {
    const requiredDocs = [
      'README.md',
      'README_de.md',
      'README_es.md',
      'README_zh-Hans.md',
      'README_ja.md',
      'README_ru.md',
      'CHANGELOG.md',
      'CHANGELOG_de.md',
      'ROADMAP.md',
      'SECURITY.md',
      'CODE_OF_CONDUCT.md',
      'CONTRIBUTING.md',
      'LICENSE',
      'THIRD_PARTY_LICENSES.txt',
      'llms.txt',
    ];

    for (const doc of requiredDocs) {
      const docPath = path.join(REPO_ROOT, doc);
      assert.ok(fs.existsSync(docPath), `Missing documentation file: ${doc}`);
      const stats = fs.statSync(docPath);
      assert.ok(stats.size > 0, `Documentation file is empty: ${doc}`);
    }
  });

  it('verifies all supported locales are defined with required translation keys', () => {
    assert.ok(Array.isArray(SUPPORTED_LOCALES));
    assert.deepEqual(SUPPORTED_LOCALES, ['en', 'de', 'es', 'zh-Hans', 'ja', 'ru']);

    const sampleKeys = [
      'usage',
      'warnModelMismatch',
      'statusWorkdir',
      'errAddDirMissing',
      'statusStartupFallback',
    ];

    for (const loc of SUPPORTED_LOCALES) {
      assert.ok(LOCALES[loc], `Locale ${loc} missing in LOCALES`);
      for (const key of sampleKeys) {
        assert.ok(LOCALES[loc][key], `Locale ${loc} missing key ${key}`);
      }
    }
  });

  it('verifies llms.txt contains essential ecosystem markers and canonical links', () => {
    const llms = fs.readFileSync(path.join(REPO_ROOT, 'llms.txt'), 'utf8');

    assert.ok(llms.includes('companion-for-agy'));
    assert.ok(llms.includes('ellmos-ai'));
    assert.ok(llms.includes('dev-bricks'));
    assert.ok(llms.includes('https://github.com/ellmos-ai/companion-for-agy'));
    assert.ok(llms.includes('Last-checked:'));
  });
});
