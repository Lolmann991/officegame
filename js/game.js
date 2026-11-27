// Spiellogik ohne Rendering: Zustand, Tick, Monatsabschluss, Aktien, Speichern.

import {
  SAVE_KEY, SAVE_VERSION, MONTH_SECONDS, OFFLINE_SECONDS_PER_MONTH, OFFLINE_MAX_MONTHS,
  BASE_PASSIVE, TASK_BASE_VALUE, SHARE_DISCOUNT, DIVIDEND_PER_SHARE, DIFFICULTIES, STAGES,
  PLAYABLE_STAGES, UPGRADES, TASKS, WERKE, KUNDEN, DAYS_IN_MONTH, MONTH_NAMES, PROJECT_TEMPLATES,
  TEAM_MAX, TEAM_BUDGET, TEAM_RATE_PER_SKILL, DINNER_COST, TRAITS, FIRST_NAMES, LAST_NAMES,
  PRODUCT_SPEC, PRODUCT_BASE_NEED, PRODUCT_BASE_Q, PRODUCT_MARKET, PRODUCT_HYPE, PRODUCT_COMMISSION, ORION_HOME,
  TEAM_MAX_BY_STAGE, RD_FP_PER_DM, TECHS, MARKETING, LINES, DEPT_COMMISSION,
  NET_CITIES, NET_NODE_COST, NET_NODE_UPKEEP, NET_ADOPTION, NET_UPGRADES, NET_COMPETITORS,
  CORP_START_CASH, CORP_SHARES, CORP_LEGACY_RESULT, CORP_LOAN_STEP, CORP_LOAN_RATE, DIVIDEND_POLICIES,
  HYPE_POINTS, ECONOMY_POINTS, STARTUPS,
} from './data.js';
import { EVENTS, MAILS, DIALOGS, ON_MAIL_CHOICE, ON_DIALOG_DONE, ON_PROJECT_DONE, warningVars } from './story.js';

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
      tasksDone: 0, streak: 0, totalNet: 0, grades: [], salaryBonus: 0, pendingBonus: [],
    },
    shares: { price, owned: 0, history: Array.from({ length: 24 }, (_, i) => round2(price * (1 + Math.sin(i / 3) * 0.02 - (24 - i) * 0.001))) },
    upgrades: {},
    projects: { active: null, offered: [], done: [], share: 0.5 },
    team: { members: [], candidates: [], budget: TEAM_BUDGET, nextId: 1, dinnerMonth: -1, moraleMonths: 0, overBudget: 0 },
    lines: Object.fromEntries(Object.keys(LINES).map((id) => [id, { gen: 0, model: null, pending: null, devGen: null, marketing: 0, units: 0, revenue: 0, last: null }])),
    rd: { budget: 25000, pool: 0, current: null, done: [] },
    dept: { history: [], best: 0, posStreak: 0 },
    corp: { active: false, cash: 0, debt: 0, policy: 'mittel', shares: CORP_SHARES, base: 0, startPrice: 0, startIdx: 0, owned: [], offers: [], ipo: false, history: [], negMonths: 0, posAfter: 0, lastIssue: -99, legacyBoost: 0, perfShock: 0, lastDps: 0 },
    net: { invest: 0, nodes: [], qLevel: 0, tariff: 19.9, marketing: 0, subs: 0, history: [], frozenUntil: -1 },
    product: { stage: 'none', spec: { mem: '16', drive: 'kassette', gfx: 'mono' }, quality: 0, price: 1995, units: 0, revenue: 0, months: 0, history: [] },
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
      projects: { ...base.projects, ...obj.projects },
      team: { ...base.team, ...obj.team }, product: { ...base.product, ...obj.product },
      lines: { ...base.lines, ...obj.lines }, rd: { ...base.rd, ...obj.rd }, dept: { ...base.dept, ...obj.dept },
      net: { ...base.net, ...obj.net }, corp: { ...base.corp, ...obj.corp },
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
    return UPGRADES.reduce((sum, u) => sum + (this.owned(u.id) ? (u.passive || 0) : 0), BASE_PASSIVE) + this.teamRate();
  }
  ownRate() { return this.passiveRate() - this.teamRate(); }
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
    this.addWork(this.passiveRate() * dt);
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
    this.marketMonth();
    this.deptMonth();
    this.corpMonth();
    if (s.gameOver) return;
    const target = this.target();
    const ratio = p.perf / target;
    let grade = ratio >= 1.5 ? 'A' : ratio >= 1 ? 'B' : ratio >= 0.7 ? 'C' : 'D';
    if (this.offlineMode && grade === 'D') grade = 'C'; // offline kein Absturz unter C

    const base = round2(st.salary * (1 + (p.salaryBonus || 0)));
    const extras = p.pendingBonus.map((b) => ({ label: b.label, amount: round2(b.amount) }));
    p.pendingBonus = [];
    const extraSum = extras.reduce((a, b) => a + b.amount, 0);
    const zulage = grade === 'A' ? base * 0.25 : grade === 'B' ? base * 0.10 : 0;
    const kuerzung = grade === 'D' && d.id === 'leicht' ? base * 0.10 : 0;
    const xmas = t.month === 11 ? base * 0.5 : 0;
    const brutto = round2(base + zulage + xmas + extraSum - kuerzung);
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
      base, extras, zulage: round2(zulage), xmas: round2(xmas), kuerzung: round2(kuerzung), brutto, rv, av, kv, lst, netto,
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
    const dps = s.corp.active ? s.corp.lastDps : DIVIDEND_PER_SHARE;
    if (t.month === 11 && s.shares.owned > 0 && dps > 0) {
      const total = round2(s.shares.owned * dps);
      p.cash = round2(p.cash + total);
      this.mail('dividend', { shares: s.shares.owned, perShare: dps, total });
    }

    this.checkProjectDeadline();
    this.teamMonth(grade);

    // nächster Monat
    p.perf = 0;
    t.month++;
    if (t.month > 11) { t.month = 0; t.year++; }
    t.totalMonths++;
    this.emit('payslip', { slip, offline: this.offlineMode });
    this.emit('change');
  }

  triggerGameOver(reason) {
    if (this.s.gameOver) return;
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
      this.addWork(value);
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
    if (this.s.corp.active) {
      const target = this.s.corp.base * this.hype() * this.corpPerf();
      sh.price = round2(Math.max(5, sh.price + (target - sh.price) * 0.15 + sh.price * 0.012 * gauss()));
      sh.history.push(sh.price);
      if (sh.history.length > 72) sh.history.shift();
      return;
    }
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
    if ((u.minStage || 0) > this.s.player.stage) return false;
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
      uid: `${id}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, id, from: typeof m.from === "function" ? m.from(this, vars) : m.from, subject: m.subject, body,
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

  // ------------------------------------------------------------ Projekte
  // Leistung wird zwischen Monatsziel und aktivem Projekt aufgeteilt.
  addWork(points) {
    const pr = this.s.projects, p = this.s.player;
    const act = pr.active;
    if (!act) { p.perf += points; return; }
    const share = pr.share;
    p.perf += points * (1 - share);
    act.pp += points * share * (1 + (act.boost || 0) + (act.id === 'hc1' ? this.creativeBonus() : 0));
    if (act.pp >= act.need) this.finishProject();
  }

  offerProject(proj) {
    const pr = this.s.projects;
    if (pr.offered.some((x) => x.id === proj.id) || pr.active?.id === proj.id || pr.done.some((d) => d.id === proj.id)) return;
    pr.offered.push({ pp: 0, boost: 0, rep: 1, ...proj });
    if (!this.offlineMode) this.emit('toast', { text: `Neues Projekt im Programm PROJ: ${proj.name}`, kind: 'mail' });
    this.emit('projects');
    this.emit('change');
  }

  startProject(id, force = false) {
    const pr = this.s.projects;
    if (pr.active && !force) return false;
    if (pr.active) { pr.offered.unshift(pr.active); pr.active = null; } // pausiert, Fortschritt bleibt
    const i = pr.offered.findIndex((x) => x.id === id);
    if (i < 0) return false;
    const proj = pr.offered.splice(i, 1)[0];
    proj.pp = proj.pp || 0;
    proj.deadline = this.s.time.totalMonths + proj.months;
    proj.late = false;
    pr.active = proj;
    if (pr.share === 0) pr.share = 0.5;
    if (proj.exclusive) pr.offered = pr.offered.filter((x) => !proj.exclusive.includes(x.id));
    this.emit('projects');
    this.emit('change');
    return true;
  }

  setProjectShare(x) {
    this.s.projects.share = x;
    this.emit('projects');
    this.emit('change');
  }

  boostProject(amount) {
    if (this.s.projects.active) this.s.projects.active.boost = (this.s.projects.active.boost || 0) + amount;
  }

  // Monatsende im Projekt: Frist überschritten?
  checkProjectDeadline() {
    const act = this.s.projects.active;
    if (!act || act.late || this.s.time.totalMonths < act.deadline) return;
    act.late = true;
    this.addRep(-2, true);
    this.mail('project_late', { name: act.name });
  }

  finishProject() {
    const pr = this.s.projects, act = pr.active;
    pr.active = null;
    const reward = round2(act.late ? act.reward / 2 : act.reward);
    if (reward > 0) this.s.player.pendingBonus.push({ label: `Projektprämie ${act.short || act.name}`, amount: reward });
    this.addRep(act.late ? 0 : act.rep, true);
    pr.done.push({ id: act.id, name: act.name, late: act.late, date: `${MONTH_NAMES[this.s.time.month]} ${this.s.time.year}`, reward });
    if (pr.done.length > 40) pr.done.shift();
    if (!this.offlineMode) this.emit('toast', { text: `Projekt abgeschlossen: ${act.name}`, kind: 'good' });
    ON_PROJECT_DONE[act.id]?.(this, act.late);
    if (act.id.startsWith('model-')) this.modelDone(act);
    if (this.s.story.flags.procedural && pr.offered.length === 0) this.generateProjects();
    this.emit('projects');
    this.emit('change');
  }

  generateProjects(n = 2) {
    const target = this.target();
    for (let i = 0; i < n; i++) {
      const tpl = pick(PROJECT_TEMPLATES);
      const w = pick(WERKE), k = pick(KUNDEN);
      const need = Math.round((target * rand(1.3, 2.4)) / 50) * 50;
      this.offerProject({
        id: `gen-${Date.now().toString(36)}-${i}-${Math.floor(Math.random() * 1e4)}`,
        name: tpl.name.replace('{w}', w).replace('{k}', k),
        desc: tpl.desc.replaceAll('{w}', w).replaceAll('{k}', k),
        sponsor: 'W. Hoff', need, months: need > target * 1.9 ? 4 : 3,
        reward: Math.round((need * 1.15) / 10) * 10, rep: 1,
      });
    }
  }

  // ------------------------------------------------------------ Team (ab Kapitel 3)
  makeMember(opt = {}) {
    const tm = this.s.team;
    const traitIds = Object.keys(TRAITS);
    const skill = opt.skill ?? Math.max(1, Math.min(5, Math.round(rand(1.2, 4.6))));
    const suits = [0x6b6f4a, 0x8a5a7a, 0x4a5a7a, 0x7a6a4a, 0x3f5a4a, 0x7a3f32, 0x5a6670, 0x8a7448];
    const hairs = [0x3a2a1a, 0x9a6a3a, 0x1f1a16, 0xb8b4aa, 0x2b1d14, 0x6a4a2a, 0xc8a060];
    const long = opt.longHair ?? Math.random() < 0.45;
    return {
      id: tm.nextId++,
      name: opt.name || `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      skill,
      salary: opt.salary ?? Math.round((1500 + skill * 430 + rand(-150, 250)) / 10) * 10,
      morale: opt.morale ?? 65,
      trait: opt.trait || pick(traitIds),
      praised: -1,
      look: opt.look || { suit: pick(suits), shirt: 0xe4ddc8, hair: pick(hairs), longHair: long, skin: Math.floor(Math.random() * 4) },
    };
  }

  refreshCandidates() {
    const tm = this.s.team;
    tm.candidates = [this.makeMember(), this.makeMember(), this.makeMember()];
  }

  memberRate(m) {
    const tr = TRAITS[m.trait] || {};
    return m.skill * TEAM_RATE_PER_SKILL * (0.5 + m.morale / 100) * (tr.mult || 1);
  }
  teamRate() { return this.s.team.members.reduce((a, m) => a + this.memberRate(m), 0); }
  creativeBonus() {
    const all = this.teamRate();
    if (!all) return 0;
    const cre = this.s.team.members.filter((m) => m.trait === 'kreativ').reduce((a, m) => a + this.memberRate(m), 0);
    return 0.3 * (cre / all);
  }
  payroll() { return this.s.team.members.reduce((a, m) => a + m.salary, 0); }
  avgMorale() {
    const ms = this.s.team.members;
    return ms.length ? ms.reduce((a, m) => a + m.morale, 0) / ms.length : 0;
  }
  member(id) { return this.s.team.members.find((m) => m.id === id); }
  changeMorale(m, d) { m.morale = Math.max(0, Math.min(100, m.morale + d)); }

  hire(id) {
    const tm = this.s.team;
    if (tm.members.length >= this.teamMax()) return false;
    const i = tm.candidates.findIndex((c) => c.id === id);
    if (i < 0) return false;
    const m = tm.candidates.splice(i, 1)[0];
    m.since = this.s.time.totalMonths;
    tm.members.push(m);
    this.emit('team');
    this.emit('change');
    return m;
  }

  fire(id) {
    const tm = this.s.team;
    const m = this.member(id);
    if (!m) return false;
    tm.members = tm.members.filter((x) => x.id !== id);
    tm.members.forEach((x) => this.changeMorale(x, -6));
    this.addRep(-1, true);
    this.emit('team');
    this.emit('change');
    return m;
  }

  praise(id) {
    const m = this.member(id);
    if (!m || m.praised === this.s.time.totalMonths) return false;
    m.praised = this.s.time.totalMonths;
    this.changeMorale(m, 7);
    this.emit('team');
    return true;
  }

  raiseSalary(id) {
    const m = this.member(id);
    if (!m) return false;
    m.salary = Math.round((m.salary * 1.1) / 10) * 10;
    this.changeMorale(m, 15);
    this.emit('team');
    this.emit('change');
    return true;
  }

  dinnerCost() { return DINNER_COST * (this.s.team.members.length + 1); }
  dinner() {
    const tm = this.s.team, p = this.s.player;
    const cost = this.dinnerCost();
    if (!tm.members.length || tm.dinnerMonth === this.s.time.totalMonths || p.cash < cost) return false;
    tm.dinnerMonth = this.s.time.totalMonths;
    p.cash = round2(p.cash - cost);
    tm.members.forEach((m) => this.changeMorale(m, 9 * (TRAITS[m.trait]?.dinner || 1)));
    this.emit('team');
    this.emit('change');
    return cost;
  }

  // Monatsende fürs Team: Moral, Kündigungen, Budget, Bewerber
  teamMonth(grade) {
    const tm = this.s.team;
    if (!tm.members.length) return;
    const share = this.s.projects.active ? this.s.projects.share : 0;
    const over = this.payroll() > tm.budget;
    for (const m of [...tm.members]) {
      const tr = TRAITS[m.trait] || {};
      const base = tr.drift || 60;
      let d = (base - m.morale) * 0.15;
      if (share >= 0.75) d -= 8; else if (share >= 0.5) d -= 4;
      if (grade === 'A') d += 4;
      if (grade === 'D') d -= 6;
      if (over) d -= 3;
      this.changeMorale(m, d);
      if (m.morale < 25 && !tr.loyal && Math.random() < 0.5) {
        tm.members = tm.members.filter((x) => x.id !== m.id);
        tm.members.forEach((x) => this.changeMorale(x, -4));
        this.mail('team_quit', { name: m.name });
      }
    }
    if (over) {
      tm.overBudget++;
      this.addRep(-1, true);
      this.mail('team_budget', { payroll: this.payroll(), budget: tm.budget });
    }
    if (tm.members.length && this.avgMorale() >= 60) tm.moraleMonths++;
    this.refreshCandidates();
    this.emit('team');
  }

  // ------------------------------------------------------------ Produkt HC-1
  specValue(key) {
    const sp = this.s.product.spec;
    return Object.entries(PRODUCT_SPEC).reduce((a, [k, def]) => a + (def.options.find((o) => o.id === sp[k])?.[key] || 0), 0);
  }
  productNeed() {
    const f = this.s.story.flags;
    const n = PRODUCT_BASE_NEED + this.specValue('need');
    return Math.round((n * (f.wb_choice === 'mikro' ? 0.85 : 1)) / 50) * 50;
  }
  productQuality() {
    const ms = this.s.team.members;
    const avgSkill = ms.length ? ms.reduce((a, m) => a + m.skill, 0) / ms.length : 2;
    const f = this.s.story.flags;
    return Math.max(1, Math.min(10, Math.round(PRODUCT_BASE_Q + this.specValue('q') + (avgSkill - 3) + (f.uwe_compromise ? 1 : 0))));
  }
  setSpec(key, id) {
    if (this.s.product.stage !== 'spec') return;
    this.s.product.spec[key] = id;
    this.emit('product');
  }
  startProduct() {
    const pd = this.s.product;
    if (pd.stage !== 'spec') return false;
    pd.stage = 'dev';
    const proj = {
      id: 'hc1', name: 'Entwicklung KB-Heimcomputer HC-1', short: 'HC-1', sponsor: 'Vorstand · H. Kessler',
      desc: 'Der erste Heimcomputer von KB. Das ganze Team arbeitet mit, sobald du Arbeitszeit ins Projekt gibst.',
      need: this.productNeed(), months: 8, reward: 0, rep: 4, pp: 0, boost: 0,
    };
    this.s.projects.offered.unshift(proj);
    this.startProject('hc1', true);
    this.emit('product');
    return true;
  }
  launchProduct(price) {
    const pd = this.s.product;
    if (pd.stage !== 'launch') return false;
    pd.price = price;
    pd.stage = 'market';
    pd.months = 0;
    this.emit('product');
    this.emit('change');
    return true;
  }
  setPrice(price) {
    if (this.s.product.stage !== 'market') return;
    this.s.product.price = price;
    this.emit('product');
  }
  attract(q, price) { return Math.pow(q / 5, 1.5) * Math.pow(1995 / price, 2); }

  marketMonth() {
    const pd = this.s.product;
    if (pd.stage !== 'market') return;
    const hype = PRODUCT_HYPE[Math.min(pd.months, PRODUCT_HYPE.length - 1)];
    const size = PRODUCT_MARKET * hype * rand(0.92, 1.08);
    const kb = this.attract(pd.quality, pd.price);
    const orion = this.s.story.flags.orion_home ? this.attract(ORION_HOME.q, ORION_HOME.price) : 0;
    const others = 0.6;
    const total = kb + orion + others;
    const units = Math.round((size * kb) / total);
    const orionUnits = Math.round((size * orion) / total);
    const revenue = units * pd.price;
    pd.units += units;
    pd.revenue += revenue;
    pd.months++;
    pd.history.push({ label: `${MONTH_NAMES[this.s.time.month].slice(0, 3)} ${this.s.time.year}`, units, orion: orionUnits, share: units / (units + orionUnits + (size * others) / total), price: pd.price });
    if (pd.history.length > 24) pd.history.shift();
    const commission = round2(revenue * PRODUCT_COMMISSION);
    if (commission > 0) this.s.player.pendingBonus.push({ label: 'Erfolgsbeteiligung HC-1', amount: commission });
    const sh = units / (size || 1);
    this.shareShock(sh > 0.4 ? 0.015 : sh < 0.15 ? -0.015 : 0.004);
    this.emit('product');
  }

  // ------------------------------------------------------------ Kapitel 4: Abteilung
  era() { const st = this.s.player.stage; return st >= 5 ? 3 : st >= 3 ? 2 : 1; }
  teamMax() { return TEAM_MAX_BY_STAGE[this.s.player.stage] || TEAM_MAX; }

  // Forschung
  techDone(id) { return this.s.rd.done.includes(id); }
  techAvailable(t) { return !this.techDone(t.id) && t.req.every((r) => this.techDone(r)); }
  setRdBudget(x) { this.s.rd.budget = x; this.emit('dept'); this.emit('change'); }
  selectTech(id) {
    const t = TECHS.find((x) => x.id === id);
    if (!t || !this.techAvailable(t)) return false;
    this.s.rd.current = id;
    this.tryResearch();
    this.emit('dept');
    return true;
  }
  rdPerMonth() { return Math.round(this.s.rd.budget * RD_FP_PER_DM * (1 + this.creativeBonus())); }
  tryResearch() {
    const rd = this.s.rd;
    const t = TECHS.find((x) => x.id === rd.current);
    if (!t || rd.pool < t.cost) return;
    rd.pool -= t.cost;
    rd.done.push(t.id);
    rd.current = null;
    this.mail('tech_done', { name: t.name, desc: t.desc });
    this.emit('dept');
  }

  // Produktlinien
  lineUnlocked(id) { const n = LINES[id].needs; return !n || this.techDone(n); }
  techQ(id) { return TECHS.reduce((a, t) => a + (this.techDone(t.id) ? (t.q?.[id] || 0) : 0), 0); }
  lineQuality(id) {
    const ms = this.s.team.members;
    const avg = ms.length ? ms.reduce((a, m) => a + m.skill, 0) / ms.length : 3;
    return Math.max(1, Math.min(10, Math.round(LINES[id].baseQ + this.techQ(id) + (avg - 3))));
  }
  modelName(id, gen) { return `${LINES[id].model} ${id === 'home' ? '-' + gen : gen}`.replace(' -', '-'); }
  startModel(id) {
    const ln = this.s.lines[id], def = LINES[id];
    if (!this.lineUnlocked(id) || ln.devGen || ln.pending) return false;
    const gen = ln.gen + 1;
    ln.devGen = gen;
    const proj = {
      id: `model-${id}-${gen}`, name: `Entwicklung ${this.modelName(id, gen)}`, short: this.modelName(id, gen),
      sponsor: 'PC-Sparte', desc: `Neues Modell der Linie ${def.name}. Die Qualität hängt von den erforschten Technologien und vom Team ab.`,
      need: Math.round((def.devNeed * (1 + 0.2 * (gen - 1))) / 50) * 50, months: 8, reward: 0, rep: 2, pp: 0, boost: 0,
    };
    this.s.projects.offered.unshift(proj);
    this.startProject(proj.id, true);
    this.emit('product');
    return true;
  }
  modelDone(act) {
    const [, id, gen] = act.id.split('-');
    const ln = this.s.lines[id];
    if (!ln) return;
    ln.devGen = null;
    ln.pending = { name: this.modelName(id, Number(gen)), q: this.lineQuality(id), gen: Number(gen) };
    this.mail('model_ready', { name: ln.pending.name, q: ln.pending.q });
    this.emit('product');
  }
  launchModel(id, price) {
    const ln = this.s.lines[id];
    if (!ln.pending) return false;
    ln.model = { name: ln.pending.name, q: ln.pending.q, price, months: 0 };
    ln.gen = ln.pending.gen;
    ln.pending = null;
    this.emit('product');
    this.emit('change');
    return true;
  }
  setLinePrice(id, price) { const ln = this.s.lines[id]; if (ln.model) { ln.model.price = price; this.emit('product'); } }
  setMarketing(id, lvl) { this.s.lines[id].marketing = lvl; this.emit('product'); }
  orionQ(id) { return Math.min(9, LINES[id].orionQ + Math.max(0, Math.floor((this.s.time.year - 1987) / 2))); }
  orionPrice(id) {
    const f = this.s.story.flags, mid = LINES[id].prices[1];
    return Math.round(mid * (f.price_war ? 0.85 : f.rau_deal ? 1.05 : 0.95));
  }
  attractRef(q, price, ref) { return Math.pow(q / 5, 1.5) * Math.pow(ref / price, 2); }
  lineShare(id, q, price, mk) {
    const ref = LINES[id].prices[1];
    const kb = this.attractRef(q, price, ref) * MARKETING[mk].mult;
    const orion = this.attractRef(this.orionQ(id), this.orionPrice(id), ref) * 1.2;
    const others = id === 'pc' && this.s.story.flags.pc_compat ? 1.2 : 0.6;
    return { kb, orion, total: kb + orion + others };
  }

  // Monatsende der Abteilung: Verkäufe aller Linien, Kosten, Ergebnis
  deptMonth() {
    if (this.s.player.stage < 3) return;
    const f = this.s.story.flags, rd = this.s.rd, dept = this.s.dept;
    let revenue = 0, gross = 0, mkt = 0;
    const perLine = {};
    for (const [id, def] of Object.entries(LINES)) {
      const ln = this.s.lines[id];
      if (!ln.model) continue;
      const hype = PRODUCT_HYPE[Math.min(ln.model.months, PRODUCT_HYPE.length - 1)];
      const size = (id === 'pc' && f.pc_compat ? def.sizeCompat : def.size) * hype * this.economy() * rand(0.92, 1.08);
      const sh = this.lineShare(id, ln.model.q, ln.model.price, ln.marketing);
      const units = Math.round((size * sh.kb) / sh.total);
      const orionUnits = Math.round((size * sh.orion) / sh.total);
      const rev = units * ln.model.price;
      const margin = id === 'pc' && f.pc_compat ? def.marginCompat : def.margin;
      ln.units += units;
      ln.revenue += rev;
      ln.last = { units, orion: orionUnits, share: units / size };
      ln.model.months++;
      revenue += rev;
      gross += rev * margin;
      mkt += MARKETING[ln.marketing].cost;
      perLine[id] = units;
    }
    const netRes = this.netMonth();
    gross += netRes.gross;
    revenue += netRes.revenue;
    mkt += netRes.mkt;
    const payroll = this.payroll();
    const result = Math.round(gross - payroll - rd.budget - mkt);
    rd.pool += this.rdPerMonth();
    this.tryResearch();
    dept.history.push({ label: `${MONTH_NAMES[this.s.time.month].slice(0, 3)} ${this.s.time.year}`, revenue, gross: Math.round(gross), payroll, rd: rd.budget, mkt, result, perLine });
    if (dept.history.length > 24) dept.history.shift();
    dept.best = Math.max(dept.best, result);
    dept.posStreak = result > 0 ? dept.posStreak + 1 : 0;
    dept.maxStreak = Math.max(dept.maxStreak || 0, dept.posStreak);
    if (result > 0) this.s.player.pendingBonus.push({ label: this.s.player.stage >= 4 ? 'Erfolgsbeteiligung Geschäftsbereich' : 'Erfolgsbeteiligung PC-Sparte', amount: round2(result * DEPT_COMMISSION) });
    this.shareShock(result > 500000 ? 0.012 : result < 0 ? -0.012 : 0.003);
    this.emit('dept');
  }

  // ------------------------------------------------------------ Kapitel 5: KB-Net
  netActive() { return this.s.player.stage >= 4 && this.s.net.invest > 0 || this.s.net.nodes.length > 0; }
  adoption() {
    const t = this.s.time;
    const y = Math.min(2002, Math.max(1993, t.year));
    const a = NET_ADOPTION[y], b = NET_ADOPTION[Math.min(2002, y + 1)];
    return a + (b - a) * (t.month / 12);
  }
  netCovered() { return this.s.net.nodes.reduce((a, id) => a + (NET_CITIES.find((c) => c.id === id)?.pop || 0), 0); }
  netQuality() { return Math.min(10, Math.round(3 + this.s.net.qLevel * 1.5 + (this.techDone('lan') ? 1 : 0))); }
  netFrozen() { return this.s.time.totalMonths < this.s.net.frozenUntil; }
  buildNode(id) {
    const net = this.s.net, c = NET_CITIES.find((x) => x.id === id);
    if (!c || net.nodes.includes(id) || this.netFrozen()) return false;
    const cost = NET_NODE_COST(c.pop);
    if (net.invest < cost) return false;
    net.invest -= cost;
    net.nodes.push(id);
    this.emit('net');
    this.emit('change');
    return true;
  }
  upgradeNet() {
    const net = this.s.net, u = NET_UPGRADES[net.qLevel];
    if (!u || net.invest < u.cost || this.netFrozen()) return false;
    net.invest -= u.cost;
    net.qLevel++;
    this.emit('net');
    return true;
  }
  setTariff(x) { this.s.net.tariff = x; this.emit('net'); }
  setNetMarketing(k) { this.s.net.marketing = k; this.emit('net'); }
  netCompetitors() {
    const f = this.s.story.flags;
    return NET_COMPETITORS.filter((c) => this.s.time.year >= c.from && !(c.id === 'orionline' && f.orion_partner))
      .map((c) => ({ ...c, q: Math.min(9, c.q + Math.max(0, Math.floor((this.s.time.year - 1993) / 2))) }));
  }
  netAttract(q, tariff, brand = 1) { return Math.pow(q / 5, 1.5) * Math.pow(19.9 / tariff, 1.5) * brand; }
  netShareEstimate(tariff = this.s.net.tariff) {
    const kb = this.netAttract(this.netQuality(), tariff, MARKETING[this.s.net.marketing].mult);
    const others = this.netCompetitors().reduce((a, c) => a + this.netAttract(c.q, c.tariff, c.brand), 0);
    return kb / (kb + others);
  }
  netMonth() {
    const net = this.s.net;
    if (!net.nodes.length) return { gross: 0, revenue: 0, mkt: 0 };
    const potential = this.netCovered() * this.adoption() * this.economy();
    const target = potential * this.netShareEstimate();
    const before = net.subs;
    net.subs = Math.max(0, Math.round(net.subs + (target - net.subs) * 0.15));
    const revenue = Math.round(net.subs * net.tariff);
    const upkeep = net.nodes.length * NET_NODE_UPKEEP;
    const mkt = MARKETING[net.marketing].cost;
    net.history.push({ label: `${MONTH_NAMES[this.s.time.month].slice(0, 3)} ${this.s.time.year}`, subs: net.subs, delta: net.subs - before, revenue, cost: upkeep + mkt, result: revenue - upkeep - mkt });
    if (net.history.length > 24) net.history.shift();
    this.emit('net');
    this.lastNetGross = revenue - upkeep - mkt;
    return { gross: revenue - upkeep, revenue, mkt };
  }

  // Abstimmung im Vorstand: Einfluss, Ruf, Erfolg des Netzes und Verbündete zählen
  voteScore(argument) {
    const s = this.s, f = s.story.flags;
    let score = Math.min(2, s.shares.owned / 100) + Math.min(2, s.player.rep / 25) + Math.min(2, s.net.subs / 8000);
    if (f.sauer_ally) score += 0.5;
    if (f.kartell_confessed) score -= 1;
    if (argument === 'zahlen' && s.net.subs >= 5000) score += 1;
    if (argument === 'vision' && f.succession_hint) score += 1;
    if (argument === 'kompromiss') score += 3;
    return score;
  }

  // ------------------------------------------------------------ Kapitel 6: Konzern
  monthIndex() { const t = this.s.time; return (t.year - 1999) * 12 + t.month + t.monthProgress / 60; }
  interp(points, x) {
    if (x <= points[0][0]) return x < 0 ? 1 : points[0][1];
    for (let i = 1; i < points.length; i++) {
      const [x1, y1] = points[i - 1], [x2, y2] = points[i];
      if (x <= x2) return y1 + ((y2 - y1) * (x - x1)) / (x2 - x1);
    }
    return points.at(-1)[1];
  }
  hype() { return this.interp(HYPE_POINTS, this.monthIndex()); }
  economy() { return this.interp(ECONOMY_POINTS, this.monthIndex()); }
  mood() {
    const h = this.hype();
    return h > 2.4 ? 'EUPHORIE' : h > 1.6 ? 'HAUSSE' : h > 1.05 ? 'FREUNDLICH' : h > 0.85 ? 'NERVÖS' : 'BAISSE';
  }
  policy() { return DIVIDEND_POLICIES.find((x) => x.id === this.s.corp.policy) || DIVIDEND_POLICIES[1]; }
  corpPerf() {
    const c = this.s.corp;
    const recent = c.history.slice(-6);
    const avg = recent.length ? recent.reduce((a, h) => a + h.result, 0) / recent.length : 15e6;
    const fund = 1 + 0.5 * Math.max(-1, Math.min(1, (avg - 15e6) / 15e6));
    const net = this.hype() > 1.5 ? c.owned.length * 0.04 : 0;
    return Math.max(0.3, fund + this.policy().perf + c.perfShock + net);
  }
  startupValue(id) {
    const st = STARTUPS.find((x) => x.id === id);
    const idx = this.monthIndex();
    const future = st.future && idx > 60 ? 1 + (idx - 60) * 0.04 : 1;
    return Math.round((st.base * Math.pow(this.hype(), 2) / 4) * future / 1e5) * 1e5;
  }
  startCorp() {
    const c = this.s.corp;
    if (c.active) return;
    c.active = true;
    c.cash = CORP_START_CASH;
    c.base = this.s.shares.price / this.hype();
    c.startPrice = this.s.shares.price;
    c.startIdx = this.monthIndex();
    this.emit('corp');
  }
  setPolicy(id) { this.s.corp.policy = id; this.emit('corp'); }
  loan(dir) {
    const c = this.s.corp;
    if (dir > 0) { c.debt += CORP_LOAN_STEP; c.cash += CORP_LOAN_STEP; }
    else { if (c.debt < CORP_LOAN_STEP || c.cash < CORP_LOAN_STEP) return false; c.debt -= CORP_LOAN_STEP; c.cash -= CORP_LOAN_STEP; }
    this.emit('corp');
    this.emit('change');
    return true;
  }
  canIssue() { return this.s.time.totalMonths - this.s.corp.lastIssue >= 12; }
  issueValue() { return Math.round(this.s.corp.shares * 0.1) * this.s.shares.price * 0.95; }
  capitalIncrease() {
    const c = this.s.corp;
    if (!this.canIssue()) return false;
    const v = this.issueValue();
    c.shares += Math.round(c.shares * 0.1);
    c.cash += v;
    c.lastIssue = this.s.time.totalMonths;
    c.perfShock -= 0.05;
    this.emit('corp');
    return v;
  }
  ipoValue() { return Math.round((Math.min(this.s.net.subs, 400000) * 600 * Math.pow(this.hype(), 1.5) * 0.49) / 1e5) * 1e5; }
  canIpo() { return !this.s.corp.ipo && this.s.net.subs > 0 && this.s.time.year <= 2001; }
  ipoNet() {
    if (!this.canIpo()) return false;
    const v = this.ipoValue();
    this.s.corp.cash += v;
    this.s.corp.ipo = true;
    this.s.story.flags.net_ipo = { value: v, hype: this.hype() };
    this.emit('corp');
    return v;
  }
  buyStartup(id) {
    const c = this.s.corp;
    if (!c.offers.includes(id) || c.owned.some((o) => o.id === id)) return false;
    const price = this.startupValue(id);
    if (c.cash < price) return false;
    c.cash -= price;
    c.owned.push({ id, paid: price });
    c.offers = c.offers.filter((x) => x !== id);
    c.perfShock += 0.03;
    this.emit('corp');
    return price;
  }
  sellStartup(id) {
    const c = this.s.corp;
    const o = c.owned.find((x) => x.id === id);
    if (!o) return false;
    const v = Math.round(this.startupValue(id) * 0.9);
    c.cash += v;
    c.owned = c.owned.filter((x) => x.id !== id);
    c.sold = [...(c.sold || []), { id, paid: o.paid, got: v }];
    this.emit('corp');
    return v;
  }
  corpMonth() {
    const c = this.s.corp, f = this.s.story.flags;
    if (!c.active) return;
    const months = this.monthIndex() - c.startIdx;
    const legacy = CORP_LEGACY_RESULT * this.economy() * Math.max(0.5, 1 - months * 0.004) + c.legacyBoost;
    let bereich = this.s.dept.history.at(-1)?.result || 0;
    if (c.ipo) bereich -= 0.49 * (this.lastNetGross || 0);
    const startups = -c.owned.reduce((a, o) => a + (STARTUPS.find((x) => x.id === o.id)?.burn || 0), 0);
    const interest = (c.debt * CORP_LOAN_RATE) / 12;
    // Nach dem Crash: Wertberichtigung auf gehaltene Beteiligungen (einmalig)
    let writedown = 0;
    if (!c.writedown && this.monthIndex() >= 20) {
      c.writedown = true;
      for (const o of c.owned) {
        const v = this.startupValue(o.id);
        writedown += Math.max(0, o.paid - v);
        o.paid = Math.min(o.paid, v);
      }
      if (writedown > 0) this.mail('corp_writedown', { amount: writedown });
    }
    const result = Math.round(legacy + bereich + startups - interest - writedown);
    c.cash += result;
    c.perfShock *= 0.9;
    c.history.push({ label: `${MONTH_NAMES[this.s.time.month].slice(0, 3)} ${this.s.time.year}`, legacy: Math.round(legacy), bereich: Math.round(bereich), startups: startups - writedown, interest: Math.round(interest), result });
    if (c.history.length > 24) c.history.shift();
    // Dividende im Dezember
    if (this.s.time.month === 11) {
      const year = c.history.slice(-12).reduce((a, h) => a + h.result, 0);
      const pay = year > 0 ? year * this.policy().payout : 0;
      c.cash -= pay;
      c.lastDps = round2(pay / c.shares);
    }
    if (this.monthIndex() >= 27) c.posAfter = result > 0 ? c.posAfter + 1 : 0;
    c.negMonths = c.cash < 0 ? c.negMonths + 1 : 0;
    if (c.negMonths >= 3) {
      if (this.diff.id === 'leicht') {
        c.cash += 150e6; c.negMonths = 0; this.addRep(-10, true);
        this.mail('corp_bailout');
      } else {
        this.triggerGameOver('abberufen');
      }
    } else if (c.cash < 0 && !f.cash_warned) {
      f.cash_warned = true;
      this.mail('corp_cash_warning');
    }
    this.emit('corp');
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
