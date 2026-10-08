/* Shell: routing (#/route), tab bar, More sheet, job sheet, toast, and the side panel that
   switches screens and the five screen states. */

const $ = s => document.querySelector(s);

// [route, label, icon]; "more" opens the sheet instead of a screen.
const TABS = [['timeclock', 'Clock', 'clock'], ['timesheet', 'Timesheet', 'calendar'], ['vehicles', 'Vehicles', 'car'], ['assets', 'Assets', 'box'], ['more', 'More', 'dots']];
const tabOf = r => r === 'timeclock' ? 'timeclock' : (r === 'timesheet' || r === 'shifts') ? 'timesheet' : r.startsWith('vehicle') ? 'vehicles' : r === 'assets' ? 'assets' : 'more';
const FORMS = ['vehicleForm', 'assetForm', 'assetCheckout', 'correction', 'journeyForm', 'incident', 'jsaForm'];
const NO_TABS = ['login', 'otp', 'unlock', 'oscar', ...FORMS];
const NO_FAB = [...NO_TABS, 'vehicle', 'profile'];

const PANEL = [
  ['Sign in', [['login', 'Log in'], ['otp', 'Enter the code'], ['unlock', 'PIN unlock']]],
  ['Tabs', [['timeclock', 'Timeclock'], ['timesheet', 'Timesheet'], ['shifts', 'Shifts'], ['vehicles', 'Vehicles'], ['vehicle', 'Vehicle detail'], ['assets', 'Assets']]],
  ['More', [['journeys', 'Journeys'], ['jsa', 'JSA'], ['oscar', 'Oscar'], ['profile', 'Profile'], ['settings', 'Settings']]],
  ['Forms', [['vehicleForm', 'Add / edit vehicle'], ['assetForm', 'Add / edit asset'], ['assetCheckout', 'Asset check out / in'], ['correction', 'Request correction'], ['journeyForm', 'New journey plan'], ['incident', 'Report an incident'], ['jsaForm', 'JSA form']]],
];

function render(keepScroll) {
  const view = $('#view'), top = view.scrollTop;
  const offline = S.state === 'offline' ? `<div class="banner">${ic('wifiOff', 18)}No connection — showing saved data</div>` : '';
  view.innerHTML = offline + V[S.route]();
  view.style.display = S.route === 'oscar' ? 'block' : '';
  $('#dock').innerHTML = S.route === 'oscar' ? oscarDock() : DOCKS[S.route] ? DOCKS[S.route]() : '';
  const tb = $('#tabbar'), on = tabOf(S.route);
  tb.style.display = NO_TABS.includes(S.route) ? 'none' : '';
  tb.innerHTML = TABS.map(t => `<button class="tab${t[0] === on ? ' on' : ''}" ${t[0] === 'more' ? 'data-act="more"' : `data-go="${t[0]}"`}>${ic(t[2], 25, 1.9)}<span>${t[1]}</span></button>`).join('');
  const fab = $('#fab'); fab.style.display = NO_FAB.includes(S.route) ? 'none' : ''; fab.innerHTML = ic('spark', 26, 1.9);
  $('#panel').innerHTML = PANEL.map(g => `<h4>${g[0]}</h4>${g[1].map(s => `<button class="${S.route === s[0] ? 'on' : ''}" data-go="${s[0]}">${s[1]}</button>`).join('')}`).join('')
    + `<h4>Form mode</h4><div class="two">${[['add', false], ['edit', true]].map(m => `<button class="${S.edit === m[1] ? 'on' : ''}" data-act="mode" data-v="${m[0]}">${m[0]}</button>`).join('')}</div>`
    + `<h4>Screen state</h4><div class="two">${['data', 'loading', 'empty', 'error', 'offline'].map(s => `<button class="${S.state === s ? 'on' : ''}" data-act="state" data-v="${s}">${s}</button>`).join('')}</div>`
    + `<h4>Timeclock phase</h4><div class="two">${['ready', 'active', 'break', 'complete'].map(s => `<button class="${S.clock === s ? 'on' : ''}" data-act="phase" data-v="${s}">${s}</button>`).join('')}</div>`
    + `<h4>Signed in as</h4><div class="two">${['worker', 'owner'].map(s => `<button class="${S.role === s ? 'on' : ''}" data-act="role" data-v="${s}">${s}</button>`).join('')}</div>`;
  view.scrollTop = keepScroll ? top : 0;
  if (S.q) filter();
  tick();
}

function go(r, replace) {
  if (!V[r]) r = 'timeclock';
  sheet(false);
  if (r === S.route && !replace) { $('#view').scrollTop = 0; return; }
  S.route = r; S.q = '';
  $('#toast').classList.remove('show');
  history[replace ? 'replaceState' : 'pushState'](null, '', '#/' + r);
  render();
}

function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 1800);
}

/* Marks empty required fields with their inline message; true when the form can be submitted. */
function valid() {
  let first = null;
  document.querySelectorAll('#view [data-req]').forEach(i => { const bad = !i.value.trim(); i.closest('.field').classList.toggle('err', bad); if (bad && !first) first = i; });
  if (first) { first.closest('.field').scrollIntoView({ block: 'center', behavior: 'smooth' }); toast('Check the highlighted fields'); }
  return !first;
}

function filter() {
  document.querySelectorAll('[data-s]').forEach(c => { c.style.display = c.dataset.s.includes(S.q.toLowerCase()) ? '' : 'none'; });
}

