# Sicherheitsrichtlinie / Security Policy

## Deutsch

### Unterstützte Versionen

| Version | Unterstützt | Status |
|---|---|---|
| 2.1.x | :white_check_mark: | Aktiv unterstützt (empfohlen) |
| 2.0.x | :white_check_mark: | Sicherheits-Patches |
| < 2.0 | :x: | EoL (End of Life) — bitte aktualisieren |

### Sicherheitsphilosophie & Leitlinien

companion-for-agy ist eine leichtgewichtige, quelloffene PTY-Wrapper-Laufzeitumgebung für agy (Antigravity CLI / Gemini CLI). Die Architektur folgt strikten Sicherheitsprinzipien:

- **Local-First & Zero-Egress:** Der Wrapper agiert zu 100% lokal auf der Maschine des Nutzers. Es findet keinerlei Telemetrie, Datenabfluss oder externe Netzwerkkommunikation durch companion-for-agy statt. Alle Prompts und Antworten verbleiben im lokalen Prozesskontext.
- **Benutzer-Modus (Non-Elevation):** companion-for-agy erfordert keine administrativen Berechtigungen (kein Root / kein sudo / kein Administrator) und läuft nach dem RunAsInvoker-Prinzip ausschließlich im unprivilegierten Benutzerkontext.
- **PTY-Isolation & Input-Sanitization:** Subprozesse werden isoliert über node-pty (ConPTY unter Windows, forkpty unter macOS/Linux) gestartet. Die PTY-Eingabe wird über sanitizeForPty gegen Steuerzeichen-Injektionen und schädliche Terminal-Escapesequenzen gehärtet.
- **Temporäre Verzeichnisse & Dateiberechtigungen:** Temporäre Arbeitsumgebungen werden unter os.tmpdir() mit restriktiven Zugriffsberechtigungen angelegt und nach Abschluss des Vorgangs deterministisch bereinigt.
- **Robuste Prozessbaum-Verwaltung:** Signale (Ctrl+C, SIGINT, SIGTERM) und Timeouts triggern eine geordnete Beendigung des Subprozessbaums, um verwaiste Hintergrundprozesse (Zombie-Prozesse) zuverlässig zu verhindern.
- **Native Berechtigungsweitergabe:** Sicherheitsrelevante Flags (--sandbox, --skip-permissions) werden unverändert an agy durchgereicht; es gibt keine emulierten Soft-Modi oder gefälschten Berechtigungszusagen.
- **Deterministische ANSI-Farbfilterung:** Farbextraktion (RGB(232,234,237)) stellt sicher, dass Steuer- und TUI-Banner nicht in die automatisierte Modellausgabe gelangen.
- **Cross-Platform Preflight:** Umfassende Diagnose (--doctor, --platform-smoke, --pty-smoke) prüft Abhängigkeiten und POSIX-Helper-Bits vor Ausführung.

### Sicherheitslücken melden

Wenn Sie eine Sicherheitslücke oder ein potenzielles Sicherheitsrisiko finden, melden Sie dies bitte verantwortungsvoll:

