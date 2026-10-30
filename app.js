'use strict';

const APP_VERSION = '1.0.0';

// ---------- Game tuning ----------
const RANKS = [
  { name: 'Clerk', xp: 0 },
  { name: 'PGY-1', xp: 1500 },
  { name: 'PGY-2', xp: 5000 },
  { name: 'PGY-3', xp: 12000 },
  { name: 'PGY-4', xp: 25000 },
  { name: 'Fellow', xp: 45000 },
  { name: 'Staff', xp: 75000 },
  { name: 'Chief of Medicine', xp: 120000 },
];
const BASE_POINTS = 100;
const multiplier = combo => combo <= 1 ? 1 : Math.min(3, 1 + (combo - 1) * 0.5);

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
  version: APP_VERSION,
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

// ---------- State ----------
const state = {
  view: 'home',
  banks: [],
  progress: new Map(),
  feedback: new Map(),
  settings: { sr: true, buzz: true, systems: [] },
  stats: { xp: 0, best: 0, bestCombo: 0, shifts: 0, answered: 0, correct: 0 },
  hints: { installDismissed: false },
  shift: null,
  lastShift: null,
};
const keyOf = (bankId, qid) => `${bankId}::${qid}`;

function activeBanks() {
  const enabled = state.banks.filter(b => b.enabled !== false);
  return enabled.length ? enabled : (state.banks.length ? [] : [SAMPLE_BANK]);
}
function allQuestions() {
  const out = [];
  for (const b of activeBanks()) for (const q of b.questions || []) out.push({ bank: b, q, key: keyOf(b.id, q.id) });
  return out;
}
function pool() {
  const sel = state.settings.systems;
  const all = allQuestions();
  return sel.length ? all.filter(x => sel.includes(x.q.system || 'Other')) : all;
}
function systemsAvailable() {
  const set = new Set(allQuestions().map(x => x.q.system || 'Other'));
  return [...set].sort((a, b) => (SYSTEM_ORDER.indexOf(a) + 1 || 99) - (SYSTEM_ORDER.indexOf(b) + 1 || 99) || a.localeCompare(b));
}
function rankFor(xp) {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1].xp) i++;
  const cur = RANKS[i], next = RANKS[i + 1];
  const frac = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1;
  return { index: i, name: cur.name, next, frac: Math.max(0, Math.min(1, frac)) };
}

// ---------- Question selection ----------
function pickQuestion() {
  const p = pool();
  if (!p.length) return null;
  const recent = new Set(state.shift ? state.shift.recent : []);
  let candidates = p.filter(x => !recent.has(x.key));
  if (!candidates.length) candidates = p.filter(x => !state.shift || x.key !== state.shift.recent[state.shift.recent.length - 1]);
  if (!candidates.length) candidates = p;

  const rand = arr => arr[Math.floor(Math.random() * arr.length)];
  const unseen = candidates.filter(x => !state.progress.has(x.key));

  if (!state.settings.sr) {
    if (unseen.length) return rand(unseen);
    return rand(candidates);
  }

  const now = Date.now();
  const due = candidates.filter(x => {
    const r = state.progress.get(x.key);
    return r && typeof r.due === 'number' && r.due <= now;
  });
  if (due.length && (Math.random() < 0.35 || !unseen.length)) {
    // Weakest first: lower box comes back first
    due.sort((a, b) => (state.progress.get(a.key).box || 0) - (state.progress.get(b.key).box || 0));
    return rand(due.slice(0, Math.max(3, Math.ceil(due.length / 3))));
  }
  if (unseen.length) return rand(unseen);
  // Everything seen and nothing due: soonest-due first, with some variety
  const seen = candidates.slice().sort((a, b) => (state.progress.get(a.key).due || 0) - (state.progress.get(b.key).due || 0));
  return rand(seen.slice(0, Math.min(10, seen.length)));
}

