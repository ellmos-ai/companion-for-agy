import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

function isGitIgnored(relativePath) {
  try {
    execFileSync('git', ['check-ignore', '--no-index', relativePath], {
      cwd: REPO_ROOT,
      stdio: 'pipe',
      encoding: 'utf8',
    });
    return true;
  } catch (err) {
    if (err.status === 1) return false;
    throw err;
  }
}

describe('repository hygiene', () => {
  it('keeps local credential, token, recovery and key material out of git', () => {
    const ignoredPaths = [
      '.env',
      '.env.local',
      '.npmrc',
      '.npmrc.local',
      'credentials.json',
      'secrets.json',
      'api-token.txt',
      'tokens.json',
      'npm_recovery_codes.txt',
      'id_rsa',
      'id_ed25519',
      'deploy.key',
      'private-key.pem',
      'certificate.p12',
      'certificate.pfx',
      'agy-debug.log',
      '_results/smoke.log',
    ];

    for (const ignoredPath of ignoredPaths) {
      assert.equal(isGitIgnored(ignoredPath), true, `${ignoredPath} should be ignored`);
    }
  });

  it('does not ignore safe example files or project metadata', () => {
    const allowedPaths = [
      '.env.example',
      '.env.sample',
      'README.md',
      'package.json',
    ];

    for (const allowedPath of allowedPaths) {
      assert.equal(isGitIgnored(allowedPath), false, `${allowedPath} should remain trackable`);
    }
  });

  it('keeps npm package ignore rules defensive if files whitelist changes', () => {
    const npmignore = fs.readFileSync(path.join(REPO_ROOT, '.npmignore'), 'utf8');
    const requiredPatterns = [
      '_tests/',
      '_results/',
      'agy-debug.log',
      '*.tgz',
      '.npmrc',
      '*token*',
      '*recovery*',
      '*.pem',
      '*.key',
    ];

    for (const pattern of requiredPatterns) {
      assert.match(npmignore, new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'));
    }
  });
});