1. **Kein öffentliches Issue eröffnen** — Bitte veröffentlichen Sie keine Details in öffentlichen Issues oder Diskussionsforen.
2. **GitHub Security Advisories nutzen (bevorzugt):** [GitHub Security Advisory einreichen](https://github.com/ellmos-ai/companion-for-agy/security/advisories/new)
3. **Direkter E-Mail-Kontakt:** Alternativ können Sie Sicherheitsberichte direkt an die Maintainer senden:
   - security@ellmos.ai
   - security@open-bricks.org (Dachverband / Umbrella Security Contact)
   - support@lukasgeiger.com
   - lukas@open-bricks.org

### Erforderliche Angaben

Bitte fügen Sie Ihrem Bericht folgende Details bei:
- Beschreibung der Schwachstelle und potenzielle Auswirkungen
- Schritt-für-Schritt-Anleitung zur Reproduktion (Proof of Concept)
- Betroffene Versionen, Betriebssystem und Node.js-Version
- Etwaige Vorschläge zur Behebung

### Reaktions-SLA & Behebungszeitplan

Sicherheitsberichte werden prioritär und vertraulich behandelt:
- **Erste Rückmeldung (Response SLA):** Innerhalb von **48 Stunden** bestätigen wir den Eingang Ihres Berichts.
- **Triage & Bewertung:** Innerhalb von **5 Werktagen** erhalten Sie eine qualifizierte Einschätzung des Schweregrads sowie einen vorläufigen Zeitplan für die Behebung.
- **Patch-Bereitstellung:** Verifizierte Sicherheits-Patches werden unverzüglich über ein neues Patch-Release bereitgestellt und über GitHub Security Advisories kommuniziert.

---

## English

### Supported Versions

| Version | Supported | Status |
|---|---|---|
| 2.1.x | :white_check_mark: | Actively supported (recommended) |
| 2.0.x | :white_check_mark: | Security patches only |
| < 2.0 | :x: | EoL (End of Life) — please upgrade |

### Security Philosophy & Principles

companion-for-agy is a lightweight, open-source PTY wrapper runtime for agy (Antigravity CLI / Gemini CLI). The architecture adheres to strict security standards:

- **Local-First & Zero-Egress:** The wrapper operates 100% locally on the user machine. companion-for-agy contains zero telemetry, zero analytics, and zero external network egress. All prompts and response streams remain strictly within local process boundaries.
- **Non-Elevation (User-Mode Execution):** companion-for-agy requires no administrative privileges (no root / no sudo / no elevated administrator rights) and strictly follows RunAsInvoker semantics in user space.
- **PTY Isolation & Input Sanitization:** Subprocesses are spawned in isolation via node-pty (ConPTY on Windows, forkpty on macOS/Linux). Input sent to the PTY is sanitized against control-character injection via sanitizeForPty.
- **Temporary Workspaces & File Permissions:** Temporary workspace directories are created under os.tmpdir() with restrictive access permissions and deterministically cleaned up on completion.
- **Robust Process Tree Lifecycle:** Signals (Ctrl+C, SIGINT, SIGTERM) and timeouts enforce graceful process tree termination to prevent orphan background processes (zombies).
- **Native Permission Pass-Through:** Security flags (--sandbox, --skip-permissions) are passed directly through to native agy; no soft or emulated modes are fabricated.
- **Deterministic ANSI Color Stream Extraction:** Color filtering targeting RGB(232,234,237) guarantees terminal UI chrome and spinners never leak into automated model outputs.
- **Cross-Platform Diagnostic Suite:** Comprehensive diagnostics (--doctor, --platform-smoke, --pty-smoke) validate dependencies and POSIX helper permissions prior to execution.

### Reporting a Vulnerability

If you discover a security vulnerability or potential risk, please report it responsibly:

1. **Do not open a public issue** — Please refrain from posting exploit details in public issues or discussions.
2. **Use GitHub Security Advisories (Preferred):** [Submit a GitHub Security Advisory](https://github.com/ellmos-ai/companion-for-agy/security/advisories/new)
3. **Direct Email Contact:** Alternatively, submit security reports directly to the maintainers:
   - security@ellmos.ai
   - security@open-bricks.org (Umbrella Security Contact)
   - support@lukasgeiger.com
   - lukas@open-bricks.org

### What to Include

Please provide the following information with your report:
- Description of the vulnerability and its potential impact
- Step-by-step reproduction instructions or a minimal Proof of Concept
- Affected versions, OS platform, and Node.js runtime version
- Any proposed remediation or patches

### Response SLA & Mitigation Timeline

Security reports are prioritized with strict response commitments:
- **Response SLA:** Initial acknowledgment within **48 hours** of submission.
- **Triage Commitment:** Formal triage, severity assessment, and mitigation roadmap within **5 business days**.
- **Patch Release:** Verified security fixes are expedited via patch releases and documented in GitHub Security Advisories.
