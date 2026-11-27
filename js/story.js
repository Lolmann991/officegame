// Kapitel 1: Mails, Dialoge, Ereignisse und Missionen.
// Texte dürfen Funktionen sein: (g) => string. Eine Dialogzeile, die null liefert, wird übersprungen.

import { DIFFICULTIES, STAGES, TEAM_BUDGET, DEPT_TEAM_BUDGET, ORION_HOME, fmtDM, fmtPct, fmtInt, MONTH_NAMES } from './data.js';

const first = (g) => g.s.player.name.split(' ')[0];

// ---------------------------------------------------------------- Figuren
export const PEOPLE = {
  hoff:     { name: 'Werner Hoff', role: 'Abteilungsleiter Rechenzentrum', suit: 0x5b5e57, shirt: 0xd9d2bd, hair: 0x4a3524, tie: 0x7a2e1f },
  kessler:  { name: 'Heinrich Kessler', role: 'Gründer und Vorstandsvorsitzender', suit: 0x1f2a3d, shirt: 0xf0ede4, hair: 0xd8d6d0, tie: 0x8c1c1c },
  petra:    { name: 'Petra Lang', role: 'Kollegin, Rechenzentrum', suit: 0xc8692b, shirt: 0xc8692b, hair: 0x2b1d14, tie: null, longHair: true },
  bergmann: { name: 'Ingrid Bergmann', role: 'Personalabteilung', suit: 0x6d4a6b, shirt: 0xe8e0d0, hair: 0x8a6a3c, tie: null, longHair: true },
  brenner:  { name: 'Klaus Brenner', role: 'Personalberater, am Telefon' },
  sauer:    { name: 'Dr. Hartwig Sauer', role: 'Finanzvorstand', suit: 0x26262b, shirt: 0xf2f0ea, hair: 0x4a3a2c, tie: 0x1f3a6a, glasses: true },
  rau:      { name: 'Dr. Viktor Rau', role: 'Vorstandschef von Orion Datentechnik, am Telefon' },
  uwe:      { name: 'Uwe Krämer', role: 'Senior-Entwickler, seit 1961 bei KB', suit: 0x55585a, shirt: 0xd9d2bd, hair: 0xa8a49a, tie: 0x2f3f2a, glasses: true },
};

