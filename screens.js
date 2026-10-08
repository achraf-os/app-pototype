/* One function per screen. Each returns HTML built only from the shared classes in styles.css. */

const pill = (cls, text, icon) => `<span class="pill ${cls}">${icon ? ic(icon, 14, 2.4) : ''}${text}</span>`;
const stPill = (map, key, extra = '') => `<span class="pill ${map[key][0]} ${extra}">${map[key][1]}</span>`;
const av = (src, name, cls = '') => `<span class="avatar ${cls}">${src ? `<img src="${src}" alt="">` : name.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>`;
const job = () => JOBS.find(j => j.id === S.job);

/* Tab-root header: logo, notifications bell, profile avatar. */
const hdrMain = () => `<div class="hdr"><div class="logo grow">Site <span>OS</span></div>
<button class="icon-btn dot" data-toast="No new notifications" aria-label="Notifications">${ic('bell', 24, 1.9)}</button>
<button data-go="profile" aria-label="Profile">${av(ME.avatar, ME.first)}</button></div>`;
/* Pushed-screen header: back chevron, title, optional trailing control. */
const hdrBack = (title, right = '') => `<div class="hdr"><button class="icon-btn back" data-act="back" aria-label="Back">${ic('chevL', 28, 1.8)}</button><span class="ttl grow">${title}</span>${right}</div>`;
const title = (t, sub = '', right = '') => `<div class="pad row between" style="margin-top:4px"><div><h1 class="t-title">${t}</h1>${sub ? `<p class="t-sub mt4">${sub}</p>` : ''}</div>${right}</div>`;

/* The five screen states. `body` renders only for data/offline; the rest are shared layouts. */
function guard(o, body) {
  if (S.state === 'loading') return `<div class="stack">${[o.tall || 92, o.tall || 92, o.tall || 92, 60].map(h => `<div class="skel" style="height:${h}px"></div>`).join('')}</div>`;
  if (S.state === 'error') return `<div class="state"><span class="chip red">${ic('alert', 30)}</span><h2 class="t-h2">Something went wrong</h2><p class="t-sub">${o.error}</p><button class="btn sm" data-act="state" data-v="data">${ic('refresh', 18)}Try again</button></div>`;
  if (S.state === 'empty') return `<div class="state"><span class="chip blue">${ic(o.icon, 30)}</span><h2 class="t-h2">${o.empty}</h2><p class="t-sub">${o.emptySub}</p>${o.cta ? `<button class="btn sm" data-toast="${o.cta}">${ic('plus', 18)}${o.cta}</button>` : ''}</div>`;
  return body();
}

const V = {};

/* ---------------- auth ---------------- */
V.login = () => `<div class="auth"><div class="logo">Site <span>OS</span></div>
<h1 class="t-title" style="margin-top:56px">Log in</h1><p class="t-sub mt8" style="font-size:15px">Enter your mobile number and we'll text you a code</p>
<label class="field mt16" style="margin-top:28px"><span>Mobile number</span><div class="in"><button class="row gap6" data-toast="Select country">🇦🇺 +61 ${ic('chevD', 16, 2.2)}</button><input inputmode="tel" placeholder="412 345 678" value="412 345 678"></div></label>
<button class="btn" style="margin-top:20px" data-go="otp">Send code</button>
<p class="t-sub center" style="margin-top:auto">Safe people. Stronger projects.</p></div>`;

V.otp = () => `<div class="auth"><button class="icon-btn back" style="margin-left:-10px" data-act="back">${ic('chevL', 28, 1.8)}</button>
<h1 class="t-title" style="margin-top:28px">Enter the code</h1><p class="t-sub mt8" style="font-size:15px">We sent a 6-digit code to ${ME.phone}</p>
<div class="otp" style="margin-top:28px">${['4', '8', '2', '', '', ''].map((d, i) => `<i class="${i === 3 ? 'on' : ''}">${d}</i>`).join('')}</div>
<button class="btn" style="margin-top:20px" data-go="unlock">Verify</button>
<p class="t-sub center mt16">Resend code in 24s</p>
<button class="btn soft sm" style="margin-top:auto" data-act="back">Change number</button></div>`;

