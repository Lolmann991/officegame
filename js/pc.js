// Der Firmen-PC: grüner Textmodus-Desktop mit Programmen.
// Mit dem Upgrade „Zweites Terminal-Display“ laufen zwei Programme nebeneinander.

import {
  UPGRADES, STAGES, MONTH_NAMES, MONTH_SHORT, DIFFICULTIES, SHARES_OUTSTANDING, SHARE_DISCOUNT,
  DIVIDEND_PER_SHARE, PROJECT_SHARES, TRAITS, PRODUCT_SPEC, PRODUCT_PRICES, ORION_HOME,
  TECHS, LINES, MARKETING, RD_BUDGETS, DEPT_COMMISSION,
  NET_CITIES, NET_NODE_COST, NET_NODE_UPKEEP, NET_TARIFFS, NET_UPGRADES,
  STARTUPS, DIVIDEND_POLICIES, CORP_LOAN_STEP, CORP_LOAN_RATE,
  TAKEOVER, ACHIEVEMENTS, fmtDM, fmtNum, fmtInt, fmtPct, cur, toCur, numAt,
} from './data.js';
import { sfx, setSound } from './sound.js';
import { MISSIONS, missionsDone } from './story.js';
import { Game } from './game.js';

const APPS = [
  { id: 'post', label: 'POST', title: 'Postfach' },
  { id: 'aufg', label: 'AUFG', title: 'Aufträge' },
  { id: 'proj', label: 'PROJ', title: 'Projekte', minStage: 1 },
  { id: 'pers', label: 'PERS', title: 'Personal', minStage: 2 },
  { id: 'prod', label: 'PROD', title: 'Produkt', minStage: 2 },
  { id: 'fue', label: 'F&E', title: 'Forschung', minStage: 3 },
  { id: 'abt', label: 'ABT', title: 'Abteilung', minStage: 3 },
  { id: 'netz', label: 'NETZ', title: 'KB-Net', minStage: 4 },
  { id: 'fin', label: 'FIN', title: 'Finanzen', minStage: 5 },
  { id: 'abwehr', label: 'ABWEHR', title: 'Übernahmeabwehr', minStage: 6 },
  { id: 'lohn', label: 'LOHN', title: 'Entgeltabrechnungen' },
  { id: 'depot', label: 'DEPOT', title: 'Konto und Depot' },
  { id: 'shop', label: 'BEDARF', title: 'Bürobedarf' },
  { id: 'karr', label: 'KARR', title: 'Karriere' },
  { id: 'erf', label: 'ERFOLGE', title: 'Erfolge' },
  { id: 'sys', label: 'SYS', title: 'System' },
];

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bar = (frac, cls = '') => `<span class="tbar ${cls}"><span style="width:${Math.max(0, Math.min(100, frac * 100)).toFixed(1)}%"></span></span>`;

export class PC {
  constructor(root, game, ui) {
    this.root = root;
    this.game = game;
    this.ui = ui;
    this.panes = ['aufg', 'post'];
    this.mailSel = null;
    this.confirmNew = false;
    this.lastResult = null;
    this.exportText = '';
    this.screens = root.querySelector('.pc-screens');
    root.addEventListener('click', (e) => this.onClick(e));
    root.addEventListener('keydown', (e) => this.onKey(e));
    root.addEventListener('change', (e) => this.onChange(e));
  }

  get open() { return !this.root.hidden; }
  paneCount() { return this.game.owned('monitor2') ? 2 : 1; }

  show(app) {
    if (app) this.panes[0] = app;
    this.root.hidden = false;
    this.build();
    this.focusInput();
  }
  hide() { this.root.hidden = true; }

  build() {
    const n = this.paneCount();
    this.screens.classList.toggle('dual', n === 2);
    this.root.classList.toggle('era2', this.game.era() >= 2);
    this.root.classList.toggle('era3', this.game.era() >= 3);
    this.root.classList.toggle('era4', this.game.era() >= 4);
    this.screens.innerHTML = this.panes.slice(0, n).map((_, i) => `
      <section class="crt" data-pane="${i}">
        <div class="crt-glass">
          <header class="crt-top">
            <span>${this.game.era() >= 4 ? 'KB BOOK PRO · KB OS 2008' : this.game.era() >= 3 ? 'KB WORKSTATION · KB-WINDOWS 2000' : this.game.era() === 2 ? (this.game.s.time.year >= 1992 ? 'KB PC 486 · KB-WINDOWS 3.1' : 'KB PC · KB-WINDOWS 1.0') : 'KB-TERMINAL 3270'} · ${i === 0 ? 'DISPLAY 1' : 'DISPLAY 2'}</span>
            <span data-live="date"></span>
          </header>
          <nav class="crt-nav" aria-label="Programme">
            ${APPS.filter((a) => (a.minStage || 0) <= this.game.s.player.stage).map((a) => `<button type="button" data-app="${a.id}" data-pane="${i}">${a.label}${a.id === 'post' ? '<i data-live="unread"></i>' : ''}</button>`).join('')}
          </nav>
          <div class="crt-body" id="pane-${i}"></div>
          <footer class="crt-foot"><span data-live="footer"></span><span>[ESC] AUFSTEHEN</span></footer>
        </div>
      </section>`).join('');
    for (let i = 0; i < n; i++) this.renderPane(i);
    this.refreshLive();
  }

  renderPane(i) {
    const body = this.root.querySelector(`#pane-${i}`);
    if (!body) return;
    const app = this.panes[i];
    body.dataset.view = app;
    body.innerHTML = this['app_' + app](i);
    this.root.querySelectorAll(`.crt[data-pane="${i}"] .crt-nav button`).forEach((b) => b.classList.toggle('on', b.dataset.app === app));
    if (app === 'depot') this.drawChart(i);
  }

  // Programme mit gleichem Namen in allen Fenstern neu zeichnen (z. B. nach Kauf)
  rerender(apps) {
    if (!this.open) return;
    const n = this.paneCount();
    if (this.screens.querySelectorAll('.crt').length !== n) { this.build(); return; }
    for (let i = 0; i < n; i++) {
      if (!apps || apps.includes(this.panes[i])) {
        const active = document.activeElement;
        const keepTask = this.panes[i] === 'aufg' && active?.id === `task-input-${i}`;
        const val = keepTask ? active.value : null;
        this.renderPane(i);
        if (keepTask) { const inp = this.root.querySelector(`#task-input-${i}`); inp.value = val; inp.focus(); }
      }
    }
    this.refreshLive();
  }

  focusInput() {
    const inp = this.root.querySelector('.task-input');
    if (inp) setTimeout(() => inp.focus(), 30);
  }

  // ------------------------------------------------------------ Live-Werte (4× pro Sekunde)
  refreshLive() {
    if (!this.open) return;
    const g = this.game, s = g.s, p = s.player;
    const target = g.target();
    const vals = {
      date: g.dateText().toUpperCase(),
      unread: g.unreadCount() ? ` ${g.unreadCount()}` : '',
      footer: `KONTO ${fmtDM(p.cash)} · LEISTUNG ${fmtInt(p.perf)}/${fmtInt(target)}`,
      perf: `${fmtInt(p.perf)} / ${fmtInt(target)}`,
      perfPct: fmtPct(p.perf / target),
      rate: `${fmtInt(g.perMonth(g.passiveRate()))} Pkt/Monat`,
      taskValue: `${g.taskValue()} Pkt`,
      streak: p.streak ? `Serie ×${p.streak} (+${fmtPct(g.streakBonus())})` : 'keine Serie',
      cash: fmtDM(p.cash),
      price: fmtDM(s.shares.price),
      eprice: fmtDM(g.employeePrice()),
      depotValue: fmtDM(s.shares.owned * s.shares.price),
      owned: fmtInt(s.shares.owned),
      vote: fmtPct(s.shares.owned / SHARES_OUTSTANDING, 4),
      days: `${MONTH_NAMES[s.time.month]}: Tag ${g.day()}`,
      teamRate: `${fmtInt(g.perMonth(g.teamRate()))} Pkt/Monat (${s.team.members.length} Leute)`,
      payroll: `${fmtDM(g.payroll())} / ${fmtDM(s.team.budget)}`,
      morale: fmtPct(g.avgMorale() / 100),
      projPP: s.projects.active ? `${fmtInt(s.projects.active.pp)} / ${fmtInt(s.projects.active.need)} (${fmtPct(s.projects.active.pp / s.projects.active.need)})` : '',
      projEta: s.projects.active ? this.projEta() : '',
    };
    this.root.querySelectorAll('[data-live]').forEach((el) => {
      const v = vals[el.dataset.live];
      if (v != null && el.textContent !== v) el.textContent = v;
    });
    const set = (sel, f) => this.root.querySelectorAll(sel).forEach((el) => { el.style.width = `${Math.max(0, Math.min(100, f * 100)).toFixed(1)}%`; });
    set('[data-bar="perf"] > span', p.perf / target);
    set('[data-bar="month"] > span', s.time.monthProgress / g.monthSeconds());
    if (s.projects.active) set('[data-bar="proj"] > span', s.projects.active.pp / s.projects.active.need);
    set('[data-bar="payroll"] > span', g.payroll() / (s.team.budget || 1));
    set('[data-bar="morale"] > span', g.avgMorale() / 100);
    this.root.querySelectorAll('[data-bar="perf"]').forEach((el) => {
      const r = p.perf / target;
      el.dataset.grade = r >= 1.5 ? 'A' : r >= 1 ? 'B' : r >= 0.7 ? 'C' : 'D';
    });
    this.root.querySelectorAll('button[data-need]').forEach((b) => { b.disabled = p.cash < Number(b.dataset.need); });
  }

