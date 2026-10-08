/* Form screens. Field labels, placeholders and validation messages follow the app's en.json.
   Each form's primary action sits in the dock (the bar pinned above the home indicator). */

const F = {
  // opts: req (required), type (inputmode), msg (error text), btn ([icon, label] trailing button), hint
  text: (label, value, ph, o = {}) => `<label class="field"><span>${label}${o.req ? ' <em>*</em>' : ''}</span><div class="in"><input ${o.req ? 'data-req' : ''} ${o.type ? `inputmode="${o.type}"` : ''} placeholder="${ph || ''}" value="${value || ''}">${o.btn ? `<button class="c-pri" data-toast="${o.btn[1]}" aria-label="${o.btn[1]}">${ic(o.btn[0], 22, 1.9)}</button>` : ''}</div>${o.hint ? `<small>${o.hint}</small>` : ''}<small class="msg">${o.msg || label + ' is required'}</small></label>`,
  select: (label, value, ph, o = {}) => `<div class="field"><span>${label}${o.req ? ' <em>*</em>' : ''}</span><button class="in" data-toast="${ph}"><span class="grow trunc ${value ? '' : 'c-3'}" style="margin:0;font-size:16px;font-weight:400">${value || ph}</span>${ic('chevD', 20, 2)}</button></div>`,
  date: (label, value, o = {}) => `<div class="field"><span>${label}${o.req ? ' <em>*</em>' : ''}</span><button class="in" data-toast="${o.time ? 'Select date & time' : 'Select date'}"><span class="grow ${value ? '' : 'c-3'}" style="margin:0;font-size:16px;font-weight:400">${value || (o.time ? 'Select date & time' : 'Select date')}</span><span class="c-2">${ic('calendar', 20, 1.9)}</span></button></div>`,
  area: (label, value, ph, o = {}) => `<label class="field"><span>${label}${o.req ? ' <em>*</em>' : ''}</span><div class="in area"><textarea ${o.req ? 'data-req' : ''} placeholder="${ph || ''}">${value || ''}</textarea>${o.mic ? `<button class="c-pri" data-toast="Listening…" aria-label="Dictate">${ic('mic', 22, 1.9)}</button>` : ''}</div>${o.hint ? `<small>${o.hint}</small>` : ''}<small class="msg">${o.msg || label + ' is required'}</small></label>`,
  // single-choice chips; `on` is the selected label
  opts: (label, list, on) => `<div class="field"><span>${label}</span><div class="opts">${list.map(x => `<button class="${x === on ? 'on' : ''}" data-act="opt">${x}</button>`).join('')}</div></div>`,
  // toggle row; `show` is the id of a block revealed while the toggle is on
  tog: (label, sub, on, show = '') => `<div class="chk"><span class="grow"><b class="t-body">${label}</b>${sub ? `<span class="t-sub" style="display:block">${sub}</span>` : ''}</span><button class="tog ${on ? 'on' : ''}" data-act="ftog" data-v="${show}" aria-label="${label}"><i></i></button></div>`,
  sec: t => `<div class="t-over" style="margin:10px 2px 0">${t}</div>`,
  two: (a, b) => `<div class="two">${a}${b}</div>`,
  upload: (label, hint, files = []) => `<div class="field"><span>${label}</span><div class="upl">${files.map(f => `<i style="background-image:url(${f})"><button data-toast="Remove file" aria-label="Remove file">${ic('x', 14, 2.6)}</button></i>`).join('')}<button data-toast="Take photo · Choose from library">${ic('plus', 24)}<small>Add</small></button></div>${hint ? `<small>${hint}</small>` : ''}</div>`,
};
const dockBtn = (label, o = {}) => `<div class="dockbar">${o.back ? `<button class="btn line" style="width:auto;padding:0 20px" data-act="${o.back}">Back</button>` : ''}<button class="btn ${o.cls || ''}" data-act="${o.act || 'save'}" data-v="${o.done || 'Saved'}">${o.icon ? ic(o.icon, 20) : ''}${label}</button></div>`;
const DOCKS = {};

