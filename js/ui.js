// Oberflächen über dem 3D-Büro: Titel, HUD, Dialoge, Abrechnungen, Hinweise, Game Over.
// Steuert außerdem, wann die Spielzeit läuft.

import { DIFFICULTIES, MONTH_NAMES, STAGES, CHAPTERS, GRADE_COMMENTS, PERKS, perkCost, fmtDM, fmtNum, fmtInt, fmtPct, fmtAt, numAt } from './data.js';
import { PROJECTS } from './story.js';
import { DIALOGS, PEOPLE } from './story.js';
import { Game } from './game.js';
import { PC } from './pc.js';
import { sfx, setSound } from './sound.js';

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
      const typing = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
      if ((e.key === 'p' || e.key === 'P') && !typing && this.game.s && ['desk', 'pc'].includes(this.screen)) { this.togglePause(); return; }
      if (e.key !== 'Escape') return;
      if (this.modalOpen) { this.closeModal(); return; }
      if (this.screen === 'pc') this.closePC();
    });

    game.on('change', () => { this.updateHUD(); this.pc.refreshLive(); });
    game.on('mail', (m) => {
      if (this.screen === 'title') return;
      this.pc.rerender(['post']);
      if (!this.game.offlineMode) { this.toast(`Neue Nachricht: ${m.subject}`, 'mail', () => this.openPC('post')); sfx.mail(); }
    });
    game.on('achievement', (a) => {
      if (this.screen === 'title' || this.game.offlineMode) return;
      this.toast(`Erfolg: ${a.name}`, 'good', () => this.openPC('erf'));
      sfx.achievement();
      this.pc.rerender(['erf']);
    });
    game.on('takeover', () => this.pc.rerender(['abwehr', 'fin', 'karr']));
    game.on('world', () => this.pc.rerender(['welt', 'karr']));
    game.on('rush', (st) => {
      this.pc.rerender(['aufg']);
      if (st === 'start' && !this.game.offlineMode) { this.toast('EILAUFTRAG! Drei Codes in 45 Sekunden', 'bad', () => this.openPC('aufg')); sfx.ring(); }
    });
    game.on('side', (sg) => {
      if (this.game.offlineMode) return;
      this.toast(`Nebenziel erreicht: ${sg.text} · ${sg.rewardText}`, 'good', () => this.openPC('karr'));
      sfx.achievement();
      this.pc.rerender(['karr']);
    });
    $('#hud-decide').addEventListener('click', () => {
      const m = this.game.s?.mails.find((x) => x.choices && x.chosen == null);
      if (m) { this.pc.mailSel = m.uid; this.pc.panes[0] = 'post'; }
      this.openPC('post');
    });
    $('#hud-pause').addEventListener('click', () => this.togglePause());
    $('#hud-rush').addEventListener('click', () => this.openPC('aufg'));
    game.on('upgrade', () => { this.office.setUpgrades(this.game.s.upgrades); this.pc.rerender(['shop', 'karr']); });
    game.on('payslip', ({ slip, offline }) => this.onPayslip(slip, offline));
    game.on('dialog', () => this.nextDialog());
    game.on('toast', ({ text, kind }) => this.toast(text, kind));
    game.on('promotion', () => this.onPromotion());
    game.on('chapter', (no) => this.showChapterIntro(no));
    game.on('projects', () => this.pc.rerender(['proj', 'karr', 'prod']));
    game.on('team', () => { this.pc.rerender(['pers', 'karr']); this.office.setTeam(this.game.s.player.stage, this.game.s.team.members); });
    game.on('product', () => this.pc.rerender(['prod', 'karr', 'proj']));
    game.on('dept', () => this.pc.rerender(['abt', 'fue', 'karr', 'prod']));
    game.on('net', () => this.pc.rerender(['netz', 'karr']));
    game.on('corp', () => this.pc.rerender(['fin', 'karr']));
    game.on('era', () => { this.office.setEra(this.game.era()); if (this.pc.open) this.pc.build(); });
    game.on('gameover', (go) => this.showGameOver(go));
  }

  // Läuft die Spielzeit gerade?
  get running() {
    return (this.screen === 'desk' || this.screen === 'pc') && !this.dialog && !this.paused && this.game.s && !this.game.s.gameOver;
  }

  togglePause() {
    this.paused = !this.paused;
    $('#hud-pause').textContent = this.paused ? 'PAUSE · WEITER MIT [P]' : 'PAUSE [P]';
    $('#hud-pause').classList.toggle('on', this.paused);
    document.body.classList.toggle('paused', this.paused);
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
    $('#title').hidden = false;
    this.confirmDel = null;
    this.renderTitle(newGame);
  }

  renderTitle(newGame = false) {
    const saves = [1, 2, 3].map((n) => Game.readSave(n));
    const any = saves.some(Boolean);
    $('#t-slots').innerHTML = saves.map((sv, i) => {
      const n = i + 1;
      if (!sv) return `<div class="slot empty"><div class="info"><b>Platz ${n}</b>leer</div></div>`;
      const st = STAGES[sv.player.stage] || STAGES[0];
      const del = this.confirmDel === n ? 'Wirklich löschen?' : 'Löschen';
      return `<div class="slot"><div class="info"><b>Platz ${n}</b>${esc(sv.player.name)} · ${esc(st.title)}<br>${MONTH_NAMES[sv.time.month]} ${sv.time.year} · ${esc(DIFFICULTIES[sv.difficulty]?.label || '')}</div>
        <div class="acts"><button type="button" class="btn primary" data-slot-load="${n}">Weiter</button><button type="button" class="btn" data-slot-del="${n}">${del}</button></div></div>`;
    }).join('');
    const firstEmpty = saves.findIndex((x) => !x) + 1 || 1;
    const sel = this.ngSlot || firstEmpty;
    $('#ng-slots').innerHTML = saves.map((sv, i) => `<label><input type="radio" name="ng-slot" value="${i + 1}" ${sel === i + 1 ? 'checked' : ''}> Platz ${i + 1}${sv ? ' (belegt)' : ''}</label>`).join('');
    $('#ng-overwrite').hidden = !saves[sel - 1];
    $('#newgame').classList.toggle('collapsed', any && !newGame);
    // Vermächtnis aus früheren Karrieren
    const l = Game.readLegacy();
    const perkTotal = Object.values(l.perks).reduce((a, b) => a + b, 0);
    $('#ng-perks').hidden = !perkTotal;
    $('#ng-perks').textContent = perkTotal ? `Dein Vermächtnis wirkt: ${PERKS.filter((p) => l.perks[p.id]).map((p) => `${p.name} ${l.perks[p.id]}`).join(', ')}.` : '';
    const box = $('#t-legacy');
    box.hidden = !(l.points > 0 || l.gallery.length);
    if (!box.hidden) {
      box.innerHTML = `<h3><span>Vermächtnis</span><span>${l.points} Punkte</span></h3>
        ${PERKS.map((p) => {
          const lvl = l.perks[p.id] || 0, cost = perkCost(lvl);
          return `<div class="perk"><div>${esc(p.name)} · Stufe ${lvl}/${p.max}<small>${esc(p.desc)}</small></div>
            ${lvl >= p.max ? '<span class="dim">voll</span>' : `<button type="button" class="btn" data-perk="${p.id}" ${l.points < cost ? 'disabled' : ''}>${cost} Punkte</button>`}</div>`;
        }).join('')}
        ${l.gallery.length ? `<h3><span>Ahnengalerie</span></h3><ol>${l.gallery.map((x) => `<li>${esc(x.name)}, bis ${x.until} · ${fmtDM(x.worth)} · ${x.points} Punkte</li>`).join('')}</ol>` : ''}
        <small class="dim">Boni gelten für neue Spiele.</small>`;
    }
  }

  bindTitle() {
    $('#title').addEventListener('click', (e) => {
      const load = e.target.closest('[data-slot-load]');
      if (load) { this.continueGame(Number(load.dataset.slotLoad)); return; }
      const del = e.target.closest('[data-slot-del]');
      if (del) {
        const n = Number(del.dataset.slotDel);
        if (this.confirmDel === n) { Game.deleteSave(n); this.confirmDel = null; } else this.confirmDel = n;
        this.renderTitle(); return;
      }
      const perk = e.target.closest('[data-perk]');
      if (perk && !perk.disabled) { Game.buyPerk(perk.dataset.perk); this.renderTitle(!$('#newgame').classList.contains('collapsed')); }
    });
    $('#ng-slots').addEventListener('change', (e) => { this.ngSlot = Number(e.target.value); this.renderTitle(true); });
    $('#ng-open').addEventListener('click', () => { $('#newgame').classList.remove('collapsed'); $('#ng-name').focus(); });
    $('#newgame').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#ng-name').value.trim() || 'Alex Berger';
      const diff = document.querySelector('input[name="ng-diff"]:checked')?.value || 'normal';
      this.game.slot = Number(document.querySelector('input[name="ng-slot"]:checked')?.value || 1);
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
    if (this.screen === 'title') this.game.slot = Number(document.querySelector('input[name="ng-slot"]:checked')?.value || 1);
    this.game.loadFrom(obj);
    this.game.s.gameOver = null;
    this.game.save();
    this.pc.hide();
    this.enterGame();
    this.toast(`Spielstand geladen (Platz ${this.game.slot})`, 'good');
  }

  continueGame(slot = 1) {
    const save = Game.readSave(slot);
    if (!save) { this.toTitle(true); return; }
    this.game.slot = slot;
    this.game.loadFrom(save);
    const away = (Date.now() - (save.lastSaved || Date.now())) / 1000;
    this.enterGame();
    if (away > 30) {
      const sum = this.game.simulateAway(away);
      this.game.save();
      if (sum && sum.months > 0) this.showAwaySummary(sum);
    }
  }

  // In den Ruhestand: Vermächtnis-Punkte gutschreiben, zurück zum Titel
  retire() {
    const sum = this.game.retire();
    if (!sum) return;
    this.toTitle();
    this.modal(`
      <div class="sheet">
        <div class="eyebrow">Ruhestand</div>
        <h2>Ein Platz in der Ahnengalerie</h2>
        <p>${esc(sum.name)} übergibt die Kessler &amp; Brandt Rechenwerke AG an die nächste Generation. Privatvermögen: ${fmtDM(sum.worth)}.</p>
        <dl class="sheet-dl">
          <dt>Vermächtnis-Punkte</dt><dd>+${sum.points}</dd>
          <dt>Insgesamt</dt><dd>${sum.total}</dd>
        </dl>
        <p class="dim">Gib die Punkte auf dem Titelbildschirm für dauerhafte Boni aus. Sie gelten für jedes neue Spiel.</p>
        <button type="button" class="btn primary" data-close>Zum Titelbildschirm</button>
      </div>`, 'm-sheet');
  }

  enterGame() {
    $('#title').hidden = true;
    $('#gameover').hidden = true;
    this.office.setUpgrades(this.game.s.upgrades);
    this.office.setStage(this.game.s.player.stage);
    this.office.setTeam(this.game.s.player.stage, this.game.s.team.members);
    this.office.setEra(this.game.era());
    setSound(this.game.s.settings.sound !== false);
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
    const board = p.stage >= 5 && g.s.corp.active;
    const last = board ? g.s.corp.history.at(-1)?.result : null;
    $('#hud-perf-label').textContent = board ? 'Konzernergebnis' : 'Leistung';
    $('#hud-perf').textContent = board ? (last != null ? fmtDM(last) : '–') : `${fmtInt(p.perf)} / ${fmtInt(target)}`;
    $('#hud-perf').classList.toggle('neg', board && last < 0);
    $('#hud-perf-bar').style.width = board ? `${Math.max(0, Math.min(100, ((last || 0) / 30e6) * 100))}%` : `${Math.min(100, (p.perf / target) * 100 / 1.5)}%`;
    $('#hud-month-bar').style.width = `${(g.s.time.monthProgress / g.monthSeconds()) * 100}%`;
    const open = g.s.mails.filter((m) => m.choices && m.chosen == null).length;
    $('#hud-decide').hidden = !open;
    $('#hud-rush').hidden = !g.s.rush;
    if (g.s.rush) $('#hud-rush').textContent = `! Eilauftrag ${g.s.rush.idx + 1}/3 · ${Math.ceil(g.s.rush.left)} s`;
    $('#hud-decide').textContent = `! ${open} Entscheidung${open > 1 ? 'en' : ''} offen`;
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
    const d = DIALOGS[id];
    if (this.screen === 'pc' || this.screen === 'zooming') {
      if (!d.phone) this.toast(`${PEOPLE[d.who].name} steht an deinem Platz`, 'mail');
      this.closePC();
    }
    this.dialog = { id, lines: this.game.dialogLines(id), i: 0, who: d.who, phone: !!d.phone };
    this.game.dialogActive = true;
    $('#hint').hidden = true;
    const person = PEOPLE[d.who];
    $('#dlg-name').textContent = person.name;
    $('#dlg-role').textContent = typeof person.role === 'function' ? person.role(this.game) : person.role;
    const open = () => {
      if (!this.dialog || this.dialog.id !== id) return;
      $('#dialog').hidden = false;
      this.showLine();
    };
    if (d.phone) {
      this.office.hideVisitor();
      this.office.visitorWho = null;
      if (this.office.mode === 'phone') { open(); return; }
      // erst klingeln lassen, dann abnehmen
      this.office.setMode('desk');
      this.office.ring(1.6);
      sfx.ring();
      this.toast('Das Telefon klingelt', 'mail');
      setTimeout(() => { if (this.dialog?.id === id) { this.office.setMode('phone'); setTimeout(open, 500); } }, 1600);
      return;
    }
    if (this.office.visitorWho !== d.who) { this.office.showVisitor(d.who); this.office.visitorWho = d.who; }
    this.office.setMode('dialog');
    open();
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
    if (this.game.s.settings.autoPayslip) { this.showPayslip(slip); sfx.print(); }
    else this.toast(`Entgeltabrechnung ${label}: ${fmtDM(slip.netto)} netto`, 'good', () => this.showPayslip(slip));
  }

  showPayslip(sl) {
    const p = this.game.s.player;
    const row = (label, val, cls = '') => `<tr class="${cls}"><td>${label}</td><td class="r">${numAt(val, sl.year)}</td></tr>`;
    const unit = sl.year >= 2002 ? '€' : 'DM';
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
            <thead><tr><th>Bezüge</th><th class="r">${unit}</th></tr></thead>
            <tbody>
              ${row('Grundgehalt', sl.base)}
              ${(sl.extras || []).map((e) => row(esc(e.label), e.amount)).join('')}
              ${sl.zulage ? row(`Leistungszulage (Note ${sl.grade})`, sl.zulage) : ''}
              ${sl.xmas ? row('Weihnachtsgeld', sl.xmas) : ''}
              ${sl.kuerzung ? row('Gehaltskürzung', -sl.kuerzung) : ''}
              ${row('Gesamtbrutto', sl.brutto, 'sum')}
            </tbody>
            <thead><tr><th>Abzüge</th><th class="r">${unit}</th></tr></thead>
            <tbody>
              ${row('Lohnsteuer', -sl.lst)}
              ${row('Rentenversicherung 9,0 %', -sl.rv)}
              ${row('Krankenversicherung 5,7 %', -sl.kv)}
              ${row('Arbeitslosenversicherung 1,5 %', -sl.av)}
            </tbody>
          </table>
          <div class="slip-net"><span>Auszahlungsbetrag</span><b>${fmtAt(sl.netto, sl.year)}</b></div>
          <div class="slip-bank">Überweisung auf Girokonto · abzüglich Lebenshaltung ${fmtAt(sl.living, sl.year)}${sl.dispo ? ` · Dispozinsen ${fmtAt(sl.dispo, sl.year)}` : ''} · neuer Kontostand ${fmtAt(sl.cashAfter, sl.year)}</div>
          <div class="slip-grade grade-${sl.grade}">
            <span class="stamp">${sl.grade}</span>
            <div>${sl.board != null
              ? `Beurteilung durch den Aufsichtsrat: Konzernergebnis ${fmtAt(sl.board, sl.year)}<br><i>„${GRADE_COMMENTS[sl.grade]}“</i> Für den Aufsichtsrat`
              : `Leistungsbeurteilung: ${fmtInt(sl.perf)} von ${fmtInt(sl.target)} Punkten (${fmtPct(sl.ratio)})<br><i>„${GRADE_COMMENTS[sl.grade]}“</i> W. Hoff`}</div>
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

  // Kapitelabschluss bei Beförderung, danach Intro des nächsten Kapitels (falls spielbar)
  onPromotion() {
    this.office.setStage(this.game.s.player.stage);
    this.office.setTeam(this.game.s.player.stage, this.game.s.team.members);
    this.office.setEra(this.game.era());
    this.pc.rerender();
    this.updateHUD();
    const s = this.game.s, f = s.story.flags, stage = s.player.stage;
    const done = CHAPTERS[stage - 1], next = CHAPTERS[stage];
    const stats = stage === 1 ? `
          <dt>Aufträge bearbeitet</dt><dd>${fmtInt(s.player.tasksDone)}</dd>
          <dt>KB-Aktien</dt><dd>${fmtInt(s.shares.owned)}</dd>
          <dt>Ruf</dt><dd>${s.player.rep}</dd>
          <dt>Deine Antwort an Kessler</dt><dd>${f.vision_pc ? 'Ein Computer auf jedem Schreibtisch' : 'Großrechner bleiben das Rückgrat'}</dd>` : `
          <dt>Projekte abgeschlossen</dt><dd>${s.projects.done.length}</dd>
          <dt>Ideenwettbewerb</dt><dd>${f.wb_choice ? esc(PROJECTS[f.wb_choice].name) : '–'}${f.wb_late ? ' (zu spät)' : ' (Pokal)'}</dd>
          <dt>Angebot aus Frankfurt</dt><dd>${f.negotiated ? 'als Druckmittel genutzt (+12 % Gehalt)' : 'abgelehnt'}</dd>
          <dt>KB-Aktien</dt><dd>${fmtInt(s.shares.owned)}</dd>
          <dt>Ruf</dt><dd>${s.player.rep}</dd>`;
    const stats3 = `
          <dt>HC-1 verkauft</dt><dd>${fmtInt(s.product.units)} Geräte</dd>
          <dt>Umsatz</dt><dd>${fmtDM(s.product.revenue)}</dd>
          <dt>Qualität</dt><dd>${s.product.quality}/10</dd>
          <dt>Team</dt><dd>${s.team.members.map((m) => esc(m.name)).join(', ')}</dd>
          <dt>Uwe</dt><dd>${f.uwe_compromise ? 'Kompromiss mit Großrechner-Schnittstelle' : f.uwe_overruled ? 'überstimmt' : '–'}</dd>`;
    const lineUnits = Object.values(s.lines).reduce((a, l) => a + l.units, 0);
    const stats4 = `
          <dt>Technologien</dt><dd>${s.rd.done.length} erforscht</dd>
          <dt>Geräte verkauft</dt><dd>${fmtInt(lineUnits)}</dd>
          <dt>Bester Monat</dt><dd>${fmtDM(Math.max(0, s.dept.best))}</dd>
          <dt>PC-Standard</dt><dd>${f.pc_compat ? 'kompatibel' : 'eigener KB-Standard'}</dd>
          <dt>Orion</dt><dd>${f.rau_deal ? 'Absprache mit Rau' : f.price_war ? 'Preiskrieg' : '–'}</dd>`;
    const stats5 = `
          <dt>KB-Net</dt><dd>${fmtInt(s.net.subs)} Kunden in ${s.net.nodes.length} Städten</dd>
          <dt>Netz-Wette</dt><dd>${f.net_all ? '20 Mio. DM, alles gesetzt' : '8 Mio. DM, vorsichtig'}</dd>
          <dt>Vorstand</dt><dd>${f.vote_won ? 'Abstimmung gewonnen' : '–'}</dd>
          <dt>Kartellamt</dt><dd>${f.kartell_confessed ? 'Absprache offengelegt' : f.kartell_denied ? 'Absprache bestritten' : 'nicht betroffen'}</dd>
          <dt>Orion</dt><dd>${f.orion_partner ? 'OrionLine übernommen' : 'Konkurrent'}</dd>`;
    const sold = (s.corp.sold || []).reduce((a, x) => a + x.got - x.paid, 0);
    const stats6 = `
          <dt>Konzernkasse</dt><dd>${fmtDM(s.corp.cash)}</dd>
          <dt>KB-Aktie</dt><dd>${fmtDM(s.shares.price)}</dd>
          <dt>Neuer Markt</dt><dd>${s.corp.owned.length ? `${s.corp.owned.length} Beteiligung(en) gehalten` : 'keine Beteiligungen'}${s.corp.sold?.length ? `, Verkäufe ${sold >= 0 ? '+' : ''}${fmtDM(sold)}` : ''}</dd>
          <dt>KB-Net</dt><dd>${f.net_ipo ? `Börsengang: ${fmtDM(f.net_ipo.value)}` : 'zu 100 % bei KB'}</dd>
          <dt>Krise</dt><dd>${f.job_cuts ? '2.000 Stellen abgebaut' : f.salary_cut ? 'Gehaltsverzicht des Vorstands' : 'durchgehalten ohne Einschnitte'}</dd>`;
    let nextHtml;
    if (next?.intro) {
      f[`seen_ch${next.no}`] = true;
      nextHtml = `<div class="eyebrow next">Kapitel ${next.no}</div><h2>${esc(next.title)}</h2><p>${esc(next.intro)}</p>`;
    } else {
      nextHtml = `<p class="dim">Kapitel ${next.no} („${esc(next.title)}“) folgt in der nächsten Version. Bis dahin kannst du als ${esc(this.game.stage.title)} mit höherem Monatsziel endlos weiterspielen. Neue Projekte findest du laufend im Programm PROJ.</p>`;
    }
    this.modal(`
      <div class="sheet">
        <div class="eyebrow">Kapitel ${done.no} abgeschlossen · ${esc(done.title)}</div>
        <p>Nach ${this.tenureText()} bei KB bist du jetzt <b>${esc(this.game.stage.title)}</b>. Grundgehalt: ${fmtDM(this.game.stage.salary * (1 + (s.player.salaryBonus || 0)))}.</p>
        <dl class="sheet-dl">${stage === 6 ? stats6 : stage === 5 ? stats5 : stage === 4 ? stats4 : stage === 3 ? stats3 : stats}</dl>
        ${nextHtml}
        <button type="button" class="btn primary" data-close>Weiterarbeiten</button>
      </div>`, 'm-sheet');
  }

  showEndless() {
    const s = this.game.s, f = s.story.flags;
    const worth = s.player.cash + s.shares.owned * s.shares.price;
    this.modal(`
      <div class="sheet">
        <div class="eyebrow">Kapitel 7 abgeschlossen · Die Übernahme</div>
        <h2>KB gehört sich selbst</h2>
        <p>${f.orion_bought ? 'Du hast Orion gekauft, statt gekauft zu werden.' : `Orion ist mit ${fmtInt(s.takeover.orion)} % gescheitert.`} Heinrich Kessler verabschiedet sich. Nach ${this.tenureText()} bei KB ist das Haus deins.</p>
        <dl class="sheet-dl">
          <dt>Treue Aktionäre</dt><dd>${fmtNum(this.game.loyalTotal())} %</dd>
          <dt>Weißer Ritter</dt><dd>${f.knight ? 'Hayashi Denki' : 'keiner'}</dd>
          <dt>Dr. Sauer</dt><dd>${f.sauer_turned ? 'hat dir geholfen' : f.sauer_fired ? 'entlassen' : 'blieb im Hintergrund'}</dd>
          <dt>Privatvermögen</dt><dd>${fmtDM(worth)}</dd>
          <dt>Erfolge</dt><dd>${Object.keys(s.achievements).length}</dd>
        </dl>
        <div class="eyebrow next">Endlosmodus</div>
        <p>Die Geschichte ist erzählt, das Spiel geht weiter: neue Projekte, Produktgenerationen, Konkurrenz und jeden Monat mögliche Ereignisse, über die du als CEO entscheidest.</p>
        <button type="button" class="btn primary" data-close>Weiterführen</button>
      </div>`, 'm-sheet');
  }

  // Zeit seit Eintritt im September 1978 (berücksichtigt Zeitsprünge zwischen Kapiteln)
  tenureText() {
    const t = this.game.s.time;
    const months = Math.max(1, (t.year - 1978) * 12 + t.month - 8);
    if (months < 24) return `${months} Monat${months === 1 ? '' : 'en'}`;
    return `${Math.floor(months / 12)} Jahren`;
  }

  showChapterIntro(no) {
    if (no === 8) { this.showEndless(); return; }
    const ch = CHAPTERS[no - 1];
    if (!ch?.intro) return;
    this.modal(`
      <div class="sheet">
        <div class="eyebrow">Kapitel ${ch.no}</div>
        <h2>${esc(ch.title)}</h2>
        <p>${esc(ch.intro)}</p>
        <button type="button" class="btn primary" data-close>Los geht's</button>
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
    $('#go-letter').innerHTML = go.reason === 'uebernommen' ? `
      <p class="r">Frankfurt, ${esc(go.date)}</p>
      <p><b>Mitteilung der Orion Datentechnik AG</b></p>
      <p>${esc(s.player.name)},</p>
      <p>Orion hält mehr als 50 % der Stimmrechte an der Kessler &amp; Brandt Rechenwerke AG. Der neue Aufsichtsrat hat Sie heute als Vorstandsvorsitzenden abberufen. Ihr Nachfolger ist Dr. Hartwig Sauer.</p>
      <p>Mit freundlichen Grüßen<br>Dr. Viktor Rau</p>` : go.reason === 'abberufen' ? `
      <p class="r">Kassel, ${esc(go.date)}</p>
      <p><b>Abberufung aus dem Vorstand</b></p>
      <p>${esc(s.player.name)},</p>
      <p>die Konzernkasse der Kessler &amp; Brandt Rechenwerke AG war drei Monate in Folge im Minus. Der Aufsichtsrat hat Sie in seiner heutigen Sitzung mit sofortiger Wirkung als Mitglied des Vorstands abberufen.</p>
      <p>Für den Aufsichtsrat</p>` : `
      <p class="r">Kassel, ${esc(go.date)}</p>
      <p><b>Kündigung des Arbeitsverhältnisses</b></p>
      <p>${esc(s.player.name)},</p>
      <p>nach wiederholten Abmahnungen kündigen wir das mit Ihnen bestehende Arbeitsverhältnis zum Monatsende. Bitte geben Sie Ihren Hausausweis beim Pförtner ab.</p>
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