  // ------------------------------------------------------------ Programme
  app_post() {
    const mails = this.game.s.mails;
    if (!mails.length) return `<h2>POSTFACH</h2><p class="dim">Keine Nachrichten.</p>`;
    const sel = mails.find((m) => m.uid === this.mailSel) || mails[0];
    this.mailSel = sel.uid;
    this.game.readMail(sel.uid);
    const list = mails.map((m) => `
      <button type="button" class="mail-row ${m.uid === sel.uid ? 'sel' : ''} ${m.read ? '' : 'unread'}" data-act="mail" data-arg="${m.uid}">
        <span class="m-flag">${m.read ? ' ' : '■'}${m.choices && m.chosen == null ? '?' : ' '}</span>
        <span class="m-from">${esc(m.from)}</span>
        <span class="m-subj">${esc(m.subject)}</span>
      </button>`).join('');
    const choices = sel.choices ? `<div class="choices">${sel.choices.map((c, i) => `
      <button type="button" class="tbtn ${sel.chosen === i ? 'chosen' : ''}" data-act="mail-choice" data-arg="${sel.uid}" data-idx="${i}" ${sel.chosen != null ? 'disabled' : ''}>
        ${sel.chosen === i ? '► ' : ''}${esc(c)}</button>`).join('')}</div>` : '';
    return `
      <h2>POSTFACH <span class="dim">${mails.length} NACHRICHTEN</span></h2>
      <div class="mail">
        <div class="mail-list">${list}</div>
        <article class="mail-view">
          <div class="dim">VON: ${esc(sel.from)}<br>DATUM: ${esc(sel.date)}</div>
          <h3>${esc(sel.subject)}</h3>
          <pre>${esc(sel.body)}</pre>
          ${choices}
        </article>
      </div>`;
  }

  app_aufg(i) {
    const g = this.game, t = g.s.task, r = this.lastResult;
    const fb = r ? (r.ok ? `<p class="ok">✓ ${esc(r.code)} BEARBEITET · +${r.value} PKT</p>` : `<p class="err">✗ CODE FALSCH · SERIE VERLOREN</p>`) : '<p class="dim">Tippe den Auftragscode ab und drücke die Eingabetaste.</p>';
    return `
      <h2>AUFTRAGSBEARBEITUNG <span class="dim">RECHENZENTRUM</span></h2>
      <div class="kv">
        <span>LEISTUNG</span><span><b data-live="perf"></b> (<span data-live="perfPct"></span>)</span>
        <span></span><span class="tbar big" data-bar="perf"><span></span><em style="left:${(100 / 1.5).toFixed(1)}%">B</em><em style="left:100%">A</em></span>
        <span>MONAT</span><span><span data-live="days"></span></span>
        <span></span><span class="tbar" data-bar="month"><span></span></span>
        <span>GRUNDLEISTUNG</span><span data-live="rate"></span>
        ${g.s.team.members.length ? '<span>DAVON TEAM</span><span data-live="teamRate"></span>' : ''}
      </div>
      <div class="task">
        <div class="dim">AKTUELLER AUFTRAG</div>
        <div class="task-title">${esc(t.title)}</div>
        <div class="task-code">AUFTRAGSCODE: <b>${esc(t.code)}</b></div>
        <label class="prompt" for="task-input-${i}">&gt;
          <input id="task-input-${i}" class="task-input" data-pane="${i}" autocomplete="off" spellcheck="false" maxlength="16" aria-label="Auftragscode eingeben">
        </label>
        <div class="dim">WERT <span data-live="taskValue"></span> · <span data-live="streak"></span></div>
        ${fb}
      </div>`;
  }

  monthLabel(offset) {
    const t = this.game.s.time;
    const k = t.month + offset;
    return `${MONTH_NAMES[((k % 12) + 12) % 12]} ${t.year + Math.floor(k / 12)}`;
  }

  projEta() {
    const g = this.game, pr = g.s.projects, act = pr.active;
    const perMonth = g.perMonth(g.passiveRate()) * pr.share * (1 + (act.boost || 0));
    if (perMonth <= 0) return 'Ohne Arbeitszeit kommt das Projekt nicht voran.';
    const m = Math.ceil((act.need - act.pp) / perMonth);
    return `Nur mit Grundleistung fertig in ca. ${m} Monat${m === 1 ? '' : 'en'}. Aufträge beschleunigen das.`;
  }

  app_proj() {
    const g = this.game, pr = g.s.projects, t = g.s.time, act = pr.active;
    let html = `<h2>PROJEKTE <span class="dim">EIGENVERANTWORTUNG</span></h2>`;
    if (act) {
      const left = act.deadline - t.totalMonths;
      const frist = act.late ? '<span class="err">FRIST ÜBERSCHRITTEN · HALBE PRÄMIE</span>'
        : `ENDE ${this.monthLabel(left - 1).toUpperCase()} <span class="dim">(${left <= 1 ? 'DIESER MONAT' : `NOCH ${left} MONATE`})</span>`;
      html += `
      <div class="task">
        <div class="dim">AKTIVES PROJEKT · ${esc(act.sponsor || '')}</div>
        <div class="task-title">${esc(act.name)}</div>
        <p>${esc(act.desc)}</p>
        <div class="kv">
          <span>FORTSCHRITT</span><span data-live="projPP"></span>
          <span></span><span class="tbar big" data-bar="proj"><span></span></span>
          <span>FRIST</span><span>${frist}</span>
          <span>PRÄMIE</span><span>${fmtDM(act.late ? act.reward / 2 : act.reward)}${act.boost ? ` · HILFE +${fmtPct(act.boost)}` : ''}</span>
        </div>
        <h3>ARBEITSZEIT IM PROJEKT</h3>
        <div class="row">${PROJECT_SHARES.map((x) => `<button type="button" class="tbtn ${pr.share === x ? 'chosen' : ''}" data-act="share" data-arg="${x}">${fmtPct(x)}</button>`).join('')}</div>
        <p class="dim">Dieser Anteil deiner Leistung fließt ins Projekt statt ins Monatsziel. <span data-live="projEta"></span></p>
      </div>`;
    } else {
      html += `<p class="dim">Kein aktives Projekt. Deine ganze Leistung zählt fürs Monatsziel.</p>`;
    }
    if (pr.offered.length) {
      html += `<h3>ANGEBOTE</h3>` + pr.offered.map((o) => `
        <div class="shop-row">
          <div><b>${esc(o.name)}</b> <span class="dim">[${esc(o.sponsor || 'W. HOFF')}]</span><br>
            <span class="dim">${esc(o.desc)}</span><br>
            UMFANG ${fmtInt(o.need)} PKT · FRIST ${o.months} MONATE · PRÄMIE ${fmtDM(o.reward)}${o.exclusive ? '<br><span class="err">NUR EINE EINREICHUNG MÖGLICH</span>' : ''}</div>
          <div class="r"><button type="button" class="tbtn" data-act="project" data-arg="${esc(o.id)}" ${act ? 'disabled title="Erst das aktive Projekt abschließen"' : ''}>ÜBERNEHMEN</button></div>
        </div>`).join('');
    } else if (!act) {
      html += `<p class="dim">Zurzeit keine Angebote. Neue Projekte kommen über die Story.</p>`;
    }
    if (pr.done.length) {
      html += `<h3>ABGESCHLOSSEN</h3><ul class="tlist">${pr.done.slice(-6).reverse().map((d) => `<li class="${d.late ? 'err' : 'ok'}">${d.late ? '[!]' : '[X]'} ${esc(d.name)} <span class="dim">${esc(d.date)} · ${fmtDM(d.reward)}</span></li>`).join('')}</ul>`;
    }
    return html;
  }

  stars(n) { return '★'.repeat(n) + '☆'.repeat(5 - n); }

