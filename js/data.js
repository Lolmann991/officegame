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
  { title: 'Bereichsleiter', dept: 'Geschäftsbereich Netz', salary: 11000, target: 4000, living: 3400, year: 1993 },
  { title: 'Vorstand', dept: 'Ressort Finanzen', salary: 18000, target: 4500, living: 5200, year: 1999 },
  { title: 'CEO', dept: 'Konzernleitung', salary: 36000, target: 5000, living: 8000, year: 2001 },
];
export const PLAYABLE_STAGES = 7;

// Kapitel-Karten: erscheinen beim Erreichen einer Stufe (intro) und bei der nächsten Beförderung (outro).
export const CHAPTERS = [
  { no: 1, title: 'Der erste Tag', stage: 0 },
  { no: 2, title: 'Lochkarten und Ehrgeiz', stage: 1,
    intro: 'Du bist jetzt Sachbearbeiter und hast einen Platz am Fenster. Neu ist das Programm PROJ: Dort übernimmst du eigene Projekte. Aber Vorsicht, jede Stunde im Projekt fehlt deinem Monatsziel.' },
  { no: 3, title: 'Das erste Team', stage: 2,
    intro: 'Du leitest jetzt die Gruppe Heimcomputer. Neu sind die Programme PERS und PROD: Stelle Leute ein, halte die Moral hoch und bring den ersten Heimcomputer von KB auf den Markt. Ab jetzt zählt die Leistung des ganzen Teams.' },
  { no: 4, title: 'Abteilung PC', stage: 3, jumpYear: 1987,
    intro: 'Vier Jahre später, Januar 1987. Du leitest die neue PC-Sparte und hast ein eigenes Büro mit Tür. Neu sind die Programme F&E (Forschung) und ABT (Abteilungsergebnis). Im Programm PROD führst du jetzt mehrere Produktlinien. Dein Erfolg wird am Ergebnis der Abteilung gemessen.' },
  { no: 5, title: 'Die Netz-Wette', stage: 4, jumpYear: 1993,
    intro: 'Sechs Jahre später, Januar 1993. Du leitest den Geschäftsbereich Netz, mit größerem Büro und Sitzecke. Neu ist das Programm NETZ: Baue den Onlinedienst KB-Net auf, Stadt für Stadt. Aber im Vorstand hat das Netz nicht nur Freunde.' },
  { no: 6, title: 'Im Vorstand', stage: 5, jumpYear: 1999,
    intro: 'Sommer 1999. Du sitzt im Vorstand und verantwortest die Finanzen. An der Börse ist alles möglich, jede Firma mit „.de“ im Namen ist Millionen wert. Neu ist das Programm FIN. Aber Kessler sagt: Was so schnell steigt, fällt auch so schnell.' },
  { no: 7, title: 'Die Übernahme', stage: 6, jumpYear: 2008,
    intro: 'Januar 2008. Du führst KB seit sechs Jahren als Vorstandsvorsitzender, Kessler sitzt dem Aufsichtsrat vor. Die Zeiten scheinen ruhig. Aber in Frankfurt plant jemand seine Rückkehr.' },
];

// ---------------------------------------------------------------- Team (ab Kapitel 3)
export const TEAM_MAX_BY_STAGE = [0, 0, 5, 8, 8, 8, 8];
export const TEAM_MAX = 5;
export const TEAM_BUDGET = 14000;          // Personalbudget der Gruppe in DM pro Monat
export const DEPT_TEAM_BUDGET = 30000;     // Personalbudget der Abteilung ab Kapitel 4
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
// Währung: ab 2002 Euro. Intern rechnet das Spiel weiter in DM, angezeigt wird umgerechnet.
export const EURO_RATE = 1.95583;
export const CURRENCY = { euro: false };
export const cur = () => (CURRENCY.euro ? '€' : 'DM');
export const toCur = (v) => (CURRENCY.euro ? v / EURO_RATE : v);
export const fmtDM = (v) => `${dm.format(toCur(v))} ${cur()}`;
// Betrag in der Währung eines bestimmten Jahres (für alte Abrechnungen)
export const fmtAt = (v, year) => (year >= 2002 ? `${dm.format(v / EURO_RATE)} €` : `${dm.format(v)} DM`);
export const numAt = (v, year) => dm.format(year >= 2002 ? v / EURO_RATE : v);
export const fmtNum = (v) => dm.format(v);
export const fmtInt = (v) => int.format(Math.floor(v));
export const fmtPct = (v, digits = 0) =>
  `${new Intl.NumberFormat('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v * 100)} %`;

// ---------------------------------------------------------------- Kapitel 4: Forschung, Produktlinien, Abteilung
export const RD_BUDGETS = [0, 25000, 50000, 100000];  // DM pro Monat
export const RD_FP_PER_DM = 1 / 250;                  // Forschungspunkte je DM