V.unlock = () => `<div class="auth" style="align-items:center"><div class="logo" style="margin-top:20px">Site <span>OS</span></div>
<h1 class="t-greet" style="margin-top:44px">Enter your PIN</h1><p class="t-sub mt4" style="font-size:15px">Welcome back, ${ME.first}</p>
<div class="dots">${[0, 1, 2, 3].map(i => `<i class="${i < S.pin ? 'on' : ''}"></i>`).join('')}</div>
<div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-act="pin">${n}</button>`).join('')}
<button class="flat" data-go="timeclock" aria-label="Unlock with Face ID">${ic('face', 30, 1.8)}</button><button data-act="pin">0</button><button class="flat" data-act="pinDel" aria-label="Delete">${ic('back', 28, 1.8)}</button></div>
<button class="t-sub" style="margin-top:auto;color:var(--primary);font-weight:600" data-go="login">Log out</button></div>`;

/* ---------------- timeclock ---------------- */
const greetHour = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
const CLOCK = {
  ready:    { sub: 'Ready to start your productive day', p: 1, c: ['#BBD8FF', '#8FBFFF'], btn: '', label: 'Clock In' },
  active:   { sub: "You're all set — have a great day", p: .35, c: ['#34D399', '#17A05A'], btn: 'out', label: 'Clock Out' },
  break:    { sub: 'On break — enjoy it', p: .35, c: ['#F6C36F', '#F0A23A'], btn: 'out', label: 'Clock Out' },
  complete: { sub: "You've completed your workday!", p: .94, c: ['#2A8CFF', '#0B62F0'], btn: '', label: 'Clock In' },
};
function ring() {
  const k = CLOCK[S.clock], r = 104, c = 2 * Math.PI * r, on = S.clock === 'active' || S.clock === 'break';
  return `<div class="ring"><svg viewBox="0 0 236 236"><defs><linearGradient id="rg" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${k.c[0]}"/><stop offset="1" stop-color="${k.c[1]}"/></linearGradient></defs>
<circle cx="118" cy="118" r="${r}" fill="none" stroke="var(--track)" stroke-width="16"/>
<circle cx="118" cy="118" r="${r}" fill="none" stroke="url(#rg)" stroke-width="16" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - k.p)}" transform="rotate(-90 118 118)"/></svg>
<button class="ring-btn ${k.btn}" data-act="clock" aria-label="${k.label}">${ic('clock', 30, 2.2)}<b>${k.label}</b>${on ? '<span id="timer">0:00:00</span>' : ''}</button></div>`;
}
V.timeclock = () => {
  if (S.role === 'owner') return V.statistics();
  const k = CLOCK[S.clock], j = job(), on = S.clock === 'active' || S.clock === 'break';
  const under = on ? `<p class="t-sub center row gap6" style="justify-content:center"><span style="color:var(--ok-solid)">${ic('pin', 16)}</span>Within site geofence · Started at 6:58 am</p>`
    : S.clock === 'complete' ? '<p class="t-sub center">Total worked: 7:34 hours</p>' : '';
  return `${hdrMain()}
