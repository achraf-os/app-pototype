/* Timesheet change requests — the full flow, following the app's rules:
   - Three request types (API `requestType`): correction (change clock in, clock out or job on a
     recorded shift), add_shift (a shift that was never recorded), remove_shift (delete a shift).
   - A correction sends only the fields that changed; unchanged ones keep the recorded value.
   - Clock out must be after clock in; the reason needs at least 20 characters.
   - One pending request per shift: reopening it edits and resubmits, it never files a duplicate.
   - Workers request; admins and owners review (approve / decline with an optional note).
   - Locked and in-progress shifts cannot be changed.
   - An approved request marks the shift Corrected / Added / Removed and keeps the before -> after. */

/* ---------- time helpers (minutes since midnight) ---------- */
const T = m => m == null ? '—' : `${Math.floor(m / 60) % 12 || 12}:${String(m % 60).padStart(2, '0')} ${m < 720 ? 'am' : 'pm'}`;
const HM = m => m == null ? '' : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const toM = v => v ? +v.split(':')[0] * 60 + +v.split(':')[1] : null;
const DUR = m => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
const DELTA = m => (m > 0 ? '+' : m < 0 ? '−' : '') + (Math.abs(m) >= 60 ? DUR(Math.abs(m)) : Math.abs(m) + 'm');
const span = (a, b) => a != null && b != null && b > a ? b - a : 0;
const fmtDate = iso => new Date(iso + 'T00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '');
const TODAY_ISO = '2026-10-08';

/* ---------- data ---------- */
const DAYS = [['Mon', '5 Oct', '2026-10-05'], ['Tue', '6 Oct', '2026-10-06'], ['Wed', '7 Oct', '2026-10-07'], ['Thu', '8 Oct', '2026-10-08'], ['Fri', '9 Oct', '2026-10-09']];
// The signed-in worker's recorded shifts this week. Tuesday has none — a missing shift.
const ENTRIES = [
  { id: 101, iso: '2026-10-05', job: 'Westgate Depot', inM: 418, outM: 902, adj: 'correction', hist: [['Clock in', '7:15 am', '6:58 am']], by: 'Chris Taylor' },
  { id: 103, iso: '2026-10-07', job: 'Riverside Footbridge', inM: 415, outM: 928 },
  { id: 104, iso: '2026-10-08', job: 'Riverside Footbridge', inM: 418, outM: 690 },
  { id: 105, iso: '2026-10-08', job: 'Riverside Footbridge', inM: 722, outM: null },
  { id: 98, iso: '2026-10-01', job: 'Riverside Footbridge', inM: 420, outM: 905, locked: true },
];
const RATE = { 'Alex Morgan': 38, 'Jordan Davis': 42, 'Sam Lee': 36, 'Chris Taylor': 55 };
// `old` is what is on record, `req` only what the request changes (a correction) or sets (an added shift).
const REQUESTS = [
  { id: 1, mine: true, who: 'Alex Morgan', avatar: 'img/avatar-alex.jpg', type: 'correction', entryId: 103, iso: '2026-10-07', old: { job: 'Riverside Footbridge', inM: 415, outM: 928 }, req: { outM: 900 }, reason: 'Forgot to clock out when I left site — I finished at 3 pm.', sent: 'Wed 7 Oct, 4:10 pm', days: 1, st: 'pending' },
  { id: 2, mine: false, who: 'Jordan Davis', avatar: 'img/avatar-jordan.jpg', type: 'correction', entryId: 201, iso: '2026-10-08', old: { job: 'Riverside Footbridge', inM: 442, outM: 905 }, req: { inM: 410 }, reason: 'No signal at the gate, the app clocked me in half an hour late.', sent: 'Thu 8 Oct, 7:30 am', days: 0, st: 'pending' },
  { id: 3, mine: false, who: 'Sam Lee', avatar: '', type: 'add_shift', entryId: null, iso: '2026-10-06', old: null, req: { job: 'Northline Station', inM: 420, outM: 930 }, reason: 'My phone was in for repair so I could not clock in. Worked the full day at Northline.', sent: 'Tue 6 Oct, 5:02 pm', days: 2, st: 'pending' },
  { id: 4, mine: false, who: 'Chris Taylor', avatar: 'img/avatar-chris.jpg', type: 'remove_shift', entryId: 202, iso: '2026-10-02', old: { job: 'Westgate Depot', inM: 420, outM: 425 }, req: {}, reason: 'Clocked in by mistake on my day off and clocked straight back out.', sent: 'Fri 2 Oct, 7:10 am', days: 6, st: 'pending' },
  { id: 5, mine: true, who: 'Alex Morgan', avatar: 'img/avatar-alex.jpg', type: 'correction', entryId: 101, iso: '2026-10-05', old: { job: 'Westgate Depot', inM: 435, outM: 902 }, req: { inM: 418 }, reason: 'Phone was flat on arrival, I clocked in once it had charged.', sent: 'Mon 5 Oct, 3:20 pm', days: 3, st: 'approved', by: 'Chris Taylor', on: 'Mon 5 Oct', note: 'Confirmed with the site log.' },
  { id: 6, mine: true, who: 'Alex Morgan', avatar: 'img/avatar-alex.jpg', type: 'correction', entryId: 98, iso: '2026-10-01', old: { job: 'Riverside Footbridge', inM: 420, outM: 905 }, req: { job: 'Westgate Depot' }, reason: 'I was moved to Westgate for the day but clocked in on the usual job.', sent: 'Thu 1 Oct, 4:00 pm', days: 7, st: 'declined', by: 'Dana Wells', on: 'Fri 2 Oct', note: 'The roster shows you at Riverside that day.' },
  { id: 7, mine: false, who: 'Jordan Davis', avatar: 'img/avatar-jordan.jpg', type: 'add_shift', entryId: null, iso: '2026-09-30', old: null, req: { job: 'Westgate Depot', inM: 420, outM: 900 }, reason: 'Requested by mistake, the shift was already recorded.', sent: 'Wed 30 Sep, 6:00 pm', days: 8, st: 'withdrawn' },
];
const REQ_ST = { pending: ['warn', 'Pending'], approved: ['ok', 'Approved'], declined: ['bad', 'Declined'], withdrawn: ['neutral', 'Withdrawn'] };
const KIND = {
  correction:   { label: 'Correction', short: 'Correct', icon: 'edit', chip: 'blue', sub: 'Fix the clock in, clock out or job' },
  add_shift:    { label: 'Missing shift', short: 'Missing shift', icon: 'plus', chip: 'green', sub: 'Add a shift that was never recorded' },
  remove_shift: { label: 'Remove shift', short: 'Remove', icon: 'x', chip: 'red', sub: 'Delete a shift recorded by mistake' },
};
const QUICK = ['I forgot to clock out when I left site.', 'There was no signal on site at the time.', 'I selected the wrong job by mistake.', 'My phone was flat when I arrived.'];

/* ---------- derived values ---------- */
const reviewer = () => S.role !== 'worker';
// Workers never see their withdrawn requests (the API leaves them out); reviewers see everything.
const reqList = () => REQUESTS.filter(r => reviewer() ? true : r.mine && r.st !== 'withdrawn');
const reqPending = () => reqList().filter(r => r.st === 'pending');
const reqBadge = () => reqPending().length ? `<em class="count">${reqPending().length}</em>` : '';
const pendingFor = id => REQUESTS.find(r => r.entryId === id && r.st === 'pending' && r.mine);
const after = r => ({ job: r.req.job || (r.old && r.old.job), inM: r.req.inM != null ? r.req.inM : r.old && r.old.inM, outM: r.req.outM != null ? r.req.outM : r.old && r.old.outM });
// [label, recorded, requested] for each field the request touches
function reqChanges(r) {
  if (r.type !== 'correction') return [];
  const c = [];
  if (r.req.job) c.push(['Job', r.old.job, r.req.job]);
  if (r.req.inM != null) c.push(['Clock in', T(r.old.inM), T(r.req.inM)]);
  if (r.req.outM != null) c.push(['Clock out', T(r.old.outM), T(r.req.outM)]);
  return c;
}
function reqDelta(r) {
  const a = after(r), now = r.old ? span(r.old.inM, r.old.outM) : 0;
  return r.type === 'add_shift' ? span(a.inM, a.outM) : r.type === 'remove_shift' ? -now : span(a.inM, a.outM) - now;
}
const deltaChip = m => m === 0 ? '' : `<span class="delta ${m > 0 ? 'up' : 'down'}">${DELTA(m)}</span>`;
function reqLine(r) {
  const a = after(r), c = reqChanges(r);
  if (r.type === 'add_shift') return `Add ${T(a.inM)} – ${T(a.outM)}`;
  if (r.type === 'remove_shift') return `Remove ${T(r.old.inM)} – ${T(r.old.outM)}`;
  return `${c[0][0]} ${c[0][1]} → ${c[0][2]}${c.length > 1 ? ` · +${c.length - 1} more` : ''}`;
}

/* ---------- timesheet + timeclock rows (one row per recorded shift) ---------- */
function entryPill(e) {
  if (e.outM == null) return pill('info', 'In progress');
  if (pendingFor(e.id)) return pill('warn', 'Pending');
  if (e.adj) return pill(e.adj === 'add_shift' ? 'ok' : 'info', e.adj === 'add_shift' ? 'Added' : 'Corrected');
  if (e.locked) return pill('neutral', 'Locked');
  return pill('ok', 'Approved');
}
const entryRow = (e, left) => `<button class="day" data-act="entry" data-v="${e.id}">${left}<div class="grow"><b>${T(e.inM)} – ${e.outM == null ? 'now' : T(e.outM)}</b><small>${e.job}${e.outM == null ? '' : ' · ' + DUR(span(e.inM, e.outM))}</small></div>${entryPill(e)}</button>`;
function tsRows() {
  return DAYS.filter(d => S.tsMode === 'Week' || d[2] === TODAY_ISO).map(d => {
    const list = ENTRIES.filter(e => e.iso === d[2] && !e.removed), left = `<div class="d"><b>${d[0]}</b><small>${d[1]}</small></div><i></i>`;
    if (list.length) return list.map(e => entryRow(e, left)).join('');
    if (d[2] > TODAY_ISO) return `<div class="day">${left}<div class="grow"><b>– hrs</b><small>Upcoming shift</small></div>${pill('neutral', 'Upcoming')}</div>`;
    const asked = REQUESTS.find(r => r.mine && r.type === 'add_shift' && r.iso === d[2] && r.st === 'pending');
    return asked ? `<button class="day" data-go="requests">${left}<div class="grow"><b>${T(asked.req.inM)} – ${T(asked.req.outM)}</b><small>Missing shift requested</small></div>${pill('warn', 'Pending')}</button>`
      : `<button class="day miss" data-act="change" data-v="add_shift::${d[2]}">${left}<div class="grow"><b>No time recorded</b><small>Tap if you worked this day</small></div>${cv()}</button>`;
  }).join('');
}
// Header action on the Timesheet tab: a worker reports a missing shift; a reviewer switches Team / Mine.
const tsHead = () => `<div class="pad row between" style="margin-top:12px"><h1 class="t-title" style="font-size:24px">Timesheet</h1>${reviewer()
  ? `<div class="seg" style="width:124px;height:32px"><button style="line-height:26px;font-size:13px" data-act="tsMine" data-v="">Team</button><button style="line-height:26px;font-size:13px" class="on">Mine</button></div>`
  : `<button class="btn soft sm" style="width:auto;height:36px;padding:0 14px;font-size:13px" data-act="change" data-v="add_shift::${TODAY_ISO}">${ic('plus', 16, 2.6)}Missing shift</button>`}</div>`;
const todayRows = () => ENTRIES.filter(e => e.iso === TODAY_ISO && !e.removed).map(e => entryRow(e, '')).join('');

/* ---------- the shift page: one tap from the timesheet, and the correction happens right here ----------
   The recorded shift is shown as tiles. Clock in, clock out and job are editable in place; the
   moment one differs from the record, the "what changes" summary, the reason and the submit bar
   appear. Nothing to open first, no second screen. Removal is a quiet link at the bottom. */
const chDirty = () => { const c = S.ch, o = chOld(); return !!o && c.type === 'correction' && (c.job !== o.job || toM(c.in) !== o.inM || toM(c.out) !== o.outM); };
const canFix = e => !reviewer() && !e.locked && e.outM != null;
function entryInit(e) {
  const p = pendingFor(e.id);
  if (p) { const a = after(p); S.ch = { type: p.type, entryId: e.id, reqId: p.id, old: null, lock: true, iso: e.iso, job: a.job, in: HM(a.inM), out: HM(a.outM), reason: p.reason }; }
  else chNew('correction', e.id);
}
V.entry = () => {
  const e = ENTRIES.find(x => x.id === S.entry), live = e.outM == null, edit = canFix(e);
  if (!S.ch || S.ch.entryId !== e.id) entryInit(e);
  const c = S.ch, rm = edit && c.type === 'remove_shift', open = edit && (rm || chDirty() || c.reqId);
  const inM = edit && !rm ? toM(c.in) : e.inM, outM = edit && !rm ? toM(c.out) : e.outM, mins = span(inM, outM), ot = Math.max(0, mins - 480);
  const head = (icon, color, label) => '<small><span style="color:' + color + '">' + ic(icon, 14, 2.4) + '</span>' + label + (edit && !rm ? '<span class="pen">' + ic('edit', 13, 2.2) + '</span>' : '') + '</small>';
  const was = (key, text) => '<em class="wasl">Was ' + text + ' · <button data-act="chReset" data-v="' + key + '">Reset</button></em>';
  const timeTile = (key, icon, color, label, rec) => edit && !rm
    ? '<div class="tt ed ' + (toM(c[key]) !== rec ? 'on' : '') + '" id="t-' + key + '">' + head(icon, color, label) + '<input type="time" data-ch="' + key + '" value="' + c[key] + '" aria-label="' + label + '">' + was(key, T(rec)) + '</div>'
    : '<div class="tt">' + head(icon, color, label) + '<b>' + (rec == null ? 'In progress' : T(rec)) + '</b></div>';
  const jobTile = edit && !rm
    ? '<div class="tt ed wide ' + (c.job !== e.job ? 'on' : '') + '" id="t-job" data-act="chJobs" role="button">' + head('pin', 'var(--primary)', 'Job') + '<b class="row between">' + c.job + '<span class="c-3">' + ic('chevD', 18, 2.2) + '</span></b>' + was('job', e.job) + '</div>'
    : '<div class="tt wide">' + head('pin', 'var(--primary)', 'Job') + '<b>' + e.job + '</b></div>';
  const note = reviewer() ? '' : e.locked ? '<div class="note">' + ic('lock', 16) + "This entry is locked and can't be changed.</div>"
    : live ? '<div class="note">' + ic('clock', 16) + "Clock out first — a shift in progress can't be corrected.</div>" : '';
  return hdrBack('Entry detail') + '<div class="stack">' +
'<div class="card p ' + (rm ? 'rm' : '') + '"><div class="row gap12"><span class="chip blue">' + ic('clock', 22) + '</span><div class="grow"><b class="t-card" style="display:block">' + fmtDate(e.iso) + '</b><span class="t-sub">' + (live ? 'Shift in progress' : DUR(span(e.inM, e.outM)) + ' recorded') + '</span></div>' + entryPill(e) + '</div>' +
'<div class="tts mt12">' + timeTile('in', 'logout', 'var(--ok-solid)', 'Clock in', e.inM) + timeTile('out', 'logout', 'var(--bad-solid)', 'Clock out', e.outM) + jobTile +
'<div class="tt">' + head2('clock', 'var(--primary)', 'Regular') + '<b id="v-reg">' + (live ? '—' : DUR(mins - ot)) + '</b></div><div class="tt">' + head2('clock', 'var(--warn-solid)', 'Overtime') + '<b id="v-ot">' + (live ? '—' : DUR(ot)) + '</b></div></div>' +
(reviewer() && !live ? '<div class="kv mt8" style="border-top:1px solid var(--divider)">Labor cost<b>$' + (mins / 60 * RATE['Alex Morgan']).toFixed(2) + '</b></div>' : '') + '</div>' +
(edit ? '<p class="t-sub row gap6" id="hint" style="justify-content:center;' + (open ? 'display:none' : '') + '">' + ic('edit', 14, 2.2) + 'Something wrong? Tap a time or the job to correct it.</p>' : note) +
(edit ? '<div id="fix" class="fix" style="' + (open ? '' : 'display:none') + '">' +
  (c.reqId ? '<div class="note warn">' + ic('clock', 16) + '<span>Waiting for review. You can change it and resubmit, or cancel it.</span></div>' : '') +
  '<div id="chg-summary">' + chSummary() + '</div>' +
  '<div class="field"><span>Reason <em>*</em></span><div class="opts quick">' + QUICK.map(q => '<button data-act="chQuick">' + q + '</button>').join('') + '</div>' +
  '<div class="in area mt8"><textarea data-ch="reason" placeholder="' + (rm ? 'Explain why this shift should be removed' : 'Explain what should be corrected') + '">' + c.reason + '</textarea></div><small id="chg-count">' + c.reason.trim().length + ' / 20 characters minimum</small></div></div>' : '') +
(e.adj ? '<div class="card p"><div class="row between"><b class="t-card">' + (e.adj === 'add_shift' ? 'Added shift' : 'Corrected') + '</b><span class="t-sub">Approved by ' + e.by + '</span></div>' + (e.hist || []).map(h => '<div class="kv">' + h[0] + '<b><s>' + h[1] + '</s> → ' + h[2] + '</b></div>').join('') + '</div>' : '') +
(edit ? '<div class="center">' + (c.reqId ? '<button class="link" style="color:var(--bad)" data-act="cancelReq" data-v="' + c.reqId + '">Cancel request</button>'
  : rm ? '<button class="link" data-act="chKind" data-v="correction">Keep this shift</button>'
  : '<button class="link quiet" data-act="chKind" data-v="remove_shift">This shift shouldn’t be here? Request to remove it</button>') + '</div>' : '') +
'</div>';
};
const head2 = (icon, color, label) => '<small><span style="color:' + color + '">' + ic(icon, 14, 2.4) + '</span>' + label + '</small>';
DOCKS.entry = () => { const e = ENTRIES.find(x => x.id === S.entry), c = S.ch; return e && c && canFix(e) && (c.type === 'remove_shift' || chDirty() || c.reqId) ? DOCKS.change() : ''; };
// Editing a tile never re-renders the page (that would drop focus mid-typing); this refreshes what depends on it.
function entrySync() {
  const c = S.ch, o = chOld(), on = (id, v) => { const el = $('#' + id); if (el) el.classList.toggle('on', v); };
  on('t-in', toM(c.in) !== o.inM); on('t-out', toM(c.out) !== o.outM);
  const mins = span(toM(c.in), toM(c.out)), ot = Math.max(0, mins - 480), open = c.type === 'remove_shift' || chDirty() || !!c.reqId;
  if ($('#v-reg')) { $('#v-reg').textContent = DUR(mins - ot); $('#v-ot').textContent = DUR(ot); }
  $('#fix').style.display = open ? '' : 'none'; $('#hint').style.display = open ? 'none' : '';
  $('#chg-summary').innerHTML = chSummary();
  $('#chg-count').textContent = c.reason.trim().length + ' / 20 characters minimum';
  $('#dock').innerHTML = DOCKS.entry();
}

/* ---------- the request form: one screen for all three types ---------- */
const chEntry = () => ENTRIES.find(e => e.id === S.ch.entryId);
const chOld = () => { const e = chEntry(); return e ? { job: e.job, inM: e.inM, outM: e.outM } : S.ch.old || null; };
function chNew(type, entryId, iso) {
  const e = ENTRIES.find(x => x.id === entryId);
  S.ch = { type, entryId: e ? e.id : null, reqId: null, old: null, lock: !!e || !!iso, iso: e ? e.iso : iso || TODAY_ISO, job: e ? e.job : JOBS[0].name, in: e ? HM(e.inM) : '07:00', out: e ? HM(e.outM) : '15:00', reason: '' };
}
// '' when the request can be sent, otherwise what is still missing (shown above the button)
function chProblem() {
  const c = S.ch, o = chOld(), left = 20 - c.reason.trim().length;
  if (c.type !== 'add_shift' && !o) return 'Choose the shift this is about';
  if (c.type !== 'remove_shift') {
    if (!c.in || !c.out) return 'Enter the clock in and clock out times';
    if (toM(c.out) <= toM(c.in)) return 'Clock out must be after clock in';
    if (c.type === 'add_shift' && c.iso > TODAY_ISO) return 'A missing shift cannot be in the future';
    if (c.type === 'correction' && c.job === o.job && toM(c.in) === o.inM && toM(c.out) === o.outM) return 'Change the job or a time first';
  }
  return left > 0 ? (left === 20 ? 'Add a reason (at least 20 characters)' : `Reason needs ${left} more character${left > 1 ? 's' : ''}`) : '';
}
function chSummary() {
  const c = S.ch, o = chOld(), now = o ? span(o.inM, o.outM) : 0, next = span(toM(c.in), toM(c.out));
  if (c.type === 'remove_shift') return o ? `<div class="sum bad"><b>This shift will be removed</b><p>${fmtDate(c.iso)} · ${T(o.inM)} – ${T(o.outM)} at ${o.job}</p><div class="row between mt8"><span>Hours on your timesheet</span>${deltaChip(-now)}</div></div>` : '';
  if (c.type === 'add_shift') return `<div class="sum ok"><b>A new shift will be added</b><p>${fmtDate(c.iso)} · ${next ? T(toM(c.in)) + ' – ' + T(toM(c.out)) : 'set the times'} at ${c.job}</p><div class="row between mt8"><span>Hours on your timesheet</span>${deltaChip(next)}</div></div>`;
  if (!o) return '';
  const rows = [['Job', o.job, c.job, c.job !== o.job], ['Clock in', T(o.inM), T(toM(c.in)), toM(c.in) !== o.inM], ['Clock out', T(o.outM), T(toM(c.out)), toM(c.out) !== o.outM]].filter(r => r[3]);
  return `<div class="sum"><b>${rows.length ? 'What changes' : 'Nothing changed yet'}</b>${rows.length ? rows.map(r => `<div class="row between mt8"><span>${r[0]}</span><span><s>${r[1]}</s> → <strong>${r[2]}</strong></span></div>`).join('') : '<p>Edit the job or a time below. Fields you leave alone keep their recorded value.</p>'}
${rows.length && next ? `<div class="row between mt8 tot"><span>Hours</span><span>${DUR(now)} → <strong>${DUR(next)}</strong> ${deltaChip(next - now)}</span></div>` : ''}</div>`;
}
V.change = () => {
  const c = S.ch, o = chOld(), e = chEntry(), kinds = c.reqId ? [c.type] : c.entryId && c.lock ? ['correction', 'remove_shift'] : c.type === 'add_shift' && c.lock ? ['add_shift'] : ['correction', 'add_shift', 'remove_shift'];
  const edited = (on, was, key) => on ? `<span class="row between mt4"><small class="was">Recorded: ${was}</small><button class="link" style="margin:0" data-act="chReset" data-v="${key}">Reset</button></span>` : '';
  const lab = (t, on) => `<span>${t} <em>*</em>${on ? pill('info', 'Edited') : ''}</span>`;
  const time = (label, key, was) => { const on = c.type === 'correction' && o && toM(c[key]) !== was; return `<label class="field ${key === 'out' && c.in && c.out && toM(c.out) <= toM(c.in) ? 'err' : ''}">${lab(label, on)}<div class="in"><input type="time" data-ch="${key}" value="${c[key]}"></div><small class="msg">Clock out must be after clock in</small>${edited(on, T(was), key)}</label>`; };
  const shift = c.type === 'add_shift' ? '' : `<div class="field"><span>Shift</span><button class="in" ${c.lock ? 'disabled' : 'data-act="chEntries"'}><span class="grow">${o ? `${fmtDate(c.iso)} · ${T(o.inM)} – ${T(o.outM)}` : 'Choose a shift'}</span>${c.lock ? '' : ic('chevD', 20, 2)}</button>${o ? `<small>${o.job} · ${DUR(span(o.inM, o.outM))} recorded</small>` : ''}</div>`;
  const jobOn = c.type === 'correction' && o && c.job !== o.job;
  const fields = c.type === 'remove_shift' || (c.type === 'correction' && !o) ? '' : `
${c.type === 'add_shift' ? `<label class="field"><span>Date <em>*</em></span><div class="in"><input type="date" data-ch="iso" max="${TODAY_ISO}" value="${c.iso}"></div></label>` : ''}
<div class="field">${lab('Job', jobOn)}<button class="in" data-act="chJobs"><span class="grow">${c.job}</span>${ic('chevD', 20, 2)}</button>${edited(jobOn, o && o.job, 'job')}</div>
<div class="two">${time('Clock in', 'in', o && o.inM)}${time('Clock out', 'out', o && o.outM)}</div>`;
  return `${hdrBack(c.reqId ? 'Edit request' : 'Request a change')}<div class="stack">
${kinds.length > 1 ? `<div class="kinds">${kinds.map(k => `<button class="${c.type === k ? 'on' : ''}" data-act="chKind" data-v="${k}"><span class="chip ${KIND[k].chip}">${ic(KIND[k].icon, 20, 2.2)}</span><b>${KIND[k].short}</b></button>`).join('')}</div><p class="t-sub" style="margin-top:-4px">${KIND[c.type].sub}</p>`
    : `<div class="row gap12"><span class="chip ${KIND[c.type].chip}">${ic(KIND[c.type].icon, 22, 2.2)}</span><div><b class="t-card">${KIND[c.type].label}</b><p class="t-sub">${KIND[c.type].sub}</p></div></div>`}
${shift}${fields}
<div id="chg-summary">${chSummary()}</div>
<div class="field"><span>Reason <em>*</em></span><div class="opts quick">${QUICK.map(q => `<button data-act="chQuick">${q}</button>`).join('')}</div>
<div class="in area mt8"><textarea data-ch="reason" placeholder="${c.type === 'add_shift' ? 'Explain why this shift was not recorded' : c.type === 'remove_shift' ? 'Explain why this shift should be removed' : 'Explain what should be corrected'}">${c.reason}</textarea></div><small id="chg-count">${c.reason.trim().length} / 20 characters minimum</small></div>
${c.reqId ? `<button class="btn line sm" style="color:var(--bad)" data-act="cancelReq" data-v="${c.reqId}">Cancel request</button>` : ''}
</div>`;
};
DOCKS.change = () => { const p = chProblem(), c = S.ch; return `<div class="dockbar col">${p ? `<p class="dockhint">${p}</p>` : ''}<button class="btn ${c.type === 'remove_shift' ? 'danger' : ''}" data-act="chSubmit" ${p ? 'disabled' : ''}>${c.reqId ? 'Resubmit request' : c.type === 'remove_shift' ? 'Request removal' : 'Submit request'}</button></div>`; };
// Typing must not re-render the form (it would drop focus), so only the summary and dock refresh.
function chSync() {
  if (S.route === 'entry') { entrySync(); return; }
  $('#chg-summary').innerHTML = chSummary();
  $('#chg-count').textContent = `${S.ch.reason.trim().length} / 20 characters minimum`;
  $('#dock').innerHTML = DOCKS.change();
}
document.addEventListener('input', e => { const k = e.target.dataset.ch; if (k) { S.ch[k] = e.target.value; chSync(); } });
document.addEventListener('change', e => { const k = e.target.dataset.ch; if (k && k !== 'reason' && S.route !== 'entry') render(true); });

/* ---------- requests list: "My requests" for a worker, "Requests" to review for admin and owner ---------- */
V.requests = () => {
  const rev = reviewer(), all = reqList(), keys = rev ? ['pending', 'all', 'approved', 'declined', 'withdrawn'] : ['pending', 'all', 'approved', 'declined'];
  if (!keys.includes(S.rf)) S.rf = 'pending';
  const shown = all.filter(r => S.rf === 'all' || r.st === S.rf);
  return `${hdrBack('Timeclock')}${title(rev ? 'Requests' : 'My requests', rev ? 'Timesheet changes from your team' : 'Changes you have asked for', rev ? '' : `<button class="icon-btn sq" data-act="change" data-v="correction:" aria-label="New request">${ic('plus', 24)}</button>`)}
<div class="pad mt12"><div class="fchips">${keys.map(k => `<button class="${S.rf === k ? 'on' : ''}" data-act="rf" data-v="${k}">${k === 'all' ? 'All' : REQ_ST[k][1]}<em>${all.filter(r => k === 'all' || r.st === k).length}</em></button>`).join('')}</div></div>
${guard({ error: "Couldn't load your requests — tap to retry", icon: 'inbox', empty: rev ? 'No requests to review' : 'No requests yet', emptySub: rev ? 'Timesheet changes from your team will appear here' : 'Fix a time, add a missing shift or remove one from your timesheet', cta: rev ? '' : 'New request' }, () => `
<div class="stack">${shown.length ? shown.map(reqCard).join('') : `<div class="state" style="padding:36px 20px"><span class="chip ${S.rf === 'pending' ? 'green' : 'slate'}">${ic(S.rf === 'pending' ? 'check' : 'inbox', 30)}</span><h2 class="t-h2">${S.rf === 'pending' ? (rev ? 'All caught up' : 'Nothing waiting') : 'No requests match this filter'}</h2><p class="t-sub">${S.rf === 'pending' ? (rev ? 'There are no requests waiting for your review.' : 'You have no requests waiting for review.') : 'Try another status.'}</p></div>`}</div>`)}`;
};
function reqCard(r) {
  const rev = reviewer(), k = KIND[r.type], open = S.rx === r.id, a = after(r), d = reqDelta(r), mineToAct = r.st === 'pending' && r.mine && !rev, toReview = r.st === 'pending' && rev && !r.mine;
  const cell = (rec, req, on) => `<span>${rec}</span><span class="${on ? 'on' : ''}">${req}</span>`;
  const table = `<div class="diff"><i></i><small>Recorded</small><small>Requested</small>
<i>Job</i>${cell(r.old ? r.old.job : '—', r.type === 'remove_shift' ? '—' : a.job, !!r.req.job)}
<i>Clock in</i>${cell(r.old ? T(r.old.inM) : '—', r.type === 'remove_shift' ? '—' : T(a.inM), r.req.inM != null)}
<i>Clock out</i>${cell(r.old ? T(r.old.outM) : '—', r.type === 'remove_shift' ? '—' : T(a.outM), r.req.outM != null)}
<i>Hours</i>${cell(r.old ? DUR(span(r.old.inM, r.old.outM)) : '—', r.type === 'remove_shift' ? '0h 00m' : DUR(span(a.inM, a.outM)), d !== 0)}
${rev ? `<i>Labor cost</i>${cell(r.old ? '$' + (span(r.old.inM, r.old.outM) / 60 * RATE[r.who]).toFixed(2) : '—', '$' + (r.type === 'remove_shift' ? 0 : span(a.inM, a.outM) / 60 * RATE[r.who]).toFixed(2), d !== 0)}` : ''}</div>`;
  const actions = toReview ? `<div class="row gap12 mt12"><button class="btn sm" data-act="review" data-v="${r.id}:approved">${ic('check', 18, 2.4)}Approve</button><button class="btn line sm" style="color:var(--bad)" data-act="review" data-v="${r.id}:declined">${ic('x', 18, 2.4)}Decline</button></div>`
    : mineToAct ? `<div class="row gap12 mt12"><button class="btn soft sm" data-act="editReq" data-v="${r.id}">${ic('edit', 18)}Edit request</button><button class="btn line sm" data-act="cancelReq" data-v="${r.id}">Cancel request</button></div>`
    : r.st === 'pending' && r.mine ? `<div class="note mt12">${ic('lock', 16)}You can't review your own request.</div>` : '';
  return `<div class="card clip rc ${open ? 'open' : ''}">
<button class="rc-top" data-act="rx" data-v="${r.id}" aria-expanded="${open}">
<span class="row gap12">${rev ? av(r.avatar, r.who) : `<span class="chip ${k.chip}">${ic(k.icon, 20, 2.2)}</span>`}<span class="grow"><b class="t-card trunc" style="display:block">${rev ? r.who : k.label}</b><span class="t-sub trunc" style="display:block">${rev ? k.label + ' · ' : ''}${fmtDate(r.iso)} · ${a.job}</span></span>${stPill(REQ_ST, r.st)}</span>
<span class="row between gap8 mt12"><span class="line1 trunc">${rev ? `<span class="kdot ${k.chip}"></span>` : ''}${reqLine(r)}</span>${deltaChip(d)}</span>
<span class="row between mt8"><span class="t-sub">Submitted ${r.sent}${r.st === 'pending' && r.days >= 2 ? ` · <b style="color:var(--warn)">waiting ${r.days} days</b>` : ''}</span><span class="c-3">${ic(open ? 'chevU' : 'chevD', 18, 2.2)}</span></span>
</button>
${open ? `<div class="rc-body">${table}
<div class="mt12"><small class="t-over">Reason</small><p class="t-sub mt4" style="color:var(--text)">${r.reason}</p></div>
${r.by ? `<div class="note ${r.st === 'declined' ? 'warn' : ''} mt12">${ic(r.st === 'declined' ? 'x' : 'check', 16, 2.4)}<span>${REQ_ST[r.st][1]} by ${r.by} on ${r.on}${r.note ? ' — ' + r.note : ''}</span></div>` : ''}
${actions}</div>` : ''}</div>`;
}

/* ---------- sheets ---------- */
const jobPickSheet = () => `<div class="sheet-head"><b>Choose a job</b><button data-act="closeSheet">Close</button></div>
${JOBS.map(j => `<button class="lrow" data-act="chJob" data-v="${j.name}"><span class="chip ${S.ch.job === j.name ? 'blue' : 'slate'}">${ic('pin', 22)}</span><span class="grow"><b class="t-body">${j.name}</b><span class="t-sub" style="display:block">${j.addr}</span></span>${S.ch.job === j.name ? `<span class="c-pri">${ic('check', 22, 2.4)}</span>` : ''}</button>`).join('')}`;
const entryPickSheet = () => `<div class="sheet-head"><b>Which shift?</b><button data-act="closeSheet">Close</button></div>
${ENTRIES.filter(e => !e.removed && !e.locked && e.outM != null && !pendingFor(e.id)).map(e => `<button class="lrow" data-act="chPick" data-v="${e.id}"><span class="chip slate">${ic('clock', 22)}</span><span class="grow"><b class="t-body">${fmtDate(e.iso)} · ${T(e.inM)} – ${T(e.outM)}</b><span class="t-sub" style="display:block">${e.job}</span></span>${cv()}</button>`).join('')}
<p class="t-sub" style="padding:10px 18px 0">Locked shifts, shifts in progress and shifts with a request already pending are not listed.</p>`;
const reviewSheet = (r, st) => `<div class="sheet-head"><b>${st === 'approved' ? 'Approve request' : 'Decline request'}</b><button data-act="closeSheet">Cancel</button></div>
<div style="padding:0 18px"><p class="t-body">${r.who} · ${KIND[r.type].label}</p><p class="t-sub mt4">${fmtDate(r.iso)} · ${reqLine(r)} ${deltaChip(reqDelta(r))}</p>
<p class="t-sub mt8">${st === 'approved' ? { correction: 'The shift is updated and marked Corrected.', add_shift: 'The shift is added to the timesheet and marked Added.', remove_shift: 'The shift is removed from the timesheet.' }[r.type] : 'The timesheet stays as recorded. The worker sees your note.'}</p>
<div class="field mt12"><span>Review note${st === 'declined' ? '' : ' (optional)'}</span><div class="in area"><textarea id="rnote" placeholder="${st === 'declined' ? 'Tell the worker why' : 'Add a note for the worker'}"></textarea></div></div>
<button class="btn ${st === 'declined' ? 'danger' : ''} mt12" style="margin-top:14px" data-act="reviewDo" data-v="${r.id}:${st}">${st === 'approved' ? 'Approve' : 'Decline'}</button></div>`;
const cancelSheet = r => `<div class="sheet-head"><b>Cancel this request?</b><button data-act="closeSheet">Keep it</button></div>
<div style="padding:0 18px"><p class="t-sub">${KIND[r.type].label} · ${fmtDate(r.iso)} · ${reqLine(r)}</p><p class="t-sub mt8">Your timesheet stays as recorded. You can send a new request later.</p>
<button class="btn danger" style="margin-top:14px" data-act="cancelDo" data-v="${r.id}">Cancel request</button></div>`;

/* ---------- actions (merged into ACT by app.js) ---------- */
const REQ_ACT = {
  entry(v) { S.entry = +v; S.ch = null; go('entry'); },
  // v = "type:entryId" or "add_shift::isoDate"; with no entry the form asks which shift
  change(v) { const [type, id, iso] = v.split(':'); chNew(type, +id || null, iso); go('change'); },
  editReq(v) {
    const r = REQUESTS.find(x => x.id === +v), a = after(r);
    S.ch = { type: r.type, entryId: r.entryId, reqId: r.id, old: r.old, lock: true, iso: r.iso, job: a.job, in: HM(a.inM), out: HM(a.outM), reason: r.reason };
    sheet(false);
    if (r.type !== 'add_shift' && ENTRIES.some(e => e.id === r.entryId)) { S.entry = r.entryId; S.ch.old = null; go('entry'); } else go('change');
  },
  chKind(v) { S.ch.type = v; if (v === 'add_shift') { S.ch.entryId = null; } render(true); },
  chJobs() { sheet(jobPickSheet()); },
  chJob(v) { S.ch.job = v; sheet(false); render(true); },
  chEntries() { sheet(entryPickSheet()); },
  chPick(v) { const e = ENTRIES.find(x => x.id === +v); Object.assign(S.ch, { entryId: e.id, iso: e.iso, job: e.job, in: HM(e.inM), out: HM(e.outM) }); sheet(false); render(true); },
  chReset(v) { const o = chOld(); S.ch[v] = v === 'job' ? o.job : HM(v === 'in' ? o.inM : o.outM); render(true); },
  chQuick(v, el) { S.ch.reason = el.textContent; $('[data-ch="reason"]').value = S.ch.reason; chSync(); },
  chSubmit() {
    if (chProblem()) return;
    const c = S.ch, o = chOld(), req = {};
    if (c.type === 'add_shift') Object.assign(req, { job: c.job, inM: toM(c.in), outM: toM(c.out) });
    if (c.type === 'correction') { if (c.job !== o.job) req.job = c.job; if (toM(c.in) !== o.inM) req.inM = toM(c.in); if (toM(c.out) !== o.outM) req.outM = toM(c.out); }
    // Resubmitting replaces the pending request instead of filing a second one for the same shift.
    const at = REQUESTS.findIndex(r => r.id === c.reqId); if (at >= 0) REQUESTS.splice(at, 1);
    const id = Math.max(...REQUESTS.map(r => r.id)) + 1;
    REQUESTS.unshift({ id, mine: true, who: ME.first + ' ' + ME.last, avatar: ME.avatar, type: c.type, entryId: c.type === 'add_shift' ? null : c.entryId, iso: c.iso, old: c.type === 'add_shift' ? null : o, req, reason: c.reason.trim(), sent: 'Thu 8 Oct, 9:41 am', days: 0, st: 'pending' });
    S.rf = 'pending'; S.rx = id; go('requests', true);
    setTimeout(() => toast(c.reqId ? 'Request resubmitted' : 'Correction request submitted'), 60);
  },
  rf(v) { S.rf = v; S.rx = 0; render(true); },
  rx(v) { S.rx = S.rx === +v ? 0 : +v; render(true); },
  review(v) { const [id, st] = v.split(':'); sheet(reviewSheet(REQUESTS.find(r => r.id === +id), st)); },
  reviewDo(v) {
    const [id, st] = v.split(':'), r = REQUESTS.find(x => x.id === +id), note = $('#rnote').value.trim(), who = ME.first + ' ' + ME.last;
    Object.assign(r, { st, by: who, on: 'Thu 8 Oct', note });
    if (st === 'approved') { // apply it to the timesheet, as the backend does
      const e = ENTRIES.find(x => x.id === r.entryId), a = after(r);
      if (r.type === 'correction' && e) Object.assign(e, { job: a.job, inM: a.inM, outM: a.outM, adj: 'correction', hist: reqChanges(r), by: who });
      if (r.type === 'remove_shift' && e) e.removed = true;
      if (r.type === 'add_shift' && r.mine) ENTRIES.push({ id: 300 + r.id, iso: r.iso, job: a.job, inM: a.inM, outM: a.outM, adj: 'add_shift', hist: [], by: who });
    }
    sheet(false); render(true); toast(st === 'approved' ? 'Request approved' : 'Request declined');
  },
  cancelReq(v) { sheet(cancelSheet(REQUESTS.find(r => r.id === +v))); },
  cancelDo(v) {
    REQUESTS.find(r => r.id === +v).st = 'withdrawn'; sheet(false);
    if (S.route === 'change') { history.back(); setTimeout(() => toast('Request cancelled'), 60); } else { render(true); toast('Request cancelled'); }
  },
};

// Defaults so the form and entry screens also open from a direct link.
chNew('correction', 103);
