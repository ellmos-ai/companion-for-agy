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
    assert.equal(pkg.version, '2.1.1');
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
      'MARKETING-LOG.txt',
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

  it('verifies GitHub Actions CI workflow configuration and matrix integrity', () => {
    const ciPath = path.join(REPO_ROOT, '.github', 'workflows', 'tests.yml');
    assert.ok(fs.existsSync(ciPath), 'Missing GitHub Actions workflow file');
    const ciContent = fs.readFileSync(ciPath, 'utf8');

    assert.match(ciContent, /actions\/checkout@v4/);
    assert.match(ciContent, /actions\/setup-node@v4/);
    assert.match(ciContent, /node-version:\s*\[18,\s*20,\s*22,\s*24\]/);
    assert.match(ciContent, /ubuntu-latest/);
    assert.match(ciContent, /windows-latest/);
    assert.match(ciContent, /macos-latest/);
    assert.match(ciContent, /cache:\s*'npm'/);
    assert.match(ciContent, /npm ci/);
    assert.match(ciContent, /npm test/);
  });

  it('verifies SECURITY.md bilingual policy and direct maintainer contact points', () => {
    const secPath = path.join(REPO_ROOT, 'SECURITY.md');
    assert.ok(fs.existsSync(secPath), 'Missing SECURITY.md');
    const secContent = fs.readFileSync(secPath, 'utf8');

    assert.ok(secContent.includes('Sicherheitsrichtlinie'));
    assert.ok(secContent.includes('Security Policy'));
    assert.ok(secContent.includes('Unterstützte Versionen'));
    assert.ok(secContent.includes('Supported Versions'));
    assert.ok(secContent.includes('48 Stunden') || secContent.includes('48 hours'));
    assert.ok(secContent.includes('5 Werktagen') || secContent.includes('5 business days'));
    assert.ok(secContent.includes('security@ellmos.ai'));
    assert.ok(secContent.includes('security@open-bricks.org'));
    assert.ok(secContent.includes('support@lukasgeiger.com'));
    assert.ok(secContent.includes('lukas@open-bricks.org'));
    assert.ok(secContent.includes('https://github.com/ellmos-ai/companion-for-agy/security/advisories'));
    assert.ok(secContent.includes('Local-First & Zero-Egress'));
    assert.ok(secContent.includes('Non-Elevation'));
  });

  it('verifies llms.txt contains essential ecosystem markers and canonical links', () => {
    const llms = fs.readFileSync(path.join(REPO_ROOT, 'llms.txt'), 'utf8');

    assert.ok(llms.includes('companion-for-agy'));
    assert.ok(llms.includes('ellmos-ai'));
    assert.ok(llms.includes('dev-bricks'));
    assert.match(llms, /https:\/\/github\.com\/(dev-bricks|ellmos-ai)\/companion-for-agy/);
    assert.ok(llms.includes('Last-checked: 2026-09-10'));
    assert.ok(llms.includes('SECURITY.md'));
  });

  it('verifies README and README_de contain required badges and ecosystem matrices', () => {
    const readmeEn = fs.readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf8');
    const readmeDe = fs.readFileSync(path.join(REPO_ROOT, 'README_de.md'), 'utf8');

    for (const content of [readmeEn, readmeDe]) {
      assert.match(content, /img\.shields\.io\/npm\/v\/companion-for-agy/);
      assert.match(content, /tests-24\d%20passed/);
      assert.match(content, /node-%3E%3D18\.0\.0/);
      assert.match(content, /(platform|plattform)-Windows/i);
      assert.match(content, /ecosystem-dev--bricks/);
      assert.match(content, /ecosystem-ellmos--ai/);
      assert.match(content, /umbrella-open--bricks/);
      assert.match(content, /LLM--Ready-llms\.txt/);
      assert.match(content, /(Privacy-100%25%20Offline|Datenschutz-100%25%20Offline)/);
      assert.match(content, /(Security-Local--First|Sicherheit-Local--First)/);
      assert.match(content, /(Security%20SLA-48h|Sicherheits--SLA-48h)/);
      assert.ok(content.includes('safe-start-for-codex'));
      assert.ok(content.includes('automizer-for-claude-desktop'));
      assert.ok(content.includes('DevCenter'));
      assert.ok(content.includes('CodeBox'));
      assert.ok(content.includes('CareCenter-for-Codex'));
      assert.ok(content.includes('automation-master'));
      assert.ok(content.includes('ellmos-filecommander-mcp'));
      assert.ok(content.includes('ellmos-codecommander-mcp'));
      assert.ok(content.includes('ellmos-controlcenter-mcp'));
      assert.ok(content.includes('ellmos-clatcher-mcp'));
      assert.ok(content.includes('n8n-manager-mcp'));
      assert.ok(content.includes('skills'));
      assert.ok(content.includes('open-bricks'));
    }
  });

  it('verifies 14-point quick navigation in README and README_de', () => {
    const readmeEn = fs.readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf8');
    const readmeDe = fs.readFileSync(path.join(REPO_ROOT, 'README_de.md'), 'utf8');

    assert.ok(readmeEn.includes('Quick Navigation'));
    assert.ok(readmeEn.includes('(#-quickstart)'));
    assert.ok(readmeEn.includes('(#️-system-architecture)'));
    assert.ok(readmeEn.includes('(#-lifecycle--execution-sequence)'));
    assert.ok(readmeEn.includes('(#-problem--value-proposition)'));
    assert.ok(readmeEn.includes('(#-installation)'));
    assert.ok(readmeEn.includes('(#️-permission-modes)'));
    assert.ok(readmeEn.includes('(#-workspace)'));
    assert.ok(readmeEn.includes('(#️-options)'));
    assert.ok(readmeEn.includes('(#️-runtime-invariants--safety-matrix)'));
    assert.ok(readmeEn.includes('(#-sibling-tools--ecosystem-matrix)'));
    assert.ok(readmeEn.includes('(#-best-practices-two-return-paths)'));
    assert.ok(readmeEn.includes('(#-internationalization-scope)'));
    assert.ok(readmeEn.includes('(#-security-policy--vulnerability-reporting)'));
    assert.ok(readmeEn.includes('(#-license)'));

    assert.ok(readmeDe.includes('Schnellnavigation'));
    assert.ok(readmeDe.includes('(#-schnellstart)'));
    assert.ok(readmeDe.includes('(#️-systemarchitektur)'));
    assert.ok(readmeDe.includes('(#-lebenszyklus--ausf%C3%BChrungssequenz)'));
    assert.ok(readmeDe.includes('(#-problemstellung--werteversprechen)'));
    assert.ok(readmeDe.includes('(#-installation)'));
    assert.ok(readmeDe.includes('(#️-berechtigungsmodi)'));
    assert.ok(readmeDe.includes('(#-workspace)'));
    assert.ok(readmeDe.includes('(#️-optionen)'));
    assert.ok(readmeDe.includes('(#️-laufzeit-invarianten--sicherheitstabelle)'));
    assert.ok(readmeDe.includes('(#-geschwister-werkzeuge--%C3%B6kosystem-matrix)'));
    assert.ok(readmeDe.includes('(#-bew%C3%A4hrte-praxis-zwei-r%C3%BCckgabepfade)'));
    assert.ok(readmeDe.includes('(#-internationalisierungs-umfang)'));
    assert.ok(readmeDe.includes('(#-sicherheitsrichtlinie--vulnerability-reporting)'));
    assert.ok(readmeDe.includes('(#-lizenz)'));
  });

  it('verifies dual Mermaid diagrams (flowchart and sequenceDiagram) in README and README_de', () => {
    const readmeEn = fs.readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf8');
    const readmeDe = fs.readFileSync(path.join(REPO_ROOT, 'README_de.md'), 'utf8');

    for (const content of [readmeEn, readmeDe]) {
      assert.match(content, /```mermaid\r?\nflowchart TD/);
      assert.match(content, /```mermaid\r?\nsequenceDiagram/);
      assert.ok(content.includes('autonumber'));
      assert.ok(content.includes('Host_Clients'));
      assert.ok(content.includes('Companion_Runtime'));
      assert.ok(content.includes('Terminal_Abstraction'));
      assert.ok(content.includes('Upstream_Engine'));
      assert.ok(content.includes('Storage_Sink'));
      assert.ok(content.includes('Phase 1: Trust'));
      assert.ok(content.includes('Phase 2'));
      assert.ok(content.includes('Phase 4 & 5'));
    }
  });

  it('verifies 10 runtime invariants and safety table in README and README_de', () => {
    const readmeEn = fs.readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf8');
    const readmeDe = fs.readFileSync(path.join(REPO_ROOT, 'README_de.md'), 'utf8');

    assert.ok(readmeEn.includes('## 🛡️ Runtime Invariants & Safety Matrix'));
    assert.ok(readmeEn.includes('100% Local-First & Zero-Egress'));
    assert.ok(readmeEn.includes('Non-Elevation (User-Mode Only)'));
    assert.ok(readmeEn.includes('PTY Process Isolation'));
    assert.ok(readmeEn.includes('Input Sanitization'));
    assert.ok(readmeEn.includes('Deterministic Temp Workspace Cleanup'));
    assert.ok(readmeEn.includes('Native Permission Pass-Through'));
    assert.ok(readmeEn.includes('ANSI Truecolor Stream Extraction'));
    assert.ok(readmeEn.includes('Graceful Process Tree Termination'));
    assert.ok(readmeEn.includes('Cross-Platform Diagnostic Preflight'));
    assert.ok(readmeEn.includes('Dual Return Path Reliability'));

    assert.ok(readmeDe.includes('## 🛡️ Laufzeit-Invarianten & Sicherheitstabelle'));
    assert.ok(readmeDe.includes('100% Local-First & Zero-Egress'));
    assert.ok(readmeDe.includes('Benutzer-Modus (Non-Elevation)'));
    assert.ok(readmeDe.includes('PTY-Prozess-Isolation'));
    assert.ok(readmeDe.includes('Eingabe-Sanitierung'));
    assert.ok(readmeDe.includes('Deterministische Workspace-Bereinigung'));
    assert.ok(readmeDe.includes('Native Berechtigungsweitergabe'));
    assert.ok(readmeDe.includes('ANSI-Truecolor-Stream-Extraktion'));
    assert.ok(readmeDe.includes('Geordnete Prozessbaum-Terminierung'));
    assert.ok(readmeDe.includes('Plattformübergreifende Diagnose-Preflights'));
    assert.ok(readmeDe.includes('Zwei-Rückgabepfade-Zuverlässigkeit'));
  });

  it('verifies local MARKETING-LOG.txt is present and documents Pfad B automation', () => {
    const logPath = path.join(REPO_ROOT, 'MARKETING-LOG.txt');
    assert.ok(fs.existsSync(logPath), 'Missing MARKETING-LOG.txt');
    const logContent = fs.readFileSync(logPath, 'utf8');

    assert.ok(logContent.includes('companion-for-agy'));
    assert.ok(logContent.includes('2026-09-08'));
    assert.ok(logContent.includes('Pfad B'));
    assert.ok(logContent.includes('Dual-Mermaid'));
    assert.ok(logContent.includes('14-Punkte-Schnellnavigation'));
  });

  it('verifies all internationalized README files have consistent titles and badge anchors', () => {
    const localizedReadmes = [
      'README.md',
      'README_de.md',
      'README_es.md',
      'README_zh-Hans.md',
      'README_ja.md',
      'README_ru.md',
    ];

    for (const file of localizedReadmes) {
      const content = fs.readFileSync(path.join(REPO_ROOT, file), 'utf8');
      assert.match(content, /^#\s+companion-for-agy/m, `${file} missing top-level # companion-for-agy header`);
      assert.ok(content.includes('assets/logo.jpg'), `${file} missing assets/logo.jpg banner reference`);
      assert.ok(content.includes('img.shields.io'), `${file} missing shields.io badges`);
    }
  });

  it('verifies zero-egress offline runtime invariants in source modules', () => {
    const srcDir = path.join(REPO_ROOT, 'src');
    const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.mjs') || f.endsWith('.js'));

    for (const f of files) {
      const content = fs.readFileSync(path.join(srcDir, f), 'utf8');
      // Verify no outbound HTTP/HTTPS or telemetry imports in runtime
      assert.doesNotMatch(content, /import\s+.*from\s+['"](https?|node:http|node:https|axios|node-fetch|got|request)['"]/);
      assert.doesNotMatch(content, /fetch\s*\(/, `Forbidden fetch call in ${f}`);
      assert.doesNotMatch(content, /telemetry|analytics|phoneHome/i, `Forbidden telemetry reference in ${f}`);
    }
  });

  it('verifies ellmos-module.v2.json platform boundaries and schema parity', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'ellmos-module.v2.json'), 'utf8'));
    assert.deepEqual(manifest.boundaries.platforms, ['windows', 'linux', 'macos']);
    assert.equal(manifest.boundaries.network, 'optional');
  });

  it('verifies CHANGELOG.md and CHANGELOG_de.md document release 2.1.1 and Pfad A hygiene', () => {
    const changelogEn = fs.readFileSync(path.join(REPO_ROOT, 'CHANGELOG.md'), 'utf8');
    const changelogDe = fs.readFileSync(path.join(REPO_ROOT, 'CHANGELOG_de.md'), 'utf8');

    for (const cl of [changelogEn, changelogDe]) {
      assert.ok(cl.includes('[2.1.1]'));
      assert.ok(cl.includes('2026-09-10'));
      assert.ok(cl.includes('Pfad A'));
      assert.ok(cl.includes('.gitignore'));
    }
  });
});