/* ---------------- vehicle: add / edit ---------------- */
V.vehicleForm = () => {
  const c = S.edit ? CARS.find(x => x.id === S.car) : {}, mk = (c.make || '').split(' ');
  return `${hdrBack(S.edit ? 'Edit Vehicle' : 'Add Vehicle')}<div class="stack">
${F.sec('Details')}
${F.text('Vehicle Name', c.name, 'e.g. Ute 1', { req: 1, msg: 'Vehicle name is required' })}
${F.two(F.text('ID', c.ext, 'e.g. FLEET-01'), F.text('Number Plate', c.plate, 'e.g. ABC-123', { req: 1, btn: ['scan', 'Scan number plate'], msg: 'Number plate is required' }))}
${F.text('VIN', c.vin, 'e.g. JT2AE09W1P0038512')}
${F.two(F.text('Make', mk[0], 'e.g. Toyota', { req: 1 }), F.text('Model', mk.slice(1).join(' '), 'e.g. Hilux SR5', { req: 1 }))}
${F.text('Colour', S.edit ? 'White' : '', 'e.g. White')}
${F.opts('Status', ['Available', 'In use', 'Maintenance', 'Retired', 'Lost'], S.edit ? 'In use' : 'Available')}
${F.sec('Service and registration')}
${F.two(F.text('Speedometer (kms)', S.edit ? '32460' : '', '0', { type: 'numeric' }), F.text('Service Due (kms)', S.edit ? '38000' : '', '0', { type: 'numeric' }))}
${F.two(F.date('Service Due Date', S.edit ? '12 Mar 2027' : ''), F.date('Rego Due Date', S.edit ? '30 Jun 2027' : ''))}
${F.two(F.date('Insurance Expiry Date', S.edit ? '1 Jul 2027' : ''), F.date('Inspection Due Date', ''))}
${F.sec('Roadside')}
${F.two(F.text('Roadside Assistance', S.edit ? 'RACV' : '', 'e.g. NRMA'), F.text('Roadside Phone #', S.edit ? '13 11 11' : '', 'e.g. 13 11 22', { type: 'tel' }))}
${S.edit ? `<button class="btn line sm" style="color:var(--bad);margin-top:6px" data-toast='Delete "${c.name}" from the fleet?'>Delete vehicle</button>` : ''}
</div>`;
};
DOCKS.vehicleForm = () => dockBtn(S.edit ? 'Save changes' : 'Add Vehicle', { done: S.edit ? 'Changes saved' : 'Vehicle added to the fleet' });

/* ---------------- asset: add / edit ---------------- */
V.assetForm = () => {
  const a = S.edit ? ASSETS.find(x => x.id === S.asset) : {};
  return `${hdrBack(S.edit ? 'Edit Asset' : 'Add Asset')}<div class="stack">
${F.sec('Details')}
${F.two(F.text('Asset ID', a.id, 'e.g. DSC-00379'), F.text('Serial Number', S.edit ? 'SN-1029384' : '', 'e.g. SN-1029384', { btn: ['scan', 'Scan serial barcode'] }))}
${F.text('Asset Name', a.name, 'e.g. Cordless Drill', { req: 1, msg: 'Asset name is required' })}
${S.edit && a.st === 'in_use' ? `<div class="note">${ic('lock', 16)}In use — return the tool to change its status.</div>` : F.opts('Status', ['Available', 'Maintenance', 'Retired', 'Lost'], 'Available')}
${F.two(F.select('Supplier', S.edit ? 'Total Tools' : '', 'Select…'), F.select('Manufacturer', S.edit ? 'DeWalt' : '', 'Select…'))}
${F.two(F.select('Location', S.edit ? 'Site Store A' : '', 'Select…'), F.select('Department', '', 'Select…'))}
${F.sec('Purchase')}
${F.two(F.date('Purchase Date', S.edit ? '12 Aug 2024' : ''), F.date('Warranty Expiry', S.edit ? '12 Aug 2027' : ''))}
${F.text('Purchase Cost (AUD)', S.edit ? '349.00' : '', '0.00', { type: 'decimal' })}
${F.sec('Test & Tag')}
<div class="card clip">${F.tog('Requires Test & Tag', 'Electrical equipment that needs periodic testing', S.edit, 'nextTest')}</div>
<div id="nextTest" style="${S.edit ? '' : 'display:none'}">${F.date('Next Test Due', S.edit ? '4 Nov 2026' : '')}</div>
${F.sec('Files')}
${F.upload('Images', 'Max 50MB', S.edit && a.photo ? [a.photo] : [])}
${F.upload('Invoice', 'Max 50MB')}
${F.area('Notes', '', 'Anything worth knowing about this asset')}
${S.edit ? `<button class="btn line sm" style="color:var(--bad);margin-top:6px" data-toast='Delete "${a.name}" from the register?'>Delete asset</button>` : ''}
</div>`;
};
DOCKS.assetForm = () => dockBtn(S.edit ? 'Save changes' : 'Add Asset', { done: S.edit ? 'Changes saved' : 'Asset added to the register' });

