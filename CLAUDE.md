# CLAUDE.md — Developer & AI Agent Guidelines for companion-for-agy

## Projekt-Übersicht
`companion-for-agy` ist ein Node-pty / ConPTY Wrapper für die Antigravity CLI (`agy` / Gemini CLI), der Terminal-Buffer-Antworten abfängt und als stdout für Automatisierungen bereitstellt.

## Wichtige Befehle
- **Unit Tests:** `npm run test:unit`
- **Volle Testsuite:** `npm test`
- **Doctor Diagnostic:** `npm run doctor`
- **Platform Smoke Test:** `npm run platform-smoke`

## Entwicklungs- & Qualitätsregeln
1. **Keine Breaking Changes:** Abwärtskompatibilität zur `agy` CLI und Node >=18 einhalten.
2. **Pfad-Validierung:** Pfade auf Windows immer mit `path.join` oder sauber formatierten Raw-Strings handhaben.
3. **Dokumentation:** Änderungen in `CHANGELOG.md` und `CHANGELOG_de.md` vermerken. `llms.txt` Header aktualisieren.
4. **Lock-Prüfung:** Multi-Agent Lock-Dateien (`LOCK*.txt`) vor Schreiboperationen beachten.
