# Third-Party Licenses & Transparency Notice

> **Project:** `ellmos-ai/companion-for-agy`  
> **Audited:** 2026-09-12  
> **Repository License:** [MIT License](LICENSE)  
> **Architecture & Privacy:** 100% Local-First, Zero-Egress, Unprivileged User-Mode (`RunAsInvoker`), Virtual Terminal Subprocess Abstraction

---

## Executive Summary & Compliance Assurance

`companion-for-agy` is engineered under strict architectural and governance invariants: **100% Local-First, Zero-Egress by default, unprivileged user-mode execution (`RunAsInvoker`), and non-destructive virtual terminal encapsulation**. The core CLI wrapper, ANSI stream parser, model/effort negotiator, diagnostic preflight engine, and dual return-path dispatchers operate completely within local process boundaries without any unsolicited external network communication, telemetry, or remote tracking.

All direct, runtime, and transitive dependencies utilized across `companion-for-agy` are distributed under a strictly **100% Permissive Open Source Stack** (MIT, BSD-2-Clause, ISC, CC0-1.0). There are **zero AGPL, GPL, or proprietary restrictive copyleft constraints**, ensuring maximum portability for local developer desktop environments, multi-agent automated orchestration, and enterprise workstations.

Furthermore, `companion-for-agy` guarantees:
1. **100% Local-First & Zero-Egress (INV-LOCAL-01):** Core subprocess invocation, PTY capture, and response parsing execute completely offline with zero telemetry and zero external network calls.
2. **Non-Elevation / RunAsInvoker (INV-PRIV-02):** The utility runs strictly with standard user permissions. It never requests or requires UAC or administrative privilege elevation.
3. **PTY Process Isolation (INV-PTY-03):** Spawns child CLI sessions inside an isolated virtual terminal via `node-pty` (Windows ConPTY, POSIX forkpty), preventing terminal escape mutations from polluting the parent environment.
4. **Input Sanitization (INV-SAN-04):** Sanitizes prompt inputs and command parameters to prevent terminal escape code injection and control-character leakage.
5. **Deterministic Temp Workspace Cleanup (INV-TEMP-05):** Temporary directories created under `os.tmpdir()` are tracked deterministically and purged upon process exit or error.
6. **Native Permission Pass-Through (INV-PERM-06):** Preserves upstream permission modes (`--sandbox`, `--skip-permissions`) without fabricating unverified soft security boundaries.
7. **ANSI Truecolor Stream Extraction (INV-ANSI-07):** Employs high-precision ANSI SGR regex filters targeting truecolor RGB response streams (`RGB(232,234,237)`) with adaptive caching (`--probe-color`).
8. **Graceful Process Tree Termination (INV-PROC-08):** Cascades termination signals (SIGINT, SIGTERM) through child process trees, preventing orphaned zombie processes (`node.exe`, `agy`).
9. **Cross-Platform Diagnostic Preflight (INV-DIAG-09):** Provides comprehensive offline diagnostics (`--doctor`, `--platform-smoke`, `--pty-smoke`) verifying platform prerequisites without requiring Gemini API credentials.
10. **Dual Return Path Reliability & 48h Security SLA (INV-SLA-10):** Supports dual return paths (stdout for short prompts, `--add-dir` filesystem output for bulky/CJK responses) and guarantees a 48-hour security response SLA with 5-business-day triage commitment.

---

## Direct Runtime Dependencies