/* ---------------- asset: check out / check in ---------------- */
V.assetCheckout = () => {
  const a = ASSETS.find(x => x.id === S.asset), inUse = a.st === 'in_use';
  return `${hdrBack(inUse ? 'Check In' : 'Check Out')}<div class="stack">
<div class="card p row gap12">${a.photo ? `<img src="${a.photo}" alt="" style="width:56px;height:56px;border-radius:10px;object-fit:cover">` : `<span class="chip slate" style="width:56px;height:56px">${ic('wrench', 26)}</span>`}<div class="grow"><b class="t-card">${a.name}</b><p class="t-sub">ID ${a.id}${inUse ? ' · Currently checked out to ' + a.loc : ''}</p></div></div>
${inUse ? `${F.date('Checkin Date', '8 Oct 2026', { req: 1 })}${F.opts('Status after check-in', ['Available', 'Maintenance', 'Retired'], 'Available')}${F.select('Return to location', 'Site Store A', 'Select a location')}`
    : `${F.opts('Checkout to', ['Employee', 'Job site', 'Vehicle', 'Location'], 'Employee')}${F.select('Employee', '', 'Select an employee', { req: 1 })}${F.two(F.date('Checkout Date', '8 Oct 2026', { req: 1 }), F.date('Expected Return Date', ''))}`}
${F.opts('Condition', ['New', 'Good', 'Fair', 'Poor'], 'Good')}
${F.area('Notes', '', 'Optional')}
</div>`;
};
DOCKS.assetCheckout = () => { const inUse = ASSETS.find(x => x.id === S.asset).st === 'in_use'; return dockBtn(inUse ? 'Check In' : 'Check Out', { done: inUse ? 'Asset checked in' : 'Asset checked out' }); };

/* ---------------- timesheet: request correction ---------------- */
V.correction = () => `${hdrBack('Request correction')}<div class="stack">
${F.sec('Original entry')}
<div class="card p" style="padding-top:2px;padding-bottom:2px"><div class="kv">Clock in<b>Wed 7 Oct, 6:55 am</b></div><div class="kv">Clock out<b>Wed 7 Oct, 3:28 pm</b></div><div class="kv">Job<b>Riverside Footbridge</b></div><div class="kv">Status<b>${pill('warn', 'Pending')}</b></div></div>
${F.sec('Correction details')}
${F.opts('Event type', ['Clock in', 'Clock out', 'Break start', 'Break end'], 'Clock out')}
${F.select('Job', 'Riverside Footbridge', 'Select job', { req: 1 })}
<div class="field"><span>Date &amp; time <em>*</em> ${pill('info', 'Edited')}</span><button class="in" data-toast="Select date & time"><span class="grow" style="margin:0;font-size:16px;font-weight:400">Wed 7 Oct 2026, 3:00 pm</span><span class="c-2">${ic('calendar', 20, 1.9)}</span></button><button class="link" data-toast="Reset to original value">Reset to original value</button></div>
${F.area('Reason', '', 'Explain what should be corrected (at least 20 characters)', { req: 1, msg: 'Please add at least 20 characters' })}
</div>`;
DOCKS.correction = () => dockBtn('Submit request', { done: 'Correction request submitted' });

