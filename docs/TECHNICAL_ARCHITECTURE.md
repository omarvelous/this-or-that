# This or That — Technical Architecture

> Companion to `PRODUCT_BRIEF.md`. Resolves the eight open questions and defines
> the stack, data model, and system design for the MVP build.

---

## Stack

| Layer         | Choice                               | Why                                                                                                    |
| ------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| **Framework** | Next.js (App Router)                 | Server components for fast voter pages, API routes for backend, `generateMetadata` for dynamic OG tags |
| **Database**  | Supabase (Postgres)                  | Covers DB + realtime + auth + storage under one roof; generous free tier                               |
| **Auth**      | Supabase Auth                        | Magic link + Google + Apple; already in the stack, no extra vendor                                     |
| **Storage**   | Supabase Storage                     | S3-compatible, CDN-backed; co-located with DB for simple references                                    |
| **Hosting**   | Vercel                               | Native Next.js platform; edge functions, preview deploys, free tier                                    |
| **OG Images** | `@vercel/og` (Satori)                | Edge-rendered JSX → PNG; zero external services                                                        |
| **Styling**   | Tailwind CSS + CSS custom properties | Utility-first speed; `data-theme="sunset\|electric"` toggles theme via custom properties               |
| **QR Codes**  | `react-qr-code`                      | Client-side SVG generation, no server cost                                                             |
| **Short IDs** | `nanoid` (7–8 chars)                 | URL-safe, collision-resistant, compact                                                                 |

### Why this stack

Two core platforms — **Next.js + Vercel** (compute/rendering) and **Supabase**
(data/auth/storage/realtime) — minimize vendor count, keep the free tier
generous, and let a small team ship an MVP in weeks.

---

## Open Questions — Resolved

### 1. Auth model

- **Makers** get lightweight accounts via Supabase Auth (magic link, Google, or
  Apple sign-in). Needed to manage/close/delete their polls.
- **Voters never need accounts.** Anti-abuse is layered:

  | Layer | Mechanism                    | Purpose                                                                   |
  | ----- | ---------------------------- | ------------------------------------------------------------------------- |
  | 1     | Cookie / `localStorage` flag | Instant "already voted" UX feedback                                       |
  | 2     | FingerprintJS (open-source)  | Primary dedup — ~60% unique ID accuracy; blocks most casual repeat voters |
  | 3     | Hashed IP rate limit         | Throttle (max 3 votes per IP per poll); catches VPN-less repeats          |

  A composite key `hash(visitorId + hashedIP + pollId)` is stored per vote. If
  it exists, the vote is rejected. This stops ~95% of casual ballot stuffing
  with zero voter friction.

  **Privacy:** IPs are hashed server-side and never stored raw. FingerprintJS
  runs first-party only. A brief privacy notice on the vote page covers GDPR
  basics. For low-stakes polls, this is the right tradeoff — heavier measures
  (CAPTCHAs, phone verification) would kill the one-tap UX.

### 2. Realtime

- **MVP:** Short polling every 2–3 seconds via a lightweight API route. Zero
  infrastructure beyond existing Vercel functions. Feels "live enough" for a
  link-shared micro-app.
- **Scale:** Migrate to **Supabase Realtime** (Postgres change notifications
  pushed to subscribed clients). Since we're already on Supabase, this is a
  natural upgrade with ~5 lines of client code. Free tier covers 200 concurrent
  connections.

### 3. Poll lifecycle

- **Expiration:** Default to 3 days. Custom expiry duration is a paid feature.
  Manual "close poll" button always available.
- **Editing:** Allowed only before the first vote is cast. After that, question
  and options are locked. Metadata (description, expiry) stays editable.
- **Deletion:** Soft delete only. Shared links show "This poll has been removed."
  Hard purge via background job after 30 days (or on GDPR request).
- **Retention (future):** Free tier auto-archives after 90 days of inactivity.
  Paid tier gets indefinite retention.

### 4. Media storage & moderation

- **Upload pipeline:**
  1. Client-side resize via `browser-image-compression` (target ≤ 800x800, ≤ 2MB)
  2. Upload to Supabase Storage (private originals bucket)
  3. Server-side processing via Sharp: normalize dimensions, strip EXIF, convert
     to WebP (80–85% quality), generate responsive variants (200/400/800px)
  4. Processed images served from a public CDN bucket
