# Pager

A quick-play internal medicine question app. Each question is a "page", a session is a "shift", and you climb from Clerk to Chief of Medicine as you earn points. It's a static web app that runs offline and installs to the home screen on iPhone and Android.

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

## Playing

- **Start shift** pages you with questions until you tap **End shift**. Every answer saves immediately, so closing the app mid-shift loses nothing.
- Correct answers in a row build a combo multiplier (x1.5, x2, up to x3).
- After answering you see the one-line takeaway. **Full explanation** has the rest, why the other options are wrong, the source, outside links, and the flag buttons.
- **Systems** on the home screen limits a shift to chosen systems.
- **Settings → Spaced repetition**: on, missed questions come back sooner and well-known ones fade out. Off, questions are random with unseen ones first. Nothing about scheduling is ever shown in the game.

## Question bank format

Same format the qbank generator skill produces, so its files load as is:

    {"id": "harrisons", "title": "Harrison's 22e", "version": "2026-10-25 19:30",
     "questions": [{"id": "p0026-q1", "system": "Cardiology", "topic": "...", "stem": "...",
                    "lead": "...", "options": [{"label": "A", "text": "...", "explanation": "..."}, ...],
                    "answer": "B", "explanation": "...", "references": [...], "source": {...}}]}

- The first sentence of `explanation` becomes the takeaway. An optional `takeaway` field overrides it.
- Adding a file with the same `id` replaces the old version and keeps progress.
- With no banks loaded, six built-in sample questions are used.

## Feedback export

Settings → Question feedback → Export feedback file. The format matches the original qbank app (`"type": "feedback"`, with `items` holding `bank_id`, `question_id`, `feedback`, `note`, `my_performance` and the full `question`), so the generator's refine mode reads it directly.

## Progress backup

Settings → Backup exports progress, XP, stats and feedback. Import also accepts backups from the original qbank app (question progress and feedback only).

## Updating the app

1. Change the files.
2. In `sw.js`, bump `CACHE` (e.g. `pager-v1` → `pager-v2`). Also update `APP_VERSION` at the top of `app.js`.
3. Upload and commit. On the phone, open the app online, fully close it, and reopen.

## Credits

Fonts are bundled for offline use under the SIL Open Font License 1.1: Atkinson Hyperlegible (Braille Institute) and VT323 (Peter Hull).