<div class="pad" style="margin-top:6px"><div class="row between"><h1 class="t-greet">${greetHour()}, ${ME.first}</h1>${on ? pill(S.clock === 'break' ? 'warn' : 'ok', S.clock === 'break' ? 'On break' : 'Clocked in') : ''}</div><p class="t-sub mt4" style="font-size:14px">${k.sub}</p></div>
${guard({ error: "Couldn't load your status — tap to retry", icon: 'clock', empty: 'No jobs assigned', emptySub: 'Ask your supervisor to roster you on a job, then pull to refresh.', tall: 180 }, () => `
<div class="stack">
${ring()}${under}
<button class="card job" data-act="jobs"><span class="t-over">${on ? 'Current job' : 'Job'}</span><b class="t-h2" style="display:block;margin-top:3px">${j.name}</b><span class="t-sub row gap6 mt4">${ic('pin', 15)}${j.addr}</span>${on ? '' : cv(22)}${j.photo ? `<img src="${j.photo}" alt="">` : ''}</button>
${on ? `<button class="btn ${S.clock === 'break' ? 'warn' : 'soft'}" data-act="brk">${ic('coffee', 20)}${S.clock === 'break' ? 'End Break' : 'Start Break'}</button>` : ''}
<div class="card clip">
<button class="lrow" data-go="jsa"><span class="chip teal">${ic('shield', 22)}</span><span class="grow"><b class="t-body">Today's JSA needs filling in</b><span class="t-sub" style="display:block">${j.name} · one person fills it in for the crew</span></span>${cv()}</button>
<button class="lrow" data-go="journeys"><span class="chip green">${ic('route', 22)}</span><span class="grow"><b class="t-body">Making a trip today?</b><span class="t-sub" style="display:block">Tap to plan it before you set off</span></span>${cv()}</button>
</div>
<div class="section"><h2 class="t-h2">Today</h2><button class="row gap6" data-go="requests">View requests${reqBadge()}</button></div>
<div class="card metrics"><div><b>${S.clock === 'ready' ? '0:00' : '7:34'}</b><small>Worked</small></div><div><b>${S.clock === 'ready' ? '0:00' : '0:32'}</b><small>Break</small></div><div><b>0:00</b><small>Overtime</small></div></div>
${S.clock === 'ready' ? '<p class="t-sub center" style="padding:8px">No entries yet today — clock in to start</p>' : todayRows()}
</div>`)}`;
};

/* Owner's view of the Timeclock tab. */
V.statistics = () => `${hdrMain()}
<div class="pad" style="margin-top:6px"><h1 class="t-greet">${greetHour()}, ${ME.first}</h1><p class="t-sub mt4" style="font-size:14px">Here's your team activity</p></div>
${guard({ error: "Couldn't load statistics — tap to retry", icon: 'users', empty: 'No activity', emptySub: 'Clock-ins and clock-outs will appear here', tall: 80 }, () => `
<div class="stack">
<div class="card p row between"><button class="icon-btn sq" data-toast="Previous day">${ic('chevL', 22)}</button><div class="center"><b class="t-h2">Thu 8 Oct</b><p class="t-sub">Today</p></div><button class="icon-btn sq" data-toast="Next day">${ic('chevR', 22)}</button></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
${[['users', 'blue', '2', 'On the clock now'], ['user', 'green', '3', 'Employees worked'], ['calendar', 'indigo', '3', 'Shifts worked'], ['dollar', 'orange', '$412', 'Labor cost']].map(t => `<div class="card p"><span class="chip ${t[1]}">${ic(t[0], 22)}</span><div class="t-num mt8">${t[2]}</div><p class="t-sub">${t[3]}</p></div>`).join('')}</div>
<button class="card clip" data-go="requests"><span class="lrow"><span class="chip amber">${ic('edit', 22)}</span><span class="grow"><b class="t-body">Correction requests</b><span class="t-sub" style="display:block">${reqPending().length ? reqPending().length + ' waiting for your review' : 'Nothing waiting for review'}</span></span>${reqBadge()}${cv()}</span></button>
<div class="section"><h2 class="t-h2">On the clock now</h2><span>2 active</span></div>
<div class="card clip">${TEAM.filter(t => t.active).map(teamRow).join('')}</div>
<div class="section"><h2 class="t-h2">Clocked in &amp; out</h2></div>
<div class="card clip">${TEAM.filter(t => !t.active).map(teamRow).join('')}</div>
</div>`)}`;
const teamRow = t => `<button class="lrow" data-toast="${t.name}">${av(t.avatar, t.name)}<span class="grow"><b class="t-body">${t.name}</b><span class="t-sub trunc" style="display:block">${t.job} · In ${t.in}${t.out ? ' · Out ' + t.out : ''}</span></span>${t.active ? pill('ok', 'Active') : `<b class="t-body">${t.hrs}</b>`}</button>`;

/* ---------------- shifts + timesheet (one tab, segmented) ---------------- */
const tsSeg = on => `<div class="pad mt8"><div class="seg">${[['shifts', 'Shifts'], ['timesheet', 'Timesheet']].map(s => `<button class="${on === s[0] ? 'on' : ''}" data-go="${s[0]}">${s[1]}</button>`).join('')}</div></div>`;

V.timesheet = () => {
  const P = { approved: ['ok', 'Approved', 'check'], pending: ['warn', 'Pending', 'clock'], progress: ['info', 'In progress', 'clock'], none: ['neutral', 'No shift', ''] };
  const sum = st => WEEK.filter(d => d.st === st).reduce((a, d) => a + d.hrs, 0), ok = sum('approved'), pend = sum('pending');
  return `${hdrMain()}${tsSeg('timesheet')}${tsHead()}
