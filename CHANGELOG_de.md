# Änderungsprotokoll

## [Unreleased]

### Wartung und technische Hygiene
- Das etablierte Repository-Kopfbild (`assets/logo.jpg`) bleibt in `README.md` und
  `README_de.md`; das temporäre `assets/banner.png` wurde entfernt.
- `llms.txt` führt weiterhin den Prüfzeitpunkt `Last-checked: 2026-07-30`.
- Technische Hygiene geprüft und die kanonische `npm test`-Suite verifiziert
  (220 bestanden, 1 übersprungen).
- Repository-Metadaten abgeglichen und einen sauberen Arbeitsstand verifiziert.

## [2.1.0] - 2026-07-28

### Hinzugefügt
- Live-Ermittlung des agy-Modellkatalogs über `--list-models` / `--refresh-models` mit einem 24-Stunden-Cache je agy-Pfad und -Version.
- Modellabhängige automatische Effort-Auswahl und genau ein Pre-Prompt-Retry, wenn agy das Hinzufügen oder Entfernen von Effort verlangt.
- `--no-effort` zum expliziten Unterdrücken der automatischen Auswahl sowie `--version` / `-V`.
- JSON-Metadaten für den effektiven Effort und den ermittelten Modellkatalog.

## [2.0.2] - 2026-07-23

### Hinzugefügt
- `--effort <low|medium|high>`-Durchreich-Flag (spiegelt agys eigenes Flag). agy >= 1.1.x
  verlangt `--effort` für manche Modelle (z. B. `gemini-3.6-flash`) und fällt sonst still
  auf sein Standardmodell zurück — schließt das in 2.0.1 dokumentierte Known Issue.
- Modell-Abweichung sichtbar gemacht: Weicht das aus agys Banner erkannte Modell vom
  angeforderten `--model` ab, gibt der Companion eine lokalisierte `warnModelMismatch`-
  Warnung auf stderr aus und setzt `modelMismatch: true` in der `--json`-Ausgabe.
- Neue Regressionstests: `--effort`-Durchreichung, Ablehnung fehlender `--add-dir`-
  Verzeichnisse und das Arbeitsverzeichnis-Verhalten von `--add-dir`.