function recordAnswer(item, choice, ok) {
  const now = Date.now();
  const r = state.progress.get(item.key) || {
    key: item.key, bankId: item.bank.id, questionId: item.q.id,
    attempts: 0, correct: 0, history: [], box: 0, due: 0,
  };
  r.attempts += 1;
  if (ok) r.correct += 1;
  r.history.push({ t: now, c: choice, ok });
  if (r.history.length > 20) r.history = r.history.slice(-20);
  r.box = ok ? Math.min(INTERVALS.length - 1, (r.attempts === 1 ? 1 : (r.box || 0) + 1)) : 0;
  r.due = now + INTERVALS[r.box];
  r.lastSeen = now;
  state.progress.set(item.key, r);
  idb.put('progress', r);
}

// ---------- Helpers ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.round(n).toLocaleString('en-CA');
const pad = (n, w) => String(Math.round(n)).padStart(w, '0');
function paragraphs(text) {
  return String(text || '').trim().split(/\n\s*\n/).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
}
function splitTakeaway(q) {
  if (q.takeaway) return [q.takeaway, q.explanation || ''];
  const text = String(q.explanation || '').trim();
  const m = text.match(/^(.+?[.!?])(\s+)([A-Z0-9(].*)$/s);
  return m ? [m[1], m[3]] : [text, ''];
}
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
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

// ---------- Views ----------
function pagerHome() {
  const r = rankFor(state.stats.xp);
  return `
  <section class="pager" aria-label="Your pager">
    <div class="pager-top"><span class="brand">Pager</span><span class="led on" aria-hidden="true"></span></div>
    <div class="lcd">
      <div class="lcd-row"><span>${esc(r.name.toUpperCase())}</span><span>XP ${fmt(state.stats.xp)}</span></div>
      <div class="lcd-bar" role="progressbar" aria-label="Progress to next rank" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(r.frac * 100)}"><i style="width:${(r.frac * 100).toFixed(1)}%"></i></div>
      <div class="lcd-row"><span>${r.next ? `NEXT: ${esc(r.next.name.toUpperCase())}` : 'TOP RANK'}</span><span>${r.next ? fmt(r.next.xp - state.stats.xp) : ''}</span></div>
      <div class="lcd-row" style="margin-top:8px"><span>BEST SHIFT</span><span>${fmt(state.stats.best)}</span></div>
      <div class="lcd-row" style="margin-top:8px"><span>&gt; READY<span class="cursor">_</span></span></div>
    </div>
    <div class="pager-keys">
      <button class="btn key" data-action="start">Start shift</button>
    </div>
  </section>`;
}

function viewHome() {
  const systems = systemsAvailable();
  const sel = state.settings.systems.filter(s => systems.includes(s));
  const usingSample = activeBanks()[0] === SAMPLE_BANK;
  const noneEnabled = !activeBanks().length;
  const count = pool().length;
  const sysLabel = sel.length ? `${sel.length} selected` : 'All';
  return `
  ${pagerHome()}
  <div class="home-intro small muted">
    ${noneEnabled ? 'All your question banks are switched off. Turn one on in Settings.'
      : usingSample ? 'You\u2019re playing the built-in sample questions. Add your own bank files in Settings.'
      : `${fmt(count)} questions in play. Answer as many or as few as you like; every answer saves.`}
  </div>
  ${systems.length > 1 ? `
  <details class="systems">
    <summary>Systems: ${esc(sysLabel)}</summary>
    <div class="chips">
      <button class="chip" data-action="sysAll" aria-pressed="${sel.length === 0}">All</button>
      ${systems.map(s => `<button class="chip" data-action="sys" data-sys="${esc(s)}" aria-pressed="${sel.includes(s)}">${esc(s)}</button>`).join('')}
    </div>
  </details>` : ''}
  ${!isStandalone() && !state.hints.installDismissed ? `
  <div class="hint"><span>Add Pager to your home screen. It runs offline there and your progress is less likely to be cleared.</span><button class="linkish" data-action="dismissHint">Got it</button></div>` : ''}
  <div class="nav">
    <button class="btn quiet" data-action="go" data-view="stats">Stats</button>
    <button class="btn quiet" data-action="go" data-view="settings">Settings</button>
  </div>`;
}

function stripHtml() {
  const s = state.shift;
  return `
  <div class="strip">
    <div class="pager">
      <div class="lcd" id="lcd">
        <span>PG ${pad(s.answered + (s.chosen ? 0 : 1), 2)}</span>
        <span>${s.combo >= 2 ? `x${multiplier(s.combo).toFixed(1)}` : '<span class="lcd-dim">x1.0</span>'}</span>
        <span id="score">${pad(s.score, 5)}</span>
      </div>
      <button class="end" data-action="end">End shift</button>
    </div>
  </div>`;
}

function viewPlay() {
  const s = state.shift;
  if (!s.current) {
    return `${stripHtml()}<div class="empty"><h2>No questions to page you with</h2><p class="muted" style="margin-top:8px">Pick more systems on the home screen, or add a question bank in Settings.</p></div>`;
  }
  const { q, bank } = s.current;
  const answered = !!s.chosen;
  const ok = answered && s.chosen === q.answer;
  const opts = (q.options || []).map(o => {
    let cls = 'opt';
    if (answered && o.label === q.answer) cls += ' correct';
    else if (answered && o.label === s.chosen) cls += ' wrong';
    return `<button class="${cls}" data-action="answer" data-label="${esc(o.label)}" ${answered ? 'disabled' : ''}>
      <b>${esc(o.label)}</b><span>${esc(o.text)}${answered && o.explanation && (o.label === q.answer || o.label === s.chosen) ? `<span class="why">${esc(o.explanation)}</span>` : ''}</span>
    </button>`;
  }).join('');

  let after = '';
  if (answered) {
    const [line, rest] = splitTakeaway(q);
    const src = q.source || {};
    const srcText = [src.book || bank.title, src.page ? `p. ${src.page}` : ''].filter(Boolean).join(', ');
    const refs = (q.references || []).filter(r => /^https?:\/\//.test(r.url || ''));
    const others = (q.options || []).filter(o => o.explanation && o.label !== q.answer && o.label !== s.chosen);
    const fb = state.feedback.get(s.current.key);
    const types = fb ? fb.types : [];
    after = `
    <div class="takeaway ${ok ? '' : 'missed'}" id="takeaway">
      <div class="verdict">${ok ? (s.lastGain ? `Correct, +${fmt(s.lastGain)}` : 'Correct') : `Missed. Answer: ${esc(q.answer)}`}</div>
      <p class="line">${esc(line)}</p>
    </div>
    <details class="more">
      <summary>Full explanation</summary>
      <div class="more-body">
        ${rest ? paragraphs(rest) : ''}
        ${others.length ? `<ul class="refs">${others.map(o => `<li><b>${esc(o.label)}</b> ${esc(o.text)}: <span class="muted">${esc(o.explanation)}</span></li>`).join('')}</ul>` : ''}
        <p class="source">${esc(q.system || '')}${q.topic ? `, ${esc(q.topic)}` : ''}${srcText ? `<br>Source: ${esc(srcText)}` : ''}</p>
        ${refs.length ? `<div><h3>Outside sources</h3><ul class="refs">${refs.map(r => `<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title || r.url)}</a>${r.supports ? `<br><span class="small muted">${esc(r.supports)}</span>` : ''}</li>`).join('')}</ul></div>` : ''}
        <div class="flag">
          <h3>Flag this question</h3>
          <div class="chips">
            ${FEEDBACK_TYPES.map(([t, label]) => `<button class="chip" data-action="flag" data-type="${t}" aria-pressed="${types.includes(t)}">${esc(label)}</button>`).join('')}
          </div>
          <textarea id="note" placeholder="What should change? (optional)" ${types.length ? '' : 'hidden'}>${esc(fb ? fb.note : '')}</textarea>
        </div>
      </div>
    </details>`;
  }

  return `
  ${stripHtml()}
  <div class="qmeta">${answered ? esc(q.system || '') : '&nbsp;'}</div>
  <div class="stem">${paragraphs(q.stem)}</div>
  <p class="lead">${esc(q.lead || '')}</p>
  <div class="options ${answered ? 'answered' : ''}">${opts}</div>
  ${after}
  ${answered ? `<div class="dock"><div class="inner"><button class="btn" data-action="next">Next page</button></div></div>` : ''}`;
}

function viewSummary() {
  const s = state.lastShift;
  const pct = s.answered ? Math.round(100 * s.correct / s.answered) : 0;
  return `
  <section class="pager" aria-label="Shift summary">
    <div class="pager-top"><span class="brand">Pager</span><span class="led" aria-hidden="true"></span></div>
    <div class="lcd">
      <div class="lcd-row"><span>SHIFT OVER</span><span>${s.newBest ? 'NEW BEST' : ''}</span></div>
      <div class="lcd-big">${pad(s.score, 5)}</div>
      <div class="lcd-row"><span>PAGES ${s.answered}</span><span>${pct}%</span></div>
      <div class="lcd-row"><span>BEST COMBO</span><span>x${s.maxCombo}</span></div>
    </div>
  </section>
  ${s.promotedTo ? `<div class="panel" style="margin-top:14px"><h2>Promoted to ${esc(s.promotedTo)}</h2></div>` : ''}
  <div class="btn-col" style="margin-top:16px">
    <button class="btn" data-action="start">Start another shift</button>
    <button class="btn quiet" data-action="go" data-view="home">Home</button>
  </div>`;
}

function viewStats() {
  const r = rankFor(state.stats.xp);
  const bySys = new Map();
  const qIndex = new Map();
  for (const b of [...state.banks, SAMPLE_BANK]) for (const q of b.questions || []) qIndex.set(keyOf(b.id, q.id), q);
  for (const p of state.progress.values()) {
    const q = qIndex.get(p.key);
    if (!q) continue;
    const sys = q.system || 'Other';
    const cur = bySys.get(sys) || { a: 0, c: 0 };
    cur.a += p.attempts; cur.c += p.correct;
    bySys.set(sys, cur);
  }
  const rows = [...bySys.entries()].map(([sys, v]) => ({ sys, ...v, pct: v.a ? v.c / v.a : 0 }))
    .sort((a, b) => a.pct - b.pct);
  const total = state.stats.answered;
  const acc = total ? Math.round(100 * state.stats.correct / total) : 0;
  return `
  <div class="page-head"><button class="back" data-action="go" data-view="home">Back</button><h2>Stats</h2><span></span></div>
  <section class="panel">
    <h3>${esc(r.name)}</h3>
    <div class="bar"><i style="width:${(r.frac * 100).toFixed(1)}%"></i></div>
    <p class="small muted">${r.next ? `${fmt(r.next.xp - state.stats.xp)} XP to ${esc(r.next.name)}` : 'You\u2019ve reached the top rank.'}</p>
  </section>
  <section class="panel">
    <div class="kv"><span>Pages answered</span><b>${fmt(total)}</b></div>
    <div class="kv"><span>Accuracy</span><b>${total ? acc + '%' : '—'}</b></div>
    <div class="kv"><span>Shifts</span><b>${fmt(state.stats.shifts)}</b></div>
    <div class="kv"><span>Best shift</span><b>${fmt(state.stats.best)}</b></div>
    <div class="kv"><span>Best combo</span><b>x${state.stats.bestCombo}</b></div>
  </section>
  <section class="panel">
    <h3>By system</h3>
    ${rows.length ? rows.map(x => `
      <div class="sys">
        <span>${esc(x.sys)}</span><span class="small muted">${Math.round(x.pct * 100)}% of ${x.a}</span>
        <div class="bar ${x.pct < 0.6 ? 'low' : ''}"><i style="width:${(x.pct * 100).toFixed(1)}%"></i></div>
      </div>`).join('') : '<p class="small muted">Answer a few pages and your systems show up here, weakest first.</p>'}
  </section>`;
}

function viewSettings() {
  const fbAll = [...state.feedback.values()];
  const counts = Object.fromEntries(FEEDBACK_TYPES.map(([t]) => [t, fbAll.filter(f => f.types.includes(t)).length]));
  return `
  <div class="page-head"><button class="back" data-action="go" data-view="home">Back</button><h2>Settings</h2><span></span></div>

  <section class="panel">
    <h3>Question banks</h3>
    ${state.banks.length ? state.banks.map(b => `
      <div class="bank">
        <div><div class="name">${esc(b.title || b.id)}</div><div class="small muted">${fmt((b.questions || []).length)} questions${b.version ? `, updated ${esc(b.version)}` : ''}</div></div>
        <div style="display:flex;gap:12px;align-items:center">
          <label class="switch" aria-label="Use ${esc(b.title || b.id)}"><input type="checkbox" data-change="bankToggle" data-id="${esc(b.id)}" ${b.enabled !== false ? 'checked' : ''}></label>
          <button class="linkish" data-action="removeBank" data-id="${esc(b.id)}">Remove</button>
        </div>
      </div>`).join('') : '<p class="small muted">No banks added yet, so the sample questions are in play.</p>'}
    <label class="btn" style="cursor:pointer">Add question bank files<input type="file" accept=".json,application/json" multiple hidden data-change="addBanks"></label>
    <p class="small muted">Adding a file with the same bank id replaces the old version and keeps your progress.</p>
  </section>

  <section class="panel">
    <h3>Play</h3>
    <label class="switch"><span><b>Spaced repetition</b><br><span class="small muted">Missed questions come back sooner, and ones you know well fade out. When off, questions are picked at random, unseen ones first.</span></span><input type="checkbox" data-change="sr" ${state.settings.sr ? 'checked' : ''}></label>
    <label class="switch"><span><b>Buzz on answer</b><br><span class="small muted">A short vibration for correct and missed answers (Android only).</span></span><input type="checkbox" data-change="buzz" ${state.settings.buzz ? 'checked' : ''}></label>
  </section>

  <section class="panel">
    <h3>Question feedback</h3>
    ${fbAll.length ? FEEDBACK_TYPES.map(([t, label]) => `<div class="kv"><span>${esc(label)}</span><span>${counts[t]}</span></div>`).join('') + `<div class="kv"><b>Flagged questions</b><b>${fbAll.length}</b></div>`
      : '<p class="small muted">Flag questions from the full explanation after you answer. Export the file to fix them with the question generator.</p>'}
    <div class="btn-col">
      <button class="btn quiet" data-action="exportFeedback" ${fbAll.length ? '' : 'disabled'}>Export feedback file</button>
      <button class="btn danger" data-action="clearFeedback" ${fbAll.length ? '' : 'disabled'}>Clear feedback</button>
    </div>
  </section>

  <section class="panel">
    <h3>Backup</h3>
    <p class="small muted">Progress, XP and feedback live on this phone. Export a backup before switching phones or clearing browser data.</p>
    <div class="btn-col">
      <button class="btn quiet" data-action="exportProgress">Export progress</button>
      <label class="btn quiet" style="cursor:pointer">Import progress<input type="file" accept=".json,application/json" hidden data-change="importProgress"></label>
      <button class="btn danger" data-action="resetProgress">Reset progress and XP</button>
    </div>
  </section>

  <section class="panel">
    <div class="kv"><span>App version</span><span>${APP_VERSION}</span></div>
    <div class="kv"><span>Storage</span><span id="persist">Checking…</span></div>
  </section>`;
}

function render() {
  const app = document.getElementById('app');
  const views = { home: viewHome, play: viewPlay, summary: viewSummary, stats: viewStats, settings: viewSettings };
  app.innerHTML = (views[state.view] || viewHome)();
  if (state.view === 'settings') fillPersist();
}

async function fillPersist() {
  const el = document.getElementById('persist');
  if (!el) return;
  let persisted = false;
  try { persisted = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : false; } catch (e) { /* ignore */ }
  el.textContent = persisted ? 'Protected' : 'Standard';
}

// ---------- Actions ----------
function go(view) {
  state.view = view;
  render();
  window.scrollTo(0, 0);
}

function startShift() {
  state.shift = { score: 0, combo: 0, maxCombo: 0, answered: 0, correct: 0, recent: [], current: null, chosen: null, lastGain: 0, rankBefore: rankFor(state.stats.xp).index };
  nextPage();
}

function nextPage() {
  const s = state.shift;
  s.current = pickQuestion();
  s.chosen = null;
  s.lastGain = 0;
  if (s.current) {
    s.recent.push(s.current.key);
    const cap = Math.min(15, Math.max(1, Math.floor(pool().length / 2)));
    if (s.recent.length > cap) s.recent = s.recent.slice(-cap);
  }
  state.view = 'play';
  render();
  window.scrollTo(0, 0);
}

function answer(label) {
  const s = state.shift;
  if (!s || !s.current || s.chosen) return;
  const ok = label === s.current.q.answer;
  s.chosen = label;
  s.answered += 1;
  let gain = 0;
  if (ok) {
    s.correct += 1;
    s.combo += 1;
    s.maxCombo = Math.max(s.maxCombo, s.combo);
    gain = Math.round(BASE_POINTS * multiplier(s.combo));
    s.score += gain;
    buzz(25);
  } else {
    s.combo = 0;
    buzz([70, 50, 70]);
  }
  s.lastGain = gain;
  recordAnswer(s.current, label, ok);
  state.stats.xp += gain;
  state.stats.answered += 1;
  if (ok) state.stats.correct += 1;
  setMeta('stats', state.stats);
  render();
  const tk = document.getElementById('takeaway');
  if (tk) {
    const r = tk.getBoundingClientRect();
    if (r.bottom > window.innerHeight - 90) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollBy({ top: r.bottom - window.innerHeight + 110, behavior: reduce ? 'auto' : 'smooth' });
    }
  }
  if (gain) {
    const sc = document.getElementById('score');
    if (sc) sc.classList.add('bump');
  }
}

function endShift() {
  const s = state.shift;
  state.shift = null;
  if (!s || !s.answered) { go('home'); return; }
  const newBest = s.score > state.stats.best;
  state.stats.shifts += 1;
  state.stats.best = Math.max(state.stats.best, s.score);
  state.stats.bestCombo = Math.max(state.stats.bestCombo, s.maxCombo);
  setMeta('stats', state.stats);
  const after = rankFor(state.stats.xp);
  state.lastShift = { ...s, newBest, promotedTo: after.index > s.rankBefore ? after.name : null };
  go('summary');
}

async function toggleFlag(type) {
  const s = state.shift;
  if (!s || !s.current) return;
  const key = s.current.key;
  const fb = state.feedback.get(key) || { key, bankId: s.current.bank.id, questionId: s.current.q.id, types: [], note: '', updatedAt: 0 };
  fb.types = fb.types.includes(type) ? fb.types.filter(t => t !== type) : [...fb.types, type];
  fb.updatedAt = Date.now();
  // Update in place so the open explanation doesn't collapse
  document.querySelectorAll('[data-action="flag"]').forEach(b => b.setAttribute('aria-pressed', fb.types.includes(b.dataset.type)));
  const note = document.getElementById('note');
  if (note) note.hidden = !fb.types.length;
  if (!fb.types.length && !fb.note) {
    state.feedback.delete(key);
    await idb.del('feedback', key);
  } else {
    state.feedback.set(key, fb);
    await idb.put('feedback', fb);
  }
}

let noteTimer;
function saveNote(value) {
  const s = state.shift;
  if (!s || !s.current) return;
  const key = s.current.key;
  const fb = state.feedback.get(key) || { key, bankId: s.current.bank.id, questionId: s.current.q.id, types: [], note: '', updatedAt: 0 };
  fb.note = value;
  fb.updatedAt = Date.now();
  state.feedback.set(key, fb);
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => idb.put('feedback', fb), 300);
}