// ---------------------------------------------------------------- Story-Projekte (Kapitel 2)
export const PROJECTS = {
  archiv: {
    id: 'archiv', name: 'Bandarchiv neu ordnen', short: 'Bandarchiv', sponsor: 'W. Hoff',
    desc: 'Im Keller lagern 4.000 Magnetbänder ohne brauchbares Verzeichnis. Lege eines an, das jeder Operator versteht.',
    need: 900, months: 3, reward: 900, rep: 2,
  },
  fernwartung: {
    id: 'fernwartung', name: 'Fernwartung für Großkunden', short: 'Fernwartung', sponsor: 'Vorstand · Ideenwettbewerb 1980',
    desc: 'Techniker beheben Störungen an Kundenanlagen über die Telefonleitung, ohne hinzufahren. Solide und gut fürs Großrechnergeschäft.',
    need: 1800, months: 4, reward: 1800, rep: 3, exclusive: ['mikro'],
  },
  mikro: {
    id: 'mikro', name: 'Studie: KB-Mikro für den Schreibtisch', short: 'KB-Mikro-Studie', sponsor: 'Vorstand · Ideenwettbewerb 1980',
    desc: 'Kann KB einen eigenen Tischrechner bauen, günstiger als Orions OR-80? Ein Wagnis, denn im Vorstand hat die Idee wenige Freunde.',
    need: 2200, months: 5, reward: 1500, rep: 5, exclusive: ['fernwartung'],
  },
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
  // ---------- Kapitel 2
  c2_hoff_projekt: {
    from: 'W. Hoff · Abteilungsleiter',
    subject: 'Ihr erstes Projekt',
    body: (g) => `${first(g)},

Sie sitzen ab heute am Fenster. Genießen Sie die Aussicht, Sie werden sie brauchen.

Als Sachbearbeiter bekommen Sie zum ersten Mal ein eigenes Projekt: Das Bandarchiv im Keller ist ein Chaos. Sie finden den Auftrag im neuen Programm PROJ.

Wie viel Ihrer Zeit Sie ins Projekt stecken, entscheiden Sie selbst. Aber Ihr Monatsziel bleibt, wo es ist. Wer beides schafft, fällt auf.

Hoff`,
  },
  project_late: {
    from: 'W. Hoff · Abteilungsleiter',
    subject: 'Frist überschritten',
    body: (g, v) => `${first(g)},

die Frist für „${v.name}“ ist abgelaufen. Machen Sie es fertig, aber die volle Prämie ist damit weg. Und ich habe es mir gemerkt.

Hoff`,
  },
  c2_orion_sales: {
    from: 'KB-Hausnachrichten',
    subject: 'OR-80: Orion meldet 4.000 Bestellungen',
    body: () => `FRANKFURT. Der Tischrechner OR-80 verkauft sich besser als erwartet. Orion Datentechnik meldet 4.000 Bestellungen, vor allem von Steuerberatern, Ärzten und mittelständischen Betrieben.

Orion-Chef Dr. Viktor Rau: „Das ist erst der Anfang. In zehn Jahren braucht niemand mehr einen Großrechner, um eine Rechnung zu schreiben.“

Die KB-Aktie verlor erneut. Ein Sprecher von KB verwies auf die volle Auftragslage im Großrechnergeschäft.`,
  },
  c2_wettbewerb: {
    from: 'H. Kessler · Vorstand',
    subject: 'Ideenwettbewerb 1980',
    body: (g) => `An alle Sachbearbeiterinnen und Sachbearbeiter,

der Vorstand ruft den Ideenwettbewerb 1980 aus. Gesucht sind Projekte, die zeigen, wohin KB in den nächsten zehn Jahren gehen soll. Das beste Projekt wird vom Vorstand ausgezeichnet.

Zwei Vorschläge liegen bereits im Programm PROJ bereit. Sie können nur einen davon übernehmen.
${g.s.story.flags.vision_pc ? `
${first(g)}, Sie erinnern sich an unser Gespräch. Ich bin gespannt, wofür Sie sich entscheiden.
` : ''}
Heinrich Kessler`,
  },
  c2_petra_ally: {
    from: 'Petra Lang',
    subject: 'Ich hab was gehört',
    body: (g) => `${first(g)},

ich hab gehört, du machst beim Ideenwettbewerb mit. Ich bin jetzt auch Sachbearbeiterin, und ich hab nicht vergessen, wer mir mit den Lochkarten geholfen hat.

Ich schiebe abends ein paar Stunden für dein Projekt ein. Keine Widerrede.

Petra

(Dein Projekt kommt jetzt 25 % schneller voran.)`,
  },
  c2_petra_rival: {
    from: 'Petra Lang',
    subject: 'Ideenwettbewerb',
    body: () => `Nur damit du es weißt: Ich reiche auch ein Projekt ein. Hoff findet meine Idee gut.

Möge die Bessere gewinnen.

P.`,
  },
  c2_hoff_raise: {
    from: 'W. Hoff · Abteilungsleiter',
    subject: 'Ihr Gehalt',
    body: (g) => `${first(g)},

ich habe Ihr „Angebot“ von Orion nach oben weitergegeben. Sie bekommen ab sofort 12 % mehr Grundgehalt.

Kessler hat unterschrieben. Begeistert war er nicht. Er sagt, er merkt sich, wer bei KB bleibt, weil er es will, und wer, weil er bezahlt wird.

Hoff`,
  },
  c2_wb_result: {
    from: 'KB-Hausnachrichten',
    subject: 'Ideenwettbewerb 1980 entschieden',
    body: (g, v) => v.won
      ? `KASSEL. Der Vorstand hat den Ideenwettbewerb 1980 entschieden. Ausgezeichnet wurde das Projekt „${v.name}“ von ${g.s.player.name} aus dem Rechenzentrum.

Vorstandsvorsitzender Kessler überreichte den Pokal persönlich.`
      : `KASSEL. Der Vorstand hat den Ideenwettbewerb 1980 entschieden. Ausgezeichnet wurde ${g.s.story.flags.petra_rival ? 'das Projekt von Petra Lang aus dem Rechenzentrum' : 'ein Projekt aus der Abteilung Vertrieb'}.

Das Projekt „${v.name}“ von ${g.s.player.name} wurde zu spät eingereicht und konnte nicht berücksichtigt werden.`,
  },
  promotion_teamleiter: {
    from: 'I. Bergmann · Personalabteilung',
    subject: 'Beförderung zum Teamleiter',
    body: (g) => `${g.s.player.name},

mit Wirkung zum nächsten Monatsersten übernehmen Sie als Teamleiter die neue Gruppe Heimcomputer.

Ihr neues Grundgehalt beträgt ${fmtDM(STAGES[2].salary * (1 + (g.s.player.salaryBonus || 0)))} brutto.

Herzlichen Glückwunsch.
Ingrid Bergmann`,
  },
  // ---------- Kapitel 3
  c3_hoff_gruppe: {
    from: 'W. Hoff · Abteilungsleiter',
    subject: 'Ihre Gruppe',
    body: (g) => `${first(g)},

willkommen in der Führungsetage. Na ja, im Eckabteil.

Ihre Gruppe Heimcomputer besteht vorerst aus ${g.s.team.members.map((m) => m.name).join(', ')}. Alles Weitere finden Sie im neuen Programm PERS.

Drei Dinge, die ich in zwanzig Jahren gelernt habe:
1. Ihr Personalbudget beträgt ${fmtDM(g.s.team.budget)} im Monat. Wer darüber liegt, fällt oben auf.
2. Unzufriedene Leute arbeiten schlecht und kündigen irgendwann. Ein Lob kostet nichts.
3. Ab jetzt werden Sie an der Leistung Ihrer Gruppe gemessen, nicht an Ihrer eigenen.

Hoff`,
  },
  c3_auftrag: {
    from: 'H. Kessler · Vorstand',
    subject: 'Produktauftrag HC-1',
    body: (g) => `${first(g)},

wie besprochen: Ihre Gruppe entwickelt den ersten Heimcomputer von KB, den HC-1. Die Ausstattung legen Sie im Programm PROD fest. Mehr Ausstattung heißt mehr Qualität, aber auch mehr Entwicklungsarbeit.

Für die Entwicklung erhöhe ich Ihr Personalbudget um 2.000 DM im Monat.
${g.s.story.flags.wb_choice === 'mikro' ? '\nIhre KB-Mikro-Studie von damals ist die Grundlage. Das spart Ihnen ein gutes Stück Arbeit.\n' : ''}
Enttäuschen Sie mich nicht. Und enttäuschen Sie vor allem den Vorstand nicht, der wartet nur darauf.

Heinrich Kessler`,
  },
  c3_orion_home: {
    from: 'KB-Hausnachrichten',
    subject: `Orion kündigt ${ORION_HOME.name} an`,
    body: () => `FRANKFURT. Orion Datentechnik steigt in den Heimcomputer-Markt ein. Der ${ORION_HOME.name} soll zum Weihnachtsgeschäft für ${fmtDM(ORION_HOME.price)} in den Kaufhäusern stehen, mit 64 KB Speicher und Farbgrafik.

Dr. Viktor Rau: „KB baut Computer für Rechenzentren. Wir bauen Computer für Menschen.“

In Kassel heißt es, die eigene Entwicklung laufe nach Plan.`,
  },
  c3_hc1_ready: {
    from: 'H. Kessler · Vorstand',
    subject: 'HC-1 ist fertig',
    body: (g) => `${first(g)},

der HC-1 ist fertig. Qualitätsnote der Prüfabteilung: ${g.s.product.quality} von 10.

Jetzt fehlt nur noch der Preis. Legen Sie ihn im Programm PROD fest. Billig verkauft sich gut, teuer bringt mehr pro Gerät. Und denken Sie an Orion.

Kessler`,
  },
  c3_market_report: {
    from: 'KB-Hausnachrichten',
    subject: 'HC-1: Der erste Monat im Handel',
    body: (g) => {
      const h = g.s.product.history.at(-1);
      return `KASSEL. Der KB HC-1 hat im ersten Monat ${fmtInt(h.units)} Käufer gefunden. Orion verkaufte im selben Zeitraum ${fmtInt(h.orion)} Geräte des ${ORION_HOME.name}.

${h.units > h.orion ? 'In den Kaufhäusern ist der HC-1 das Gerät, nach dem gefragt wird. Ein Verkäufer in Hannover: „Die Leute wollen den Computer von KB. Den kennen sie aus der Bank.“' : 'Händler berichten von Zurückhaltung. Ein Verkäufer in Hannover: „Für das Geld nehmen die Leute lieber den Orion.“'}

Der Kurs der KB-Aktie reagierte ${h.units > h.orion ? 'freundlich' : 'verhalten'}.`;
    },
  },
  team_quit: {
    from: 'I. Bergmann · Personalabteilung',
    subject: 'Kündigung',
    body: (g, v) => `${g.s.player.name},

${v.name} hat heute gekündigt. Als Grund wurde „Unzufriedenheit mit der Arbeitssituation“ angegeben.

Im Programm PERS finden Sie neue Bewerbungen.

Personalabteilung`,
  },
  team_budget: {
    from: 'W. Hoff · Abteilungsleiter',
    subject: 'Personalbudget überschritten',
    body: (g, v) => `${first(g)},

Ihre Gruppe kostet ${fmtDM(v.payroll)} im Monat, Ihr Budget liegt bei ${fmtDM(v.budget)}. Das sieht die Controlling-Abteilung jeden Monat, und dann sehe ich es auch.

Hoff`,
  },
  c3_poach: {
    from: (g) => g.s.story.flags.poach_name,
    subject: 'Orion hat mich angerufen',
    body: (g) => `Hallo ${first(g)},

ich will offen sein: Orion hat mir ein Angebot gemacht. 25 % mehr Gehalt, Arbeit am ${ORION_HOME.name}.

Ich arbeite gern in deiner Gruppe. Aber das Geld ist das Geld.

${g.s.story.flags.poach_name}`,
    choices: ['Gegenangebot: 20 % mehr Gehalt aus dem Gruppenbudget', 'Ich halte dich nicht auf. Viel Glück.'],
  },
  promotion_abteilung: {
    from: 'I. Bergmann · Personalabteilung',
    subject: 'Ernennung zum Abteilungsleiter',
    body: (g) => `${g.s.player.name},

der Vorstand hat Sie mit Wirkung zum nächsten Monatsersten zum Leiter der neuen Abteilung PC-Sparte ernannt.

Ihr neues Grundgehalt beträgt ${fmtDM(STAGES[3].salary * (1 + (g.s.player.salaryBonus || 0)))} brutto.

Herzlichen Glückwunsch.
Ingrid Bergmann`,
  },
  // ---------- Kapitel 4
  c4_sparte: {
    from: 'H. Kessler · Vorstand',
    subject: 'Die PC-Sparte',
    body: (g) => `${first(g)},

willkommen in Ihrem eigenen Büro. Die Tür dürfen Sie schließen, ich tue es nie.

Die PC-Sparte hat drei mögliche Produktlinien: Heimcomputer (dort läuft der HC-1 weiter), Bürocomputer und Tragbare. Für die beiden neuen fehlt uns noch die Technik. Die Forschung steuern Sie im Programm F&E, das Budget geht von Ihrem Ergebnis ab.

Ihr Personalbudget steigt auf ${fmtDM(DEPT_TEAM_BUDGET)}. Holen Sie sich gute Leute.

Und noch etwas: Der Vorstand hat einen neuen Finanzvorstand, Dr. Sauer. Er wird sich bei Ihnen melden.

Heinrich Kessler`,
  },
  c4_standard: {
    from: 'H. Kessler · Vorstand',
    subject: 'Welcher Standard für den KB PC?',
    body: (g) => `${first(g)},

bevor Sie einen Bürocomputer bauen, müssen wir eine Grundsatzfrage klären. Überall tauchen PCs auf, die zum Industriestandard kompatibel sind. Jede Software läuft darauf.

Bauen wir kompatibel, ist der Markt fast doppelt so groß. Aber dann sind wir einer unter vielen, und die Marge ist dünn.

Bauen wir einen eigenen KB-Standard, verdienen wir mehr pro Gerät. Aber die Kunden müssen uns vertrauen, dass es dafür Software gibt.

Sie entscheiden. Ich trage es im Vorstand mit.

Kessler`,
    choices: ['Kompatibel zum Industriestandard (großer Markt, kleine Marge)', 'Eigener KB-Standard (kleiner Markt, große Marge)'],
  },
  tech_done: {
    from: 'F&E-Labor',
    subject: 'Forschung abgeschlossen',
    body: (g, v) => `Das Labor meldet: „${v.name}“ ist einsatzbereit.

${v.desc}

Neue Modelle profitieren davon automatisch. Bereits verkaufte Modelle nicht.

F&E-Labor, Gebäude D`,
  },
  model_ready: {
    from: 'Produktentwicklung',
    subject: 'Neues Modell fertig',
    body: (g, v) => `Der ${v.name} ist fertig entwickelt. Qualitätsnote der Prüfabteilung: ${v.q} von 10.

Legen Sie im Programm PROD den Preis fest, dann geht das Gerät in den Handel. Das alte Modell der Linie wird dabei ersetzt.

Produktentwicklung`,
  },
  promotion_bereich: {
    from: 'I. Bergmann · Personalabteilung',
    subject: 'Ernennung zum Bereichsleiter',
    body: (g) => `${g.s.player.name},

der Vorstand hat Sie mit Wirkung zum nächsten Monatsersten zum Leiter des Geschäftsbereichs Netz ernannt.

Ihr neues Grundgehalt beträgt ${fmtDM(STAGES[4].salary * (1 + (g.s.player.salaryBonus || 0)))} brutto.

Herzlichen Glückwunsch.
Ingrid Bergmann

PS: Herr Kessler hat persönlich unterschrieben. Mit Füller.`,
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
  brenner_call: {
    who: 'brenner', phone: true,
    lines: [
      (g) => `${g.s.player.name}? Brenner hier, Klaus Brenner. Ich bin Personalberater. Haben Sie eine Minute?`,
      'Ich rufe im Auftrag eines Unternehmens aus Frankfurt an. Den Namen kennen Sie aus der Zeitung.',
      'Man hat dort von Ihnen gehört. Junge Leute, die Großrechner verstehen und trotzdem nach vorn schauen, sind gerade sehr gefragt.',
      'Ich will nicht drumherum reden: Man würde Ihnen deutlich mehr zahlen als KB.',
    ],
    choices: ['Kein Interesse. Ich bleibe bei KB.', 'Ich höre mir das Angebot an.'],
  },
  brenner_offer: {
    who: 'brenner', phone: true,
    lines: [
      'Sehr vernünftig. Also: 40 % mehr Gehalt, ein eigenes Büro in Frankfurt und ein Dienstwagen.',
      'Orion baut die Zukunft, KB verwaltet die Vergangenheit. So sieht man das zumindest in Frankfurt.',
      'Denken Sie in Ruhe nach. Aber nicht zu lange.',
    ],
    choices: ['Danke, aber nein.', 'Ich lege das Angebot Herrn Hoff vor.'],
  },
  kessler_wb: {
    who: 'kessler',
    lines: [
      (g) => (g.s.story.flags.wb_late ? 'Ich habe Ihr Projekt gelesen. Zu spät, leider. Der Vorstand wartet nicht.' : 'Ich habe Ihr Projekt gelesen. Zweimal.'),
      (g) => (g.s.story.flags.wb_choice === 'mikro'
        ? 'Ein Tischrechner von KB, für weniger Geld als der OR-80. Die Herren im Vorstand haben gehustet, als ich es vorgelesen habe.'
        : 'Fernwartung für unsere Großkunden. Solide Arbeit. Die Herren im Vorstand waren sehr zufrieden.'),
      (g) => (g.s.story.flags.wb_choice === 'mikro'
        ? (g.s.story.flags.vision_pc ? 'Sie haben Wort gehalten. Das hat damals nicht jeder getan, der mir so etwas erzählt hat.' : 'Interessant. Damals haben Sie mir gesagt, der Tischrechner sei eine Spielerei. Sie lernen dazu. Das gefällt mir.')
        : (g.s.story.flags.vision_pc ? 'Damals haben Sie von einem Computer auf jedem Schreibtisch gesprochen. Heute bauen Sie Fernwartung für Großrechner. Auch das ist eine Antwort.' : 'Sie bleiben sich treu. Das ist nicht das Schlechteste.')),
      (g) => (g.s.story.flags.wb_late ? null : 'Der Pokal steht ab morgen auf Ihrem Schreibtisch. Und ich werde mir Ihren Namen merken.'),
      (g) => (g.s.story.flags.negotiated ? 'Ach, und noch etwas: Ich weiß von Frankfurt. Ich hoffe, Sie sind hier, weil Sie hier sein wollen.' : null),
    ],
    choices: ['Danke, Herr Kessler.'],
  },
  hoff_teamleiter: {
    who: 'hoff',
    lines: [
      (g) => `${first(g)}, kommen Sie mal mit ans Fenster. Nein, bleiben Sie sitzen, Ihr Fenster reicht.`,
      'Der Vorstand gründet eine Gruppe für Heimcomputer. Vier Leute, kleines Budget, große Erwartungen.',
      (g) => (g.s.story.flags.wb_choice === 'mikro' ? 'Kessler wollte Sie dafür haben. Wegen Ihrer Studie. Ich sage es Ihnen ehrlich, ich hätte jemand Älteres genommen.' : 'Kessler wollte Sie dafür haben. Ich hätte jemand Älteres genommen, aber Ihre Zahlen sprechen für Sie.'),
      'Ab dem Ersten leiten Sie die Gruppe. Machen Sie mir keine Schande.',
    ],
    choices: ['Ich werde Sie nicht enttäuschen.'],
  },
  kessler_hc: {
    who: 'kessler',
    lines: [
      'Ein Eckabteil mit Glaswand. Steht Ihnen.',
      'Ich komme gerade aus der Vorstandssitzung. Wir bauen einen Heimcomputer. Der Beschluss war knapp, sehr knapp.',
      (g) => (g.s.story.flags.wb_choice === 'mikro' ? 'Ohne Ihre Studie von damals hätte ich keine Mehrheit bekommen. Jetzt müssen Sie liefern.' : 'Ich hätte gern eine Studie gehabt, auf die ich mich stützen kann. Jetzt müssen wir ohne auskommen.'),
      'Ihre Gruppe macht die Entwicklung. Was der HC-1 können soll, entscheiden Sie. Aber Sie tragen auch die Verantwortung.',
    ],
    choices: ['Wir fangen sofort an.'],
  },
  uwe_conflict: {
    who: 'uwe',
    lines: [
      'Chef, haben Sie fünf Minuten? Ich mach es kurz.',
      'Ich baue seit 1961 Rechner für dieses Haus. Richtige Rechner. Und jetzt soll ich ein Spielzeug für Kinderzimmer bauen?',
      'Ich sage Ihnen, was ich mitmache: Wenn das Ding wenigstens an unsere Großrechner angeschlossen werden kann, dann verkaufen wir es auch an Firmen. Das kostet aber Zeit.',
    ],
    choices: ['Wir bauen einen Heimcomputer. Punkt.', 'Einverstanden, wir bauen die Großrechner-Schnittstelle ein.'],
  },
  kessler_abteilung: {
    who: 'kessler',
    lines: [
      (g) => `Der HC-1 hat ${fmtInt(g.s.product.units)} Käufer gefunden. Ich habe die Zahl im Vorstand dreimal vorgelesen. Beim dritten Mal hat keiner mehr gelacht.`,
      'Wir gründen eine eigene PC-Sparte. Und jemand muss sie leiten.',
      'Hoff hat Sie vorgeschlagen. Das hat mich überrascht. Hoff schlägt nie jemanden vor.',
      'Ab dem Ersten sind Sie Abteilungsleiter. Sie bekommen ein eigenes Büro. Mit Tür.',
    ],
    choices: ['Ich nehme an.'],
  },
  sauer_intro: {
    who: 'sauer',
    lines: [
      'Sauer, Finanzen. Ich bin seit Januar im Vorstand. Sie haben sicher schon von mir gehört.',
      'Ich will offen sein: Ich halte die PC-Sparte für ein teures Hobby von Herrn Kessler.',
      'Ich messe Sie an einer einzigen Zahl, dem Abteilungsergebnis. Sie finden es im Programm ABT. Ich finde es jeden Monat auf meinem Schreibtisch.',
      'Drei Monate in Folge im Plus, dann reden wir weiter.',
    ],
    choices: ['Sie bekommen Ihre Zahlen.', 'Ohne Forschung gibt es in drei Jahren keine Zahlen mehr.'],
  },
  rau_call: {
    who: 'rau', phone: true,
    lines: [
      (g) => `${g.s.player.name}? Rau hier. Viktor Rau, Orion. Wir kennen uns nur aus der Zeitung, das sollten wir ändern.`,
      'Ihr KB PC ist nicht schlecht. Ehrlich gesagt, zu gut für meinen Geschmack.',
      'Ich mache Ihnen einen Vorschlag unter Ehrenleuten: Keiner von uns senkt die Preise. Der Markt ist groß genug für zwei.',
      'Oder wir machen es auf die harte Tour. Dann senke ich meine Preise, bis es Ihnen wehtut.',
    ],
    choices: ['Dann sehen wir uns im Laden, Herr Rau.', 'Ich höre zu. Bleiben wir bei unseren Preisen.'],
  },
  kessler_tired: {
    who: 'kessler',
    lines: [
      'Darf ich mich kurz setzen? Die Treppen werden nicht kürzer.',
      'Ich werde nächstes Jahr siebzig. Der Aufsichtsrat fragt, wer nach mir kommt.',
      'Sauer will den Posten. Er ist ein guter Rechner. Aber er würde dieses Haus verkaufen, Stück für Stück, wenn die Zahlen es sagen.',
      'Ich sage Ihnen das nicht ohne Grund. Machen Sie weiter so.',
    ],
    choices: ['Ich verstehe, Herr Kessler.'],
  },
  kessler_bereich: {
    who: 'kessler',
    lines: [
      'Die PC-Sparte schreibt schwarze Zahlen. Sogar Sauer hat genickt, und Sauer nickt nie.',
      'Aber die nächste große Sache sind nicht einzelne Computer. Es sind Computer, die miteinander reden. Netze.',
      'Ich gründe einen Geschäftsbereich Netz. Und Sie leiten ihn. Bereichsleiter, mit allem Drum und Dran.',
    ],
    choices: ['Ich übernehme.'],
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
  [
    { id: 'archiv', text: 'Schließe das Projekt „Bandarchiv neu ordnen“ ab', prog: (g) => [g.s.story.flags.archiv_done ? 1 : 0, 1] },
    { id: 'wb', text: 'Schließe ein Projekt für den Ideenwettbewerb ab', prog: (g) => [g.s.story.flags.wb_done ? 1 : 0, 1] },
    { id: 'orion', text: 'Entscheide über das Angebot aus Frankfurt', prog: (g) => [g.s.story.flags.orion_decided ? 1 : 0, 1] },
    { id: 'good', text: 'Schaffe 4 Monate mit Note B oder besser', prog: (g) => [g.s.player.goodMonths, 4] },
    { id: 'shares', text: 'Besitze 40 KB-Aktien', prog: (g) => [g.s.shares.owned, 40] },
  ],
  [
    { id: 'team', text: 'Baue deine Gruppe auf 5 Leute aus', prog: (g) => [g.s.team.members.length, 5] },
    { id: 'moral', text: 'Halte die Team-Moral 3 Monate bei 60 % oder mehr', prog: (g) => [g.s.team.moraleMonths, 3] },
    { id: 'hc1', text: 'Entwickle den KB-Heimcomputer HC-1', prog: (g) => [['launch', 'market'].includes(g.s.product.stage) ? 1 : 0, 1] },
    { id: 'units', text: 'Verkaufe 15.000 HC-1', prog: (g) => [g.s.product.units, 15000] },
    { id: 'good', text: 'Schaffe 3 Monate mit Note B oder besser', prog: (g) => [g.s.player.goodMonths, 3] },
  ],
  [
    { id: 'techs', text: 'Erforsche 5 Technologien', prog: (g) => [g.s.rd.done.length, 5] },
    { id: 'pc', text: 'Bringe den KB PC auf den Markt', prog: (g) => [g.s.lines.pc.model ? 1 : 0, 1] },
    { id: 'team', text: 'Baue die Abteilung auf 8 Leute aus', prog: (g) => [g.s.team.members.length, 8] },
    { id: 'streak', text: 'Schreibe 3 Monate in Folge schwarze Zahlen', prog: (g) => [g.s.dept.maxStreak || 0, 3] },
    { id: 'best', text: 'Erreiche 3 Mio. DM Abteilungsergebnis in einem Monat', prog: (g) => [Math.max(0, g.s.dept.best), 3000000] },
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

  // ---------- Kapitel 2
  { id: 'c2_start', when: (g) => g.s.player.stage >= 1,
    run: (g) => {
      g.s.story.flags.c2_month = t(g).totalMonths;
      g.mail('c2_hoff_projekt');
      g.offerProject(PROJECTS.archiv);
      if (!g.s.story.flags.seen_ch2) { g.s.story.flags.seen_ch2 = true; g.emit('chapter', 2); }
    } },
  { id: 'c2_orion_sales', when: (g) => g.s.player.stage >= 1 && t(g).totalMonths >= g.s.story.flags.c2_month + 1 && t(g).monthProgress > 20,
    run: (g) => { g.mail('c2_orion_sales'); g.shareShock(-0.06); } },
  { id: 'c2_wettbewerb', when: (g) => g.s.story.flags.archiv_done && t(g).monthProgress > 5 && g.idle(),
    run: (g) => {
      g.s.story.flags.wb_month = t(g).totalMonths;
      g.mail('c2_wettbewerb');
      g.offerProject(PROJECTS.fernwartung);
      g.offerProject(PROJECTS.mikro);
    } },
  { id: 'c2_petra', when: (g) => ['fernwartung', 'mikro'].includes(g.s.projects.active?.id) && t(g).monthProgress > 15,
    run: (g) => {
      if (g.s.story.flags.loyal_petra) { g.boostProject(0.25); g.mail('c2_petra_ally'); }
      else { g.s.story.flags.petra_rival = true; g.mail('c2_petra_rival'); }
    } },
  { id: 'c2_headhunter', when: (g) => g.s.player.stage === 1 && t(g).totalMonths >= g.s.story.flags.c2_month + 2 && t(g).monthProgress > 30 && g.idle(),
    run: (g) => g.dialog('brenner_call') },
  { id: 'promotion2', when: (g) => g.s.player.stage === 1 && missionsDone(g) && g.idle(),
    run: (g) => g.dialog('hoff_teamleiter') },

  // ---------- Kapitel 3
  { id: 'c3_start', when: (g) => g.s.player.stage >= 2,
    run: (g) => {
      const f = g.s.story.flags, tm = g.s.team;
      f.c3_month = t(g).totalMonths;
      tm.budget = TEAM_BUDGET;
      if (!tm.members.length) {
        tm.members.push(f.loyal_petra
          ? g.makeMember({ name: 'Petra Lang', skill: 4, trait: 'loyal', salary: 3300, morale: 75, look: { suit: 0xc8692b, shirt: 0xc8692b, hair: 0x2b1d14, longHair: true, skin: 0 } })
          : g.makeMember({ name: 'Monika Weber', skill: 3, trait: 'fleissig', salary: 2900, longHair: true }));
        tm.members.push(g.makeMember({ name: 'Uwe Krämer', skill: 4, trait: 'eigensinnig', salary: 3900, morale: 55, look: { suit: 0x55585a, shirt: 0xd9d2bd, hair: 0xa8a49a, longHair: false, skin: 0 } }));
        tm.members.push(g.makeMember({ name: 'Bernd Kowalski', skill: 2, trait: 'kreativ', salary: 2200, morale: 70, longHair: false }));
        tm.members.forEach((m) => { m.since = t(g).totalMonths; });
        f.uwe_id = tm.members[1].id;
      }
      g.refreshCandidates();
      g.mail('c3_hoff_gruppe');
      g.emit('team');
      if (!f.seen_ch3) { f.seen_ch3 = true; g.emit('chapter', 3); }
    } },
  { id: 'c3_kessler', when: (g) => g.s.player.stage >= 2 && t(g).totalMonths >= g.s.story.flags.c3_month + 1 && t(g).monthProgress > 10 && g.idle(),
    run: (g) => g.dialog('kessler_hc') },
  { id: 'c3_orion_home', when: (g) => g.s.product.stage === 'dev' && t(g).monthProgress > 25,
    run: (g) => { g.s.story.flags.orion_home = true; g.mail('c3_orion_home'); g.shareShock(-0.04); } },
  { id: 'c3_uwe',
    when: (g) => { const a = g.s.projects.active; return a?.id === 'hc1' && a.pp / a.need > 0.3 && g.member(g.s.story.flags.uwe_id) && g.idle(); },
    run: (g) => g.dialog('uwe_conflict') },
  { id: 'c3_poach',
    when: (g) => g.s.player.stage === 2 && t(g).totalMonths >= g.s.story.flags.c3_month + 3 && t(g).monthProgress > 35
      && g.s.team.members.some((m) => m.trait !== 'loyal'),
    run: (g) => {
      const best = g.s.team.members.filter((m) => m.trait !== 'loyal').sort((a, b) => b.skill - a.skill)[0];
      g.s.story.flags.poach_id = best.id;
      g.s.story.flags.poach_name = best.name;
      g.mail('c3_poach');
    } },
  { id: 'c3_market_report', when: (g) => g.s.product.stage === 'market' && g.s.product.months >= 1,
    run: (g) => { g.mail('c3_market_report'); const h = g.s.product.history.at(-1); g.addRep(h.units > h.orion ? 2 : 0); } },
  { id: 'promotion3', when: (g) => g.s.player.stage === 2 && missionsDone(g) && g.idle(),
    run: (g) => g.dialog('kessler_abteilung') },

  // ---------- Kapitel 4
  { id: 'c4_start', when: (g) => g.s.player.stage >= 3,
    run: (g) => {
      const f = g.s.story.flags, tm = t(g);
      if (tm.year < 1987) { tm.year = 1987; tm.month = 0; tm.monthProgress = 0; } // Zeitsprung
      f.c4_month = tm.totalMonths;
      const pd = g.s.product, home = g.s.lines.home;
      if (!home.model && pd.stage === 'market') {
        home.model = { name: 'HC-1', q: pd.quality || 5, price: pd.price, months: 12 };
        home.gen = 1; home.units = pd.units; home.revenue = pd.revenue;
      }
      pd.stage = 'retired';
      g.s.team.budget = DEPT_TEAM_BUDGET;
      g.mail('c4_sparte');
      g.emit('era');
      g.emit('product');
      if (!f.seen_ch4) { f.seen_ch4 = true; g.emit('chapter', 4); }
    } },
  { id: 'c4_standard', when: (g) => g.s.player.stage >= 3 && t(g).monthProgress > 15,
    run: (g) => g.mail('c4_standard') },
  { id: 'c4_sauer', when: (g) => g.s.player.stage >= 3 && t(g).totalMonths >= g.s.story.flags.c4_month + 1 && t(g).monthProgress > 20 && g.idle(),
    run: (g) => g.dialog('sauer_intro') },
  { id: 'c4_rau', when: (g) => g.s.lines.pc.model && t(g).monthProgress > 30 && g.idle(),
    run: (g) => g.dialog('rau_call') },
  { id: 'c4_poach',
    when: (g) => g.s.player.stage >= 3 && t(g).totalMonths >= g.s.story.flags.c4_month + 3 && t(g).monthProgress > 40
      && g.s.team.members.some((m) => m.trait !== 'loyal'),
    run: (g) => {
      const best = g.s.team.members.filter((m) => m.trait !== 'loyal').sort((a, b) => b.skill - a.skill)[0];
      g.s.story.flags.poach_id = best.id;
      g.s.story.flags.poach_name = best.name;
      g.mail('c3_poach');
    } },
  { id: 'c4_kessler', when: (g) => g.s.player.stage >= 3 && g.s.rd.done.length >= 3 && t(g).monthProgress > 10 && g.idle(),
    run: (g) => g.dialog('kessler_tired') },
  { id: 'promotion4', when: (g) => g.s.player.stage === 3 && missionsDone(g) && g.idle(),
    run: (g) => g.dialog('kessler_bereich') },
];

// ---------------------------------------------------------------- Reaktionen auf Entscheidungen
export const ON_MAIL_CHOICE = {
  c4_standard: (g, idx) => {
    g.s.story.flags.pc_compat = idx === 0;
    g.s.story.flags.pc_own = idx === 1;
    g.emit('product');
  },
  c3_poach: (g, idx) => {
    const m = g.member(g.s.story.flags.poach_id);
    if (!m) return;
    if (idx === 0) {
      m.salary = Math.round((m.salary * 1.2) / 10) * 10;
      g.changeMorale(m, 12);
      g.s.story.flags.poach_kept = true;
    } else {
      g.s.team.members = g.s.team.members.filter((x) => x.id !== m.id);
      g.s.team.members.forEach((x) => g.changeMorale(x, -5));
      g.s.story.flags.poach_lost = true;
    }
    g.emit('team');
  },
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

export const ON_PROJECT_DONE = {
  hc1: (g) => {
    g.s.product.stage = 'launch';
    g.s.product.quality = g.productQuality();
    g.mail('c3_hc1_ready');
    g.emit('product');
  },
  archiv: (g) => { g.s.story.flags.archiv_done = true; },
  fernwartung: (g, late) => wettbewerbDone(g, 'fernwartung', late),
  mikro: (g, late) => wettbewerbDone(g, 'mikro', late),
};

function wettbewerbDone(g, choice, late) {
  const f = g.s.story.flags;
  f.wb_done = true;
  f.wb_choice = choice;
  f.wb_late = late;
  if (!late) g.giveUpgrade('pokal');
  if (choice === 'fernwartung') g.shareShock(0.04);
  g.mail('c2_wb_result', { won: !late, name: PROJECTS[choice].name });
  g.dialog('kessler_wb');
  // ab jetzt gibt es laufend neue Projekte
  f.procedural = true;
  if (g.s.projects.offered.length === 0) g.generateProjects();
}

export const ON_DIALOG_DONE = {
  brenner_call: (g, idx) => {
    if (idx === 0) { g.s.story.flags.orion_decided = true; g.s.story.flags.loyal_kb = true; g.addRep(2); }
    else g.dialog('brenner_offer');
  },
  brenner_offer: (g, idx) => {
    g.s.story.flags.orion_decided = true;
    if (idx === 0) { g.s.story.flags.loyal_kb = true; g.addRep(1); }
    else {
      g.s.story.flags.negotiated = true;
      g.s.player.salaryBonus = (g.s.player.salaryBonus || 0) + 0.12;
      g.addRep(-2);
      g.mail('c2_hoff_raise');
    }
  },
  kessler_hc: (g) => {
    g.s.product.stage = 'spec';
    g.s.team.budget += 2000;
    g.mail('c3_auftrag');
    g.emit('product');
  },
  uwe_conflict: (g, idx) => {
    const uwe = g.member(g.s.story.flags.uwe_id);
    if (idx === 0) {
      if (uwe) g.changeMorale(uwe, -25);
      g.s.team.members.forEach((m) => { if (m !== uwe) g.changeMorale(m, 5); });
      g.s.story.flags.uwe_overruled = true;
    } else {
      if (uwe) g.changeMorale(uwe, 20);
      g.s.story.flags.uwe_compromise = true;
      const a = g.s.projects.active;
      if (a?.id === 'hc1') a.need = Math.round(a.need * 1.1);
    }
    g.emit('team');
  },
  sauer_intro: (g, idx) => {
    if (idx === 0) g.s.story.flags.sauer_ally = true;
    else { g.s.story.flags.sauer_conflict = true; g.addRep(1); }
  },
  rau_call: (g, idx) => {
    if (idx === 0) { g.s.story.flags.price_war = true; g.addRep(2); }
    else { g.s.story.flags.rau_deal = true; }
    g.emit('product');
  },
  kessler_tired: (g) => { g.s.story.flags.succession_hint = true; },
  kessler_bereich: (g) => {
    g.promote();
    g.mail('promotion_bereich');
  },
  kessler_abteilung: (g) => {
    g.promote();
    g.mail('promotion_abteilung');
  },
  hoff_teamleiter: (g) => {
    g.promote();
    g.mail('promotion_teamleiter');
  },
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
