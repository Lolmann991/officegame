// Kapitel 1: Mails, Dialoge, Ereignisse und Missionen.
// Texte dürfen Funktionen sein: (g) => string. Eine Dialogzeile, die null liefert, wird übersprungen.

import { DIFFICULTIES, STAGES, fmtDM, fmtPct, MONTH_NAMES } from './data.js';

const first = (g) => g.s.player.name.split(' ')[0];

// ---------------------------------------------------------------- Figuren
export const PEOPLE = {
  hoff:     { name: 'Werner Hoff', role: 'Abteilungsleiter Rechenzentrum', suit: 0x5b5e57, shirt: 0xd9d2bd, hair: 0x4a3524, tie: 0x7a2e1f },
  kessler:  { name: 'Heinrich Kessler', role: 'Gründer und Vorstandsvorsitzender', suit: 0x1f2a3d, shirt: 0xf0ede4, hair: 0xd8d6d0, tie: 0x8c1c1c },
  petra:    { name: 'Petra Lang', role: 'Kollegin, Rechenzentrum', suit: 0xc8692b, shirt: 0xc8692b, hair: 0x2b1d14, tie: null, longHair: true },
  bergmann: { name: 'Ingrid Bergmann', role: 'Personalabteilung', suit: 0x6d4a6b, shirt: 0xe8e0d0, hair: 0x8a6a3c, tie: null, longHair: true },
};