- **Moderation (MVP):** Upload immediately, run async moderation via NSFW.js
  (client-side TensorFlow.js, zero cost). Flag and auto-hide content exceeding
  threshold; queue for manual review. Upgrade to AWS Rekognition (~$1/1K images)
  when volume justifies it.
- **Blurred background fill:** Pure CSS — image rendered twice: background layer
  with `filter: blur(20px); object-fit: cover`, foreground with
  `object-fit: contain`. No server processing needed.

### 5. Link / QR

- **Short links:** Vercel rewrites — `/p/[shortId]` routes to the poll page.
  IDs generated with `nanoid` (7–8 chars). Custom vanity domain (e.g.,
  `t-or-t.co`) layered on later as a DNS alias.
- **OG images:** API route at `/api/og?pollId=X` using `@vercel/og`. Renders
  poll question + option thumbnails + branding as a PNG. Cached aggressively via
  `Cache-Control`. This produces rich unfurls in iMessage, WhatsApp, Slack, etc.
- **QR codes:** Client-side SVG via `react-qr-code`. Generated on demand in the
  share screen. SVG format for print quality.

### 6. Results privacy

- **MVP (free):** Results visible immediately after voting. Voter sees animated
  percentage reveal on their own vote, then live-updating totals.
- **Future (premium):** "Hidden until you vote" (see results only after casting)
  and "hidden until close" (maker reveals at a chosen time).

### 7. Free / paid boundary

- **Free:** 2 options per poll (the classic A/B). Unlimited polls, unlimited
  voters. Basic live results. "Powered by thisOrThat" watermark.
- **Paid:** 3–10 options per poll (king-of-the-hill rounds), custom expiry
  duration, results-hidden-until-close, anonymous voting (hide voter names),
  custom branding, remove watermark, audience analytics, extended retention.
- **Gate:** The create flow lets free users add 2 options. The "+" button for a
  3rd shows the upgrade prompt. The free tier must feel generous — every shared
  link is acquisition.

### 8. Scale of a poll

- **Free:** Exactly 2 options (single head-to-head vote).
- **Paid:** 3–10 options. Each additional option adds one more head-to-head
  round, reusing the same A/B voting UI (king-of-the-hill).
- **Ties:** With 2 options, ties show "It's a tie!" with equal bars. With 3+
  options, tied scores share rank on the final leaderboard.

---

## Data Model

```
┌──────────────────┐       ┌───────────────────┐
│      users       │       │      polls        │
├──────────────────┤       ├───────────────────┤
│ id (uuid, PK)    │──┐    │ id (uuid, PK)     │
│ email            │  │    │ short_id (text)   │ ← nanoid, unique, indexed
│ display_name     │  └───>│ creator_id (FK)   │
│ avatar_url       │       │ question (text)   │
│ plan (enum)      │       │ closes_at (ts?)   │ ← auto-set to created_at + 3d (free)
│ created_at       │       │ published_at (ts?)│ ← null = draft; set = live
│ updated_at       │       │ closed_at (ts?)   │ ← null = accepting votes; set = closed
│                  │       │ deleted_at (ts?)  │ ← soft delete
│                  │       │ created_at        │
│                  │       │ updated_at        │
└──────────────────┘       └───────────────────┘
                                    │
                                    │ 1:N
                                    ▼
                           ┌──────────────────┐
                           │     options      │
                           ├──────────────────┤
                           │ id (uuid, PK)    │
                           │ poll_id (FK)     │
                           │ label (text?)    │
                           │ image_url (text?)│
                           │ position (int)   │ ← display/seed order
                           │ created_at       │
                           └──────────────────┘
                                    │
                                    │ 1:N
                                    ▼
                           ┌───────────────────┐
                           │      votes        │
                           ├───────────────────┤
                           │ id (uuid, PK)     │
                           │ poll_id (FK)      │
                           │ option_id (FK)    │
                           │ matchup_id (FK)   │ ← every poll has matchups (2 options = 1 matchup)
                           │ voter_name (text?)│ ← optional, post-vote (always prompted, skippable)
                           │ fingerprint (text)│ ← hash(visitorId+hashedIP+pollId)
                           │ created_at        │
                           └───────────────────┘
                                                   UNIQUE(matchup_id, fingerprint)
```

