# Vanta — UI/Design Handoff Prompt

Paste this into a fresh Claude Code session. Do the clone/setup steps below first, then read the rest as context before touching anything.

---

## 1. Clone and set up

```bash
git clone https://github.com/GeneralGunfire/VANTA.git
cd VANTA
git checkout frontend-rebuild
cd app
npm install
```

You'll need a `.env` file in `app/` (it's gitignored, not in the repo) with:

```
VITE_SUPABASE_URL=<ask for this>
VITE_SUPABASE_ANON_KEY=<ask for this>
```

Get these two values from whoever's holding the Supabase project credentials before you start — the app won't talk to the real backend without them (it'll still render, just with empty/error states everywhere).

Then:

```bash
npm run dev
```

Should come up on `http://localhost:5173` (or similar — Vite will tell you). Sign in is fake (see below), so click through any values to get into the app and see real screens.

**Repo layout**: `app/` is the actual project — frontend (`app/src/`) and backend (`app/supabase/`) live side by side in the same folder. There's nothing meaningful at the repo root outside `app/`.

## 2. Full handoff — what's done, what's not, ground rules

- **Branch**: everything is on `frontend-rebuild`, not merged into `main` yet. Keep working on this branch (or cut a new one from it) rather than starting from `main`, which still has the old pre-rebuild frontend.
- **Backend status**: the frontend talks to a real, live Supabase project — real database, real AI parsing via Groq. Some backend work (bulk multi-transaction parsing, rate limiting infrastructure, a rules-shortcut layer) was written this session but **not yet deployed** to the live Edge Functions, and a matching SQL migration (`app/supabase/migrations/0002_backend_build_pass.sql`) has **not yet been run**. This means: single-transaction parsing works fully live today; bulk-paste (multiple transactions in one message) may still collapse into one row until that gets deployed. Not something to fix yourself — flag it if it matters to what you're doing, but it's a backend deploy step, not a UI bug.
- **Don't touch `app/supabase/`** (Edge Functions, migrations, backend logic) unless you're explicitly asked to. This handoff is UI/design scope.
- **Git discipline**: commit and push your own work normally, but don't force-push, don't rewrite `frontend-rebuild`'s history, and don't merge into `main` without checking first — there may be other work landing on this branch in parallel.
- **Read `BACKEND_BUILD_PASS_REPORT.md`** in `app/supabase/` if you want the full detail on what backend work exists but isn't live yet — not required reading for UI work, but useful if something seems to work in the code but not in the browser.

---

## What Vanta is

Vanta is an AI-native bookkeeping app for small, informal South African businesses — think a bread seller or spaza shop owner, not a registered company. The owner describes a transaction in plain language ("sold 20 loaves R400 cash") or uploads a messy Excel file, and AI turns it into a clean ledger entry. No dashboards, no charts, no jargon — this is a hard, permanent constraint, not a style preference. Output is plain-English text.

Target user: mobile-first, often not digitally fluent, low and unstable income (median ~R1,200–R4,000/month). Every design decision should be readable by someone who has never used accounting software.

## Current state — be direct about this

The frontend was recently swapped in from an AI Studio/Google Stitch export and adapted to work against the real backend. It **functions correctly** — real data, real AI parsing, no fake/fabricated numbers anywhere — but the visual design is not good. It was originally built with "institutional finance" styling (dark navy, serif display font, dense bordered cards) that got retextured for the real product but not redesigned. That's the job here: **make it look like a friendly, simple tool a small business owner would trust and enjoy using, not a corporate ledger console.**

Whatever you build, keep functioning as-is: don't touch how it talks to Supabase, don't change the auth flow's logic (it's a fake/placeholder flow — see below), don't touch anything in `supabase/` (backend, Edge Functions, migrations) unless explicitly asked.

## Design system — the only hard constraints

- White background (`#FFFFFF`), near-black text (`#1C1C1C`).
- **One** accent color, confident blue (`#1E5AA8`, darker `#153F78`, lighter `#E8F0FA`) — no second accent color anywhere. States (e.g. "needs review") are shown via icon + border weight, never a second color (no red/green, no amber/emerald).
- Fonts: Inter (body/UI), Fraunces (sparse — headlines only), IBM Plex Mono (every monetary amount, without exception).
- **No charts, graphs, or dashboards, anywhere, ever.** Not a bar, not a sparkline, not a progress ring. If a summary needs to show numbers, it's a plain-English sentence or a plain list, never a visual.

Everything else — layout, spacing, component shape, iconography, motion, information density — is fair game to rework.

## Pages that exist today

1. **`/` — Landing** — hero, one example card, a 4-item feature grid, CTA banner, footer.
2. **`/auth`** — Sign in / Create account tabs. Phone number → 6-digit code (any digits work, it's fully fake/local — see below) → business name + type if creating.
3. **`/app/chat`** — the main screen. Message list, quick-prompt buttons, text input + file-attach (upload isn't wired to actually parse a file yet — it just drops a placeholder message). Real messages hit the real AI parsing backend and render as confirmation cards or "needs review" cards.
4. **`/app/ledger`** — search + All/Money in/Money out/Needs review filters, transactions grouped by day with a plain-text day subtotal, each row expandable/clickable into a detail modal. "Add Transaction" opens a modal that also goes through the real AI parser (not a raw form).
5. Two more nav items — **Config** and **Security** — open modals that are currently decorative placeholders (they don't persist anything or connect to anything real). Worth knowing before you invest design effort there.

## Auth — important, don't get confused by this

There are **two separate, unrelated auth systems** in this codebase:

- The one currently wired up (`/auth`, `AppLayout.tsx`'s auth check) is **100% fake** — phone number and code are never verified, it just sets a flag in `localStorage` and lets you in. This is intentional for now, not a bug.
- There's a **second, real phone-OTP flow** that exists in the codebase but is disabled behind a flag, parked because of unresolved SMS provider issues. **Do not touch, enable, or merge these two systems** — if you're not explicitly asked to work on real auth, treat it as out of scope and leave it alone.

## Backend contract you'll be rendering against

The real Edge Function (`parse-transaction`) returns `{ transactions: [...] }` — always an array, since one message can produce multiple transactions (e.g. "sold bread R400, bought flour R180" → two rows). Each transaction has: `amount`, `direction` (`'in'` or `'out'`), `category` (one of `Sales, Stock, Rent, Utilities, Transport, Wages, Other`), `description`, `confidence` (0–1), `needs_review` (boolean, true when confidence < 0.7), and `raw_input` (the user's original text, always preserved for the audit trail — showing this on-demand next to the parsed result is a deliberate trust feature, keep it somewhere).

Never fabricate a number if a request fails or a table is empty — the previous version of this frontend did that (fake fallback transactions, a fake CTA banner with a fake outstanding amount) and it was a real problem I fixed. Show honest empty/error states instead.

## Where to start

Run `npm install && npm run dev` from this directory. Read `src/pages/ChatPage.tsx` and `src/pages/LedgerPage.tsx` first — they're the two screens that matter most. `src/index.css` has the design tokens (Tailwind v4 `@theme` block) — that's your primary lever for a visual overhaul without touching component logic.
