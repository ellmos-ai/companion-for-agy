# companion-for-agy


<p align="left">
  <img src="assets/logo.jpg" alt="companion-for-agy Banner" width="800" />
</p>

[![npm](https://img.shields.io/npm/v/companion-for-agy)](https://www.npmjs.com/package/companion-for-agy)
[![CI](https://github.com/ellmos-ai/companion-for-agy/actions/workflows/tests.yml/badge.svg)](https://github.com/ellmos-ai/companion-for-agy/actions/workflows/tests.yml)
[![Node Tests](https://img.shields.io/badge/tests-232%20passed%2C%201%20skipped-brightgreen.svg)](https://github.com/ellmos-ai/companion-for-agy/blob/master/package.json)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue.svg)](https://github.com/ellmos-ai/companion-for-agy)
[![PTY Engine](https://img.shields.io/badge/pty-ConPTY%20%7C%20forkpty-informational.svg)](https://github.com/ellmos-ai/companion-for-agy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Ecosystem](https://img.shields.io/badge/ecosystem-dev--bricks-blue.svg)](https://github.com/dev-bricks)
[![Ecosystem](https://img.shields.io/badge/ecosystem-ellmos--ai-purple.svg)](https://github.com/ellmos-ai)
[![Umbrella](https://img.shields.io/badge/umbrella-open--bricks-blue.svg)](https://github.com/open-bricks)
[![LLM-Ready](https://img.shields.io/badge/LLM--Ready-llms.txt-blue.svg)](llms.txt)
[![English](https://img.shields.io/badge/lang-English-blue)](README.md)
[![Deutsch](https://img.shields.io/badge/lang-Deutsch-blue)](README_de.md)
[![Español](https://img.shields.io/badge/lang-Espa%C3%B1ol-blue)](README_es.md)
[![简体中文](https://img.shields.io/badge/lang-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-blue)](README_zh-Hans.md)
[![日本語](https://img.shields.io/badge/lang-%E6%97%A5%E6%9C%AC%E8%AA%9E-blue)](README_ja.md)
[![Русский](https://img.shields.io/badge/lang-%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%B8%D0%B9-blue)](README_ru.md)

> **Unofficial** - not affiliated with or endorsed by Google.

> [!NOTE]
> **AI Agent & LLM Integration:** `companion-for-agy` is structured for automated execution by AI agents (Claude Code, Codex, Antigravity, n8n). For machine-readable context, architecture summaries, and search phrases, see [llms.txt](llms.txt).

PTY-based wrapper for **agy** (Antigravity CLI / Gemini CLI) that captures Gemini responses from subprocesses.

| Start here | Link |
|---|---|
| Install | `npm install -g companion-for-agy` |
| Run | `companion-for-agy --json --sandbox "prompt"` |
| German docs | [README_de.md](README_de.md) |
| Changelog | [CHANGELOG.md](CHANGELOG.md) |
| npm package | [npmjs.com/package/companion-for-agy](https://www.npmjs.com/package/companion-for-agy) |

## Problem

`agy -p` (print mode) exits with code 0 but writes no response to stdout. Instead, the TUI text-drip renderer (`text_drip.go`) writes to the terminal buffer. Known upstream issues:

- [antigravity-cli#76](https://github.com/google-antigravity/antigravity-cli/issues/76)
- [gemini-cli#27466](https://github.com/google-gemini/gemini-cli/issues/27466)
- [antigravity-cli#115](https://github.com/google-antigravity/antigravity-cli/issues/115)

That means other agents such as Claude Code, Codex, or CI/CD scripts cannot programmatically read agy's responses.

## Solution

`companion-for-agy` starts agy inside a virtual terminal via `node-pty` (ConPTY on Windows, forkpty on macOS/Linux) and extracts the response from the ANSI color stream. agy's response text currently uses `RGB(232,234,237)`, so the wrapper tracks ANSI color state and collects only text in that color.

> **Platform note:** ANSI color extraction (`RGB(232,234,237)`) and the `--model` flag have been verified on **Windows** with agy >= 1.1. On **Linux**, the repository now also has a real `node-pty`/`forkpty` smoke (`npm run test:linux-pty`) that checks `spawn-helper`, the native `pty.node`, and truecolor extraction through `/bin/sh`; the remaining open Linux step is a live agy session. macOS still needs the first independent live verification.
>
> - **agy v1.0.x** (Homebrew `antigravity-cli`) does not support `--model`; use `--no-model` or `AGY_COMPANION_NO_MODEL=1`.
> - If color extraction returns an empty result, run with `--debug` and inspect `agy-debug.log`.
> - Run `companion-for-agy --doctor` before the first macOS/Linux smoke to verify agy path, `node-pty`, native binary, and POSIX `spawn-helper` readiness.
> - Run `companion-for-agy --pty-smoke` before the first live agy test. It verifies the packaged `node-pty` truecolor path without requiring agy authentication.
> - Run `companion-for-agy --platform-smoke --json` to bundle `--doctor` and `--pty-smoke` into one pre-live platform gate for macOS/Linux handoff logs.
> - Run `companion-for-agy --live-smoke --no-model --debug --json` for the first authenticated macOS/Linux live smoke. It asks agy for the marker `AGY_LIVE_SMOKE_OK`, verifies the captured response exactly, and writes raw ANSI evidence to `agy-debug.log`.
> - On Linux, run `npm run test:linux-pty` before the first live agy test. It verifies the PTY pipeline without requiring agy authentication.

## Installation

```bash
npm install -g companion-for-agy
```

### Prerequisites

- **Node.js >= 18**
- **agy** ([Gemini CLI](https://github.com/google-gemini/gemini-cli)) installed and authenticated
- **C/C++ build tools** for native `node-pty` compilation:
  - **Windows:** Visual Studio Build Tools + Python 3
  - **macOS:** `xcode-select --install`
  - **Linux:** `sudo apt install build-essential python3` (Debian/Ubuntu)

If native compilation fails, run:

```bash
npm rebuild node-pty
```

## Usage

```bash
companion-for-agy [options] "prompt"
```

### Permission Modes

agy exposes exactly three native permission states; companion-for-agy passes the matching flag through unchanged. There are no soft/emulated modes and no per-invocation allow/deny rules — agy does not read workspace-local permission rules, so enforcement comes only from these flags.

| Flag | Description |
|------|-------------|
| _(default, no flag)_ | agy uses its **own** configuration (global + per-project allow/deny/ask rules under `~/.gemini/antigravity-cli/`) |
| `--sandbox` | Shell and network blocked, filesystem limited to the workspace (writing files still works) |
| `--skip-permissions` | Auto-approve every tool (YOLO), full rights. Also accepts `--dangerously-skip-permissions` |

> **Default-mode caveat:** In headless print mode a tool that is neither pre-allowed nor denied in agy's own config resolves to `ask` and blocks. Use `--skip-permissions` for tasks that need tools which are not already approved.

### Workspace

```bash
--add-dir "/path/to/dir"      # Add a directory to agy's workspace (repeatable)
```

agy only writes files inside its own workspace directory. Without `--add-dir`, any file-write attempt outside the temp workspace is silently ignored or reported as a success even though no file was created.

Use `--add-dir` to register additional directories so agy can actually create or modify files there:

```bash
# Write a file into /my/output — requires both workspace registration and write permission
companion-for-agy --skip-permissions --add-dir "/my/output" \
  "Write hello.txt to /my/output with content: Hello World"
```

> **Note:** `--skip-permissions` (YOLO mode) controls **tool authorization**; `--add-dir` controls **workspace scope**. Both are needed when writing to a directory outside the default temp workspace.

### Options

| Flag | Description |
|------|-------------|
| `--add-dir <dir>` | Add a directory to agy's workspace (repeatable); required for agy to write files outside its temp dir |
| `--model <model>` | Gemini model (default: `gemini-3.5-flash`) |
| `--effort <level>` | Explicit agy effort; validated against the discovered model catalog |
| `--no-effort` | Suppress automatic effort selection for the requested model |
| `--no-model` | Do not pass `--model` to agy; useful for agy v1.0.x |
| `--list-models` | Print the live agy model catalog (cached for 24 hours per agy path/version) |
| `--refresh-models` | Refresh the live model catalog and print it |
| `--version`, `-V` | Print the companion version |
| `--timeout <ms>` | Timeout in ms (default: `120000`) |
| `--json` | Output as JSON object |
| `--report-file <path>` | Write diagnostic report JSON to a file for `--doctor`, `--platform-smoke`, `--pty-smoke` and `--live-smoke` |
| `--debug` | Save raw PTY output to `agy-debug.log` (contains the full session incl. your prompt in clear text — do not commit) |
| `--doctor` | Print a platform preflight for agy, node-pty and helper artifacts |
| `--platform-smoke` | Run `--doctor` and `--pty-smoke` as one pre-live platform gate |
| `--pty-smoke` | Run an auth-free node-pty truecolor smoke for platform validation |
| `--live-smoke` | Run a real agy marker smoke; defaults to `sandbox` unless another permission mode is selected |
| `--probe-color` | Ask `What is 2+2?`, detect the truecolor wrapping `4`, and cache it per platform |
| `--stream` | Emit response chunks as they arrive instead of waiting for the final response |
| `--lang <code>` | CLI output language: `en`, `de`, `es`, `zh-Hans`, `ja`, `ru` |
| `--` | Stop option parsing; use before prompts that start with `-` |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `AGY_COMPANION_AGY_PATH` | Path to agy binary (auto-detected if unset) |
| `AGY_PATH` | Alternative path to agy binary |
| `AGY_COMPANION_NO_MODEL` | Set to `1`, `true`, or `yes` to omit `--model` |
| `AGY_COMPANION_RESPONSE_RGB` | Override response color as `R,G,B` or `R;G;B` |
| `AGY_COMPANION_RESPONSE_RGB_CACHE` | Override the per-platform response-color cache path |

### Examples

```bash
companion-for-agy "What is the capital of Bavaria?"
companion-for-agy --sandbox "Review this code: ..."
companion-for-agy --json --model gemini-3.6-flash --effort high "prompt"
companion-for-agy --refresh-models --json
companion-for-agy --no-model "prompt"
companion-for-agy --skip-permissions --add-dir "/my/output" "Write hello.txt to /my/output"
companion-for-agy --doctor
companion-for-agy --doctor --json
companion-for-agy --platform-smoke --report-file reports/platform-smoke.json
companion-for-agy --platform-smoke --json
companion-for-agy --pty-smoke --json
companion-for-agy --live-smoke --no-model --debug --json
companion-for-agy --probe-color --no-model --json
companion-for-agy --stream --sandbox "Explain this change briefly."
companion-for-agy --lang de --help
companion-for-agy --sandbox -- "-dash-prefixed prompt"
```

For agy >= 1.1, the companion discovers the available models and their effort variants from agy's own invalid-model response. It validates explicit selections, automatically chooses a supported effort when none is supplied, and retries once before the prompt if agy reports that effort must be added or removed.

JSON output includes `response`, `model`, `requestedModel`, `effort`, `effortAutoSelected`, `availableModels`, and `permissionMode`. `model` is detected from agy's banner when possible and falls back to `requestedModel`. With `--stream --json`, chunk events are emitted as `{"type":"chunk","chunk":"..."}` and the final result as `{"type":"result",...}`.

`--probe-color` runs the fixed known-answer prompt `What is 2+2?`, identifies the truecolor SGR segment containing `4`, and stores it in a platform/architecture-scoped cache. An explicit `AGY_COMPANION_RESPONSE_RGB` always takes precedence. Use `AGY_COMPANION_RESPONSE_RGB_CACHE` to keep the cache in a controlled location during tests or CI.

For `--doctor --json`, the output instead contains a preflight report with `status`, `blockers`, `warnings`, agy version detection, `node-pty` load details and helper/binary paths.
For `--platform-smoke --json`, the output contains a bundled pre-live report with nested doctor and PTY-smoke results plus the exact authenticated live-smoke command to run next.
For `--pty-smoke --json`, the output contains a PTY smoke report with the command used, expected/extracted truecolor text, raw byte count, and blockers/warnings. This is the first auth-free check to run on macOS and Linux before a real `agy --debug` live smoke.
For `--live-smoke --no-model --debug --json`, the output contains an authenticated agy live-smoke report with `status`, marker match details, model metadata, permission mode, response RGB and the debug-log path. A marker mismatch exits with code `5`.
Add `--report-file <path>` to any diagnostic mode when the report should be persisted as pretty JSON while stdout keeps its selected text or JSON format.

## Internationalization Scope

There are three separate i18n surfaces:

1. **companion-for-agy CLI output:** help text, errors, and status lines produced by this wrapper.
2. **Documentation:** README, contributing guide, changelog, and examples.
3. **agy TUI recognition patterns:** internal regexes that detect agy's trust dialog, startup readiness, init completion, and response completion.

Local Windows checks showed that `agy --help` stayed English under `LANG=en_US`, `de_DE`, `ja_JP`, and `zh_CN`. That suggests agy's CLI help is currently English-only, but it does not prove every TUI dialog, future agy release, plugin, or OS-specific flow will stay English.

Planned user-facing languages:

| Code | Language | Scope |
|------|----------|-------|
| `en` | English | Default CLI and canonical docs |
| `de` | German | Translated docs and CLI output |
| `es` | Spanish | Translated docs and CLI output |
| `zh-Hans` | Simplified Chinese | Translated docs and CLI output |
| `ja` | Japanese | Translated docs and CLI output |
| `ru` | Russian | Translated docs and CLI output |

Recognition patterns are not blindly translated. English stays the baseline; non-English patterns are added only when agy actually emits those strings or a stable upstream string is documented.

## How It Works

```text
companion-for-agy (Node.js)
  -> starts agy in a PTY
  -> detects trust/startup/init states
  -> sends the prompt
  -> captures ANSI response-color segments
  -> writes response text to stdout
```

**5-phase state machine:**

1. **Trust:** detect and auto-confirm workspace trust dialog
2. **Startup:** detect main UI readiness (`? for shortcuts`)
3. **Init:** wait for initialization, with timeout fallback
4. **Question:** send prompt and mark response start
5. **Response:** extract response via ANSI color and adaptive idle timers

## Use Cases

- Multi-agent orchestration: Claude Code, Codex, or other agents querying Gemini via agy
- CI/CD scripts that need text output from agy
- Local automation where agy's TUI response must be captured as stdout

## Best Practices: Two Return Paths

companion-for-agy gives you two ways to get results back from agy. Choose based on what you need:

### Path 1 — stdout (short messages, task delegation)

The default path: companion-for-agy captures agy's response from the PTY and writes it to its own stdout. This works reliably for **short responses and ASCII text**, and is the right choice when you delegate a task with a brief `-p` prompt and only need a compact answer back.

```bash
companion-for-agy --sandbox "What is 2 + 2?"
```

**Limitation (observed on Windows):** When the response is long or contains non-ASCII content (e.g. CJK characters such as Chinese, Japanese, Korean), the stdout relay can garble the output — replacing characters with replacement characters (U+FFFD, e.g. `从​方阵…` becomes `从​​阵…`). This is a property of the PTY/ANSI extraction layer, not of agy itself.

### Path 2 — file output via `--add-dir` (bulky responses, non-ASCII, CJK)

Let agy write its result directly to a file. agy writes to disk itself; the data never passes through the PTY color extraction. This path is reliable for **any content**, including full CJK text.

**Pattern:** write a short instruction file, point agy at it with a brief `-p` prompt, and read the result from disk.

```bash
# agy writes the result to /my/output/result.json itself — clean UTF-8, including CJK
companion-for-agy --skip-permissions --add-dir "/my/output" \
  "Read /my/output/task.txt and follow it exactly."
# then read /my/output/result.json (or whatever the task specifies)
```

> **Rule of thumb:**
> - **Delegate tasks, pass short prompts** → stdout is fine.
> - **Need the full response reliably** (long text, non-ASCII, CJK) → use `--add-dir` and let agy write the file.

**Evidence:** Inbound task delivery is reliable (agy receives instructions correctly, including CJK). File output via `--add-dir` is also clean (tested on Windows with CJK content). The stdout return path is the unreliable leg for non-ASCII/bulky content.

## Sibling Tools & Ecosystem Matrix

`companion-for-agy` is part of the **[dev-bricks](https://github.com/dev-bricks)** and **[ellmos-ai](https://github.com/ellmos-ai)** developer tooling ecosystems under the **[open-bricks](https://github.com/open-bricks)** open-source umbrella:

| Tool | Ecosystem | Focus | Link |
|---|---|---|---|
| **safe-start-for-codex** | `dev-bricks` | Startup surge prevention & resource throttling for Codex Desktop | [GitHub](https://github.com/dev-bricks/safe-start-for-codex) |
| **automizer-for-claude-desktop** | `dev-bricks` | Automations and hook orchestrator for Claude Desktop | [GitHub](https://github.com/dev-bricks/automizer-for-claude-desktop) |
| **DevCenter** | `dev-bricks` | Developer dashboard, tool health & multi-agent system orchestration | [GitHub](https://github.com/dev-bricks/DevCenter) |
| **CodeBox** | `dev-bricks` | Isolated code execution sandbox & script runner | [GitHub](https://github.com/dev-bricks/CodeBox) |
| **CareCenter-for-Codex** | `dev-bricks` | Client care documentation & clinical process assistant | [GitHub](https://github.com/dev-bricks/CareCenter-for-Codex) |
| **automation-master** | `dev-bricks` | Workflow automation engine & multi-agent scheduler | [GitHub](https://github.com/dev-bricks/automation-master) |
| **ellmos-filecommander-mcp** | `ellmos-ai` | Filesystem, shell & process orchestration MCP server | [GitHub](https://github.com/ellmos-ai/ellmos-filecommander-mcp) |
| **ellmos-codecommander-mcp** | `ellmos-ai` | Code analysis, refactoring & AST processing MCP server | [GitHub](https://github.com/ellmos-ai/ellmos-codecommander-mcp) |
| **ellmos-controlcenter-mcp** | `ellmos-ai` | MCP stack control plane, bundle routing & permission audit | [GitHub](https://github.com/ellmos-ai/ellmos-controlcenter-mcp) |
| **ellmos-clatcher-mcp** | `ellmos-ai` | Multi-agent communication bridge & cross-process clipboard | [GitHub](https://github.com/ellmos-ai/ellmos-clatcher-mcp) |
| **n8n-manager-mcp** | `ellmos-ai` | n8n workflow management, backup & activation MCP server | [GitHub](https://github.com/ellmos-ai/n8n-manager-mcp) |
| **skills** | `ellmos-ai` | Autonomous agent skills & execution library | [GitHub](https://github.com/ellmos-ai/skills) |
| **open-bricks** | `open-bricks` | Umbrella catalog for modular open-source software bricks | [GitHub](https://github.com/open-bricks) |

## Discovery Context

Search for **`dev-bricks/companion-for-agy`**, **`companion-for-agy stdout capture`**, **`agy Gemini CLI PTY wrapper`**, or **`Antigravity CLI subprocess response capture`** to find this project directly.

This project is not the official Gemini CLI Companion VS Code extension, not a generic AI companion chatbot, and not related to Databricks Agent Bricks. It is a Node.js `node-pty`/ConPTY wrapper for capturing agy or Gemini CLI responses as stdout for automation.

## Background

This tool was built because three CLI agents - Claude Code, Codex, and agy - need to call each other as fallback advisors. Claude to Codex and agy to Claude/Codex already worked; Claude to agy was blocked by the TUI stdout bug.

## License

MIT