/* ---------------- journey plan: six steps ---------------- */
const J_STEPS = ['Journey', 'Driver & fatigue', 'Vehicle', 'Passengers', 'Route & hazards', 'Contacts'];
const J_BODY = [
  () => `${F.text('Starting from', 'Home · Brunswick VIC', 'Where are you leaving from?', { req: 1, msg: "Tell us where you're starting from" })}${F.text('Going to', '', 'Where are you going?', { req: 1, msg: "Tell us where you're going" })}${F.date('Leaving at', '', { req: 1, time: 1 })}${F.area('Why are you making this trip?', '', 'e.g. Deliver formwork to site', { req: 1, msg: "Tell us why you're making this trip" })}`,
  () => `<div class="card clip">${F.tog("I'm fit to drive", 'Rested, well, and not affected by anything that would impair driving', true)}${F.tog('My licence is current', '', true)}</div>${F.text('Hours worked in the last 24 hours', '8', '0', { type: 'numeric', msg: 'Enter a number of hours between 0 and 24' })}`,
  () => `${F.select('Vehicle', 'Site ute 04 · 1ABC 234', 'Choose a company vehicle', { req: 1 })}<button class="link" data-toast="Your own car">Travelling with your own car?</button><div class="card clip">${F.tog('Pre-trip check done', 'Use the vehicle inspection in the Vehicles tab', true)}${F.tog('Fuel full', '', true)}${F.tog('Spare tyre and tools on board', '', false)}</div>`,
  () => `<div class="card clip"><div class="lrow">${av('img/avatar-jordan.jpg', 'Jordan Davis')}<span class="grow"><b class="t-body">Jordan Davis</b><span class="t-sub" style="display:block">Colleague</span></span><button class="icon-btn" data-toast="Remove passenger" aria-label="Remove">${ic('x', 20)}</button></div></div><button class="btn soft sm" data-toast="Add passenger">${ic('plus', 18)}Add passenger</button>`,
  () => `<div class="card clip">${F.tog("I've checked the route", '', true)}${F.tog('I expect to lose phone signal', "Tells your manager not to worry if you go quiet", false)}${F.tog("I'll take a break every two hours", 'Fatigue is the biggest risk on a long drive.', true)}</div><div class="field"><span>Anything expected on the way?</span><div class="opts multi">${['Roadworks', 'Wildlife / dusk driving', 'Unsealed road', 'Flooding', 'Extreme heat', 'None'].map((h, i) => `<button class="${i === 0 ? 'on' : ''}" data-act="optMulti">${h}</button>`).join('')}</div></div>`,
  () => `${F.text('Emergency contact name', 'Maya Morgan', '', { req: 1, msg: 'An emergency contact name is required' })}${F.text('Emergency contact phone', '+61 412 000 111', '', { req: 1, type: 'tel', msg: 'An emergency contact phone number is required' })}${F.select('Also notify a teammate (optional)', '', 'Pick someone from your company')}${F.text('Also email this plan to (optional)', '', 'name@example.com', { btn: ['plus', 'Add email'] })}<div class="note">${ic('mail', 16)}Contacts without a Site OS account get an email instead.</div>`,
];
V.journeyForm = () => `${hdrBack('New journey plan')}
<div class="pad"><div class="row between"><b class="t-h2">${J_STEPS[S.jstep]}</b><span class="t-sub">Step ${S.jstep + 1} of ${J_STEPS.length}</span></div><div class="steps mt8">${J_STEPS.map((_, i) => `<i class="${i <= S.jstep ? 'on' : ''}"></i>`).join('')}</div></div>
<div class="stack">${J_BODY[S.jstep]()}</div>`;
DOCKS.journeyForm = () => S.jstep < J_STEPS.length - 1
  ? dockBtn('Next', { act: 'jnext', back: S.jstep ? 'jprev' : '' })
  : dockBtn('Submit for approval', { done: 'Journey plan submitted for approval', back: 'jprev' });

