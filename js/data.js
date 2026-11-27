// Spielkonstanten, Karrierestufen, Upgrades und Auftragsvorlagen.
// Reine Daten: hier lässt sich das Balancing anpassen, ohne die Logik anzufassen.

export const SAVE_KEY = 'konzern.save.v1';
export const SAVE_VERSION = 1;

export const MONTH_SECONDS = 60;              // 1 Spielmonat = 60 s Echtzeit
export const OFFLINE_SECONDS_PER_MONTH = 300; // offline: 1 Spielmonat je 5 Minuten
export const OFFLINE_MAX_MONTHS = 12;         // höchstens 12 Monate werden nachgerechnet
export const BASE_PASSIVE = 3;                // Leistungspunkte pro Sekunde ohne Upgrades
export const TASK_BASE_VALUE = 35;            // Punkte pro abgetipptem Auftrag
export const SHARE_DISCOUNT = 0.15;           // Mitarbeiterrabatt auf KB-Aktien
export const SHARES_OUTSTANDING = 4_800_000;  // Grundkapital der KB AG in Stück
export const DIVIDEND_PER_SHARE = 3.2;        // DM, ausgezahlt im Dezember

export const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
  'August', 'September', 'Oktober', 'November', 'Dezember'];
export const MONTH_SHORT = ['JAN', 'FEB', 'MÄR', 'APR', 'MAI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEZ'];
export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const DIFFICULTIES = {
  leicht: {
    id: 'leicht', label: 'Leicht', target: 0.75, warningsLimit: Infinity, warnDecay: 2, offline: 1,
    text: 'Kein Game Over. Ein schlechter Monat kostet 10 % Grundgehalt.',
  },
  normal: {
    id: 'normal', label: 'Normal', target: 1, warningsLimit: 3, warnDecay: 4, offline: 1,
    text: 'Die dritte Abmahnung ist die Kündigung. Vier gute Monate in Folge tilgen eine.',
  },
  hardcore: {
    id: 'hardcore', label: 'Hardcore', target: 1.25, warningsLimit: 2, warnDecay: Infinity, offline: 0.5,
    text: 'Höheres Monatsziel, Abmahnungen verfallen nie, die zweite ist die Kündigung. Halber Offline-Fortschritt.',
  },
};

// Karrierestufen der Story. Nur die ersten beiden sind im Prototyp spielbar.
export const STAGES = [
  { title: 'Junior-Sachbearbeiter', dept: 'Rechenzentrum', salary: 2400, target: 500, living: 1200, year: 1978 },
  { title: 'Sachbearbeiter', dept: 'Rechenzentrum', salary: 3100, target: 800, living: 1450, year: 1980 },
  { title: 'Teamleiter', dept: 'Gruppe Heimcomputer', salary: 4500, target: 2100, living: 1900, year: 1983 },
  { title: 'Abteilungsleiter', dept: 'PC-Sparte', salary: 7000, target: 3600, living: 2600, year: 1987 },
  { title: 'Bereichsleiter', dept: 'Geschäftsbereich Netz', salary: 11000, year: 1993 },
  { title: 'Vorstand', dept: 'Ressort Finanzen', salary: 18000, year: 1999 },
  { title: 'CEO', dept: 'Konzernleitung', salary: 36000, year: 2008 },
];
export const PLAYABLE_STAGES = 4;

// Kapitel-Karten: erscheinen beim Erreichen einer Stufe (intro) und bei der nächsten Beförderung (outro).
export const CHAPTERS = [
  { no: 1, title: 'Der erste Tag', stage: 0 },
  { no: 2, title: 'Lochkarten und Ehrgeiz', stage: 1,
    intro: 'Du bist jetzt Sachbearbeiter und hast einen Platz am Fenster. Neu ist das Programm PROJ: Dort übernimmst du eigene Projekte. Aber Vorsicht, jede Stunde im Projekt fehlt deinem Monatsziel.' },
  { no: 3, title: 'Das erste Team', stage: 2,
    intro: 'Du leitest jetzt die Gruppe Heimcomputer. Neu sind die Programme PERS und PROD: Stelle Leute ein, halte die Moral hoch und bring den ersten Heimcomputer von KB auf den Markt. Ab jetzt zählt die Leistung des ganzen Teams.' },
  { no: 4, title: 'Abteilung PC', stage: 3 },
];

// ---------------------------------------------------------------- Team (ab Kapitel 3)
export const TEAM_MAX = 5;
export const TEAM_BUDGET = 14000;          // Personalbudget der Gruppe in DM pro Monat
export const TEAM_RATE_PER_SKILL = 1.6;    // Leistung/s je Fähigkeitspunkt bei Moral 50
export const DINNER_COST = 45;             // DM pro Person, privat bezahlt