### Geändert
- Das ERSTE `--add-dir`-Verzeichnis wird jetzt agys Arbeitsverzeichnis (zuvor lief agy
  immer im Wegwerf-Temp-Workspace, sodass relative Ausgabepfade still in
  `%TEMP%\agy-companion-<pid>\` statt im Verzeichnis des Aufrufers landeten — gefunden
  in einem echten Banner-Generierungslauf). Eine `statusWorkdir`-Statuszeile meldet das
  wirksame Verzeichnis; ein fehlender `--add-dir`-Pfad schlägt jetzt sofort mit
  `errAddDirMissing` fehl.
- Hilfetext: Modellliste auf die agy-1.1.x-Generation aktualisiert (`gemini-3.6-flash`,
  `gemini-3.5-flash`, `gemini-3.1-pro`; die eingestellten Einträge `gemini-1.5*/2.0*/
  3.5-pro` sind entfernt), `--effort` dokumentiert, Beispiele aktualisiert — in allen
  sechs Sprachen.

## [2.0.1] - 2026-07-23

### Behoben (Live-Smoke-Review, 2026-07-23)
- **Verfrühtes Ctrl+C während der Generierung:** `detectResponseComplete()` interpretierte das leere `>`, das agys umrandete Eingabebox bei **jedem** Bildschirm-Redraw zeigt — auch während eine Antwort noch generiert wird — als „zurück im Leerlauf"-Signal, weil Rahmen, Spinner und die begleitende „esc to cancel"-Statuszeile allesamt als Rauschen galten und die Kandidaten-Markierung nie zurücksetzten. Gegen die aktuell installierte agy-Version 1.1.5 führte das dazu, dass der Wrapper bei jedem Lauf rund 2,5 Sekunden nach dem Absenden der Frage ein Ctrl+C schickte und die laufende Antwort abbrach (per `--debug` bestätigt: agy protokollierte „Interrupted"). Fix: Erscheint „esc to cancel" nach einem Kandidaten-`>`, wird dieser jetzt zurückgesetzt, da dieser Text ausschließlich während aktiver Generierung auftritt. Gegen eine echte authentifizierte agy-Sitzung verifiziert (zuvor reproduzierbarer Fehlschlag, jetzt sauber extrahierte Antwort). Durch zwei neue Regressionstests in `_tests/unit.test.mjs` abgedeckt.
- `package-lock.json` war auf `1.4.2` zurückgefallen, während `package.json` bereits `2.0.0` auswies; per `npm install` neu synchronisiert.

### Gefunden, nicht behoben (als TODO dokumentiert)
- agy 1.1.5 warnt jetzt mit `--model gemini-3.5-flash requires --effort (available: low, medium, high). Using the default model instead.` und fällt bei `--model` ohne passendes `--effort` still auf sein eigenes Standardmodell zurück. companion-for-agy übergibt bisher kein `--effort`, weshalb eine abweichende `--model`-Anfrage stillschweigend wirkungslos bleiben kann. In ROADMAP → „Known Issues" nachgehalten.

## [2.0.0] - 2026-07-06

### Dokumentation & SEO (2026-07-22)
- `llms.txt` `Last-checked`-Zeitstempel auf `2026-07-22` aktualisiert und Suchphrasen für das `v2.0.0` nativ unterstützte Rechtemodell (`--sandbox`, `--skip-permissions`) und ConPTY-Antwortextraktion erweitert.
- Sichtbarkeits-Audit durchgeführt und Test-Suite verifiziert.

### Geändert (BREAKING)
- Rechtemodell auf die drei Modi reduziert, die agy nativ unterstützt — so sind der Aufrufmodus des Companions und agys interner Modus immer synchron:
  - **Standard (kein Flag):** agy nutzt seine eigene Konfiguration — global `~/.gemini/antigravity-cli/settings.json` plus Projektregeln (allow/deny/ask). Im Headless-`-p`-Modus blockiert ein Tool, das weder vorab erlaubt noch verweigert ist, weil es zu „ask" auflöst — dann `--skip-permissions` verwenden.
  - **`--sandbox`:** Shell und Netzwerk blockiert, Dateisystem auf den Workspace begrenzt (Dateien schreiben funktioniert weiterhin).
  - **`--skip-permissions`:** alle Tools automatisch bestätigt (YOLO), volle Rechte.

### Entfernt (BREAKING)
- Die Soft-Modi `--no-tools`, `--researcher`, `--read-only` und die Custom-Rule-Flags `--allow` / `--deny`. agy liest keine Regeln pro Aufruf oder aus einer Workspace-lokalen Datei, daher hatten diese keine durchsetzbare Wirkung (verifiziert) — sie erzeugten nur eine Scheinsicherheit.
- Der Schreiber der `<workspace>/.gemini/settings.json` pro Aufruf (wirkungslos: agy übernimmt `cwd` nie als Projektwurzel) und die Capability-Präambel (unnötig: agy kennt seinen Sandbox-Modus nativ über seinen eigenen `<terminal_sandbox>`-Systemkontext).
- **Migration:** `--no-tools` / `--researcher` / `--read-only` durch `--sandbox` (oder den Standardmodus) ersetzen; `--allow` / `--deny` durch die eigenen globalen/Projekt-Rechteregeln von agy ersetzen. Begründung und die (bewusst nicht ausgelieferte) Enforcement-Recherche stehen in ROADMAP → „Permission Model & Enforcement".

## [1.4.2] - 2026-07-04

### Behoben
- Waisenprozess-Schutz: Beim Erfolgspfad wurde agy nie hart beendet — reagierte agy nicht auf Ctrl+C, überlebte es den Wrapper als Waise. Der Exit-Handler killt die PTY jetzt direkt vor jedem Exit.
- Temp-Workspace und settings.json mit restriktiven Rechten (0o700/0o600); agy-debug.log mit 0o600 plus Klartext-Warnung (alle 6 Sprachen + README).
- --help in es/zh-Hans/ja/ru um den fehlenden Workspace/--add-dir-Block ergänzt.
- npm run deploy erzeugt jetzt einen funktionierenden Wrapper auf den Checkout (Bare-Copy war seit dem locales-Split defekt).
- Details und ältere unveröffentlichte Einträge: siehe CHANGELOG.md (EN).

## [Unveröffentlicht]

### Sicherheit
- Repository-Hygiene für lokale npm-Zugangsdaten, Token-/Recovery-Dateien, private Schlüssel und Zertifikat-Bundles gehärtet. Ein Regressionstest prüft die wirksamen Git-Ignore-Regeln und defensive npm-Ignore-Muster.

### Hinzugefügt
- `--report-file <Pfad>` für Diagnosemodi (`--doctor`, `--platform-smoke`, `--pty-smoke`, `--live-smoke`). Der Schalter schreibt einen formatierten JSON-Bericht auf die Platte, während stdout wie gewählt Text oder JSON bleibt; macOS-/Linux-Übergaben bekommen damit dauerhafte Evidenzdateien.
- Gebündeltes Pre-Live-Plattform-Gate `--platform-smoke` plus `npm run platform-smoke` / `npm run platform-smoke:json`. Der Bericht führt `--doctor` und den auth-freien PTY-Smoke in einem Befehl aus, verschachtelt beide Einzelberichte, aggregiert Blocker/Warnungen und nennt den exakten authentifizierten `--live-smoke --no-model --debug --json`-Befehl für Mac-/Linux-Übergaben.
- Authentifizierter agy-Marker-Smoke `--live-smoke` plus `npm run live-smoke` / `npm run live-smoke:json` (Skripte nutzen `--no-model` für agy-1.0.x-Kompatibilität). Der Modus nutzt standardmäßig `no-tools`, fordert von agy exakt `AGY_LIVE_SMOKE_OK`, gibt einen Text- oder JSON-Bericht aus und beendet sich bei Marker-Mismatch mit Exit-Code `5`. Damit hat der macOS-/Linux-Transfer nach `--doctor` und `--pty-smoke` ein wiederholbares Live-Gate.
- Paketierter Plattform-Smoke `--pty-smoke` plus `npm run pty-smoke` / `npm run pty-smoke:json`. Der Smoke prüft den installierten `node-pty`-Truecolor-Pfad ohne agy-Authentifizierung, meldet Blocker/Warnungen als Text oder JSON und liefert macOS/Linux ein wiederholbares Gate vor echten `agy --debug`-Live-Smokes.

## [1.4.1] - 2026-06-16

### Hinzugefügt
- **Update-Hinweis:** zeigt einen „Update verfügbar"-Hinweis, wenn eine neuere veröffentlichte Version existiert. Läuft **nur im interaktiven Terminal** (`process.stdout.isTTY`) — niemals im Subprozess-, Pipe-, CI- oder MCP-Betrieb, maschinelle Integrationen bleiben unberührt. Der Check läuft abgekoppelt im Hintergrund. Umgesetzt mit `update-notifier`.

### Dokumentation
- Abschnitt **Best Practices: Zwei Rückgabewege** in README.md, README_de.md und llms.txt ergänzt. Dokumentiert, dass der stdout-Rückgabeweg bei Nicht-ASCII- und CJK-Inhalten verstümmelte Ausgaben erzeugen kann (beobachtet unter Windows) und empfiehlt das Dateiausgabe-Muster via `--add-dir` für umfangreiche oder Nicht-ASCII-Antworten. Aufgabenübermittlung (Inbound) und Dateiausgabe via `--add-dir` sind zuverlässig (getestet unter Windows, inkl. CJK); der stdout-Rückgabeweg ist das unzuverlässige Glied. Übersetzungen der übrigen Sprachen (es, ja, ru, zh-Hans) sind als TODO erfasst.

## [1.4.0] - 2026-06-14

### Hinzugefügt
- **`--add-dir <Verz.>` Workspace-Passthrough** (wiederholbar). agy schreibt Dateien nur in seinen eigenen Workspace; ohne dieses Flag werden Schreibversuche außerhalb des temporären Verzeichnisses still ignoriert oder fälschlicherweise als erfolgreich gemeldet. `--add-dir` registriert zusätzliche Verzeichnisse über agys `--add-dir`-Flag, sodass Schreibvorgänge dort tatsächlich ankommen. Zusammen mit `--skip-permissions` für vollen Schreibzugriff verwenden, oder mit einer passenden `--allow "write_file(...)"`-Regel im Sandbox-Modus.

## [1.3.3] - 2026-06-08

### Behoben
- **Sidebar-Workspace-Leck:** Bei der Ausführung in temporären Arbeitsbereichen (z. B. `agy-companion-<PID>`) registriert die Antigravity IDE diese automatisch als Projekte unter `.gemini/config/projects/<uuid>.json`. Diese blieben dauerhaft bestehen und müllten die Seitenleiste zu. Es wurde eine Bereinigungslogik in `cleanupTemp()` hinzugefügt, um die entsprechende Projekt-JSON beim Beenden zu löschen.

## [1.3.1] - 2026-06-07

### Behoben (Bugsweep)
- **detectResponseComplete:** Ein alleinstehender `>` mitten in der Antwort (z. B. Markdown-Blockquotes, agy-Statuszeilen) löst kein vorzeitiges Response-Complete mehr aus; der neue `foundPromptCandidate`-Ansatz scannt den vollständigen Puffer und setzt sich bei echtem Inhalt nach einem Kandidaten zurück (`ed1436d`).
- **getMessage:** Platzhalterwerte mit `$&`, `$'`, `` $` `` oder `$n` wurden durch JavaScripts Sondermuster-Expansion in `String.prototype.replace` beschädigt; der Ersatz verwendet nun die Funktionsform `() => String(val)`, um jede Substitution zu verhindern (`5470404`).

## [1.3.0] - 2026-06-07

### Hinzugefügt
- CLI-Lokalisierung über `--lang <Code>` und automatische Locale-Erkennung.
- Unterstützte CLI- und Dokumentationssprachen: Englisch, Deutsch, Spanisch, vereinfachtes Chinesisch, Japanisch und Russisch.
- Neues Lokalisierungsmodul `src/locales.mjs`.
- Übersetzte README-Dateien: `README_de.md`, `README_es.md`, `README_zh-Hans.md`, `README_ja.md`, `README_ru.md`.
- Deutsches Änderungsprotokoll: `CHANGELOG_de.md`.
- CLI-Regressionstests für lokalisierte Hilfe und lokalisierte Parsing-Fehler.

### Geändert
- Benutzerseitige CLI-Texte werden nun aus Locale-Maps gelesen und nicht mehr direkt in `src/agy-companion.mjs` hartcodiert.
- `package.json` liefert alle lokalisierten Dokumentationsdateien im npm-Paket aus.
- Die Dokumentation trennt nun CLI-Lokalisierung, Dokumentationsübersetzung und agy-TUI-Erkennungsmuster.

### Behoben
- Leere oder nicht extrahierbare Antworten führen nun zu einem Exit-Code ungleich Null, statt auf Startup-Banner-Text zurückzufallen oder Erfolg zu melden.
- Das Beenden erzwingt keinen PTY-Kill mehr, wenn `Ctrl+C` bereits zu einem sauberen Exit geführt hat. Das verhindert späte `node-pty`-Bereinigungs-Stacktraces bei erfolgreichen Läufen.
- Die Berechtigungs-Voreinstellungen `researcher` und `read-only` verbieten nun `command(*)`, um befehlsbasierte Schreibvorgänge zu verhindern.
- Unbekannte CLI-Optionen schlagen nun sofort fehl; `--` kann vor Prompts genutzt werden, die mit einem Bindestrich beginnen.
- Die Antwortfarbe kann über `AGY_COMPANION_RESPONSE_RGB` überschrieben werden.
- Deutsche Trust-/Startup-Muster, Signal-Bereinigung, Bereinigung von totem Code und Ein-Zeichen-Prompt/Antwort-Fälle sind durch Tests abgedeckt.
- agy v1.0.x kann genutzt werden, indem das Modell-Flag via `--no-model` oder `AGY_COMPANION_NO_MODEL` weggelassen wird.

## [1.2.0] - 2026-06-07

### Behoben (Bug-Sweep)
- **Sicherheit:** Ein veralteter temporärer Arbeitsbereich eines abgestürzten Laufs mit derselben PID konnte Berechtigungen an einen neuen Lauf übertragen; er wird nun beim Start bereinigt (`e8c5230`).
- Speicherleck des temporären Verzeichnisses im Sandbox- und Skip-Permissions-Modus, wenn keine benutzerdefinierten Regeln gesetzt sind (`d406299`).
- Race Condition bei der temporären Bereinigung unter Windows: Post-Kill-Verzögerung plus `rmSync`-Wiederholungen für CWD-Locks (`41412d6`).
- ConPTY-Textextraktion: veraltete Cursorposition, falsche Erkennung von fettem SGR und zu enger Entduplizierungsbereich (`c2194bb`).
- False Positives in `isNoiseLine` für Blockzitate (`>`) und Zeilen mit dem Wort "tokens" (`f6a8e7b`).

## [1.2.0-alpha.2] - 2026-06-07

### Geändert
- ASCII-Banner in den README-Dateien linksbündig ausgerichtet.
- Bildquelle auf rohe GitHub-URLs umgestellt, damit das Logo auf npmjs.com korrekt gerendert wird.

### Behoben
- Zusätzliches CLI-Tipp-Rauschen (Zeilen mit `└`) und "Verifying..."-Zeilen im Ausgabe-Parser behandelt.

## [1.2.0-alpha.1] - 2026-06-07

### Geändert
- Paket in `companion-for-agy` umbenannt, um über das "for"-Muster rechtliche und markenbezogene Distanz zu schaffen.
- Hinweis "Inoffiziell" in README und Paketbeschreibung ergänzt.

### Behoben
- Kurze Antworten (2 Zeichen oder weniger, z.B. "4", "42", "ja") wurden fälschlich als Rauschen gefiltert.
- Prompt-Echo-Bug im Modus `--no-tools`: Das Berechtigungspräfix wurde als Antwort zurückgegeben statt der eigentlichen Antwort.
- ConPTY-Leerzeichenverlust beim Prompt-Echo: Whitespace-normalisierter Abgleich verarbeitet nun "Donotuse" gegenüber "Do not use".

### Hinzugefügt
- `stripPromptEcho()` für whitespace-tolerante Entfernung des Prompt-Echos.
- `extractResponse()` akzeptiert den vierten Parameter `effectiveFilter` für vollständiges Prompt-Echo-Stripping.
- 5-Phasen-State-Machine mit automatischer Bestätigung des Trust-Dialogs.
- Banner-Modellerkennung: JSON meldet das tatsächlich erkannte Modell aus agys Banner.
- 26 neue Tests (insgesamt 107): Extraktion kurzer Antworten, Prompt-Echo-Regression und Unit-Tests für `stripPromptEcho`.
- CLI-Alias `companion-for-agy` neben `agy-companion` für Abwärtskompatibilität.

## [1.1.0] - 2026-06-06

### Geändert
- Plattformübergreifende Unterstützung: Windows, macOS, Linux (`node-pty` verarbeitet plattformspezifische PTYs).
- Automatische Erkennung der agy-Binärdatei über PATH, übliche Installationsorte und Umgebungsvariablen.
- `node-pty` wird als normale npm-Abhängigkeit geladen, ohne hartcodierten Pfad zu gemini-cli-Interna.
- Debug-Log schreibt nach `./agy-debug.log` statt nach `~/.claude/scripts/`.
- CLI-Nachrichten und Nutzungstexte auf Englisch für ein internationales Publikum.
- Englische `INIT_DONE_PATTERNS` neben deutschen Patterns ergänzt.
- Einschränkung `"os": ["win32"]` aus `package.json` entfernt.

### Hinzugefügt
- Exportierte Funktion `findAgyPath()` für programmatische agy-Erkennung.
- Testsuite: 81 Tests (Unit, Fixture, Smoke) via `node:test`.
- Skripte `npm run deploy` und `npm run sync` für lokale Kopieverwaltung.
- Umfassende README mit Installation, Fehlerbehebung und Nutzung.

## [1.0.0] - 2026-06-06

### Hinzugefügt
- ConPTY-basierter Wrapper für agy (Antigravity CLI).
- ANSI-farbbasierte Antwortextraktion (`RGB(232,234,237)`).
- Zeilenbasierter Noise-Filter-Fallback.
- 4-Phasen-State-Machine (Startup, Init, Frage, Antwort).
- Adaptives Timing: 10s während Generierung, 2.5s nach Abschluss.
- Berechtigungssystem mit 5 Modi: sandbox, skip-permissions, no-tools, researcher, read-only.
- Benutzerdefinierte Allow-/Deny-Regeln, kompatibel mit agys `settings.json`-Format.
- JSON-Ausgabemodus (`--json`).
- Konfigurierbare Pfade über Umgebungsvariablen.
- Prompt-Sanitisierung gegen PTY-Injection.
- Graceful Shutdown.
- Debug-Modus mit PTY-Output-Log.