${guard({ error: "Couldn't load timesheets — tap to retry", icon: 'doc', empty: 'No time recorded for this range', emptySub: 'Clock in to start tracking your time' }, () => `
<div class="stack">
<div class="card p row between"><button class="icon-btn sq" data-toast="Previous pay period" aria-label="Previous">${ic('chevL', 22)}</button><div class="center"><b class="t-h2">5 Oct – 11 Oct</b><p class="t-sub">Pay period · this week</p></div><button class="icon-btn sq" data-toast="Next pay period" aria-label="Next">${ic('chevR', 22)}</button></div>
<div class="card p"><div class="row between" style="align-items:flex-end"><div><span class="t-sub">Worked hours</span><div class="t-num mt4">${(ok + pend).toFixed(1)}<small>hrs</small></div></div><span class="t-sub">Regular ${(ok + pend - .5).toFixed(1)} · Overtime 0.5</span></div>
<div class="bar mt12"><i style="width:${ok / 40 * 100}%;background:var(--ok-solid)"></i><i style="width:${pend / 40 * 100}%;background:var(--warn-solid)"></i></div>
<div class="meta mt12"><span><i style="width:9px;height:9px;border-radius:50%;background:var(--ok-solid)"></i>Approved <b>${ok.toFixed(1)}</b></span><span><i style="width:9px;height:9px;border-radius:50%;background:var(--warn-solid)"></i>Pending <b>${pend.toFixed(1)}</b></span></div></div>
<div class="section"><h2 class="t-h2">Daily entries</h2><div class="seg" style="width:128px;height:32px">${['Day', 'Week'].map(m => `<button style="line-height:26px;font-size:13px" class="${S.tsMode === m ? 'on' : ''}" data-act="tsMode" data-v="${m}">${m}</button>`).join('')}</div></div>
${tsRows()}
</div>`)}`;
};

V.shifts = () => {
  const P = { draft: ['neutral', 'Draft'], published: ['info', 'Published'], completed: ['ok', 'Completed'], cancelled: ['bad', 'Cancelled'] };
  const list = SHIFTS[S.day];
  return `${hdrMain()}${tsSeg('shifts')}
${guard({ error: "Couldn't load your shifts — tap to retry", icon: 'calendar', empty: 'No shifts scheduled', emptySub: 'Your upcoming shifts will appear here' }, () => `
<div class="stack">
<div class="wk">${SHIFT_DAYS.map(d => `<button class="${S.day === d[0] ? 'on' : ''}" data-act="day" data-v="${d[0]}"><small>${d[0]}</small><b>${d[1]}</b><i class="${SHIFTS[d[0]].length ? '' : 'no'}"></i></button>`).join('')}</div>
<div class="section"><h2 class="t-h2">${S.day} ${SHIFT_DAYS.find(d => d[0] === S.day)[1]} Oct</h2><button class="row gap6" data-toast="Team shifts">${ic('users', 16)}Team</button></div>
${list.length ? list.map(s => `<button class="card p" data-toast="${s.name}"><div class="row between"><b class="t-card">${s.name}</b>${stPill(P, s.st)}</div>
<div class="meta mt8"><span>${ic('clock', 16)}${s.time}</span><span>${ic('coffee', 16)}${s.brk}</span></div><div class="meta mt4"><span>${ic('pin', 16)}${s.job}</span></div></button>`).join('')
    : `<div class="card p center"><p class="t-sub" style="padding:14px 0">No shifts</p></div>`}
</div>`)}`;
};

/* ---------------- vehicles ---------------- */
V.vehicles = () => {
  const shown = CARS.filter(c => S.vf === 'fleet' || c.mine);
  return `${hdrMain()}${title('Vehicles', 'Check a vehicle in or out', `<button class="icon-btn sq" data-act="form" data-v="vehicleForm:add" aria-label="Add Vehicle">${ic('plus', 24)}</button>`)}