function normalizeBank(data, filename) {
  let bank = Array.isArray(data) ? { questions: data } : data;
  if (!bank || !Array.isArray(bank.questions)) throw new Error('no "questions" list');
  if (bank.type === 'feedback' || bank.type === 'progress') throw new Error('this is an export file, not a question bank');
  const id = String(bank.id || filename.replace(/\.json$/i, '')).trim();
  const questions = bank.questions.filter(q => q && q.id && q.stem && Array.isArray(q.options) && q.answer);
  if (!questions.length) throw new Error('no valid questions');
  return {
    id, title: bank.title || id, version: bank.version || '',
    questions: questions.map(q => {
      const { source_quote, outside_facts, ...rest } = q;
      return rest;
    }),
    enabled: true, addedAt: Date.now(),
  };
}

async function addBanks(files) {
  let added = 0;
  for (const f of files) {
    try {
      const bank = normalizeBank(JSON.parse(await f.text()), f.name);
      const old = state.banks.find(b => b.id === bank.id);
      if (old) bank.enabled = old.enabled;
      await idb.put('banks', bank);
      state.banks = state.banks.filter(b => b.id !== bank.id).concat(bank);
      added++;
      toast(`${old ? 'Updated' : 'Added'} ${bank.title}: ${bank.questions.length} questions`);
    } catch (e) {
      toast(`Couldn\u2019t add ${f.name}: ${e.message}`);
    }
  }
  if (added) render();
}