  app_pers() {
    const g = this.game, tm = g.s.team, now = g.s.time.totalMonths;
    const over = g.payroll() > tm.budget;
    const dinnerDone = tm.dinnerMonth === now;
    const members = tm.members.map((m) => {
      const tr = TRAITS[m.trait] || {};
      const fire = this.confirmFire === m.id
        ? `<span class="err">WIRKLICH ENTLASSEN?</span> <button type="button" class="tbtn small" data-act="fire-yes" data-arg="${m.id}">JA</button> <button type="button" class="tbtn small" data-act="fire-no">NEIN</button>`
        : `<button type="button" class="tbtn small dimbtn" data-act="fire" data-arg="${m.id}">ENTLASSEN</button>`;
      return `<div class="member">
        <div><b>${esc(m.name)}</b> <span class="stars">${this.stars(m.skill)}</span> <span class="dim">[${esc(tr.label || m.trait).toUpperCase()}: ${esc(tr.desc || '')}]</span></div>
        <div class="kv">
          <span>GEHALT</span><span>${fmtDM(m.salary)} · LEISTUNG ${fmtInt(g.perMonth(g.memberRate(m)))} PKT/MONAT</span>
          <span>MORAL</span><span class="mrow">${bar(m.morale / 100, m.morale < 35 ? 'low' : '')} ${fmtInt(m.morale)} %</span>
        </div>
        <div class="row">
          <button type="button" class="tbtn small" data-act="praise" data-arg="${m.id}" ${m.praised === now ? 'disabled' : ''}>${m.praised === now ? 'GELOBT' : 'LOBEN'}</button>
          <button type="button" class="tbtn small" data-act="raise" data-arg="${m.id}">+10 % GEHALT (+${fmtDM(Math.round(m.salary * 0.1 / 10) * 10)})</button>
          ${fire}
        </div>
      </div>`;
    }).join('');
    const cands = tm.candidates.map((c) => {
      const tr = TRAITS[c.trait] || {};
      const afterOver = g.payroll() + c.salary > tm.budget;
      return `<div class="shop-row">
        <div><b>${esc(c.name)}</b> <span class="stars">${this.stars(c.skill)}</span> <span class="dim">[${esc(tr.label || c.trait).toUpperCase()}: ${esc(tr.desc || '')}]</span><br>
          GEHALTSWUNSCH ${fmtDM(c.salary)}${afterOver ? ' <span class="err">· ÜBER BUDGET</span>' : ''}</div>
        <div class="r"><button type="button" class="tbtn" data-act="hire" data-arg="${c.id}" ${tm.members.length >= g.teamMax() ? 'disabled' : ''}>EINSTELLEN</button></div>
      </div>`;
    }).join('');
    return `<h2>PERSONAL <span class="dim">${esc(g.stage.dept.toUpperCase())}</span></h2>
      <div class="kv">
        <span>PERSONALKOSTEN</span><span class="${over ? 'err' : ''}" data-live="payroll"></span>
        <span></span><span class="tbar ${over ? 'low' : ''}" data-bar="payroll"><span></span></span>
        <span>Ø MORAL</span><span data-live="morale"></span>
        <span></span><span class="tbar" data-bar="morale"><span></span></span>
        <span>TEAMLEISTUNG</span><span data-live="teamRate"></span>
        <span>GUTE MONATE</span><span>${tm.moraleMonths} (Ø MORAL AB 60 %)</span>
      </div>
      <div class="row">
        <button type="button" class="tbtn" data-act="dinner" data-need="${g.dinnerCost()}" ${dinnerDone || !tm.members.length ? 'disabled' : ''}>${dinnerDone ? 'TEAMESSEN DIESEN MONAT ERLEDIGT' : `TEAMESSEN · ${fmtDM(g.dinnerCost())} PRIVAT`}</button>
      </div>
      <h3>TEAM ${tm.members.length}/${g.teamMax()}</h3>
      ${members || '<p class="dim">Noch niemand in der Gruppe.</p>'}
      <h3>BEWERBUNGEN <span class="dim">NEUE JEDEN MONAT</span></h3>
      ${cands || '<p class="dim">Keine Bewerbungen.</p>'}`;
  }

  estimateShare(q, price) {
    const g = this.game;
    const kb = g.attract(q, price);
    const orion = g.s.story.flags.orion_home ? g.attract(ORION_HOME.q, ORION_HOME.price) : 0;
    return kb / (kb + orion + 0.6);
  }

  app_prod() {
    if (this.game.s.player.stage >= 3) return this.app_lines();
    const g = this.game, pd = g.s.product;
    let html = `<h2>PRODUKT <span class="dim">KB HC-1 · HEIMCOMPUTER</span></h2>`;
    const orionInfo = g.s.story.flags.orion_home
      ? `<p class="dim">KONKURRENZ: ${esc(ORION_HOME.name)} · QUALITÄT ${ORION_HOME.q}/10 · ${fmtDM(ORION_HOME.price)}</p>` : '';
    if (pd.stage === 'none') return html + '<p class="dim">Noch kein Produktauftrag. Der Vorstand berät.</p>';
    if (pd.stage === 'spec') {
      html += '<p>Lege die Ausstattung fest. Mehr Ausstattung bringt Qualität, kostet aber Entwicklungsarbeit.</p>';
      for (const [key, def] of Object.entries(PRODUCT_SPEC)) {
        html += `<h3>${esc(def.label.toUpperCase())}</h3><div class="row">${def.options.map((o) => `
          <button type="button" class="tbtn ${pd.spec[key] === o.id ? 'chosen' : ''}" data-act="spec" data-arg="${key}" data-val="${o.id}">${esc(o.label)}${o.need ? ` · +${fmtInt(o.need)} PKT` : ''}</button>`).join('')}</div>
          <p class="dim">${def.options.map((o) => `${esc(o.label)}: ${esc(o.note)}`).join(' · ')}</p>`;
      }
      html += `<div class="kv">
          <span>AUFWAND</span><span><b>${fmtInt(g.productNeed())} PKT</b>${g.s.story.flags.wb_choice === 'mikro' ? ' (−15 % DANK KB-MIKRO-STUDIE)' : ''}</span>
          <span>QUALITÄT</span><span><b>${g.productQuality()}/10</b> (ERWARTET, JE NACH TEAM)</span>
        </div>${orionInfo}
        <div class="row"><button type="button" class="tbtn" data-act="prod-start">ENTWICKLUNG STARTEN</button></div>
        <p class="dim">Die Entwicklung läuft als Projekt im Programm PROJ. Ein laufendes Projekt wird dafür pausiert.</p>`;
      return html;
    }
    if (pd.stage === 'dev') {
      const a = g.s.projects.active;
      html += a?.id === 'hc1' ? `<div class="kv">
          <span>ENTWICKLUNG</span><span data-live="projPP"></span>
          <span></span><span class="tbar big" data-bar="proj"><span></span></span>
          <span>QUALITÄT</span><span>${g.productQuality()}/10 (ERWARTET)</span>
        </div>
        <h3>ARBEITSZEIT IM PROJEKT</h3>
        <div class="row">${PROJECT_SHARES.map((x) => `<button type="button" class="tbtn ${g.s.projects.share === x ? 'chosen' : ''}" data-act="share" data-arg="${x}">${fmtPct(x)}</button>`).join('')}</div>
        <p class="dim">Gilt für dich und dein ganzes Team. Ab 50 % leidet die Moral unter dem Termindruck.</p>`
        : '<p class="dim">Die Entwicklung ist pausiert. Übernimm sie im Programm PROJ wieder.</p>';
      return html + orionInfo;
    }
    const sel = this.priceSel || pd.price;
    const priceRow = (act) => `<div class="row">${PRODUCT_PRICES.map((pr) => `
      <button type="button" class="tbtn ${sel === pr ? 'chosen' : ''}" data-act="${act}" data-arg="${pr}">${fmtDM(pr)} · ~${fmtPct(this.estimateShare(pd.quality, pr))} ANTEIL</button>`).join('')}</div>`;
    if (pd.stage === 'launch') {
      html += `<p>Der HC-1 ist fertig. Qualität laut Prüfabteilung: <b>${pd.quality}/10</b>.</p>
        <h3>VERKAUFSPREIS</h3>${priceRow('price-sel')}${orionInfo}
        <div class="row"><button type="button" class="tbtn" data-act="launch">MARKTEINFÜHRUNG ZU ${fmtDM(sel)}</button></div>
        <p class="dim">Der Anteil ist eine Schätzung des Vertriebs. Pro verkauftem Gerät erhältst du eine Erfolgsbeteiligung.</p>`;
      return html;
    }
    // Markt
    const rows = pd.history.slice(-8).reverse().map((h) => `<tr><td>${esc(h.label)}</td><td class="r">${fmtInt(h.units)}</td><td class="r">${fmtInt(h.orion)}</td><td class="r">${fmtPct(h.share)}</td><td class="r">${fmtInt(h.price)}</td></tr>`).join('');
    html += `<div class="kv">
        <span>VERKAUFT</span><span><b>${fmtInt(pd.units)} GERÄTE</b></span>
        <span>UMSATZ</span><span>${fmtDM(pd.revenue)}</span>
        <span>QUALITÄT</span><span>${pd.quality}/10</span>
      </div>
      <h3>PREIS ÄNDERN</h3>${priceRow('price-set')}
      ${rows ? `<h3>VERKÄUFE</h3><table class="ttable"><thead><tr><th>MONAT</th><th class="r">HC-1</th><th class="r">OR-HOME</th><th class="r">ANTEIL</th><th class="r">PREIS</th></tr></thead><tbody>${rows}</tbody></table>`
        : '<p class="dim">Die ersten Verkaufszahlen kommen zum Monatsende.</p>'}`;
    return html;
  }

