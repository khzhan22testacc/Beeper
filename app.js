'use strict';

const APP_VERSION = '4.3.0';
const NOTE_MAX_WORDS = 200;

// Shared banks: the app checks this list on launch and pulls any bank that changed.
const SHARED_DIR = 'banks/';
const SHARED_INDEX = SHARED_DIR + 'index.json';
const SYNC_EVERY_MS = 30 * 60 * 1000;

// Paste your Google Apps Script web app URL here (ends in /exec). Leave empty to turn off sending.
const FEEDBACK_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxI4CGbsj3ve20NnKCCXgcdnOrxokPDUZiFJYhDLsx_31sqMtv5gaoTvwyiqrGHxZbHIQ/exec';

// Spaced repetition intervals by box (box 0 = just missed)
const MIN = 60 * 1000, DAY = 24 * 60 * MIN;
const INTERVALS = [10 * MIN, 1 * DAY, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY];

const FEEDBACK_TYPES = [
  ['more', 'Excellent question, more please!'],
  ['fix', 'Please fix this'],
];

const SYSTEM_ORDER = ['Cardiology', 'Respirology', 'Gastroenterology', 'Hepatology', 'Nephrology', 'Endocrinology',
  'Hematology', 'Oncology', 'Infectious Disease', 'Rheumatology', 'Neurology', 'Critical Care', 'Geriatrics',
  'Allergy & Immunology', 'Dermatology', 'Psychiatry', 'Pharmacology', 'General Internal Medicine', 'Other'];

// ---------- Built-in sample bank (used only when no banks are loaded) ----------
const SAMPLE_BANK = {
  id: 'sample',
  title: 'Sample questions',
  version: '1',
  questions: [
    {
      id: 's1', system: 'Cardiology', topic: 'AF stroke prevention', kind: 'management',
      stem: '71F w/ new AF found at routine visit. h/o HTN. No HF, DM, stroke/TIA or vascular disease.\n\nBP 138/82, HR 88 irregular.\nCr 78 µmol/L\nNo mitral stenosis, no mechanical valve.',
      lead: 'Most appropriate stroke prevention?',
      options: [
        { label: 'A', text: 'ASA 81 mg daily', explanation: 'Antiplatelets alone are not recommended when oral anticoagulation is indicated.' },
        { label: 'B', text: 'ASA plus clopidogrel', explanation: 'Less effective than oral anticoagulation, with similar bleeding risk.' },
        { label: 'C', text: 'Warfarin, target INR 2–3', explanation: 'Acceptable, but a DOAC is preferred in nonvalvular AF.' },
        { label: 'D', text: 'Apixaban', explanation: 'DOAC: preferred oral anticoagulant in nonvalvular AF.' },
        { label: 'E', text: 'No antithrombotic therapy', explanation: 'Age ≥65 alone meets the threshold for anticoagulation.' },
      ],
      answer: 'D',
      explanation: 'In nonvalvular AF, age ≥65 alone is enough to start oral anticoagulation, and a DOAC is preferred over warfarin. She also has HTN. DOACs are at least as effective as warfarin with less intracranial hemorrhage.',
      references: [], source: { book: 'Sample questions' },
    },
    {
      id: 's2', system: 'Nephrology', topic: 'Hyponatremia correction', kind: 'management',
      stem: '58M w/ confusion and falls x1wk. h/o alcohol use disorder, poor oral intake.\n\nNa 112 mmol/L\nK 2.9 mmol/L\nSerum osmolality 236 mmol/kg\nUrine osmolality 90 mmol/kg',
      lead: 'Max Na rise in the first 24 h?',
      options: [
        { label: 'A', text: '4 mmol/L', explanation: 'A reasonable early goal for symptom relief, not the safety ceiling.' },
        { label: 'B', text: '8 mmol/L', explanation: 'Ceiling for patients at high risk of osmotic demyelination.' },
        { label: 'C', text: '12 mmol/L', explanation: 'Upper limit only for patients without risk factors.' },
        { label: 'D', text: '18 mmol/L', explanation: 'Far above safe limits; high risk of osmotic demyelination.' },
        { label: 'E', text: '24 mmol/L', explanation: 'Far above safe limits; high risk of osmotic demyelination.' },
      ],
      answer: 'B',
      explanation: 'With chronic hyponatremia and osmotic demyelination risk factors (alcohol use disorder, hypokalemia, malnutrition), limit correction to ≤8 mmol/L in 24 h. Low urine osmolality suggests low solute intake, which can autocorrect quickly once solute is given, so watch for a brisk water diuresis.',
      references: [], source: { book: 'Sample questions' },
    },
    {
      id: 's3', system: 'Endocrinology', topic: 'DKA potassium', kind: 'management',
      stem: '24F w/ T1DM p/w vomiting and abdominal pain x1d.\n\nBP 102/64, HR 118, RR 28.\nGlucose 31 mmol/L\nK 3.0 mmol/L\nHCO3 8 mmol/L\nAnion gap 26 mmol/L\nSerum ketones elevated',
      lead: 'After starting IV NS, most appropriate next step?',
      options: [
        { label: 'A', text: 'IV insulin infusion at 0.1 units/kg/h', explanation: 'Insulin shifts K into cells; starting now risks severe hypokalemia.' },
        { label: 'B', text: 'IV KCl; hold insulin until K ≥3.3 mmol/L', explanation: 'Replete K first when it is below 3.3 mmol/L.' },
        { label: 'C', text: 'IV sodium bicarbonate', explanation: 'Generally reserved for severe acidemia (pH <7.0).' },
        { label: 'D', text: 'SC insulin glargine', explanation: 'Basal SC insulin is not initial treatment for DKA.' },
        { label: 'E', text: 'Change fluids to D5W', explanation: 'Dextrose is added once glucose falls to about 14 mmol/L.' },
      ],
      answer: 'B',
      explanation: 'In DKA, if K is below 3.3 mmol/L, hold insulin and replace K first. Insulin drives K into cells, and total body K is already depleted, so starting it now risks arrhythmia.',
      references: [], source: { book: 'Sample questions' },
    },
    {
      id: 's4', system: 'Infectious Disease', topic: 'MSSA bacteremia', kind: 'management',
      stem: '63M on hemodialysis w/ fever and rigors. Tunneled dialysis catheter in place.\n\n2/2 blood cultures: S. aureus, oxacillin-susceptible.\nNo drug allergies.',
      lead: 'Best definitive Abx?',
      options: [
        { label: 'A', text: 'Vancomycin', explanation: 'Inferior to a beta-lactam for MSSA bacteremia.' },
        { label: 'B', text: 'Cefazolin', explanation: 'First-line beta-lactam for MSSA; convenient post-dialysis dosing.' },
        { label: 'C', text: 'Ceftriaxone', explanation: 'Weaker evidence for S. aureus bacteremia than cefazolin.' },
        { label: 'D', text: 'TMP-SMX', explanation: 'Inferior outcomes as primary therapy for S. aureus bacteremia.' },
        { label: 'E', text: 'Linezolid', explanation: 'Not first-line for MSSA bacteremia.' },
      ],
      answer: 'B',
      explanation: 'For MSSA bacteremia, an antistaphylococcal beta-lactam (cefazolin or cloxacillin) is definitive therapy, and vancomycin is inferior. Cefazolin is as effective as cloxacillin, better tolerated, and easy to give after dialysis. Also remove or exchange the catheter and repeat blood cultures.',
      references: [], source: { book: 'Sample questions' },
    },
    {
      id: 's5', system: 'Respirology', topic: 'COPD exacerbation steroids', kind: 'guideline',
      stem: '68M w/ COPD admitted w/ an exacerbation. CXR: no consolidation. Improving on bronchodilators.',
      lead: 'Duration of systemic corticosteroid?',
      options: [
        { label: 'A', text: '1 day', explanation: 'Too short; not supported by trials.' },
        { label: 'B', text: '5 days', explanation: 'As effective as 14 days with less steroid exposure.' },
        { label: 'C', text: '10 days', explanation: 'Longer than needed.' },
        { label: 'D', text: '14 days', explanation: 'No added benefit over 5 days.' },
        { label: 'E', text: 'Until spirometry returns to baseline', explanation: 'Not a validated stopping rule.' },
      ],
      answer: 'B',
      explanation: 'Prednisone 40 mg daily for 5 days is enough for most COPD exacerbations. A 5-day course was non-inferior to 14 days for re-exacerbation, with less total steroid exposure.',
      references: [], source: { book: 'Sample questions' },
    },
    {
      id: 's6', system: 'Hematology', topic: 'Heparin-induced thrombocytopenia', kind: 'management',
      stem: '66F day 7 after hip arthroplasty, on SC UFH prophylaxis. New swollen left leg.\n\nPlt 62 ×10⁹/L (pre-op 240 ×10⁹/L)\nUS: left femoral DVT',
      lead: 'Most appropriate next step?',
      options: [
        { label: 'A', text: 'Increase UFH to therapeutic dose', explanation: 'Continuing any heparin worsens HIT.' },
        { label: 'B', text: 'Switch to therapeutic LMWH', explanation: 'LMWH cross-reacts with HIT antibodies.' },
        { label: 'C', text: 'Stop heparin; start a non-heparin anticoagulant', explanation: 'High pretest probability: treat now, before test results.' },
        { label: 'D', text: 'Platelet transfusion', explanation: 'Generally avoided in HIT; may worsen thrombosis.' },
        { label: 'E', text: 'Stop heparin; start warfarin alone', explanation: 'Warfarin alone in acute HIT can cause venous limb gangrene.' },
      ],
      answer: 'C',
      explanation: 'A >50% platelet fall on day 5–10 of heparin with new thrombosis gives a high 4Ts score. Stop all heparin and start a non-heparin anticoagulant (e.g., argatroban, fondaparinux or a DOAC) while HIT testing is pending.',
      references: [], source: { book: 'Sample questions' },
    },
  ],
};