// ---------------------------------------------------------------- Mails
export const MAILS = {
  welcome: {
    from: 'I. Bergmann · Personalabteilung',
    subject: 'Willkommen bei Kessler & Brandt',
    body: (g) => `Guten Tag ${g.s.player.name},

willkommen bei der Kessler & Brandt Rechenwerke AG. Sie beginnen heute als Junior-Sachbearbeiter im Rechenzentrum, Gebäude C, 3. Stock.

Ihre Personalnummer lautet ${g.s.player.pnr}. Ihr Grundgehalt beträgt ${fmtDM(STAGES[0].salary)} brutto im Monat. Ihre Entgeltabrechnung erhalten Sie jeweils zum Monatsende über dieses Terminal (Programm LOHN).

Als Mitarbeiter können Sie KB-Aktien mit 15 % Rabatt erwerben (Programm DEPOT).

Mit freundlichen Grüßen
Ingrid Bergmann
Personalabteilung`,
  },
  hoff_intro: {
    from: 'W. Hoff · Abteilungsleiter',
    subject: 'Ihre Aufgaben',
    body: (g) => `${first(g)},

im Programm AUFG finden Sie die anstehenden Aufträge. Jeder Auftrag hat einen Auftragscode. Tippen Sie ihn ab und bestätigen Sie mit der Eingabetaste, dann gilt der Auftrag als bearbeitet. Wer fehlerfrei hintereinander arbeitet, schafft mehr.

Am Monatsende vergleiche ich Ihre Leistung mit dem Monatsziel:
  ab 150 %  Note A, 25 % Leistungszulage
  ab 100 %  Note B, 10 % Leistungszulage
  ab  70 %  Note C
  darunter  Note D und eine Abmahnung

Im ersten Monat gilt das halbe Ziel. Danach nicht mehr.

Hoff`,
  },
  aktien_tip: {
    from: 'H. Kessler · Vorstand',
    subject: 'Hausmitteilung: Mitarbeiterbeteiligung',
    body: () => `An alle Mitarbeiterinnen und Mitarbeiter,

dieses Haus wurde 1952 in einer Garage in Kassel gegründet. Was wir heute sind, haben Menschen gebaut, nicht Bilanzen.

Deshalb bietet der Vorstand auch in diesem Jahr KB-Aktien zum Mitarbeiterpreis an, 15 % unter dem Börsenkurs. Wer Aktien seines Hauses hält, bekommt im Dezember eine Dividende und hat eine Stimme in der Hauptversammlung.

Ich halte das für eine gute Anlage. Aber entscheiden müssen Sie selbst.

Heinrich Kessler
Vorsitzender des Vorstands`,
  },
  petra_ask: {
    from: 'Petra Lang',
    subject: 'Kleiner Gefallen?',
    body: (g) => `Hallo ${first(g)},

ich ersticke hier in Lochkarten für den Nachtlauf, und Hoff will bis Freitag alles haben. Kannst du mir ein paar Stapel abnehmen? Das kostet dich vielleicht einen halben Nachmittag.

Ich revanchier mich!

Petra
(zwei Tische weiter, die mit der Thermoskanne)`,
    choices: ['Klar, ich helfe dir (−150 Leistung diesen Monat)', 'Tut mir leid, ich habe selbst genug zu tun'],
  },
  petra_thanks: {
    from: 'Petra Lang',
    subject: 'AW: Kleiner Gefallen?',
    body: () => `Du bist meine Rettung! Das vergesse ich dir nicht.

P.`,
  },
  petra_cold: {
    from: 'Petra Lang',
    subject: 'AW: Kleiner Gefallen?',
    body: () => `Schon gut. Ich schaffe das auch allein.

P.`,
  },
  petra_gift: {
    from: 'Petra Lang',
    subject: 'Für deinen Schreibtisch',
    body: (g) => g.s.upgrades.plant
      ? `Ich wollte dir eigentlich einen Ableger von meinem Gummibaum schenken, aber du hast ja schon einen. Dann eben Kaffee: Die nächste Runde aus der Kantine geht auf mich.

Ach, und ich habe Hoff erzählt, wer mir letzten Monat geholfen hat. Er hat genickt. Bei Hoff ist das ein Lob.

Petra`
      : `Ich habe dir einen Ableger von meinem Gummibaum neben den Schreibtisch gestellt. Gießen nicht vergessen!

Ach, und ich habe Hoff erzählt, wer mir letzten Monat geholfen hat. Er hat genickt. Bei Hoff ist das ein Lob.

Petra`,
  },
  hoff_teamgeist: {
    from: 'W. Hoff · Abteilungsleiter',
    subject: 'Teamgeist',
    body: (g) => `${first(g)},

Frau Lang hat ihren Rückstand allein aufgeholt, mit Überstunden. Ich will Ihnen nichts vorschreiben. Aber in diesem Haus ist Teamgeist keine Nebensache.

Hoff`,
  },
  orion_news: {
    from: 'KB-Hausnachrichten',
    subject: 'Orion Datentechnik kündigt Tischrechner OR-80 an',
    body: () => `FRANKFURT. Der Wettbewerber Orion Datentechnik hat auf einer Pressekonferenz den Tischrechner OR-80 vorgestellt. Das Gerät soll auf einen Schreibtisch passen und unter 20.000 DM kosten.

Orion-Chef Dr. Viktor Rau: „Die Zeit der Großrechner in klimatisierten Kellern geht zu Ende.“

Analysten sehen darin eine Kampfansage an das Großrechnergeschäft von KB. Die KB-Aktie gab am Nachmittag deutlich nach.

Vorstandsvorsitzender Kessler sagte auf Nachfrage nur: „Wir beobachten das genau.“`,
  },
  warning: {
    from: 'I. Bergmann · Personalabteilung',
    subject: 'Abmahnung',
    body: (g, v) => `${g.s.player.name},

Ihre Arbeitsleistung im ${v.monthName} lag bei ${fmtPct(v.ratio)} des Monatsziels und damit deutlich unter den Anforderungen Ihrer Stelle.

Wir mahnen Sie hiermit förmlich ab. Dies ist Ihre ${v.count}. Abmahnung. ${v.limitText}

Personalabteilung
i. A. Bergmann`,
  },
  pay_cut: {
    from: 'I. Bergmann · Personalabteilung',
    subject: 'Gehaltskürzung',
    body: (g, v) => `${g.s.player.name},

Ihre Arbeitsleistung im ${v.monthName} lag bei ${fmtPct(v.ratio)} des Monatsziels. Ihr Grundgehalt wurde für diesen Monat um 10 % gekürzt.

Personalabteilung`,
  },
  warning_cleared: {
    from: 'I. Bergmann · Personalabteilung',
    subject: 'Tilgung einer Abmahnung',
    body: (g, v) => `${g.s.player.name},

aufgrund Ihrer guten Leistungen in den vergangenen Monaten wird eine Abmahnung aus Ihrer Personalakte entfernt. Verbleibende Abmahnungen: ${v.count}.

Personalabteilung`,
  },
  dividend: {
    from: 'KB-Mitarbeiterdepot',
    subject: 'Dividendengutschrift',
    body: (g, v) => `Für Ihre ${v.shares} KB-Aktien wurde eine Dividende von ${fmtDM(v.perShare)} je Aktie gutgeschrieben.

Gutschrift: ${fmtDM(v.total)}

KB-Mitarbeiterdepot`,
  },
  promotion_letter: {
    from: 'I. Bergmann · Personalabteilung',
    subject: 'Beförderung zum Sachbearbeiter',
    body: (g) => `${g.s.player.name},

mit Wirkung zum nächsten Monatsersten werden Sie zum Sachbearbeiter im Rechenzentrum befördert.

Ihr neues Grundgehalt beträgt ${fmtDM(STAGES[1].salary)} brutto. Ihr Monatsziel steigt entsprechend.

Herzlichen Glückwunsch.
Ingrid Bergmann`,
  },
};