  app_lines() {
    const g = this.game, f = g.s.story.flags;
    let html = `<h2>PRODUKTLINIEN <span class="dim">${esc(g.stage.dept.toUpperCase())}</span></h2>`;
    for (const [id, def] of Object.entries(LINES)) {
      const ln = g.s.lines[id];
      const unlocked = g.lineUnlocked(id);
      html += `<div class="member"><div><b>${esc(def.name.toUpperCase())}</b> <span class="dim">ORION: ${esc(def.orion)} · QUALITÄT ${g.orionQ(id)}/10 · ${fmtDM(g.orionPrice(id))}</span></div>`;
      if (!unlocked) {
        const t = TECHS.find((x) => x.id === def.needs);
        html += `<p class="dim">GESPERRT · BRAUCHT DIE TECHNOLOGIE „${esc(t.name)}“ (PROGRAMM F&amp;E)</p></div>`;
        continue;
      }
      if (id === 'pc' && f.pc_compat == null && !ln.model) html += '<p class="err">STANDARD NOCH NICHT ENTSCHIEDEN (SIEHE POST). OHNE ENTSCHEIDUNG GILT „EIGENER STANDARD“.</p>';
      if (ln.model) {
        const m = ln.model, last = ln.last;
        html += `<div class="kv">
          <span>IM HANDEL</span><span><b>${esc(m.name)}</b> · QUALITÄT ${m.q}/10 · SEIT ${m.months} MONATEN</span>
          <span>LETZTER MONAT</span><span>${last ? `${fmtInt(last.units)} STÜCK · ORION ${fmtInt(last.orion)} · ANTEIL ${fmtPct(last.share)}` : 'NOCH KEINE ZAHLEN'}</span>
          <span>GESAMT</span><span>${fmtInt(ln.units)} STÜCK · ${fmtDM(ln.revenue)}</span>
        </div>
        <div class="row"><span class="dim">PREIS</span>${def.prices.map((pr) => {
          const sh = g.lineShare(id, m.q, pr, ln.marketing);
          return `<button type="button" class="tbtn small ${m.price === pr ? 'chosen' : ''}" data-act="line-price" data-line="${id}" data-arg="${pr}">${fmtInt(toCur(pr))} · ~${fmtPct(sh.kb / sh.total)}</button>`;
        }).join('')}</div>
        <div class="row"><span class="dim">MARKETING</span>${MARKETING.map((mk, k) => `<button type="button" class="tbtn small ${ln.marketing === k ? 'chosen' : ''}" data-act="line-mk" data-line="${id}" data-arg="${k}">${mk.label}${mk.cost ? ` ${fmtInt(toCur(mk.cost) / 1000)} T${cur()}` : ''}</button>`).join('')}</div>`;
      }
      if (ln.devGen) {
        const a = g.s.projects.active;
        const pid = `model-${id}-${ln.devGen}`;
        html += `<p>IN ENTWICKLUNG: <b>${esc(g.modelName(id, ln.devGen))}</b> ${a?.id === pid ? `· ${fmtInt(a.pp)}/${fmtInt(a.need)} PKT` : '<span class="err">· PAUSIERT, IN PROJ WIEDER ÜBERNEHMEN</span>'}</p>`;
      } else if (ln.pending) {
        const pn = ln.pending;
        html += `<p class="ok">FERTIG: <b>${esc(pn.name)}</b> · QUALITÄT ${pn.q}/10. PREIS WÄHLEN UND IN DEN HANDEL BRINGEN:</p>
          <div class="row">${def.prices.map((pr) => {
            const sh = g.lineShare(id, pn.q, pr, ln.marketing);
            return `<button type="button" class="tbtn small" data-act="line-launch" data-line="${id}" data-arg="${pr}">${fmtDM(pr)} · ~${fmtPct(sh.kb / sh.total)}</button>`;
          }).join('')}</div>`;
      } else {
        const gen = ln.gen + 1;
        const need = Math.round((def.devNeed * (1 + 0.2 * (gen - 1))) / 50) * 50;
        html += `<div class="row"><button type="button" class="tbtn" data-act="line-dev" data-line="${id}">${ln.model ? 'NACHFOLGER' : 'ERSTES MODELL'} ENTWICKELN: ${esc(g.modelName(id, gen))}</button>
          <span class="dim">${fmtInt(need)} PKT · ERWARTETE QUALITÄT ${g.lineQuality(id)}/10</span></div>`;
      }
      html += '</div>';
    }
    return html + '<p class="dim">Neue Modelle laufen als Projekt im Programm PROJ. Das alte Modell verkauft sich weiter, bis der Nachfolger im Handel ist.</p>';
  }

  app_fue() {
    const g = this.game, rd = g.s.rd;
    const curTech = TECHS.find((x) => x.id === rd.current);
    const list = TECHS.map((t) => {
      const done = g.techDone(t.id), avail = g.techAvailable(t), isCur = rd.current === t.id;
      const req = t.req.length ? ` · BRAUCHT ${t.req.map((r) => TECHS.find((x) => x.id === r).name).join(', ')}` : '';
      return `<div class="shop-row ${done ? 'owned' : !avail ? 'locked' : ''}">
        <div><b>${done ? '[X]' : isCur ? '[>]' : '[ ]'} ${esc(t.name)}</b> <span class="dim">${fmtInt(t.cost)} FP${esc(req)}</span><br><span class="dim">${esc(t.desc)}</span></div>
        <div class="r">${done ? '<span class="ok">ERFORSCHT</span>' : isCur ? '<span class="ok">IN ARBEIT</span>' : avail ? `<button type="button" class="tbtn small" data-act="tech" data-arg="${t.id}">FORSCHEN</button>` : '<span class="dim">GESPERRT</span>'}</div>
      </div>`;
    }).join('');
    return `<h2>FORSCHUNG &amp; ENTWICKLUNG <span class="dim">LABOR GEBÄUDE D</span></h2>
      <div class="kv">
        <span>BUDGET</span><span>${fmtDM(rd.budget)} / MONAT (GEHT VOM ERGEBNIS AB)</span>
        <span>GUTHABEN</span><span><b>${fmtInt(rd.pool)} FP</b> · +${fmtInt(g.rdPerMonth())} FP ZUM MONATSENDE</span>
        <span>AKTUELL</span><span>${curTech ? `${esc(curTech.name)} · ${fmtInt(Math.min(rd.pool, curTech.cost))}/${fmtInt(curTech.cost)} FP` : '<span class="err">NICHTS AUSGEWÄHLT</span>'}</span>
      </div>
      ${curTech ? `<span class="tbar big"><span style="width:${Math.min(100, (rd.pool / curTech.cost) * 100).toFixed(1)}%"></span></span>` : ''}
      <div class="row"><span class="dim">BUDGET</span>${RD_BUDGETS.map((b) => `<button type="button" class="tbtn small ${rd.budget === b ? 'chosen' : ''}" data-act="rd-budget" data-arg="${b}">${b ? `${fmtInt(toCur(b) / 1000)} T${cur()}` : 'KEINS'}</button>`).join('')}</div>
      <h3>TECHNOLOGIEN ${rd.done.length}/${TECHS.length}</h3>${list}
      <p class="dim">Kreative Leute im Team erhöhen die Forschungspunkte.</p>`;
  }

  app_abt() {
    const g = this.game, d = g.s.dept;
    const T = (x) => fmtInt(Math.round(toCur(x) / 1000));
    const rows = d.history.slice(-6).reverse().map((h) => `<tr><td>${esc(h.label)}</td><td class="r">${T(h.revenue)}</td><td class="r">${T(h.gross)}</td><td class="r">${T(h.payroll)}</td><td class="r">${T(h.rd)}</td><td class="r">${T(h.mkt)}</td><td class="r ${h.result >= 0 ? 'ok' : 'err'}">${T(h.result)}</td></tr>`).join('');
    return `<h2>ABTEILUNGSERGEBNIS <span class="dim">${esc(g.stage.dept.toUpperCase())}</span></h2>
      <div class="kv">
        <span>BESTER MONAT</span><span>${fmtDM(Math.max(0, d.best))}</span>
        <span>SCHWARZE ZAHLEN</span><span>${d.posStreak} MONAT${d.posStreak === 1 ? '' : 'E'} IN FOLGE</span>
        <span>BETEILIGUNG</span><span>${fmtPct(DEPT_COMMISSION, 2)} DES POSITIVEN ERGEBNISSES AUF DEINER ABRECHNUNG</span>
      </div>
      ${rows ? `<h3>LETZTE MONATE <span class="dim">IN TAUSEND ${cur()}</span></h3><table class="ttable"><thead><tr><th>MONAT</th><th class="r">UMSATZ</th><th class="r">ROHERTR.</th><th class="r">PERSONAL</th><th class="r">F&amp;E</th><th class="r">MARKET.</th><th class="r">ERGEBNIS</th></tr></thead><tbody>${rows}</tbody></table>`
        : '<p class="dim">Die erste Abrechnung der Abteilung kommt zum Monatsende.</p>'}
      <p class="dim">Ergebnis = Rohertrag aller Linien minus Personal, Forschung und Marketing.</p>`;
  }