async function exportFeedback() {
  const banks = new Map([...state.banks, SAMPLE_BANK].map(b => [b.id, b]));
  const labels = Object.fromEntries(FEEDBACK_TYPES);
  const items = [...state.feedback.values()].map(fb => {
    const bank = banks.get(fb.bankId);
    const q = bank && (bank.questions || []).find(x => x.id === fb.questionId);
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
      feedback_at: new Date(fb.updatedAt).toISOString(),
      my_performance: p ? { attempts: p.attempts, correct: p.correct, last_choice: last ? last.c : null, last_correct: last ? last.ok : null } : null,
      question: q || null,
    };
  });
  const summary = { questions: items.length };
  for (const [t] of FEEDBACK_TYPES) summary[t] = items.filter(i => i.feedback.includes(t)).length;
  await shareJson(`pager-feedback-${new Date().toISOString().slice(0, 10)}.json`, {
    type: 'feedback', app: 'pager', exportedAt: new Date().toISOString(),
    feedback_types: labels, summary, items,
  });
}

async function exportProgress() {
  await shareJson(`pager-progress-${new Date().toISOString().slice(0, 10)}.json`, {
    app: 'pager', type: 'progress', format: 1, exportedAt: new Date().toISOString(),
    banks: state.banks.map(b => ({ id: b.id, title: b.title, version: b.version })),
    stats: state.stats, settings: state.settings,
    progress: [...state.progress.values()],
    feedback: [...state.feedback.values()],
  });
}

