// Oberflächen über dem 3D-Büro: Titel, HUD, Dialoge, Abrechnungen, Hinweise, Game Over.
// Steuert außerdem, wann die Spielzeit läuft.

import { DIFFICULTIES, MONTH_NAMES, STAGES, GRADE_COMMENTS, fmtDM, fmtNum, fmtInt, fmtPct } from './data.js';
import { DIALOGS, PEOPLE } from './story.js';
import { Game } from './game.js';
import { PC } from './pc.js';

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export class UI {
  constructor(game, office) {
    this.game = game;
    this.office = office;
    this.screen = 'title';
    this.dialog = null;
    this.modalQueue = [];
    this.modalOpen = false;
    this.pc = new PC($('#pc'), game, this);

    office.onMonitorClick = () => this.openPC();
    $('#pc-exit').addEventListener('click', () => this.closePC());
    $('#hint').addEventListener('click', () => this.openPC());
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (this.modalOpen) { this.closeModal(); return; }
      if (this.screen === 'pc') this.closePC();
    });

    game.on('change', () => { this.updateHUD(); this.pc.refreshLive(); });
    game.on('mail', (m) => {
      if (this.screen === 'title') return;
      this.pc.rerender(['post']);
      if (!this.game.offlineMode) this.toast(`Neue Nachricht: ${m.subject}`, 'mail', () => this.openPC('post'));
    });
    game.on('upgrade', () => { this.office.setUpgrades(this.game.s.upgrades); this.pc.rerender(['shop', 'karr']); });
    game.on('payslip', ({ slip, offline }) => this.onPayslip(slip, offline));
    game.on('dialog', () => this.nextDialog());
    game.on('toast', ({ text, kind }) => this.toast(text, kind));
    game.on('promotion', () => this.onPromotion());
    game.on('gameover', (go) => this.showGameOver(go));
  }

  // Läuft die Spielzeit gerade?
  get running() {
    return (this.screen === 'desk' || this.screen === 'pc') && !this.dialog && this.game.s && !this.game.s.gameOver;
  }

  // ------------------------------------------------------------ Titelbildschirm
  toTitle(newGame = false) {
    this.screen = 'title';
    this.pc.hide();
    this.closeDialogBox();
    this.office.hideVisitor();
    this.office.setMode('title');
    $('#hud').hidden = true;
    $('#hint').hidden = true;
    $('#gameover').hidden = true;
    const save = Game.readSave();
    const t = $('#title');
    t.hidden = false;
    const contBox = $('#t-continue');
    if (save && !newGame) {
      const st = STAGES[save.player.stage] || STAGES[0];
      contBox.hidden = false;
      $('#t-continue-info').textContent = `${save.player.name} · ${st.title} · ${MONTH_NAMES[save.time.month]} ${save.time.year}`;
    } else {
      contBox.hidden = true;
    }
    $('#ng-overwrite').hidden = !save;
    $('#newgame').classList.toggle('collapsed', !!save && !newGame);
  }

  bindTitle() {
    $('#t-continue-btn').addEventListener('click', () => this.continueGame());
    $('#ng-open').addEventListener('click', () => { $('#newgame').classList.remove('collapsed'); $('#ng-name').focus(); });
    $('#newgame').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#ng-name').value.trim() || 'Alex Berger';
      const diff = document.querySelector('input[name="ng-diff"]:checked')?.value || 'normal';
      this.game.newGame(name, diff);
      this.enterGame();
    });
    $('#t-import-btn').addEventListener('click', () => this.importFromText($('#t-import').value));
    $('#t-import-file').addEventListener('change', (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => this.importFromText(String(r.result));
      r.readAsText(f);
    });
    $('#go-new').addEventListener('click', () => this.toTitle(true));
  }

  importFromText(text) {
    try {
      this.importSave(Game.parseCode(text));
    } catch {
      $('#t-import-msg').textContent = 'Der Code ist ungültig. Bitte den vollständigen Exportcode einfügen.';
    }
  }

  importSave(obj) {
    this.game.loadFrom(obj);
    this.game.s.gameOver = null;
    this.game.save();
    this.pc.hide();
    this.enterGame();
    this.toast('Spielstand geladen', 'good');
  }

  continueGame() {
    const save = Game.readSave();
    if (!save) { this.toTitle(true); return; }
    this.game.loadFrom(save);
    const away = (Date.now() - (save.lastSaved || Date.now())) / 1000;
    this.enterGame();
    if (away > 30) {
      const sum = this.game.simulateAway(away);
      this.game.save();
      if (sum && sum.months > 0) this.showAwaySummary(sum);
    }
  }

  enterGame() {
    $('#title').hidden = true;
    $('#gameover').hidden = true;
    this.office.setUpgrades(this.game.s.upgrades);
    this.screen = 'desk';
    this.office.setMode('desk');
    $('#hud').hidden = false;
    this.updateHUD();
    this.updateHint();
    this.game.checkStory();
    if (this.game.s.dialogQueue.length) this.nextDialog();
  }

  // ------------------------------------------------------------ PC
  openPC(app) {
    if (this.screen !== 'desk' || this.dialog) return;
    this.screen = 'zooming';
    $('#hint').hidden = true;
    $('#hud').classList.add('faded');
    this.office.setMode('pc', () => {
      if (this.screen !== 'zooming') return;
      this.screen = 'pc';
      this.pc.show(app);
    });
  }

  closePC() {
    if (this.screen !== 'pc' && this.screen !== 'zooming') return;
    this.pc.hide();
    this.screen = 'desk';
    this.office.setMode('desk');
    $('#hud').classList.remove('faded');
    this.updateHint();
  }

  refocusPC() { this.office.setUpgrades(this.game.s.upgrades); this.pc.focusInput(); }

  updateHint() {
    $('#hint').hidden = this.screen !== 'desk' || !!this.dialog;
  }

  // ------------------------------------------------------------ HUD
  updateHUD() {
    const g = this.game;
    if (!g.s || this.screen === 'title') return;
    const p = g.s.player;
    const target = g.target();
    $('#hud-date').textContent = g.dateText();
    $('#hud-role').textContent = `${g.stage.title} · ${g.stage.dept}`;
    $('#hud-cash').textContent = fmtDM(p.cash);
    $('#hud-cash').classList.toggle('neg', p.cash < 0);
    $('#hud-perf').textContent = `${fmtInt(p.perf)} / ${fmtInt(target)}`;
    $('#hud-perf-bar').style.width = `${Math.min(100, (p.perf / target) * 100 / 1.5)}%`;
    $('#hud-month-bar').style.width = `${(g.s.time.monthProgress / 60) * 100}%`;
    const u = g.unreadCount();
    $('#hud-mail').textContent = u ? `${u} neue Nachricht${u > 1 ? 'en' : ''}` : 'Keine neuen Nachrichten';
    $('#hud-mail').classList.toggle('has', u > 0);
    this.office.setScreenInfo({
      date: `${String(g.day()).padStart(2, '0')}.${String(g.s.time.month + 1).padStart(2, '0')}.${g.s.time.year}`,
      unread: u, perf: p.perf, target, cash: p.cash,
      price: g.s.shares.price, owned: g.s.shares.owned, history: g.s.shares.history,
    });
  }

  // ------------------------------------------------------------ Dialoge
  nextDialog() {
    if (this.dialog || this.modalOpen || this.screen === 'title' || this.game.s.gameOver) return;
    const id = this.game.s.dialogQueue[0];
    if (!id) return;
    if (this.screen === 'pc' || this.screen === 'zooming') {
      this.toast(`${PEOPLE[DIALOGS[id].who].name} steht an deinem Platz`, 'mail');
      this.closePC();
    }
    const d = DIALOGS[id];
    this.dialog = { id, lines: this.game.dialogLines(id), i: 0, who: d.who };
    this.game.dialogActive = true;
    if (this.office.visitorWho !== d.who) { this.office.showVisitor(d.who); this.office.visitorWho = d.who; }
    this.office.setMode('dialog');
    $('#hint').hidden = true;
    const person = PEOPLE[d.who];
    $('#dlg-name').textContent = person.name;
    $('#dlg-role').textContent = person.role;
    $('#dialog').hidden = false;
    this.showLine();
  }

  showLine() {
    const dlg = this.dialog;
    const text = dlg.lines[dlg.i];
    const last = dlg.i === dlg.lines.length - 1;
    const el = $('#dlg-text');
    el.textContent = '';
    clearInterval(this.typer);
    let k = 0;
    dlg.typing = true;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finish = () => { clearInterval(this.typer); el.textContent = text; dlg.typing = false; this.showDialogButtons(last); };
    if (reduce) { finish(); return; }
    this.typer = setInterval(() => {
      k += 2;
      el.textContent = text.slice(0, k);
      if (k >= text.length) finish();
    }, 22);
    dlg.finish = finish;
    $('#dlg-actions').innerHTML = '';
  }

  showDialogButtons(last) {
    const box = $('#dlg-actions');
    const d = DIALOGS[this.dialog.id];
    if (!last) {
      box.innerHTML = '<button type="button" class="btn" data-dlg="next">Weiter ▸</button>';
    } else {
      box.innerHTML = d.choices.map((c, i) => `<button type="button" class="btn ${d.choices.length > 1 ? 'choice' : ''}" data-dlg="choice" data-idx="${i}">${esc(c)}</button>`).join('');
    }
    box.querySelector('button')?.focus();
  }

  bindDialog() {
    $('#dialog').addEventListener('click', (e) => {
      const dlg = this.dialog;
      if (!dlg) return;
      if (dlg.typing) { dlg.finish(); return; }
      const b = e.target.closest('[data-dlg]');
      if (!b) return;
      if (b.dataset.dlg === 'next') { dlg.i++; this.showLine(); return; }
      const idx = Number(b.dataset.idx);
      const id = dlg.id;
      this.dialog = null;
      this.game.dialogActive = false;
      this.closeDialogBox();
      this.game.finishDialog(id, idx); // kann einen Folgedialog einreihen
      if (!this.dialog) {
        this.office.hideVisitor();
        this.office.visitorWho = null;
        if (this.screen !== 'title') { this.office.setMode('desk'); this.updateHint(); }
        this.flushModals();
      }
    });
  }

  closeDialogBox() {
    clearInterval(this.typer);
    $('#dialog').hidden = true;
  }

  // ------------------------------------------------------------ Modale Fenster
  modal(html, cls = '') {
    this.modalQueue.push({ html, cls });
    this.flushModals();
  }

  flushModals() {
    if (this.modalOpen || this.dialog || !this.modalQueue.length) return;
    const { html, cls } = this.modalQueue.shift();
    const m = $('#modal');
    m.className = 'modal ' + cls;
    m.innerHTML = html;
    m.hidden = false;
    this.modalOpen = true;
    m.querySelector('[data-close]')?.focus();
    m.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => this.closeModal()));
  }

  closeModal() {
    const m = $('#modal');
    m.hidden = true;
    m.innerHTML = '';
    this.modalOpen = false;
    if (this.screen === 'pc') this.pc.focusInput();
    setTimeout(() => {
      this.flushModals();
      if (!this.modalOpen && this.game.s?.dialogQueue.length) this.nextDialog();
    }, 120);
  }

  onPayslip(slip, offline) {
    if (offline || this.screen === 'title') return;
    this.pc.rerender(['lohn', 'karr']);
    if (this.game.s.gameOver) return;
    const label = `${MONTH_NAMES[slip.month]} ${slip.year}`;
    if (this.game.s.settings.autoPayslip) this.showPayslip(slip);
    else this.toast(`Entgeltabrechnung ${label}: ${fmtDM(slip.netto)} netto`, 'good', () => this.showPayslip(slip));
  }

  showPayslip(sl) {
    const p = this.game.s.player;
    const row = (label, val, cls = '') => `<tr class="${cls}"><td>${label}</td><td class="r">${fmtNum(val)}</td></tr>`;
    const html = `
      <div class="slip" role="dialog" aria-label="Entgeltabrechnung ${MONTH_NAMES[sl.month]} ${sl.year}">
        <div class="slip-paper">
          <header class="slip-head">
            <div><b>KESSLER &amp; BRANDT RECHENWERKE AG</b><br>Lohnbuchhaltung · Kassel</div>
            <div class="r">ENTGELTABRECHNUNG<br><b>${MONTH_NAMES[sl.month].toUpperCase()} ${sl.year}</b></div>
          </header>
          <div class="slip-meta">
            <span>Pers.-Nr. ${esc(p.pnr)}</span><span>${esc(p.name)}</span>
            <span>${esc(sl.title)}, ${esc(sl.dept)}</span><span>Steuerklasse I</span>
          </div>
          <table class="slip-table">
            <thead><tr><th>Bezüge</th><th class="r">DM</th></tr></thead>
            <tbody>
              ${row('Grundgehalt', sl.base)}
              ${sl.zulage ? row(`Leistungszulage (Note ${sl.grade})`, sl.zulage) : ''}
              ${sl.xmas ? row('Weihnachtsgeld', sl.xmas) : ''}
              ${sl.kuerzung ? row('Gehaltskürzung', -sl.kuerzung) : ''}
              ${row('Gesamtbrutto', sl.brutto, 'sum')}
            </tbody>
            <thead><tr><th>Abzüge</th><th class="r">DM</th></tr></thead>
            <tbody>
              ${row('Lohnsteuer', -sl.lst)}
              ${row('Rentenversicherung 9,0 %', -sl.rv)}
              ${row('Krankenversicherung 5,7 %', -sl.kv)}
              ${row('Arbeitslosenversicherung 1,5 %', -sl.av)}
            </tbody>
          </table>
          <div class="slip-net"><span>Auszahlungsbetrag</span><b>${fmtDM(sl.netto)}</b></div>
          <div class="slip-bank">Überweisung auf Girokonto · abzüglich Lebenshaltung ${fmtDM(sl.living)}${sl.dispo ? ` · Dispozinsen ${fmtDM(sl.dispo)}` : ''} · neuer Kontostand ${fmtDM(sl.cashAfter)}</div>
          <div class="slip-grade grade-${sl.grade}">
            <span class="stamp">${sl.grade}</span>
            <div>Leistungsbeurteilung: ${fmtInt(sl.perf)} von ${fmtInt(sl.target)} Punkten (${fmtPct(sl.ratio)})<br><i>„${GRADE_COMMENTS[sl.grade]}“</i> W. Hoff</div>
          </div>
        </div>
        <button type="button" class="btn primary" data-close>Abheften</button>
      </div>`;
    this.modal(html, 'm-slip');
  }

  showAwaySummary(sum) {
    const mins = Math.round(sum.seconds / 60);
    const grades = sum.slips.map((s) => s.grade).join(' ');
    this.modal(`
      <div class="sheet">
        <h2>Während du weg warst</h2>
        <p>Du warst ${mins >= 120 ? `${Math.round(mins / 60)} Stunden` : `${mins} Minuten`} weg. Im Büro sind ${sum.months} Monat${sum.months > 1 ? 'e' : ''} vergangen.</p>
        <dl class="sheet-dl">
          <dt>Netto erhalten</dt><dd>${fmtDM(sum.netSum)}</dd>
          <dt>Kontostand verändert</dt><dd>${sum.cashDelta >= 0 ? '+' : ''}${fmtDM(sum.cashDelta)}</dd>
          <dt>Noten</dt><dd>${grades}</dd>
        </dl>
        <p class="dim">Offline zählt nur die Grundleistung. Schlechter als C wird es dabei nicht. Die Abrechnungen liegen im Programm LOHN.</p>
        <button type="button" class="btn primary" data-close>Zurück an den Schreibtisch</button>
      </div>`, 'm-sheet');
  }

  onPromotion() {
    this.pc.rerender();
    this.updateHUD();
    const s = this.game.s;
    const months = s.time.totalMonths;
    this.modal(`
      <div class="sheet">
        <div class="eyebrow">Kapitel 1 abgeschlossen</div>
        <h2>Der erste Tag ist lange her</h2>
        <p>Nach ${months} Monaten bei KB bist du jetzt <b>${esc(this.game.stage.title)}</b>. Grundgehalt: ${fmtDM(this.game.stage.salary)}.</p>
        <dl class="sheet-dl">
          <dt>Aufträge bearbeitet</dt><dd>${fmtInt(s.player.tasksDone)}</dd>
          <dt>KB-Aktien</dt><dd>${fmtInt(s.shares.owned)}</dd>
          <dt>Ruf</dt><dd>${s.player.rep}</dd>
          <dt>Deine Antwort an Kessler</dt><dd>${s.story.flags.vision_pc ? 'Ein Computer auf jedem Schreibtisch' : 'Großrechner bleiben das Rückgrat'}</dd>
        </dl>
        <p class="dim">Kapitel 2 („Lochkarten und Ehrgeiz“) folgt in der nächsten Version. Bis dahin kannst du als Sachbearbeiter mit höherem Monatsziel endlos weiterspielen.</p>
        <button type="button" class="btn primary" data-close>Weiterarbeiten</button>
      </div>`, 'm-sheet');
  }

  showGameOver(go) {
    this.pc.hide();
    this.closeDialogBox();
    this.dialog = null;
    this.modalQueue = [];
    $('#modal').hidden = true;
    $('#modal').innerHTML = '';
    this.modalOpen = false;
    $('#toasts').innerHTML = '';
    this.screen = 'gameover';
    this.office.setMode('title');
    $('#hud').hidden = true;
    $('#hint').hidden = true;
    const s = this.game.s;
    $('#go-letter').innerHTML = `
      <p class="r">Kassel, ${esc(go.date)}</p>
      <p><b>Kündigung des Arbeitsverhältnisses</b></p>
      <p>${esc(s.player.name)},</p>
      <p>nach wiederholten Abmahnungen wegen unzureichender Arbeitsleistung kündigen wir das mit Ihnen bestehende Arbeitsverhältnis zum Monatsende. Bitte geben Sie Ihren Hausausweis beim Pförtner ab.</p>
      <p>Kessler &amp; Brandt Rechenwerke AG<br>Personalabteilung</p>`;
    $('#go-stats').innerHTML = `
      <dt>Höchste Position</dt><dd>${esc(this.game.stage.title)}</dd>
      <dt>Zeit bei KB</dt><dd>${go.months} Monat${go.months === 1 ? '' : 'e'}</dd>
      <dt>Netto verdient</dt><dd>${fmtDM(s.player.totalNet)}</dd>
      <dt>Vermögen</dt><dd>${fmtDM(s.player.cash + s.shares.owned * s.shares.price)}</dd>`;
    $('#gameover').hidden = false;
  }

  // ------------------------------------------------------------ Hinweise
  toast(text, kind = '', onClick = null) {
    const box = $('#toasts');
    const el = document.createElement(onClick ? 'button' : 'div');
    if (onClick) el.type = 'button';
    el.className = `toast ${kind}`;
    el.textContent = text;
    if (onClick) el.addEventListener('click', () => { el.remove(); onClick(); });
    box.appendChild(el);
    while (box.children.length > 4) box.firstChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 4500);
  }

  difficultyCards() {
    return Object.values(DIFFICULTIES).map((d) => `
      <label class="diff">
        <input type="radio" name="ng-diff" value="${d.id}" ${d.id === 'normal' ? 'checked' : ''}>
        <span class="diff-name">${d.label}</span>
        <span class="diff-text">${esc(d.text)}</span>
      </label>`).join('');
  }
}