  app_netz() {
    const g = this.game, net = g.s.net;
    if (!net.invest && !net.nodes.length) return '<h2>KB-NET <span class="dim">ONLINEDIENST</span></h2><p class="dim">Noch kein Budget. Herr Kessler will mit dir darüber sprechen.</p>';
    const frozen = g.netFrozen();
    const last = net.history.at(-1);
    const cities = NET_CITIES.map((c) => {
      const built = net.nodes.includes(c.id), cost = NET_NODE_COST(c.pop);
      return `<div class="shop-row ${built ? 'owned' : ''}">
        <div><b>${esc(c.name)}</b> <span class="dim">${fmtInt(c.pop)} EINWOHNER</span></div>
        <div class="r">${built ? '<span class="ok">KNOTEN AKTIV</span>' : `<button type="button" class="tbtn small" data-act="node" data-arg="${c.id}" ${net.invest < cost || frozen ? 'disabled' : ''}>BAUEN · ${fmtNum(cost / 1e6)} MIO.</button>`}</div>
      </div>`;
    }).join('');
    const up = NET_UPGRADES[net.qLevel];
    const comps = g.netCompetitors().map((c) => `${esc(c.name)} Q${c.q} · ${fmtDM(c.tariff)}`).join(' · ');
    const rows = net.history.slice(-6).reverse().map((h) => `<tr><td>${esc(h.label)}</td><td class="r">${fmtInt(h.subs)}</td><td class="r ${h.delta >= 0 ? 'ok' : 'err'}">${h.delta >= 0 ? '+' : ''}${fmtInt(h.delta)}</td><td class="r">${fmtInt(toCur(h.revenue) / 1000)}</td><td class="r">${fmtInt(toCur(h.cost) / 1000)}</td><td class="r ${h.result >= 0 ? 'ok' : 'err'}">${fmtInt(toCur(h.result) / 1000)}</td></tr>`).join('');
    return `<h2>KB-NET <span class="dim">ONLINEDIENST</span></h2>
      ${frozen ? '<p class="err">INVESTITIONEN VOM VORSTAND EINGEFROREN</p>' : ''}
      <div class="kv">
        <span>KUNDEN</span><span><b>${fmtInt(net.subs)}</b>${last ? ` (${last.delta >= 0 ? '+' : ''}${fmtInt(last.delta)} IM LETZTEN MONAT)` : ''}</span>
        <span>REICHWEITE</span><span>${fmtInt(g.netCovered())} EINWOHNER · ${fmtPct(g.adoption(), 1)} DAVON ONLINE</span>
        <span>INVESTITION</span><span>${fmtDM(net.invest)} VERFÜGBAR</span>
        <span>QUALITÄT</span><span>${g.netQuality()}/10 · ${esc(NET_UPGRADES[net.qLevel - 1]?.name || 'Modems mit 2.400 Baud')}</span>
        <span>BETRIEB</span><span>${fmtDM(NET_NODE_UPKEEP)} JE KNOTEN UND MONAT</span>
        <span>KONKURRENZ</span><span>${comps}</span>
      </div>
      <div class="row"><span class="dim">TARIF/MONAT</span>${NET_TARIFFS.map((x) => `<button type="button" class="tbtn small ${net.tariff === x ? 'chosen' : ''}" data-act="tariff" data-arg="${x}">${fmtDM(x)} · ~${fmtPct(g.netShareEstimate(x))}</button>`).join('')}</div>
      <div class="row"><span class="dim">MARKETING</span>${MARKETING.map((mk, k) => `<button type="button" class="tbtn small ${net.marketing === k ? 'chosen' : ''}" data-act="net-mk" data-arg="${k}">${mk.label}${mk.cost ? ` ${fmtInt(toCur(mk.cost) / 1000)} T${cur()}` : ''}</button>`).join('')}</div>
      ${up ? `<div class="row"><button type="button" class="tbtn" data-act="net-up" ${net.invest < up.cost || frozen ? 'disabled' : ''}>AUSBAU: ${esc(up.name.toUpperCase())} · ${fmtNum(up.cost / 1e6)} MIO.</button><span class="dim">+QUALITÄT</span></div>` : '<p class="ok">TECHNIK AUF DEM NEUESTEN STAND</p>'}
      <h3>EINWAHLKNOTEN ${net.nodes.length}/${NET_CITIES.length}</h3>${cities}
      ${rows ? `<h3>LETZTE MONATE <span class="dim">UMSATZ/KOSTEN/ERGEBNIS IN T${cur()}</span></h3><table class="ttable"><thead><tr><th>MONAT</th><th class="r">KUNDEN</th><th class="r">NEU</th><th class="r">UMSATZ</th><th class="r">KOSTEN</th><th class="r">ERGEBNIS</th></tr></thead><tbody>${rows}</tbody></table>` : '<p class="dim">Die ersten Kunden kommen zum Monatsende, sobald ein Knoten steht.</p>'}`;
  }

  app_fin() {
    const g = this.game, c = g.s.corp, sh = g.s.shares;
    if (!c.active) return '<h2>FINANZEN</h2><p class="dim">Noch nicht im Vorstand.</p>';
    const M = (x) => `${fmtNum(toCur(x) / 1e6)} MIO. ${cur()}`;
    const last = c.history.at(-1);
    const owned = c.owned.map((o) => {
      const st = STARTUPS.find((x) => x.id === o.id), v = g.startupValue(o.id);
      return `<div class="shop-row"><div><b>${esc(st.name)}</b> <span class="dim">${esc(st.desc)}</span><br>
        GEKAUFT FÜR ${M(o.paid)} · WERT HEUTE <span class="${v >= o.paid ? 'ok' : 'err'}">${M(v)}</span> · VERBRENNT ${M(st.burn)} IM MONAT</div>
        <div class="r"><button type="button" class="tbtn small" data-act="sell-st" data-arg="${o.id}">VERKAUFEN · ${M(v * 0.9)}</button></div></div>`;
    }).join('');
    const offers = c.offers.map((id) => {
      const st = STARTUPS.find((x) => x.id === id), v = g.startupValue(id);
      return `<div class="shop-row"><div><b>${esc(st.name)}</b> <span class="dim">${esc(st.desc)}</span><br>
        KAUFPREIS ${M(v)} · VERBRENNT ${M(st.burn)} IM MONAT</div>
        <div class="r"><button type="button" class="tbtn small" data-act="buy-st" data-arg="${id}" ${c.cash < v ? 'disabled' : ''}>KAUFEN</button></div></div>`;
    }).join('');
    const rows = c.history.slice(-6).reverse().map((h) => `<tr><td>${esc(h.label)}</td><td class="r">${fmtNum(toCur(h.legacy) / 1e6)}</td><td class="r">${fmtNum(toCur(h.bereich) / 1e6)}</td><td class="r">${fmtNum(toCur(h.startups) / 1e6)}</td><td class="r">${fmtNum(toCur(-h.interest) / 1e6)}</td><td class="r ${h.result >= 0 ? 'ok' : 'err'}">${fmtNum(toCur(h.result) / 1e6)}</td></tr>`).join('');
    return `<h2>FINANZEN <span class="dim">KONZERN · RESSORT ${esc(g.stage.title.toUpperCase())}</span></h2>
      <div class="kv">
        <span>KONZERNKASSE</span><span class="${c.cash < 0 ? 'err' : ''}"><b>${fmtDM(c.cash)}</b>${c.negMonths ? ` · ${c.negMonths} MONAT(E) IM MINUS` : ''}</span>
        <span>KREDITE</span><span>${fmtDM(c.debt)} · ${fmtPct(CORP_LOAN_RATE, 1)} ZINS</span>
        <span>LETZTER MONAT</span><span class="${last && last.result < 0 ? 'err' : ''}">${last ? `ERGEBNIS ${M(last.result)}` : 'NOCH KEINE ZAHLEN'}</span>
        <span>KB-AKTIE</span><span><b>${fmtDM(sh.price)}</b> · BÖRSE: ${g.mood()} · WERT VOR DEM HYPE ${fmtDM(c.base)}</span>
        <span>BÖRSENWERT</span><span>${fmtDM(sh.price * c.shares)} · ${fmtInt(c.shares)} AKTIEN</span>
        <span>DEIN ANTEIL</span><span>${fmtInt(sh.owned)} AKTIEN · ${fmtPct(sh.owned / c.shares, 4)}</span>
      </div>
      <div class="row"><span class="dim">DIVIDENDE</span>${DIVIDEND_POLICIES.map((d) => `<button type="button" class="tbtn small ${c.policy === d.id ? 'chosen' : ''}" data-act="policy" data-arg="${d.id}">${d.label} · ${fmtPct(d.payout)}</button>`).join('')}</div>
      <div class="row"><span class="dim">KREDIT</span>
        <button type="button" class="tbtn small" data-act="loan" data-arg="1">+${M(CORP_LOAN_STEP)} AUFNEHMEN</button>
        <button type="button" class="tbtn small" data-act="loan" data-arg="-1" ${c.debt < CORP_LOAN_STEP || c.cash < CORP_LOAN_STEP ? 'disabled' : ''}>${M(CORP_LOAN_STEP)} TILGEN</button></div>
      <div class="row"><span class="dim">KAPITAL</span>
        <button type="button" class="tbtn small" data-act="issue" ${g.canIssue() ? '' : 'disabled'}>KAPITALERHÖHUNG 10 % · CA. ${M(g.issueValue())}</button>
        ${g.canIpo() ? `<button type="button" class="tbtn small" data-act="ipo">KB-NET AN DIE BÖRSE (49 %) · CA. ${M(g.ipoValue())}</button>` : c.ipo ? '<span class="dim">KB-NET IST BÖRSENNOTIERT, 49 % GEHÖREN ANLEGERN</span>' : ''}</div>
      <p class="dim">Eine Kapitalerhöhung bringt Geld, verwässert aber deinen Stimmanteil und drückt kurz den Kurs. Einmal pro Jahr möglich.</p>
      ${owned ? `<h3>BETEILIGUNGEN</h3>${owned}` : ''}
      ${offers ? `<h3>ANGEBOTE VOM NEUEN MARKT</h3>${offers}` : ''}
      ${rows ? `<h3>KONZERNERGEBNIS <span class="dim">IN MIO. ${cur()}</span></h3><table class="ttable"><thead><tr><th>MONAT</th><th class="r">STAMM</th><th class="r">BEREICHE</th><th class="r">BETEIL.</th><th class="r">ZINS</th><th class="r">ERGEBNIS</th></tr></thead><tbody>${rows}</tbody></table>` : '<p class="dim">Das erste Konzernergebnis kommt zum Monatsende.</p>'}`;
  }

