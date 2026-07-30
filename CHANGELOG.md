# Changelog

## [Unreleased]

### Maintenance & Technical Hygiene
- Added visual repository header banner (`assets/banner.png`) to `README.md` and `README_de.md`.
- Updated `llms.txt` `Last-checked` timestamp to `2026-07-30`.
- Conducted technical hygiene audit, verified Node.js test suite execution (252 passed, 1 skipped).
- Synchronized repository metadata and verified clean workspace state.

## [2.1.0] - 2026-07-28

### Added
- Live agy model discovery via `--list-models` / `--refresh-models`, with a path/version-bound 24-hour cache.
- Model-aware automatic effort selection and one pre-prompt retry when agy requires effort to be added or removed.
- `--no-effort` to explicitly suppress automatic selection and `--version` / `-V` for machine-readable version checks.
- JSON metadata for effective effort and the discovered model catalog.

## [2.0.2] - 2026-07-23

### Added
- `--effort <low|medium|high>` passthrough flag (mirrors agy's own flag). agy >= 1.1.x
  requires `--effort` for some models (e.g. `gemini-3.6-flash`) and silently falls back
  to its default model otherwise — closing the Known Issue documented in 2.0.1.
- Model-mismatch surfacing: whenever the model detected from agy's banner does not match
  the requested `--model`, the companion prints a localized `warnModelMismatch` warning
  on stderr and sets `modelMismatch: true` in `--json` output.
- New regression tests: `--effort` passthrough, missing `--add-dir` rejection, and the
  add-dir working-directory behavior.

### Changed
- The FIRST `--add-dir` directory now becomes agy's working directory (previously agy
  always ran inside a throwaway temp workspace, so relative output paths silently landed
  in `%TEMP%\agy-companion-<pid>\` instead of the caller's directory — found in a real
  banner-generation run). A `statusWorkdir` status line reports the effective directory;
  a missing `--add-dir` path now fails fast with `errAddDirMissing` instead of running
  against a directory agy cannot use.
- Help text: model list updated to the agy 1.1.x generation (`gemini-3.6-flash`,
  `gemini-3.5-flash`, `gemini-3.1-pro`; the retired `gemini-1.5*/2.0*/3.5-pro` entries
  are gone), `--effort` documented, examples updated — in all six locales.

## [2.0.1] - 2026-07-23

### Fixed (live-smoke review, 2026-07-23)
- **Premature Ctrl+C during generation:** `detectResponseComplete()` treated the bare `>` that agy's bordered input box renders on *every* screen redraw — including while a response is still generating — as the "back to idle" signal, because the box border, spinner, and the accompanying "esc to cancel" status line were all classified as noise and never reset the candidate flag. Against the currently installed agy 1.1.5 UI, this made the wrapper send Ctrl+C and abort the live response within about 2.5s of sending the question on every run (confirmed via `--debug`: agy logged "Interrupted"). Fix: seeing "esc to cancel" after a candidate `>` now clears it, since that text only ever appears while agy is actively generating. Verified against a real authenticated agy session (previously reproducible failure, now a clean extracted response). Covered by two new regression tests in `_tests/unit.test.mjs`.
- `package-lock.json` had drifted to `1.4.2` while `package.json` already read `2.0.0`; re-synced via `npm install`.

### Found, not fixed (documented as TODO)
- agy 1.1.5 now warns `--model gemini-3.5-flash requires --effort (available: low, medium, high). Using the default model instead.` and silently falls back to its own default model whenever `--model` is passed without a matching `--effort`. companion-for-agy does not yet pass `--effort`, so a non-default `--model` request can silently not take effect. Tracked in ROADMAP → "Known Issues".

## [2.0.0] - 2026-07-06

### Documentation & SEO (2026-07-26)
- Updated `llms.txt` `Last-checked` timestamp to `2026-07-26` and re-verified Node.js test suite execution (209 passed, 1 skipped).

### Documentation & SEO (2026-07-25)
- Updated `llms.txt` `Last-checked` timestamp to `2026-07-25`.
- Added Node.js test badge (209 passing unit/fixture/hygiene tests) and LLM-Ready callout banner to `README.md` and `README_de.md`.
- Verified repository hygiene, clean git status, and node test suite execution.

### Documentation & SEO (2026-07-22)
- Updated `llms.txt` `Last-checked` timestamp to `2026-07-22` and added search phrases for `v2.0.0` native permission model (`--sandbox`, `--skip-permissions`) and ConPTY response capture.
- Conducted discoverability audit and verified test suite execution.

### Changed (BREAKING)
- Permission model reduced to the three modes agy natively supports, so the companion's invocation mode and agy's own internal mode are always in sync:
  - **default (no flag):** agy uses its own configuration — global `~/.gemini/antigravity-cli/settings.json` plus per-project rules (allow/deny/ask). In headless `-p` mode a tool that is neither pre-allowed nor denied resolves to "ask" and blocks, so use `--skip-permissions` for tasks needing tools that are not pre-approved.
  - **`--sandbox`:** shell and network blocked, filesystem limited to the workspace (writing files still works).
  - **`--skip-permissions`:** auto-approve every tool (YOLO), full rights.

### Removed (BREAKING)
- Soft permission modes `--no-tools`, `--researcher`, `--read-only` and the custom-rule flags `--allow` / `--deny`. agy does not read per-invocation or workspace-local permission rules, so these had no enforceable effect (verified) — they only created a false sense of enforcement.
- The per-invocation `<workspace>/.gemini/settings.json` writer (no-op: agy never adopts `cwd` as a project root) and the capability-preamble injection (unnecessary: agy is natively aware of its sandbox mode via its own `<terminal_sandbox>` system context).
- **Migration:** replace `--no-tools` / `--researcher` / `--read-only` with `--sandbox` (or the default mode); replace `--allow` / `--deny` by configuring agy's own global/project permission rules. Rationale and the (deliberately unshipped) per-invocation enforcement research are documented in ROADMAP → "Permission Model & Enforcement".

### Security
- Hardened repository hygiene for local npm credentials, token/recovery files, private keys and certificate bundles. Added a regression test that checks the effective Git ignore behavior and defensive npm ignore patterns.

## [1.4.2] - 2026-07-04

### Fixed
- Orphan-process guard (module review 2026-07-04): on the SUCCESS path the wrapper exited without ever force-killing agy — if agy ignored Ctrl+C (hung tool call, ConPTY signal loss) it survived as an orphan on every automated call. The final-exit handler now kills the PTY right before exiting whenever agy is still alive; error-path timing is unchanged.
- Temp workspace and settings.json are created with restrictive permissions (0o700/0o600) — on shared /tmp multi-user POSIX hosts they were world-readable (no-op on Windows).
- agy-debug.log is written with mode 0o600 and both CLI (all 6 languages, new statusDebugLogSensitive) and READMEs now warn that it contains the full session incl. the prompt in clear text.
- --help in es/zh-Hans/ja/ru was missing the whole Workspace/--add-dir section that en/de already had (implemented since 1.4.0) — added.

### Fixed
- Replaced the SemVer and Go-duration regex parsers with bounded linear parsing to avoid pathological backtracking on malformed CLI output or timeout values.

### Added
- `--report-file <path>` for diagnostic modes (`--doctor`, `--platform-smoke`, `--pty-smoke`, `--live-smoke`). It writes a pretty JSON report to disk while stdout remains text or JSON as requested, giving macOS/Linux handoff runs persistent evidence files.
- `--platform-smoke` bundled pre-live platform gate plus `npm run platform-smoke` / `npm run platform-smoke:json`. The report runs `--doctor` and the auth-free PTY smoke in one command, nests both reports, aggregates blockers/warnings, and prints the exact authenticated `--live-smoke --no-model --debug --json` command for Mac/Linux handoff.
- `--live-smoke` authenticated agy marker smoke plus `npm run live-smoke` / `npm run live-smoke:json` (scripts use `--no-model` for agy 1.0.x compatibility). The mode defaults to `no-tools`, asks agy to return exactly `AGY_LIVE_SMOKE_OK`, emits a text or JSON report, and exits with code `5` on marker mismatch. This gives macOS/Linux transfer work a repeatable live gate after `--doctor` and `--pty-smoke`.
- Packaged `--pty-smoke` platform smoke plus `npm run pty-smoke` / `npm run pty-smoke:json`. The smoke verifies the installed `node-pty` truecolor path without agy authentication, reports blockers/warnings as text or JSON, and gives macOS/Linux a repeatable pre-live-smoke gate before real `agy --debug` sessions.

## [1.4.1] - 2026-06-16

### Added
- **Update notifier:** shows an "update available" hint when a newer published version exists. Runs **only in an interactive terminal** (`process.stdout.isTTY`) — never in subprocess, pipe, CI or MCP usage, so machine integrations are unaffected. The check runs detached in the background. Implemented with `update-notifier`.
- Linux-specific PTY smoke test `_tests/linux-pty-smoke.test.mjs` plus `npm run test:linux-pty`. The smoke spawns `/bin/sh` through `node-pty`, verifies `spawn-helper` and `pty.node`, and checks that `RGB(232,234,237)` truecolor extraction works on the real Linux `forkpty` path without requiring agy authentication.
- **Startup fallback (graceful degradation):** If `STARTUP_DONE_PATTERNS` never match within `STARTUP_FALLBACK_MS` (30 s), the tool no longer stalls until the global 120 s timeout and exits with error code 2. Instead, it logs a status message and proceeds to send the question anyway — same fallback path as the existing init-idle timer. The new constant `STARTUP_FALLBACK_MS = 30000` is exported. Status messages added to all 6 locales (`statusStartupFallback`). Covered by unit tests.

### Documentation
- Added **Best Practices: Two Return Paths** section to README.md, README_de.md, and llms.txt. Documents that the stdout return path can garble non-ASCII/CJK content (observed on Windows) and recommends the file-output pattern via `--add-dir` for bulky or non-ASCII responses. Inbound task delivery and file output via `--add-dir` are reliable (tested on Windows, including CJK); stdout capture is the unreliable leg. Translated locales (es, ja, ru, zh-Hans) are tracked as TODO.

## [1.4.0] - 2026-06-14

### Added
- **`--add-dir <dir>` workspace passthrough** (repeatable). agy only writes files inside its own workspace; without this flag, file-write attempts outside the temp directory are silently ignored or falsely reported as successful. `--add-dir` registers additional directories with agy's `--add-dir` flag so that writes there actually land. Pair with `--skip-permissions` for full write access, or with a matching `--allow "write_file(...)"` rule in sandbox mode.

## [1.3.3] - 2026-06-08

### Fixed
- **Sidebar Workspace Leak:** When running under temporary workspaces (e.g. `agy-companion-<PID>`), the Antigravity IDE automatically registers these temp directories as projects in `.gemini/config/projects/<uuid>.json`. They were never removed, leading to sidebar clutter. Added projects cleanup logic in `cleanupTemp()` to find and delete its corresponding `.json` project configuration file upon exit.

## [1.3.2] - 2026-06-07

### Fixed
- **Response-Idle-Timer:** 1-byte trickle chunks could reset the idle timer indefinitely, making the global timeout the only backstop. The new `shouldResetIdleTimer` pure function (exported for testability) only resets the timer when ≥10 bytes of new ANSI-stripped response content have arrived, or when `detectResponseComplete` fires — whichever comes first. The constant `RESPONSE_MIN_PROGRESS_BYTES = 10` controls the threshold.

## [1.3.1] - 2026-06-07

### Fixed (Bugsweep)
- **detectResponseComplete:** Mid-response bare `>` (e.g. Markdown blockquotes, agy status lines) no longer triggers premature response-complete detection; the new `foundPromptCandidate` approach scans the full buffer and resets on real content after a candidate (`ed1436d`).
- **getMessage:** Placeholder values containing `$&`, `$'`, `` $` `` or `$n` were corrupted by JavaScript's `String.prototype.replace` special-pattern expansion; replacement now uses the function form `() => String(val)` to prevent any substitution (`5470404`).

## [1.3.0] - 2026-06-07

### Added
- CLI localization via `--lang <code>` and locale auto-detection.
- Supported CLI/documentation languages: English, German, Spanish, Simplified Chinese, Japanese, and Russian.
- New localization module `src/locales.mjs`.
- Translated README files: `README_de.md`, `README_es.md`, `README_zh-Hans.md`, `README_ja.md`, `README_ru.md`.
- German changelog: `CHANGELOG_de.md`.
- CLI regression tests for localized help and parsing errors.

### Changed
- User-facing CLI strings are now read from locale maps instead of being hardcoded in `src/agy-companion.mjs`.
- `package.json` now includes all localized documentation files in the npm package.
- Documentation now distinguishes CLI output localization, documentation translation, and agy TUI recognition patterns.

### Fixed
- Empty/non-extractable responses now exit nonzero instead of falling back to startup banner text or reporting success.
- Shutdown no longer force-kills the PTY when `Ctrl+C` already produced a clean exit, avoiding late `node-pty` cleanup stacktraces in successful runs.
- `researcher` and `read-only` permission presets now deny `command(*)` to prevent command-based writes.
- Unknown CLI options now fail fast; `--` can be used before prompts that start with a dash.
- Response color can now be overridden via `AGY_COMPANION_RESPONSE_RGB`.
- German trust/startup patterns, signal cleanup, dead-code cleanup, and one-character prompt/answer handling are covered by tests.
- agy v1.0.x can be used by omitting the model flag via `--no-model` or `AGY_COMPANION_NO_MODEL`.

## [1.2.0] - 2026-06-07

### Fixed (Bugsweep)
- **Security:** Stale temp workspace from crashed run with same PID could leak permissions to a new run; it is now cleaned on startup (`e8c5230`).
- Temp directory leak in sandbox/skip-permissions modes when no custom rules are set (`d406299`).
- Temp cleanup race on Windows: post-kill delay plus `rmSync` retries for CWD locks (`41412d6`).
- ConPTY text extraction: stale cursor position, bold SGR false positive, and too-narrow deduplication scope (`c2194bb`).
- `isNoiseLine` false positives for blockquotes (`>`) and lines containing the word "tokens" (`f6a8e7b`).

## [1.2.0-alpha.2] - 2026-06-07

### Changed
- Brand ASCII banner aligned to the left in READMEs.
- Switched image source to raw GitHub URLs to fix logo rendering on npmjs.com.

### Fixed
- Handled additional CLI tip noise (lines starting with `└`) and "Verifying..." lines in the output parser.

## [1.2.0-alpha.1] - 2026-06-07

### Changed
- Package renamed to `companion-for-agy` for legal/trademark distancing via the "for" pattern.
- Added "Unofficial" disclaimer to README and package description.

### Fixed
- Short responses (2 or fewer characters like "4", "42", "ja") were incorrectly filtered as noise.
- Prompt-echo bug in `--no-tools` mode: the permission prefix was returned as the response instead of the actual answer.
- ConPTY space loss in prompt echo: whitespace-normalized matching now handles "Donotuse" versus "Do not use".

### Added
- `stripPromptEcho()` for whitespace-tolerant prompt echo removal.
- `extractResponse()` accepts a fourth parameter, `effectiveFilter`, for full prompt echo stripping.
- 5-phase state machine with a trust dialog auto-confirmation phase.
- Banner model detection: JSON reports the actual model from agy's banner.
- 26 new tests (107 total): short-answer extraction, prompt echo regression, and `stripPromptEcho` unit tests.
- `companion-for-agy` CLI alias alongside `agy-companion` for backward compatibility.

## [1.1.0] - 2026-06-06

### Changed
- Cross-platform support: Windows, macOS, Linux (`node-pty` handles platform-specific PTYs).
- Auto-detection of the agy binary via PATH, common install locations, and environment variable fallback.
- `node-pty` loaded as a standard npm dependency, without a hardcoded path to gemini-cli internals.
- Debug log writes to `./agy-debug.log` instead of `~/.claude/scripts/`.
- CLI messages and usage text in English for an international audience.
- Added English `INIT_DONE_PATTERNS` alongside German ones.
- Removed the `"os": ["win32"]` restriction from `package.json`.

### Added
- Exported `findAgyPath()` for programmatic agy detection.
- Test suite: 81 tests (unit, fixture, smoke) via `node:test`.
- `npm run deploy` and `npm run sync` scripts for local copy management.
- Comprehensive README with installation, troubleshooting, and usage docs.

## [1.0.0] - 2026-06-06

### Added
- ConPTY-based wrapper for agy (Antigravity CLI).
- ANSI-color-based response extraction (`RGB(232,234,237)`).
- Line-based noise-filter fallback.
- 4-phase state machine (startup, init, question, response).
- Adaptive timing: 10s during generation, 2.5s after completion.
- Permission system with 5 modes: sandbox, skip-permissions, no-tools, researcher, read-only.
- Custom allow/deny rules compatible with agy's `settings.json` format.
- JSON output mode (`--json`).
- Configurable paths via environment variables.
- Prompt sanitization against PTY injection.
- Graceful shutdown.
- Debug mode with PTY output log.
