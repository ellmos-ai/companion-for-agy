# companion-for-agy

<p align="left">
  <img src="assets/logo.jpg" alt="companion-for-agy Banner" width="800" />
</p>

[![npm](https://img.shields.io/npm/v/companion-for-agy)](https://www.npmjs.com/package/companion-for-agy)
[![CI](https://github.com/ellmos-ai/companion-for-agy/actions/workflows/tests.yml/badge.svg)](https://github.com/ellmos-ai/companion-for-agy/actions/workflows/tests.yml)
[![Node Tests](https://img.shields.io/badge/tests-232%20passed%2C%201%20skipped-brightgreen.svg)](https://github.com/ellmos-ai/companion-for-agy/blob/master/package.json)
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

> **Inoffiziell** - nicht mit Google verbunden und nicht von Google unterstützt.

> [!NOTE]
> **KI-Agenten & LLM-Integration:** `companion-for-agy` ist für die automatisierte Ausführung durch KI-Agenten (Claude Code, Codex, Antigravity, n8n) optimiert. Maschinenlesbare Kontexte, Systemarchitekturen und Suchbegriffe befinden sich in [llms.txt](llms.txt).

PTY-basierter Wrapper für **agy** (Antigravity CLI / Gemini CLI), der Gemini-Antworten aus Subprozessen erfasst.

| Einstieg | Link |
|---|---|
| Installation | `npm install -g companion-for-agy` |
| Ausführen | `companion-for-agy --json --sandbox "Prompt"` |
| Englische Doku | [README.md](README.md) |
| Changelog | [CHANGELOG.md](CHANGELOG.md) |
| npm-Paket | [npmjs.com/package/companion-for-agy](https://www.npmjs.com/package/companion-for-agy) |

## Problem

`agy -p` (Print-Modus) beendet sich mit Exit-Code 0, schreibt aber keine Antwort nach stdout. Stattdessen schreibt der TUI-Renderer (`text_drip.go`) in den Terminal-Puffer. Bekannte Upstream-Issues:

- [antigravity-cli#76](https://github.com/google-antigravity/antigravity-cli/issues/76)
- [gemini-cli#27466](https://github.com/google-gemini/gemini-cli/issues/27466)
- [antigravity-cli#115](https://github.com/google-antigravity/antigravity-cli/issues/115)

Dadurch können andere Agenten wie Claude Code, Codex oder CI/CD-Skripte agys Antworten nicht programmatisch lesen.

## Lösung

`companion-for-agy` startet agy in einem virtuellen Terminal via `node-pty` (ConPTY unter Windows, forkpty unter macOS/Linux) und extrahiert die Antwort aus dem ANSI-Farbstream. agys Antworttext nutzt derzeit `RGB(232,234,237)`, daher verfolgt der Wrapper den ANSI-Farbstatus und sammelt nur Text in dieser Farbe.

> **Plattformhinweis:** ANSI-Farbextraktion (`RGB(232,234,237)`) und das Flag `--model` wurden unter **Windows** mit agy >= 1.1 verifiziert. Unter **Linux** hat das Repository inzwischen auch einen echten `node-pty`-/`forkpty`-Smoke (`npm run test:linux-pty`), der `spawn-helper`, das native `pty.node` und Truecolor-Extraktion über `/bin/sh` prüft; der verbleibende offene Linux-Schritt ist eine echte agy-Live-Session. macOS benötigt weiterhin die erste unabhängige Live-Verifikation.
>
> - **agy v1.0.x** (Homebrew `antigravity-cli`) unterstützt `--model` nicht; nutze `--no-model` oder `AGY_COMPANION_NO_MODEL=1`.
> - Falls die Farbextraktion leer bleibt, mit `--debug` starten und `agy-debug.log` prüfen.
> - Vor dem ersten macOS-/Linux-Smoke `companion-for-agy --doctor` ausführen, um agy-Pfad, `node-pty`, natives Binary und POSIX-`spawn-helper`-Bereitschaft zu prüfen.
> - Vor dem ersten echten agy-Test `companion-for-agy --pty-smoke` ausführen. Der Modus prüft den paketierten `node-pty`-Truecolor-Pfad ohne agy-Authentifizierung.
> - `companion-for-agy --platform-smoke --json` ausführen, um `--doctor` und `--pty-smoke` als gemeinsames Pre-Live-Plattform-Gate für macOS-/Linux-Übergabelogs zu bündeln.
> - Für den ersten authentifizierten macOS-/Linux-Live-Smoke `companion-for-agy --live-smoke --no-model --debug --json` ausführen. Der Modus fragt agy nach dem Marker `AGY_LIVE_SMOKE_OK`, prüft die exakt gecapturete Antwort und schreibt rohe ANSI-Evidenz nach `agy-debug.log`.
> - Unter Linux vor dem ersten echten agy-Test `npm run test:linux-pty` ausführen. Der Test prüft die PTY-Pipeline ohne agy-Authentifizierung.

## Installation

```bash
npm install -g companion-for-agy
```

### Voraussetzungen

- **Node.js >= 18**
- **agy** ([Gemini CLI](https://github.com/google-gemini/gemini-cli)) installiert und authentifiziert
- **C/C++ Build-Tools** für die native `node-pty`-Kompilierung:
  - **Windows:** Visual Studio Build Tools + Python 3
  - **macOS:** `xcode-select --install`
  - **Linux:** `sudo apt install build-essential python3` (Debian/Ubuntu)

Falls die native Kompilierung fehlschlägt:

```bash
npm rebuild node-pty
```

## Verwendung

```bash
companion-for-agy [optionen] "Prompt"
```

### Berechtigungs-Modi (Permission Modes)

agy stellt exakt drei native Berechtigungszustände bereit; companion-for-agy reicht das passende Flag unverändert weiter. Es gibt keine emulierten Soft-Modi und keine Allow/Deny-Regeln pro Aufruf — agy liest keine workspace-lokalen Permission-Regeln, die Steuerung erfolgt ausschließlich über diese Flags.

| Flag | Beschreibung |
|------|-------------|
| _(Standard, kein Flag)_ | agy nutzt seine **eigene** Konfiguration (globale + projektspezifische Allow/Deny/Ask-Regeln unter `~/.gemini/antigravity-cli/`) |
| `--sandbox` | Shell und Netzwerk blockiert, Dateisystem auf den Workspace beschränkt (Dateien schreiben funktioniert) |
| `--skip-permissions` | Alle Tools automatisch freigeben (YOLO), volle Rechte. Akzeptiert auch `--dangerously-skip-permissions` |

> **Caveat im Standard-Modus:** Im kopflosen Print-Modus führt ein Tool, das in agys eigener Konfiguration weder erlaubt noch verboten ist, zu `ask` und blockiert. Nutze `--skip-permissions` für Aufgaben mit Werkzeugen, die nicht vorab freigegeben sind.

### Workspace

```bash
--add-dir "/pfad/zum/ordner"      # Ordner zu agys Workspace hinzufügen (wiederholbar)
```

agy schreibt Dateien ausschließlich im eigenen Workspace-Verzeichnis. Ohne `--add-dir` wird jeder Schreibversuch außerhalb des temporären Workspace stillschweigend ignoriert oder als Erfolg gemeldet, obwohl keine Datei angelegt wurde.

Mit `--add-dir` registrierst du zusätzliche Ordner, damit agy dort real Dateien anlegen oder ändern kann:

```bash
# Schreibt eine Datei nach /mein/output — erfordert Workspace-Registrierung und Schreibrechte
companion-for-agy --skip-permissions --add-dir "/mein/output"   "Schreibe hallo.txt nach /mein/output mit Inhalt: Hallo Welt"
```

> **Hinweis:** `--skip-permissions` (YOLO-Modus) steuert die **Tool-Autorisierung**; `--add-dir` steuert den **Workspace-Umfang**. Beide sind erforderlich, wenn in ein Verzeichnis außerhalb des temporären Standard-Workspace geschrieben werden soll.

### Optionen

| Flag | Beschreibung |
|------|-------------|
| `--add-dir <dir>` | Ordner zu agys Workspace hinzufügen (wiederholbar); nötig, damit agy außerhalb des Temp-Ordners schreiben kann |
| `--model <model>` | Gemini-Modell (Standard: `gemini-3.5-flash`) |
| `--effort <level>` | Expliziter agy-Effort; wird gegen den ermittelten Modellkatalog validiert |
| `--no-effort` | Automatische Effort-Auswahl für das angeforderte Modell unterdrücken |
| `--no-model` | `--model` nicht an agy übergeben; nützlich für agy v1.0.x |
| `--list-models` | Live agy-Modellkatalog anzeigen (für 24 Stunden pro agy-Pfad/Version zwischengespeichert) |
| `--refresh-models` | Live Modellkatalog neu laden und ausgeben |
| `--version`, `-V` | Companion-Version ausgeben |
| `--timeout <ms>` | Timeout in ms (Standard: `120000`) |
| `--json` | Ausgabe als JSON-Objekt |
| `--report-file <path>` | Diagnose-Report-JSON in eine Datei schreiben für `--doctor`, `--platform-smoke`, `--pty-smoke` und `--live-smoke` |
| `--debug` | Rohe PTY-Ausgabe in `agy-debug.log` speichern (enthält den vollen Prompt im Klartext — nicht committen) |
| `--doctor` | Plattform-Preflight für agy, node-pty und Helper-Artefakte anzeigen |
| `--platform-smoke` | `--doctor` und `--pty-smoke` als ein gemeinsames Pre-Live-Plattform-Gate ausführen |
| `--pty-smoke` | Authentifizierungsfreien node-pty Truecolor-Smoke zur Plattformvalidierung ausführen |
| `--live-smoke` | Echten agy Marker-Smoke ausführen; nutzt standardmäßig `sandbox`, sofern kein anderer Modus gewählt ist |
| `--probe-color` | `What is 2+2?` fragen, Truecolor um die `4` detektieren und pro Plattform cachen |
| `--stream` | Antwort-Chunks während des Eintreffens progressive ausgeben |
| `--lang <code>` | CLI-Ausgabesprache: `en`, `de`, `es`, `zh-Hans`, `ja`, `ru` |
| `--` | Optionen-Parsing beenden; vor Prompts nutzen, die mit `-` beginnen |

### Umgebungsvariablen

| Variable | Beschreibung |
|----------|-------------|
| `AGY_COMPANION_AGY_PATH` | Pfad zum agy-Binary (wird automatisch ermittelt, falls nicht gesetzt) |
| `AGY_PATH` | Alternativer Pfad zum agy-Binary |
| `AGY_COMPANION_NO_MODEL` | Auf `1`, `true` oder `yes` setzen, um `--model` wegzulassen |
| `AGY_COMPANION_RESPONSE_RGB` | Antwortfarbe als `R,G,B` oder `R;G;B` überschreiben |
| `AGY_COMPANION_RESPONSE_RGB_CACHE` | Pfad für den plattformspezifischen Farbcache überschreiben |

### Beispiele

```bash
companion-for-agy "Was ist die Hauptstadt von Bayern?"
companion-for-agy --sandbox "Review diesen Code: ..."
companion-for-agy --json --model gemini-3.6-flash --effort high "Prompt"
companion-for-agy --refresh-models --json
companion-for-agy --no-model "Prompt"
companion-for-agy --skip-permissions --add-dir "/mein/output" "Schreibe hallo.txt nach /mein/output"
companion-for-agy --doctor
companion-for-agy --doctor --json
companion-for-agy --platform-smoke --report-file reports/platform-smoke.json
companion-for-agy --platform-smoke --json
companion-for-agy --pty-smoke --json
companion-for-agy --live-smoke --no-model --debug --json
companion-for-agy --probe-color --no-model --json
companion-for-agy --stream --sandbox "Erkläre diese Änderung kurz."
companion-for-agy --lang de --help
companion-for-agy --sandbox -- "-minus-praefixter Prompt"
```

Ab agy >= 1.1 ermittelt der Companion verfügbare Modelle und deren Effort-Varianten aus agys Invalid-Model-Antwort. Er validiert explizite Auswahlen, wählt automatisch einen passenden Effort und führt vor dem Prompt einen Retry aus, falls agy Effort fordert.

Die JSON-Ausgabe enthält `response`, `model`, `requestedModel`, `effort`, `effortAutoSelected`, `availableModels` und `permissionMode`. `model` wird bevorzugt aus agys Banner ausgelesen und fällt sonst auf `requestedModel` zurück. Mit `--stream --json` werden Chunk-Events als `{"type":"chunk","chunk":"..."}` und das Endergebnis als `{"type":"result",...}` ausgegeben.

`--probe-color` führt den festen Prompt `What is 2+2?` aus, identifiziert das Truecolor-SGR-Segment um `4` und speichert es plattformspezifisch ab. Ein explizites `AGY_COMPANION_RESPONSE_RGB` hat stets Vorrang.

## Wie es funktioniert

```mermaid
flowchart TD
    subgraph Caller["Aufrufender Agent / Automatisierung"]
        A["Claude Code / Codex / CI / Skripte"] -->|1. Startet companion-for-agy| B["CLI-Optionen- & Permission-Parser"]
    end

    subgraph Wrapper["companion-for-agy Engine (Node.js)"]
        B --> C["PTY Virtuelles Terminal / node-pty"]
        C --> D{"Phase 1-3: Lifecycle-Handshake"}
        D -->|Auto-Confirm| D1["Phase 1: Vertrauens-Dialog"]
        D1 -->|Bereitschaft erkennen| D2["Phase 2: Startup-Status"]
        D2 -->|Modellprüfung & Retry| D3["Phase 3: Initialisierung"]
        D3 --> E["Phase 4: Prompt-Injektion"]
        E --> F["Phase 5: ANSI-TrueColor-Filter"]
        F --> G{"Ausgabe-Routing"}
    end

    subgraph Subprocess["Antigravity / Gemini CLI (agy)"]
        C <-->|"ConPTY / forkpty Datenstrom"| Subprocess
        E -->|"Prompt senden"| Subprocess
        Subprocess -->|"Terminal-Drip-Puffer RGB(232,234,237)"| F
    end

    subgraph Delivery["Zwei Rückgabewege"]
        G -->|Pfad 1: stdout / --stream / --json| H["Saubere stdout-Antwort"]
        G -->|Pfad 2: --add-dir Workspace| I["Direkte Dateiausgabe auf Platte"]
    end

    H --> A
    I --> A
```

**5-Phasen-Zustandsautomat:**

1. **Trust:** Workspace-Trust-Dialog erkennen und automatisch bestätigen
2. **Startup:** Haupt-UI-Bereitschaft erkennen (`? for shortcuts`)
3. **Init:** Initialisierung abwarten, mit Timeout-Fallback
4. **Question:** Prompt senden und Antwortbeginn markieren
5. **Response:** Antwort via ANSI-Farbstream und adaptiven Idle-Timern extrahieren

## Anwendungsfälle

- Multi-Agenten-Orchestrierung: Claude Code, Codex oder andere Agenten, die Gemini via agy abfragen
- CI/CD-Pipelines, die strukturierte Textausgaben von agy benötigen
- Lokale Workflows, in denen agys TUI-Ausgabe programmatisch als stdout erfasst werden muss

## Best Practices: Zwei Rückgabewege

companion-for-agy bietet zwei Wege, um Antworten von agy zu erhalten. Wähle je nach Anforderung:

### Pfad 1 — stdout (kurze Nachrichten, Aufgabendelegation)

Der Standardweg: companion-for-agy fängt agys Antwort im PTY ab und gibt sie auf stdout aus. Funktioniert zuverlässig für **kurze Antworten und ASCII-Text** bei kompakter Aufgabenstellung.

```bash
companion-for-agy --sandbox "Was ist 2 + 2?"
```

**Einschränkung (unter Windows beobachtet):** Bei langen Texten oder Nicht-ASCII-Inhalten (z.B. CJK-Zeichen: Chinesisch, Japanisch, Koreanisch) kann die Zeichenkodierung im PTY-/ANSI-Layer zu Replacement-Characters (U+FFFD) führen.

### Pfad 2 — Dateiausgabe via `--add-dir` (umfangreiche Antworten, Nicht-ASCII, CJK)

Lasse agy das Ergebnis direkt in eine Datei schreiben. Die Datei wird von agy selbst gespeichert; die Daten durchlaufen nicht die PTY-Farbextraktion. Dieser Pfad ist zuverlässig für **jeden Inhalt**, inklusive voller CJK-Zeichensätze.

```bash
# agy schreibt das Ergebnis selbst nach /mein/output/ergebnis.json — sauberes UTF-8 inkl. CJK
companion-for-agy --skip-permissions --add-dir "/mein/output"   "Lies /mein/output/aufgabe.txt und befolge alle Anweisungen exakt."
```

> **Faustregel:**
> - **Aufgaben delegieren, kurze Prompts** → stdout reicht vollkommen.
> - **Vollständige Antworten zuverlässig sichern** (langer Text, Nicht-ASCII, CJK) → `--add-dir` nutzen und agy schreiben lassen.

## dev-bricks & ellmos Ökosystem

`companion-for-agy` ist Teil der Entwickler-Toolchains von **dev-bricks** und **ellmos-ai** unter dem **open-bricks** Dach:

| Werkzeug | Schwerpunkt | Repository |
|---|---|---|
| **companion-for-agy** | PTY-stdout-Antwort-Erfassung für Antigravity / Gemini CLI | [dev-bricks/companion-for-agy](https://github.com/dev-bricks/companion-for-agy) |
| **safe-start-for-codex** | Startup-Surge-Schutz & Cron-Staffelung für Codex-Automationen | [dev-bricks/safe-start-for-codex](https://github.com/dev-bricks/safe-start-for-codex) |
| **DevCenter** | Entwickler-Dashboard, Tool-Health & Systemorchestrierung | [dev-bricks/DevCenter](https://github.com/dev-bricks/DevCenter) |
| **CodeBox** | Code-Ausführungs-Sandbox & Skript-Runner für diverse Runtimes | [dev-bricks/CodeBox](https://github.com/dev-bricks/CodeBox) |
| **MethodenAnalyser** | Testmethodik & Psychometrie-Engine | [dev-bricks/MethodenAnalyser](https://github.com/dev-bricks/MethodenAnalyser) |
| **CareCenter-for-Codex** | Klientendokumentation & klinischer Prozessassistent | [dev-bricks/CareCenter-for-Codex](https://github.com/dev-bricks/CareCenter-for-Codex) |

## Auffindbarkeit & Kontext

Suche nach **`dev-bricks/companion-for-agy`**, **`companion-for-agy stdout capture`**, **`agy Gemini CLI PTY wrapper`** oder **`Antigravity CLI subprocess response capture`**, um dieses Projekt direkt zu finden.

## Hintergrund

Dieses Tool entstand, da sich die drei CLI-Agenten Claude Code, Codex und agy gegenseitig konsultieren. Claude -> Codex und agy -> Claude/Codex funktionierten bereits; Claude -> agy war durch das TUI-stdout-Verhalten blockiert.

## Lizenz

MIT
