// Spiellogik ohne Rendering: Zustand, Tick, Monatsabschluss, Aktien, Speichern.

import {
  SAVE_KEY, SAVE_VERSION, MONTH_SECONDS, OFFLINE_SECONDS_PER_MONTH, OFFLINE_MAX_MONTHS,
  BASE_PASSIVE, TASK_BASE_VALUE, SHARE_DISCOUNT, DIVIDEND_PER_SHARE, DIFFICULTIES, STAGES,
  PLAYABLE_STAGES, UPGRADES, TASKS, WERKE, KUNDEN, DAYS_IN_MONTH, MONTH_NAMES,
} from './data.js';
import { EVENTS, MAILS, DIALOGS, ON_MAIL_CHOICE, ON_DIALOG_DONE, warningVars } from './story.js';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const round2 = (x) => Math.round(x * 100) / 100;

function freshState(name, difficulty) {
  const price = 84.5;
  return {
    version: SAVE_VERSION,
    difficulty,
    created: Date.now(),
    lastSaved: Date.now(),
    time: { year: 1978, month: 8, monthProgress: 0, totalMonths: 0 }, // month 0-basiert: 8 = September
    player: {
      name, pnr: String(Math.floor(rand(1000, 9999))).padStart(6, '0'),
      stage: 0, cash: 600, perf: 0, rep: 0, warnings: 0, goodStreak: 0, goodMonths: 0,
      tasksDone: 0, streak: 0, totalNet: 0, grades: [],
    },
    shares: { price, owned: 0, history: Array.from({ length: 24 }, (_, i) => round2(price * (1 + Math.sin(i / 3) * 0.02 - (24 - i) * 0.001))) },
    upgrades: {},
    mails: [],
    payslips: [],
    story: { fired: {}, flags: {} },
    dialogQueue: [],
    task: null,
    settings: { autoPayslip: true },
    gameOver: null,
  };
}

export class Game {
  constructor() {
    this.s = null;
    this.listeners = {};
    this.offlineMode = false;
    this.shareTimer = 0;
    this.storyTimer = 0;
  }

  on(ev, fn) { (this.listeners[ev] ||= []).push(fn); }
  emit(ev, data) { (this.listeners[ev] || []).forEach((fn) => fn(data)); }

  // ------------------------------------------------------------ Lebenszyklus
  newGame(name, difficulty) {
    this.s = freshState(name.trim() || 'Alex Berger', difficulty);
    this.newTask();
    this.save();
    this.emit('reset');
  }

  loadFrom(obj) {
    if (!obj || typeof obj !== 'object' || !obj.player || !obj.time) throw new Error('Kein gültiger Spielstand.');
    const base = freshState(obj.player.name || 'Alex Berger', obj.difficulty || 'normal');
    // fehlende Felder aus neueren Versionen auffüllen
    this.s = {
      ...base, ...obj,
      time: { ...base.time, ...obj.time }, player: { ...base.player, ...obj.player },
      shares: { ...base.shares, ...obj.shares }, story: { ...base.story, ...obj.story },
      settings: { ...base.settings, ...obj.settings },
    };
    if (!DIFFICULTIES[this.s.difficulty]) this.s.difficulty = 'normal';
    if (!this.s.task) this.newTask();
    this.emit('reset');
  }