/* Bottom sheet. `html` is omitted to close it. */
function sheet(html) {
  const el = $('#sheet');
  if (html) $('#sheet-body').innerHTML = html;
  el.classList.toggle('open', !!html);
  el.setAttribute('aria-hidden', String(!html));
}
const moreSheet = () => `<div class="sheet-head"><b>More</b><button data-toast="Drag a tile to reorder">Edit</button></div>
<div class="tiles">${MORE.map(m => `<button class="tile${S.route === m[0] ? ' on' : ''}" data-go="${m[0]}"><span class="chip ${m[3]}">${ic(m[2], 22)}</span>${m[1]}</button>`).join('')}</div>`;
const jobSheet = () => `<div class="sheet-head"><b>Choose a job</b><button data-act="closeSheet">Close</button></div>
${JOBS.map(j => `<button class="lrow" data-act="job" data-v="${j.id}"><span class="chip ${S.job === j.id ? 'blue' : 'slate'}">${ic('pin', 22)}</span><span class="grow"><b class="t-body">${j.name}</b><span class="t-sub" style="display:block">${j.addr}</span></span>${S.job === j.id ? `<span class="c-pri">${ic('check', 22, 2.4)}</span>` : ''}</button>`).join('')}`;

/* Live elapsed timer inside the ring while clocked in. */
function tick() {
  const el = $('#timer'); if (!el) return;
  const s = Math.floor((Date.now() - S.since) / 1000) + 2 * 3600 + 44 * 60;
  el.textContent = `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
setInterval(tick, 1000);

const ACT = {
  back() { if (history.length > 1) history.back(); else go('timeclock'); },
  more() { sheet(moreSheet()); },
  closeSheet() { sheet(false); },
  state(v) { S.state = v; render(); },
  phase(v) { S.clock = v; S.since = Date.now(); if (S.route !== 'timeclock') go('timeclock'); else render(); },
  role(v) { S.role = v; if (S.route !== 'timeclock') go('timeclock'); else render(); },
  // The ring's centre is the toggle: clocked out -> in, in/on break -> out (day complete).
  clock() {
    const on = S.clock === 'active' || S.clock === 'break';
    S.clock = on ? 'complete' : 'active'; S.since = Date.now();
    render(true); toast(on ? 'Clocked out' : 'Clocked in');
  },
  brk() { S.clock = S.clock === 'break' ? 'active' : 'break'; render(true); toast(S.clock === 'break' ? 'Break started' : 'Break ended'); },
  jobs() { if (S.clock === 'active' || S.clock === 'break') toast('Clock out to change job'); else sheet(jobSheet()); },
  job(v) { S.job = +v; sheet(false); render(true); },
  tsMode(v) { S.tsMode = v; render(true); },
  day(v) { S.day = v; render(true); },
  vf(v) { S.vf = v; render(true); },
  car(v) { S.car = v; S.vtab = 'Details'; go('vehicle'); },
  vtab(v) { S.vtab = v; render(true); },
  aseg(v) { S.aseg = v; render(true); },
  tog(v) { S.tog[v] = !S.tog[v]; render(true); },
  pin() { S.pin++; if (S.pin >= 4) { S.pin = 0; go('timeclock'); } else render(true); },
  pinDel() { S.pin = Math.max(0, S.pin - 1); render(true); },
  // ---- forms ----
  form(v) { const [r, mode] = v.split(':'); S.edit = mode === 'edit'; go(r); },
  mode(v) { S.edit = v === 'edit'; render(); },
  asset(v) { S.asset = v; S.edit = true; go('assetForm'); },
  jsa(v) { S.jsa = +v; go('jsaForm'); },
  journey() { S.jstep = 0; go('journeyForm'); },
  jnext() { if (valid()) { S.jstep++; render(); } },
  jprev() { S.jstep--; render(); },
  // Chips and toggles change in place, so typed values in the form are not lost to a re-render.
  opt(v, el) { el.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); },
  optMulti(v, el) { el.classList.toggle('on'); },
  ftog(v, el) { const on = el.classList.toggle('on'); if (v) $('#' + v).style.display = on ? '' : 'none'; },
  save(v) { if (!valid()) return; history.back(); setTimeout(() => toast(v), 60); },
  ask() {
    const q = $('#ask').value.trim(); if (!q) return;
    S.chat.push(['me', q], ['bot', 'You are rostered on Riverside Footbridge today, 7:00 am – 3:00 pm, with a 30 minute break.']);
    render(); $('#view').scrollTop = 1e6;
  },
};

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act],[data-go],[data-toast]'); if (!t) return;
  if (t.dataset.act) ACT[t.dataset.act](t.dataset.v, t);
  else if (t.dataset.go) go(t.dataset.go);
  else toast(t.dataset.toast);
});
document.addEventListener('input', e => {
  if (e.target.id === 'q') { S.q = e.target.value; filter(); }
  const f = e.target.closest('.field.err'); if (f && e.target.value.trim()) f.classList.remove('err');
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'ask') ACT.ask(); });
window.addEventListener('popstate', () => { S.route = V[location.hash.slice(2)] ? location.hash.slice(2) : 'timeclock'; sheet(false); render(); });

S.route = V[location.hash.slice(2)] ? location.hash.slice(2) : 'timeclock';
history.replaceState(null, '', '#/' + S.route);
render();
