# KONZERN (Prototyp v0.4)

Idle-Wirtschaftsspiel im Browser. Du beginnst 1978 als Junior-Sachbearbeiter bei der fiktiven
Kessler & Brandt Rechenwerke AG und arbeitest dich hoch. Gespielt wird am Schreibtisch in einem
3D-Büro (Low-Poly, Pixeltexturen) über den Firmen-PC.

Der Prototyp enthält die Kapitel 1 bis 4:

1. **Der erste Tag:** Einstieg im Großraum, Aufträge, Gehaltsabrechnung, Mitarbeiteraktien, Beförderung zum Sachbearbeiter.
2. **Lochkarten und Ehrgeiz:** Platz am Fenster, eigene Projekte (Programm PROJ), Ideenwettbewerb des Vorstands,
   ein Abwerbeversuch von Orion am Telefon und die Beförderung zum Teamleiter.
3. **Das erste Team:** eigene Gruppe mit Personal, Budget und Moral (Programm PERS), Entwicklung und
   Markteinführung des KB-Heimcomputers HC-1 gegen Orion (Programm PROD), Beförderung zum Abteilungsleiter.
4. **Abteilung PC (1987):** Zeitsprung mit Epochenwechsel (beiger PC, Fax, KB-Windows), eigenes Büro mit Glastür,
   Forschungsbaum (Programm F&E), drei Produktlinien mit Modellgenerationen, Preis und Marketing, Abteilungsergebnis
   (Programm ABT), Finanzvorstand Sauer, Orion-Chef Rau am Telefon, Beförderung zum Bereichsleiter.

Danach läuft das Spiel endlos weiter, mit laufend neuen Projekten.

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
- Im Programm PROJ ein Projekt übernehmen und festlegen, wie viel Arbeitszeit hineinfließt (0–75 %).
  Dieser Anteil fehlt dem Monatsziel. Fertige Projekte bringen eine Prämie auf der nächsten Abrechnung.
- Im Programm PERS Leute einstellen, loben, Gehälter erhöhen und zum Teamessen einladen. Das Teamessen zahlst du privat.
  Unter 25 % Moral kündigen Leute.
- Im Programm PROD die Ausstattung des HC-1 wählen, die Entwicklung starten und später den Verkaufspreis festlegen.
  Ab Kapitel 4 führst du dort drei Produktlinien mit Nachfolgemodellen, Preis und Marketing.
- Im Programm F&E das Forschungsbudget setzen und die nächste Technologie wählen.
- Im Programm ABT die monatliche Erfolgsrechnung der Abteilung verfolgen.
- Maus bewegen: im Büro umsehen.

## Aufbau

| Datei | Inhalt |
| --- | --- |
| `index.html` | Seite, gesamtes CSS, Overlays (Titel, HUD, PC, Dialog, Modale) |
| `js/main.js` | Einstieg, Hauptschleife, Auto-Save, Hintergrund-Tab |
| `js/game.js` | Spiellogik ohne Rendering: Zeit, Monatsabschluss, Gehalt, Aktien, Projekte, Team, Produkt und Markt, Speichern/Export |
| `js/data.js` | Balancing und Konstanten: Stufen, Upgrades, Schwierigkeitsgrade, Auftragsvorlagen |
| `js/story.js` | Story: Figuren, Projekte, Mails, Dialoge, Ereignisse, Missionen, Entscheidungen |
| `js/office.js` | Three.js-Büro: Geometrie, Canvas-Pixeltexturen, Kamera, Figuren |
| `js/pc.js` | PC-Programme: POST, AUFG, PROJ, PERS, PROD, F&E, ABT, LOHN, DEPOT, BEDARF, KARR, SYS |
| `js/ui.js` | Titel, HUD, Dialogablauf, Entgeltabrechnung, Offline-Zusammenfassung, Game Over |

Neue Kapitel entstehen vor allem in `story.js` (Mails, Dialoge, `EVENTS`, `MISSIONS`) und `data.js`
(`STAGES`, `PLAYABLE_STAGES`, `CHAPTERS`, `PROJECT_TEMPLATES`).

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
