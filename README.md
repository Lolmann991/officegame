# KONZERN (Prototyp v0.1)

Idle-Wirtschaftsspiel im Browser. Du beginnst 1978 als Junior-Sachbearbeiter bei der fiktiven
Kessler & Brandt Rechenwerke AG und arbeitest dich hoch. Gespielt wird am Schreibtisch in einem
3D-Büro (Low-Poly, Pixeltexturen) über den Firmen-PC.

Der Prototyp enthält Kapitel 1 komplett: von „Der erste Tag“ bis zur Beförderung zum Sachbearbeiter.
Danach läuft das Spiel endlos weiter.

Konzept, Story und Roadmap: [Game Design Document](https://claude.ai/artifact/FPW1vS3g2BwqXAwNP99H65)

## Starten

Das Spiel ist rein clientseitig und braucht keinen Server-Code. Weil es ES-Module nutzt, muss es über
einen einfachen Webserver ausgeliefert werden, ein Doppelklick auf `index.html` reicht nicht.

```bash
cd konzern
```

```bash
python3 -m http.server 8000
```

Danach im Browser `http://localhost:8000` öffnen. Jeder andere statische Webserver geht genauso,
auch GitHub Pages oder ein normaler Webspace. Three.js liegt unter `js/vendor/`, es wird kein CDN
gebraucht. Nur die Schriften kommen von Google Fonts; ohne Internet greifen Ersatzschriften.

## Steuerung

- Klick auf den Monitor: an den PC setzen. `Esc`: aufstehen.
- Im Programm AUFG den Auftragscode abtippen und `Enter` drücken.
- Maus bewegen: im Büro umsehen.

## Aufbau

| Datei | Inhalt |
| --- | --- |
| `index.html` | Seite, gesamtes CSS, Overlays (Titel, HUD, PC, Dialog, Modale) |
| `js/main.js` | Einstieg, Hauptschleife, Auto-Save, Hintergrund-Tab |
| `js/game.js` | Spiellogik ohne Rendering: Zeit, Monatsabschluss, Gehalt, Aktien, Speichern/Export |
| `js/data.js` | Balancing und Konstanten: Stufen, Upgrades, Schwierigkeitsgrade, Auftragsvorlagen |
| `js/story.js` | Kapitel 1: Figuren, Mails, Dialoge, Ereignisse, Missionen, Entscheidungen |
| `js/office.js` | Three.js-Büro: Geometrie, Canvas-Pixeltexturen, Kamera, Figuren |
| `js/pc.js` | PC-Programme: POST, AUFG, LOHN, DEPOT, BEDARF, KARR, SYS |
| `js/ui.js` | Titel, HUD, Dialogablauf, Entgeltabrechnung, Offline-Zusammenfassung, Game Over |

Neue Kapitel entstehen vor allem in `story.js` (Mails, Dialoge, `EVENTS`, `MISSIONS`) und `data.js`
(`STAGES`, `PLAYABLE_STAGES`).

## Speichern

- Automatisch alle 10 Sekunden, beim Wechsel in einen anderen Tab und beim Schließen (`localStorage`).
- SYS-Programm: Export als Code (kopieren und auf dem anderen Rechner einfügen) oder als `.json`-Datei.
- Import im SYS-Programm oder auf dem Titelbildschirm.
- Offline: 1 Spielmonat je 5 Minuten Abwesenheit, höchstens 12 Monate. Gezählt wird nur die Grundleistung,
  die Note fällt dabei nicht unter C.

## Zum Testen in der Browser-Konsole

```js
konzern.game.s.player.cash += 5000   // Geld
konzern.game.tick(60)                // einen Monat vorspulen
```