async function importProgress(file) {
  try {
    const data = JSON.parse(await file.text());
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
        box: typeof raw.box === 'number' ? raw.box : 0,
        due: typeof raw.due === 'number' ? raw.due : 0,
        lastSeen: raw.lastSeen || 0,
      };
      const cur = state.progress.get(key);
      if (!cur || rec.attempts >= cur.attempts) { state.progress.set(key, rec); await idb.put('progress', rec); n++; }
    }
    for (const fb of data.feedback || []) {
      if (!fb.key || !Array.isArray(fb.types)) continue;
      state.feedback.set(fb.key, fb);
      await idb.put('feedback', fb);
    }
    if (data.app === 'pager' && data.stats) {
      const s = data.stats;
      state.stats = {
        xp: Math.max(state.stats.xp, s.xp || 0), best: Math.max(state.stats.best, s.best || 0),
        bestCombo: Math.max(state.stats.bestCombo, s.bestCombo || 0), shifts: Math.max(state.stats.shifts, s.shifts || 0),
        answered: Math.max(state.stats.answered, s.answered || 0), correct: Math.max(state.stats.correct, s.correct || 0),
      };
      await setMeta('stats', state.stats);
    }
    toast(`Imported progress for ${n} questions`);
    render();
  } catch (e) {
    toast(`Couldn\u2019t import: ${e.message}`);
  }
}

