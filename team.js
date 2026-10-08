/* Team timesheet for admins and owners — the web portal's timesheet, restructured for a phone.
   Same content as the portal: a payroll-period range, Job and User filters, search by name,
   email or job, export (CSV / PDF / Excel), the summary metrics (Employees, Man-days, Worked
   hours, Total cost, Total cost inc OH), records grouped by day with a Weekend flag, the
   Corrected / Added / Removed badges, overtime split by multiplier, and direct editing.
   Different layout: cards and bottom sheets instead of a wide table and a filter bar.
   Cost figures are shown to the owner only, as the portal hides them without that permission. */

/* ---------- date helpers ---------- */
const pad2 = n => String(n).padStart(2, '0');
const DT = iso => new Date(iso + 'T12:00:00');
const ISO = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const addDays = (iso, n) => { const d = DT(iso); d.setDate(d.getDate() + n); return ISO(d); };
const dayDiff = (a, b) => Math.round((DT(b) - DT(a)) / 864e5);
const isWeekend = iso => [0, 6].includes(DT(iso).getDay());
const dShort = iso => DT(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
const AUD = n => n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
const HRS = m => (m / 60).toFixed(1);
const OH = 1.22; // company overhead multiplier behind "Cost inc OH"

/* ---------- sample data: 5 people, 14 Sep – 8 Oct ---------- */
const PEOPLE = [
  { id: 1, name: 'Alex Morgan', avatar: 'img/avatar-alex.jpg', email: 'alex.morgan@siteos.co', rate: 38, job: 'Riverside Footbridge' },
  { id: 2, name: 'Jordan Davis', avatar: 'img/avatar-jordan.jpg', email: 'jordan.davis@siteos.co', rate: 42, job: 'Riverside Footbridge' },
  { id: 3, name: 'Chris Taylor', avatar: 'img/avatar-chris.jpg', email: 'chris.taylor@siteos.co', rate: 55, job: 'Westgate Depot' },
  { id: 4, name: 'Sam Lee', avatar: '', email: 'sam.lee@siteos.co', rate: 36, job: 'Northline Station' },
  { id: 5, name: 'Dana Wells', avatar: '', email: 'dana.wells@siteos.co', rate: 48, job: 'Westgate Depot' },
];
const person = id => PEOPLE.find(p => p.id === id);
const TSD = [];
(function seed() {
  let id = 1000;
  for (let i = 0, iso = '2026-09-14'; iso <= TODAY_ISO; i++, iso = addDays(iso, 1)) {
    PEOPLE.forEach(p => {
      const h = (p.id * 37 + i * 53 + p.id * i * 7) % 97;
      if (isWeekend(iso)) { if (iso === '2026-10-03' && (p.id === 3 || p.id === 5)) TSD.push({ id: id++, uid: p.id, iso, job: p.job, inM: 420 + p.id, outM: 720 + p.id * 3 }); return; }
      if (h % 11 === 0 && iso !== TODAY_ISO) return; // a day off
      const today = iso === TODAY_ISO;
      TSD.push({ id: id++, uid: p.id, iso, job: h % 9 === 0 ? 'Westgate Depot' : p.job, inM: 408 + h % 25, outM: today ? (p.id === 4 ? 555 : null) : h % 13 === 0 ? 1075 + h % 20 : 898 + h % 55 });
    });
  }
  const mark = (uid, iso, patch) => Object.assign(TSD.find(e => e.uid === uid && e.iso === iso), patch);
  mark(1, '2026-10-05', { inM: 418, adj: 'correction', hist: [['Clock in', '7:15 am', '6:58 am', 'Chris Taylor', 'Mon 5 Oct']] });
  mark(4, '2026-10-06', { adj: 'add_shift', hist: [['Shift added', '—', '7:00 am – 3:30 pm', 'Dana Wells', 'Tue 6 Oct']], inM: 420, outM: 930 });
  TSD.push({ id: id++, uid: 3, iso: '2026-10-02', job: 'Westgate Depot', inM: 300, outM: 305, adj: 'remove_shift', hist: [['Shift removed', '5:00 am – 5:05 am', '—', 'Dana Wells', 'Fri 2 Oct']] });
})();

/* ---------- pay maths (regular up to 8h, x1.5 for the next 2h, x2 after; weekends all x1.5) ---------- */
function calc(e) {
  const gross = span(e.inM, e.outM), brk = gross >= 300 ? 30 : 0, mins = e.adj === 'remove_shift' ? 0 : Math.max(0, gross - brk), we = isWeekend(e.iso);
  const reg = we ? 0 : Math.min(mins, 480), ot15 = we ? mins : Math.min(Math.max(mins - 480, 0), 120), ot2 = we ? 0 : Math.max(mins - 600, 0);
  const cost = (reg + ot15 * 1.5 + ot2 * 2) / 60 * person(e.uid).rate;
  return { mins, brk, reg, ot15, ot2, ot: ot15 + ot2, cost, costOH: cost * OH };
}
const sumOf = list => list.reduce((t, e) => { const c = calc(e); ['mins', 'reg', 'ot15', 'ot2', 'cost', 'costOH'].forEach(k => { t[k] += c[k]; }); return t; }, { mins: 0, reg: 0, ot15: 0, ot2: 0, cost: 0, costOH: 0 });
const money = () => S.role === 'owner';

/* ---------- period + filters ---------- */
const MON = iso => addDays(iso, -((DT(iso).getDay() + 6) % 7));
const PRESETS = {
  today: ['Today', () => [TODAY_ISO, TODAY_ISO]],
  yesterday: ['Yesterday', () => [addDays(TODAY_ISO, -1), addDays(TODAY_ISO, -1)]],
  week: ['This week', () => [MON(TODAY_ISO), addDays(MON(TODAY_ISO), 6)]],
  lastWeek: ['Last week', () => [addDays(MON(TODAY_ISO), -7), addDays(MON(TODAY_ISO), -1)]],
  pay: ['This pay period', () => [addDays(MON(TODAY_ISO), -7), addDays(MON(TODAY_ISO), 6)]],
  lastPay: ['Last pay period', () => [addDays(MON(TODAY_ISO), -21), addDays(MON(TODAY_ISO), -8)]],
};
const tr = () => S.tr || (S.tr = { preset: 'week', from: PRESETS.week[1]()[0], to: PRESETS.week[1]()[1], job: '', uid: 0, q: '', group: 'day', openEmp: 0, mine: false });
const periodName = () => { const t = tr(), hit = Object.keys(PRESETS).find(k => { const r = PRESETS[k][1](); return r[0] === t.from && r[1] === t.to; }); return hit ? PRESETS[hit][0] : `${dayDiff(t.from, t.to) + 1} days`; };
function teamRows() {
  const t = tr(), q = t.q.trim().toLowerCase();
  return TSD.filter(e => e.iso >= t.from && e.iso <= t.to && (!t.job || e.job === t.job) && (!t.uid || e.uid === t.uid)
    && (!q || (person(e.uid).name + ' ' + person(e.uid).email + ' ' + e.job).toLowerCase().includes(q)));
}

/* ---------- pieces ---------- */
function tsBadge(e) {
  if (e.adj === 'remove_shift') return pill('bad', 'Removed');
  if (e.adj === 'add_shift') return pill('ok', 'Added');
  if (e.adj === 'correction') return pill('info', 'Corrected');
  if (e.outM == null) return pill('info', 'In progress');
  return '';
}
const otChip = c => c.ot ? `<span class="otc">+${DUR(c.ot)} OT</span>` : '';
const tsRow = (e, lead, line) => { const c = calc(e), live = e.outM == null; return `<button class="trow ${e.adj === 'remove_shift' ? 'gone' : ''}" data-act="tsOpen" data-v="${e.id}">${lead}
<span class="grow"><span class="row between gap8"><b class="t-body trunc">${line}</b><b class="t-body num">${live ? '—' : DUR(c.mins)}</b></span>
<span class="row between gap8 mt4"><span class="t-sub trunc">${T(e.inM)} – ${live ? 'now' : T(e.outM)}${line === e.job ? '' : ' · ' + e.job}</span><span class="row gap6">${otChip(c)}${tsBadge(e)}</span></span></span></button>`; };

function teamSummary(rows) {
  const s = sumOf(rows), people = new Set(rows.map(e => e.uid)).size, manDays = new Set(rows.filter(e => e.adj !== 'remove_shift').map(e => e.uid + e.iso)).size, w = k => (s.mins ? s[k] / s.mins * 100 : 0);
  const stat = (v, l) => `<div><b>${v}</b><small>${l}</small></div>`;
  return `<div class="card p">
<div class="row between" style="align-items:flex-end"><div><span class="t-sub">Worked hours</span><div class="t-num mt4">${HRS(s.mins)}<small>hrs</small></div></div><span class="t-sub" style="text-align:right">Regular ${HRS(s.reg)}<br>Overtime ${HRS(s.ot15 + s.ot2)}</span></div>
<div class="bar mt12"><i style="width:${w('reg')}%"></i><i style="width:${w('ot15')}%;background:var(--warn-solid)"></i><i style="width:${w('ot2')}%;background:var(--bad-solid)"></i></div>
<div class="meta mt8"><span><i class="ldot" style="background:var(--primary)"></i>Regular</span><span><i class="ldot" style="background:var(--warn-solid)"></i>OT ×1.5 <b>${HRS(s.ot15)}</b></span><span><i class="ldot" style="background:var(--bad-solid)"></i>OT ×2 <b>${HRS(s.ot2)}</b></span></div>
<div class="stats ${money() ? 'four' : ''} mt12">${stat(people, 'Employees')}${stat(manDays, 'Man-days')}${money() ? stat(AUD(s.cost), 'Total cost') + stat(AUD(s.costOH), 'Cost inc OH') : ''}</div></div>`;
}

function teamTimesheet() {
  const t = tr(), rows = teamRows(), nf = (t.job ? 1 : 0) + (t.uid ? 1 : 0);
  const chips = [t.job && ['job', t.job], t.uid && ['uid', person(t.uid).name], t.q && ['q', `“${t.q}”`]].filter(Boolean);
  let list;
  if (!rows.length) list = `<div class="state" style="padding:40px 20px"><span class="chip blue">${ic('clock', 30)}</span><h2 class="t-h2">No timesheet records found</h2><p class="t-sub">Adjust the date range or filters to see more results.</p>${chips.length ? '<button class="btn soft sm" data-act="tsClear">Clear filters</button>' : ''}</div>`;
  else if (t.group === 'day') {
    const days = [...new Set(rows.map(e => e.iso))].sort().reverse();
    list = days.map(iso => { const day = rows.filter(e => e.iso === iso).sort((a, b) => person(a.uid).name.localeCompare(person(b.uid).name)), n = new Set(day.map(e => e.uid)).size;
      return `<div class="grp"><div class="grp-h"><span class="row gap8"><b>${fmtDate(iso)}</b>${iso === TODAY_ISO ? pill('info', 'Today') : ''}${isWeekend(iso) ? pill('bad', 'Weekend') : ''}</span><span>${n} employee${n > 1 ? 's' : ''} · ${DUR(sumOf(day).mins)}</span></div>
<div class="card clip">${day.map(e => tsRow(e, av(person(e.uid).avatar, person(e.uid).name), person(e.uid).name)).join('')}</div></div>`; }).join('');
  } else {
    list = PEOPLE.filter(p => rows.some(e => e.uid === p.id)).map(p => { const mine = rows.filter(e => e.uid === p.id).sort((a, b) => b.iso.localeCompare(a.iso)), s = sumOf(mine), open = t.openEmp === p.id, days = new Set(mine.filter(e => e.adj !== 'remove_shift').map(e => e.iso)).size;
      return `<div class="card clip ${open ? 'rc open' : ''}"><button class="trow" data-act="tsEmp" data-v="${p.id}">${av(p.avatar, p.name)}<span class="grow"><span class="row between gap8"><b class="t-body trunc">${p.name}</b><b class="t-body num">${DUR(s.mins)}</b></span>
<span class="row between gap8 mt4"><span class="t-sub">${days} day${days > 1 ? 's' : ''}${s.ot15 + s.ot2 ? ' · ' + DUR(s.ot15 + s.ot2) + ' OT' : ''}</span><span class="t-sub">${money() ? AUD(s.cost) : ''}</span></span></span><span class="c-3">${ic(open ? 'chevU' : 'chevD', 18, 2.2)}</span></button>
${open ? mine.map(e => tsRow(e, `<span class="dcol"><b>${DT(e.iso).toLocaleDateString('en-AU', { weekday: 'short' })}</b><small>${dShort(e.iso)}</small></span>`, e.job)).join('') : ''}</div>`; }).join('');
  }
  return `${hdrMain()}${tsSeg('timesheet')}
<div class="pad row between" style="margin-top:12px"><div class="row gap8"><h1 class="t-title" style="font-size:24px">Timesheet</h1><span class="pill neutral">${rows.length} record${rows.length === 1 ? '' : 's'}</span></div>
<div class="seg" style="width:124px;height:32px">${[['Team', false], ['Mine', true]].map(m => `<button style="line-height:26px;font-size:13px" class="${t.mine === m[1] ? 'on' : ''}" data-act="tsMine" data-v="${m[1] ? 1 : ''}">${m[0]}</button>`).join('')}</div></div>
<div class="pad mt12"><div class="period"><button class="icon-btn sq" data-act="tsShift" data-v="-1" aria-label="Previous period">${ic('chevL', 22)}</button>
<button class="grow" data-act="tsPeriod"><b>${dShort(t.from)}${t.from === t.to ? '' : ' – ' + dShort(t.to)}</b><small>${ic('calendar', 13, 2.2)}${periodName()}${ic('chevD', 13, 2.6)}</small></button>
<button class="icon-btn sq" data-act="tsShift" data-v="1" aria-label="Next period" ${t.from > TODAY_ISO ? 'disabled' : ''}>${ic('chevR', 22)}</button></div></div>
<div class="pad mt12"><div class="search"><label>${ic('search', 20, 1.9)}<input id="tq" placeholder="Name, email, or job" value="${t.q}"></label>
<button class="icon-btn box ${nf ? 'has' : ''}" data-act="tsFilter" aria-label="Filters">${ic('sliders', 22, 1.9)}${nf ? `<em class="count">${nf}</em>` : ''}</button>
<button class="icon-btn box" data-act="tsExport" aria-label="Export view" ${rows.length ? '' : 'disabled'}>${ic('download', 22, 1.9)}</button></div>
${chips.length ? `<div class="fchips mt8">${chips.map(c => `<button class="act" data-act="tsDrop" data-v="${c[0]}">${c[1]}${ic('x', 14, 2.6)}</button>`).join('')}<button class="act clr" data-act="tsClear">Clear</button></div>` : ''}</div>
${guard({ error: "Couldn't load timesheets — tap to retry", icon: 'doc', empty: 'No timesheet records found', emptySub: 'Adjust the date range or filters to see more results.', tall: 120 }, () => `<div class="stack">
${rows.length ? teamSummary(rows) : ''}
${rows.length ? `<div class="row between"><div class="seg" style="width:210px;height:34px">${[['day', 'By day'], ['emp', 'By employee']].map(g => `<button style="line-height:28px;font-size:13px" class="${t.group === g[0] ? 'on' : ''}" data-act="tsGroup" data-v="${g[0]}">${g[1]}</button>`).join('')}</div><button class="link row gap6" style="margin:0" data-act="tsAdd">${ic('plus', 16, 2.6)}Add shift</button></div>` : ''}
<div id="tlist">${list}</div></div>`)}`;
}
// Admins and owners get the team timesheet; "Mine" switches them to their own, as a worker sees it.
const workerTimesheet = V.timesheet;
V.timesheet = () => reviewer() && !tr().mine ? teamTimesheet() : reviewer() ? workerTimesheet().replace('<div class="stack">', `<div class="pad row between" style="margin-top:12px"><h1 class="t-title" style="font-size:24px">Timesheet</h1><div class="seg" style="width:124px;height:32px"><button style="line-height:26px;font-size:13px" data-act="tsMine" data-v="">Team</button><button style="line-height:26px;font-size:13px" class="on">Mine</button></div></div><div class="stack">`) : workerTimesheet();

/* ---------- sheets ---------- */
const periodSheet = () => { const t = tr(); return `<div class="sheet-head"><b>Payroll period</b><button data-act="closeSheet">Close</button></div>
${Object.keys(PRESETS).map(k => { const r = PRESETS[k][1](), on = r[0] === t.from && r[1] === t.to; return `<button class="lrow" style="min-height:52px" data-act="tsPreset" data-v="${k}"><span class="grow"><b class="t-body ${on ? 'c-pri' : ''}">${PRESETS[k][0]}</b></span><span class="t-sub">${dShort(r[0])}${r[0] === r[1] ? '' : ' – ' + dShort(r[1])}</span>${on ? `<span class="c-pri">${ic('check', 20, 2.6)}</span>` : ''}</button>`; }).join('')}
<div style="padding:14px 18px 0;border-top:1px solid var(--divider)"><b class="t-body">Custom range</b>
<div class="two mt8"><label class="field"><span>From</span><div class="in"><input type="date" id="pfrom" max="${TODAY_ISO}" value="${t.from}"></div></label><label class="field"><span>To</span><div class="in"><input type="date" id="pto" value="${t.to}"></div></label></div>
<p class="t-sub" id="perr" style="display:none;color:var(--bad);margin-top:6px">"To" must be on or after "From"</p>
<button class="btn" style="margin-top:14px" data-act="tsCustom">Apply range</button></div>`; };
const filterSheet = () => { const t = tr(); return `<div class="sheet-head"><b>Filters</b><button data-act="tsClearF">Clear</button></div><div style="padding:0 18px">
<div class="field"><span>Job</span><div class="opts" id="fjob"><button class="${t.job ? '' : 'on'}" data-act="opt" data-k="">All jobs</button>${JOBS.map(j => `<button class="${t.job === j.name ? 'on' : ''}" data-act="opt" data-k="${j.name}">${j.name}</button>`).join('')}</div></div>
<div class="field mt16"><span>User</span><div class="opts" id="fuid"><button class="${t.uid ? '' : 'on'}" data-act="opt" data-k="0">Everyone</button>${PEOPLE.map(p => `<button class="${t.uid === p.id ? 'on' : ''}" data-act="opt" data-k="${p.id}">${p.name}</button>`).join('')}</div></div>
<button class="btn" style="margin-top:18px" data-act="tsApplyF">Show records</button></div>`; };
const exportSheet = () => { const t = tr(), n = teamRows().length; return `<div class="sheet-head"><b>Export view</b><button data-act="closeSheet">Close</button></div>
<p class="t-sub" style="padding:0 18px 10px">${dShort(t.from)} – ${dShort(t.to)} · ${n} record${n === 1 ? '' : 's'}, with the current filters applied.</p>
${[['csv', 'CSV', 'Opens in any spreadsheet', 'green'], ['pdf', 'PDF', 'Formatted report to send or print', 'red'], ['excel', 'Excel', 'Workbook with a detail sheet', 'teal']].map(f => `<button class="lrow" data-act="tsDownload" data-v="${f[0]}"><span class="chip ${f[3]}">${ic('doc', 22)}</span><span class="grow"><b class="t-body">${f[1]}</b><span class="t-sub" style="display:block">${f[2]}</span></span><span class="c-3">${ic('download', 20)}</span></button>`).join('')}`; };
// A reviewer edits a shift directly (no request); the breakdown recalculates as the times change.
function shiftBreakdown(e) { const c = calc(e), row = (l, v, on = true) => on ? `<div class="kv">${l}<b>${v}</b></div>` : '';
  return `${row('Worked', e.outM == null ? 'In progress' : DUR(c.mins) + (c.brk ? ` <small class="c-2" style="font-weight:400">· ${c.brk}m break</small>` : ''))}${row('Regular', DUR(c.reg))}${row('Overtime ×1.5', DUR(c.ot15), c.ot15 > 0)}${row('Overtime ×2', DUR(c.ot2), c.ot2 > 0)}${row('Cost', AUD(c.cost), money())}${row('Cost inc OH', AUD(c.costOH), money())}`; }
const shiftSheet = e => { const p = person(e.uid), gone = e.adj === 'remove_shift', live = e.outM == null; return `<div class="sheet-head"><span class="row gap12">${av(p.avatar, p.name)}<span><b style="display:block">${p.name}</b><span class="t-sub">${fmtDate(e.iso)}${isWeekend(e.iso) ? ' · Weekend' : ''}</span></span></span><button data-act="closeSheet">Close</button></div>
<div style="padding:0 18px">${tsBadge(e) ? `<div class="mt4">${tsBadge(e)}</div>` : ''}
${gone ? '' : `<div class="two mt12"><label class="field"><span>Clock in</span><div class="in"><input type="time" id="sin" value="${HM(e.inM)}"></div></label><label class="field"><span>Clock out</span><div class="in"><input type="time" id="sout" value="${HM(e.outM)}" ${live ? 'disabled' : ''}></div></label></div>
<p class="t-sub" id="serr" style="display:none;color:var(--bad);margin-top:6px">Clock out must be after clock in</p>
<div class="field mt12"><span>Job</span><div class="opts" id="sjob">${JOBS.map(j => `<button class="${e.job === j.name ? 'on' : ''}" data-act="opt" data-k="${j.name}">${j.name}</button>`).join('')}</div></div>`}
<div class="card p mt12" id="sbrk" style="padding-top:2px;padding-bottom:2px;margin-top:14px">${shiftBreakdown(e)}</div>
${(e.hist || []).length ? `<div class="mt12" style="margin-top:14px"><small class="t-over">Shift history</small>${e.hist.map(h => `<div class="kv" style="align-items:flex-start"><span>${h[0]}<small class="c-3" style="display:block;font-size:12px">${h[3]} · ${h[4]}</small></span><b><s>${h[1]}</s> → ${h[2]}</b></div>`).join('')}</div>` : ''}
${gone ? '' : `<button class="btn" style="margin-top:16px" data-act="tsSave" data-v="${e.id}">Save changes</button><button class="btn line sm" style="margin-top:10px;color:var(--bad)" data-act="tsRemove" data-v="${e.id}">Remove shift</button>`}</div>`; };
const addShiftSheet = () => `<div class="sheet-head"><b>Add shift</b><button data-act="closeSheet">Close</button></div><div style="padding:0 18px">
<div class="field"><span>User</span><div class="opts" id="auid">${PEOPLE.map((p, i) => `<button class="${i === 0 ? 'on' : ''}" data-act="opt" data-k="${p.id}">${p.name}</button>`).join('')}</div></div>
<label class="field mt12"><span>Date</span><div class="in"><input type="date" id="adate" max="${TODAY_ISO}" value="${TODAY_ISO}"></div></label>
<div class="two mt12"><label class="field"><span>Clock in</span><div class="in"><input type="time" id="ain" value="07:00"></div></label><label class="field"><span>Clock out</span><div class="in"><input type="time" id="aout" value="15:00"></div></label></div>
<div class="field mt12"><span>Job</span><div class="opts" id="ajob">${JOBS.map((j, i) => `<button class="${i === 0 ? 'on' : ''}" data-act="opt" data-k="${j.name}">${j.name}</button>`).join('')}</div></div>
<button class="btn" style="margin-top:16px" data-act="tsAddDo">Add shift</button></div>`;
const picked = id => { const el = document.querySelector(`#${id} .on`); return el ? el.dataset.k : ''; };

/* ---------- export: the CSV is real and matches the rows on screen ---------- */
function teamCsv() {
  const head = ['Date', 'Employee', 'In', 'Out', 'Job', 'Status', 'Worked', 'Regular', 'OT x1.5', 'OT x2'].concat(money() ? ['Cost', 'Cost inc OH'] : []);
  const lines = teamRows().sort((a, b) => a.iso.localeCompare(b.iso)).map(e => { const c = calc(e); return [e.iso, person(e.uid).name, T(e.inM), e.outM == null ? '' : T(e.outM), e.job, { correction: 'Corrected', add_shift: 'Added', remove_shift: 'Removed' }[e.adj] || (e.outM == null ? 'In progress' : ''), HRS(c.mins), HRS(c.reg), HRS(c.ot15), HRS(c.ot2)].concat(money() ? [c.cost.toFixed(2), c.costOH.toFixed(2)] : []); });
  return [head].concat(lines).map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
}

/* ---------- actions ---------- */
const TEAM_ACT = {
  tsMine(v) { tr().mine = !!v; render(); },
  tsShift(v) { const t = tr(), len = dayDiff(t.from, t.to) + 1; t.from = addDays(t.from, len * v); t.to = addDays(t.to, len * v); render(true); },
  tsPeriod() { sheet(periodSheet()); },
  tsPreset(v) { const r = PRESETS[v][1](); Object.assign(tr(), { from: r[0], to: r[1] }); sheet(false); render(); },
  tsCustom() { const a = $('#pfrom').value, b = $('#pto').value; if (!a || !b || b < a) { $('#perr').style.display = ''; return; } Object.assign(tr(), { from: a, to: b }); sheet(false); render(); },
  tsFilter() { sheet(filterSheet()); },
  tsApplyF() { Object.assign(tr(), { job: picked('fjob'), uid: +picked('fuid') }); sheet(false); render(); },
  tsClearF() { Object.assign(tr(), { job: '', uid: 0 }); sheet(false); render(); },
  tsDrop(v) { tr()[v] = v === 'uid' ? 0 : ''; render(true); },
  tsClear() { Object.assign(tr(), { job: '', uid: 0, q: '' }); render(); },
  tsGroup(v) { tr().group = v; render(true); },
  tsEmp(v) { tr().openEmp = tr().openEmp === +v ? 0 : +v; render(true); },
  tsOpen(v) { sheet(shiftSheet(TSD.find(e => e.id === +v))); },
  tsExport() { sheet(exportSheet()); },
  tsDownload(v) {
    sheet(false);
    if (v !== 'csv') { toast(`${v === 'pdf' ? 'PDF' : 'Excel'} export is not built in the prototype`); return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([teamCsv()], { type: 'text/csv' })); a.download = `timesheet_${tr().from}_${tr().to}.csv`; a.click();
    toast('CSV downloaded');
  },
  tsSave(v) {
    const e = TSD.find(x => x.id === +v), i = toM($('#sin').value), o = e.outM == null ? null : toM($('#sout').value), job = picked('sjob');
    if (o != null && o <= i) { $('#serr').style.display = ''; return; }
    const who = ME.first + ' ' + ME.last, h = e.hist || (e.hist = []);
    if (i !== e.inM) h.push(['Clock in', T(e.inM), T(i), who, 'Thu 8 Oct']);
    if (o !== e.outM) h.push(['Clock out', T(e.outM), T(o), who, 'Thu 8 Oct']);
    if (job !== e.job) h.push(['Job', e.job, job, who, 'Thu 8 Oct']);
    const changed = i !== e.inM || o !== e.outM || job !== e.job;
    Object.assign(e, { inM: i, outM: o, job }); if (changed && !e.adj) e.adj = 'correction';
    sheet(false); render(true); toast(changed ? 'Changes saved' : 'No changes');
  },
  tsRemove(v) { const e = TSD.find(x => x.id === +v); (e.hist || (e.hist = [])).push(['Shift removed', `${T(e.inM)} – ${T(e.outM)}`, '—', ME.first + ' ' + ME.last, 'Thu 8 Oct']); e.adj = 'remove_shift'; sheet(false); render(true); toast('Shift removed'); },
  tsAdd() { sheet(addShiftSheet()); },
  tsAddDo() {
    const i = toM($('#ain').value), o = toM($('#aout').value), iso = $('#adate').value;
    if (!iso || o <= i) { toast('Clock out must be after clock in'); return; }
    TSD.push({ id: Date.now(), uid: +picked('auid'), iso, job: picked('ajob'), inM: i, outM: o, adj: 'add_shift', hist: [['Shift added', '—', `${T(i)} – ${T(o)}`, ME.first + ' ' + ME.last, 'Thu 8 Oct']] });
    sheet(false); render(true); toast('Shift added');
  },
};
// Search filters as you type without re-rendering the field (keeps focus and the cursor).
document.addEventListener('input', e => {
  if (e.target.id === 'tq') { tr().q = e.target.value; const pos = e.target.selectionStart; render(true); const el = $('#tq'); el.focus(); el.setSelectionRange(pos, pos); }
  if (e.target.id === 'sin' || e.target.id === 'sout') { const e0 = TSD.find(x => x.id === +$('[data-act="tsSave"]').dataset.v), i = toM($('#sin').value), o = e0.outM == null ? null : toM($('#sout').value); $('#serr').style.display = o != null && o <= i ? '' : 'none'; $('#sbrk').innerHTML = shiftBreakdown(Object.assign({}, e0, { inM: i, outM: o })); }
});