// ---------- IndexedDB ----------
const DB_NAME = 'pager';
let dbp = null;
function openDb() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const d = req.result;
      d.createObjectStore('banks', { keyPath: 'id' });
      d.createObjectStore('progress', { keyPath: 'key' });
      d.createObjectStore('feedback', { keyPath: 'key' });
      d.createObjectStore('meta', { keyPath: 'k' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}
async function tx(store, mode, fn) {
  const d = await openDb();
  return new Promise((resolve, reject) => {
    const t = d.transaction(store, mode);
    const s = t.objectStore(store);
    const out = fn(s);
    t.oncomplete = () => resolve(out && 'result' in out ? out.result : undefined);
    t.onerror = () => reject(t.error);
  });
}
const idb = {
  all: store => tx(store, 'readonly', s => s.getAll()),
  put: (store, val) => tx(store, 'readwrite', s => s.put(val)),
  del: (store, key) => tx(store, 'readwrite', s => s.delete(key)),
  clear: store => tx(store, 'readwrite', s => s.clear()),
};
async function getMeta(k, fallback) {
  const rows = await idb.all('meta');
  const row = rows.find(r => r.k === k);
  return row ? row.v : fallback;
}
const setMeta = (k, v) => idb.put('meta', { k, v });

const POOLS = [
  ['unused', 'Unused'],
  ['all', 'All'],
  ['incorrect', 'Incorrect'],
];

// ---------- State ----------
const state = {
  view: 'home',
  banks: [],
  byKey: new Map(),
  progress: new Map(),
  feedback: new Map(),
  settings: { sr: true, buzz: true, name: '' },
  home: { pool: 'unused', systems: [] },
  hints: { installDismissed: false },
  clientId: '',
  outbox: new Map(),
  run: null,
};
const keyOf = (bankId, qid) => `${bankId}::${qid}`;

const usingSample = () => !state.banks.length;
const sourceBanks = () => (usingSample() ? [SAMPLE_BANK] : state.banks.filter(b => b.enabled !== false));
function rebuildIndex() {
  state.byKey = new Map();
  for (const b of [SAMPLE_BANK, ...state.banks]) for (const q of b.questions || []) state.byKey.set(keyOf(b.id, q.id), { bank: b, q, key: keyOf(b.id, q.id) });
}
function sourceItems() {
  const out = [];
  for (const b of sourceBanks()) for (const q of b.questions || []) out.push(state.byKey.get(keyOf(b.id, q.id)));
  return out;
}
const sysOf = item => item.q.system || 'Other';
function lastOk(p) { return p && p.history && p.history.length ? p.history[p.history.length - 1].ok : null; }

function inPool(item, pool) {
  const p = state.progress.get(item.key);
  switch (pool) {
    case 'unused': return !p || !p.attempts;
    case 'incorrect': return !!p && p.attempts > 0 && lastOk(p) === false;
    default: return true;
  }
}
function candidates() {
  const sys = state.home.systems;
  return sourceItems().filter(x => inPool(x, state.home.pool) && (!sys.length || sys.includes(sysOf(x))));
}
function systemsList() {
  const set = new Set(sourceItems().map(sysOf));
  return [...set].sort((a, b) => (SYSTEM_ORDER.indexOf(a) + 1 || 99) - (SYSTEM_ORDER.indexOf(b) + 1 || 99) || a.localeCompare(b));
}
function overallStats() {
  let used = 0, latestCorrect = 0, missed = 0;
  const items = sourceItems();
  for (const x of items) {
    const p = state.progress.get(x.key);
    if (p && p.attempts) { used++; if (lastOk(p)) latestCorrect++; else missed++; }
  }
  return { total: items.length, used, latestCorrect, missed };
}

// ---------- Picking the next question ----------
// With spaced repetition on, missed questions come back sooner and well-known ones less often.
// Nothing about scheduling is ever shown.
function pickQuestion() {
  const run = state.run;
  const p = candidates();
  if (!p.length) return null;
  let pool = p.filter(x => !run.recent.includes(x.key));
  if (!pool.length) pool = p.filter(x => x.key !== run.recent[run.recent.length - 1]);
  if (!pool.length) pool = p;
  const rand = arr => arr[Math.floor(Math.random() * arr.length)];
  const unseen = pool.filter(x => !state.progress.has(x.key));
  if (!state.settings.sr) return unseen.length ? rand(unseen) : rand(pool);

  const now = Date.now();
  const ready = pool.filter(x => { const r = state.progress.get(x.key); return r && r.attempts && r.due <= now; });
  if (ready.length && (Math.random() < 0.35 || !unseen.length)) {
    ready.sort((a, b) => (state.progress.get(a.key).box || 0) - (state.progress.get(b.key).box || 0));
    return rand(ready.slice(0, Math.max(3, Math.ceil(ready.length / 3))));
  }
  if (unseen.length) return rand(unseen);
  const seen = pool.slice().sort((a, b) => ((state.progress.get(a.key) || {}).due || 0) - ((state.progress.get(b.key) || {}).due || 0));
  return rand(seen.slice(0, Math.min(10, seen.length)));
}

function recordAnswer(key, choice, ok) {
  const item = state.byKey.get(key);
  const now = Date.now();
  const r = state.progress.get(key) || {
    key, bankId: item.bank.id, questionId: item.q.id, attempts: 0, correct: 0, history: [], box: 0, due: 0,
  };
  r.attempts += 1;
  if (ok) r.correct += 1;
  r.history.push({ t: now, c: choice, ok });
  if (r.history.length > 20) r.history = r.history.slice(-20);
  r.box = ok ? Math.min(INTERVALS.length - 1, (r.attempts === 1 ? 1 : (r.box || 0) + 1)) : 0;
  r.due = now + INTERVALS[r.box];
  r.lastSeen = now;
  state.progress.set(key, r);
  idb.put('progress', r);
}

// ---------- Helpers ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rich = t => String(t ?? '').trim().split(/\n\s*\n/).filter(Boolean).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
const pct = (n, d) => (d ? Math.round((100 * n) / d) + '%' : '—');
const pad = (n, w) => String(Math.round(n)).padStart(w, '0');
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let toastTimer;
function toast(msg, ms = 2600) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}
function buzz(pattern) {
  if (state.settings.buzz && navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) { /* ignore */ } }
}
async function shareJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' });
  const file = new File([blob], filename, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const saveHome = () => setMeta('home', state.home);

// ---------- Flourishes ----------
const CONFETTI_COLORS = ['#8BE07A', '#B4C29A', '#F2C14E', '#5DA9E9', '#E8826B', '#C792EA'];
function confetti(fromEl) {
  if (reducedMotion() || !fromEl) return;
  const r = fromEl.getBoundingClientRect();
  const layer = document.createElement('div');
  layer.className = 'fx';
  document.body.appendChild(layer);
  const ox = r.left + r.width * 0.15, oy = r.top + r.height / 2;
  for (let i = 0; i < 26; i++) {
    const bit = document.createElement('i');
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const dist = 70 + Math.random() * 110;
    bit.style.left = `${ox}px`;
    bit.style.top = `${oy}px`;
    bit.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    bit.style.setProperty('--dx', `${Math.cos(angle) * dist + r.width * Math.random() * 0.5}px`);
    bit.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    bit.style.setProperty('--rot', `${(Math.random() - 0.5) * 720}deg`);
    bit.style.animationDelay = `${Math.random() * 60}ms`;
    if (i % 3 === 0) bit.style.borderRadius = '50%';
    layer.appendChild(bit);
  }
  setTimeout(() => layer.remove(), 1300);
}
function flashLed(kind) {
  const led = document.getElementById('led');
  if (!led) return;
  led.classList.remove('flash', 'miss');
  void led.offsetWidth; // restart the animation
  led.classList.add(kind);
}
function floatThanks(fromEl) {
  if (!fromEl) return;
  const r = fromEl.getBoundingClientRect();
  const t = document.createElement('span');
  t.className = 'thanks';
  t.textContent = 'Thanks!';
  t.style.left = `${r.left + r.width / 2}px`;
  t.style.top = `${r.top}px`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1200);
}