// ---------- Events ----------
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  if (a === 'start') startShift();
  else if (a === 'answer') answer(el.dataset.label);
  else if (a === 'next') nextPage();
  else if (a === 'end') endShift();
  else if (a === 'go') go(el.dataset.view);
  else if (a === 'flag') toggleFlag(el.dataset.type);
  else if (a === 'dismissHint') { state.hints.installDismissed = true; setMeta('hints', state.hints); render(); }
  else if (a === 'sysAll') { state.settings.systems = []; setMeta('settings', state.settings); render(); openSystems(); }
  else if (a === 'sys') {
    const sys = el.dataset.sys;
    const sel = state.settings.systems;
    state.settings.systems = sel.includes(sys) ? sel.filter(x => x !== sys) : [...sel, sys];
    setMeta('settings', state.settings);
    render(); openSystems();
  }
  else if (a === 'removeBank') {
    const b = state.banks.find(x => x.id === el.dataset.id);
    if (b && confirm(`Remove ${b.title}? Your progress on it stays saved if you add it again later.`)) {
      await idb.del('banks', b.id);
      state.banks = state.banks.filter(x => x.id !== b.id);
      render();
    }
  }
  else if (a === 'exportFeedback') exportFeedback();
  else if (a === 'clearFeedback') {
    if (confirm('Clear all question feedback? Export it first if you still need it.')) {
      await idb.clear('feedback'); state.feedback.clear(); render();
    }
  }
  else if (a === 'exportProgress') exportProgress();
  else if (a === 'resetProgress') {
    if (confirm('Reset all progress, XP and stats? This can\u2019t be undone.')) {
      await idb.clear('progress'); state.progress.clear();
      state.stats = { xp: 0, best: 0, bestCombo: 0, shifts: 0, answered: 0, correct: 0 };
      await setMeta('stats', state.stats);
      toast('Progress reset');
      render();
    }
  }
});
function openSystems() { const d = document.querySelector('details.systems'); if (d) d.open = true; }

