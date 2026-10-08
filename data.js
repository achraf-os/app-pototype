/* Sample data. Field names and wording follow the Site OS app (its screens and en.json),
   so nothing here needs data the app does not already have — except where marked NEW. */

const ME = { first: 'Alex', last: 'Morgan', role: 'Site worker', email: 'alex.morgan@siteos.co', phone: '+61 412 345 678', avatar: 'img/avatar-alex.jpg', company: 'Riverside Constructions' };

const JOBS = [
  { id: 1, name: 'Riverside Footbridge', addr: 'Riverside Park, Melbourne VIC', photo: 'img/home-bridge.jpg' }, // photo + address: NEW
  { id: 2, name: 'Westgate Depot', addr: '14 Dock Rd, Footscray VIC' },
  { id: 3, name: 'Northline Station', addr: '220 Sydney Rd, Coburg VIC' },
];

const TODAY_ENTRIES = [
  { job: 'Riverside Footbridge', in: '6:58 am', out: '11:30 am', hrs: '4:32', status: 'approved' },
  { job: 'Riverside Footbridge', in: '12:02 pm', out: '3:04 pm', hrs: '3:02', status: 'pending' },
];

const WEEK = [
  { d: 'Mon', n: '5 Oct', in: '6:58 am', out: '3:02 pm', hrs: 8.0, st: 'approved' },
  { d: 'Tue', n: '6 Oct', in: '7:01 am', out: '3:00 pm', hrs: 8.0, st: 'approved' },
  { d: 'Wed', n: '7 Oct', in: '6:55 am', out: '3:28 pm', hrs: 8.5, st: 'pending' },
  { d: 'Thu', n: '8 Oct', in: '6:58 am', out: '', hrs: 0, st: 'progress' },
  { d: 'Fri', n: '9 Oct', in: '', out: '', hrs: 0, st: 'none' },
];

const SHIFTS = {
  'Mon': [{ name: 'General shift', time: '7:00 am – 3:00 pm', job: 'Riverside Footbridge', brk: '30 min break', st: 'completed' }],
  'Tue': [{ name: 'General shift', time: '7:00 am – 3:00 pm', job: 'Riverside Footbridge', brk: '30 min break', st: 'completed' }],
  'Wed': [{ name: 'General shift', time: '7:00 am – 3:00 pm', job: 'Riverside Footbridge', brk: '30 min break', st: 'completed' }],
  'Thu': [{ name: 'General shift', time: '7:00 am – 3:00 pm', job: 'Riverside Footbridge', brk: '30 min break', st: 'published' },
          { name: 'Concrete pour', time: '4:00 pm – 6:00 pm', job: 'Westgate Depot', brk: 'No break', st: 'draft' }],
  'Fri': [{ name: 'General shift', time: '7:00 am – 3:00 pm', job: 'Northline Station', brk: '30 min break', st: 'published' }],
  'Sat': [], 'Sun': [],
};
const SHIFT_DAYS = [['Mon', 5], ['Tue', 6], ['Wed', 7], ['Thu', 8], ['Fri', 9], ['Sat', 10], ['Sun', 11]];

const CARS = [
  { id: 'v04', name: 'Site ute 04', plate: '1ABC 234', make: 'Toyota Hilux SR5', ext: 'FLEET-04', vin: 'JT2AE09W1P0038512', photo: 'img/a-ute.jpg', st: 'ok', driver: 'Alex Morgan', avatar: 'img/avatar-alex.jpg', last: 'Check-in · today 6:40 am', mine: true },
  { id: 'v07', name: 'Site ute 07', plate: '2DEF 518', make: 'Toyota Hilux Workmate', ext: 'FLEET-07', vin: 'MR0FB8CD3H0412761', photo: 'img/b-ute.jpg', st: 'ok', driver: 'Jordan Davis', avatar: 'img/avatar-jordan.jpg', last: 'Check-out · yesterday', mine: true },
  { id: 'v02', name: 'Tray ute 02', plate: '1GHJ 772', make: 'Toyota Hilux SR', ext: 'FLEET-02', vin: 'MR0HA3CD500718224', photo: 'img/c-ute.jpg', st: 'warn', driver: 'Chris Taylor', avatar: 'img/avatar-chris.jpg', last: 'Analysing video…', mine: false },
  { id: 'v11', name: 'Fleet ute 11', plate: '3KLM 409', make: 'Toyota HiLux SR5', ext: 'FLEET-11', vin: 'MR0KA3CD901145530', photo: 'img/fleet-ute.jpg', st: 'off', driver: 'Unassigned', avatar: '', last: 'No inspections yet', mine: false },
];
const CAR_ST = { ok: ['ok', 'check', 'Analysed'], warn: ['warn', 'clock', 'Analysing'], off: ['neutral', 'video', 'Waiting for video'] };