// ---------- Views ----------
function chip(action, v, label, count, on) {
  return `<button class="chip ${on ? 'on' : ''}" data-action="${action}" data-v="${esc(v)}">${esc(label)}${count != null ? `<span class="ct">${count}</span>` : ''}</button>`;
}

function viewHome() {
  const st = overallStats();
  const h = state.home;
  const items = sourceItems();
  if (!POOLS.some(([k]) => k === h.pool)) h.pool = 'unused';
  const poolCounts = Object.fromEntries(POOLS.map(([k]) => [k, items.filter(x => inPool(x, k)).length]));
  const sysChips = systemsList().map(sys => chip('sys', sys, sys, items.filter(x => sysOf(x) === sys && inPool(x, h.pool)).length, h.systems.includes(sys))).join('');
  const sourceChips = state.banks.map(b => chip('src', b.id, b.title || b.id, (b.questions || []).length, b.enabled !== false)).join('');
  const avail = candidates().length;

  return `
  <header class="top">
    <h1 class="logo">Beeper</h1>
    <div class="top-right">
      <button class="link-btn" data-action="go" data-view="stats">Stats</button>
      <button class="link-btn" data-action="go" data-view="settings">Settings</button>
    </div>
  </header>

  <section class="card">
    <div class="stat-grid">
      <div><div class="num">${st.used}/${st.total}</div><div class="lab">Used</div></div>
      <div><div class="num">${pct(st.latestCorrect, st.used)}</div><div class="lab">Correct</div></div>
      <div><div class="num">${st.missed}</div><div class="lab">Incorrect</div></div>
    </div>
  </section>

  ${usingSample() ? '<section class="card"><p class="small muted">You\u2019re seeing the built-in sample questions. Add your own bank files in Settings and the samples will be hidden.</p></section>' : ''}
  ${!isStandalone() && !state.hints.installDismissed ? `
  <section class="card hint"><span class="small">Add Beeper to your home screen. It runs offline there and your progress is less likely to be cleared.</span><button class="link-btn" data-action="dismissHint">Got it</button></section>` : ''}

  <section class="card">
    <h2>Questions</h2>
    <div class="chips">${POOLS.map(([k, label]) => chip('pool', k, label, poolCounts[k], h.pool === k)).join('')}</div>

    ${state.banks.length > 1 ? `
    <h2>Sources</h2>
    <div class="chips">${chip('src', '*', 'All sources', null, state.banks.every(b => b.enabled !== false))}${sourceChips}</div>` : ''}

    <h2>Systems</h2>
    <div class="chips">${chip('sys', '*', 'All systems', null, !h.systems.length)}${sysChips}</div>

    <button class="btn primary block" data-action="start" ${avail ? '' : 'disabled'}>${avail ? `Start (${avail} question${avail === 1 ? '' : 's'})` : 'No questions match'}</button>
  </section>`;
}