export const TRAITS = {
  fleissig:    { label: 'fleißig', desc: '+20 % Leistung', mult: 1.2 },
  kreativ:     { label: 'kreativ', desc: '+30 % im Produkt', prodMult: 1.3 },
  gesellig:    { label: 'gesellig', desc: 'Teamessen wirkt doppelt', dinner: 2 },
  eigensinnig: { label: 'eigensinnig', desc: 'Moral sinkt schneller', drift: 45 },
  loyal:       { label: 'loyal', desc: 'kündigt nie', loyal: true },
};

export const FIRST_NAMES = ['Jürgen', 'Monika', 'Bernd', 'Sabine', 'Klaus', 'Ayşe', 'Rainer', 'Gabriele', 'Thomas',
  'Ute', 'Dieter', 'Karin', 'Mehmet', 'Birgit', 'Stefan', 'Renate', 'Frank', 'Angelika', 'Holger', 'Elke'];
export const LAST_NAMES = ['Falk', 'Weber', 'Kowalski', 'Hartmann', 'Demir', 'Schulte', 'Brandl', 'Neumann', 'Vogt',
  'Sommer', 'Yılmaz', 'Krüger', 'Lorenz', 'Hofmann', 'Pohl', 'Albers', 'Engel', 'Wolff'];

// ---------------------------------------------------------------- Produkt HC-1
export const PRODUCT_SPEC = {
  mem: { label: 'Arbeitsspeicher', options: [
    { id: '16', label: '16 KB', need: 0, q: 0, note: 'reicht für Spiele und Briefe' },
    { id: '64', label: '64 KB', need: 1500, q: 2, note: 'Platz für richtige Programme' },
  ] },
  drive: { label: 'Datenträger', options: [
    { id: 'kassette', label: 'Kassettenrekorder', need: 0, q: 0, note: 'billig, aber langsam' },
    { id: 'diskette', label: '5¼-Zoll-Diskette', need: 2000, q: 2, note: 'schnell und teuer' },
  ] },
  gfx: { label: 'Grafik', options: [
    { id: 'mono', label: 'Grün-Monitor', need: 0, q: 0, note: 'wie im Büro' },
    { id: 'farbe', label: 'Farbe am Fernseher', need: 1200, q: 2, note: 'Familien lieben Farbe' },
  ] },
};
export const PRODUCT_BASE_NEED = 4500;
export const PRODUCT_BASE_Q = 3;           // Qualität 3–10
export const PRODUCT_PRICES = [1495, 1995, 2495];
export const PRODUCT_MARKET = 9000;        // Heimcomputer-Käufer pro Monat in Deutschland (Spielwert)
export const PRODUCT_HYPE = [1.5, 1.3, 1.15, 1.0, 0.9, 0.8, 0.7, 0.65, 0.6];
export const PRODUCT_COMMISSION = 0.0004;  // Erfolgsbeteiligung am Umsatz
export const ORION_HOME = { name: 'Orion OR-Home', price: 1795, q: 6 };

// Arbeitsanteil, der in ein Projekt fließen kann
export const PROJECT_SHARES = [0, 0.25, 0.5, 0.75];

// Vorlagen für prozedurale Projekte (Endlos-Inhalt ab Kapitel 2)
export const PROJECT_TEMPLATES = [
  { name: 'Druckerstraße Werk {w} umstellen', desc: 'Die Schnelldrucker in Werk {w} sollen ihre Aufträge direkt vom Großrechner bekommen.' },
  { name: 'Datensicherung für {k}', desc: '{k} will jede Nacht eine Kopie ihrer Bestände auf Band. Bisher macht das niemand zuverlässig.' },
  { name: 'Schulungsmappe Jobsteuerung', desc: 'Neue Kollegen brauchen eine verständliche Anleitung für die Jobsteuerkarten.' },
  { name: 'Rechenzeit-Abrechnung automatisieren', desc: 'Die Kundenabrechnung der Rechenzeit wird noch von Hand addiert. Das geht besser.' },
  { name: 'Lochkartenlager in Werk {w} auflösen', desc: '30.000 Lochkarten sollen auf Magnetband übertragen werden.' },
  { name: 'Fehlerstatistik für {k}', desc: '{k} beschwert sich über Abbrüche im Nachtlauf. Finde heraus, woran es liegt.' },
];