  static readSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  save() {
    if (!this.s || this.s.gameOver) return false;
    this.s.lastSaved = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.s)); return true; } catch { return false; }
  }

  static deleteSave() { try { localStorage.removeItem(SAVE_KEY); } catch { /* egal */ } }

  exportCode() {
    this.s.lastSaved = Date.now();
    const json = JSON.stringify(this.s);
    return 'KONZERN1:' + btoa(unescape(encodeURIComponent(json)));
  }

  static parseCode(text) {
    const t = text.trim();
    if (t.startsWith('{')) return JSON.parse(t);
    const body = t.startsWith('KONZERN1:') ? t.slice(9) : t;
    return JSON.parse(decodeURIComponent(escape(atob(body.replace(/\s+/g, '')))));
  }

  // ------------------------------------------------------------ abgeleitete Werte
  get stage() { return STAGES[this.s.player.stage]; }
  get diff() { return DIFFICULTIES[this.s.difficulty]; }
  owned(id) { return !!this.s.upgrades[id]; }

  passiveRate() {
    return UPGRADES.reduce((sum, u) => sum + (this.owned(u.id) ? (u.passive || 0) : 0), BASE_PASSIVE);
  }
  taskMult() {
    return UPGRADES.reduce((m, u) => m + (this.owned(u.id) ? (u.taskMult || 0) : 0), 1);
  }
  streakBonus() { return Math.min(0.5, this.s.player.streak * 0.05); }
  taskValue() { return Math.round(TASK_BASE_VALUE * this.taskMult() * (1 + this.streakBonus())); }
  target() {
    const firstMonth = this.s.time.totalMonths === 0 ? 0.5 : 1;
    return Math.round(this.stage.target * this.diff.target * firstMonth);
  }
  sharePrice() { return this.s.shares.price; }
  employeePrice() { return round2(this.s.shares.price * (1 - SHARE_DISCOUNT)); }
  unreadCount() { return this.s.mails.filter((m) => !m.read).length; }
  day() {
    const t = this.s.time;
    return Math.min(DAYS_IN_MONTH[t.month], 1 + Math.floor((t.monthProgress / MONTH_SECONDS) * DAYS_IN_MONTH[t.month]));
  }
  dateText() { const t = this.s.time; return `${this.day()}. ${MONTH_NAMES[t.month]} ${t.year}`; }
  idle() { return this.s.dialogQueue.length === 0 && !this.dialogActive; }

  // ------------------------------------------------------------ Zeit
  tick(dt) {
    const s = this.s;
    if (!s || s.gameOver) return;
    s.player.perf += this.passiveRate() * dt;
    s.time.monthProgress += dt;

    this.shareTimer += dt;
    while (this.shareTimer >= 10) { this.shareTimer -= 10; this.stepShare(); }

    if (!this.offlineMode) {
      this.storyTimer += dt;
      if (this.storyTimer >= 1) { this.storyTimer = 0; this.checkStory(); }
    }
    while (s.time.monthProgress >= MONTH_SECONDS && !s.gameOver) {
      s.time.monthProgress -= MONTH_SECONDS;
      this.endMonth();
    }
  }

  // Abwesenheit nachrechnen (Tab geschlossen oder im Hintergrund).
  simulateAway(seconds) {
    if (!this.s || this.s.gameOver || seconds < 2) return null;
    const secs = seconds * this.diff.offline;
    const before = { cash: this.s.player.cash, slips: this.s.payslips.length };
    this.offlineMode = true;
    let months = 0;
    if (secs < MONTH_SECONDS * 2) {
      // kurze Abwesenheit: normal weiterlaufen lassen (nur passive Leistung)
      let left = secs;
      while (left > 0) { const step = Math.min(1, left); this.tick(step); left -= step; }
    } else {
      months = Math.min(OFFLINE_MAX_MONTHS, Math.max(1, Math.floor(secs / OFFLINE_SECONDS_PER_MONTH)));
      for (let i = 0; i < months && !this.s.gameOver; i++) {
        const rest = MONTH_SECONDS - this.s.time.monthProgress;
        this.tick(rest + 0.001);
      }
    }
    this.offlineMode = false;
    const slips = this.s.payslips.slice(before.slips);
    return {
      seconds, months: slips.length, slips,
      cashDelta: this.s.player.cash - before.cash,
      netSum: slips.reduce((a, p) => a + p.netto, 0),
    };
  }

  endMonth() {
    const s = this.s, p = s.player, t = s.time, st = this.stage, d = this.diff;
    const target = this.target();
    const ratio = p.perf / target;
    let grade = ratio >= 1.5 ? 'A' : ratio >= 1 ? 'B' : ratio >= 0.7 ? 'C' : 'D';
    if (this.offlineMode && grade === 'D') grade = 'C'; // offline kein Absturz unter C

    const base = st.salary;
    const zulage = grade === 'A' ? base * 0.25 : grade === 'B' ? base * 0.10 : 0;
    const kuerzung = grade === 'D' && d.id === 'leicht' ? base * 0.10 : 0;
    const xmas = t.month === 11 ? base * 0.5 : 0;
    const brutto = round2(base + zulage + xmas - kuerzung);
    // Sozialversicherung 1978 (Arbeitnehmeranteil) mit Beitragsbemessungsgrenzen
    const rv = round2(Math.min(brutto, 3700) * 0.09);
    const av = round2(Math.min(brutto, 3700) * 0.015);
    const kv = round2(Math.min(brutto, 2775) * 0.057);
    const zvE = Math.max(0, brutto - 420);
    const lst = round2(zvE * (0.15 + Math.min(0.27, zvE / 30000)));
    const netto = round2(brutto - rv - av - kv - lst);

    p.cash = round2(p.cash + netto - st.living);
    let dispo = 0;
    if (p.cash < 0) { dispo = round2(p.cash * 0.0095); p.cash = round2(p.cash + dispo); }
    p.totalNet += netto;

    const slip = {
      year: t.year, month: t.month, grade, ratio, perf: Math.round(p.perf), target,
      base, zulage: round2(zulage), xmas: round2(xmas), kuerzung: round2(kuerzung), brutto, rv, av, kv, lst, netto,
      living: st.living, dispo, cashAfter: p.cash, title: st.title, dept: st.dept,
    };
    s.payslips.push(slip);
    if (s.payslips.length > 120) s.payslips.shift();
    p.grades.push(grade);
    if (p.grades.length > 24) p.grades.shift();

    // Bewertung, Ruf, Abmahnungen
    const monthIdx = t.month;
    if (grade === 'A' || grade === 'B') {
      p.goodMonths++; p.goodStreak++;
      this.addRep(grade === 'A' ? 2 : 1, true);
      if (p.warnings > 0 && p.goodStreak >= d.warnDecay) {
        p.warnings--; p.goodStreak = 0;
        this.mail('warning_cleared', { count: p.warnings });
      }
    } else if (grade === 'C') {
      p.goodStreak = 0;
    } else {
      p.goodStreak = 0;
      this.addRep(-2, true);
      if (d.id === 'leicht') {
        this.mail('pay_cut', { ratio, monthName: MONTH_NAMES[monthIdx] });
      } else {
        p.warnings++;
        this.mail('warning', warningVars(this, ratio, monthIdx));
        if (p.warnings >= d.warningsLimit) this.triggerGameOver('fired');
      }
    }

    // Dezember: Dividende
    if (t.month === 11 && s.shares.owned > 0) {
      const total = round2(s.shares.owned * DIVIDEND_PER_SHARE);
      p.cash = round2(p.cash + total);
      this.mail('dividend', { shares: s.shares.owned, perShare: DIVIDEND_PER_SHARE, total });
    }

    // nächster Monat
    p.perf = 0;
    t.month++;
    if (t.month > 11) { t.month = 0; t.year++; }
    t.totalMonths++;
    this.emit('payslip', { slip, offline: this.offlineMode });
    this.emit('change');
  }

  triggerGameOver(reason) {
    const t = this.s.time;
    this.s.gameOver = {
      reason, year: t.year, months: t.totalMonths + 1,
      date: `${DAYS_IN_MONTH[t.month]}. ${MONTH_NAMES[t.month]} ${t.year}`,
    };
    Game.deleteSave();
    this.emit('gameover', this.s.gameOver);
  }

  // ------------------------------------------------------------ Aufträge
  newTask() {
    const tpl = pick(TASKS);
    const n = String(Math.floor(rand(100, 9999))).padStart(4, '0');
    const hard = this.s.player.stage >= 1 && Math.random() < 0.5;
    const code = `${tpl.p}-${n}${hard ? '-' + 'ABCDEFGH'[Math.floor(Math.random() * 8)] : ''}`;
    const title = tpl.t.replace('{n}', n).replace('{w}', pick(WERKE)).replace('{k}', pick(KUNDEN));
    this.s.task = { code, title };
  }

  submitTask(input) {
    const norm = (x) => x.toUpperCase().replace(/[\s\-–_.]/g, '');
    const p = this.s.player;
    if (norm(input) === norm(this.s.task.code)) {
      const value = this.taskValue();
      p.perf += value;
      p.tasksDone++;
      p.streak++;
      const done = this.s.task.code;
      this.newTask();
      this.emit('change');
      return { ok: true, value, code: done };
    }
    p.streak = 0;
    return { ok: false };
  }

  // ------------------------------------------------------------ Aktien & Shop
  stepShare() {
    const sh = this.s.shares;
    const drift = 0.0009 + this.s.player.rep * 0.00002;
    sh.price = round2(Math.max(18, sh.price * Math.exp(drift + 0.013 * gauss())));
    sh.history.push(sh.price);
    if (sh.history.length > 72) sh.history.shift();
  }

  shareShock(pct) {
    const sh = this.s.shares;
    sh.price = round2(sh.price * (1 + pct));
    sh.history.push(sh.price);
  }

  buyShares(n) {
    const p = this.s.player;
    const unit = this.employeePrice();
    if (n === 'max') n = Math.floor(p.cash / unit);
    if (n <= 0 || p.cash < unit * n) return false;
    p.cash = round2(p.cash - unit * n);
    this.s.shares.owned += n;
    this.emit('change');
    return n;
  }

  sellShares(n) {
    const sh = this.s.shares;
    if (n === 'all') n = sh.owned;
    n = Math.min(n, sh.owned);
    if (n <= 0) return false;
    sh.owned -= n;
    this.s.player.cash = round2(this.s.player.cash + n * sh.price * 0.99);
    this.emit('change');
    return n;
  }

  buyUpgrade(id) {
    const u = UPGRADES.find((x) => x.id === id);
    if (!u || this.owned(id) || u.shop === false || this.s.player.cash < u.price) return false;
    this.s.player.cash = round2(this.s.player.cash - u.price);
    this.giveUpgrade(id);
    return true;
  }

  giveUpgrade(id) {
    if (this.s.upgrades[id]) return;
    this.s.upgrades[id] = true;
    const u = UPGRADES.find((x) => x.id === id);
    if (u?.rep) this.addRep(u.rep, true);
    this.emit('upgrade', id);
    this.emit('change');
  }

  addRep(n, silent = false) {
    this.s.player.rep += n;
    if (!silent) this.emit('toast', { text: `Ruf ${n > 0 ? '+' : ''}${n}`, kind: n > 0 ? 'good' : 'bad' });
  }

  // ------------------------------------------------------------ Story
  checkStory() {
    for (const ev of EVENTS) {
      if (this.s.story.fired[ev.id] || this.s.gameOver) continue;
      if (ev.when(this)) {
        this.s.story.fired[ev.id] = true;
        ev.run(this);
      }
    }
  }

  mail(id, vars = {}) {
    const m = MAILS[id];
    const body = typeof m.body === 'function' ? m.body(this, vars) : m.body;
    const mail = {
      uid: `${id}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, id, from: m.from, subject: m.subject, body,
      date: this.dateText(), read: false, choices: m.choices || null, chosen: null,
    };
    this.s.mails.unshift(mail);
    if (this.s.mails.length > 80) this.s.mails.pop();
    this.emit('mail', mail);
    this.emit('change');
  }

  readMail(uid) {
    const m = this.s.mails.find((x) => x.uid === uid);
    if (m && !m.read) { m.read = true; this.emit('change'); }
  }

  chooseMail(uid, idx) {
    const m = this.s.mails.find((x) => x.uid === uid);
    if (!m || m.chosen != null || !m.choices) return;
    m.chosen = idx;
    ON_MAIL_CHOICE[m.id]?.(this, idx);
    this.emit('change');
  }

  dialog(id) {
    this.s.dialogQueue.push(id);
    this.emit('dialog');
  }

  // Wird von der UI aufgerufen, wenn ein Dialog beendet ist.
  finishDialog(id, idx) {
    const i = this.s.dialogQueue.indexOf(id);
    if (i >= 0) this.s.dialogQueue.splice(i, 1);
    ON_DIALOG_DONE[id]?.(this, idx);
    this.emit('change');
    if (this.s.dialogQueue.length) this.emit('dialog');
  }

  dialogLines(id) {
    const d = DIALOGS[id];
    return d.lines.map((l) => (typeof l === 'function' ? l(this) : l)).filter((l) => l != null);
  }

  promote() {
    const p = this.s.player;
    if (p.stage >= PLAYABLE_STAGES - 1) return;
    this.giveUpgrade('urkunde');
    p.stage++;
    p.goodMonths = 0;
    this.emit('promotion', this.stage);
    this.emit('change');
  }
}