const ASSETS = [
  { id: 'DRL-0142', name: 'Cordless drill', photo: 'img/a-drill.jpg', st: 'available', loc: 'Site Store A', tag: 'valid', maker: 'DeWalt', cat: 'Power tools', serial: 'SN-1029384', supplier: 'Total Tools', due: '4 Nov 2026', hist: [['Jordan Davis', '28 Sep 2026', '2 Oct 2026'], ['Alex Morgan', '14 Sep 2026', '18 Sep 2026']] },
  { id: 'PPE-0037', name: 'Safety helmet', photo: 'img/a-helmet.jpg', st: 'in_use', loc: 'Alex Morgan', tag: 'valid', maker: 'Petzl', cat: 'PPE', serial: 'SN-5582017', supplier: 'RSEA Safety', due: '12 Jan 2027', hist: [['Alex Morgan', '5 Oct 2026', '']] },
  { id: 'LVL-0066', name: 'Laser level', photo: 'img/a-laser.jpg', st: 'available', loc: 'Site Store B', tag: 'due_soon', maker: 'DeWalt', cat: 'Survey equipment', serial: 'SN-7740921', supplier: 'Total Tools', due: '20 Oct 2026', hist: [['Chris Taylor', '21 Sep 2026', '25 Sep 2026']] },
  { id: 'GEN-0009', name: 'Generator 5kVA', photo: '', st: 'maintenance', loc: 'Workshop', tag: 'expired', maker: 'Honda', cat: 'Plant', serial: 'SN-0091273', supplier: 'Kennards', due: '1 Sep 2026', hist: [] },
];
const ASSET_ST = { available: ['ok', 'Available'], in_use: ['info', 'In use'], maintenance: ['warn', 'Maintenance'], retired: ['neutral', 'Retired'], lost: ['bad', 'Lost'] };
const TAG_ST = { valid: ['ok', 'Test & Tag valid', 'Valid'], due_soon: ['warn', 'Test due soon', 'Due soon'], expired: ['bad', 'Test expired', 'Expired'] };

const JOURNEYS = [
  { id: 1, to: 'Riverside Footbridge', from: 'Home · Brunswick', when: 'Today, 6:15 am', car: 'Site ute 04', st: 'in_progress' },
  { id: 2, to: 'Northline Station', from: 'Westgate Depot', when: 'Fri 9 Oct, 6:30 am', car: 'Your own car', st: 'approved' },
  { id: 3, to: 'Bendigo Yard', from: 'Westgate Depot', when: 'Mon 12 Oct, 5:00 am', car: 'Site ute 07', st: 'submitted' },
  { id: 4, to: 'Westgate Depot', from: 'Riverside Footbridge', when: 'Tue 6 Oct, 3:10 pm', car: 'Site ute 04', st: 'completed' },
];
const JOURNEY_ST = { in_progress: ['info', 'In progress'], approved: ['ok', 'Approved'], submitted: ['warn', 'Awaiting approval'], completed: ['neutral', 'Completed'], declined: ['bad', 'Declined'] };

const JSAS = [
  { id: 1, job: 'Riverside Footbridge', title: 'Concrete deck preparation', q: 12, st: 'sent', by: '', approver: 'Chris Taylor' },
  { id: 2, job: 'Westgate Depot', title: 'Crane lift — precast panels', q: 18, st: 'submitted', by: 'Jordan Davis', approver: 'Chris Taylor' },
  { id: 3, job: 'Northline Station', title: 'Trenching and excavation', q: 9, st: 'approved', by: 'Sam Lee', approver: 'Chris Taylor' },
];
const JSA_ST = { draft: ['neutral', 'Draft'], sent: ['info', 'To fill in'], submitted: ['warn', 'Awaiting approval'], approved: ['ok', 'Approved'], declined: ['bad', 'Declined — redo'] };

