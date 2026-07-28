import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'src', 'agy-companion.mjs');
const RC = '\\x1b[38;2;232;234;237m';
const RESET = '\\x1b[0m';

function makeFakeHarness(mode, options = {}) {
  const { agyPath = null } = options;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-companion-test-'));
  const fakeAgy = path.join(tempDir, process.platform === 'win32' ? 'agy.exe' : 'agy');
  const fakePty = path.join(tempDir, 'fake-pty.cjs');
  const eventLog = path.join(tempDir, 'events.log');
  const prebuildDir = path.join(tempDir, 'prebuilds', `${process.platform}-${process.arch}`);
  fs.writeFileSync(fakeAgy, '', 'utf8');
  fs.writeFileSync(eventLog, '', 'utf8');
  fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name":"fake-pty"}', 'utf8');
  fs.mkdirSync(prebuildDir, { recursive: true });
  fs.writeFileSync(path.join(prebuildDir, process.platform === 'win32' ? 'conpty.node' : 'pty.node'), '', 'utf8');
  if (process.platform !== 'win32') {
    const helperPath = path.join(prebuildDir, 'spawn-helper');
    fs.writeFileSync(helperPath, '#!/bin/sh\nexit 0\n', 'utf8');
    fs.chmodSync(helperPath, 0o755);
  }
  fs.writeFileSync(fakePty, `
const fs = require('fs');
const mode = process.env.AGY_COMPANION_FAKE_MODE;
const eventLog = process.env.AGY_COMPANION_FAKE_EVENT_LOG;
const RC = '${RC}';
const RESET = '${RESET}';

function log(event) {
  fs.appendFileSync(eventLog, event + '\\n');
}

exports.spawn = function spawn(_cmd, args) {
  log('args:' + JSON.stringify(args));
  let dataCb = () => {};
  let exitCb = () => {};
  let exited = false;

  function emitExit(code = 0) {
    if (exited) return;
    exited = true;
    log('exit');
    exitCb({ exitCode: code });
  }

  setTimeout(() => {
    if (mode === 'pty-smoke') {
      dataCb(RC + 'PTY_SMOKE_OK' + RESET + '\\n');
      emitExit(0);
      return;
    }
    if (mode === 'effort-retry' && args.includes('--effort')) {
      dataCb('Error: --effort is not supported for this model\\n');
      return;
    }
    dataCb('Antigravity CLI 1.0.6\\nGemini 3.5 Flash (Medium)\\n? for shortcuts\\nsession ready\\n');
  }, 20);

  return {
    onData(cb) { dataCb = cb; },
    onExit(cb) { exitCb = cb; },
    write(text) {
      if (text === '\\x03') {
        log('ctrlc');
        setTimeout(() => emitExit(0), 20);
        return;
      }
      const prompt = text.replace(/\\r$/, '');
      log('prompt:' + prompt);
      setTimeout(() => {
        if (mode === 'hold') {
          dataCb('> ' + prompt + '\\n');
        } else if (mode === 'empty') {
          dataCb('> ' + prompt + '\\n42 tokens\\n>\\n');
        } else if (mode === 'live-smoke') {
          dataCb('> ' + prompt + '\\n' + RC + 'AGY_LIVE_SMOKE_OK' + RESET + '\\n>\\n');
        } else {
          dataCb('> ' + prompt + '\\n' + RC + 'OK' + RESET + '\\n>\\n');
        }
      }, 20);
    },
    kill() {
      log('kill');
      setTimeout(() => emitExit(0), 20);
    },
  };
};
`, 'utf8');

  return {
    tempDir,
    eventLog,
    env: {
      ...process.env,
      // Locale-Fixierung: Regression-Tests prüfen Verhalten, nicht i18n.
      // Explizites Englisch verhindert OS-abhängige Fehlermeldungen (z. B. de_DE).
      LANG: 'en_US.UTF-8',
      LC_ALL: 'en_US.UTF-8',
      LC_MESSAGES: '',
      AGY_COMPANION_AGY_PATH: agyPath || fakeAgy,
      AGY_COMPANION_PTY_PATH: fakePty,
      AGY_COMPANION_FAKE_MODE: mode,
      AGY_COMPANION_FAKE_EVENT_LOG: eventLog,
    },
    cleanup() {
      fs.rmSync(tempDir, { recursive: true, force: true });
    },
  };
}