<div class="pad mt12"><div class="search"><label>${ic('search', 20, 1.9)}<input id="q" placeholder="Enter the full number plate" value="${S.q}"></label><button class="icon-btn box" data-toast="Scan number plate" aria-label="Scan number plate">${ic('scan', 22, 1.9)}</button></div></div>
<div class="pad mt12"><div class="fchips">${[['mine', 'Your vehicles', CARS.filter(c => c.mine).length], ['fleet', 'Fleet', CARS.length]].map(f => `<button class="${S.vf === f[0] ? 'on' : ''}" data-act="vf" data-v="${f[0]}">${f[1]}<em>${f[2]}</em></button>`).join('')}</div></div>
${guard({ error: "Couldn't load vehicles — tap to retry", icon: 'car', empty: 'No vehicles assigned to you', emptySub: 'Search by number plate or scan a plate to find one', tall: 230 }, () => `
<div class="stack">${shown.map(c => { const st = CAR_ST[c.st]; return `<button class="card raise clip" data-act="car" data-v="${c.id}" data-s="${(c.name + ' ' + c.plate + ' ' + c.make).toLowerCase()}">
<div style="position:relative"><img class="photo" src="${c.photo}" alt="${c.name}"><span class="pill ${st[0]} float">${ic(st[1], 14, 2.4)}${st[2]}</span></div>
<div style="padding:12px 14px 14px"><div class="row between gap8"><b class="t-h2 trunc">${c.name}</b><span class="plate"><i>VIC</i>${c.plate}</span></div><p class="t-sub mt4">${c.make} · ${c.ext}</p>
<div class="vfoot">${c.avatar ? av(c.avatar, c.driver, 'sm') : `<span class="avatar sm">${ic('user', 18)}</span>`}<div class="grow"><small>Assigned to</small><b>${c.driver}</b></div><div style="text-align:right"><small>Last inspection</small><b>${c.last}</b></div>${cv()}</div></div></button>`; }).join('')}</div>`)}`;
};

V.vehicle = () => {
  const c = CARS.find(x => x.id === S.car), st = CAR_ST[c.st];
  const body = S.vtab === 'Details' ? `<div class="card p" style="padding-top:2px;padding-bottom:2px">${[['Vehicle Name', c.name], ['ID', c.ext], ['Number Plate', c.plate], ['VIN', c.vin], ['Assigned to', c.driver]].map(r => `<div class="kv">${r[0]}<b>${r[1]}</b></div>`).join('')}</div>
<div class="row gap12"><button class="btn" data-toast="Record a walk-around video">${ic('video', 20)}Check-in</button><button class="btn soft" data-toast="Record a walk-around video">${ic('video', 20)}Check-out</button></div>`
    : S.vtab === 'Inspections' ? [['Check-in', 'Today, 6:40 am', 'ok', 'Analysed'], ['Check-out', 'Yesterday, 3:12 pm', 'ok', 'Analysed'], ['Comparison', 'Yesterday, 3:20 pm', 'warn', 'Comparing…']].map(r => `<button class="card clip" data-toast="${r[0]}"><span class="lrow"><span class="chip blue">${ic(r[0] === 'Comparison' ? 'swap' : 'video', 22)}</span><span class="grow"><b class="t-body">${r[0]}</b><span class="t-sub" style="display:block">${r[1]}</span></span>${pill(r[2], r[3])}${cv()}</span></button>`).join('')
    : `<button class="btn danger" data-go="incident">${ic('alert', 20)}Report an incident</button><div class="card p center"><p class="t-sub" style="padding:14px 0">No incident reports for this vehicle</p></div>`;
  return `${hdrBack('Vehicle', `<button class="icon-btn" data-act="form" data-v="vehicleForm:edit" aria-label="Edit Vehicle">${ic('edit', 22)}</button>`)}