export const TECHS = [
  { id: 'cpu16', name: '16-Bit-Prozessor', cost: 300, req: [], unlock: 'pc', desc: 'Schaltet die Produktlinie Bürocomputer frei.' },
  { id: 'disk35', name: '3½-Zoll-Laufwerk', cost: 220, req: [], q: { home: 1, pc: 1 }, desc: '+1 Qualität für Heim- und Bürocomputer.' },
  { id: 'ega', name: 'Farbgrafik EGA', cost: 260, req: [], q: { home: 1, pc: 1 }, desc: '+1 Qualität für Heim- und Bürocomputer.' },
  { id: 'hdd', name: 'Festplatte 20 MB', cost: 450, req: ['cpu16'], q: { pc: 2 }, desc: '+2 Qualität für Bürocomputer.' },
  { id: 'portable', name: 'Tragbares Gehäuse', cost: 520, req: ['cpu16', 'disk35'], unlock: 'portable', desc: 'Schaltet die Produktlinie Tragbare frei.' },
  { id: 'gui', name: 'Maus und Fenster', cost: 480, req: ['ega'], q: { home: 1, pc: 1, portable: 1 }, desc: '+1 Qualität für alle Linien.' },
  { id: 'cpu32', name: '32-Bit-Prozessor', cost: 800, req: ['hdd'], q: { pc: 2, portable: 1 }, desc: '+2 Qualität Büro, +1 Tragbare.' },
  { id: 'lan', name: 'Netzwerkkarte', cost: 650, req: ['cpu16'], q: { pc: 1 }, desc: '+1 Qualität Büro. Die Zukunft heißt Vernetzung.' },
  { id: 'laser', name: 'Laserdrucker-Anschluss', cost: 400, req: ['gui'], q: { pc: 1, portable: 1 }, desc: '+1 Qualität Büro und Tragbare.' },
];

export const MARKETING = [
  { cost: 0, mult: 1, label: 'KEINS' },
  { cost: 20000, mult: 1.2, label: 'ANZEIGEN' },
  { cost: 50000, mult: 1.45, label: 'TV + ANZEIGEN' },
];

// Produktlinien der PC-Sparte. size = Käufer pro Monat, margin = Rohertrag am Umsatz.
export const LINES = {
  home: { name: 'Heimcomputer', model: 'HC', size: 9000, prices: [995, 1495, 1995], baseQ: 4, margin: 0.08, devNeed: 7000, orion: 'OR-Home', orionQ: 6 },
  pc: { name: 'Bürocomputer', model: 'KB PC', size: 6000, sizeCompat: 11000, prices: [3995, 5995, 7995], baseQ: 4, margin: 0.22, marginCompat: 0.14, devNeed: 9000, orion: 'OR-PC', orionQ: 5, needs: 'cpu16' },
  portable: { name: 'Tragbare', model: 'KB Portable', size: 2500, prices: [5995, 7995, 9995], baseQ: 4, margin: 0.2, devNeed: 10000, orion: 'OR-Mobil', orionQ: 5, needs: 'portable' },
};
export const DEPT_COMMISSION = 0.0008; // Erfolgsbeteiligung am positiven Abteilungsergebnis

// ---------------------------------------------------------------- Kapitel 5: KB-Net
export const NET_CITIES = [
  { id: 'kassel', name: 'Kassel', pop: 200000 },
  { id: 'frankfurt', name: 'Frankfurt', pop: 650000 },
  { id: 'hannover', name: 'Hannover', pop: 520000 },
  { id: 'koeln', name: 'Köln', pop: 960000 },
  { id: 'duesseldorf', name: 'Düsseldorf', pop: 570000 },
  { id: 'stuttgart', name: 'Stuttgart', pop: 590000 },
  { id: 'bremen', name: 'Bremen', pop: 550000 },
  { id: 'leipzig', name: 'Leipzig', pop: 490000 },
  { id: 'dresden', name: 'Dresden', pop: 480000 },
  { id: 'muenchen', name: 'München', pop: 1250000 },
  { id: 'hamburg', name: 'Hamburg', pop: 1700000 },
  { id: 'berlin', name: 'Berlin', pop: 3400000 },
];
export const NET_NODE_COST = (pop) => Math.round((300000 + pop * 0.4) / 10000) * 10000;
export const NET_NODE_UPKEEP = 25000;     // DM pro Knoten und Monat
// Anteil der Bevölkerung mit Internetzugang (Spielwerte, schneller als in der Wirklichkeit)
export const NET_ADOPTION = { 1993: 0.004, 1994: 0.01, 1995: 0.022, 1996: 0.04, 1997: 0.07, 1998: 0.11, 1999: 0.17, 2000: 0.25, 2001: 0.33, 2002: 0.4 };
export const NET_TARIFFS = [9.9, 19.9, 29.9];
export const NET_UPGRADES = [
  { name: 'Modems mit 9.600 Baud', cost: 800000 },
  { name: 'Modems mit 14.400 Baud', cost: 1500000 },
  { name: 'Modems mit 28.800 Baud', cost: 2500000 },
  { name: 'ISDN-Zugänge', cost: 4000000 },
];
export const NET_COMPETITORS = [
  { id: 'postnet', name: 'PostNet', q: 5, tariff: 24.9, brand: 1.3, from: 1993 },
  { id: 'orionline', name: 'OrionLine', q: 4, tariff: 14.9, brand: 1.0, from: 1994 },
];

