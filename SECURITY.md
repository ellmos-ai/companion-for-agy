# Sicherheitsrichtlinie / Security Policy

## Deutsch

### Sicherheitsphilosophie & Leitlinien

`companion-for-agy` ist eine leichtgewichtige, quelloffene PTY-Wrapper-Laufzeitumgebung für `agy` (Antigravity CLI / Gemini CLI). Die Architektur folgt strikten Sicherheitsprinzipien:

- **Local-First & Zero-Egress:** Der Wrapper agiert zu 100% lokal auf der Maschine des Nutzers. Es findet keinerlei Telemetrie, Datenabfluss oder externe Netzwerkkommunikation durch `companion-for-agy` statt. Alle Prompts und Antworten verbleiben im lokalen Prozesskontext.
- **Benutzer-Modus (Non-Elevation):** `companion-for-agy` erfordert keine administrativen Berechtigungen (kein Root / kein sudo / kein Administrator) und sollte ausschließlich im unprivilegierten Benutzerkontext ausgeführt werden.
- **PTY-Isolation & Input-Sanitization:** Subprozesse werden isoliert über `node-pty` (ConPTY unter Windows, forkpty unter macOS/Linux) gestartet. Die PTY-Eingabe wird über `sanitizeForPty` gegen Steuerzeichen-Injektionen gehärtet.
- **Temporäre Verzeichnisse & Dateiberechtigungen:** Temporäre Arbeitsumgebungen werden unter `os.tmpdir()` mit restriktiven Zugriffsberechtigungen angelegt und nach Abschluss des Vorgangs deterministisch bereinigt.
- **Robuste Prozessbaum-Verwaltung:** Signale (Ctrl+C, SIGINT, SIGTERM) und Timeouts triggern eine geordnete Beendigung des Subprozessbaums, um verwaiste Prozesse zu verhindern.

### Sicherheitslücken melden

Wenn Sie eine Sicherheitslücke oder ein potenzielles Sicherheitsrisiko finden, melden Sie dies bitte verantwortungsvoll:

1. **Kein öffentliches Issue eröffnen** — Bitte veröffentlichen Sie keine Details in öffentlichen Issues oder Diskussionsforen.
2. **GitHub Security Advisories nutzen (bevorzugt):** [GitHub Security Advisory einreichen](https://github.com/ellmos-ai/companion-for-agy/security/advisories/new)
3. **Direkter E-Mail-Kontakt:** Alternativ können Sie Sicherheitsberichte direkt an die Maintainer senden:
   - `security@ellmos.ai`
   - `support@lukasgeiger.com`
   - `lukas@open-bricks.org` (Dachverband / Umbrella Security Contact)

### Erforderliche Angaben

Bitte fügen Sie Ihrem Bericht folgende Details bei:
- Beschreibung der Schwachstelle und potenzielle Auswirkungen
- Schritt-für-Schritt-Anleitung zur Reproduktion (Proof of Concept)
- Betroffene Versionen, Betriebssystem und Node.js-Version
- Etwaige Vorschläge zur Behebung

### Reaktionszeit

Sicherheitsberichte werden prioritär geprüft. Wir bemühen uns um eine erste Rückmeldung innerhalb von 48 Stunden und halten Sie über den Fortschritt der Behebung auf dem Laufenden.

---

## English

### Security Philosophy & Principles

`companion-for-agy` is a lightweight, open-source PTY wrapper runtime for `agy` (Antigravity CLI / Gemini CLI). The architecture adheres to strict security standards:

- **Local-First & Zero-Egress:** The wrapper operates 100% locally on the user machine. `companion-for-agy` contains zero telemetry, zero analytics, and zero external network egress. All prompts and response streams remain strictly within local process boundaries.
- **Non-Elevation (User-Mode Execution):** `companion-for-agy` requires no administrative privileges (no root / no sudo / no elevated administrator rights) and should always be run under unprivileged user permissions.
- **PTY Isolation & Input Sanitization:** Subprocesses are spawned in isolation via `node-pty` (ConPTY on Windows, forkpty on macOS/Linux). Input sent to the PTY is sanitized against control-character injection via `sanitizeForPty`.
- **Temporary Workspaces & File Permissions:** Temporary workspace directories are created under `os.tmpdir()` with restrictive access permissions and deterministically cleaned up on completion.
- **Robust Process Tree Lifecycle:** Signals (Ctrl+C, SIGINT, SIGTERM) and timeouts enforce graceful process tree termination to prevent orphan background processes.

### Reporting a Vulnerability

If you discover a security vulnerability or potential risk, please report it responsibly:

1. **Do not open a public issue** — Please refrain from posting exploit details in public issues or discussions.
2. **Use GitHub Security Advisories (Preferred):** [Submit a GitHub Security Advisory](https://github.com/ellmos-ai/companion-for-agy/security/advisories/new)
3. **Direct Email Contact:** Alternatively, submit security reports directly to the maintainers:
   - `security@ellmos.ai`
   - `support@lukasgeiger.com`
   - `lukas@open-bricks.org` (Umbrella Security Contact)

### What to Include

Please provide the following information with your report:
- Description of the vulnerability and its potential impact
- Step-by-step reproduction instructions or a minimal Proof of Concept
- Affected versions, OS platform, and Node.js runtime version
- Any proposed remediation or patches

### Response Timeline

Security reports are prioritized. We aim to acknowledge reports within 48 hours and provide continuous updates until a security patch is verified and released.