<img src="${c.photo}" alt="${c.name}" style="width:100%;height:210px;object-fit:cover">
<div class="pad" style="margin-top:14px"><div class="row between gap8"><h1 class="t-title trunc" style="font-size:25px">${c.name}</h1><span class="pill ${st[0]}">${ic(st[1], 14, 2.4)}${st[2]}</span></div>
<div class="row gap12 mt8"><span class="plate"><i>VIC</i>${c.plate}</span><span class="t-sub">${c.make}</span></div></div>
<div class="utabs mt12">${['Details', 'Inspections', 'Incidents'].map(t => `<button class="${S.vtab === t ? 'on' : ''}" data-act="vtab" data-v="${t}">${t}</button>`).join('')}</div>
<div class="stack">${body}</div>`;
};

/* ---------------- assets (same pattern as vehicles: photo cards -> detail -> edit) ---------------- */
const assetPhoto = (a, h) => a.photo ? `<img class="photo" src="${a.photo}" alt="${a.name}" style="height:${h}px">` : `<div class="ph" style="height:${h}px">${ic('wrench', 44, 1.5)}</div>`;
const assetWhere = a => a.st === 'in_use' ? ['Deployed to', a.loc, 'user'] : ['Location', a.loc, 'pin'];

V.assets = () => {
  const locs = {}; ASSETS.forEach(a => { if (a.st !== 'in_use') locs[a.loc] = (locs[a.loc] || 0) + 1; });
  return `${hdrMain()}${title('Assets', 'Tools and equipment on your sites', `<button class="icon-btn sq" data-act="form" data-v="assetForm:add" aria-label="Add Asset">${ic('plus', 24)}</button>`)}
<div class="pad mt12"><div class="search"><label>${ic('search', 20, 1.9)}<input id="q" placeholder="Search tools" value="${S.q}"></label><button class="icon-btn box" data-toast="Scan serial barcode" aria-label="Scan serial barcode">${ic('scan', 22, 1.9)}</button></div></div>
<div class="pad mt12"><div class="fchips">${[['Assets', ASSETS.length], ['Locations', Object.keys(locs).length]].map(f => `<button class="${S.aseg === f[0] ? 'on' : ''}" data-act="aseg" data-v="${f[0]}">${f[0]}<em>${f[1]}</em></button>`).join('')}</div></div>
${guard({ error: "Couldn't load assets — tap to retry", icon: 'box', empty: 'No assets yet', emptySub: 'Add the tools and equipment your company owns to start tracking them', cta: 'Add Asset', tall: 230 }, () => S.aseg === 'Locations'
    ? `<div class="stack">${Object.keys(locs).map(k => `<button class="card clip" data-toast="${k}"><span class="lrow"><span class="chip blue">${ic('pin', 22)}</span><span class="grow"><b class="t-body">${k}</b><span class="t-sub" style="display:block">${locs[k]} asset${locs[k] > 1 ? 's' : ''}</span></span>${cv()}</span></button>`).join('')}</div>`
    : `<div class="stack">${ASSETS.map(a => { const w = assetWhere(a); return `<button class="card raise clip" data-act="asset" data-v="${a.id}" data-s="${(a.name + ' ' + a.id + ' ' + a.loc).toLowerCase()}">
<div style="position:relative">${assetPhoto(a, 150)}${stPill(ASSET_ST, a.st, 'float')}</div>
<div style="padding:12px 14px 14px"><div class="row between gap8"><b class="t-h2 trunc">${a.name}</b><span class="idtag">${a.id}</span></div><p class="t-sub mt4">${a.maker} · ${a.cat}</p>
<div class="vfoot"><span class="avatar sm">${ic(w[2], 18)}</span><div class="grow"><small>${w[0]}</small><b>${w[1]}</b></div><div style="text-align:right"><small>Test &amp; Tag</small><b style="color:var(--${TAG_ST[a.tag][0] === 'ok' ? 'ok' : TAG_ST[a.tag][0] === 'warn' ? 'warn' : 'bad'})">${TAG_ST[a.tag][2]}</b></div>${cv()}</div></div></button>`; }).join('')}</div>`)}`;
};

V.asset = () => {
  const a = ASSETS.find(x => x.id === S.asset), out = a.st === 'in_use', w = assetWhere(a);
  const body = S.atab === 'Details' ? `<div class="card p" style="padding-top:2px;padding-bottom:2px">${[['Asset Name', a.name], ['Asset ID', a.id], ['Serial Number', a.serial], ['Manufacturer', a.maker], ['Supplier', a.supplier], [w[0], w[1]], ['Next Test Due', a.due]].map(r => `<div class="kv">${r[0]}<b>${r[1]}</b></div>`).join('')}</div>
