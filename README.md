# Ex Libris

An immersive, AI-powered personal library. Catalogue the books you own, read and track them, talk with an AI reading companion about them — and let the app gently nudge you toward the books you bought but never opened.

The app **adapts to your collection**: an AI classifier reads your catalogue and adjusts the shelf categories, the visual theme, and the companion's persona to match the kinds of books you actually own. A library of Reformed theology gets a dark-oak study feel and a theologically careful companion; a shelf of science fiction would look and sound entirely different. Nothing is hardcoded.

## Features

**Catalogue & discover**
- **Virtual bookshelf** — your books as spines on wooden shelves, grouped by AI-generated categories, with hover pull-out, reading-progress bars, and a dust film on long-neglected books
- **Easy cataloguing** — add by ISBN (Open Library with Google Books fallback), by title search, or manually; covers fetched automatically
- **Adaptive theming** — five visual themes chosen by the classifier, applied app-wide via CSS variables

**Read & track**
- **In-app reader** — read your uploaded EPUBs (paginated, epub.js) and PDFs (pdf.js) right in the app; reading position is saved automatically and you pick up where you left off
- **Highlights** — select text in an EPUB to save a highlight; they collect on the book's page
- **Reading sessions & streaks** — time in the reader is logged automatically and rolls up into a stats page: day streak, minutes and pages this week, books finished, and the dusty shelf

**Learn**
- **Reading companion** — streaming AI chat about a single book or across your whole library ("what do my books say about covenant theology?"), grounded in your catalogue and honest about what it doesn't know
- **Discuss what you're reading** — open the companion beside the reader and it can quote and discuss the exact chapter on screen
- **AI enrichment** — one click adds a summary, themes, and difficulty level to any book

**Motivation**
- **The dusty shelf** — the app surfaces the book that has waited longest and writes a personal encouragement that remembers *why you bought it*

Everything except the AI features works with **no API key at all** — cataloguing, shelves, the reader, progress tracking, streaks, and template-based nudges are fully functional offline.

## Getting started

```bash
cp .env.example .env      # defaults are fine to start
npm install
npm run db:migrate        # creates data/exlibris.db
npm run seed              # optional: 12 classic Reformed titles to play with
npm run dev               # http://localhost:3000
```

## Enabling the AI companion

1. Create an account at [console.anthropic.com](https://console.anthropic.com) and buy a small prepaid credit block ($5 goes a long way).
2. Create an API key and put it in `.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Restart the app. The key is only ever read on the server — it never reaches the browser.

To try the AI features without a key, set `AI_PROVIDER=mock` for deterministic canned responses (this is also what the tests use).

### What does it cost?

| Action | Model (default) | Approximate cost |
|---|---|---|
| One chat turn with the companion | Claude Opus 4.8 | 2–3¢ |
| Enriching a book | Claude Haiku 4.5 | ~1¢ |
| Classifying a 300-book library | Claude Haiku 4.5 | 2–5¢ |

A month of heavy personal use is realistically **$3–10**. Prompt caching (built in) cuts repeated-context cost by ~90% in long conversations. Both models are configurable via `AI_CHAT_MODEL` and `AI_TASK_MODEL` in `.env` — set the chat model to `claude-sonnet-5` if you want it cheaper.

## How adaptation works

Every book you add feeds the catalogue. From **Settings → Re-classify my library**, the AI reads the whole catalogue (titles and authors only — a few thousand tokens) and produces:

- a ranked list of your library's dominant genres,
- a 5–8 category shelf taxonomy designed for *your* collection,
- a category assignment for every book,
- a persona prompt that tunes the companion's voice, and
- a visual theme key (`study`, `hearth`, `gallery`, `observatory`, `conservatory`).

The shelves, the colors, and the companion all follow.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run db:generate` | Regenerate migrations after schema changes |
| `npm run db:migrate` | Apply migrations |
| `npm run seed` | Seed sample books (skips if the DB already has books) |
| `npm test` | Vitest unit tests (uses the mock AI provider — no key needed) |

## Deploying

The app runs anywhere Next.js runs. The simplest free path:

1. **Database:** create a free [Turso](https://turso.tech) database and set `DATABASE_URL=libsql://...` and `DATABASE_AUTH_TOKEN` in your deployment environment (locally it's just a SQLite file — your data stays exportable either way).
2. **Hosting:** push to GitHub and import the repo in [Vercel](https://vercel.com). Add the env vars from your `.env`.

## Roadmap

- **Phase 1 — Catalogue & companion** ✅ shipped
- **Phase 2 — Read & track** ✅ shipped (EPUB + PDF reader, progress sync, highlights, sessions, streaks, stats, chapter-grounded chat)
- **Phase 3 — Learn & plan:** reading plans ("the Institutes in 90 days") with checkpoints, recall quizzes from your highlights, cross-library theme search, public-domain imports (Project Gutenberg, CCEL), milestone celebrations
- **Phase 4 — Polish:** optional passcode, data export, cumulative AI-cost display, PWA install

> **Deploying the reader:** uploads are stored on local disk by default (`data/uploads/`). On a serverless host like Vercel, the ~4.5 MB request-body limit means large EPUB/PDF uploads should go through a blob store (e.g. Vercel Blob) — the storage layer in `src/lib/storage/` is the single seam to swap for that.

## Tech

Next.js 15 (App Router) · TypeScript · SQLite via libsql + Drizzle ORM · Tailwind CSS v4 · Motion · Anthropic Claude API (pluggable provider with mock fallback)
