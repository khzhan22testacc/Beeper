# Pager

A simple internal medicine question app for answering a few questions on the go. Pick your question banks on the home screen, tap Start, and each question arrives on a pager screen. It's a static web app that runs offline and installs to the home screen on iPhone and Android.

This repo holds the app only. Question banks are loaded on each phone from a file and are never stored here.

## Put it online (GitHub Pages)

1. Create a new public repo on github.com (for example `pager`).
2. **Add file → Upload files**, then drag in everything from this folder, including the `icons` and `fonts` folders and the `.nojekyll` file. Commit.
   - Hidden files: on a Mac, press Cmd+Shift+. in Finder to see `.nojekyll`. If it doesn't upload, the app still works.
3. **Settings → Pages → Build and deployment**: Source "Deploy from a branch", branch `main`, folder `/ (root)`. Save.
4. After 1–2 minutes the site is live at `https://<your-username>.github.io/pager/`.

## Install on a phone

- **iPhone:** open the link in Safari → Share → Add to Home Screen.
- **Android:** open the link in Chrome → menu → Install app (or Add to Home screen).

Open it once while online so it caches for offline use.

## Using it

- **Home:** tick the banks you want (Add bank files to load new ones), optionally narrow by system, then **Start**.
- **Questions:** tap an answer to see the one-line takeaway. **Full explanation** has the rest, why the other options are wrong, the source, outside links, and the flag buttons. **Done** goes back home. Every answer saves immediately.
- **Settings → Spaced repetition:** on, missed questions come back sooner and well-known ones show up less. Off, questions are random with unseen ones first.

## Question bank format

Same format the qbank generator skill produces, so its files load as is:

    {"id": "harrisons", "title": "Harrison's 22e", "version": "2026-10-25 19:30",
     "questions": [{"id": "p0026-q1", "system": "Cardiology", "topic": "...", "stem": "...",
                    "lead": "...", "options": [{"label": "A", "text": "...", "explanation": "..."}, ...],
                    "answer": "B", "explanation": "...", "references": [...], "source": {...}}]}

- The first sentence of `explanation` becomes the takeaway. An optional `takeaway` field overrides it.
- Adding a file with the same `id` replaces the old version and keeps progress.
- With no banks loaded, six built-in sample questions are used.

## Feedback

### Sent automatically to a Google Sheet (optional)

When `FEEDBACK_ENDPOINT` in `app.js` is set, flags and notes go straight to your Sheet. Flags made offline wait on the phone and send once it's back online. Each person gets one row per question, and editing a flag updates that row.

Setup, about 10 minutes:

1. Create a new Google Sheet (any name).
2. **Extensions → Apps Script**. Delete what's there, paste in `google-sheet/Code.gs` from this repo, and save.
3. **Deploy → New deployment →** gear icon **→ Web app**. Set *Execute as* to **Me** and *Who has access* to **Anyone**. Click Deploy and approve the permissions (Google warns because it's your own unverified script: Advanced → Go to project).
4. Copy the web app URL (ends in `/exec`) and paste it into `FEEDBACK_ENDPOINT` near the top of `app.js`.
5. Bump `CACHE` in `sw.js` and upload to GitHub.

To get a file for the generator's refine mode: reload the Sheet, then **Pager menu → Export feedback file**. It saves a JSON file to your Drive in the same format as the in-app export.

If you edit the script later, use **Deploy → Manage deployments → edit → New version** so the URL stays the same.

The URL is visible in the app's public code, so anyone could technically post to it. The script only accepts the expected fields with length limits and stores text so it can't run as formulas.

### Manual export

Settings → Question feedback → Export feedback file still works, with or without the Sheet. The format (`"type": "feedback"`, with `items` holding `bank_id`, `question_id`, `feedback`, `note`, `my_performance` and the full `question`) is what the generator's refine mode reads.

## Progress backup

Settings → Backup exports progress and feedback. Import also accepts backups from the original qbank app (question progress and feedback only).

## Updating the app

1. Change the files.
2. In `sw.js`, bump `CACHE` (e.g. `pager-v1` → `pager-v2`). Also update `APP_VERSION` at the top of `app.js`.
3. Upload and commit. On the phone, open the app online, fully close it, and reopen.

## Credits

Fonts are bundled for offline use under the SIL Open Font License 1.1: Atkinson Hyperlegible (Braille Institute) and VT323 (Peter Hull).
