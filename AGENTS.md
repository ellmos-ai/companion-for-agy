# AGENTS.md — Multi-Agent Multi-Framework Guidance (companion-for-agy)

**Zweck:** Einstiegspunkt für Agent-Frameworks (Antigravity/Gemini, Codex CLI, Claude CLI) im Repository `companion-for-agy`.

Lies und folge den Hauptregeln:
1. **Globale Regeln:** `~/CLAUDE.md` (zentrale Regeldatei des jeweiligen Hosts)
2. **Projekt-Steuerung:** [CLAUDE.md](CLAUDE.md) und [README.md](README.md)

## Multi-Agenten-Koordination & Lock-Sicherheit
- Vor Änderungen am Projekt prüfen, ob eine aktive `LOCK*.txt` im Ordner liegt (`LOCK.txt` = ganzes Projekt, `LOCK.<scope>.txt` = Komponente).
- Gesperrt → Datei/Ordner nicht anpacken. `LOCK.user*.txt` NIEMALS entfernen.
- **Pfad-Autorität:** Änderungen direkt im lokalen Quellordner (dem lokalen Klon dieses Repos, nicht in einem Cloud-Sync-Ordner) durchführen.

## Qualitäts-Gates & Testanweisungen
- Vor jedem Commit/Deployment die Testsuite ausführen:
  ```bash
  npm test
  ```
- `CHANGELOG.md` und `llms.txt` Metadaten-Zeitstempel pflegen.