/* ---------------- vehicle incident report ---------------- */
V.incident = () => { const c = CARS.find(x => x.id === S.car); return `${hdrBack('Incidents · ' + c.name)}
<div class="utabs"><button class="on">Report an incident</button><button data-toast="Reports">Reports</button></div>
<div class="stack">
${F.upload('Photos and videos', 'Upload photos or videos of the accident and any damage', [c.photo])}
<div class="field"><span>Accident location</span><div class="in"><input placeholder="Search an address, or describe the place"><button class="c-pri" data-toast="Pick the location on the map" aria-label="Pick the location on the map">${ic('pin', 22, 1.9)}</button></div></div>
${F.area('Accident description', '', 'Describe what happened, or tap the microphone', { req: 1, mic: 1 })}
${F.sec('Other driver')}<p class="t-sub" style="margin-top:-6px">Optional — fill this in if another vehicle was involved</p>
${F.text('Full name', '', "Enter the other driver's full name")}
${F.text('Phone number', '', 'Enter their phone number', { type: 'tel' })}
${F.upload("Driver's license", 'Add clear photos of their license — front and back')}
</div>`; };
DOCKS.incident = () => dockBtn('Submit report', { cls: 'danger', done: 'Incident reported — thanks for letting us know' });

/* ---------------- JSA form ---------------- */
V.jsaForm = () => { const j = JSAS.find(x => x.id === S.jsa); const yn = (q, on, req = 1) => `<div class="card p q"><b class="t-body">${q}${req ? ' <em>*</em>' : ''}</b><div class="opts mt8">${['Yes', 'No', 'N/A'].map(x => `<button class="${x === on ? 'on' : ''}" data-act="opt">${x}</button>`).join('')}</div></div>`;
  return `${hdrBack('JSA')}
<div class="pad"><h1 class="t-greet">${j.title}</h1><p class="t-sub mt4">${j.job} · Approver: ${j.approver}</p>
<div class="row between mt12"><span class="t-sub">4 of ${j.q} answered</span>${stPill(JSA_ST, j.st)}</div><div class="bar mt8"><i style="width:${4 / j.q * 100}%"></i></div></div>
<div class="stack">
<div class="note">${ic('users', 16)}One person fills this in for the whole crew.</div>
${yn('Has the work area been inspected for hazards?', 'Yes')}
${yn('Is an exclusion zone set up around mobile plant?', 'Yes')}
${yn('Are all workers wearing the required PPE?', 'Yes')}
${yn('Is fall protection in place for work at height?', 'N/A')}
${yn('Have underground services been located?', '')}
<div class="card p q"><b class="t-body">Who is the spotter for today's lift? <em>*</em></b>${F.select('', '', 'Pick a person').replace('<span></span>', '')}</div>
<div class="card p q"><b class="t-body">Weather conditions</b><div class="opts mt8">${['Fine', 'Windy', 'Wet', 'Extreme heat'].map(x => `<button data-act="opt">${x}</button>`).join('')}</div></div>
<div class="card p q"><b class="t-body">Anything else the crew should know?</b><div class="field mt8"><div class="in area"><textarea placeholder="Type your answer"></textarea></div></div></div>
<div class="note warn">${ic('alert', 16)}8 required questions still need an answer</div>
</div>`; };
DOCKS.jsaForm = () => dockBtn('Submit JSA', { done: 'JSA submitted for approval' });
