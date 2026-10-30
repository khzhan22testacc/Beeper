/**
 * Pager feedback collector.
 * Paste this into Extensions → Apps Script of a Google Sheet, then deploy as a web app
 * (Execute as: Me, Who has access: Anyone). Put the /exec URL in FEEDBACK_ENDPOINT in app.js.
 *
 * One row per person per question. If someone edits their flag, their row is updated;
 * if they remove all tags and the note, their row is deleted.
 * Pager menu → Export feedback file makes a JSON file in your Drive in the format
 * the qbank skill's refine mode reads.
 */

const SHEET_NAME = 'Feedback';
const HEADERS = ['received_at', 'name', 'bank_id', 'bank_title', 'bank_version', 'question_id',
  'feedback', 'note', 'feedback_at', 'my_performance', 'question', 'app_version', 'client_id'];
const TAGS = ['more', 'fix'];
const LABELS = { more: 'Excellent question, more please!', fix: 'Please fix this' };
const MAX_BODY = 60000;

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

// Text that starts with = + - @ would be read as a formula; prefix it so it stays text.
function safe_(v, max) {
  let s = String(v == null ? '' : v).slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function doPost(e) {
  const body = e && e.postData ? e.postData.contents : '';
  if (!body || body.length > MAX_BODY) return ContentService.createTextOutput('rejected');
  let d;
  try { d = JSON.parse(body); } catch (err) { return ContentService.createTextOutput('rejected'); }

  const tags = Array.isArray(d.feedback) ? d.feedback.filter(t => TAGS.indexOf(t) !== -1) : [];
  const clientId = safe_(d.client_id, 64);
  const bankId = safe_(d.bank_id, 100);
  const questionId = safe_(d.question_id, 100);
  if (!clientId || !bankId || !questionId) return ContentService.createTextOutput('rejected');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet_();
    const values = sh.getDataRange().getValues();
    const col = name => HEADERS.indexOf(name);
    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (values[i][col('client_id')] === clientId && values[i][col('bank_id')] === bankId &&
          values[i][col('question_id')] === questionId) { rowIndex = i + 1; break; }
    }
    const note = safe_(d.note, 2000);
    if (!tags.length && !note) {
      if (rowIndex > 0) sh.deleteRow(rowIndex);
      return ContentService.createTextOutput('ok');
    }
    const row = [
      new Date(), safe_(d.name, 60), bankId, safe_(d.bank_title, 200), safe_(d.bank_version, 60), questionId,
      tags.join(', '), note, safe_(d.feedback_at, 40),
      safe_(JSON.stringify(d.my_performance || null), 500),
      safe_(JSON.stringify(d.question || null), 40000),
      safe_(d.app_version, 20), clientId,
    ];
    if (rowIndex > 0) sh.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput('Pager feedback endpoint is running.');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Pager').addItem('Export feedback file', 'exportFeedback').addToUi();
}

function parse_(s) {
  s = String(s || '');
  if (s.charAt(0) === "'") s = s.slice(1);
  try { return JSON.parse(s); } catch (err) { return null; }
}

function exportFeedback() {
  const values = sheet_().getDataRange().getValues();
  const col = name => HEADERS.indexOf(name);
  const items = values.slice(1).map(r => {
    const tags = String(r[col('feedback')] || '').split(',').map(t => t.trim()).filter(Boolean);
    return {
      bank_id: r[col('bank_id')],
      bank_title: r[col('bank_title')],
      bank_version: String(r[col('bank_version')]),
      question_id: r[col('question_id')],
      feedback: tags,
      feedback_labels: tags.map(t => LABELS[t] || t),
      note: String(r[col('note')] || '').replace(/^'/, ''),
      feedback_at: String(r[col('feedback_at')]),
      reported_by: r[col('name')] || null,
      my_performance: parse_(r[col('my_performance')]),
      question: parse_(r[col('question')]),
    };
  });
  const summary = { questions: items.length };
  TAGS.forEach(t => { summary[t] = items.filter(i => i.feedback.indexOf(t) !== -1).length; });
  const out = { type: 'feedback', app: 'pager', exportedAt: new Date().toISOString(), feedback_types: LABELS, summary, items };
  const name = 'pager-feedback-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd') + '.json';
  const file = DriveApp.createFile(name, JSON.stringify(out, null, 1), MimeType.PLAIN_TEXT);
  const html = HtmlService.createHtmlOutput(
    '<p style="font-family:sans-serif">Saved <b>' + name + '</b> (' + items.length + ' flags) to your Drive.</p>' +
    '<p style="font-family:sans-serif"><a href="' + file.getUrl() + '" target="_blank">Open it in Drive</a></p>'
  ).setWidth(360).setHeight(140);
  SpreadsheetApp.getUi().showModalDialog(html, 'Feedback exported');
}