// ---------------------------------------------------------------- Dialoge
export const DIALOGS = {
  hoff_first: {
    who: 'hoff',
    lines: [
      (g) => `Ah, ${first(g)}. Sie fangen heute an, richtig? Werner Hoff, ich leite das Rechenzentrum.`,
      'Das hier ist Ihr Platz. Das Terminal hängt am Großrechner unten im Keller. Behandeln Sie es gut, eine Stunde Rechenzeit kostet mehr als Ihr Monatsgehalt.',
      'Klicken Sie auf den Bildschirm, dann können Sie arbeiten. Aufträge, Post und Ihre Abrechnungen finden Sie alle dort.',
      'Und noch eins: Hier zählen Ergebnisse. Enttäuschen Sie mich nicht.',
    ],
    choices: ['Verstanden, Herr Hoff.'],
  },
  kessler_future: {
    who: 'kessler',
    lines: [
      'Guten Tag. Nein, bleiben Sie ruhig sitzen. Heinrich Kessler.',
      'Ich gehe gern durchs Haus und rede mit den Leuten, die die eigentliche Arbeit machen. Hoff sagt, Sie sind fleißig.',
      'Ich stelle allen Neuen dieselbe Frage. Orion baut jetzt Rechner, die auf einen Schreibtisch passen. Meine Kollegen im Vorstand lachen darüber.',
      'Was meinen Sie: Wohin geht die Reise?',
    ],
    choices: [
      'Großrechner bleiben das Rückgrat. Der Tischrechner ist eine Spielerei.',
      'In zehn Jahren steht auf jedem Schreibtisch ein eigener Computer.',
    ],
  },
  kessler_future_a: {
    who: 'kessler',
    lines: [
      'Hm. Das sagen sie im Vorstand auch.',
      'Vielleicht haben Sie recht. Vielleicht sind wir aber auch alle ein wenig bequem geworden.',
      'Halten Sie die Augen offen. Und kaufen Sie ein paar Aktien von uns, dann reden Sie eines Tages mit.',
    ],
    choices: ['Auf Wiedersehen, Herr Kessler.'],
  },
  kessler_future_b: {
    who: 'kessler',
    lines: [
      'Das ist eine gefährliche Meinung in diesem Haus.',
      'Mir gefällt sie.',
      'Behalten Sie den Gedanken. Eines Tages brauche ich Leute, die so denken. Und kaufen Sie ein paar Aktien von uns, dann reden Sie mit.',
    ],
    choices: ['Auf Wiedersehen, Herr Kessler.'],
  },
  hoff_promotion: {
    who: 'hoff',
    lines: [
      (g) => `${first(g)}, haben Sie einen Moment?`,
      'Ich habe mir Ihre Zahlen angesehen. Gute Monate, saubere Arbeit, und man hört nur Gutes über Sie.',
      (g) => (g.s.story.flags.loyal_petra ? 'Frau Lang erzählt übrigens jedem, dass Sie ihr damals aus der Patsche geholfen haben.' : null),
      (g) => (g.s.story.flags.vision_pc ? 'Und Kessler hat nach Ihnen gefragt. Persönlich. Das passiert hier nicht oft.' : null),
      'Ab dem Ersten sind Sie Sachbearbeiter. Mehr Gehalt, mehr Verantwortung.',
      'Die Urkunde hängt schon an Ihrer Stellwand. Herzlichen Glückwunsch.',
    ],
    choices: ['Danke, Herr Hoff!'],
  },
};

// ---------------------------------------------------------------- Missionen
const shopUpgradesOwned = (g) => Object.keys(g.s.upgrades).filter((id) => id !== 'urkunde').length;