### Matchups

Every poll uses matchups — this gives one code path for voting, results, and
deduplication regardless of option count.

```
┌──────────────────────┐
│    matchups          │
├──────────────────────┤
│ id (uuid, PK)        │
│ poll_id (FK)         │
│ round (int)          │ ← 1 for 2-option polls; 1..N for king-of-the-hill
│ option_a_id (FK)     │
│ option_b_id (FK)     │
│ winner_id (FK?)      │ ← null until resolved
│ created_at           │
└──────────────────────┘
```

**Matchup generation:** Every poll generates N-1 matchups at creation time.

- **2 options:** 1 matchup. Option A vs Option B. That's the whole poll.
- **3+ options (paid, king-of-the-hill):** N-1 matchups. Round 1 pits option 1
  vs option 2. The winner faces option 3 in round 2, and so on. Matchups after
  round 1 have `option_a_id` nulled — populated when the previous round resolves.

The voter experience is always the same: tap one of two options. More options
just means more rounds of the same interaction.

---

## API Routes (Next.js App Router)

```
POST   /api/polls              — create a poll (auth required)
GET    /api/polls/[shortId]    — fetch poll + options + vote counts
PATCH  /api/polls/[shortId]    — update poll metadata (auth, pre-vote only)
DELETE /api/polls/[shortId]    — soft-delete (auth required)

POST   /api/polls/[shortId]/vote    — cast a vote (no auth; fingerprint checked)
GET    /api/polls/[shortId]/results — vote counts + percentages (polling endpoint)
POST   /api/polls/[shortId]/upload  — image upload (auth required, returns URL)

GET    /api/polls/[shortId]/og  — dynamic OG image generation
```

---

## Page Routes

```
/                          — landing / marketing
/polls/new                 — poll creation (auth required)
/polls/[shortId]           — voter-facing poll page (no auth)
/polls/[shortId]/results   — results page (no auth)
/dashboard                 — maker's poll management (auth required)
/login                     — magic link / social auth
```

---

## Theming (deferred)

Two visual directions were explored in prototyping (Sunset and Electric). For
MVP, ship with a single default theme. Theming support (maker-selectable, or
premium custom branding) can be added later by introducing a `theme` column on
polls and toggling CSS custom properties.

---

## Key Flows

### Create → Share → Vote → Results

```
Maker                           Server                        Voter
  │                                │                            │
  ├─ POST /api/polls ─────────────>│                            │
  │  { question, options[] }                                    │
  │<── { shortId, shareUrl } ──────│                            │
  │                                │                            │
  ├─ shares link ─────────────────────────────────────────────> │
  │                                │                            │
  │                                │<── GET /p/[shortId] ───────│
  │                                │──> poll page (SSR) ───────>│
  │                                │                            │
  │                                │<── POST /vote ─────────────│
  │                                │    { optionId, fingerprint }│
  │                                │──> { results } ───────────>│
  │                                │                            │
  │                                │<── GET /results (poll 2s) ─│
  │                                │──> { updated counts } ────>│
```

---

## MVP Scope

Build in this order:

1. **Project scaffold** — Next.js + Supabase + Tailwind
2. **Data model** — Supabase migrations for users, polls, options, votes
3. **Auth** — Supabase Auth (magic link + Google) for makers
4. **Create flow** — 2-option polls (text options first, then images)
5. **Vote page** — `/p/[shortId]`, one-tap voting, fingerprint dedup
6. **Results page** — animated percentage bars, 2–3s polling
7. **Share screen** — copy link, QR code, native share sheet
8. **OG images** — dynamic `/api/og` route for rich unfurls
9. **Dashboard** — maker's list of polls, close/delete actions
10. **Image uploads** — client resize + Supabase Storage + Sharp processing

King-of-the-hill (3+ options) is post-MVP. Since it reuses the exact same A/B
voting UI with additional rounds, adding it later is straightforward — the data
model already supports it via the matchups table.
