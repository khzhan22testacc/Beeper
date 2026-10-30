'use strict';

const APP_VERSION = '3.0.0';

// Paste your Google Apps Script web app URL here (ends in /exec). Leave empty to turn off sending.
const FEEDBACK_ENDPOINT = '';

// Spaced repetition intervals by box (box 0 = just missed)
const MIN = 60 * 1000, DAY = 24 * 60 * MIN;
const INTERVALS = [10 * MIN, 1 * DAY, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY];

const FEEDBACK_TYPES = [
  ['incorrect', 'Incorrect question'],
  ['not_relevant', 'Not clinically relevant'],
  ['too_long', 'Too long'],
  ['other', 'Other'],
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

const SECONDS_PER_Q = 90;
const POOLS = [
  ['unused', 'Unused'],
  ['all', 'All'],
  ['incorrect', 'Incorrect'],
  ['flagged', 'Flagged'],
  ['due', 'Due'],
];

// ---------- State ----------
const state = {
  view: 'home',
  banks: [],
  byKey: new Map(),
  progress: new Map(),
  feedback: new Map(),
  settings: { sr: true, buzz: true, name: '' },
  home: { mode: 'tutor', pool: 'unused', systems: [], count: 10 },
  hints: { installDismissed: false },
  clientId: '',
  outbox: new Map(),
  session: null,
  timerId: null,
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

function inPool(item, pool, now) {
  const p = state.progress.get(item.key);
  switch (pool) {
    case 'unused': return !p || !p.attempts;
    case 'incorrect': return !!p && p.attempts > 0 && lastOk(p) === false;
    case 'flagged': return state.feedback.has(item.key);
    case 'due': return state.settings.sr && !!p && p.attempts > 0 && p.due <= now;
    default: return true;
  }
}
function lastOk(p) { return p && p.history && p.history.length ? p.history[p.history.length - 1].ok : null; }
function pools() { return POOLS.filter(([k]) => k !== 'due' || state.settings.sr); }
function candidates() {
  const now = Date.now();
  const sys = state.home.systems;
  return sourceItems().filter(x => inPool(x, state.home.pool, now) && (!sys.length || sys.includes(sysOf(x))));
}
function systemsList() {
  const set = new Set(sourceItems().map(sysOf));
  return [...set].sort((a, b) => (SYSTEM_ORDER.indexOf(a) + 1 || 99) - (SYSTEM_ORDER.indexOf(b) + 1 || 99) || a.localeCompare(b));
}
function overallStats() {
  const now = Date.now();
  let used = 0, latestCorrect = 0, due = 0, flagged = 0;
  const items = sourceItems();
  for (const x of items) {
    const p = state.progress.get(x.key);
    if (state.feedback.has(x.key)) flagged++;
    if (p && p.attempts) {
      used++;
      if (lastOk(p)) latestCorrect++;
      if (p.due <= now) due++;
    }
  }
  return { total: items.length, used, latestCorrect, due, flagged };
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
const mmss = sec => { sec = Math.max(0, Math.round(sec)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
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
const saveSession = () => setMeta('session', state.session);

// ---------- Navigation + timer ----------
function go(view, { keepScroll = false } = {}) {
  stopTimer();
  state.view = view;
  render();
  if (!keepScroll) window.scrollTo(0, 0);
  const s = state.session;
  if (view === 'quiz' && s && s.mode === 'timed' && !s.finished) startTimer();
}
function startTimer() {
  stopTimer();
  let ticks = 0;
  state.timerId = setInterval(() => {
    const s = state.session;
    if (!s || s.finished) return stopTimer();
    s.remaining -= 1;
    ticks++;
    const el = document.getElementById('timer');
    if (el) { el.textContent = mmss(s.remaining); el.classList.toggle('low', s.remaining <= 60); }
    if (ticks % 5 === 0) saveSession();
    if (s.remaining <= 0) { stopTimer(); toast('Time is up'); finishBlock(); }
  }, 1000);
}
function stopTimer() { if (state.timerId) clearInterval(state.timerId); state.timerId = null; }

// ---------- Views ----------
function chip(action, v, label, count, on) {
  return `<button class="chip ${on ? 'on' : ''}" data-action="${action}" data-v="${esc(v)}">${esc(label)}${count != null ? `<span class="ct">${count}</span>` : ''}</button>`;
}

function viewHome() {
  const st = overallStats();
  const h = state.home;
  const s = state.session;
  const now = Date.now();
  const items = sourceItems();
  if (!pools().some(([k]) => k === h.pool)) h.pool = 'unused';

  const poolCounts = Object.fromEntries(pools().map(([k]) => [k, items.filter(x => inPool(x, k, now)).length]));
  const sysChips = systemsList().map(sys => {
    const n = items.filter(x => sysOf(x) === sys && inPool(x, h.pool, now)).length;
    return chip('sys', sys, sys, n, h.systems.includes(sys));
  }).join('');
  const sourceChips = state.banks.map(b => chip('src', b.id, b.title || b.id, (b.questions || []).length, b.enabled !== false)).join('');
  const avail = candidates().length;
  const count = Math.min(h.count, Math.max(avail, 1));

  let sessionCard = '';
  if (s && !s.finished) {
    const answered = Object.keys(s.answers).length;
    sessionCard = `
    <section class="card">
      <h2>Block in progress</h2>
      <p>${s.mode === 'timed' ? 'Timed' : 'Tutor'}, ${answered} of ${s.keys.length} answered${s.mode === 'timed' ? `, ${mmss(s.remaining)} left` : ''}</p>
      <div class="btn-row"><button class="btn" data-action="discard">Discard</button><button class="btn primary" data-action="resume">Resume</button></div>
    </section>`;
  } else if (s && s.finished) {
    sessionCard = `<section class="card"><div class="btn-row"><button class="btn" data-action="go" data-view="results">Review last block</button></div></section>`;
  }

  return `
  <header class="top">
    <h1 class="logo">Pager</h1>
    <div class="top-right">
      <button class="link-btn" data-action="go" data-view="stats">Stats</button>
      <button class="link-btn" data-action="go" data-view="settings">Settings</button>
    </div>
  </header>

  <section class="card">
    <div class="stat-grid">
      <div><div class="num">${st.used}/${st.total}</div><div class="lab">Used</div></div>
      <div><div class="num">${pct(st.latestCorrect, st.used)}</div><div class="lab">Correct</div></div>
      ${state.settings.sr
        ? `<div><div class="num">${st.due}</div><div class="lab">Due</div></div>`
        : `<div><div class="num">${st.flagged}</div><div class="lab">Flagged</div></div>`}
    </div>
  </section>

  ${sessionCard}
  ${usingSample() ? '<section class="card"><p class="small muted">You\u2019re seeing the built-in sample questions. Add your own bank files in Settings and the samples will be hidden.</p></section>' : ''}
  ${!isStandalone() && !state.hints.installDismissed ? `
  <section class="card hint"><span class="small">Add Pager to your home screen. It runs offline there and your progress is less likely to be cleared.</span><button class="link-btn" data-action="dismissHint">Got it</button></section>` : ''}

  <section class="card">
    <h2>Mode</h2>
    <div class="seg">
      <button class="${h.mode === 'tutor' ? 'on' : ''}" data-action="mode" data-v="tutor">Tutor</button>
      <button class="${h.mode === 'timed' ? 'on' : ''}" data-action="mode" data-v="timed">Timed</button>
    </div>
    <p class="small muted" style="margin-top:8px">${h.mode === 'tutor'
      ? 'Tap an answer to lock it in and see the explanation.'
      : `${SECONDS_PER_Q} seconds per question, explanations at the end.`}</p>

    <h2>Questions</h2>
    <div class="chips">${pools().map(([k, label]) => chip('pool', k, label, poolCounts[k], h.pool === k)).join('')}</div>

    ${state.banks.length > 1 ? `
    <h2>Sources</h2>
    <div class="chips">${chip('src', '*', 'All sources', null, state.banks.every(b => b.enabled !== false))}${sourceChips}</div>` : ''}

    <h2>Systems</h2>
    <div class="chips">${chip('sys', '*', 'All systems', null, !h.systems.length)}${sysChips}</div>

    <h2>Number of questions</h2>
    <div class="stepper">
      <button data-action="count" data-d="-1" aria-label="Fewer">−</button>
      <span class="val">${avail ? count : 0}</span>
      <button data-action="count" data-d="1" aria-label="More">+</button>
      <span class="small muted">of ${avail} available</span>
    </div>

    <button class="btn primary block" data-action="start" ${avail ? '' : 'disabled'}>${avail ? 'Start block' : 'No questions match'}</button>
  </section>`;
}

function viewQuiz() {
  const s = state.session;
  const n = s.keys.length;
  const key = s.keys[s.idx];
  const { q, bank } = state.byKey.get(key);
  const chosen = s.answers[key];
  const reveal = s.finished || (s.mode === 'tutor' && s.submitted[key]);

  const opts = (q.options || []).map(o => {
    let cls = 'opt';
    if (chosen === o.label) cls += ' selected';
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
    let verdict;
    if (!chosen) verdict = `<div class="verdict skip">Not answered. Answer: ${correctText}</div>`;
    else if (chosen === q.answer) verdict = '<div class="verdict ok">Correct</div>';
    else verdict = `<div class="verdict bad">Incorrect. Answer: ${correctText}</div>`;

    const src = q.source || {};
    const srcText = typeof src === 'string' ? src : [src.book || bank.title, src.page ? `p. ${src.page}` : ''].filter(Boolean).join(', ');
    const refs = (q.references || []).filter(r => /^https?:\/\//.test(r.url || ''));
    const fb = state.feedback.get(key);
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
      <h3>Question feedback</h3>
      <p class="small muted">Optional.${FEEDBACK_ENDPOINT ? ' Sent to the question bank maintainer.' : ''}</p>
      <div class="chips" style="margin-top:10px">
        ${FEEDBACK_TYPES.map(([t, label]) => `<button class="chip ${types.includes(t) ? 'on' : ''}" data-action="flagType" data-v="${t}">${esc(label)}</button>`).join('')}
      </div>
      <textarea id="note" placeholder="What should change? (optional)" ${types.length ? '' : 'hidden'}>${esc(fb ? fb.note : '')}</textarea>
    </section>`;
  }

  let primary;
  if (s.finished) {
    primary = s.idx < n - 1
      ? '<button class="btn primary" data-action="next">Next</button>'
      : '<button class="btn primary" data-action="go" data-view="results">Results</button>';
  } else {
    primary = s.idx < n - 1
      ? '<button class="btn primary" data-action="next">Next</button>'
      : `<button class="btn primary" data-action="finish">${s.mode === 'timed' ? 'End block' : 'Finish block'}</button>`;
  }
  const timer = s.mode === 'timed' && !s.finished ? `<span id="timer" class="timer ${s.remaining <= 60 ? 'low' : ''}">${mmss(s.remaining)}</span>` : '';
  const endBtn = s.mode === 'timed' && !s.finished ? '<button class="link-btn" data-action="finish">End</button>' : '';

  return `
  <header class="top">
    <button class="link-btn" data-action="exit">‹ ${s.finished ? 'Results' : 'Home'}</button>
    <span class="center">${s.idx + 1} / ${n}</span>
    <div class="top-right">${timer}${endBtn}</div>
  </header>
  <div class="progress"><div style="width:${((s.idx + 1) / n) * 100}%"></div></div>

  <section class="pager" aria-label="Question">
    <div class="pager-top"><span class="brand">Pager</span><span class="led ${s.fresh ? 'flash' : 'on'}" aria-hidden="true"></span></div>
    <div class="lcd screen">
      <div class="lcd-head"><span>PG ${pad(s.idx + 1, 2)}/${pad(n, 2)}</span><span>${reveal ? esc((q.system || '').toUpperCase()) : ''}</span></div>
      <div class="lcd-text">
        ${rich(q.stem)}
        ${q.lead ? `<p class="lead">${esc(q.lead)}</p>` : ''}
      </div>
    </div>
  </section>

  <div class="opts">${opts}</div>
  ${after}

  <nav class="bar">
    <button class="btn" data-action="prev" ${s.idx === 0 ? 'disabled' : ''}>Prev</button>
    ${primary}
  </nav>`;
}

function viewResults() {
  const s = state.session;
  let correct = 0, skipped = 0;
  const rows = s.keys.map((key, i) => {
    const { q } = state.byKey.get(key);
    const a = s.answers[key];
    let status = 'skip', mark = '–';
    if (a) { if (a === q.answer) { status = 'ok'; mark = '✓'; correct++; } else { status = 'bad'; mark = '✗'; } } else skipped++;
    return `<button class="row" data-action="review" data-i="${i}">
      <span class="mark ${status}">${mark}</span>
      <span class="row-txt"><b>Q${i + 1}</b> ${esc(q.system || '')}${q.topic ? `, ${esc(q.topic)}` : ''}</span>
      <span class="chev">›</span>
    </button>`;
  }).join('');
  const n = s.keys.length;
  return `
  <header class="top">
    <button class="link-btn" data-action="go" data-view="home">‹ Home</button>
    <span class="center">Results</span><span style="width:48px"></span>
  </header>
  <section class="card score">
    <div class="big">${pct(correct, n)}</div>
    <p>${correct} of ${n} correct${skipped ? `, ${skipped} unanswered` : ''}</p>
    <p class="small muted">${s.mode === 'timed' ? 'Timed' : 'Tutor'} block. Tap any question to review it.</p>
  </section>
  <section class="card">${rows}</section>`;
}

function viewStats() {
  const st = overallStats();
  const now = Date.now();
  const items = sourceItems();
  const rows = systemsList().map(sys => {
    const qs = items.filter(x => sysOf(x) === sys);
    let used = 0, ok = 0, due = 0;
    for (const x of qs) {
      const p = state.progress.get(x.key);
      if (p && p.attempts) { used++; if (lastOk(p)) ok++; if (p.due <= now) due++; }
    }
    return { sys, total: qs.length, used, ok, due };
  });
  rows.sort((a, b) => {
    if (!a.used !== !b.used) return a.used ? -1 : 1;
    return (a.used ? a.ok / a.used : 0) - (b.used ? b.ok / b.used : 0);
  });
  return `
  <header class="top">
    <button class="link-btn" data-action="go" data-view="home">‹ Home</button>
    <span class="center">Performance</span><span style="width:48px"></span>
  </header>
  <section class="card">
    <div class="stat-grid">
      <div><div class="num">${pct(st.used, st.total)}</div><div class="lab">Bank used</div></div>
      <div><div class="num">${pct(st.latestCorrect, st.used)}</div><div class="lab">Correct</div></div>
      <div><div class="num">${st.flagged}</div><div class="lab">Flagged</div></div>
    </div>
    <p class="small muted" style="margin-top:12px">\u201cCorrect\u201d uses your most recent attempt at each question.</p>
  </section>
  <section class="card">
    <h2>By system (weakest first)</h2>
    <table>
      <thead><tr><th>System</th><th>Used</th><th>Correct</th>${state.settings.sr ? '<th>Due</th>' : ''}</tr></thead>
      <tbody>${rows.map(r => `<tr><td>${esc(r.sys)}</td><td>${r.used}/${r.total}</td><td>${pct(r.ok, r.used)}</td>${state.settings.sr ? `<td>${r.due}</td>` : ''}</tr>`).join('')}</tbody>
    </table>
  </section>`;
}

function viewSettings() {
  const fbAll = [...state.feedback.values()];
  const counts = Object.fromEntries(FEEDBACK_TYPES.map(([t]) => [t, fbAll.filter(f => f.types.includes(t)).length]));
  return `
  <header class="top">
    <button class="link-btn" data-action="go" data-view="home">‹ Home</button>
    <span class="center">Settings</span><span style="width:48px"></span>
  </header>

  <section class="card">
    <h2>Question banks</h2>
    ${state.banks.length ? state.banks.map(b => `
      <div class="kv"><span><b>${esc(b.title || b.id)}</b><br><span class="small muted">${(b.questions || []).length} questions${b.version ? `, updated ${esc(b.version)}` : ''}</span></span>
      <button class="link-btn danger-text" data-action="removeBank" data-v="${esc(b.id)}">Remove</button></div>`).join('')
      : '<p class="small muted">No banks added yet, so the sample questions are shown.</p>'}
    <div class="btn-col" style="margin-top:14px">
      <label class="btn">Add question bank files<input type="file" accept=".json,application/json" multiple hidden data-file="bank"></label>
    </div>
    <p class="small muted" style="margin-top:10px">Each file is stored on this phone and works offline. Adding a file with the same bank id replaces the old version and keeps your progress.</p>
  </section>

  <section class="card">
    <h2>Study</h2>
    <label class="switch"><span><b>Spaced repetition</b><br><span class="small muted">Questions get a review date: missed ones come back sooner, ones you know well later. Adds the Due filter. When off, there are no review dates.</span></span><input type="checkbox" data-change="sr" ${state.settings.sr ? 'checked' : ''}></label>
    <label class="switch"><span><b>Vibrate on answer</b><br><span class="small muted">Android only.</span></span><input type="checkbox" data-change="buzz" ${state.settings.buzz ? 'checked' : ''}></label>
  </section>

  <section class="card">
    <h2>Question feedback</h2>
    ${FEEDBACK_ENDPOINT ? `<p class="small muted">Feedback is sent to the question bank maintainer automatically, including feedback given offline once you\u2019re back online. Waiting to send: <b id="pending">${state.outbox.size}</b></p>
    <label class="field"><b>Your name</b> <span class="small muted">(optional, sent with your feedback)</span>
      <input type="text" data-input="name" value="${esc(state.settings.name)}" maxlength="60" autocomplete="name">
    </label>` : ''}
    ${fbAll.length ? FEEDBACK_TYPES.map(([t, label]) => `<div class="kv"><span>${esc(label)}</span><span>${counts[t]}</span></div>`).join('') + `<div class="kv"><span><b>Questions with feedback</b></span><span><b>${fbAll.length}</b></span></div>`
      : '<p class="small muted">No feedback yet. After answering a question you can tag it as incorrect, not clinically relevant, too long, or other.</p>'}
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
  const views = { home: viewHome, quiz: viewQuiz, results: viewResults, stats: viewStats, settings: viewSettings };
  if ((state.view === 'quiz' || state.view === 'results') && !state.session) state.view = 'home';
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

// ---------- Block lifecycle ----------
async function startBlock() {
  const pool = candidates();
  if (!pool.length) return toast('No questions match these filters');
  const n = Math.min(state.home.count, pool.length);
  const keys = shuffle(pool.map(x => x.key)).slice(0, n);
  state.session = {
    id: Date.now(), mode: state.home.mode, keys, answers: {}, submitted: {}, idx: 0, finished: false,
    remaining: state.home.mode === 'timed' ? n * SECONDS_PER_Q : null, startedAt: Date.now(), fresh: true,
  };
  await saveSession();
  go('quiz');
  state.session.fresh = false;
}
async function finishBlock() {
  const s = state.session;
  if (!s || s.finished) return;
  stopTimer();
  flushOutbox();
  if (s.mode === 'timed') {
    for (const key of s.keys) {
      const a = s.answers[key];
      if (a) recordAnswer(key, a, a === state.byKey.get(key).q.answer);
    }
  }
  s.finished = true;
  s.idx = 0;
  await saveSession();
  go('results');
}
function moveTo(i) {
  const s = state.session;
  s.idx = i;
  s.fresh = !s.finished;
  saveSession();
  flushOutbox();
  go('quiz');
  s.fresh = false;
}

// ---------- Feedback ----------
function blankFeedback(key) {
  const [bankId, ...rest] = key.split('::');
  return { key, bankId, questionId: rest.join('::'), types: [], note: '', updatedAt: 0 };
}
async function toggleFlag(type) {
  const s = state.session;
  const key = s.keys[s.idx];
  const fb = state.feedback.get(key) || blankFeedback(key);
  fb.types = fb.types.includes(type) ? fb.types.filter(t => t !== type) : [...fb.types, type];
  fb.updatedAt = Date.now();
  document.querySelectorAll('[data-action="flagType"]').forEach(b => b.classList.toggle('on', fb.types.includes(b.dataset.v)));
  const note = document.getElementById('note');
  if (note) note.hidden = !fb.types.length;
  if (!fb.types.length && !fb.note) { state.feedback.delete(key); await idb.del('feedback', key); }
  else { state.feedback.set(key, fb); await idb.put('feedback', fb); }
  queueSend(key);
}
let noteTimer;
function saveNote(value) {
  const s = state.session;
  const key = s.keys[s.idx];
  const fb = state.feedback.get(key) || blankFeedback(key);
  fb.note = value;
  fb.updatedAt = Date.now();
  state.feedback.set(key, fb);
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => { idb.put('feedback', fb); queueSend(key); }, 600);
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
window.addEventListener('online', flushOutbox);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') { saveSession(); flushOutbox(); }
});

async function exportFeedback() {
  const labels = Object.fromEntries(FEEDBACK_TYPES);
  const items = [...state.feedback.values()].map(feedbackItem);
  const summary = { questions: items.length };
  for (const [t] of FEEDBACK_TYPES) summary[t] = items.filter(i => i.feedback.includes(t)).length;
  await shareJson(`pager-feedback-${new Date().toISOString().slice(0, 10)}.json`, {
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
  dropStaleSession();
  render();
}
function dropStaleSession() {
  if (state.session && !state.session.keys.every(k => state.byKey.has(k))) { state.session = null; saveSession(); }
}
async function exportProgress() {
  await shareJson(`pager-progress-${new Date().toISOString().slice(0, 10)}.json`, {
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
  dismissHint: () => { state.hints.installDismissed = true; setMeta('hints', state.hints); render(); },
  mode: el => { state.home.mode = el.dataset.v; saveHome(); render(); },
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
  count: el => {
    const avail = candidates().length;
    const cur = Math.min(state.home.count, avail);
    const up = Number(el.dataset.d) > 0;
    let next;
    if (up) next = cur < 10 ? cur + 1 : Math.floor(cur / 5) * 5 + 5;
    else next = cur <= 10 ? cur - 1 : Math.ceil(cur / 5) * 5 - 5;
    state.home.count = Math.max(1, Math.min(avail || 1, next));
    saveHome(); render();
  },
  start: startBlock,
  resume: () => { state.session.fresh = true; go('quiz'); state.session.fresh = false; },
  discard: async () => {
    if (!confirm('Discard this block? Answers already given in tutor mode stay recorded.')) return;
    state.session = null; await saveSession(); render();
  },
  choose: el => {
    const s = state.session;
    const key = s.keys[s.idx];
    if (s.finished || (s.mode === 'tutor' && s.submitted[key])) return;
    const label = el.dataset.label;
    s.answers[key] = label;
    if (s.mode === 'tutor') {
      s.submitted[key] = true;
      const ok = label === state.byKey.get(key).q.answer;
      recordAnswer(key, label, ok);
      buzz(ok ? 25 : [70, 50, 70]);
    }
    saveSession();
    go('quiz', { keepScroll: true });
  },
  next: () => { const s = state.session; if (s.idx < s.keys.length - 1) moveTo(s.idx + 1); },
  prev: () => { const s = state.session; if (s.idx > 0) moveTo(s.idx - 1); },
  finish: () => {
    const s = state.session;
    const unanswered = s.keys.filter(k => !s.answers[k]).length;
    if (s.mode === 'timed' && !confirm(unanswered ? `End block with ${unanswered} unanswered?` : 'End block and see results?')) return;
    if (s.mode === 'tutor' && unanswered && !confirm(`Finish with ${unanswered} skipped?`)) return;
    finishBlock();
  },
  exit: () => { saveSession(); flushOutbox(); go(state.session.finished ? 'results' : 'home'); },
  review: el => { state.session.idx = Number(el.dataset.i); saveSession(); go('quiz'); },
  flagType: el => toggleFlag(el.dataset.v),
  removeBank: async el => {
    const b = state.banks.find(x => x.id === el.dataset.v);
    if (!b || !confirm(`Remove \u201c${b.title}\u201d from this phone? Your progress on it is kept and comes back if you add the file again.`)) return;
    await idb.del('banks', b.id);
    state.banks = state.banks.filter(x => x.id !== b.id);
    rebuildIndex(); dropStaleSession(); render();
    toast(`Removed ${b.title}`);
  },
  exportFeedback,
  clearFeedback: async () => {
    if (!confirm('Clear all question feedback on this phone? Export it first if you still need it.')) return;
    await idb.clear('feedback'); state.feedback.clear(); render();
  },
  exportProgress,
  resetProgress: async () => {
    if (!confirm('Erase all answer history and review dates on this phone?')) return;
    if (!confirm('This cannot be undone. Consider exporting first. Erase anyway?')) return;
    await idb.clear('progress'); state.progress.clear();
    state.session = null; await saveSession();
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
  if (e.target.id === 'note') saveNote(e.target.value);
  else if (e.target.dataset.input === 'name') { state.settings.name = e.target.value.trim().slice(0, 60); setMeta('settings', state.settings); }
});
document.addEventListener('keydown', e => {
  if (state.view !== 'quiz' || !state.session || /TEXTAREA|INPUT/.test(e.target.tagName)) return;
  const map = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E' };
  const label = map[e.key] || (/^[a-e]$/i.test(e.key) ? e.key.toUpperCase() : null);
  if (label) { const el = document.querySelector(`[data-action="choose"][data-label="${label}"]`); if (el && !el.disabled) actions.choose(el); }
  else if (e.key === 'ArrowRight') actions.next();
  else if (e.key === 'ArrowLeft') actions.prev();
});

// ---------- Boot ----------
async function boot() {
  try {
    const [banks, progress, feedback] = await Promise.all([idb.all('banks'), idb.all('progress'), idb.all('feedback')]);
    state.banks = banks.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
    state.progress = new Map(progress.map(p => [p.key, p]));
    state.feedback = new Map(feedback.map(f => [f.key, f]));
    state.settings = { ...state.settings, ...(await getMeta('settings', {})) };
    delete state.settings.systems;
    state.home = { ...state.home, ...(await getMeta('home', {})) };
    state.hints = { ...state.hints, ...(await getMeta('hints', {})) };
    state.outbox = new Map(await getMeta('outbox', []));
    state.session = await getMeta('session', null);
    state.clientId = await getMeta('clientId', '');
    if (!state.clientId) {
      state.clientId = crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now();
      await setMeta('clientId', state.clientId);
    }
  } catch (e) {
    toast('Storage is unavailable, so progress won\u2019t be saved.');
  }
  rebuildIndex();
  if (state.session && (!Array.isArray(state.session.keys) || !state.session.keys.every(k => state.byKey.has(k)))) state.session = null;
  go('home');
  flushOutbox();
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) { /* ignore */ }
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
