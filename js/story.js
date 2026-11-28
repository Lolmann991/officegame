// Kapitel 1: Mails, Dialoge, Ereignisse und Missionen.
// Texte dürfen Funktionen sein: (g) => string. Eine Dialogzeile, die null liefert, wird übersprungen.

import { DIFFICULTIES, STAGES, TEAM_BUDGET, DEPT_TEAM_BUDGET, ORION_HOME, fmtDM, fmtPct, fmtInt, MONTH_NAMES } from './data.js';

const first = (g) => g.s.player.name.split(' ')[0];
const mp = (g) => g.s.time.monthProgress / g.monthSeconds(); // Anteil des laufenden Monats

// ---------------------------------------------------------------- Figuren
export const PEOPLE = {
  hoff:     { name: 'Werner Hoff', role: 'Abteilungsleiter Rechenzentrum', suit: 0x5b5e57, shirt: 0xd9d2bd, hair: 0x4a3524, tie: 0x7a2e1f },
  kessler:  { name: 'Heinrich Kessler', role: 'Gründer und Vorstandsvorsitzender', suit: 0x1f2a3d, shirt: 0xf0ede4, hair: 0xd8d6d0, tie: 0x8c1c1c },
  petra:    { name: 'Petra Lang', role: 'Kollegin, Rechenzentrum', suit: 0xc8692b, shirt: 0xc8692b, hair: 0x2b1d14, tie: null, longHair: true },
  bergmann: { name: 'Ingrid Bergmann', role: 'Personalabteilung', suit: 0x6d4a6b, shirt: 0xe8e0d0, hair: 0x8a6a3c, tie: null, longHair: true },
  brenner:  { name: 'Klaus Brenner', role: 'Personalberater, am Telefon' },
  sauer:    { name: 'Dr. Hartwig Sauer', role: (g) => (g.s.player.stage >= 5 ? 'Vorstand Strategie' : 'Finanzvorstand'), suit: 0x26262b, shirt: 0xf2f0ea, hair: 0x4a3a2c, tie: 0x1f3a6a, glasses: true },
  rau:      { name: 'Dr. Viktor Rau', role: 'Vorstandschef von Orion Datentechnik, am Telefon' },
  hayashi:  { name: 'Kenji Hayashi', role: 'Vorstandschef von Hayashi Denki, Osaka, am Telefon' },
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
  // ---------- Kapitel 5
  c5_bereich: {
    from: 'H. Kessler · Vorstand',
    subject: 'Geschäftsbereich Netz',
    body: (g) => `${first(g)},

sechs Jahre PC-Sparte, und Sie haben aus einem Hobby ein Geschäft gemacht. Ihr neues Büro hat eine Sitzecke. Benutzen Sie sie, um Leute zu überzeugen, nicht um auszuruhen.

Ihre Produktlinien behalten Sie. Neu ist der Bereich Netz: In Amerika wählen sich die Leute schon zu Hunderttausenden mit dem Modem in Onlinedienste ein. Bei uns gibt es bisher nur PostNet, und die sind langsam und teuer.

Ich komme die Tage vorbei. Dann reden wir über Geld.

Kessler`,
  },
  c5_sauer_memo: {
    from: 'Dr. H. Sauer · Finanzvorstand',
    subject: 'Aktennotiz: KB-Net',
    body: (g) => `${g.s.player.name},

zur Kenntnis: Ich halte KB-Net für einen Irrweg. ${g.s.story.flags.net_all ? '20 Millionen DM für Modems in Kellerräumen sind kein Investment, sondern eine Wette.' : 'Auch 8 Millionen DM sind viel Geld für ein Experiment.'}

Ich werde das Thema in der nächsten Vorstandssitzung zur Abstimmung stellen. Bereiten Sie sich vor.

Dr. Hartwig Sauer`,
  },
  c5_kartell: {
    from: 'Dr. M. Lindner · Rechtsabteilung',
    subject: 'Vertraulich: Bundeskartellamt bei Orion',
    body: (g) => `${g.s.player.name},

das Bundeskartellamt hat gestern die Büros von Orion in Frankfurt durchsucht. Es geht um Preisabsprachen im PC-Geschäft. In beschlagnahmten Notizen von Dr. Rau taucht Ihr Name auf, mit Datum eines Telefonats.

Wir müssen uns jetzt entscheiden. Kooperieren wir, wird KB eine Geldbuße zahlen, aber wir behalten unsere Glaubwürdigkeit. Bestreiten wir alles, steht Aussage gegen Aussage. Vorerst.

Ich brauche Ihre Entscheidung.

Dr. Marion Lindner
Leiterin Rechtsabteilung`,
    choices: ['Alles offenlegen und mit dem Kartellamt kooperieren', 'Es gab keine Absprache.'],
  },
  c5_kartell_result: {
    from: 'KB-Hausnachrichten',
    subject: 'Kartellverfahren: KB zahlt Geldbuße',
    body: () => `KASSEL. Die Kessler & Brandt Rechenwerke AG hat im Kartellverfahren gegen Orion Datentechnik umfassend kooperiert und zahlt eine Geldbuße von 25 Millionen DM. Gegen Orion wurde eine deutlich höhere Buße verhängt.

Vorstandsvorsitzender Kessler: „Wir haben einen Fehler gemacht und stehen dazu.“`,
  },
  c5_boom: {
    from: 'KB-Hausnachrichten',
    subject: 'KB-Net knackt die 10.000',
    body: (g) => `KASSEL. Der Onlinedienst KB-Net hat seinen zehntausendsten Kunden begrüßt. Über ${g.s.net.nodes.length} Einwahlknoten wählen sich die Nutzer per Modem ein, um E-Mails zu schreiben, Nachrichten zu lesen und in Foren zu diskutieren.

Ein Nutzer aus Hannover: „Ich habe mit einem Mann in Australien über Briefmarken geredet. Von meinem Wohnzimmer aus.“`,
  },
  c5_vote_result: {
    from: 'Vorstandsbüro',
    subject: 'Beschluss des Vorstands zu KB-Net',
    body: (g, v) => `Protokollauszug der Vorstandssitzung:

TOP 3: Fortführung des Geschäftsbereichs Netz (KB-Net)
Antrag Dr. Sauer: Einstellung der Investitionen.

Abstimmungsergebnis: ${v.won ? `Der Antrag wird abgelehnt. KB-Net wird fortgeführt. ${v.extra ? `Das Investitionsbudget wird um ${fmtDM(v.extra)} erhöht.` : ''}` : 'Der Antrag wird angenommen. Die Investitionen in KB-Net sind für vier Monate eingefroren. Der Vorstand wird erneut beraten.'}

gez. Vorstandsbüro`,
  },
  promotion_vorstand: {
    from: 'I. Bergmann · Personalabteilung',
    subject: 'Berufung in den Vorstand',
    body: (g) => `${g.s.player.name},

der Aufsichtsrat hat Sie mit Wirkung zum nächsten Monatsersten in den Vorstand der Kessler & Brandt Rechenwerke AG berufen.

Ihr neues Grundgehalt beträgt ${fmtDM(STAGES[5].salary * (1 + (g.s.player.salaryBonus || 0)))} brutto.

Ich habe Ihre erste Personalakte noch. Junior-Sachbearbeiter, Rechenzentrum, 2.400 DM. Herzlichen Glückwunsch.
Ingrid Bergmann`,
  },
  // ---------- Kapitel 6
  c6_finanzen: {
    from: 'H. Kessler · Vorstandsvorsitzender',
    subject: 'Willkommen im Vorstand',
    body: (g) => `${first(g)},

willkommen im zwölften Stock. Ihre Sekretärin heißt Frau Sommer, und sie weiß mehr über dieses Haus als wir beide zusammen.

Sie verantworten jetzt die Finanzen des ganzen Konzerns: Kasse, Kredite, Dividende, Beteiligungen. Alles im Programm FIN. Unsere Kasse ist gut gefüllt, ${fmtDM(g.s.corp.cash)}.

Die Börse ist gerade verrückt. Unsere Aktie steht bei ${fmtDM(g.s.shares.price)}, und jeden Tag ruft ein Banker an, der uns ein Internet-Startup verkaufen will. Behalten Sie einen kühlen Kopf.

Ihr Kessler`,
  },
  c6_rekord: {
    from: 'KB-Hausnachrichten',
    subject: 'KB-Aktie auf Rekordhoch',
    body: (g) => `FRANKFURT. Die Aktie der Kessler & Brandt Rechenwerke AG hat ein neues Allzeithoch erreicht: ${fmtDM(g.s.shares.price)}. Der Börsenwert des Konzerns liegt damit bei ${fmtDM(g.s.shares.price * g.s.corp.shares)}.

Analysten loben vor allem KB-Net: „KB ist kein Rechnerhersteller mehr, sondern ein Internetkonzern“, schreibt eine Großbank. Im Kasseler Stammhaus kursiert ein Witz: Der Pförtner sei mit seinen Mitarbeiteraktien jetzt Millionär.`,
  },
  c6_crash: {
    from: 'KB-Hausnachrichten',
    subject: 'Neuer Markt im freien Fall',
    body: () => `FRANKFURT. Am Neuen Markt hat die Stimmung gedreht. Seit März haben viele Internetwerte mehr als die Hälfte ihres Wertes verloren. Mehrere Startups haben Insolvenz angemeldet, weil das Geld der Anleger aufgebraucht ist.

Auch die KB-Aktie gibt nach. Ein Händler: „Jetzt wird wieder nach Gewinnen gefragt, nicht nach Visionen.“`,
  },
  c6_kartell2: {
    from: 'Dr. M. Lindner · Rechtsabteilung',
    subject: 'Dringend: Staatsanwaltschaft',
    body: (g) => `${g.s.player.name},

die Staatsanwaltschaft hat das Kartellverfahren wieder aufgenommen. Dr. Rau hat ausgesagt, um selbst glimpflich davonzukommen. Er belastet Sie direkt, mit Datum, Uhrzeit und Inhalt des Telefonats von damals.

Abstreiten wird jetzt sehr teuer. Ich rate dringend, alles einzuräumen. Die Geldbuße für KB wird bei etwa 60 Millionen DM liegen, so oder so.

Dr. Marion Lindner`,
    choices: ['Jetzt alles zugeben', 'Weiter abstreiten'],
  },
  c6_kartell_lied: {
    from: 'Aufsichtsrat',
    subject: 'Abmahnung durch den Aufsichtsrat',
    body: (g) => `${g.s.player.name},

der Aufsichtsrat hat das Kartellverfahren beraten. Die Beweislage ist eindeutig, die Geldbuße von 60 Millionen DM ist gezahlt.

Dass Sie die Absprache bis zuletzt bestritten haben, missbilligt der Aufsichtsrat ausdrücklich. Diese Abmahnung wird zu Ihrer Akte genommen.

Für den Aufsichtsrat`,
  },
  c6_rau_out: {
    from: 'KB-Hausnachrichten',
    subject: 'Orion: Rau tritt zurück',
    body: () => `FRANKFURT. Dr. Viktor Rau ist als Vorstandschef von Orion Datentechnik zurückgetreten. Er wechselt in den Aufsichtsrat. Orion schreibt nach dem Ende des Internet-Booms tiefrote Zahlen.

Branchenkenner erwarten, dass Rau aus dem Aufsichtsrat heraus weiter die Fäden zieht. „Rau verschwindet nicht“, sagt ein früherer Weggefährte. „Er wartet.“`,
  },
  c6_survive: {
    from: 'H. Kessler · Vorstandsvorsitzender',
    subject: 'Wir sind noch da',
    body: (g) => `${first(g)},

ich habe heute die Liste der Firmen gelesen, die es seit letztem Frühjahr nicht mehr gibt. Sie ist lang. KB steht nicht darauf.

Die Kasse ist im Plus, ${fmtDM(g.s.corp.cash)}. Das ist Ihr Verdienst.

Jetzt müssen wir aus der Krise heraus wachsen. Bringen Sie die Ergebnisse und den Kurs wieder nach oben. Und dann reden wir über meine Nachfolge.

Kessler`,
  },
  c6_mobilnet: {
    from: 'MobilNet AG',
    subject: 'Prototyp: Das Telefon mit Bildschirm',
    body: () => `Sehr geehrter Vorstand,

unsere Entwickler haben einen Prototypen gebaut: ein Handy mit großem Bildschirm, auf dem E-Mails, Nachrichten und KB-Net laufen. Noch zu teuer und zu langsam für den Markt. Aber in ein paar Jahren?

Wir danken KB, dass Sie in der Krise an uns festgehalten haben.

MobilNet AG, Karlsruhe`,
  },
  corp_cash_warning: {
    from: 'Konzern-Controlling',
    subject: 'Warnung: Konzernkasse im Minus',
    body: () => `Die Konzernkasse ist ins Minus gerutscht.

Bleibt sie drei Monate in Folge negativ, muss der Aufsichtsrat handeln. Optionen: Kredit aufnehmen, Beteiligungen verkaufen, Kosten senken, Dividende kürzen.

Konzern-Controlling`,
  },
  corp_writedown: {
    from: 'Konzern-Controlling',
    subject: 'Wertberichtigung auf Beteiligungen',
    body: (g, v) => `Nach dem Einbruch am Neuen Markt müssen die Beteiligungen des Konzerns neu bewertet werden.

Die Wertberichtigung beträgt ${fmtDM(v.amount)}. Sie belastet das Konzernergebnis dieses Monats in voller Höhe.

Konzern-Controlling`,
  },
  corp_bailout: {
    from: 'Aufsichtsrat',
    subject: 'Notkredit',
    body: () => `Die Hausbank hat auf Druck des Aufsichtsrats einen Notkredit über 150 Millionen DM gewährt. Ein zweites Mal wird das nicht geschehen.

Für den Aufsichtsrat`,
  },
  promotion_ceo: {
    from: 'I. Bergmann · Personalabteilung',
    subject: 'Ernennung zum Vorstandsvorsitzenden',
    body: (g) => `${g.s.player.name},

der Aufsichtsrat hat Sie zum Vorsitzenden des Vorstands der Kessler & Brandt Rechenwerke AG ernannt. Herr Kessler übernimmt den Vorsitz des Aufsichtsrats.

Ihr neues Grundgehalt beträgt ${fmtDM(STAGES[6].salary * (1 + (g.s.player.salaryBonus || 0)))} brutto.

Ich gehe nächstes Jahr in Rente. Ich hätte mir keinen schöneren Abschied wünschen können.
Ingrid Bergmann`,
  },
  endless: {
    from: 'K. Sommer · Vorstandsbüro',
    subject: 'Entscheidung',
    body: (g, v) => `${v.body}\n\nBitte entscheiden Sie.\n\nKarin Sommer`,
  },
  // ---------- Zusatzereignisse in allen Kapiteln
  x_ausflug: {
    from: 'W. Hoff · Abteilungsleiter',
    subject: 'Betriebsausflug an den Edersee',
    body: () => `Am Samstag fährt die Abteilung mit dem Bus an den Edersee. Dampferfahrt, Mittagessen, Rückkehr gegen 20 Uhr. Kostenbeitrag 30 DM.

Wer nicht mitfährt, kann im Büro die Rückstände abarbeiten. Das Rechenzentrum ist offen.

Hoff`,
    choices: ['Mitfahren (30 DM)', 'Im Büro bleiben und Rückstände abarbeiten (+120 Leistung)'],
  },
  x_lotto: {
    from: 'Petra Lang',
    subject: 'Lotto-Tippgemeinschaft',
    body: () => `Die halbe Abteilung spielt zusammen Lotto, jeden Samstag. 5 DM im Monat, und wenn wir gewinnen, wird geteilt.

Bist du dabei?

Petra`,
    choices: ['Ich bin dabei', 'Nein danke'],
  },
  x_lotto_win: {
    from: 'Petra Lang',
    subject: 'WIR HABEN GEWONNEN!!!',
    body: () => `Vier Richtige mit Zusatzzahl! Das sind 380 DM für jeden. Ich habe dir deinen Anteil schon aufs Konto überwiesen.

Hoff hat gefragt, ob er nächstes Mal mitspielen darf.

Petra`,
  },
  x_messe: {
    from: 'W. Hoff · Abteilungsleiter',
    subject: 'Hannover-Messe',
    body: (g) => `${first(g)},

KB braucht auf der Hannover-Messe Leute am Stand, die erklären können, was ein Rechenzentrum macht. Eine Woche, viel Kaffee, wenig Schlaf.

Freiwillige vor. Ihre Arbeit bleibt allerdings liegen.

Hoff`,
    choices: ['Am Stand mitarbeiten (−200 Leistung, Ruf +2)', 'Lieber im Büro bleiben'],
  },
  x_kurs: {
    from: 'Volkshochschule Kassel',
    subject: 'Abendkurs: Programmieren in COBOL',
    body: () => `Lernen Sie die Sprache der Großrechner. Zwölf Abende, jeweils dienstags und donnerstags, Kursgebühr 400 DM.

Absolventen arbeiten nachweislich schneller und sicherer.

Ihre Volkshochschule`,
    choices: ['Anmelden (400 DM, +15 % pro Auftrag)', 'Kein Interesse'],
  },
  x_praktikant: {
    from: 'I. Bergmann · Personalabteilung',
    subject: 'Praktikumsanfrage',
    body: () => `Ein junger Mann namens Tobias Engel, 19, möchte unbedingt in Ihrer Gruppe ein Praktikum machen. Er hat einen selbst gebauten Computer mitgebracht und uns eine halbe Stunde lang erklärt, wie er funktioniert.

Kosten: 600 DM im Monat aus Ihrem Personalbudget.

Bergmann`,
    choices: ['Aufnehmen', 'Ablehnen'],
  },
  x_vegas: {
    from: 'KB-Reisestelle',
    subject: 'Computermesse in Las Vegas',
    body: () => `Für die große Computermesse in Las Vegas ist noch ein Kontingent frei. Flug, Hotel und Messeeintritt für Sie und Ihre Gruppe: 3.000 DM, die Hälfte trägt KB.

Bitte bis Freitag Bescheid geben.

Reisestelle`,
    choices: ['Mit dem ganzen Team fliegen (3.000 DM privat, Moral +12)', 'Allein fliegen (Ruf +1)'],
  },
  x_virus: {
    from: 'Produktentwicklung',
    subject: 'Dringend: Virus auf ausgelieferten Disketten',
    body: () => `Auf einem Teil der mit dem KB PC ausgelieferten Systemdisketten ist ein Computervirus. Er löscht keine Daten, zeigt aber am Freitag, dem 13., eine Laufschrift.

Ein Rückruf kostet etwa 2 Millionen DM. Alternativ verschicken wir eine bereinigte Diskette per Post an alle, die sich beschweren.

Produktentwicklung`,
    choices: ['Rückruf (2 Mio. DM, Ruf +2)', 'Diskette per Post nachschicken'],
  },
  x_uni: {
    from: 'Gesamthochschule Kassel',
    subject: 'Forschungskooperation',
    body: () => `Sehr geehrte Damen und Herren,

unser Fachbereich Informatik sucht einen Partner aus der Industrie. Für 150.000 DM stellen wir Ihnen für ein Jahr zwei Doktoranden und Rechenzeit zur Verfügung.

Prof. Dr. Albers`,
    choices: ['Zusagen (150 TDM, +250 Forschungspunkte)', 'Ablehnen'],
  },
  x_portal: {
    from: 'KB-Net Redaktion',
    subject: 'Eigenes Nachrichtenportal?',
    body: () => `Die Kunden wählen sich ein, lesen ihre E-Mails und wählen sich wieder ab. Mit einem eigenen Nachrichtenportal, Wetter, Börsenkursen und Kleinanzeigen würden sie bleiben.

Aufbau: 2 Millionen DM aus dem Investitionsbudget.

KB-Net Redaktion`,
    choices: ['Starten (2 Mio. DM, Qualität +1)', 'Nein'],
  },
  x_foren: {
    from: 'KB-Net Redaktion',
    subject: 'Ärger in den Foren',
    body: () => `In einigen Foren von KB-Net geht es inzwischen ziemlich rau zu. Eine Zeitung hat schon angefragt.

Wir könnten Moderatoren einstellen (1 Million DM aus dem Investitionsbudget) oder es laufen lassen.

KB-Net Redaktion`,
    choices: ['Moderatoren einstellen (1 Mio. DM, Ruf +2)', 'Ignorieren'],
  },
  x_y2k: {
    from: 'IT-Leitung',
    subject: 'Jahr-2000-Problem',
    body: () => `Viele alte Programme speichern Jahreszahlen nur zweistellig. Am 1. Januar 2000 könnten sie glauben, es sei 1900.

Wir können ein Notfallteam über Silvester bereitstellen und alle Systeme vorher prüfen. Kosten: 20 Millionen DM.

IT-Leitung`,
    choices: ['Notfallteam (20 Mio. DM)', 'Wird schon gutgehen'],
  },
  x_y2k_fail: {
    from: 'KB-Hausnachrichten',
    subject: 'Panne zum Jahreswechsel',
    body: () => `KASSEL. In der Neujahrsnacht sind bei KB mehrere Abrechnungssysteme ausgefallen. Tausende Kunden erhielten Rechnungen über 100 Jahre Rechenzeit.

Der Fehler ist behoben, der Spott bleibt.`,
  },
  x_stiftung: {
    from: 'H. Kessler · Vorstandsvorsitzender',
    subject: 'Computer für Schulen',
    body: (g) => `${first(g)},

ich gründe eine Stiftung, die Schulen in Nordhessen mit Computern ausstattet. Ich frage alle Vorstände, ob sie sich beteiligen.

Kessler`,
    choices: ['Privat 50.000 DM spenden (Ruf +3)', 'KB spendet 5 Mio. DM (Ruf +1)'],
  },
  x_interview: {
    from: 'Pressestelle',
    subject: 'Interviewanfrage: Wirtschaftsmagazin',
    body: () => `Das größte Wirtschaftsmagazin will ein Interview zur Übernahmeschlacht. Wie sollen wir die Linie festlegen?

Pressestelle`,
    choices: ['Angriff: „Rau will KB plündern“', 'Sachlich: über Zahlen und Zukunft reden'],
  },
  x_mitarbeiteraktien: {
    from: 'Personalvorstand',
    subject: 'Sonderprogramm Mitarbeiteraktien',
    body: () => `Wir könnten der Belegschaft KB-Aktien zum halben Preis anbieten. Die Differenz trägt der Konzern, etwa 50 Millionen DM. Die Aktien wären damit in treuen Händen.

Personalvorstand`,
    choices: ['Auflegen (50 Mio. DM)', 'Nein'],
  },
  corp_invest_intro: {
    from: 'Konzern-Controlling',
    subject: 'Was tun mit der Konzernkasse?',
    body: () => `Die Konzernkasse ist gut gefüllt. Geld, das nur auf dem Konto liegt, verdient nichts. Der Vorstand hat drei Möglichkeiten:

1. Tochterfirmen kaufen (Programm TÖCHTER). Jede bringt jeden Monat Gewinn und oft einen Vorteil für unsere Produkte. Ausbauen erhöht den Gewinn, gute Firmen lassen sich später teurer verkaufen.
2. Konzernprojekte bauen (Programm INVEST): Fertigung, Forschungszentrum, Läden. Sie kosten einmal und wirken dauerhaft.
3. Geld anlegen (Programm INVEST): Anleihen, Immobilien oder Aktienfonds. Das Geld bleibt verfügbar.

Bitte achten Sie darauf, dass die Kasse nicht ins Minus rutscht. Drei Monate im Minus übersteht kein Vorstand.

Konzern-Controlling`,
  },
  sub_crisis: {
    from: 'Beteiligungsmanagement',
    subject: (g, v) => `Probleme bei ${v.name}`,
    body: (g, v) => `Bei ${v.name} (${v.sector}) läuft es schlecht. Ein wichtiger Kunde ist abgesprungen, der Gewinn bricht ein.

Eine Sanierung im Programm TÖCHTER bringt die Firma schnell wieder auf Kurs. Ohne Hilfe erholt sie sich nur langsam.

Beteiligungsmanagement`,
  },
  sub_boom: {
    from: 'Beteiligungsmanagement',
    subject: (g, v) => `Großauftrag für ${v.name}`,
    body: (g, v) => `Gute Nachrichten: ${v.name} (${v.sector}) hat einen Großauftrag gewonnen. Der Gewinn steigt deutlich.

Beteiligungsmanagement`,
  },
  sub_offer: {
    from: 'Investmentbank Löwe & Partner',
    subject: (g, v) => `Kaufangebot für ${v.name}`,
    body: (g, v) => `Sehr geehrte Damen und Herren,

ein Mandant von uns möchte ${v.name} übernehmen und bietet ${fmtDM(v.amount)}. Das liegt deutlich über dem aktuellen Wert.

Das Angebot gilt nur kurz.

Löwe & Partner`,
    choices: ['Verkaufen', 'Ablehnen'],
  },
  world_open: {
    from: 'Auslandsvertrieb',
    subject: 'Neuer Markt erschlossen',
    body: (g, v) => `Die Niederlassung ${v.name} ist eröffnet. Unsere Produktlinien verkaufen sich ab sofort auch dort.

Zusätzliche Marktgröße: +${Math.round(v.factor * 100)} %.

Auslandsvertrieb`,
  },
  // ---------- Euro und Kapitel 7
  euro: {
    from: 'Konzern-Controlling',
    subject: 'Umstellung auf Euro',
    body: () => `Seit dem 1. Januar 2002 ist der Euro unser Zahlungsmittel. Alle Beträge im Konzern, auf Ihrer Entgeltabrechnung und auf Ihrem Konto werden ab sofort in Euro geführt.

Umrechnungskurs: 1 Euro = 1,95583 DM.

Alte Abrechnungen bleiben in DM archiviert.

Konzern-Controlling`,
  },
  c7_ceo: {
    from: 'H. Kessler · Aufsichtsratsvorsitzender',
    subject: 'Sechs Jahre',
    body: (g) => `${first(g)},

sechs Jahre sind Sie jetzt Vorstandsvorsitzender. Ich lese die Quartalszahlen inzwischen mit einer Lupe, aber ich lese sie noch.

Eine Sache macht mir Sorgen: Viktor Rau ist zurück. Er ist wieder Vorstandschef bei Orion, und hinter ihm steht Hawk Capital, ein Finanzinvestor aus London mit sehr viel Geld und sehr wenig Geduld.

Rau hat nie vergessen, was zwischen Orion und KB war. Seien Sie wachsam.

Heinrich Kessler`,
  },
  c7_mobilnet_offer: {
    from: 'Pomona Inc. · Cupertino',
    subject: 'Angebot für MobilNet',
    body: (g) => `Dear Board of KB,

wir möchten Ihre Beteiligung MobilNet AG übernehmen. Die Software Ihrer Karlsruher Kollegen passt perfekt zu unserem neuen Smartphone.

Unser Angebot: ${fmtDM(g.startupValue('mobilnet'))}, in bar.

Best regards,
Pomona Inc.`,
    choices: ['Verkaufen, das Geld gibt uns Spielraum', 'Behalten, MobilNet ist unsere Zukunft'],
  },
  c7_lehman: {
    from: 'KB-Hausnachrichten',
    subject: 'Bankenkrise: Börsen weltweit im freien Fall',
    body: () => `NEW YORK / FRANKFURT. Nach dem Zusammenbruch einer großen amerikanischen Investmentbank sind die Börsen weltweit eingebrochen. Banken leihen sich gegenseitig kein Geld mehr, Unternehmen stoppen Investitionen.

Auch die KB-Aktie verliert stark. Analysten warnen: Wer jetzt billig ist, wird zum Übernahmekandidaten.`,
  },
  c7_bid_news: {
    from: 'KB-Hausnachrichten',
    subject: 'Orion greift nach KB',
    body: (g) => `FRANKFURT. Orion Datentechnik hat ein Übernahmeangebot für die Kessler & Brandt Rechenwerke AG vorgelegt: ${fmtDM(g.s.takeover.offer)} je Aktie, deutlich über dem aktuellen Kurs. Finanziert wird das Angebot von Hawk Capital.

Orion hält nach eigenen Angaben bereits ${fmtInt(g.s.takeover.orion)} % der KB-Aktien. Für die Übernahme braucht Orion mehr als 50 %.

Die Hauptversammlung von KB findet in sieben Monaten statt. Bis dahin entscheidet sich, wem KB gehört. Den Stand siehst du im Programm ABWEHR.`,
  },
  c7_petra: {
    from: 'Petra Lang · Betriebsratsvorsitzende',
    subject: 'Wir stehen hinter dir',
    body: (g) => `${first(g)},

wir kennen uns seit dem Lochkartenstapel von 1978. Ich hätte nie gedacht, dass ich dir mal als Betriebsratsvorsitzende schreibe.

Die Belegschaft hat abgestimmt: Wer Mitarbeiteraktien hat, verkauft nicht an Orion. Keiner. Wir wissen, was Hawk Capital mit Firmen macht, die sie kaufen.

Petra`,
  },
  c7_betriebsrat: {
    from: 'Betriebsrat der KB AG',
    subject: 'Stellungnahme zum Übernahmeangebot',
    body: (g) => `Sehr geehrter Vorstand,

der Betriebsrat hat das Angebot von Orion beraten. Wir empfehlen den Kolleginnen und Kollegen, ihre Mitarbeiteraktien nicht zu verkaufen.

${g.s.story.flags.job_cuts ? 'Wir haben allerdings nicht vergessen, wer 2000 die 2.000 Stellen gestrichen hat. Viele Kollegen sind unentschlossen.' : 'Der Vorstand hat in der Krise 2000 keine Stellen gestrichen. Das zählt jetzt.'}

Der Betriebsrat`,
  },
  c7_sommer_warn: {
    from: 'K. Sommer · Vorstandsbüro',
    subject: 'Vertraulich',
    body: () => `Entschuldigen Sie, dass ich mich einmische.

Dr. Sauer hat sich in den letzten Wochen dreimal mit Herrn Rau getroffen, zweimal in Frankfurt, einmal hier in Kassel im Hotel. Ich habe die Termine in seinem Kalender gesehen.

Ich dachte, Sie sollten das wissen.

Karin Sommer`,
    choices: ['Sauer zur Rede stellen und entlassen', 'Abwarten und beobachten'],
  },
  c7_state_rescue: {
    from: 'KB-Hausnachrichten',
    subject: 'Land Hessen steigt bei KB ein',
    body: () => `WIESBADEN. Um eine Zerschlagung zu verhindern, hat das Land Hessen kurzfristig ein Aktienpaket an der Kessler & Brandt Rechenwerke AG erworben. Die Übernahme durch Orion ist damit gescheitert.`,
  },
  c7_victory: {
    from: 'KB-Hausnachrichten',
    subject: 'KB bleibt unabhängig',
    body: (g) => g.s.story.flags.orion_bought
      ? `KASSEL. Paukenschlag: Statt übernommen zu werden, hat KB den Spieß umgedreht und Orion Datentechnik gekauft. Dr. Viktor Rau verlässt das Unternehmen. Hawk Capital zieht sich zurück.

„Ich habe in vierzig Jahren viel gesehen“, sagt Aufsichtsratschef Heinrich Kessler. „Aber das noch nicht.“`
      : `KASSEL. Die Übernahme der Kessler & Brandt Rechenwerke AG durch Orion ist gescheitert. Auf der Hauptversammlung kam Orion auf ${fmtInt(g.s.takeover.orion)} % der Stimmen, zu wenig für eine Mehrheit.

Hawk Capital hat angekündigt, die gesammelten Aktien zu verkaufen. Dr. Rau war für eine Stellungnahme nicht zu erreichen.`,
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
  kessler_wette: {
    who: 'kessler',
    lines: [
      'Schöne Sitzecke. Ich bleibe trotzdem stehen, sonst komme ich nicht wieder hoch.',
      'Ich will, dass KB einen eigenen Onlinedienst baut. KB-Net. Einwahlknoten in jeder großen Stadt, eigene Inhalte, alles.',
      'Sauer hält das für Geldverbrennung. Vielleicht hat er recht. Aber wenn wir jetzt nicht anfangen, fangen wir nie an.',
      'Wie viel wollen Sie? Ich kann Ihnen 8 Millionen geben, ohne zu fragen. Für 20 Millionen muss ich im Vorstand kämpfen.',
    ],
    choices: ['Alles auf das Netz: 20 Mio. DM', 'Vorsichtig anfangen: 8 Mio. DM'],
  },
  rau_partner: {
    who: 'rau', phone: true,
    lines: [
      'Rau hier. Ich mache es kurz, Höflichkeiten haben wir uns ja gespart.',
      'Ihr Preiskrieg hat uns beide Geld gekostet. Mich mehr als Sie, das gebe ich zu.',
      'OrionLine braucht Kapital, das ich nicht habe. Ich biete Ihnen unsere Kunden an. Sie übernehmen OrionLine, ich ziehe mich aus dem Onlinegeschäft zurück.',
    ],
    choices: ['Einverstanden. KB übernimmt OrionLine.', 'Nein danke, Herr Rau. Wir schaffen das allein.'],
  },
  kessler_kartell: {
    who: 'kessler',
    lines: [
      'Ich habe Lindners Bericht gelesen.',
      'Eine Preisabsprache mit Rau. Ausgerechnet mit Rau.',
      'Sie haben es offengelegt, das rechne ich Ihnen an. Aber Sauer hat jetzt etwas gegen Sie in der Hand, und er wird es benutzen.',
    ],
    choices: ['Es tut mir leid, Herr Kessler.'],
  },
  kessler_sitzung: {
    who: 'kessler',
    lines: [
      'Morgen früh ist Vorstandssitzung. Sauer will KB-Net stoppen.',
      (g) => `Sie haben ${fmtInt(g.s.net.subs)} Kunden und ${g.s.net.nodes.length} Knoten. Ich zähle die Stimmen: Es wird knapp.`,
      'Womit wollen Sie die Herren überzeugen?',
    ],
    choices: ['Mit den Zahlen: Kundenwachstum Monat für Monat.', 'Mit einer Vision: Was KB in zehn Jahren sein kann.', 'Mit einem Kompromiss: das halbe Budget, aber weitermachen.'],
  },
  kessler_vorstand: {
    who: 'kessler',
    lines: [
      (g) => `${fmtInt(g.s.net.subs)} Kunden bei KB-Net. Sauer hat in der Sitzung kein Wort gesagt. Das war sein lautestes Schweigen bisher.`,
      'Der Aufsichtsrat hat zugestimmt. Sie kommen in den Vorstand.',
      'Sie übernehmen das Finanzressort. Ja, das von Sauer. Er wechselt in die Strategie. Glauben Sie nicht, dass er das vergisst.',
    ],
    choices: ['Ich bin bereit.'],
  },
  sauer_neuer_markt: {
    who: 'sauer',
    lines: [
      'Glückwunsch zum Vorstandsposten. Ehrlich gemeint, auch wenn Sie es mir nicht glauben.',
      'Ich habe vier Beteiligungen geprüft. Internetfirmen vom Neuen Markt. Die Banken reißen sich darum.',
      'Wer jetzt nicht kauft, ist in zwei Jahren ein Museum. Sehen Sie sich die Liste im Programm FIN an.',
    ],
    choices: ['Ich sehe mir das an.', 'Ohne mich, Herr Sauer. Das ist eine Blase.'],
  },
  kessler_blase: {
    who: 'kessler',
    lines: [
      'Haben Sie heute den Kurs gesehen? Ich auch. Er macht mir Angst.',
      'Ich habe 1973 schon eine Blase erlebt. Damals war es Öl, heute ist es das Internet. Die Gesichter in der Kantine sind dieselben.',
      'Machen Sie die Kasse wetterfest. Wenn es kracht, will ich, dass KB noch steht.',
    ],
    choices: ['Sie haben recht. Wir bereiten uns vor.', 'Diesmal ist es anders, Herr Kessler.'],
  },
  sauer_krise: {
    who: 'sauer',
    lines: [
      'Die Zahlen sind schlecht. Sie wissen es, ich weiß es, der Aufsichtsrat weiß es.',
      'Ich habe einen Plan: 2.000 Stellen im Stammgeschäft. Großrechner-Wartung, Verwaltung, Kantine. Das spart 4 Millionen im Monat.',
      'Kessler wird es hassen. Aber Kessler ist nicht für die Finanzen zuständig. Sie sind es.',
    ],
    choices: ['2.000 Stellen abbauen', 'Vorstandsgehälter um 20 % kürzen, keine Entlassungen', 'Wir halten durch.'],
  },
  kessler_ceo: {
    who: 'kessler',
    lines: [
      'Setzen Sie sich. Nein, diesmal setze ich mich auch.',
      'Ich bin dreiundsiebzig. Der Aufsichtsrat hat gestern über meine Nachfolge abgestimmt. Sauer hatte zwei Stimmen.',
      (g) => (g.s.story.flags.job_cuts ? 'Sie haben in der Krise harte Entscheidungen getroffen. Ich hätte anders entschieden. Aber Sie haben dieses Haus durchgebracht.' : 'Sie haben dieses Haus durch die Krise gebracht, ohne es zu verraten. Das ist mehr, als ich erwartet habe.'),
      'Ab dem Ersten sind Sie Vorstandsvorsitzender. Ich wechsle in den Aufsichtsrat. Rufen Sie mich nur an, wenn es brennt.',
    ],
    choices: ['Danke, Herr Kessler. Für alles.'],
  },
  rau_bid: {
    who: 'rau', phone: true,
    lines: [
      (g) => `${g.s.player.name}. Rau. Ich wollte, dass Sie es von mir hören und nicht aus der Zeitung.`,
      'Orion hält seit heute früh 15 Prozent an KB. Leise gekauft, über Jahre. Morgen veröffentlichen wir unser Angebot an Ihre Aktionäre.',
      'Ihre Aktie ist so billig wie seit zwanzig Jahren nicht. Ihre Aktionäre werden verkaufen, glauben Sie mir. In sieben Monaten ist Hauptversammlung. Danach gehört KB mir.',
      (g) => (g.s.story.flags.kartell_confessed || g.s.story.flags.kartell_closed ? 'Sie haben mich damals beim Kartellamt verraten. Das hier ist persönlich.' : 'Nehmen Sie es nicht persönlich. Oder doch.'),
    ],
    choices: ['Wir sehen uns auf der Hauptversammlung, Herr Rau.'],
  },
  kessler_ch7: {
    who: 'kessler',
    lines: [
      'Ich bin mit dem Taxi gekommen. Der Arzt sagt, ich soll nicht mehr Auto fahren. Der Arzt sagt vieles.',
      (g) => `Meine Familie hält ${fmtInt(g.loyalBlocks()[0].pct)} Prozent an KB. Rau hat meinem Neffen gestern ein Angebot gemacht.`,
      (g) => (g.s.story.flags.kartell_lied ? 'Ich will ehrlich sein: Seit der Sache mit dem Kartellamt ist meine Familie Ihnen gegenüber misstrauisch. Sie haben damals gelogen.' : 'Meine Familie vertraut Ihnen. Ich auch.'),
      'Was soll ich ihnen sagen?',
    ],
    choices: ['Ich bitte Sie und Ihre Familie um Ihre Stimmen.', 'Halten Sie sich raus, Herr Kessler. Das ist meine Schlacht.'],
  },
  sauer_turn: {
    who: 'sauer',
    lines: [
      'Machen Sie die Tür zu. Bitte.',
      'Rau hat mich angesprochen. Dreimal. Er bietet mir Ihren Posten an, wenn ich ihm helfe.',
      'Ich habe nie verheimlicht, dass ich CEO werden wollte. Aber nicht so. Nicht als Raus Marionette.',
      'Ich habe Freunde unter den Aktionären. Ihre Stimmen gehören Ihnen. Sagen Sie Kessler nicht, dass ich das gesagt habe.',
    ],
    choices: ['Danke, Herr Sauer. Das vergesse ich Ihnen nicht.'],
  },
  hayashi_call: {
    who: 'hayashi', phone: true,
    lines: [
      'Guten Tag. Hayashi aus Osaka. Verzeihen Sie die späte Stunde, bei uns ist es früher Morgen.',
      'Hayashi Denki baut seit 1951 Rechner. Wie KB. Wir haben Ihr Haus immer bewundert.',
      'Wir würden gern 18 Prozent an KB erwerben, als freundlicher Partner. Wir würden nie gegen den Vorstand stimmen. Wir möchten nur einen Sitz im Aufsichtsrat.',
    ],
    choices: ['Willkommen, Herr Hayashi. Wir nehmen an.', 'Danke, aber KB bleibt in deutscher Hand.'],
  },
  kessler_final: {
    who: 'kessler',
    lines: [
      'Es ist vorbei. KB gehört sich selbst.',
      (g) => (g.s.story.flags.orion_bought ? 'Sie haben Orion gekauft. Raus Orion. Ich habe in der Sitzung gelacht, zum ersten Mal seit Jahren.' : `Orion kam auf ${fmtInt(g.s.takeover.orion)} Prozent. Es hat gereicht. Knapp, aber es hat gereicht.`),
      'Ich lege nächsten Monat den Vorsitz im Aufsichtsrat nieder. Diesmal wirklich.',
      (g) => `Wissen Sie noch, 1978? Ich habe Sie gefragt, wohin die Reise geht. ${g.s.story.flags.vision_pc ? 'Sie haben gesagt: ein Computer auf jedem Schreibtisch. Sie hatten recht.' : 'Sie haben gesagt: Großrechner. Sie lagen falsch. Und trotzdem sind Sie hier.'}`,
      'Das Haus gehört jetzt Ihnen. Machen Sie etwas daraus.',
    ],
    choices: ['Danke, Heinrich.'],
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
  [
    { id: 'nodes', text: 'Baue Einwahlknoten in 8 Städten', prog: (g) => [g.s.net.nodes.length, 8] },
    { id: 'subs', text: 'Gewinne 40.000 Kunden für KB-Net', prog: (g) => [g.s.net.subs, 40000] },
    { id: 'vote', text: 'Gewinne die Abstimmung im Vorstand', prog: (g) => [g.s.story.flags.vote_won ? 1 : 0, 1] },
    { id: 'shares', text: 'Besitze 150 KB-Aktien als Einfluss im Vorstand', prog: (g) => [g.s.shares.owned, 150] },
    { id: 'streak', text: 'Schreibe 3 Monate in Folge schwarze Zahlen im Bereich', prog: (g) => [g.s.dept.posStreak, 3] },
  ],
  [
    { id: 'survive', text: 'Bring KB mit positiver Kasse durch den Crash (bis April 2001)', prog: (g) => [g.s.story.flags.crisis_survived ? 1 : 0, 1] },
    { id: 'pos', text: 'Konzernergebnis nach dem Crash 3 Monate in Folge positiv', prog: (g) => [g.s.corp.posAfter, 3] },
    { id: 'kurs', text: 'Bring die KB-Aktie wieder auf 80 % ihres Werts vor dem Hype (in DM)', prog: (g) => [Math.round(g.s.shares.price), Math.round(g.s.corp.base * 0.8)] },
    { id: 'shares', text: 'Besitze 300 KB-Aktien', prog: (g) => [g.s.shares.owned, 300] },
    { id: 'kartell', text: 'Keine Altlasten: Kartellverfahren abgeschlossen', prog: (g) => { const f = g.s.story.flags; return [!f.rau_deal || f.kartell_confessed || f.kartell_closed ? 1 : 0, 1]; } },
  ],
  [
    { id: 'takeover', text: 'Wehre die Übernahme durch Orion ab', prog: (g) => [g.s.story.flags.takeover_won ? 1 : 0, 1] },
  ],
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

  // ---------- Kapitel 5
  { id: 'c5_start', when: (g) => g.s.player.stage >= 4,
    run: (g) => {
      const f = g.s.story.flags, tm = t(g);
      if (tm.year < 1993) { tm.year = 1993; tm.month = 0; tm.monthProgress = 0; }
      f.c5_month = tm.totalMonths;
      g.mail('c5_bereich');
      g.emit('era');
      if (!f.seen_ch5) { f.seen_ch5 = true; g.emit('chapter', 5); }
    } },
  { id: 'c5_wette', when: (g) => g.s.player.stage >= 4 && t(g).monthProgress > 10 && g.idle(),
    run: (g) => g.dialog('kessler_wette') },
  { id: 'c5_sauer', when: (g) => g.s.story.flags.net_bet && t(g).totalMonths >= g.s.story.flags.c5_month + 1 && t(g).monthProgress > 20,
    run: (g) => g.mail('c5_sauer_memo') },
  { id: 'c5_kartell', when: (g) => g.s.story.flags.rau_deal && g.s.player.stage >= 4 && t(g).totalMonths >= g.s.story.flags.c5_month + 2 && t(g).monthProgress > 30,
    run: (g) => g.mail('c5_kartell') },
  { id: 'c5_orion_weak', when: (g) => g.s.story.flags.price_war && g.s.player.stage >= 4 && t(g).totalMonths >= g.s.story.flags.c5_month + 2 && t(g).monthProgress > 30 && g.idle(),
    run: (g) => g.dialog('rau_partner') },
  { id: 'c5_boom', when: (g) => g.s.net.subs >= 10000,
    run: (g) => g.mail('c5_boom') },
  { id: 'c5_vote',
    when: (g) => { const f = g.s.story.flags; return g.s.net.nodes.length >= 4 && t(g).totalMonths >= f.c5_month + 3 && !f.vote_won && (f.vote_retry == null || t(g).totalMonths >= f.vote_retry) && t(g).monthProgress > 15 && g.idle(); },
    run: (g) => g.dialog('kessler_sitzung') },
  { id: 'promotion5', when: (g) => g.s.player.stage === 4 && missionsDone(g) && g.idle(),
    run: (g) => g.dialog('kessler_vorstand') },

  // ---------- Kapitel 6
  { id: 'c6_start', when: (g) => g.s.player.stage >= 5,
    run: (g) => {
      const f = g.s.story.flags, tm = t(g);
      if (tm.year < 1999 || (tm.year === 1999 && tm.month < 9)) { tm.year = 1999; tm.month = 9; tm.monthProgress = 0; }
      f.c6_month = tm.totalMonths;
      g.startCorp();
      g.mail('c6_finanzen');
      g.emit('era');
      if (!f.seen_ch6) { f.seen_ch6 = true; g.emit('chapter', 6); }
    } },
  { id: 'c6_sauer', when: (g) => g.s.player.stage >= 5 && t(g).monthProgress > 15 && g.idle(),
    run: (g) => { g.s.corp.offers = ['klickfix', 'webwelt', 'b2bplus', 'mobilnet']; g.emit('corp'); g.dialog('sauer_neuer_markt'); } },
  { id: 'c6_blase', when: (g) => g.s.corp.active && g.monthIndex() >= 12 && g.idle(),
    run: (g) => g.dialog('kessler_blase') },
  { id: 'c6_rekord', when: (g) => g.s.corp.active && g.hype() >= 2.7,
    run: (g) => g.mail('c6_rekord') },
  { id: 'c6_crash', when: (g) => g.s.corp.active && g.monthIndex() >= 16,
    run: (g) => g.mail('c6_crash') },
  { id: 'c6_krise', when: (g) => g.s.corp.active && g.monthIndex() >= 21 && g.idle(),
    run: (g) => g.dialog('sauer_krise') },
  { id: 'c6_kartell2', when: (g) => g.s.story.flags.kartell_denied && g.s.corp.active && g.monthIndex() >= 23,
    run: (g) => g.mail('c6_kartell2') },
  { id: 'c6_rau_out', when: (g) => g.s.corp.active && g.monthIndex() >= 25,
    run: (g) => g.mail('c6_rau_out') },
  { id: 'c6_survive', when: (g) => g.s.corp.active && g.monthIndex() >= 27 && g.s.corp.cash > 0,
    run: (g) => { g.s.story.flags.crisis_survived = true; g.mail('c6_survive'); } },
  { id: 'c6_mobilnet', when: (g) => g.s.corp.owned.some((o) => o.id === 'mobilnet') && g.monthIndex() >= 30,
    run: (g) => { g.s.story.flags.mobilnet_kept = true; g.mail('c6_mobilnet'); } },
  { id: 'promotion6', when: (g) => g.s.player.stage === 5 && missionsDone(g) && g.idle(),
    run: (g) => g.dialog('kessler_ceo') },

  // ---------- Zusatzereignisse
  { id: 'x_ausflug', when: (g) => g.s.player.stage === 0 && t(g).totalMonths >= 1 && mp(g) > 0.6, run: (g) => g.mail('x_ausflug') },
  { id: 'x_lotto', when: (g) => g.s.player.stage <= 1 && t(g).totalMonths >= 3 && mp(g) > 0.3, run: (g) => g.mail('x_lotto') },
  { id: 'x_lotto_win', when: (g) => g.s.story.flags.lotto != null && t(g).totalMonths >= g.s.story.flags.lotto + 3,
    run: (g) => { g.s.player.cash += 380; g.mail('x_lotto_win'); } },
  { id: 'x_messe', when: (g) => g.s.player.stage === 1 && t(g).totalMonths >= g.s.story.flags.c2_month + 1 && mp(g) > 0.6, run: (g) => g.mail('x_messe') },
  { id: 'x_kurs', when: (g) => g.s.player.stage === 1 && t(g).totalMonths >= g.s.story.flags.c2_month + 2 && mp(g) > 0.3, run: (g) => g.mail('x_kurs') },
  { id: 'x_praktikant', when: (g) => g.s.player.stage === 2 && t(g).totalMonths >= g.s.story.flags.c3_month + 1 && mp(g) > 0.5, run: (g) => g.mail('x_praktikant') },
  { id: 'x_vegas', when: (g) => g.s.player.stage === 2 && g.s.product.stage === 'dev' && mp(g) > 0.7, run: (g) => g.mail('x_vegas') },
  { id: 'x_virus', when: (g) => g.s.player.stage === 3 && g.s.lines.pc.model && mp(g) > 0.6, run: (g) => g.mail('x_virus') },
  { id: 'x_uni', when: (g) => g.s.player.stage === 3 && t(g).totalMonths >= g.s.story.flags.c4_month + 2 && mp(g) > 0.4, run: (g) => g.mail('x_uni') },
  { id: 'x_portal', when: (g) => g.s.player.stage === 4 && g.s.net.nodes.length >= 3 && mp(g) > 0.5, run: (g) => g.mail('x_portal') },
  { id: 'x_foren', when: (g) => g.s.player.stage === 4 && g.s.net.subs >= 15000 && mp(g) > 0.4, run: (g) => g.mail('x_foren') },
  { id: 'x_y2k', when: (g) => g.s.corp.active && g.monthIndex() >= 10.3 && g.monthIndex() < 12, run: (g) => g.mail('x_y2k') },
  { id: 'x_y2k_fail', when: (g) => g.s.story.flags.y2k_risk && g.monthIndex() >= 12,
    run: (g) => { g.addRep(-3); g.shareShock(-0.04); g.mail('x_y2k_fail'); } },
  { id: 'x_stiftung', when: (g) => g.s.corp.active && g.s.player.stage === 5 && g.monthIndex() >= 18 && mp(g) > 0.5, run: (g) => g.mail('x_stiftung') },
  { id: 'x_interview', when: (g) => g.s.takeover.active && !g.s.takeover.done && t(g).totalMonths >= g.s.takeover.startMonth + 1 && mp(g) > 0.7, run: (g) => g.mail('x_interview') },
  { id: 'x_mitarbeiteraktien', when: (g) => g.s.takeover.active && !g.s.takeover.done && t(g).totalMonths >= g.s.takeover.startMonth + 3, run: (g) => g.mail('x_mitarbeiteraktien') },

  // ---------- Euro und Kapitel 7
  { id: 'euro', when: (g) => g.s.time.year >= 2002, run: (g) => g.mail('euro') },
  { id: 'c7_start', when: (g) => g.s.player.stage >= 6,
    run: (g) => {
      const f = g.s.story.flags, tm = t(g);
      if (tm.year < 2008) { tm.year = 2008; tm.month = 0; tm.monthProgress = 0; }
      g.syncCurrency();
      f.c7_month = tm.totalMonths;
      g.mail('c7_ceo');
      g.emit('era');
      if (!f.seen_ch7) { f.seen_ch7 = true; g.emit('chapter', 7); }
    } },
  { id: 'c7_mobilnet', when: (g) => g.s.corp.owned.some((o) => o.id === 'mobilnet') && g.monthIndex() >= 109,
    run: (g) => g.mail('c7_mobilnet_offer') },
  { id: 'c7_lehman', when: (g) => g.s.player.stage >= 6 && g.monthIndex() >= 116.5,
    run: (g) => g.mail('c7_lehman') },
  { id: 'c7_bid', when: (g) => g.s.player.stage >= 6 && g.monthIndex() >= 117 && g.idle(),
    run: (g) => g.dialog('rau_bid') },
  { id: 'c7_kessler', when: (g) => g.s.takeover.active && !g.s.takeover.done && mp(g) > 0.4 && g.idle(),
    run: (g) => g.dialog('kessler_ch7') },
  { id: 'c7_belegschaft', when: (g) => g.s.takeover.active && t(g).totalMonths >= g.s.takeover.startMonth + 1 && mp(g) > 0.2,
    run: (g) => g.mail(g.s.story.flags.loyal_petra ? 'c7_petra' : 'c7_betriebsrat') },
  { id: 'c7_sauer', when: (g) => g.s.takeover.active && !g.s.takeover.done && t(g).totalMonths >= g.s.takeover.startMonth + 1 && mp(g) > 0.5 && g.idle(),
    run: (g) => { if (g.s.story.flags.sauer_ally) g.dialog('sauer_turn'); else g.mail('c7_sommer_warn'); } },
  { id: 'c7_knight', when: (g) => g.s.takeover.active && !g.s.takeover.done && t(g).totalMonths >= g.s.takeover.startMonth + 2 && mp(g) > 0.3 && g.idle(),
    run: (g) => g.dialog('hayashi_call') },
  { id: 'c7_final', when: (g) => g.s.takeover.done && g.s.takeover.won && g.idle(),
    run: (g) => { g.mail('c7_victory'); g.dialog('kessler_final'); } },
];

// ---------------------------------------------------------------- Reaktionen auf Entscheidungen
export const ON_MAIL_CHOICE = {
  sub_offer: (g, i, m) => {
    if (i !== 0 || !m.meta) return;
    if (!g.s.corp.subs.some((o) => o.id === m.meta.id)) return; // schon verkauft
    g.sellSubsidiary(m.meta.id, m.meta.amount);
  },
  x_ausflug: (g, i) => { if (i === 0) { g.s.player.cash -= 30; g.addRep(1); } else g.addWork(120); },
  x_lotto: (g, i) => { if (i === 0) { g.s.story.flags.lotto = t(g).totalMonths; g.s.player.cash -= 5; } },
  x_messe: (g, i) => { if (i === 0) { g.s.player.perf = Math.max(0, g.s.player.perf - 200); g.addRep(2); } },
  x_kurs: (g, i) => { if (i === 0) { g.s.player.cash -= 400; g.s.story.flags.cobol = true; } },
  x_praktikant: (g, i) => {
    if (i === 0 && g.s.team.members.length < g.teamMax()) {
      const m = g.makeMember({ name: 'Tobias Engel', skill: 1, trait: 'kreativ', salary: 600, morale: 90, longHair: true });
      m.since = t(g).totalMonths;
      g.s.team.members.push(m);
      g.emit('team');
    }
  },
  x_vegas: (g, i) => {
    if (i === 0) { g.s.player.cash -= 3000; g.s.team.members.forEach((m) => g.changeMorale(m, 12)); g.emit('team'); } else g.addRep(1);
  },
  x_virus: (g, i) => {
    if (i === 0) { g.s.dept.extraCost = (g.s.dept.extraCost || 0) + 2e6; g.addRep(2); }
    else { g.addRep(-2); const m = g.s.lines.pc.model; if (m) m.q = Math.max(1, m.q - 1); }
  },
  x_uni: (g, i) => { if (i === 0) { g.s.dept.extraCost = (g.s.dept.extraCost || 0) + 150000; g.s.rd.pool += 250; g.tryResearch(); } },
  x_portal: (g, i) => { if (i === 0) { g.s.net.invest = Math.max(0, g.s.net.invest - 2e6); g.s.net.qBonus = (g.s.net.qBonus || 0) + 1; g.emit('net'); } },
  x_foren: (g, i) => { if (i === 0) { g.s.net.invest = Math.max(0, g.s.net.invest - 1e6); g.addRep(2); } else g.addRep(-2); },
  x_y2k: (g, i) => { if (i === 0) { g.s.corp.cash -= 20e6; g.s.story.flags.y2k_safe = true; g.addRep(1); } else g.s.story.flags.y2k_risk = true; },
  x_stiftung: (g, i) => { if (i === 0) { g.s.player.cash -= 50000; g.addRep(3); } else { g.s.corp.cash -= 5e6; g.addRep(1); } },
  x_interview: (g, i) => { if (i === 0) { g.addRep(1); g.s.takeover.leak += 0.01; } else g.s.corp.perfShock += 0.04; },
  x_mitarbeiteraktien: (g, i) => { if (i === 0) { g.s.corp.cash -= 50e6; g.s.story.flags.emp_shares = true; g.emit('takeover'); } },
  c7_mobilnet_offer: (g, idx) => {
    if (idx === 0) { const v = g.sellStartup('mobilnet'); g.s.story.flags.mobilnet_sold = v; }
    else { g.s.story.flags.mobilnet_future = true; g.addRep(1); }
  },
  c7_sommer_warn: (g, idx) => {
    if (idx === 0) { g.s.story.flags.sauer_fired = true; g.s.takeover.leak = -0.02; g.addRep(-1); }
    else g.s.takeover.leak = 0.02;
    g.emit('takeover');
  },
  endless: (g, idx, mail) => {
    const ev = ENDLESS_EVENTS.find((e) => e.id === mail.meta);
    ev?.apply(g, idx);
    g.emit('corp');
  },
  c6_kartell2: (g, idx) => {
    const f = g.s.story.flags;
    g.s.corp.cash -= 60e6;
    g.s.corp.perfShock -= 0.05;
    f.kartell_closed = true;
    if (idx === 0) { g.addRep(-6); f.kartell_late = true; }
    else {
      g.addRep(-10);
      f.kartell_lied = true;
      g.s.player.warnings++;
      g.mail('c6_kartell_lied');
      if (g.s.player.warnings >= g.diff.warningsLimit) g.triggerGameOver('fired');
    }
    g.emit('corp');
  },
  c5_kartell: (g, idx) => {
    if (idx === 0) {
      g.s.story.flags.kartell_confessed = true;
      g.addRep(-4);
      g.shareShock(-0.08);
      g.mail('c5_kartell_result');
      g.dialog('kessler_kartell');
    } else {
      g.s.story.flags.kartell_denied = true;
    }
  },
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
  kessler_wette: (g, idx) => {
    const f = g.s.story.flags;
    f.net_bet = true;
    f.net_all = idx === 0;
    g.s.net.invest = idx === 0 ? 20000000 : 8000000;
    g.emit('net');
  },
  rau_partner: (g, idx) => {
    if (idx === 0) {
      g.s.story.flags.orion_partner = true;
      g.s.net.subs += 3000;
      g.addRep(1);
    }
    g.emit('net');
  },
  kessler_sitzung: (g, idx) => {
    const f = g.s.story.flags;
    const arg = ['zahlen', 'vision', 'kompromiss'][idx];
    const won = g.voteScore(arg) >= 3;
    let extra = 0;
    if (won) {
      f.vote_won = true;
      extra = arg === 'kompromiss' ? 4000000 : 12000000;
      g.s.net.invest += extra;
      g.addRep(2);
    } else {
      f.vote_retry = t(g).totalMonths + 4;
      g.s.net.frozenUntil = t(g).totalMonths + 4;
      delete g.s.story.fired.c5_vote; // nächste Sitzung später
    }
    g.mail('c5_vote_result', { won, extra });
    g.emit('net');
  },
  sauer_neuer_markt: (g, idx) => { if (idx === 1) g.s.story.flags.sauer_rebuffed = true; },
  kessler_blase: (g, idx) => {
    if (idx === 0) { g.s.story.flags.bubble_aware = true; g.addRep(1); }
    else g.s.story.flags.bubble_believer = true;
  },
  sauer_krise: (g, idx) => {
    const f = g.s.story.flags, c = g.s.corp;
    if (idx === 0) {
      f.job_cuts = true;
      c.legacyBoost += 4e6;
      g.addRep(-4);
      g.s.team.members.forEach((m) => g.changeMorale(m, -15));
    } else if (idx === 1) {
      f.salary_cut = true;
      c.legacyBoost += 1e6;
      g.s.player.salaryBonus = (g.s.player.salaryBonus || 0) - 0.2;
      g.addRep(3);
    } else f.hold_out = true;
    g.emit('corp');
  },
  kessler_ceo: (g) => {
    if (g.s.story.flags.salary_cut) g.s.player.salaryBonus = (g.s.player.salaryBonus || 0) + 0.2; // Verzicht endet
    g.promote();
    g.mail('promotion_ceo');
  },
  rau_bid: (g) => { g.startTakeover(); g.mail('c7_bid_news'); g.emit('takeover'); },
  kessler_ch7: (g, idx) => { if (idx === 0) g.s.story.flags.kessler_backs = true; else g.addRep(1); g.emit('takeover'); },
  sauer_turn: (g) => { g.s.story.flags.sauer_turned = true; g.emit('takeover'); },
  hayashi_call: (g, idx) => { if (idx === 0) g.s.story.flags.knight = true; g.emit('takeover'); },
  kessler_final: (g) => {
    g.s.story.flags.endless = true;
    if (g.s.story.flags.orion_bought) g.s.story.flags.orion_gone = true;
    g.emit('chapter', 8);
    g.emit('change');
  },
  kessler_vorstand: (g) => {
    g.promote();
    g.mail('promotion_vorstand');
  },
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

// ---------------------------------------------------------------- Endlosmodus: Zufallsereignisse
// Erscheinen nach dem Finale mit etwa 30 % Wahrscheinlichkeit pro Monat als Mail mit zwei Entscheidungen.
const cash = (g, v) => { g.s.corp.cash += v; };
export const ENDLESS_EVENTS = [
  { id: 'cyber', subject: 'Cyberangriff auf KB-Net',
    body: () => 'Unbekannte haben sich Zugang zu den Servern von KB-Net verschafft. Die IT will das Netz für zwei Tage abschalten, um die Lücke zu schließen.',
    choices: (g) => [`Abschalten und reparieren (${fmtDM(20e6)})`, 'Weiterlaufen lassen und leise flicken'],
    apply: (g, i) => { if (i === 0) { cash(g, -20e6); g.addRep(1); } else { g.addRep(-3); g.shareShock(-0.05); } } },
  { id: 'staat', subject: 'Großauftrag vom Bund',
    body: () => 'Das Bundesfinanzministerium sucht einen Partner für ein neues Rechenzentrum. Die Konkurrenz wirft KB vor, zu gute Kontakte nach Berlin zu haben.',
    choices: (g) => [`Annehmen (+${fmtDM(120e6)})`, 'Ablehnen, um Ärger zu vermeiden'],
    apply: (g, i) => { if (i === 0) { cash(g, 120e6); g.addRep(-1); } else g.addRep(1); } },
  { id: 'chips', subject: 'Chipmangel',
    body: () => 'Ein Erdbeben in Asien hat eine wichtige Chipfabrik lahmgelegt. Der Einkauf kann Ersatz beschaffen, aber nur zu Wucherpreisen.',
    choices: (g) => [`Teuer nachkaufen (${fmtDM(40e6)})`, 'Produktion drosseln'],
    apply: (g, i) => { if (i === 0) cash(g, -40e6); else { g.shareShock(-0.04); g.s.corp.perfShock -= 0.03; } } },
  { id: 'startup', subject: 'Ein Startup klopft an',
    body: () => 'Drei Absolventinnen aus Darmstadt haben eine Software gebaut, mit der Rechenzentren ein Drittel weniger Strom verbrauchen. Sie wollen verkaufen.',
    choices: (g) => [`Kaufen (${fmtDM(80e6)})`, 'Ablehnen'],
    apply: (g, i) => { if (i === 0) { cash(g, -80e6); g.s.corp.legacyBoost += 1.5e6; g.addRep(1); g.shareShock(0.03); } } },
  { id: 'daten', subject: 'Datenpanne',
    body: () => 'Durch einen Fehler waren 20.000 Kundendaten von KB-Net eine Nacht lang öffentlich einsehbar. Noch weiß es niemand außerhalb des Hauses.',
    choices: () => ['Öffentlich machen und entschuldigen', 'Schweigen'],
    apply: (g, i) => { if (i === 0) g.addRep(-1); else { g.addRep(-4); g.shareShock(-0.06); } } },
  { id: 'streik', subject: 'Warnstreik im Werk Kassel',
    body: () => 'Die Gewerkschaft fordert 5 % mehr Lohn. Vor dem Werkstor stehen 800 Leute mit Trillerpfeifen.',
    choices: (g) => [`Lohnerhöhung zustimmen (${fmtDM(2e6)} pro Monat)`, 'Hart bleiben'],
    apply: (g, i) => { if (i === 0) { g.s.corp.legacyBoost -= 2e6; g.addRep(2); } else { g.addRep(-3); g.s.team.members.forEach((m) => g.changeMorale(m, -10)); } } },
  { id: 'hype', subject: 'Neuer Technologie-Hype',
    body: () => 'Alle reden von künstlicher Intelligenz. Analysten fragen bei jeder Telefonkonferenz, was KB plant.',
    choices: (g) => [`Großes Forschungsprogramm (${fmtDM(150e6)})`, 'Abwarten'],
    apply: (g, i) => { if (i === 0) { cash(g, -150e6); g.shareShock(0.08); g.s.corp.perfShock += 0.05; } } },
  { id: 'preis', subject: 'Auszeichnung: Arbeitgeber des Jahres',
    body: () => 'Ein Wirtschaftsmagazin hat KB zum Arbeitgeber des Jahres gewählt.',
    choices: (g) => [`Fest für die Belegschaft (${fmtDM(2e6)})`, 'Pressemitteilung'],
    apply: (g, i) => { if (i === 0) { cash(g, -2e6); g.s.team.members.forEach((m) => g.changeMorale(m, 10)); g.addRep(1); } else g.addRep(2); } },
  { id: 'patent', subject: 'Patentklage',
    body: () => 'Eine Firma aus Texas, die nichts herstellt, verklagt KB wegen eines Patents auf „Daten über ein Netzwerk übertragen“.',
    choices: (g) => [`Vergleich (${fmtDM(30e6)})`, 'Vor Gericht kämpfen'],
    apply: (g, i) => { if (i === 0) cash(g, -30e6); else { g.shareShock(-0.02); g.addRep(1); } } },
  { id: 'fabrik', subject: 'Neues Werk in Asien?',
    body: () => 'Die Strategieabteilung schlägt ein Werk in Malaysia vor. Günstiger als Kassel, aber in Kassel wird man das nicht gern hören.',
    choices: (g) => [`Bauen (${fmtDM(300e6)})`, 'Nein, wir bleiben in Kassel'],
    apply: (g, i) => { if (i === 0) { cash(g, -300e6); g.s.corp.legacyBoost += 3.5e6; g.addRep(-2); } else g.addRep(2); } },
];

// ---------------------------------------------------------------- Nebenziele je Karrierestufe
// Freiwillig. Werden jede Sekunde geprüft und sofort belohnt.
const allLines = (g) => Object.values(g.s.lines);
export const SIDE_GOALS = [
  [
    { id: 's0_a', text: 'Schließe einen Monat mit Note A ab', check: (g) => g.s.player.grades.includes('A'), reward: { cash: 150 }, rewardText: '150 DM' },
    { id: 's0_streak', text: '15 Aufträge in Folge ohne Tippfehler', check: (g) => (g.s.player.maxStreak || 0) >= 15, reward: { upgrade: 'lochkarte' }, rewardText: 'Goldene Lochkarte' },
    { id: 's0_rush', text: 'Erledige einen Eilauftrag', check: (g) => (g.s.player.rushes || 0) >= 1, reward: { cash: 200 }, rewardText: '200 DM' },
  ],
  [
    { id: 's1_proj', text: 'Schließe 3 Projekte ab', check: (g) => g.s.projects.done.length >= 3, reward: { cash: 600 }, rewardText: '600 DM' },
    { id: 's1_kurs', text: 'Bilde dich an der Volkshochschule weiter', check: (g) => !!g.s.story.flags.cobol, reward: { rep: 1 }, rewardText: 'Ruf +1' },
    { id: 's1_aktien', text: 'Besitze 60 KB-Aktien', check: (g) => g.s.shares.owned >= 60, reward: { cash: 400 }, rewardText: '400 DM' },
  ],
  [
    { id: 's2_moral', text: 'Alle im Team mit Moral ab 80 %', check: (g) => g.s.team.members.length >= 3 && g.s.team.members.every((m) => m.morale >= 80), reward: { rep: 2 }, rewardText: 'Ruf +2' },
    { id: 's2_q8', text: 'Bring den HC-1 mit Qualität 8 oder besser heraus', check: (g) => g.s.product.quality >= 8, reward: { cash: 1500 }, rewardText: '1.500 DM' },
    { id: 's2_30k', text: 'Verkaufe 30.000 HC-1', check: (g) => g.s.product.units >= 30000, reward: { upgrade: 'hc1modell' }, rewardText: 'Modell des HC-1' },
  ],
  [
    { id: 's3_linien', text: 'Alle drei Produktlinien gleichzeitig im Handel', check: (g) => allLines(g).every((l) => l.model), reward: { cash: 5000 }, rewardText: '5.000 DM' },
    { id: 's3_q10', text: 'Ein Modell mit Qualität 10', check: (g) => allLines(g).some((l) => l.model && l.model.q >= 10), reward: { rep: 2 }, rewardText: 'Ruf +2' },
    { id: 's3_anteil', text: 'Über 40 % aller Käufer einer Linie in einem Monat', check: (g) => allLines(g).some((l) => l.last && l.last.share >= 0.4), reward: { cash: 3000 }, rewardText: '3.000 DM' },
  ],
  [
    { id: 's4_staedte', text: 'Alle 12 Städte an KB-Net angeschlossen', check: (g) => g.s.net.nodes.length >= 12, reward: { cash: 8000 }, rewardText: '8.000 DM' },
    { id: 's4_q8', text: 'KB-Net mit Qualität 8 oder besser', check: (g) => g.netQuality() >= 8, reward: { rep: 2 }, rewardText: 'Ruf +2' },
    { id: 's4_100k', text: '100.000 Kunden bei KB-Net', check: (g) => g.s.net.subs >= 100000, reward: { cash: 10000 }, rewardText: '10.000 DM' },
  ],
  [
    { id: 's5_raus', text: 'Verkaufe eine Beteiligung mit Gewinn', check: (g) => (g.s.corp.sold || []).some((x) => x.got > x.paid), reward: { cash: 20000 }, rewardText: '20.000 DM' },
    { id: 's5_kasse', text: 'Konzernkasse über 1 Mrd. DM', check: (g) => g.s.corp.cash >= 1e9, reward: { cash: 25000 }, rewardText: '25.000 DM' },
    { id: 's5_y2k', text: 'Kein Ausfall zum Jahr 2000', check: (g) => !!g.s.story.flags.y2k_safe, reward: { rep: 2 }, rewardText: 'Ruf +2' },
  ],
  [
    { id: 's6_klar', text: 'Gewinne die Übernahmeschlacht mit Orion unter 30 %', check: (g) => g.s.takeover.done && g.s.takeover.won && g.s.takeover.orion < 30, reward: { cash: 50000 }, rewardText: '50.000 DM' },
    { id: 's6_ausland', text: 'Erschließe den ersten Auslandsmarkt', check: (g) => (g.s.world?.open || []).length >= 1, reward: { upgrade: 'globus' }, rewardText: 'Globus' },
    { id: 's6_zukunft', text: 'Erforsche 3 Zukunftstechnologien', check: (g) => (g.s.rd.futureDone || 0) >= 3, reward: { cash: 100000 }, rewardText: '100.000 DM' },
  ],
];