describe('CLI regressions with fake PTY', () => {
  it('prints the package version without starting agy', async () => {
    const harness = makeFakeHarness('ok');
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf8'));
      const { stdout, stderr } = await execFileAsync('node', [SCRIPT, '--version'], {
        env: harness.env,
        timeout: 10000,
      });
      assert.equal(stdout.trim(), packageJson.version);
      assert.equal(stderr, '');
      assert.equal(fs.readFileSync(harness.eventLog, 'utf8'), '');
    } finally {
      harness.cleanup();
    }
  });

  it('lists a fresh cached model catalog as JSON without starting the PTY', async () => {
    const harness = makeFakeHarness('ok');
    const cachePath = path.join(harness.tempDir, 'model-catalog.json');
    try {
      fs.writeFileSync(cachePath, JSON.stringify({
        schemaVersion: 1,
        source: 'agy-invalid-model-probe',
        detectedAt: new Date().toISOString(),
        agyPath: harness.env.AGY_COMPANION_AGY_PATH,
        agyVersion: null,
        models: [{ id: 'gemini-3.6-flash', displayName: 'Gemini 3.6 Flash', efforts: ['high', 'medium', 'low'] }],
      }), 'utf8');
      const { stdout } = await execFileAsync('node', [SCRIPT, '--list-models', '--json'], {
        env: { ...harness.env, AGY_COMPANION_MODEL_CACHE: cachePath },
        timeout: 10000,
      });
      const result = JSON.parse(stdout);
      assert.equal(result.cacheHit, true);
      assert.deepEqual(result.models[0].efforts, ['high', 'medium', 'low']);
      assert.equal(fs.readFileSync(harness.eventLog, 'utf8'), '');
    } finally {
      harness.cleanup();
    }
  });

  it('retries exactly once without effort before sending the prompt', async () => {
    const harness = makeFakeHarness('effort-retry');
    try {
      const { stdout, stderr } = await execFileAsync(
        'node',
        [SCRIPT, '--sandbox', '--model', 'gemini-3.5-flash', '--effort', 'high', '--timeout', '30000', 'OK_PROMPT'],
        { env: harness.env, timeout: 60000 },
      );
      assert.equal(stdout.trim(), 'OK');
      assert.match(stderr, /retrying once with --no-effort/);
      const argsLines = fs.readFileSync(harness.eventLog, 'utf8')
        .split(/\r?\n/)
        .filter(line => line.startsWith('args:'));
      assert.equal(argsLines.length, 2);
      assert.match(argsLines[0], /"--effort","high"/);
      assert.doesNotMatch(argsLines[1], /"--effort","high"/);
    } finally {
      harness.cleanup();
    }
  });

  it('exits nonzero without falling back to startup banner when no response is extractable', async () => {
    const harness = makeFakeHarness('empty');
    try {
      await assert.rejects(
        execFileAsync('node', [SCRIPT, '--sandbox', '--timeout', '30000', 'EMPTY_PROMPT'], {
          env: harness.env,
          timeout: 60000,
        }),
        err => {
          assert.equal(err.code, 4);
          assert.equal(err.stdout, '');
          assert.match(err.stderr, /No usable response received/);
          assert.doesNotMatch(err.stdout, /Antigravity CLI/);
          return true;
        },
      );
    } finally {
      harness.cleanup();
    }
  });

  it('does not force-kill when Ctrl+C already lets the PTY exit cleanly', async () => {
    const harness = makeFakeHarness('ok');
    try {
      const { stdout } = await execFileAsync('node', [SCRIPT, '--sandbox', '--timeout', '30000', 'OK_PROMPT'], {
        env: harness.env,
        timeout: 60000,
      });
      assert.equal(stdout.trim(), 'OK');
      const events = fs.readFileSync(harness.eventLog, 'utf8');
      assert.match(events, /ctrlc/);
      assert.doesNotMatch(events, /kill/);
    } finally {
      harness.cleanup();
    }
  });

  it('rejects unknown options before starting agy', async () => {
    const harness = makeFakeHarness('ok');
    try {
      await assert.rejects(
        execFileAsync('node', [SCRIPT, '--timeuot', '30000', 'OK_PROMPT'], {
          env: harness.env,
          timeout: 10000,
        }),
        err => {
          assert.equal(err.code, 1);
          assert.match(err.stderr, /Unknown option: --timeuot/);
          assert.equal(fs.existsSync(harness.eventLog), true);
          assert.equal(fs.readFileSync(harness.eventLog, 'utf8'), '');
          return true;
        },
      );
    } finally {
      harness.cleanup();
    }
  });

  it('supports -- as a prompt separator for prompts that start with a dash', async () => {
    const harness = makeFakeHarness('ok');
    try {
      const { stdout } = await execFileAsync('node', [SCRIPT, '--sandbox', '--timeout', '30000', '--', '-dash prompt'], {
        env: harness.env,
        timeout: 60000,
      });
      assert.equal(stdout.trim(), 'OK');
      const events = fs.readFileSync(harness.eventLog, 'utf8');
      assert.match(events, /-dash prompt/);
    } finally {
      harness.cleanup();
    }
  });

  it('can omit --model for agy versions that do not support model flags', async () => {
    const harness = makeFakeHarness('ok');
    try {
      const { stdout } = await execFileAsync('node', [SCRIPT, '--sandbox', '--no-model', '--timeout', '30000', 'OK_PROMPT'], {
        env: harness.env,
        timeout: 60000,
      });
      assert.equal(stdout.trim(), 'OK');
      const events = fs.readFileSync(harness.eventLog, 'utf8');
      assert.doesNotMatch(events, /"--model"/);
      assert.match(events, /"--sandbox"/);
    } finally {
      harness.cleanup();
    }
  });

  it('can omit --model via AGY_COMPANION_NO_MODEL', async () => {
    const harness = makeFakeHarness('ok');
    try {
      const { stdout } = await execFileAsync('node', [SCRIPT, '--sandbox', '--timeout', '30000', 'OK_PROMPT'], {
        env: { ...harness.env, AGY_COMPANION_NO_MODEL: '1' },
        timeout: 60000,
      });
      assert.equal(stdout.trim(), 'OK');
      const events = fs.readFileSync(harness.eventLog, 'utf8');
      assert.doesNotMatch(events, /"--model"/);
    } finally {
      harness.cleanup();
    }
  });

  it('handles external SIGTERM with PTY cleanup', {
    skip: process.platform === 'win32' ? 'Windows child signals do not reliably invoke Node signal handlers' : undefined,
  }, async () => {
    const harness = makeFakeHarness('hold');
    try {
      const child = spawn('node', [SCRIPT, '--sandbox', '--timeout', '30000', 'HOLD_PROMPT'], {
        env: harness.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      await new Promise((resolve, reject) => {
        const deadline = setTimeout(() => reject(new Error('Timed out waiting for fake prompt')), 10000);
        const poll = setInterval(() => {
          const events = fs.readFileSync(harness.eventLog, 'utf8');
          if (events.includes('prompt:')) {
            clearInterval(poll);
            clearTimeout(deadline);
            resolve();
          }
        }, 50);
      });

      child.kill('SIGTERM');
      const exitCode = await new Promise(resolve => child.on('exit', code => resolve(code)));
      assert.equal(exitCode, 143);
      const events = fs.readFileSync(harness.eventLog, 'utf8');
      assert.match(events, /ctrlc/);
    } finally {
      harness.cleanup();
    }
  });

  it('prints doctor JSON without starting the PTY', async () => {
    const harness = makeFakeHarness('ok', { agyPath: process.execPath });
    try {
      const { stdout } = await execFileAsync('node', [SCRIPT, '--doctor', '--json'], {
        env: harness.env,
        timeout: 20000,
      });
      const parsed = JSON.parse(stdout.trim());
      assert.equal(parsed.tool, 'companion-for-agy');
      assert.equal(typeof parsed.nodePty.loadable, 'boolean');
      assert.equal(parsed.agy.path, process.execPath);
      assert.equal(fs.readFileSync(harness.eventLog, 'utf8'), '');
    } finally {
      harness.cleanup();
    }
  });

  it('prints PTY smoke JSON without requiring agy auth', async () => {
    const harness = makeFakeHarness('pty-smoke', { agyPath: process.execPath });
    try {
      const { stdout } = await execFileAsync('node', [SCRIPT, '--pty-smoke', '--json'], {
        env: harness.env,
        timeout: 20000,
      });
      const parsed = JSON.parse(stdout.trim());
      assert.equal(parsed.tool, 'companion-for-agy');
      assert.equal(parsed.status, 'ok');
      assert.equal(parsed.smoke.expectedText, 'PTY_SMOKE_OK');
      assert.equal(parsed.smoke.extractedText, 'PTY_SMOKE_OK');
    } finally {
      harness.cleanup();
    }
  });

  it('prints platform smoke JSON as a bundled pre-live gate', async () => {
    const harness = makeFakeHarness('pty-smoke', { agyPath: process.execPath });
    try {
      const { stdout } = await execFileAsync('node', [SCRIPT, '--platform-smoke', '--json'], {
        env: harness.env,
        timeout: 20000,
      });
      const parsed = JSON.parse(stdout.trim());
      assert.equal(parsed.tool, 'companion-for-agy');
      assert.equal(parsed.status, 'ok');
      assert.equal(parsed.checks.doctor.tool, 'companion-for-agy');
      assert.equal(parsed.checks.ptySmoke.smoke.extractedText, 'PTY_SMOKE_OK');
      assert.match(parsed.nextLiveSmoke.command, /--live-smoke/);
      assert.equal(parsed.nextLiveSmoke.expectedText, 'AGY_LIVE_SMOKE_OK');
    } finally {
      harness.cleanup();
    }
  });

  it('writes platform smoke report JSON to --report-file while keeping text stdout', async () => {
    const harness = makeFakeHarness('pty-smoke', { agyPath: process.execPath });
    try {
      const reportFile = path.join(harness.tempDir, 'reports', 'platform-smoke.json');
      const { stdout } = await execFileAsync('node', [SCRIPT, '--platform-smoke', '--report-file', reportFile], {
        env: harness.env,
        timeout: 20000,
      });
      assert.match(stdout, /companion-for-agy platform smoke/);
      const parsed = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
      assert.equal(parsed.tool, 'companion-for-agy');
      assert.equal(parsed.status, 'ok');
      assert.equal(parsed.checks.ptySmoke.smoke.extractedText, 'PTY_SMOKE_OK');
      assert.match(parsed.nextLiveSmoke.command, /--live-smoke/);
    } finally {
      harness.cleanup();
    }
  });

  it('runs live smoke JSON with the default sandbox permission mode', async () => {
    const harness = makeFakeHarness('live-smoke');
    try {
      const { stdout } = await execFileAsync('node', [SCRIPT, '--live-smoke', '--json', '--timeout', '30000'], {
        env: harness.env,
        timeout: 60000,
      });
      const parsed = JSON.parse(stdout.trim());
      assert.equal(parsed.tool, 'companion-for-agy');
      assert.equal(parsed.status, 'ok');
      assert.equal(parsed.permissionMode, 'sandbox');
      assert.equal(parsed.liveSmoke.expectedText, 'AGY_LIVE_SMOKE_OK');
      assert.equal(parsed.liveSmoke.response, 'AGY_LIVE_SMOKE_OK');
      assert.equal(parsed.liveSmoke.matched, true);
      const events = fs.readFileSync(harness.eventLog, 'utf8');
      assert.match(events, /Reply with exactly AGY_LIVE_SMOKE_OK/);
    } finally {
      harness.cleanup();
    }
  });

  it('fails live smoke JSON when the marker does not match', async () => {
    const harness = makeFakeHarness('ok');
    try {
      await assert.rejects(
        execFileAsync('node', [SCRIPT, '--live-smoke', '--json', '--timeout', '30000'], {
          env: harness.env,
          timeout: 60000,
        }),
        err => {
          assert.equal(err.code, 5);
          const parsed = JSON.parse(err.stdout.trim());
          assert.equal(parsed.status, 'fail');
          assert.equal(parsed.liveSmoke.response, 'OK');
          assert.equal(parsed.liveSmoke.matched, false);
          assert.ok(parsed.blockers.some(blocker => blocker.includes('AGY_LIVE_SMOKE_OK')));
          return true;
        },
      );
    } finally {
      harness.cleanup();
    }
  });

  it('doctor exits with blockers when agy is missing', async () => {
    const harness = makeFakeHarness('ok', {
      agyPath: path.join(os.tmpdir(), 'agy-companion-missing-binary'),
    });
    try {
      await assert.rejects(
        execFileAsync('node', [SCRIPT, '--doctor', '--json'], {
          env: harness.env,
          timeout: 20000,
        }),
        err => {
          assert.equal(err.code, 2);
          const parsed = JSON.parse(err.stdout.trim());
          assert.equal(parsed.status, 'fail');
          assert.ok(parsed.blockers.some(blocker => blocker.includes('agy')));
          assert.equal(fs.readFileSync(harness.eventLog, 'utf8'), '');
          return true;
        },
      );
    } finally {
      harness.cleanup();
    }
  });

  it('passes --add-dir to agy args (single)', async () => {
    const harness = makeFakeHarness('ok');
    const addDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-adddir-'));
    try {
      const { stdout, stderr } = await execFileAsync('node', [SCRIPT, '--sandbox', '--timeout', '30000', '--add-dir', addDir, 'OK_PROMPT'], {
        env: harness.env,
        timeout: 60000,
      });
      assert.equal(stdout.trim(), 'OK');
      const events = fs.readFileSync(harness.eventLog, 'utf8');
      assert.match(events, /"--add-dir"/);
      assert.ok(events.includes(JSON.stringify(addDir).slice(1, -1)), 'add-dir path appears in agy args');
      // 2.0.2: the first --add-dir becomes agy's working directory
      assert.ok(stderr.includes(path.resolve(addDir)), 'workdir status line mentions the add-dir');
    } finally {
      harness.cleanup();
      fs.rmSync(addDir, { recursive: true, force: true });
    }
  });

  it('passes --add-dir to agy args (multiple)', async () => {
    const harness = makeFakeHarness('ok');
    const dir1 = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-adddir1-'));
    const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-adddir2-'));
    try {
      const { stdout } = await execFileAsync('node', [SCRIPT, '--sandbox', '--timeout', '30000', '--add-dir', dir1, '--add-dir', dir2, 'OK_PROMPT'], {
        env: harness.env,
        timeout: 60000,
      });
      assert.equal(stdout.trim(), 'OK');
      const events = fs.readFileSync(harness.eventLog, 'utf8');
      assert.ok(events.includes(JSON.stringify(dir1).slice(1, -1)), 'first add-dir appears in agy args');
      assert.ok(events.includes(JSON.stringify(dir2).slice(1, -1)), 'second add-dir appears in agy args');
      // Both --add-dir flags appear in args (two occurrences expected)
      const addDirCount = (events.match(/"--add-dir"/g) || []).length;
      assert.equal(addDirCount, 2);
    } finally {
      harness.cleanup();
      fs.rmSync(dir1, { recursive: true, force: true });
      fs.rmSync(dir2, { recursive: true, force: true });
    }
  });

  it('rejects a missing --add-dir directory with a clear error', async () => {
    const missing = path.join(os.tmpdir(), 'agy-adddir-missing-' + process.pid);
    await assert.rejects(
      execFileAsync('node', [SCRIPT, '--sandbox', '--timeout', '30000', '--add-dir', missing, 'OK_PROMPT'], { timeout: 60000 }),
      err => {
        assert.equal(err.code, 1);
        assert.match(err.stderr, /--add-dir/);
        return true;
      }
    );
  });

  it('passes --effort through to agy args', async () => {
    const harness = makeFakeHarness('ok');
    try {
      const { stdout } = await execFileAsync('node', [SCRIPT, '--sandbox', '--timeout', '30000', '--model', 'gemini-3.6-flash', '--effort', 'high', 'OK_PROMPT'], {
        env: harness.env,
        timeout: 60000,
      });
      assert.equal(stdout.trim(), 'OK');
      const events = fs.readFileSync(harness.eventLog, 'utf8');
      assert.match(events, /"--effort"/);
      assert.match(events, /"high"/);
    } finally {
      harness.cleanup();
    }
  });

  it('outputs localized help text via --lang', async () => {
    const { stderr } = await execFileAsync('node', [SCRIPT, '--help', '--lang', 'de']);
    assert.match(stderr, /Inoffizieller PTY-Wrapper/);
  });

  it('outputs localized parsing errors via --lang', async () => {
    await assert.rejects(
      execFileAsync('node', [SCRIPT, '--lang', 'es', '--timeuot', '30000', 'PROMPT']),
      err => {
        assert.equal(err.code, 1);
        assert.match(err.stderr, /Opción desconocida: --timeuot/);
        return true;
      }
    );
  });
});
