// Der Firmen-PC: grüner Textmodus-Desktop mit Programmen.
// Mit dem Upgrade „Zweites Terminal-Display“ laufen zwei Programme nebeneinander.

import {
  UPGRADES, STAGES, MONTH_NAMES, MONTH_SHORT, DIFFICULTIES, SHARES_OUTSTANDING, SHARE_DISCOUNT,
  DIVIDEND_PER_SHARE, PROJECT_SHARES, TEAM_MAX, TRAITS, PRODUCT_SPEC, PRODUCT_PRICES, ORION_HOME,
  fmtDM, fmtNum, fmtInt, fmtPct,
} from './data.js';
import { MISSIONS, missionsDone } from './story.js';
import { Game } from './game.js';

const APPS = [
  { id: 'post', label: 'POST', title: 'Postfach' },
  { id: 'aufg', label: 'AUFG', title: 'Aufträge' },
  { id: 'proj', label: 'PROJ', title: 'Projekte', minStage: 1 },
  { id: 'pers', label: 'PERS', title: 'Personal', minStage: 2 },
  { id: 'prod', label: 'PROD', title: 'Produkt', minStage: 2 },
  { id: 'lohn', label: 'LOHN', title: 'Entgeltabrechnungen' },
  { id: 'depot', label: 'DEPOT', title: 'Konto und Depot' },
  { id: 'shop', label: 'BEDARF', title: 'Bürobedarf' },
  { id: 'karr', label: 'KARR', title: 'Karriere' },
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
    this.screens.innerHTML = this.panes.slice(0, n).map((_, i) => `
      <section class="crt" data-pane="${i}">
        <div class="crt-glass">
          <header class="crt-top">
            <span>KB-TERMINAL 3270 · ${i === 0 ? 'DISPLAY 1' : 'DISPLAY 2'}</span>
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
      rate: `${fmtNum(g.passiveRate())} Pkt/s`,
      taskValue: `${g.taskValue()} Pkt`,
      streak: p.streak ? `Serie ×${p.streak} (+${fmtPct(g.streakBonus())})` : 'keine Serie',
      cash: fmtDM(p.cash),
      price: fmtNum(s.shares.price) + ' DM',
      eprice: fmtNum(g.employeePrice()) + ' DM',
      depotValue: fmtDM(s.shares.owned * s.shares.price),
      owned: fmtInt(s.shares.owned),
      vote: fmtPct(s.shares.owned / SHARES_OUTSTANDING, 4),
      days: `${MONTH_NAMES[s.time.month]}: Tag ${g.day()}`,
      teamRate: `${fmtNum(g.teamRate())} Pkt/s (${s.team.members.length} Leute)`,
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
    set('[data-bar="month"] > span', s.time.monthProgress / 60);
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
    const perMonth = g.passiveRate() * 60 * pr.share * (1 + (act.boost || 0));
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
          <span>GEHALT</span><span>${fmtDM(m.salary)} · LEISTUNG ${fmtNum(g.memberRate(m))} PKT/S</span>
          <span>MORAL</span><span class="mrow">${bar(m.morale / 100, m.morale < 35 ? 'low' : '')} ${fmtInt(m.morale)} %</span>
        </div>
        <div class="row">
          <button type="button" class="tbtn small" data-act="praise" data-arg="${m.id}" ${m.praised === now ? 'disabled' : ''}>${m.praised === now ? 'GELOBT' : 'LOBEN'}</button>
          <button type="button" class="tbtn small" data-act="raise" data-arg="${m.id}">+10 % GEHALT (+${fmtNum(Math.round(m.salary * 0.1 / 10) * 10)} DM)</button>
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
        <div class="r"><button type="button" class="tbtn" data-act="hire" data-arg="${c.id}" ${tm.members.length >= TEAM_MAX ? 'disabled' : ''}>EINSTELLEN</button></div>
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
      <h3>TEAM ${tm.members.length}/${TEAM_MAX}</h3>
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

  app_lohn() {
    const slips = this.game.s.payslips;
    if (!slips.length) return `<h2>ENTGELTABRECHNUNGEN</h2><p class="dim">Die erste Abrechnung kommt zum Monatsende.</p>`;
    const rows = slips.slice().reverse().map((sl, ri) => {
      const idx = slips.length - 1 - ri;
      return `<tr><td>${MONTH_SHORT[sl.month]} ${sl.year}</td><td class="c g-${sl.grade}">${sl.grade}</td><td class="r">${fmtNum(sl.brutto)}</td><td class="r">${fmtNum(sl.netto)}</td>
        <td><button type="button" class="tbtn small" data-act="slip" data-arg="${idx}">ANSEHEN</button></td></tr>`;
    }).join('');
    const p = this.game.s.player;
    return `
      <h2>ENTGELTABRECHNUNGEN <span class="dim">PERS.-NR. ${esc(p.pnr)}</span></h2>
      <p class="dim">Netto seit Eintritt: ${fmtDM(p.totalNet)}</p>
      <table class="ttable"><thead><tr><th>MONAT</th><th class="c">NOTE</th><th class="r">BRUTTO DM</th><th class="r">NETTO DM</th><th></th></tr></thead>
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
    c.fillStyle = 'rgba(77,255,124,0.10)';
    for (let y = 0; y < H; y += 18) c.fillRect(0, y, W, 1);
    const X = (k) => (k / (h.length - 1)) * (W - 4) + 2;
    const Y = (v) => H - 4 - ((v - lo) / (hi - lo)) * (H - 8);
    c.fillStyle = 'rgba(77,255,124,0.16)';
    c.beginPath(); c.moveTo(X(0), H);
    h.forEach((v, k) => c.lineTo(X(k), Y(v)));
    c.lineTo(X(h.length - 1), H); c.fill();
    c.strokeStyle = '#4dff7c'; c.lineWidth = 2;
    c.beginPath(); h.forEach((v, k) => (k ? c.lineTo(X(k), Y(v)) : c.moveTo(X(k), Y(v)))); c.stroke();
    c.fillStyle = '#c9ffd6'; c.fillRect(X(h.length - 1) - 3, Y(h.at(-1)) - 3, 6, 6);
  }

  app_shop() {
    const g = this.game;
    // kaufbare zuerst, dann gesperrte, gekaufte zuletzt
    const order = (u) => (g.owned(u.id) ? 2 : (u.minStage || 0) > g.s.player.stage ? 1 : 0);
    const rows = UPGRADES.filter((u) => u.shop !== false).sort((a, b) => order(a) - order(b) || a.price - b.price).map((u) => {
      const own = g.owned(u.id);
      const locked = (u.minStage || 0) > g.s.player.stage;
      return `<div class="shop-row ${own ? 'owned' : ''} ${locked ? 'locked' : ''}">
        <div><b>${esc(u.name)}</b> <span class="dim">[${u.kind.toUpperCase()}]</span><br><span class="dim">${esc(u.desc)}</span></div>
        <div class="r">${own ? '<span class="ok">AM PLATZ</span>' : locked ? `<span class="dim">AB ${esc(STAGES[u.minStage].title.toUpperCase())}</span>`
          : `<button type="button" class="tbtn" data-act="upgrade" data-arg="${u.id}" data-need="${u.price}">${fmtNum(u.price)} DM</button>`}</div>
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
      ${missionsDone(g) ? '<p class="ok">Alle Ziele erreicht. Herr Hoff möchte mit dir sprechen.</p>' : ''}
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
      </div>
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
    if (e.target.classList?.contains('task-input') && e.key === 'Enter') {
      e.preventDefault();
      const val = e.target.value;
      if (!val.trim()) return;
      const r = this.game.submitTask(val);
      this.lastResult = r;
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