// ---------------------------------------------------------------- Kapitel 6: Konzernfinanzen
export const CORP_START_CASH = 500e6;
export const CORP_SHARES = 4800000;
export const CORP_LEGACY_RESULT = 9e6;     // Großrechner und Services, DM pro Monat
export const CORP_LOAN_STEP = 100e6;
export const CORP_LOAN_RATE = 0.065;
export const DIVIDEND_POLICIES = [
  { id: 'niedrig', label: 'NIEDRIG', payout: 0.2, perf: -0.05 },
  { id: 'mittel', label: 'MITTEL', payout: 0.4, perf: 0 },
  { id: 'hoch', label: 'HOCH', payout: 0.6, perf: 0.05 },
];
// Börsenstimmung (Monatsindex ab Januar 1999) – Neuer-Markt-Hype und Crash
export const HYPE_POINTS = [[0, 1.2], [14, 3.0], [20, 2.0], [26, 0.9], [32, 0.7], [41, 0.85], [53, 1.0], [108, 1.1], [116, 0.95], [118, 0.6], [123, 0.55], [134, 0.85], [150, 1.0]];
// Wirtschaftslage für Absatz (1 = normal)
export const ECONOMY_POINTS = [[0, 1], [20, 1], [26, 0.72], [36, 0.75], [48, 0.95], [56, 1], [116, 1], [119, 0.78], [128, 0.8], [140, 1]];
export const STARTUPS = [
  { id: 'klickfix', name: 'Klickfix AG', desc: 'Online-Kaufhaus, das nie Gewinn gemacht hat', base: 80e6, burn: 2.5e6 },
  { id: 'webwelt', name: 'WebWelt AG', desc: 'Internetportal mit Chat, Horoskop und Wetter', base: 120e6, burn: 3.5e6 },
  { id: 'b2bplus', name: 'B2B-Plus AG', desc: 'Marktplatz für den Firmeneinkauf', base: 160e6, burn: 4e6 },
  { id: 'mobilnet', name: 'MobilNet AG', desc: 'Software für Handys. Klein, aber die Entwickler sind gut', base: 60e6, burn: 0.8e6, future: true },
];

// ---------------------------------------------------------------- Kapitel 7: Übernahmeschlacht
export const TAKEOVER = {
  orionStart: 15,          // Prozent, die Orion heimlich gesammelt hat
  premium: 1.35,           // Angebot über dem Kurs bei Bekanntgabe
  months: 7,               // bis zur Hauptversammlung
  orionPrice: 2.4e9,       // DM, Preis für ein Gegenangebot auf Orion
  campaignCost: 60e6,
  buybackPct: 3,
  maxBuybacks: 3,
};

// ---------------------------------------------------------------- Erfolge
export const ACHIEVEMENTS = [
  { id: 'lohn', name: 'Erster Lohn', desc: 'Die erste Entgeltabrechnung erhalten' },
  { id: 'note_a', name: 'Klassenbester', desc: 'Einen Monat mit Note A abschließen' },
  { id: 'serie', name: 'Fehlerfrei', desc: '15 Aufträge in Folge ohne Tippfehler' },
  { id: 'aktie', name: 'Aktionär', desc: 'Die erste KB-Aktie kaufen' },
  { id: 'auftraege', name: 'Fleißarbeit', desc: '250 Aufträge bearbeiten' },
  { id: 'ausstattung', name: 'Bestens ausgestattet', desc: 'Alle Büro-Upgrades besitzen' },
  { id: 'saubere_akte', name: 'Saubere Akte', desc: 'Abteilungsleiter werden, ohne je abgemahnt zu werden' },
  { id: 'pokal', name: 'Ideengeber', desc: 'Den Ideenwettbewerb gewinnen' },
  { id: 'team', name: 'Volles Haus', desc: 'Eine Abteilung mit 8 Leuten führen' },
  { id: 'verkauf', name: 'Kassenschlager', desc: '100.000 Geräte verkaufen' },
  { id: 'forscher', name: 'Forscher', desc: 'Alle Technologien erforschen' },
  { id: 'online', name: 'Online-Pionier', desc: '100.000 Kunden bei KB-Net' },
  { id: 'blase', name: 'Rechtzeitig raus', desc: 'Eine Beteiligung mit Gewinn verkaufen' },
  { id: 'krise', name: 'Krisenmanager', desc: 'KB durch den Dotcom-Crash bringen' },
  { id: 'millionaer', name: 'Millionär', desc: 'Privat eine Million DM besitzen (Konto und Aktien)' },
  { id: 'ceo', name: 'Ganz oben', desc: 'Vorstandsvorsitzender werden' },
  { id: 'unabhaengig', name: 'Unabhängig', desc: 'Die Übernahme durch Orion abwehren' },
  { id: 'pacman', name: 'Den Spieß umgedreht', desc: 'Orion selbst übernehmen' },
];
