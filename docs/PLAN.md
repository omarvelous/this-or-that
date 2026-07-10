# this-or-that MVP — Implementation Plan

## Context

Building a greenfield mobile-first polling micro-app from an empty repo. The
architecture is defined in `TECHNICAL_ARCHITECTURE.md`. The MVP is 2-option
polls only (A/B), with the data model pre-wired for king-of-the-hill (3+
options, paid) later. Stack: Next.js App Router + Supabase + Tailwind v4 + Vercel.

Each step = one logical commit.

---

## Step 1: Initialize Next.js + TypeScript

`npx create-next-app` with App Router, TypeScript, Tailwind, `src/` directory.
Verify `npm run dev` shows the default page.

**Create:** `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

**Commit:** `init: scaffold Next.js app with TypeScript and Tailwind v4`

## Step 2: Pin Node version + gitignore

Add `.nvmrc` pinning the Node version. Review and extend `.gitignore` for
Next.js, `.env.local`, Supabase local files, and OS artifacts.

**Create:** `.nvmrc`
**Modify:** `.gitignore`

**Commit:** `chore: pin Node version and configure gitignore`

## Step 3: ESLint configuration

Extend `eslint-config-next` with `@typescript-eslint` for stricter TS rules
and `eslint-plugin-import` for import ordering. Add `npm run lint` script.

**Install:** `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint-plugin-import`
**Create:** `.eslintrc.json`
**Modify:** `package.json` (scripts)

**Commit:** `chore: configure ESLint with TypeScript and import rules`

## Step 4: Prettier + Tailwind class sorting

Add Prettier with `prettier-plugin-tailwindcss` to auto-sort Tailwind classes.
Add `npm run format` and `npm run format:check` scripts.

**Install:** `prettier`, `prettier-plugin-tailwindcss`
**Create:** `.prettierrc`, `.prettierignore`
**Modify:** `package.json` (scripts)

**Commit:** `chore: configure Prettier with Tailwind class sorting`

## Step 5: Husky + lint-staged

Pre-commit hook that runs ESLint and Prettier on staged files only. Nothing
unformatted or unlinted gets committed.

**Install:** `husky`, `lint-staged`
**Create:** `.husky/pre-commit`
**Modify:** `package.json` (lint-staged config)

**Commit:** `chore: add pre-commit hooks with Husky and lint-staged`

## Step 6: VS Code workspace settings

Format-on-save, ESLint auto-fix, Tailwind IntelliSense config, and recommended
extensions for the team.

**Create:**
- `.vscode/settings.json` — format on save, default formatter, Tailwind CSS file associations
- `.vscode/extensions.json` — recommend ESLint, Prettier, Tailwind IntelliSense

**Commit:** `chore: add VS Code workspace settings and recommended extensions`

## Step 7: Strict TypeScript config

Tighten `tsconfig.json`: enable `noUncheckedIndexedAccess`, confirm `strict: true`,
ensure path aliases are set (`@/*` → `src/*`).

**Modify:** `tsconfig.json`

**Commit:** `chore: tighten TypeScript strict mode settings`

## Step 8: CLAUDE.md project conventions

Create `CLAUDE.md` at the repo root with project conventions: stack summary,
directory structure, commit message format, coding standards, and dev commands.
This ensures future Claude sessions follow the same patterns.

**Create:** `CLAUDE.md`

**Commit:** `docs: add CLAUDE.md with project conventions`

## Step 9: Configure Tailwind + MVP theme tokens

Set up CSS custom properties for the MVP visual direction (one theme). Remove
Next.js boilerplate from the default page/global styles.

**Modify:** `src/app/globals.css`, `src/app/page.tsx`, `src/app/layout.tsx`

**Commit:** `style: configure Tailwind theme tokens and clean up boilerplate`

## Step 10: Install project dependencies

Add all non-Next.js deps the project needs: `@supabase/supabase-js`,
`@supabase/ssr`, `nanoid`, `@fingerprintjs/fingerprintjs`, `react-qr-code`,
`@vercel/og`, `browser-image-compression`.

**Modify:** `package.json`

**Commit:** `deps: add Supabase, nanoid, fingerprintjs, and utility libraries`

## Step 11: Supabase client setup + env config

Create the three Supabase client helpers (browser, server, admin) and the
env var template. Configure `next.config.ts` for Supabase Storage image domains.

**Create:**
- `.env.local.example` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`
- `src/lib/supabase/client.ts` — browser client via `createBrowserClient`
- `src/lib/supabase/server.ts` — server client via `createServerClient` (cookies)
- `src/lib/supabase/admin.ts` — service-role client (bypasses RLS)
- `src/lib/supabase/middleware.ts` — session refresh helper

**Modify:** `next.config.ts`

**Commit:** `feat: add Supabase client helpers and env configuration`

## Step 12: Database types

Auto-generate TypeScript types via `supabase gen types` (or hand-write if
Supabase CLI isn't connected yet). Types for `User`, `Poll`, `Option`,
`Matchup`, `Vote`, and the `Database` type for Supabase's typed client.
Add `npm run db:types` script for regeneration.

**Create:** `src/types/database.ts`
**Modify:** `package.json` (scripts)

**Commit:** `types: add database type definitions`

## Step 13: Supabase migrations — schema

Initialize Supabase locally, write the initial schema migration with all 5
tables, constraints, and indexes.

**Create:**
- `supabase/config.toml`
- `supabase/migrations/001_initial_schema.sql` — users, polls, options, matchups, votes tables with all FKs, `UNIQUE(matchup_id, fingerprint)`, index on `polls.short_id`

**Commit:** `db: add initial schema migration`

## Step 14: Supabase migrations — RLS policies

Row-level security for all tables.

**Create:** `supabase/migrations/002_rls_policies.sql`
- polls: SELECT for anyone (`deleted_at IS NULL`), INSERT/UPDATE/DELETE for `creator_id = auth.uid()`
- options: SELECT for anyone, INSERT/UPDATE for poll creator
- matchups: SELECT for anyone, INSERT for poll creator
- votes: INSERT for anyone (anon), SELECT for anyone

**Commit:** `db: add RLS policies`

## Step 15: Supabase migrations — storage buckets

Create the `poll-images` bucket with public read, auth write, 5MB limit.

**Create:** `supabase/migrations/003_storage.sql`

**Commit:** `db: add storage bucket for poll images`

## Step 16: Auth — middleware + helpers

Session refresh middleware and `getUser()` server helper. Middleware protects
`/polls/new` and `/dashboard`, redirecting to `/login`.

**Create:**
- `src/middleware.ts`
- `src/lib/auth.ts`

**Commit:** `auth: add session middleware and getUser helper`

## Step 17: Auth — login page + callbacks

Login page with magic link email input and Google OAuth button. Auth callback
routes for code exchange and magic link confirmation.

**Create:**
- `src/app/login/page.tsx`
- `src/app/auth/callback/route.ts`
- `src/app/auth/confirm/route.ts`

**Commit:** `auth: add login page and OAuth callback routes`

## Step 18: Poll creation — API route

POST `/api/polls`: validate auth + input, generate `nanoid(8)` short_id, insert
poll + options + 1 matchup in a transaction, set `published_at=now()`,
`closes_at=now()+3d`, return `{ shortId }`.

**Create:**
- `src/app/api/polls/route.ts`
- `src/lib/nanoid.ts` — `generateShortId()` wrapper

**Commit:** `api: add poll creation endpoint with matchup generation`

## Step 19: Poll creation — UI

Create page with form: question input, 2 option text inputs, submit button.
Calls `POST /api/polls`, redirects to `/polls/[shortId]` on success.

**Create:**
- `src/app/polls/new/page.tsx` — server component, auth-gated
- `src/components/poll-form.tsx` — client component

**Commit:** `feat: add poll creation page and form`

## Step 20: Vote page — server component + data fetching

Server component at `/polls/[shortId]`: fetch poll + options + matchup by
short_id. Handle deleted (show message), closed/expired (redirect to results).
Set `generateMetadata` with dynamic OG image URL.

**Create:** `src/app/polls/[shortId]/page.tsx`

**Commit:** `feat: add poll page with SSR data fetching and metadata`

## Step 21: Vote page — voting UI + fingerprint

Client component: two option panels (split screen, mobile-first), tap = vote.
FingerprintJS init, composite key generation.

**Create:**
- `src/components/voting-ui.tsx`
- `src/lib/fingerprint.ts`

**Commit:** `feat: add voting UI with fingerprint-based dedup`

## Step 22: Vote page — API route

POST `/api/polls/[shortId]/vote`: receive `{ optionId, matchupId, fingerprint }`,
hash composite key server-side with IP, validate poll is open, insert vote
(409 on duplicate), return updated counts.

**Create:** `src/app/api/polls/[shortId]/vote/route.ts`

**Commit:** `api: add vote submission endpoint with anti-abuse`

## Step 23: Vote page — post-vote name prompt

Modal shown after voting: "Add your name?" with text input and skip button.
Updates the vote record's `voter_name`.

**Create:** `src/components/name-prompt.tsx`

**Commit:** `feat: add post-vote name prompt`

## Step 24: Results — API route

GET `/api/polls/[shortId]/results`: aggregate votes by option_id, calculate
percentages, return `{ options: [...], totalVotes }`.

**Create:** `src/app/api/polls/[shortId]/results/route.ts`

**Commit:** `api: add results endpoint with vote aggregation`

## Step 25: Results — page + animated bars

Server component with SSR initial fetch. Client component with animated
percentage bars (CSS transitions), vote counts, winner highlight. Polls
`GET /results` every 2.5s for live updates.

**Create:**
- `src/app/polls/[shortId]/results/page.tsx`
- `src/components/results-view.tsx`
- `src/components/animated-bar.tsx`

**Commit:** `feat: add results page with animated bars and live polling`

## Step 26: Share panel

Client component: copy-link button (`navigator.clipboard`), QR code via
`react-qr-code` (SVG), native share button (`navigator.share` with fallback).
Integrate into results page and post-creation redirect.

**Create:** `src/components/share-panel.tsx`
**Modify:** `src/app/polls/[shortId]/results/page.tsx`

**Commit:** `feat: add share panel with copy link, QR, and native share`

## Step 27: OG image generation

Edge runtime route using `@vercel/og` ImageResponse. Renders poll question +
option labels + branding as PNG. Cached with `Cache-Control: public, max-age=3600`.

**Create:** `src/app/api/polls/[shortId]/og/route.ts`

**Commit:** `feat: add dynamic OG image generation for link unfurls`

## Step 28: Dashboard — page + poll list

Server component, auth-gated: fetch user's polls ordered by `created_at` desc.
Poll cards showing question, vote count, status (live/closed/expired).

**Create:**
- `src/app/dashboard/page.tsx`
- `src/components/poll-list.tsx`

**Commit:** `feat: add maker dashboard with poll list`

## Step 29: Dashboard — poll management API

PATCH `/api/polls/[shortId]`: auth check, validate no votes for content edits,
update allowed fields. DELETE: auth check, set `deleted_at=now()`.

**Create:** `src/app/api/polls/[shortId]/route.ts`

**Commit:** `api: add poll update and soft-delete endpoints`

## Step 30: Image uploads — API + client resize

Upload route: auth check, receive FormData, resize server-side via Sharp,
upload to Supabase Storage, return public URL. Client helper for pre-upload
resize via `browser-image-compression`.

**Create:**
- `src/app/api/polls/[shortId]/upload/route.ts`
- `src/lib/image-utils.ts`

**Commit:** `feat: add image upload with client resize and storage`

## Step 31: Image uploads — integrate into create flow

Add image upload buttons and thumbnail previews to the poll creation form.

**Modify:** `src/components/poll-form.tsx`

**Commit:** `feat: add image upload to poll creation form`

---

## Build Order

```
DX Foundation:     1 → 2 → 3 → 4 → 5 → 6 → 7 → 8
Tailwind + Deps:   9 → 10
Supabase Setup:    11 → 12 → 13 → 14 → 15
Auth:              16 → 17
Create Flow:       18 → 19
Vote Flow:         20 → 21 → 22 → 23
Results:           24 → 25
                         ├→ 26 (share)
                         ├→ 27 (OG)
                         ├→ 28 → 29 (dashboard)
                         └→ 30 → 31 (images)
```

Steps 1-25 are the critical path (DX → scaffold → DB → auth → create → vote → results).
Steps 26-31 can be built in any order after Step 25.

## Verification

- After Step 1: `npm run dev` shows default page
- After Step 5: commit a badly-formatted file, confirm pre-commit hook rejects it
- After Step 7: `npx tsc --noEmit` passes with strict settings
- After Step 15: `supabase db reset` — migrations run cleanly
- After Step 17: test login flow in browser
- After Step 19: create a poll, verify in Supabase DB with matchup record
- After Step 23: vote on mobile viewport, confirm dedup blocks re-vote, name prompt works
- After Step 25: vote from second browser, confirm results animate within 3s
- After Step 27: paste poll URL in iMessage/Slack, confirm rich preview
- After Step 29: dashboard shows polls, close/delete work
- Final: end-to-end on mobile — create → share → vote → results