${a.st === 'available' || out ? `<div class="row gap12"><button class="btn" data-go="assetCheckout">${ic('swap', 20)}${out ? 'Check In' : 'Check Out'}</button><button class="btn soft" data-toast="Transfer to">${ic('route', 20)}Transfer</button></div>` : `<div class="note warn">${ic('lock', 16)}This asset is ${ASSET_ST[a.st][1].toLowerCase()} and can't be checked out.</div>`}`
    : S.atab === 'History' ? (a.hist.length ? a.hist.map(h => `<div class="card clip"><span class="lrow"><span class="chip ${h[2] ? 'slate' : 'blue'}">${ic('user', 22)}</span><span class="grow"><b class="t-body">${h[0]}</b><span class="t-sub" style="display:block">Taken: ${h[1]}${h[2] ? ' · Returned: ' + h[2] : ''}</span></span>${pill(h[2] ? 'neutral' : 'info', h[2] ? 'Returned' : 'Currently out')}</span></div>`).join('') : '<div class="card p center"><p class="t-sub" style="padding:14px 0">No checkouts yet</p></div>')
    : `<div class="field"><span>Images</span><div class="upl">${a.photo ? `<i style="background-image:url(${a.photo})"></i>` : ''}<button data-toast="Add images">${ic('plus', 24)}<small>Add</small></button></div></div>
<div class="card clip"><button class="lrow" data-toast="Click to preview"><span class="chip red">${ic('doc', 22)}</span><span class="grow"><b class="t-body">Invoice</b><span class="t-sub" style="display:block">invoice-${a.id.toLowerCase()}.pdf</span></span>${cv()}</button></div>`;
  return `${hdrBack('Asset', `<button class="icon-btn" data-act="form" data-v="assetForm:edit" aria-label="Edit Asset">${ic('edit', 22)}</button>`)}