function viewQuiz() {
  const run = state.run;
  const top = `
  <header class="top">
    <button class="link-btn" data-action="home">‹ Home</button>
    <span class="center small muted">${run.answered ? `${run.correct}/${run.answered} correct` : ''}</span>
    <span style="width:64px"></span>
  </header>`;
  if (!run.key) {
    return `${top}
    <section class="card empty">
      <h3>No more questions with these filters</h3>
      <p class="small muted">Pick a different set on the home screen to keep going.</p>
      <button class="btn primary block" data-action="home">Back to home</button>
    </section>`;
  }
  const { q, bank } = state.byKey.get(run.key);
  const chosen = run.chosen;
  const reveal = !!chosen;

  const opts = (q.options || []).map(o => {
    let cls = 'opt';
    if (reveal) {
      if (o.label === q.answer) cls += ' correct';
      else if (chosen === o.label) cls += ' wrong';
      else cls += ' dim';
    }
    const exp = reveal && o.explanation ? `<div class="opt-exp">${esc(o.explanation)}</div>` : '';
    return `<button class="${cls}" data-action="choose" data-label="${esc(o.label)}" ${reveal ? 'disabled' : ''}>
        <span class="lbl">${esc(o.label)}</span><span class="txt">${esc(o.text)}</span>
      </button>${exp}`;
  }).join('');

  let after = '';
  if (reveal) {
    const correct = (q.options || []).find(o => o.label === q.answer);
    const correctText = correct ? `${esc(q.answer)}. ${esc(correct.text)}` : esc(q.answer);
    const verdict = chosen === q.answer
      ? '<div class="verdict ok">Correct</div>'
      : `<div class="verdict bad">Incorrect. Answer: ${correctText}</div>`;
    const src = q.source || {};
    const srcText = typeof src === 'string' ? src : [src.book || bank.title, src.page ? `p. ${src.page}` : ''].filter(Boolean).join(', ');
    const refs = (q.references || []).filter(r => /^https?:\/\//.test(r.url || ''));
    const fb = state.feedback.get(run.key);
    const types = fb ? fb.types : [];
    after = `
    ${verdict}
    <section class="card exp">
      <h3>Explanation</h3>
      ${rich(q.explanation) || '<p class="muted">No explanation provided.</p>'}
      <div class="src">${esc(q.system || '')}${q.topic ? `, ${esc(q.topic)}` : ''}${srcText ? `<br>Source: ${esc(srcText)}` : ''}</div>
      ${refs.length ? `<h3 style="margin-top:14px">Outside sources</h3><ul class="refs">${refs.map(r => `<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title || r.url)}</a>${r.supports ? `<br><span class="small muted">${esc(r.supports)}</span>` : ''}</li>`).join('')}</ul>` : ''}
    </section>
    <section class="card">
      <div class="fb-buttons">
        ${FEEDBACK_TYPES.map(([t, label]) => `<button class="fb ${t} ${types.includes(t) ? 'on' : ''}" data-action="feedback" data-v="${t}" aria-pressed="${types.includes(t)}">${esc(label)}</button>`).join('')}
      </div>
      <label class="field"><span class="small muted">Optional feedback${FEEDBACK_ENDPOINT ? ', sent to the question bank maintainer' : ''}</span>
        <textarea id="note" placeholder="Anything to add?">${esc(fb ? fb.note : '')}</textarea>
        <div class="note-count small muted" id="noteCount">${countWords(fb ? fb.note : '')}/${NOTE_MAX_WORDS} words</div>
      </label>
    </section>`;
  }

  return `
  ${top}
  <section class="pager" aria-label="Question">
    <div class="pager-top"><span class="brand">Beeper</span><span id="led" class="led on ${run.fresh ? 'flash' : ''}" aria-hidden="true"></span></div>
    <div class="lcd screen">
      <div class="lcd-head"><span>PG ${pad(run.answered + (reveal ? 0 : 1), 2)}</span><span>${reveal ? esc((q.system || '').toUpperCase()) : ''}</span></div>
      <div class="lcd-text">
        ${rich(q.stem)}
        ${q.lead ? `<p class="lead">${esc(q.lead)}</p>` : ''}
      </div>
    </div>
  </section>

  <div class="opts">${opts}</div>
  ${after}
  ${reveal ? '<nav class="bar"><button class="btn primary" data-action="next">Next question</button></nav>' : ''}`;
}

function viewStats() {
  const st = overallStats();
  const items = sourceItems();
  const rows = systemsList().map(sys => {
    const qs = items.filter(x => sysOf(x) === sys);
    let used = 0, ok = 0;
    for (const x of qs) { const p = state.progress.get(x.key); if (p && p.attempts) { used++; if (lastOk(p)) ok++; } }
    return { sys, total: qs.length, used, ok };
  });
  rows.sort((a, b) => {
    if (!a.used !== !b.used) return a.used ? -1 : 1;
    return (a.used ? a.ok / a.used : 0) - (b.used ? b.ok / b.used : 0);
  });
  return `
  <header class="top">
    <button class="link-btn" data-action="go" data-view="home">‹ Home</button>
    <span class="center">Performance</span><span style="width:64px"></span>
  </header>
  <section class="card">
    <div class="stat-grid">
      <div><div class="num">${pct(st.used, st.total)}</div><div class="lab">Bank used</div></div>
      <div><div class="num">${pct(st.latestCorrect, st.used)}</div><div class="lab">Correct</div></div>
      <div><div class="num">${st.missed}</div><div class="lab">Incorrect</div></div>
    </div>
    <p class="small muted" style="margin-top:12px">\u201cCorrect\u201d uses your most recent attempt at each question.</p>
  </section>
  <section class="card">
    <h2>By system (weakest first)</h2>
    <table>
      <thead><tr><th>System</th><th>Used</th><th>Correct</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${esc(r.sys)}</td><td>${r.used}/${r.total}</td><td>${pct(r.ok, r.used)}</td></tr>`).join('')}</tbody>
    </table>
  </section>`;
}

function viewSettings() {
  const fbAll = [...state.feedback.values()];
  const counts = Object.fromEntries(FEEDBACK_TYPES.map(([t]) => [t, fbAll.filter(f => f.types.includes(t)).length]));
  const notesOnly = fbAll.filter(f => !f.types.length && f.note).length;
  return `
  <header class="top">
    <button class="link-btn" data-action="go" data-view="home">‹ Home</button>
    <span class="center">Settings</span><span style="width:64px"></span>
  </header>

  <section class="card">
    <h2>Question banks</h2>
    ${state.banks.length ? state.banks.map(b => `
      <div class="kv"><span><b>${esc(b.title || b.id)}</b><br><span class="small muted">${b.remote ? 'Shared, updates automatically' : 'On this phone'}, ${(b.questions || []).length} questions${b.version ? `, updated ${esc(b.version)}` : ''}</span></span>
      ${b.remote ? '' : `<button class="link-btn danger-text" data-action="removeBank" data-v="${esc(b.id)}">Remove</button>`}</div>`).join('')
      : '<p class="small muted">No banks yet, so the sample questions are shown.</p>'}
    <div class="btn-col" style="margin-top:14px">
      <button class="btn" data-action="syncNow">Check for updates</button>
      <label class="btn">Add question bank files<input type="file" accept=".json,application/json" multiple hidden data-file="bank"></label>
    </div>
    <p class="small muted" style="margin-top:10px">Shared banks download and update on their own whenever the app opens online. To skip one, deselect it under Sources on the home screen. Your progress is always kept, including when a bank is updated.${state.lastSync ? `<br>Last checked: ${esc(new Date(state.lastSync).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' }))}` : ''}</p>
  </section>

  <section class="card">
    <h2>Study</h2>
    <label class="switch"><span><b>Spaced repetition</b><br><span class="small muted">Questions you miss come back sooner, and ones you know well show up less often. When off, questions are random, unseen ones first.</span></span><input type="checkbox" data-change="sr" ${state.settings.sr ? 'checked' : ''}></label>
    <label class="switch"><span><b>Vibrate on answer</b><br><span class="small muted">Android only.</span></span><input type="checkbox" data-change="buzz" ${state.settings.buzz ? 'checked' : ''}></label>
  </section>

  <section class="card">
    <h2>Question feedback</h2>
    ${FEEDBACK_ENDPOINT ? `<p class="small muted">Feedback is sent to the question bank maintainer automatically, including feedback given offline once you\u2019re back online. Waiting to send: <b id="pending">${state.outbox.size}</b></p>
    <label class="field"><b>Your name</b> <span class="small muted">(optional, sent with your feedback)</span>
      <input type="text" data-input="name" value="${esc(state.settings.name)}" maxlength="60" autocomplete="name">
    </label>` : ''}
    ${fbAll.length ? FEEDBACK_TYPES.map(([t, label]) => `<div class="kv"><span>${esc(label)}</span><span>${counts[t]}</span></div>`).join('')
      + (notesOnly ? `<div class="kv"><span>Comment only</span><span>${notesOnly}</span></div>` : '')
      : '<p class="small muted">No feedback yet. After answering a question you can rate it or leave a comment.</p>'}
    <div class="btn-col" style="margin-top:14px">
      <button class="btn" data-action="exportFeedback" ${fbAll.length ? '' : 'disabled'}>Export feedback file</button>
      <button class="btn danger" data-action="clearFeedback" ${fbAll.length ? '' : 'disabled'}>Clear feedback on this phone</button>
    </div>
  </section>

  <section class="card">
    <h2>Progress backup</h2>
    <div class="btn-col">
      <button class="btn" data-action="exportProgress">Export progress</button>
      <label class="btn">Import progress<input type="file" accept=".json,application/json" hidden data-file="progress"></label>
      <button class="btn danger" data-action="resetProgress">Reset all progress</button>
    </div>
  </section>

  <section class="card">
    <h2>Storage</h2>
    <div class="kv"><span>Persistent storage</span><span id="persist">…</span></div>
    <div class="kv"><span>App version</span><span>${APP_VERSION}</span></div>
  </section>`;
}

function render() {
  const app = document.getElementById('app');
  const views = { home: viewHome, quiz: viewQuiz, stats: viewStats, settings: viewSettings };
  if (state.view === 'quiz' && !state.run) state.view = 'home';
  app.innerHTML = (views[state.view] || viewHome)();
  if (state.view === 'settings') fillPersist();
}
async function fillPersist() {
  const el = document.getElementById('persist');
  if (!el) return;
  try {
    const p = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : null;
    el.textContent = p == null ? 'Unknown' : p ? 'On' : 'Not granted';
  } catch (e) { el.textContent = 'Unknown'; }
}
function go(view) {
  state.view = view;
  render();
  window.scrollTo(0, 0);
}

// ---------- Questions ----------
function start() {
  state.run = { answered: 0, correct: 0, recent: [], key: null, chosen: null, fresh: false };
  nextQuestion();
}
function nextQuestion() {
  flushOutbox();
  const run = state.run;
  const item = pickQuestion();
  run.key = item ? item.key : null;
  run.chosen = null;
  run.fresh = true;
  if (item) {
    run.recent.push(item.key);
    const cap = Math.min(15, Math.max(1, Math.floor(candidates().length / 2)));
    if (run.recent.length > cap) run.recent = run.recent.slice(-cap);
  }
  go('quiz');
  run.fresh = false;
}
function choose(label) {
  const run = state.run;
  if (!run || !run.key || run.chosen) return;
  const ok = label === state.byKey.get(run.key).q.answer;
  run.chosen = label;
  run.answered += 1;
  if (ok) run.correct += 1;
  recordAnswer(run.key, label, ok);
  buzz(ok ? 25 : [70, 50, 70]);
  render();
  if (ok) confetti(document.querySelector('.opt.correct'));
  flashLed(ok ? 'flash' : 'miss');
}

// ---------- Feedback ----------
function blankFeedback(key) {
  const [bankId, ...rest] = key.split('::');
  return { key, bankId, questionId: rest.join('::'), types: [], note: '', updatedAt: 0 };
}
async function storeFeedback(key, fb) {
  fb.updatedAt = Date.now();
  if (!fb.types.length && !fb.note) { state.feedback.delete(key); await idb.del('feedback', key); }
  else { state.feedback.set(key, fb); await idb.put('feedback', fb); }
  queueSend(key);
}
async function pickFeedback(el) {
  const key = state.run.key;
  const type = el.dataset.v;
  const fb = state.feedback.get(key) || blankFeedback(key);
  const wasOn = fb.types.includes(type);
  fb.types = wasOn ? [] : [type]; // one rating at a time; tap again to undo
  document.querySelectorAll('[data-action="feedback"]').forEach(b => {
    const on = fb.types.includes(b.dataset.v);
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on);
  });
  if (!wasOn) floatThanks(el);
  await storeFeedback(key, fb);
}
let noteTimer, noteDirty = false;
function countWords(s) { return (String(s || '').match(/\S+/g) || []).length; }
// Keep the text exactly as typed (any characters, line breaks, emoji); only stop after the word limit.
function limitWords(s, max) {
  const m = String(s || '').match(new RegExp('^\\s*(?:\\S+\\s*){0,' + max + '}'));
  return m ? m[0] : '';
}
function onNoteInput(el) {
  if (countWords(el.value) > NOTE_MAX_WORDS) {
    el.value = limitWords(el.value, NOTE_MAX_WORDS).replace(/\s+$/, '');
    toast(`Comments are limited to ${NOTE_MAX_WORDS} words`);
  }
  const n = countWords(el.value);
  const c = document.getElementById('noteCount');
  if (c) { c.textContent = `${n}/${NOTE_MAX_WORDS} words`; c.classList.toggle('at-limit', n >= NOTE_MAX_WORDS); }
  saveNote(el.value);
}
function saveNote(value) {
  const key = state.run.key;
  const fb = state.feedback.get(key) || blankFeedback(key);
  fb.note = value;
  state.feedback.set(key, fb);
  noteDirty = true;
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => storeFeedback(key, fb), 600);
}
function noteDone(el) {
  if (noteDirty && el.value.trim()) floatThanks(el);
  noteDirty = false;
}
function feedbackItem(fb) {
  const labels = Object.fromEntries(FEEDBACK_TYPES);
  const item = state.byKey.get(fb.key);
  const bank = item ? item.bank : state.banks.find(b => b.id === fb.bankId);
  const p = state.progress.get(fb.key);
  const last = p && p.history.length ? p.history[p.history.length - 1] : null;
  return {
    bank_id: fb.bankId,
    bank_title: bank ? bank.title : null,
    bank_version: bank ? bank.version : null,
    question_id: fb.questionId,
    feedback: fb.types,
    feedback_labels: fb.types.map(t => labels[t] || t),
    note: fb.note || '',
    feedback_at: new Date(fb.updatedAt || Date.now()).toISOString(),
    my_performance: p ? { attempts: p.attempts, correct: p.correct, last_choice: last ? last.c : null, last_correct: last ? last.ok : null } : null,
    question: item ? item.q : null,
  };
}

// Sending to the maintainer's Google Sheet
let sendTimer;
function queueSend(key) {
  if (!FEEDBACK_ENDPOINT) return;
  const fb = state.feedback.get(key) || { ...blankFeedback(key), updatedAt: Date.now() };
  state.outbox.set(key, { ...feedbackItem(fb), client_id: state.clientId, name: state.settings.name || '', app_version: APP_VERSION });
  setMeta('outbox', [...state.outbox.entries()]);
  clearTimeout(sendTimer);
  sendTimer = setTimeout(flushOutbox, 4000);
}
let flushing = false;
async function flushOutbox() {
  clearTimeout(sendTimer);
  if (!FEEDBACK_ENDPOINT || flushing || !state.outbox.size || !navigator.onLine) return;
  flushing = true;
  try {
    for (const [key, payload] of [...state.outbox.entries()]) {
      try {
        await fetch(FEEDBACK_ENDPOINT, {
          method: 'POST', mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });
        if (state.outbox.get(key) === payload) state.outbox.delete(key);
      } catch (e) { break; }
    }
    await setMeta('outbox', [...state.outbox.entries()]);
  } finally { flushing = false; }
  const pend = document.getElementById('pending');
  if (pend) pend.textContent = state.outbox.size;
}
window.addEventListener('online', () => { flushOutbox(); syncSharedBanks(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushOutbox();
  else maybeSync();
});

async function exportFeedback() {
  const labels = Object.fromEntries(FEEDBACK_TYPES);
  const items = [...state.feedback.values()].map(feedbackItem);
  const summary = { questions: items.length };
  for (const [t] of FEEDBACK_TYPES) summary[t] = items.filter(i => i.feedback.includes(t)).length;
  await shareJson(`beeper-feedback-${new Date().toISOString().slice(0, 10)}.json`, {
    type: 'feedback', app: 'pager', exportedAt: new Date().toISOString(), feedback_types: labels, summary, items,
  });
}

// ---------- Banks + backup ----------
function normalizeBank(data, filename) {
  const bank = Array.isArray(data) ? { questions: data } : data;
  if (!bank || !Array.isArray(bank.questions)) throw new Error('no "questions" list');
  if (bank.type === 'feedback' || bank.type === 'progress') throw new Error('this is an export file, not a question bank');
  const id = String(bank.id || filename.replace(/\.json$/i, '')).trim();
  const questions = bank.questions.filter(q => q && q.id && q.stem && Array.isArray(q.options) && q.answer);
  if (!questions.length) throw new Error('no valid questions');
  return {
    id, title: bank.title || id, version: bank.version || '',
    questions: questions.map(q => { const { source_quote, outside_facts, ...rest } = q; return rest; }),
    enabled: true, addedAt: Date.now(),
  };
}
let syncing = false, syncPending = false;
async function syncSharedBanks({ manual = false } = {}) {
  if (location.protocol === 'file:') return;
  if (state.view === 'quiz') { syncPending = true; return; } // never swap questions mid-session
  if (syncing) return;
  if (!navigator.onLine) { if (manual) toast('You\u2019re offline. Shared banks will update when you\u2019re back online.'); return; }
  syncing = true;
  const changes = [];
  try {
    const res = await fetch(SHARED_INDEX, { cache: 'no-cache' });
    if (!res.ok) { if (manual) toast('No shared banks are published yet.'); return; }
    const index = await res.json();
    const files = (index.banks || []).map(x => (typeof x === 'string' ? x : x && x.file)).filter(Boolean);
    for (const file of files) {
      try {
        const r = await fetch(SHARED_DIR + file, { cache: 'no-cache' });
        if (!r.ok) continue;
        const bank = normalizeBank(await r.json(), file);
        const old = state.banks.find(b => b.id === bank.id);
        if (old && old.remote && old.version === bank.version && (old.questions || []).length === bank.questions.length) continue;
        bank.remote = true;
        bank.file = file;
        if (old) { bank.enabled = old.enabled; bank.addedAt = old.addedAt; }
        await idb.put('banks', bank);
        state.banks = state.banks.filter(b => b.id !== bank.id).concat(bank).sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
        changes.push(old ? `${bank.title}: ${(old.questions || []).length} \u2192 ${bank.questions.length}` : `${bank.title}: ${bank.questions.length} new`);
      } catch (e) { /* skip a bad file, keep the rest */ }
    }
    // A shared bank removed from the index is retired; progress stays saved in case it returns.
    const retired = state.banks.filter(b => b.remote && !files.includes(b.file));
    for (const b of retired) await idb.del('banks', b.id);
    if (retired.length) state.banks = state.banks.filter(b => !retired.includes(b));
    state.lastSync = Date.now();
    setMeta('lastSync', state.lastSync);
    if (changes.length || retired.length) {
      rebuildIndex();
      render();
      toast(changes.length ? `Updated ${changes.join(', ')}` : 'Shared banks updated', 4000);
    } else if (manual) {
      toast('Shared banks are up to date');
      render();
    }
  } catch (e) {
    if (manual) toast('Couldn\u2019t reach the shared banks. Try again later.');
  } finally {
    syncing = false;
  }
}
function maybeSync() {
  if (!state.lastSync || Date.now() - state.lastSync > SYNC_EVERY_MS) syncSharedBanks();
}

async function addBanks(files) {
  for (const f of files) {
    try {
      const bank = normalizeBank(JSON.parse(await f.text()), f.name);
      const old = state.banks.find(b => b.id === bank.id);
      if (old) { bank.enabled = old.enabled; bank.addedAt = old.addedAt; }
      await idb.put('banks', bank);
      state.banks = state.banks.filter(b => b.id !== bank.id).concat(bank).sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
      toast(`${old ? 'Updated' : 'Added'} ${bank.title}: ${bank.questions.length} questions`);
    } catch (e) {
      toast(`Couldn\u2019t add ${f.name}: ${e.message}`, 4000);
    }
  }
  rebuildIndex();
  render();
}
async function exportProgress() {
  await shareJson(`beeper-progress-${new Date().toISOString().slice(0, 10)}.json`, {
    app: 'pager', type: 'progress', format: 3, exportedAt: new Date().toISOString(),
    banks: state.banks.map(b => ({ id: b.id, title: b.title, version: b.version })),
    progress: [...state.progress.values()], feedback: [...state.feedback.values()],
  });
}
async function importProgress(data) {
  if (data.type !== 'progress' || !Array.isArray(data.progress)) throw new Error('not a progress backup');
  let n = 0;
  for (const raw of data.progress) {
    const key = raw.key || (raw.bankId && raw.questionId ? keyOf(raw.bankId, raw.questionId) : null);
    if (!key) continue;
    const [bankId, ...rest] = key.split('::');
    const rec = {
      key, bankId: raw.bankId || bankId, questionId: raw.questionId || rest.join('::'),
      attempts: raw.attempts || 0, correct: raw.correct || 0,
      history: Array.isArray(raw.history) ? raw.history.slice(-20) : [],
      box: typeof raw.box === 'number' ? raw.box : 0, due: typeof raw.due === 'number' ? raw.due : 0, lastSeen: raw.lastSeen || 0,
    };
    const cur = state.progress.get(key);
    if (!cur || rec.attempts >= cur.attempts) { state.progress.set(key, rec); await idb.put('progress', rec); n++; }
  }
  for (const fb of data.feedback || []) {
    if (!fb.key || !Array.isArray(fb.types)) continue;
    state.feedback.set(fb.key, fb);
    await idb.put('feedback', fb);
  }
  render();
  toast(`Imported progress for ${n} questions`);
}

// ---------- Actions ----------
const actions = {
  go: el => go(el.dataset.view),
  home: () => { flushOutbox(); state.run = null; go('home'); if (syncPending) { syncPending = false; syncSharedBanks(); } },
  syncNow: () => syncSharedBanks({ manual: true }),
  dismissHint: () => { state.hints.installDismissed = true; setMeta('hints', state.hints); render(); },
  pool: el => { state.home.pool = el.dataset.v; saveHome(); render(); },
  sys: el => {
    const v = el.dataset.v;
    const sel = state.home.systems;
    state.home.systems = v === '*' ? [] : sel.includes(v) ? sel.filter(x => x !== v) : [...sel, v];
    saveHome(); render();
  },
  src: async el => {
    const v = el.dataset.v;
    if (v === '*') state.banks.forEach(b => { b.enabled = true; });
    else {
      const b = state.banks.find(x => x.id === v);
      if (b) {
        const others = state.banks.filter(x => x !== b && x.enabled !== false).length;
        if (b.enabled !== false && !others) return toast('Keep at least one source selected');
        b.enabled = b.enabled === false;
      }
    }
    for (const b of state.banks) await idb.put('banks', b);
    render();
  },
  start,
  next: nextQuestion,
  choose: el => choose(el.dataset.label),
  feedback: el => pickFeedback(el),
  removeBank: async el => {
    const b = state.banks.find(x => x.id === el.dataset.v);
    if (!b || !confirm(`Remove \u201c${b.title}\u201d from this phone? Your progress on it is kept and comes back if you add the file again.`)) return;
    await idb.del('banks', b.id);
    state.banks = state.banks.filter(x => x.id !== b.id);
    rebuildIndex(); render();
    toast(`Removed ${b.title}`);
  },
  exportFeedback,
  clearFeedback: async () => {
    if (!confirm('Clear all question feedback on this phone? Export it first if you still need it.')) return;
    await idb.clear('feedback'); state.feedback.clear(); render();
  },
  exportProgress,
  resetProgress: async () => {
    if (!confirm('Erase all answer history on this phone?')) return;
    if (!confirm('This cannot be undone. Consider exporting first. Erase anyway?')) return;
    await idb.clear('progress'); state.progress.clear();
    render(); toast('Progress reset');
  },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.action];
  if (fn) fn(el);
});
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.dataset.file) {
    const files = [...(el.files || [])];
    el.value = '';
    if (!files.length) return;
    if (el.dataset.file === 'bank') return addBanks(files);
    try { await importProgress(JSON.parse(await files[0].text())); }
    catch (err) { toast(`Couldn\u2019t import: ${err.message}`, 4000); }
    return;
  }
  const c = el.dataset.change;
  if (c === 'sr' || c === 'buzz') { state.settings[c] = el.checked; setMeta('settings', state.settings); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'note') onNoteInput(e.target);
  else if (e.target.dataset.input === 'name') { state.settings.name = e.target.value.trim().slice(0, 60); setMeta('settings', state.settings); }
});
document.addEventListener('focusout', e => { if (e.target.id === 'note') noteDone(e.target); });
document.addEventListener('keydown', e => {
  if (state.view !== 'quiz' || !state.run || /TEXTAREA|INPUT/.test(e.target.tagName)) return;
  const map = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E' };
  const label = map[e.key] || (/^[a-e]$/i.test(e.key) ? e.key.toUpperCase() : null);
  if (label && !state.run.chosen) choose(label);
  else if ((e.key === 'Enter' || e.key === 'ArrowRight') && state.run.chosen && e.target.tagName !== 'BUTTON') nextQuestion();
});

// ---------- Boot ----------
async function boot() {
  try {
    const [banks, progress, feedback] = await Promise.all([idb.all('banks'), idb.all('progress'), idb.all('feedback')]);
    state.banks = banks.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
    state.progress = new Map(progress.map(p => [p.key, p]));
    state.feedback = new Map(feedback.map(f => [f.key, f]));
    const settings = await getMeta('settings', {});
    state.settings = { sr: settings.sr !== false, buzz: settings.buzz !== false, name: settings.name || '' };
    const home = await getMeta('home', {});
    state.home = { pool: home.pool || 'unused', systems: Array.isArray(home.systems) ? home.systems : [] };
    state.hints = { ...state.hints, ...(await getMeta('hints', {})) };
    state.outbox = new Map(await getMeta('outbox', []));
    state.lastSync = await getMeta('lastSync', 0);
    state.clientId = await getMeta('clientId', '');
    if (!state.clientId) {
      state.clientId = crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now();
      await setMeta('clientId', state.clientId);
    }
  } catch (e) {
    toast('Storage is unavailable, so progress won\u2019t be saved.');
  }
  rebuildIndex();
  go('home');
  flushOutbox();
  syncSharedBanks();
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) { /* ignore */ }
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