const TEAM = [
  { name: 'Jordan Davis', avatar: 'img/avatar-jordan.jpg', job: 'Riverside Footbridge', in: '6:52 am', out: '', hrs: '2:49', active: true },
  { name: 'Chris Taylor', avatar: 'img/avatar-chris.jpg', job: 'Westgate Depot', in: '7:04 am', out: '', hrs: '2:37', active: true },
  { name: 'Sam Lee', avatar: '', job: 'Northline Station', in: '6:30 am', out: '9:15 am', hrs: '2:45', active: false },
];

/* Correction requests. A worker sees only their own (mine: true); an admin or owner reviews everyone's. */
const REQUESTS = [
  { id: 1, who: 'Alex Morgan', avatar: 'img/avatar-alex.jpg', mine: true, type: 'Clock out', job: 'Riverside Footbridge', from: 'Wed 7 Oct, 3:28 pm', to: 'Wed 7 Oct, 3:00 pm', reason: 'Forgot to clock out when I left site — I finished at 3 pm.', sent: '7 Oct', st: 'pending' },
  { id: 2, who: 'Jordan Davis', avatar: 'img/avatar-jordan.jpg', mine: false, type: 'Clock in', job: 'Riverside Footbridge', from: 'Thu 8 Oct, 7:22 am', to: 'Thu 8 Oct, 6:50 am', reason: 'No signal at the gate, the app clocked me in late.', sent: '8 Oct', st: 'pending' },
  { id: 3, who: 'Sam Lee', avatar: '', mine: false, type: 'Break end', job: 'Northline Station', from: 'Tue 6 Oct, 1:10 pm', to: 'Tue 6 Oct, 12:30 pm', reason: 'Ended my break at 12:30 but did not tap End Break.', sent: '6 Oct', st: 'pending' },
  { id: 4, who: 'Alex Morgan', avatar: 'img/avatar-alex.jpg', mine: true, type: 'Clock in', job: 'Westgate Depot', from: 'Mon 5 Oct, 7:15 am', to: 'Mon 5 Oct, 6:58 am', reason: 'Phone was flat on arrival, clocked in once it charged.', sent: '5 Oct', st: 'approved', by: 'Chris Taylor', on: '5 Oct', note: 'Confirmed with the site log.' },
  { id: 5, who: 'Chris Taylor', avatar: 'img/avatar-chris.jpg', mine: false, type: 'Clock out', job: 'Westgate Depot', from: 'Fri 2 Oct, 5:40 pm', to: 'Fri 2 Oct, 3:30 pm', reason: 'Left at 3:30 for a medical appointment.', sent: '2 Oct', st: 'declined', by: 'Dana Wells', on: '3 Oct', note: 'Gate log shows you left at 5:35 pm.' },
  { id: 6, who: 'Alex Morgan', avatar: 'img/avatar-alex.jpg', mine: true, type: 'Break start', job: 'Riverside Footbridge', from: 'Thu 1 Oct, 12:00 pm', to: 'Thu 1 Oct, 12:15 pm', reason: 'Started my break later than recorded.', sent: '1 Oct', st: 'withdrawn' },
];
const REQ_ST = { pending: ['warn', 'Pending'], approved: ['ok', 'Approved'], declined: ['bad', 'Declined'], withdrawn: ['neutral', 'Withdrawn'] };

const MORE = [
  ['shifts', 'Shifts', 'calendar', 'blue'], ['journeys', 'Journeys', 'route', 'green'], ['jsa', 'JSA', 'shield', 'teal'],
  ['oscar', 'Oscar', 'spark', 'indigo'], ['profile', 'Profile', 'user', 'orange'], ['settings', 'Settings', 'gear', 'slate'],
];

/* Prototype state. `state` drives the five screen states; `clock` the Timeclock phase. */
const S = {
  route: 'timeclock', state: 'data', role: 'worker',
  clock: 'ready', since: 0, job: 1,
  edit: false, asset: 'DRL-0142', atab: 'Details', jsa: 1, jstep: 0,
  rf: 'all',
  tsMode: 'Week', day: 'Thu', vf: 'mine', car: 'v04', vtab: 'Details', aseg: 'Assets', pin: 0, q: '',
  tog: { bio: true },
  chat: [['bot', 'Hi Alex — I can look up your jobs, shifts, assets and timesheets. What do you need?']],
};