  app_abwehr() {
    const g = this.game, to = g.s.takeover, c = g.s.corp;
    if (!to.active) return `<h2>ÜBERNAHMEABWEHR</h2><p class="dim">Noch ist alles ruhig. Behalte Orion im Auge.</p>`;
    const blocks = g.loyalBlocks();
    const loyal = g.loyalTotal(), float = g.floatPct();
    const left = Math.max(0, to.hvMonth - g.s.time.totalMonths);
    const seg = (pct, cls, label) => `<span class="seg ${cls}" style="width:${Math.max(0, pct).toFixed(1)}%" title="${esc(label)}"></span>`;
    const rows = to.history.slice(-7).reverse().map((h) => `<tr><td>${esc(h.label)}</td><td class="r err">${fmtNum(h.orion)} %</td><td class="r ok">${fmtNum(h.loyal)} %</td><td class="r">${fmtNum(h.float)} %</td></tr>`).join('');
    const status = to.done ? (to.won ? '<p class="ok">ABGEWEHRT. KB BLEIBT UNABHÄNGIG.</p>' : '<p class="err">ORION HAT DIE MEHRHEIT.</p>')
      : `<p>HAUPTVERSAMMLUNG IN <b>${left} MONAT${left === 1 ? '' : 'EN'}</b>. ORION BRAUCHT 50 %.</p>`;
    return `<h2>ÜBERNAHMEABWEHR <span class="dim">ORION GEGEN KB</span></h2>
      ${status}
      <div class="stack" aria-label="Stimmenverteilung">${seg(to.orion, 'orion', 'Orion')}${seg(float, 'float', 'Streubesitz')}${seg(to.buyback, 'retired', 'Zurückgekauft')}${seg(loyal, 'loyal', 'Treue Aktionäre')}<i class="mid"></i></div>
      <div class="kv">
        <span class="err">ORION</span><span><b>${fmtNum(to.orion)} %</b> · KAUFT MONATLICH CA. ${fmtPct(g.orionBuyRate())} DES STREUBESITZES</span>
        <span>STREUBESITZ</span><span>${fmtNum(float)} % · KÖNNEN AN ORION VERKAUFEN</span>
        <span class="ok">TREU ZU KB</span><span><b>${fmtNum(loyal)} %</b></span>
        <span>ANGEBOT</span><span>${fmtDM(to.offer)} JE AKTIE · KURS ${fmtDM(g.s.shares.price)} (${fmtPct(to.offer / g.s.shares.price - 1)} AUFSCHLAG)</span>
      </div>
      <ul class="tlist">${blocks.map((b) => `<li>${fmtNum(b.pct)} % ${esc(b.label)}</li>`).join('')}</ul>
      <p class="dim">Je höher der KB-Kurs im Vergleich zum Angebot, desto weniger Aktionäre verkaufen an Orion. Gute Ergebnisse und Kampagnen helfen.</p>
      ${to.done ? '' : `<h3>MASSNAHMEN · KASSE ${fmtDM(c.cash)}</h3>
      <div class="row"><button type="button" class="tbtn" data-act="buyback" ${to.buybacks >= TAKEOVER.maxBuybacks || c.cash < g.buybackCost() ? 'disabled' : ''}>AKTIENRÜCKKAUF −${TAKEOVER.buybackPct} % STREUBESITZ · ${fmtDM(g.buybackCost())}</button><span class="dim">${to.buybacks}/${TAKEOVER.maxBuybacks}</span></div>
      <div class="row"><button type="button" class="tbtn" data-act="campaign" ${to.campaignMonth === g.s.time.totalMonths || c.cash < TAKEOVER.campaignCost ? 'disabled' : ''}>KAMPAGNE FÜR DIE AKTIONÄRE · ${fmtDM(TAKEOVER.campaignCost)}</button><span class="dim">STÜTZT DEN KURS, 1× PRO MONAT</span></div>
      <div class="row"><button type="button" class="tbtn" data-act="pacman" ${c.cash < g.orionTakeoverPrice() ? 'disabled' : ''}>GEGENANGEBOT: ORION KAUFEN · ${fmtDM(g.orionTakeoverPrice())}</button></div>
      <p class="dim">Für das Gegenangebot brauchst du genug Geld in der Konzernkasse. Kredite gibt es im Programm FIN.</p>`}
      ${rows ? `<h3>VERLAUF</h3><table class="ttable"><thead><tr><th>MONAT</th><th class="r">ORION</th><th class="r">TREU</th><th class="r">FREI</th></tr></thead><tbody>${rows}</tbody></table>` : ''}`;
  }

  app_erf() {
    const a = this.game.s.achievements;
    const done = ACHIEVEMENTS.filter((x) => a[x.id]).length;
    return `<h2>ERFOLGE <span class="dim">${done}/${ACHIEVEMENTS.length}</span></h2>
      <ul class="tlist">${ACHIEVEMENTS.map((x) => `<li class="${a[x.id] ? 'ok' : 'dim'}">[${a[x.id] ? 'X' : ' '}] <b>${esc(x.name)}</b> · ${esc(x.desc)}${a[x.id] ? ` <span class="dim">(${esc(a[x.id])})</span>` : ''}</li>`).join('')}</ul>`;
  }

  app_lohn() {
    const slips = this.game.s.payslips;
    if (!slips.length) return `<h2>ENTGELTABRECHNUNGEN</h2><p class="dim">Die erste Abrechnung kommt zum Monatsende.</p>`;
    const rows = slips.slice().reverse().map((sl, ri) => {
      const idx = slips.length - 1 - ri;
      return `<tr><td>${MONTH_SHORT[sl.month]} ${sl.year}</td><td class="c g-${sl.grade}">${sl.grade}</td><td class="r">${numAt(sl.brutto, sl.year)}</td><td class="r">${numAt(sl.netto, sl.year)}</td>
        <td><button type="button" class="tbtn small" data-act="slip" data-arg="${idx}">ANSEHEN</button></td></tr>`;
    }).join('');
    const p = this.game.s.player;
    return `
      <h2>ENTGELTABRECHNUNGEN <span class="dim">PERS.-NR. ${esc(p.pnr)}</span></h2>
      <p class="dim">Netto seit Eintritt: ${fmtDM(p.totalNet)}</p>
      <table class="ttable"><thead><tr><th>MONAT</th><th class="c">NOTE</th><th class="r">BRUTTO</th><th class="r">NETTO</th><th></th></tr></thead>
      <tbody>${rows}</tbody></table>`;
  }

  app_depot(i) {
    const g = this.game, s = g.s, h = s.shares.history;
    const prev = h[Math.max(0, h.length - 7)];
    const chg = (s.shares.price - prev) / prev;
    const unit = g.employeePrice();
    return `
      <h2>KONTO UND DEPOT <span class="dim">KB-MITARBEITERDEPOT</span></h2>
      <div class="kv">
        <span>GIROKONTO</span><span><b data-live="cash"></b></span>
        <span>LEBENSHALTUNG</span><span>${fmtDM(g.stage.living)} / MONAT (MIETE, ESSEN, FAHRT)</span>
      </div>
      <div class="stock">
        <div class="stock-head">
          <span>KB RECHENWERKE AG · INHABERAKTIE</span>
          <span><b data-live="price"></b> <span class="${chg >= 0 ? 'ok' : 'err'}">${chg >= 0 ? '▲' : '▼'} ${fmtPct(Math.abs(chg), 1)}</span></span>
        </div>
        <canvas class="chart" id="chart-${i}" width="320" height="90" aria-label="Kursverlauf der KB-Aktie"></canvas>
      </div>
      <div class="kv">
        <span>BESTAND</span><span><b data-live="owned"></b> STÜCK · <span data-live="depotValue"></span></span>
        <span>STIMMANTEIL</span><span data-live="vote"></span>
        <span>MITARBEITERPREIS</span><span><b data-live="eprice"></b> (${fmtPct(SHARE_DISCOUNT)} RABATT)</span>
        <span>DIVIDENDE</span><span>${fmtDM(DIVIDEND_PER_SHARE)} JE AKTIE IM DEZEMBER</span>
      </div>
      <div class="row">
        <button type="button" class="tbtn" data-act="buy" data-arg="1" data-need="${unit}">KAUFEN 1</button>
        <button type="button" class="tbtn" data-act="buy" data-arg="10" data-need="${unit * 10}">KAUFEN 10</button>
        <button type="button" class="tbtn" data-act="buy" data-arg="max" data-need="${unit}">KAUFEN MAX</button>
        <button type="button" class="tbtn dimbtn" data-act="sell" data-arg="1" ${s.shares.owned ? '' : 'disabled'}>VERKAUFEN 1</button>
        <button type="button" class="tbtn dimbtn" data-act="sell" data-arg="10" ${s.shares.owned >= 10 ? '' : 'disabled'}>VERKAUFEN 10</button>
      </div>
      <p class="dim">Verkauf zum Börsenkurs abzüglich 1 % Gebühr.</p>`;
  }