document.addEventListener('change', async e => {
  const el = e.target.closest('[data-change]');
  if (!el) return;
  const c = el.dataset.change;
  if (c === 'addBanks') { await addBanks([...el.files]); el.value = ''; }
  else if (c === 'importProgress') { if (el.files[0]) await importProgress(el.files[0]); el.value = ''; }
  else if (c === 'sr' || c === 'buzz') { state.settings[c] = el.checked; setMeta('settings', state.settings); }
  else if (c === 'bankToggle') {
    const b = state.banks.find(x => x.id === el.dataset.id);
    if (b) { b.enabled = el.checked; await idb.put('banks', b); }
  }
});
document.addEventListener('input', e => { if (e.target.id === 'note') saveNote(e.target.value); });

// Number keys 1–5 / letters A–E answer on desktop; Enter goes to next
document.addEventListener('keydown', e => {
  if (state.view !== 'play' || !state.shift || e.target.tagName === 'TEXTAREA') return;
  const s = state.shift;
  if (!s.chosen) {
    const map = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E' };
    const label = map[e.key] || (/^[a-e]$/i.test(e.key) ? e.key.toUpperCase() : null);
    if (label) answer(label);
  } else if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') nextPage();
});

// ---------- Boot ----------
async function boot() {
  try {
    const [banks, progress, feedback] = await Promise.all([idb.all('banks'), idb.all('progress'), idb.all('feedback')]);
    state.banks = banks.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
    state.progress = new Map(progress.map(p => [p.key, p]));
    state.feedback = new Map(feedback.map(f => [f.key, f]));
    state.settings = { ...state.settings, ...(await getMeta('settings', {})) };
    state.stats = { ...state.stats, ...(await getMeta('stats', {})) };
    state.hints = { ...state.hints, ...(await getMeta('hints', {})) };
  } catch (e) {
    toast('Storage is unavailable, so progress won\u2019t be saved.');
  }
  render();
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) { /* ignore */ }
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
boot();