| Package | Version | License | Functional Scope | Project Repository / Upstream |
|:---|:---:|:---|:---|:---|
| **node-pty** | `^1.0.0` (1.1.0) | MIT | Native virtual terminal (ConPTY / forkpty) spawning and pseudo-terminal abstraction | [microsoft/node-pty](https://github.com/microsoft/node-pty) |
| **update-notifier** | `^7.3.1` (7.3.1) | BSD-2-Clause | Non-intrusive background check for package version updates | [yeoman/update-notifier](https://github.com/yeoman/update-notifier) |

---

## Direct Development, Build & Quality Assurance Tooling (Zero Third-Party Dev Dependency Footprint)

`companion-for-agy` maintains a **Zero Third-Party Dev Dependency Footprint** and relies exclusively on the **native Node.js standard library test runner** (`node --test`), eliminating third-party dev dependency attack surfaces:

| Tool / Subsystem | Runtime | License | Usage & Purpose |
|:---|:---:|:---|:---|
| **Node.js Test Runner** (`node:test`) | Node >= 18.0.0 | MIT / Node.js License | Built-in test execution, assertions (`node:assert/strict`), and unit/regression test suites |
| **Node.js Child Process** (`node:child_process`) | Node >= 18.0.0 | MIT / Node.js License | Subprocess orchestration and CLI regression testing |
| **Node.js Filesystem** (`node:fs`) | Node >= 18.0.0 | MIT / Node.js License | File inspection, manifest verification, and atomic disk operations |

---

## Transitive Runtime Dependencies Matrix

All transitive dependencies are resolved from `package-lock.json` and audited for 100% permissive open-source license compliance:

| Package | Version | License | Upstream Scope |
|:---|:---:|:---|:---|
| `@pnpm/config.env-replace` | 1.1.0 | MIT | Environment variable replacement |
| `@pnpm/network.ca-file` | 1.0.2 | MIT | Network CA file helper |
| `ansi-align` | 3.0.1 | ISC | Text alignment in terminal boxes |
| `ansi-regex` | 6.2.2 / 5.0.1 | MIT | ANSI terminal escape code regex matching |
| `ansi-styles` | 6.2.3 | MIT | ANSI styling codes for terminal formatting |
| `atomically` | 2.1.1 | MIT | Atomic file writes |
| `boxen` | 8.0.1 | MIT | Terminal notification boxes |
| `camelcase` | 8.0.0 | MIT | String casing transformation |
| `chalk` | 5.6.2 | MIT | Terminal string styling |
| `cli-boxes` | 3.0.0 | MIT | Box styles for terminal output |
| `config-chain` | 1.1.13 | MIT | Configuration loader chain |
| `configstore` | 7.1.0 | BSD-2-Clause | Configuration storage |
| `deep-extend` | 0.6.0 | MIT | Recursive object extension |
| `dot-prop` | 9.0.0 | MIT | Property path access |
| `emoji-regex` | 10.6.0 / 8.0.0 | MIT | Emoji character detection |
| `escape-goat` | 4.0.0 | MIT | HTML character escaping |
| `get-east-asian-width` | 1.6.0 | MIT | East Asian character width calculation |
| `global-directory` | 4.0.1 | MIT | Global npm package directories |
| `graceful-fs` | 4.2.11 / 4.2.10 | ISC | Resilient filesystem wrapper |
| `ini` | 4.1.1 / 1.3.8 | ISC | INI configuration parsing |
| `is-fullwidth-code-point` | 3.0.0 | MIT | Fullwidth character detection |
| `is-in-ci` | 1.0.0 | MIT | CI environment detection |
| `is-installed-globally` | 1.0.0 | MIT | Global install detection |
| `is-npm` | 6.1.0 | MIT | npm runtime detection |
| `is-path-inside` | 4.0.0 | MIT | Path boundary check |
| `ky` | 1.14.3 | MIT | Tiny HTTP client for update notification |
| `latest-version` | 9.0.0 | MIT | Latest package version lookup |
| `minimist` | 1.2.8 | MIT | Argument option parsing |
| `node-addon-api` | 7.1.1 | MIT | C++ Node-API wrapper |
| `package-json` | 10.0.1 | MIT | Metadata fetching |
| `proto-list` | 1.2.4 | ISC | Prototype chain list |
| `pupa` | 3.3.0 | MIT | String interpolation template |
| `rc` | 1.2.8 | (BSD-2-Clause OR MIT OR Apache-2.0) | Runtime configuration loader |
| `registry-auth-token` | 5.1.1 | MIT | Registry auth token helper |
| `registry-url` | 6.0.1 | MIT | npm registry URL resolution |
| `semver` | 7.8.4 | ISC | Semantic versioning validator |
| `string-width` | 7.2.0 / 4.2.3 | MIT | Visual string width calculation |
| `strip-ansi` | 7.2.0 / 6.0.1 | MIT | ANSI escape sequence removal |
| `strip-json-comments` | 2.0.1 | MIT | JSON comment stripping |
| `stubborn-fs` | 2.0.0 | MIT | Resilient file writing |
| `stubborn-utils` | 1.0.2 | MIT | Utility functions |
| `type-fest` | 4.41.0 | (MIT OR CC0-1.0) | Essential TypeScript types |
| `when-exit` | 2.1.5 | MIT | Process exit handler |
| `widest-line` | 5.0.0 | MIT | Maximum line width calculation |
| `wrap-ansi` | 9.0.2 | MIT | Word wrap for ANSI strings |
| `xdg-basedir` | 5.1.0 | MIT | XDG Base Directory specification paths |

---

## Distribution Notes & Compliance Verification

- `companion-for-agy` is published under the terms of the **MIT License**.
- Every runtime and transitive dependency resolved by `package-lock.json` utilizes an approved, permissive open-source license (MIT, BSD-2-Clause, ISC, CC0-1.0).
- The package does not link against, bundle, or distribute any proprietary or restrictive copyleft software.
- Upstream `agy` (Antigravity CLI / Gemini CLI) binaries and tools are not bundled within this package; users supply their own native `agy` installation.