  drawChart(i) {
    const cv = this.root.querySelector(`#chart-${i}`);
    if (!cv) return;
    const c = cv.getContext('2d');
    const h = this.game.s.shares.history;
    const lo = Math.min(...h) * 0.98, hi = Math.max(...h) * 1.02;
    const W = cv.width, H = cv.height;
    c.clearRect(0, 0, W, H);
    const two = this.game.era() >= 2;
    c.fillStyle = two ? 'rgba(0,0,0,0.12)' : 'rgba(77,255,124,0.10)';
    for (let y = 0; y < H; y += 18) c.fillRect(0, y, W, 1);
    const X = (k) => (k / (h.length - 1)) * (W - 4) + 2;
    const Y = (v) => H - 4 - ((v - lo) / (hi - lo)) * (H - 8);
    c.fillStyle = two ? 'rgba(31,58,138,0.18)' : 'rgba(77,255,124,0.16)';
    c.beginPath(); c.moveTo(X(0), H);
    h.forEach((v, k) => c.lineTo(X(k), Y(v)));
    c.lineTo(X(h.length - 1), H); c.fill();
    c.strokeStyle = two ? '#1f3a8a' : '#4dff7c'; c.lineWidth = 2;
    c.beginPath(); h.forEach((v, k) => (k ? c.lineTo(X(k), Y(v)) : c.moveTo(X(k), Y(v)))); c.stroke();
    c.fillStyle = two ? '#000' : '#c9ffd6'; c.fillRect(X(h.length - 1) - 3, Y(h.at(-1)) - 3, 6, 6);
  }

  app_shop() {
    const g = this.game;
    // kaufbare zuerst, dann gesperrte, gekaufte zuletzt
    const order = (u) => (g.owned(u.id) ? 2 : (u.minStage || 0) > g.s.player.stage ? 1 : 0);
    const rows = UPGRADES.filter((u) => u.shop !== false).sort((a, b) => order(a) - order(b) || a.price - b.price).map((u) => {
      const own = g.owned(u.id);
      const locked = (u.minStage || 0) > g.s.player.stage;
      return `<div class="shop-row ${own ? 'owned' : ''} ${locked ? 'locked' : ''}">
        <div><b>${esc(u.name)}</b> <span class="dim">[${u.kind.toUpperCase()}]</span><br><span class="dim">${esc(u.desc.replace(/\+(\d+) Leistung\/s/, (m, n) => `+${n * 60} Leistung pro Monat`))}</span></div>
        <div class="r">${own ? '<span class="ok">AM PLATZ</span>' : locked ? `<span class="dim">AB ${esc(STAGES[u.minStage].title.toUpperCase())}</span>`
          : `<button type="button" class="tbtn" data-act="upgrade" data-arg="${u.id}" data-need="${u.price}">${fmtDM(u.price)}</button>`}</div>
      </div>`;
    }).join('');
    return `<h2>BÜROBEDARF <span class="dim">HAUSINTERNE BESTELLUNG</span></h2>
      <p class="dim">Bezahlt wird privat vom Girokonto. Kontostand: <span data-live="cash"></span></p>
      <div class="shop">${rows}</div>`;
  }

  app_karr() {
    const g = this.game, s = g.s, p = s.player, d = g.diff;
    const ms = MISSIONS[p.stage] || [];
    const missions = ms.length ? ms.map((m) => {
      const [a, b] = m.prog(g);
      const done = a >= b;
      return `<li class="${done ? 'ok' : ''}">[${done ? 'X' : ' '}] ${esc(m.text)} <span class="dim">${Math.min(a, b)}/${b}</span></li>`;
    }).join('') : `<li class="dim">Kapitel ${p.stage + 1} ist in Arbeit. Du kannst als ${esc(g.stage.title)} endlos weiterspielen. Neue Projekte gibt es laufend im Programm PROJ.</li>`;
    const ladder = STAGES.map((st, i) => `<li class="${i === p.stage ? 'here' : i < p.stage ? 'past' : 'dim'}">${i === p.stage ? '►' : ' '} ${String(i + 1)} ${esc(st.title.toUpperCase())} <span class="dim">AB CA. ${st.year}</span></li>`).join('');
    const grades = p.grades.slice(-12).map((x) => `<span class="g-${x}">${x}</span>`).join(' ') || '<span class="dim">noch keine</span>';
    const warnText = d.warningsLimit === Infinity ? `${p.warnings} (kein Game Over)` : `${p.warnings} von ${d.warningsLimit}`;
    return `<h2>KARRIERE <span class="dim">PERSONALAKTE ${esc(p.pnr)}</span></h2>
      <div class="kv">
        <span>NAME</span><span>${esc(p.name)}</span>
        <span>POSITION</span><span><b>${esc(g.stage.title)}</b>, ${esc(g.stage.dept)}</span>
        <span>GRUNDGEHALT</span><span>${fmtDM(g.stage.salary)} BRUTTO</span>
        <span>RUF</span><span>${p.rep}</span>
        <span>ABMAHNUNGEN</span><span class="${p.warnings ? 'err' : ''}">${warnText}</span>
        <span>NOTEN</span><span class="grades">${grades}</span>
      </div>
      <h3>ZIELE FÜR DIE BEFÖRDERUNG</h3>
      <ul class="tlist">${missions}</ul>
      ${s.story.flags.endless ? '<p class="ok">Die Geschichte ist erzählt. KB gehört dir. Ab jetzt läuft der Endlosmodus mit neuen Projekten, Produkten und Ereignissen.</p>' : missionsDone(g) && p.stage < 6 ? '<p class="ok">Alle Ziele erreicht. Bald wird jemand mit dir sprechen.</p>' : ''}
      <h3>LAUFBAHN BEI KB</h3>
      <ul class="tlist ladder">${ladder}</ul>`;
  }

  app_sys() {
    const s = this.game.s;
    const saved = new Date(s.lastSaved).toLocaleTimeString('de-DE');
    return `<h2>SYSTEM <span class="dim">SPIELSTAND</span></h2>
      <div class="kv">
        <span>SCHWIERIGKEIT</span><span>${esc(DIFFICULTIES[s.difficulty].label.toUpperCase())}</span>
        <span>GESPEICHERT</span><span>${saved} (AUTOMATISCH ALLE 10 S)</span>
      </div>
      <div class="row">
        <button type="button" class="tbtn" data-act="save">JETZT SPEICHERN</button>
        <label class="tcheck"><input type="checkbox" id="opt-autoslip" data-opt="autoPayslip" ${s.settings.autoPayslip ? 'checked' : ''}> ABRECHNUNG AUTOMATISCH ZEIGEN</label>
        <label class="tcheck"><input type="checkbox" id="opt-sound" data-opt="sound" ${s.settings.sound ? 'checked' : ''}> TÖNE</label>
      </div>
      <div class="row"><span class="dim">MONATSLÄNGE</span>${[60, 120, 180, 300].map((x) => `<button type="button" class="tbtn small ${this.game.monthSeconds() === x ? 'chosen' : ''}" data-act="month-len" data-arg="${x}">${x / 60} MIN</button>`).join('')}</div>
      <p class="dim">Ein längerer Monat lässt mehr Zeit für die Aufträge. Monatsziele und Grundleistung pro Monat bleiben gleich. [P] pausiert das Spiel.</p>
      <h3>EXPORT</h3>
      <p class="dim">Kopiere den Code, um den Spielstand auf einen anderen Rechner zu übertragen.</p>
      <div class="row">
        <button type="button" class="tbtn" data-act="export">CODE ERZEUGEN</button>
        <button type="button" class="tbtn" data-act="copy" ${this.exportText ? '' : 'disabled'}>KOPIEREN</button>
        <button type="button" class="tbtn" data-act="download">ALS DATEI SPEICHERN</button>
      </div>
      <textarea id="export-out" class="tarea" readonly rows="3" aria-label="Exportcode">${esc(this.exportText)}</textarea>
      <h3>IMPORT</h3>
      <textarea id="import-in" class="tarea" rows="3" placeholder="Exportcode hier einfügen" aria-label="Importcode"></textarea>
      <div class="row">
        <button type="button" class="tbtn" data-act="import">CODE LADEN</button>
        <label class="tbtn file">DATEI LADEN<input type="file" id="import-file" accept=".json,.txt,application/json,text/plain" hidden></label>
      </div>
      <p class="sys-msg" id="sys-msg" role="status"></p>
      <h3>NEUES SPIEL</h3>
      ${this.confirmNew
        ? `<p class="err">Der aktuelle Spielstand wird gelöscht.</p><div class="row"><button type="button" class="tbtn" data-act="new-yes">JA, NEU BEGINNEN</button><button type="button" class="tbtn" data-act="new-no">ABBRECHEN</button></div>`
        : `<button type="button" class="tbtn dimbtn" data-act="new">NEUES SPIEL …</button>`}`;
  }

  sysMsg(text, ok = true) {
    const el = this.root.querySelector('#sys-msg');
    if (el) { el.textContent = text; el.className = 'sys-msg ' + (ok ? 'ok' : 'err'); }
  }

  // ------------------------------------------------------------ Eingaben
  onKey(e) {
    if (e.target.classList?.contains('task-input') && e.key.length === 1) sfx.key();
    if (e.target.classList?.contains('task-input') && e.key === 'Enter') {
      e.preventDefault();
      const val = e.target.value;
      if (!val.trim()) return;
      const r = this.game.submitTask(val);
      this.lastResult = r;
      (r.ok ? sfx.ok : sfx.error)();
      const pane = Number(e.target.dataset.pane);
      this.renderPane(pane);
      this.refreshLive();
      const inp = this.root.querySelector(`#task-input-${pane}`);
      inp.focus();
      const crt = this.root.querySelector(`.crt[data-pane="${pane}"]`);
      crt.classList.remove('flash-ok', 'flash-err');
      void crt.offsetWidth;
      crt.classList.add(r.ok ? 'flash-ok' : 'flash-err');
      // anderes Fenster aktualisieren, falls dort Karriere offen ist
      this.panes.forEach((a, k) => { if (k !== pane && a === 'karr') this.renderPane(k); });
    }
  }