// Büro-Upgrades. passive = Leistung/s, taskMult = Bonus pro Auftrag, rep = Ruf.
export const UPGRADES = [
  { id: 'plant', name: 'Gummibaum im Topf', price: 60, rep: 1, kind: 'Deko',
    desc: '+1 Ruf. Ein bisschen Grün im Großraum.' },
  { id: 'picture', name: 'Kunstdruck „Bauhaus“', price: 120, rep: 1, kind: 'Deko',
    desc: '+1 Ruf. Hängt an der Stellwand.' },
  { id: 'lamp', name: 'Schreibtischlampe', price: 150, passive: 1, kind: 'Komfort',
    desc: '+1 Leistung/s. Warmes Licht am Platz.' },
  { id: 'calc', name: 'Taschenrechner TR-30', price: 180, passive: 2, kind: 'Hardware',
    desc: '+2 Leistung/s. Nie wieder Kopfrechnen.' },
  { id: 'radio', name: 'Kofferradio', price: 290, passive: 2, kind: 'Komfort',
    desc: '+2 Leistung/s. Leise Musik hält wach.' },
  { id: 'coffee', name: 'Kaffeemaschine', price: 420, passive: 3, taskMult: 0.1, kind: 'Komfort',
    desc: '+3 Leistung/s und +10 % pro Auftrag.' },
  { id: 'monitor2', name: 'Zweites Terminal-Display', price: 1400, taskMult: 0.3, kind: 'Hardware',
    desc: 'Zwei Programme gleichzeitig und +30 % pro Auftrag.' },
  { id: 'urkunde', name: 'Beförderungsurkunde', price: 0, rep: 2, kind: 'Status', shop: false,
    desc: 'Hängt an der Stellwand. Jeder soll sie sehen.' },
  // ab Sachbearbeiter
  { id: 'kaktus', name: 'Kaktus fürs Fensterbrett', price: 45, rep: 1, kind: 'Deko', minStage: 1,
    desc: '+1 Ruf. Pflegeleicht, wie du.' },
  { id: 'rolodex', name: 'Rollkartei', price: 380, passive: 2, kind: 'Komfort', minStage: 1,
    desc: '+2 Leistung/s. Jede Telefonnummer in drei Sekunden.' },
  { id: 'tastentelefon', name: 'Tastentelefon', price: 520, taskMult: 0.15, kind: 'Hardware', minStage: 1,
    desc: '+15 % pro Auftrag. Schluss mit der Wählscheibe.' },
  { id: 'schreibmaschine', name: 'Elektrische Schreibmaschine', price: 950, passive: 4, kind: 'Hardware', minStage: 1,
    desc: '+4 Leistung/s. Mit Korrekturband.' },
  { id: 'pokal', name: 'Pokal „Ideenwettbewerb 1980“', price: 0, rep: 3, kind: 'Status', shop: false,
    desc: 'Vom Vorstand überreicht.' },
];

export const TASKS = [
  { p: 'LK', t: 'Lochkartenstapel {n} auf Lochfehler prüfen' },
  { p: 'RL', t: 'Rechenlauf Lohnbuchhaltung Werk {w} starten' },
  { p: 'MB', t: 'Magnetband {n} ins Bandarchiv einlagern' },
  { p: 'FP', t: 'Fehlerprotokoll von Job {n} auswerten' },
  { p: 'DR', t: 'Druckauftrag {n} für den Vertrieb freigeben' },
  { p: 'SA', t: 'Speicherauszug für {k} sichern' },
  { p: 'JS', t: 'Jobsteuerkarten für Nachtlauf {n} setzen' },
  { p: 'KO', t: 'Kostenstellenbericht {n} abstimmen' },
  { p: 'RZ', t: 'Rechenzeit für {k} abrechnen' },
];
export const WERKE = ['Süd', 'Nord', 'Bremen', 'Kassel', 'Augsburg', 'Hagen'];
export const KUNDEN = ['Hansa Versicherung', 'Stadtwerke Lindau', 'Bankhaus Merz', 'Brauerei Kogel',
  'Spedition Rehm', 'Kreissparkasse Ulm'];

export const GRADE_COMMENTS = {
  A: 'Hervorragend. Weiter so.',
  B: 'Ordentliche Arbeit.',
  C: 'Da ist mehr drin.',
  D: 'So nicht. Siehe Abmahnung.',
};

// ---------- Formatierung ----------
const dm = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const int = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
export const fmtDM = (v) => `${dm.format(v)} DM`;
export const fmtNum = (v) => dm.format(v);
export const fmtInt = (v) => int.format(Math.floor(v));
export const fmtPct = (v, digits = 0) =>
  `${new Intl.NumberFormat('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v * 100)} %`;
