# Roadmap

## Platform Status

| Platform | Status | Notes |
|----------|--------|-------|
| **Windows** | Verified | ConPTY, agy >= 1.1, RGB(232,234,237) confirmed |
| **macOS** | Untested | node-pty (forkpty) expected to work, color values unconfirmed |
| **Linux** | PTY smoke in CI | `node-pty`/`forkpty`, `spawn-helper`, native binary and `RGB(232,234,237)` ANSI extraction are covered by `_tests/linux-pty-smoke.test.mjs`; a real agy live smoke is still open |

## Known Issues

### `--model` silently ignored without `--effort` (agy >= 1.1.5) — resolved in 2.1.0

Discovered during a real authenticated live-smoke on Windows (2026-07-23, agy 1.1.5): passing `--model <model>` without a matching `--effort` now prints `⚠ Warning ⎿ --model <model> requires --effort (available: low, medium, high). Using the default model instead.` and agy silently falls back to its own default model. companion-for-agy does not currently pass `--effort`, so a non-default `--model` request (e.g. `gemini-3.5-pro` when agy's own default is `gemini-3.5-flash`) can silently not take effect — the JSON output's `model` field (detected from agy's banner) will still correctly reflect whichever model actually ran, but `requestedModel` may no longer match it.

**TODOs:**
- [x] Add an `--effort <low|medium|high>` passthrough flag (mirroring agy's own flag) so `--model` keeps working on agy >= 1.1.5. *(shipped in 2.0.2)*
- [x] Surface a silent model fallback distinctly: stderr warning `warnModelMismatch` (localized, 6 languages) whenever the banner-detected model does not match the requested one, plus a `modelMismatch: true/false` field in JSON output. *(shipped in 2.0.2; detection is banner-based rather than warning-banner-based, which also catches fallbacks that print no warning)*
- [x] Discover the model/effort catalog from agy's own CLI, auto-select a supported effort, and retry once before sending the prompt when agy rejects the current effort mode. *(shipped in 2.1.0; live-verified with agy 1.1.8 on Windows)*
- [x] Re-verify on agy 1.1.11 whether the invalid-model catalog format changes; the ANSI-wrapped `Available models:` catalog and effort variants remain parseable, with regression coverage. *(verified 2026-08-13)*

## Planned

### macOS / Linux Support

The tool is currently **Windows-only verified**. macOS and Linux are expected to work via `node-pty` (which uses forkpty instead of ConPTY), but the following items need verification:

**TODOs:**
- [ ] Verify ANSI response color on macOS (is it still `RGB(232,234,237)` or does agy use a different palette?)
- [x] Add a Linux PTY smoke that exercises `node-pty`/`forkpty`, `spawn-helper`, native binary discovery and truecolor extraction without requiring agy authentication
- [x] Add bundled `--platform-smoke` / `npm run platform-smoke:json` gate that runs doctor + PTY smoke and prints the next authenticated live-smoke command for Mac/Linux handoff logs
- [x] Add `--report-file <path>` so Mac/Linux doctor, platform-smoke, PTY-smoke and live-smoke runs can persist JSON evidence files while keeping stdout compatible
- [x] Add an authenticated live-smoke mode (`--live-smoke`) that asks agy for `AGY_LIVE_SMOKE_OK`, emits text/JSON reports, and exits nonzero on marker mismatch
- [ ] Verify ANSI response color on Linux during a real agy session
- [x] Handle agy v1.0.x (Homebrew `antigravity-cli`) which lacks `--model` flag — `--model` can be skipped via `--no-model` or `AGY_COMPANION_NO_MODEL`
- [ ] Test node-pty spawn-helper permissions after `npm install` on macOS (prebuilt binaries need +x)
- [ ] Test trust dialog auto-confirmation flow on macOS/Linux
- [x] Add a Linux-specific CI smoke for the PTY path without agy authentication
- [ ] Add an agy-authenticated Linux live smoke when a safe CI credential path exists, otherwise keep that step manual

**Diagnostics available now:**
- `--debug` flag saves raw PTY output to `agy-debug.log` — inspect for actual ANSI color codes on any platform
- `AGY_COMPANION_RESPONSE_RGB` environment variable override for platform/theme-specific response colors
- `--platform-smoke --json` bundles the auth-free pre-live checks and records the exact next live-smoke command
- `--platform-smoke --report-file reports/platform-smoke.json` persists a pretty JSON evidence file for handoff logs
- `--live-smoke --no-model --debug --json` is the repeatable authenticated gate after `--doctor` and `--pty-smoke` on macOS/Linux

### Color Fallback / Auto-Probe
The current ANSI color extraction relies on `RGB(232,234,237)` as the response color. This has been verified on Windows (ConPTY). If agy changes its color scheme or uses different values on macOS/Linux, extraction silently fails.

**Implemented:**
- [x] `--probe-color`: Run a known-answer prompt ("What is 2+2?"), scan the raw ANSI stream for the color that wraps "4", and cache it per platform/architecture
- [x] Platform-specific RGB override via environment variable (`AGY_COMPANION_RESPONSE_RGB`)
- Heuristic: find the most frequent non-UI color in the stream

### Internationalization (i18n)

Internationalization is split into three surfaces:

1. **companion-for-agy CLI output**: help text, errors, and status messages owned by this wrapper.
2. **Documentation**: README, contributing guide, changelog, examples, and release notes.
3. **agy TUI recognition patterns**: internal regexes for trust dialog, startup readiness, init completion, prompt echo, and response completion.

Empirical status on Windows (2026-06-07): `agy --help` remained English under `LANG=en_US`, `de_DE`, `ja_JP`, and `zh_CN`. Treat agy's CLI help as English-only for now, but do not assume all TUI dialogs, plugins, future agy releases, or platform-specific flows will stay English.

Language target set for user-facing companion text:

| Code | Language | Priority | Scope |
|------|----------|----------|-------|
| `en` | English | P0 | Default CLI and canonical docs |
| `de` | German | P0 | First translated docs and CLI output |
| `es` | Spanish | P1 | Docs and CLI output |
| `zh-Hans` | Simplified Chinese | P1 | Docs and CLI output |
| `ja` | Japanese | P1 | Docs and CLI output |
| `ru` | Russian | P1 | Docs and CLI output |

Recognition-pattern policy: keep English as baseline; add non-English patterns only when observed in agy output or documented upstream. Avoid guessing translations for critical parser states because false positives can send prompts too early or terminate capture too late.

**Pattern Recognition (critical):**
- [x] Audit all regex patterns (`TRUST_DIALOG_PATTERN`, `STARTUP_DONE_PATTERNS`, `INIT_DONE_PATTERNS`) for locale dependency
- [x] Add German patterns for trust dialog and startup detection
- [x] Test agy CLI help under non-English locales — observed English output for `en_US`, `de_DE`, `ja_JP`, `zh_CN` on Windows
- [ ] Test full agy TUI under non-English locales — does agy localize dialogs beyond `--help`?
- [ ] Add observed Spanish, Simplified Chinese, Japanese, and Russian recognition patterns only if agy emits localized TUI strings
- [x] Fallback strategy: if no known pattern matches within timeout, proceed anyway (graceful degradation) — `STARTUP_FALLBACK_MS = 30000`, fires before global timeout, 6-locale status message, unit-tested (2026-06-16)

**CLI Output:**
- [x] Extract all user-facing strings (help text, error messages, status output) into a locale map
- [x] Auto-detect locale from `LANG`/`LC_ALL` environment variable or `--lang` flag
- [x] Supported CLI languages: English (default), German, Spanish, Simplified Chinese, Japanese, Russian

**Documentation:**
- [x] README.md (English) + README_de.md (German) with language switcher badges
- [x] CONTRIBUTING.md — German translation
- [x] CHANGELOG.md — bilingual or German translation
- [x] README_es.md — Spanish
- [x] README_zh-Hans.md — Simplified Chinese
- [x] README_ja.md — Japanese
- [x] README_ru.md — Russian

### Robust Response Return (stdout capture for long / non-ASCII / CJK responses)

The stdout return path is currently unreliable for **long, non-ASCII, or CJK content**: characters can be garbled into replacement characters (U+FFFD), as documented in the "Best Practices: Two Return Paths" section of the README. The capture happens through ConPTY/ANSI color extraction, where multi-byte sequences and terminal-buffer reflow can corrupt non-ASCII text.

**Current workaround:** let agy write its result to a file itself via `--add-dir` and read it from disk (lossless UTF-8, including CJK). This works but forces callers into a file-based contract instead of a clean stdout response.

**Goal:** make the return path itself robust, so the file-output workaround is no longer mandatory for bulky or non-ASCII responses.

**Ideas:**
- Harden the ConPTY capture's encoding handling: treat the PTY stream as a byte stream and decode UTF-8 only after reassembly, so multi-byte sequences split across chunks are not corrupted.
- Audit the ANSI/SGR extraction and terminal-buffer reflow handling for multi-byte/wide (CJK) characters and replacement-character insertion points.
- Add a structured `--json` output channel that carries the response losslessly (e.g. agy writing to a known temp file behind the scenes, or an explicit length-delimited/base64 transport), decoupling the response payload from terminal rendering.
- Regression tests with long and CJK (Chinese/Japanese/Korean) payloads asserting byte-exact round-trips, on Windows first, then macOS/Linux.

### Multi-Turn Mode
Currently, each invocation spawns a fresh agy process (one question, one answer). A persistent mode that keeps the PTY alive across multiple prompts would reduce startup overhead for batch workloads.

### Streaming Output
Emit response tokens as they arrive (line-by-line or chunk-by-chunk) instead of buffering until completion. Useful for long responses where the caller wants progressive output.

- [x] Add `--stream` text mode and JSONL chunk/result events with regression coverage.

### Response Format Detection
Detect whether agy's response is Markdown, JSON, or plain text and expose this in JSON output as a stable `format` field.

**Target JSON contract:** `format` should be one of `"markdown"`, `"json"`, or `"text"`. Existing `response` contents stay unchanged.

**TODOs:**
- [ ] Add a small pure detector that first accepts strict JSON (`JSON.parse` on trimmed object/array responses), then Markdown structure (headings, fenced code, tables, lists, blockquotes, or links), otherwise plain text.
- [ ] Add `format` to normal `--json` responses; diagnostic JSON modes (`--doctor`, `--platform-smoke`, `--pty-smoke`, `--live-smoke`) keep their existing report schemas unless they carry an agy answer payload.
- [ ] Cover JSON, Markdown, and plain-text fixtures with unit tests, including short answers such as `4` and prose containing braces that is not valid JSON.

### Robustness Improvements (from Bugsweep 2026-06-07)

Items identified during the systematic bug sweep that are design improvements, not defects:

- [x] **Response idle timer minimum-progress threshold:** A response must add at least 10 bytes since the previous progress checkpoint before the idle timer is reset; a completion-state transition is still handled immediately. Implemented by `RESPONSE_MIN_PROGRESS_BYTES`/`shouldResetIdleTimer()` with unit coverage. *(verified 2026-08-13)*
- [x] **Signal handling for external kill:** Register `process.on('SIGTERM')` and `process.on('SIGINT')` to ensure temp workspace cleanup when the process is killed externally (e.g., by a parent orchestrator or Ctrl+C in a pipeline).
- [x] **Dead code cleanup:** `tempSettingsCreated` variable is set but never read. Cleanup works unconditionally via `cleanupTemp()`.
- [x] **Prompt-echo filter edge case:** Very short prompts (≤2 chars) identical to the response text are incorrectly filtered as prompt echoes. Rare in practice (requires the user's question to be the same as the answer), but theoretically possible.

## Permission Model & Enforcement (research findings, 2026-07-06)

agy exposes exactly **three native permission states**, which the companion now passes through 1:1 (no settings.json is written, no prompt preamble is injected):

- **default (no flag):** agy uses its own configuration — the global `~/.gemini/antigravity-cli/settings.json` plus per-project rules under `~/.gemini/config/projects/` (allow / deny / ask; precedence **Deny > Ask > Allow**). Headless caveat: a tool that is neither pre-allowed nor denied resolves to "ask" and blocks in `-p` print mode; use `--skip-permissions` for tasks needing tools that are not pre-approved.
- **`--sandbox`:** shell and network blocked, filesystem limited to the workspace (file writing still works). agy is *natively aware* of this via its own `<terminal_sandbox>` system context, so no prompt preamble is needed to inform it.
- **`--skip-permissions`:** auto-approve everything (YOLO).

**Verified no-op (removed):** supplying finer-grained rules per invocation. The companion previously wrote a `<workspace>/.gemini/settings.json` and offered `--researcher`/`--read-only`/`--no-tools`/`--allow`/`--deny` plus a capability preamble. agy never reads a workspace-local settings file (it does not adopt `cwd` as a project root — verified), so those rules had **no effect**. They were removed to avoid a false sense of enforcement.

**Proven but deliberately NOT implemented — per-invocation enforcement:** writing a `deny`/`allow` rule into the **global** `~/.gemini/antigravity-cli/settings.json` *does* change agy's effective permissions and `list_permissions` output (verified with a temporary rule + backup/restore). But driving the shared global user config per run is error-prone: path drift across agy versions, races with parallel agy sessions, and a crash mid-edit corrupts the user's config. A safe version would need an **isolated** config store (an own `--project` id, or a redirected config home with auth carried over) plus robust path discovery and atomic backup/restore. Not planned; documented so the knowledge is preserved.

**Future (not planned) — token / quota signal:** detect agy's quota / rate-limit / auth errors from the PTY output and surface them with a dedicated exit code and a clear message ("agy quota/token limit reached") instead of a generic failure.

**Future (not planned) — role / agent prompt injection:** giving agy a role/agent prompt (e.g. a research role) is a *separate* concept that has nothing to do with permissions; it would be an independent, opt-in feature layered on top of any of the three modes.

## Completed (v1.2.0-alpha.1)

- Trust dialog auto-confirmation (5-phase state machine)
- Banner model detection (actual model from agy's banner)
- Short response noise filter fix (answers like "4" or "42")
- Prompt-echo stripping in no-tools mode (ConPTY space-loss tolerant)
- Cross-platform agy binary auto-detection
- node-pty as standard npm dependency