${assetPhoto(a, 210)}
<div class="pad" style="margin-top:14px"><div class="row between gap8"><h1 class="t-title trunc" style="font-size:25px">${a.name}</h1>${stPill(ASSET_ST, a.st)}</div>
<div class="row gap12 mt8"><span class="idtag">${a.id}</span>${stPill(TAG_ST, a.tag)}</div></div>
<div class="utabs mt12">${['Details', 'History', 'Files'].map(t => `<button class="${S.atab === t ? 'on' : ''}" data-act="atab" data-v="${t}">${t}</button>`).join('')}</div>
<div class="stack">${body}</div>`;
};

/* ---------------- journeys ---------------- */
V.journeys = () => `${hdrMain()}${title('My journeys', 'Your journey plans, current and past')}
${guard({ error: "Couldn't load your journeys", icon: 'route', empty: 'No journeys yet', emptySub: 'Journey plans assigned to you, and ones you raise, appear here', cta: 'New journey plan' }, () => `
<div class="stack"><button class="btn" data-act="journey">${ic('plus', 20)}New journey plan</button>
${JOURNEYS.map(j => `<button class="card p" data-toast="Journey plan · ${j.to}"><div class="row between gap8"><b class="t-card trunc">${j.to}</b>${stPill(JOURNEY_ST, j.st)}</div><p class="t-sub mt4">From ${j.from}</p>
<div class="meta mt8"><span>${ic('clock', 16)}${j.when}</span><span>${ic('car', 16)}${j.car}</span></div>
${j.st === 'in_progress' ? `<span class="btn sm mt12">${ic('play', 16)}Open trip</span>` : ''}</button>`).join('')}</div>`)}`;

/* ---------------- JSA ---------------- */
V.jsa = () => `${hdrMain()}${title("Today's JSA", 'Job safety analysis for your jobs today')}
${guard({ error: "Couldn't load today's JSA", icon: 'shield', empty: 'No JSA for today', emptySub: "When your supervisor sends today's JSA for a job you're on, it appears here" }, () => `
<div class="stack">${JSAS.map(j => `<button class="card p" data-act="jsa" data-v="${j.id}"><div class="row gap12"><span class="chip teal">${ic('shield', 22)}</span><div class="grow"><b class="t-card trunc" style="display:block">${j.title}</b><span class="t-sub">${j.job}</span></div>${cv()}</div>
<div class="row between mt12">${stPill(JSA_ST, j.st)}<span class="t-sub">${j.q} questions</span></div>
<div class="bar mt12"><i style="width:${j.st === 'sent' ? 0 : 100}%;${j.st === 'approved' ? 'background:var(--ok-solid)' : ''}"></i></div>
<p class="t-sub mt8">${j.by ? `Submitted by ${j.by} · ` : ''}Approver: ${j.approver}</p></button>`).join('')}</div>`)}`;

/* ---------------- oscar ---------------- */
V.oscar = () => `${hdrBack('Oscar', `<button class="icon-btn" data-toast="Start a new conversation?" aria-label="New conversation">${ic('refresh', 22)}</button>`)}
<div class="chat">${S.chat.map(m => `<div class="msg ${m[0]}">${m[1]}</div>`).join('')}</div>`;
const oscarDock = () => `<div class="composer"><label><input id="ask" placeholder="Ask Oscar anything…"></label><button data-act="ask" aria-label="Send">${ic('send', 20)}</button></div>`;

/* ---------------- profile + settings ---------------- */
V.profile = () => `${hdrBack('Profile')}
<div class="stack"><div class="card p row gap12">${av(ME.avatar, ME.first, 'lg')}<div class="grow"><h1 class="t-greet">${ME.first} ${ME.last}</h1><p class="t-sub">${ME.role} · ${ME.company}</p></div></div>
<div class="card clip">
<div class="lrow"><span class="chip blue">${ic('mail', 22)}</span><span class="grow"><span class="t-sub" style="display:block">Email</span><b class="t-body">${ME.email}</b></span></div>
<div class="lrow"><span class="chip green">${ic('phone', 22)}</span><span class="grow"><span class="t-sub" style="display:block">Mobile number</span><b class="t-body">${ME.phone}</b></span></div>
<div class="lrow"><span class="chip orange">${ic('hat', 22)}</span><span class="grow"><span class="t-sub" style="display:block">Company</span><b class="t-body">${ME.company}</b></span></div></div>
<button class="card p" data-go="timesheet"><div class="row gap12"><span class="chip blue">${ic('clock', 22)}</span><div class="grow"><b class="t-body">This week</b><div class="t-num mt4">24.5<small>hrs</small></div></div>${cv()}</div><div class="bar mt12"><i style="width:61%"></i></div></button>
</div>`;

V.settings = () => `${hdrMain()}${title('Settings')}
<div class="stack">
<button class="card p row gap12" data-go="profile">${av(ME.avatar, ME.first, 'lg')}<div class="grow"><b class="t-card" style="font-size:18px">${ME.first} ${ME.last}</b><p class="t-sub">${ME.role}</p></div>${cv(22)}</button>
<div class="t-over" style="margin:10px 4px 0">Security</div>
<div class="card clip">
<div class="lrow"><span class="chip blue">${ic('face', 22)}</span><span class="grow"><b class="t-body">Unlock with Face ID</b><span class="t-sub" style="display:block">Your PIN stays as the fallback</span></span><button class="tog ${S.tog.bio ? 'on' : ''}" data-act="tog" data-v="bio" aria-label="Toggle"><i></i></button></div>
<button class="lrow" data-toast="Change your PIN"><span class="chip indigo">${ic('lock', 22)}</span><span class="grow"><b class="t-body">Change your PIN</b><span class="t-sub" style="display:block">4-digit PIN for this device</span></span>${cv()}</button></div>
<div class="t-over" style="margin:10px 4px 0">Account</div>
<div class="card clip">
<button class="lrow" data-toast="Other accounts on this number"><span class="chip green">${ic('swap', 22)}</span><span class="grow"><b class="t-body">Switch account</b><span class="t-sub" style="display:block">Other accounts on this number</span></span>${cv()}</button>
<button class="lrow" data-go="login"><span class="chip red">${ic('logout', 22)}</span><span class="grow"><b class="t-body" style="color:var(--bad)">Log out</b></span></button></div>
<p class="t-sub center" style="margin-top:6px">Site OS · Version 1.0.0</p></div>`;