  onChange(e) {
    if (e.target.dataset.opt) {
      this.game.s.settings[e.target.dataset.opt] = e.target.checked;
      if (e.target.dataset.opt === 'sound') setSound(e.target.checked);
    }
    if (e.target.id === 'import-file' && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => this.doImport(String(reader.result));
      reader.readAsText(e.target.files[0]);
    }
  }

  doImport(text) {
    try {
      const obj = Game.parseCode(text);
      this.ui.importSave(obj);
    } catch {
      this.sysMsg('Der Code ist ungültig. Bitte den vollständigen Exportcode einfügen.', false);
    }
  }

  onClick(e) {
    const appBtn = e.target.closest('button[data-app]');
    if (appBtn) {
      const pane = Number(appBtn.dataset.pane);
      this.panes[pane] = appBtn.dataset.app;
      if (appBtn.dataset.app !== 'aufg') this.lastResult = null;
      this.confirmNew = false;
      this.renderPane(pane);
      this.refreshLive();
      if (appBtn.dataset.app === 'aufg') this.root.querySelector(`#task-input-${pane}`)?.focus();
      if (appBtn.dataset.app === 'post') this.rerender(['post']);
      return;
    }
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const g = this.game, act = b.dataset.act, arg = b.dataset.arg;
    switch (act) {
      case 'mail': this.mailSel = arg; this.rerender(['post']); break;
      case 'mail-choice': g.chooseMail(arg, Number(b.dataset.idx)); this.rerender(); break;
      case 'slip': this.ui.showPayslip(g.s.payslips[Number(arg)]); break;
      case 'project':
        if (g.startProject(arg)) this.ui.toast('Projekt übernommen', 'good');
        this.rerender(['proj']); break;
      case 'share': g.setProjectShare(Number(arg)); this.rerender(['proj', 'prod']); break;
      case 'praise': if (g.praise(Number(arg))) this.ui.toast('Lob ausgesprochen', 'good'); this.rerender(['pers']); break;
      case 'raise': g.raiseSalary(Number(arg)); this.ui.toast('Gehalt erhöht'); this.rerender(['pers']); break;
      case 'fire': this.confirmFire = Number(arg); this.rerender(['pers']); break;
      case 'fire-no': this.confirmFire = null; this.rerender(['pers']); break;
      case 'fire-yes': { const m = g.fire(Number(arg)); this.confirmFire = null; if (m) this.ui.toast(`${m.name} entlassen`, 'bad'); this.rerender(['pers', 'karr']); break; }
      case 'hire': { const m = g.hire(Number(arg)); if (m) this.ui.toast(`${m.name} eingestellt`, 'good'); this.rerender(['pers', 'karr']); break; }
      case 'dinner': { const c = g.dinner(); if (c) this.ui.toast(`Teamessen beim Griechen: ${fmtDM(c)}`, 'good'); this.rerender(['pers']); break; }
      case 'spec': g.setSpec(arg, b.dataset.val); this.rerender(['prod']); break;
      case 'line-dev': if (g.startModel(b.dataset.line)) this.ui.toast('Entwicklung gestartet', 'good'); this.rerender(['prod', 'proj']); break;
      case 'line-launch': if (g.launchModel(b.dataset.line, Number(arg))) this.ui.toast('Neues Modell im Handel', 'good'); this.rerender(['prod', 'karr']); break;
      case 'line-price': g.setLinePrice(b.dataset.line, Number(arg)); this.rerender(['prod']); break;
      case 'line-mk': g.setMarketing(b.dataset.line, Number(arg)); this.rerender(['prod']); break;
      case 'rd-budget': g.setRdBudget(Number(arg)); this.rerender(['fue']); break;
      case 'tech': g.selectTech(arg); this.rerender(['fue', 'prod']); break;
      case 'node': if (g.buildNode(arg)) this.ui.toast('Einwahlknoten in Betrieb', 'good'); this.rerender(['netz', 'karr']); break;
      case 'net-up': if (g.upgradeNet()) this.ui.toast('Modempool ausgebaut', 'good'); this.rerender(['netz']); break;
      case 'tariff': g.setTariff(Number(arg)); this.rerender(['netz']); break;
      case 'policy': g.setPolicy(arg); this.rerender(['fin']); break;
      case 'month-len': g.setMonthSeconds(Number(arg)); this.ui.toast(`Ein Monat dauert jetzt ${Number(arg) / 60} Minute${Number(arg) === 60 ? '' : 'n'}`); this.rerender(['sys', 'aufg']); break;
      case 'buyback': { const v = g.buyback(); if (v) this.ui.toast(`Aktienrückkauf: ${fmtDM(v)}`, 'good'); this.rerender(['abwehr', 'fin']); break; }
      case 'campaign': if (g.campaign()) this.ui.toast('Kampagne läuft: Anzeigen in allen Wirtschaftszeitungen', 'good'); this.rerender(['abwehr', 'fin']); break;
      case 'pacman': { const v = g.pacman(); if (v) this.ui.toast(`Gegenangebot angenommen: KB kauft Orion für ${fmtDM(v)}`, 'good'); this.rerender(['abwehr', 'fin']); break; }
      case 'loan': if (g.loan(Number(arg))) this.ui.toast(Number(arg) > 0 ? 'Kredit aufgenommen' : 'Kredit getilgt'); this.rerender(['fin']); break;
      case 'issue': { const v = g.capitalIncrease(); if (v) this.ui.toast(`Kapitalerhöhung: ${fmtDM(v)}`, 'good'); this.rerender(['fin']); break; }
      case 'ipo': { const v = g.ipoNet(); if (v) this.ui.toast(`Börsengang KB-Net: ${fmtDM(v)}`, 'good'); this.rerender(['fin', 'netz']); break; }
      case 'buy-st': { const v = g.buyStartup(arg); if (v) this.ui.toast(`Beteiligung gekauft: ${fmtDM(v)}`, 'good'); this.rerender(['fin']); break; }
      case 'sell-st': { const v = g.sellStartup(arg); if (v) this.ui.toast(`Beteiligung verkauft: ${fmtDM(v)}`); this.rerender(['fin']); break; }
      case 'net-mk': g.setNetMarketing(Number(arg)); this.rerender(['netz']); break;
      case 'prod-start': if (g.startProduct()) this.ui.toast('Entwicklung des HC-1 gestartet', 'good'); this.rerender(['prod', 'proj']); break;
      case 'price-sel': this.priceSel = Number(arg); this.rerender(['prod']); break;
      case 'launch': if (g.launchProduct(this.priceSel || g.s.product.price)) this.ui.toast('Der HC-1 ist im Handel', 'good'); this.priceSel = null; this.rerender(['prod', 'karr']); break;
      case 'price-set': g.setPrice(Number(arg)); this.priceSel = null; this.ui.toast(`Neuer Preis: ${fmtDM(Number(arg))}`); this.rerender(['prod']); break;
      case 'buy': {
        const n = g.buyShares(arg === 'max' ? 'max' : Number(arg));
        if (n) this.ui.toast(`${n} KB-Aktie${n > 1 ? 'n' : ''} gekauft`, 'good');
        this.rerender(['depot', 'karr']); break;
      }
      case 'sell': {
        const n = g.sellShares(Number(arg));
        if (n) this.ui.toast(`${n} KB-Aktie${n > 1 ? 'n' : ''} verkauft`);
        this.rerender(['depot', 'karr']); break;
      }
      case 'upgrade':
        if (g.buyUpgrade(arg)) {
          const u = UPGRADES.find((x) => x.id === arg);
          this.ui.toast(`${u.name} steht jetzt am Platz`, 'good');
          if (arg === 'monitor2') { this.panes[1] = 'post'; this.build(); this.ui.refocusPC(); } else this.rerender(['shop', 'karr']);
        }
        break;
      case 'save': g.save(); this.rerender(['sys']); this.sysMsg('Gespeichert.'); break;
      case 'export': this.exportText = g.exportCode(); this.rerender(['sys']); this.sysMsg('Code erzeugt.'); break;
      case 'copy': {
        const ta = this.root.querySelector('#export-out');
        navigator.clipboard?.writeText(this.exportText).then(
          () => this.sysMsg('Code in die Zwischenablage kopiert.'),
          () => { ta.select(); this.sysMsg('Kopieren nicht erlaubt. Der Code ist markiert, kopiere ihn mit Strg+C.', false); },
        ) ?? (ta.select(), this.sysMsg('Der Code ist markiert, kopiere ihn mit Strg+C.', false));
        break;
      }
      case 'download': {
        const blob = new Blob([JSON.stringify(g.s, null, 1)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `konzern-${g.s.player.name.replace(/\W+/g, '_')}-${g.s.time.year}.json`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        this.sysMsg('Download gestartet. Falls nichts passiert, nutze den Code-Export.');
        break;
      }
      case 'import': this.doImport(this.root.querySelector('#import-in').value); break;
      case 'new': this.confirmNew = true; this.rerender(['sys']); break;
      case 'new-no': this.confirmNew = false; this.rerender(['sys']); break;
      case 'new-yes': this.confirmNew = false; this.ui.toTitle(true); break;
      default: break;
    }
  }
}
