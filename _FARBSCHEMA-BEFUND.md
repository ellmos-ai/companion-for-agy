# Farbschema-Befund: agy-Antwortextraktion

Stand: 2026-08-03

## Ergebnis

Das aktuell konfigurierte agy-Schema `colorblind-friendly dark` macht die Antwortextraktion **nicht aufgrund seiner Antwortfarbe** kaputt. Im installierten agy 1.1.9 verwendet dieses Schema für den normalen Vordergrund-/Antworttext `#e8eaed`, also `RGB(232,234,237)`. Genau diesen Wert verwendet companion-for-agy standardmäßig.

Die Extraktion ist trotzdem nicht allgemein schemaunabhängig: Mehrere andere agy-Schemas verwenden für dieses Farbfeld andere Werte. Dann liefert die reine Farbextraktion keinen Treffer. `extractResponse()` versucht anschließend einen ANSI-bereinigten, zeilenbasierten Fallback; eine abweichende Farbe bedeutet daher nicht automatisch eine leere Antwort. Bei komplexen TUI-Redraws kann dieser Fallback die Antwortgrenzen aber nicht so eindeutig bestimmen wie die Farbextraktion. Der bestehende Roadmap-Punkt wurde deshalb als präziser TODO fortgeführt.

## Was der Companion tatsächlich tut

Gelesene Implementierung: `src/agy-companion.mjs`.

- `DEFAULT_RESPONSE_RGB` ist auf `[232, 234, 237]` festgelegt (Zeile 39).
- `getResponseSgrParams()` liest optional `AGY_COMPANION_RESPONSE_RGB`; ohne gültigen Wert bleibt es beim Standard (Zeilen 65–81). Die Farbe ist damit manuell konfigurierbar, wird aber weder aus `settings.json` gelesen noch automatisch erkannt.
- `extractByResponseColor()` aktiviert die Erfassung nur bei einem exakt passenden Truecolor-SGR-Parameter und beendet sie bei einer anderen Vordergrundfarbe (Zeilen 1018–1156). Ohne Treffer gibt die Funktion `null` zurück.
- `extractResponse()` ruft zuerst die Farbextraktion auf. Ohne Farbtreffer entfernt es ANSI-Sequenzen und filtert erkannte TUI-Rauschzeilen sowie das Prompt-Echo (Zeilen 1183–1216). Es gibt also einen schemaunabhängigen Fallback, aber keine automatische Farbkalibrierung.
- `--debug` schreibt beim Prozessende den vollständigen PTY-Rohpuffer einschließlich ANSI-Sequenzen als `agy-debug.log` (Zeilen 1571–1579).

Ein synthetischer Lauf gegen die exportierten Extraktionsfunktionen verwendete absichtlich `RGB(1,2,3)`:

```json
{"colorOnly":null,"full":"COLOR_SCHEMA_PROBE_OK"}
```

Damit ist ausgeführt belegt: Die reine Farbextraktion verfehlt eine andersfarbige Antwort; der Fallback rettet zumindest diesen einfachen Fall vollständig.

## agy-Schemas und Antwortfarben

Geprüfte Installation: `%LOCALAPPDATA%gyingy.exe`, `agy --version` = `1.1.9`.

Die acht Schemanamen wurden aus der im installierten Go-Binary enthaltenen `colorSchemeOptions`-/`ColorScheme.Valid`-Tabelle gelesen. Die sieben festen Paletten werden in `types.init` in derselben Reihenfolge aufgebaut. Für jede Palette wurde das normale Vordergrundfeld aus den im Binary referenzierten Hexwerten gelesen. Die Zuordnung stimmt für `dark` mit der bereits vom Companion erwarteten und dokumentierten Antwortfarbe `#e8eaed` überein.

| agy-Schema | Vordergrund-/Antwortfarbe | Passt zum Companion-Standard? |
|---|---:|---|
| `light` | `#202124` = `RGB(32,33,36)` | Nein |
| `solarized light` | `#073642` = `RGB(7,54,66)` | Nein |
| `colorblind-friendly light` | `#202124` = `RGB(32,33,36)` | Nein |
| `dark` | `#e8eaed` = `RGB(232,234,237)` | Ja |
| `solarized dark` | `#eee8d5` = `RGB(238,232,213)` | Nein |
| `colorblind-friendly dark` | `#e8eaed` = `RGB(232,234,237)` | **Ja** |
| `tokyo night` | `#c0caf5` = `RGB(192,202,245)` | Nein |
| `terminal` | kein fester RGB-Wert; übernimmt Terminalfarben | Nicht verlässlich |

Die offizielle agy-CLI-Referenz nennt dieselben acht Schemas und beschreibt `terminal` als Übernahme der nativen Shellfarben: <https://antigravity.google/docs/cli-reference>.

## Empirische Live-Prüfung und Grenze

Aktive Einstellung, direkt aus `~/.gemini/antigravity-cli/settings.json` gelesen:

```json
"colorScheme": "colorblind-friendly dark"
```

Ausgeführter Companion-Test:

```powershell
node src/agy-companion.mjs --live-smoke --no-model --debug --json --timeout 180000
```

Ergebnis: Exit-Code `3`; agy meldete `You are not logged into Antigravity.`. Die erzeugte `agy-debug.log` enthielt 31.621 Bytes ANSI-Rohdaten, aber keine Antwort und keinen Marker. Ein zusätzlicher direkter PTY-Lauf mit `agy --log-file <Repo>\agy-cli-probe.log --sandbox --print "Respond with exactly: COLOR_SCHEMA_PROBE_OK"` erreichte den Google-OAuth-Dialog und endete nach 60 Sekunden mit `authentication timed out` (Exit-Code `1`). Daher wurde in dieser Sitzung **keine echte Modellantwortfarbe live gemessen**.

Die Aussage zum aktuellen Schema beruht folglich auf der statischen Palette des tatsächlich installierten agy 1.1.9 und der gelesenen Companion-Implementierung, nicht auf einer erfundenen erfolgreichen Live-Antwort. Die Diagnose-Logs wurden nach der Auswertung aus dem Repository entfernt.

## TODO-Entscheidung

Ein TODO ist nötig, jedoch nicht als akuter Defekt des aktuellen Schemas. Der allgemeine Vertrag bleibt schemaabhängig. In `ROADMAP.md` sind zwei Lösungswege festgehalten:

1. ein Setter, der agy kontrolliert auf ein bekanntes, kompatibles Schema stellt und die vorherige Einstellung sicher wiederherstellt;
2. eine Laufzeitkalibrierung, die die tatsächliche Antwortfarbe mit einem eindeutigen Marker ermittelt und pro agy-Version, Plattform und Schema validiert zwischenspeichert.