export const MISSIONS = [
  [
    { id: 'tasks', text: 'Bearbeite 10 Aufträge', prog: (g) => [g.s.player.tasksDone, 10] },
    { id: 'good', text: 'Schaffe 3 Monate mit Note B oder besser', prog: (g) => [g.s.player.goodMonths, 3] },
    { id: 'shares', text: 'Kaufe 10 KB-Mitarbeiteraktien', prog: (g) => [g.s.shares.owned, 10] },
    { id: 'desk', text: 'Richte deinen Platz ein (2 Büro-Upgrades)', prog: (g) => [shopUpgradesOwned(g), 2] },
    { id: 'kessler', text: 'Lerne Heinrich Kessler kennen', prog: (g) => [g.s.story.flags.met_kessler ? 1 : 0, 1] },
  ],
  [],
];

export function missionsDone(g) {
  const list = MISSIONS[g.s.player.stage] || [];
  return list.length > 0 && list.every((m) => { const [a, b] = m.prog(g); return a >= b; });
}

// ---------------------------------------------------------------- Ereignisse
// when(g) wird jede Sekunde geprüft; jedes Ereignis feuert genau einmal.
const t = (g) => g.s.time;
export const EVENTS = [
  { id: 'start', when: () => true,
    run: (g) => { g.mail('welcome'); g.mail('hoff_intro'); g.dialog('hoff_first'); } },
  { id: 'aktien_tip', when: (g) => t(g).totalMonths >= 1 && t(g).monthProgress > 8,
    run: (g) => g.mail('aktien_tip') },
  { id: 'petra_ask', when: (g) => t(g).totalMonths >= 1 && t(g).monthProgress > 25,
    run: (g) => g.mail('petra_ask') },
  { id: 'orion_news', when: (g) => t(g).totalMonths >= 2 && t(g).monthProgress > 12,
    run: (g) => { g.mail('orion_news'); g.shareShock(-0.08); } },
  { id: 'kessler_visit', when: (g) => t(g).totalMonths >= 2 && t(g).monthProgress > 35 && g.s.player.tasksDone >= 8 && g.idle(),
    run: (g) => g.dialog('kessler_future') },
  { id: 'petra_followup',
    when: (g) => g.s.story.flags.petra_answered != null && t(g).totalMonths >= g.s.story.flags.petra_answered + 1 && t(g).monthProgress > 20,
    run: (g) => {
      if (g.s.story.flags.loyal_petra) {
        if (!g.s.upgrades.plant) g.giveUpgrade('plant');
        else g.addRep(1);
        g.mail('petra_gift');
      } else {
        g.addRep(-1);
        g.mail('hoff_teamgeist');
      }
    } },
  { id: 'promotion', when: (g) => g.s.player.stage === 0 && missionsDone(g) && g.idle(),
    run: (g) => g.dialog('hoff_promotion') },
];

// ---------------------------------------------------------------- Reaktionen auf Entscheidungen
export const ON_MAIL_CHOICE = {
  petra_ask: (g, idx) => {
    g.s.story.flags.petra_answered = g.s.time.totalMonths;
    if (idx === 0) {
      g.s.story.flags.loyal_petra = true;
      g.s.player.perf = Math.max(0, g.s.player.perf - 150);
      g.addRep(2);
      g.mail('petra_thanks');
    } else {
      g.s.story.flags.loyal_petra = false;
      g.mail('petra_cold');
    }
  },
};

export const ON_DIALOG_DONE = {
  kessler_future: (g, idx) => {
    g.s.story.flags.met_kessler = true;
    g.s.story.flags.vision_pc = idx === 1;
    g.addRep(1);
    g.dialog(idx === 1 ? 'kessler_future_b' : 'kessler_future_a');
  },
  hoff_promotion: (g) => {
    g.promote();
    g.mail('promotion_letter');
  },
};

export function warningVars(g, ratio, monthIdx) {
  const d = DIFFICULTIES[g.s.difficulty];
  const count = g.s.player.warnings;
  const left = d.warningsLimit - count;
  return {
    ratio, count, monthName: MONTH_NAMES[monthIdx],
    limitText: left <= 0 ? 'Damit ist das Arbeitsverhältnis beendet.'
      : left === 1 ? 'Bei der nächsten Abmahnung wird das Arbeitsverhältnis beendet.'
      : `Nach ${d.warningsLimit} Abmahnungen wird das Arbeitsverhältnis beendet.`,
  };
}
