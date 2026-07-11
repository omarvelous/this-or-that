# Handoff: This or That — web app (classic A/B)

## Overview

**This or That** is a frictionless "which one?" voting micro-app. A maker creates a
matchup (two options — text and/or photo), shares one link, and friends vote in a
single tap with **no account required**. Results tally live.

This package covers the **classic A/B format (exactly two options)** — the free core
of the product. Other formats (gauntlet, bracket) are out of scope for this build.

Core loop: **Create → (save via magic link) → Share → Vote → Results**, plus a
**maker dashboard** and **per-poll detail/analytics** view.

---

## About the design files

The file in this bundle (`This or That Site.dc.html`) is a **design reference built in
HTML** — a working prototype that demonstrates the intended look, layout, copy, and
interaction. **It is not production code to copy.** The task is to **recreate these
designs in a Next.js + Tailwind CSS codebase** using that stack's idioms (App Router,
server/client components, real data + auth), not to port the HTML.

State in the prototype is in-memory (client only). Uploaded photos are held as data
URLs and reset on reload. Vote counts are mocked/animated. Treat all data as
illustrative.

### How to explore every state

The prototype has a **"Preview states" switcher** pinned to the bottom-left corner.
Click it to jump directly to any screen/state (landing, create, both email-modal steps,
share + unfurl, voter vote/closed, maker previews, dashboard, poll detail active/closed)
without clicking through the whole flow. Use this as the visual spec — it maps 1:1 to
the screens listed below. (It's gated behind a `stateMenu` prop; omit it in production.)

---

## Fidelity

**High-fidelity.** Colors, typography, spacing, radii, shadows, and interactions are
final. Recreate the UI pixel-accurately using the tokens in this doc. Where the
prototype used responsive `clamp()` type and `flex-wrap` columns, reproduce with
Tailwind's fluid utilities / breakpoints (details per screen).

---

## Design tokens

### Color

| Token         | Hex                   | Use                                |
| ------------- | --------------------- | ---------------------------------- |
| `bg`          | `#FBF6EF`             | Page background (warm cream)       |
| `ink`         | `#241A11`             | Primary text, dark buttons         |
| `body`        | `#6E6559`             | Body/paragraph text                |
| `muted`       | `#8A7967`             | Secondary text, labels, captions   |
| `muted-2`     | `#A79B8B`             | Faintest captions                  |
| `surface`     | `#FFFFFF`             | Cards, inputs                      |
| `sand`        | `#F1E7DA`             | Inset fields, tinted fills, tracks |
| `line`        | `rgba(36,26,17,0.12)` | Borders / hairlines                |
| `coral`       | `#FF5B34`             | **Option A + primary accent/CTAs** |
| `teal`        | `#0FA47F`             | **Option B + secondary accent**    |
| `coral-tint`  | `#FDE9E2`             | Option A resting fill (hero)       |
| `teal-tint`   | `#E3F4EE`             | Option B resting fill (hero)       |
| `success-bg`  | `#E6F5EF`             | "Active"/"sent" pill background    |
| `success-ink` | `#0B7D60`             | "Active"/"sent" pill text          |
| `dark-panel`  | `#1B140D`             | State switcher / dark chips        |

Option A is **always coral**, Option B is **always teal** — consistently, in every
screen (create, vote, results, dashboard bars, detail, unfurl). Keep that mapping.

### Typography

- **Display** — `Bricolage Grotesque`, weights 600/700/800. Headlines, option labels,
  numbers/percentages. Tight tracking: `letter-spacing: -0.4px` to `-2px` (larger the
  text, tighter).
- **Body/UI** — `Hanken Grotesk`, weights 400–800. Paragraphs, labels, buttons.
- **Mono-ish accent** — `Space Grotesk`, weights 500–700. The share URL / code-like
  strings and the switcher.
- Fluid headline sizing in the prototype: e.g. hero H1 `clamp(2.7rem, 6.2vw, 4.6rem)`;
  section H2 `clamp(2rem, 4.4vw, 3.2rem)`; screen H1 `clamp(1.9rem, 4.5vw, 3rem)`.

### Radius

Inputs/buttons `14–16px` · cards `18–26px` · pills/avatars `20px`–full · icon tiles `9–16px`.

### Shadow

- Card float: `0 40px 90px -34px rgba(80,50,20,0.34)`
- Primary CTA glow: `0 16px 34px -14px rgba(255,91,52,0.7)`
- Vote-panel hover (A): `0 26px 50px -24px rgba(255,91,52,0.55)` (B: teal equivalent)
- Switcher/dark: `0 24px 60px -20px rgba(0,0,0,0.6)`

### Spacing / layout

- Content max-widths: landing `1180px`; create/share/results `600px`; detail `900px`;
  voter vote `1000px`, voter results `560px`; dashboard `1100px`. All centered, `24px`
  horizontal gutter.
- Generous hit targets (buttons ≥ 44px tall). Section padding uses `clamp()` (e.g.
  `clamp(48px,7vw,90px)` vertical).

---

## Screens / Views

> Naming below matches the "Preview states" switcher.

### 1. Landing (`/`)

- **Purpose:** market the product; every CTA enters the create flow.
- **Layout:** sticky translucent header (`backdrop-blur`, cream 82% bg); hero is a
  2-column `flex-wrap` (copy + interactive preview card) that **stays side-by-side down
  to ~720px**, then stacks and **center-aligns** on phones; how-it-works 4-card row;
  dark value band with 3 stats; centered closing CTA; simple footer.
- **Header:** logo "This **or** That" (the " or " is coral). Links: _How it works_
  (anchor), _My polls_ (→ dashboard), primary _Create a poll_ button (coral). On ≤560px
  the nav stacks and centers and _How it works_ is hidden.
- **Hero copy:** eyebrow pill "● No sign-up. One tap. Live results." (teal pulsing dot);
  H1 "Settle it in one tap."; paragraph; buttons _Create a poll →_ (coral, glow) and
  _See how it works_ (outline).
- **Hero preview card (interactive):** a mock matchup card. Two option rows —
  Midnight (coral-tinted, coral border) and Daybreak (teal-tinted, teal border) — with a
  center "VS" badge. **Clicking a row animates a colored fill + percentages in place**,
  highlights the winner, and shows "You picked X · N votes · vote again" (reset). Before
  voting: "☝ Tap an option — it's live". Rows lift with a colored shadow on hover.
- **How it works:** 4 cards (Create / Share / Vote / Results), numbered coral/teal
  alternating tiles.
- **Value band (dark `#241A11`):** "Built for the group chat." + stats `2s` / `0` / `1`.
- **Closing CTA:** "What's it gonna be?" + _Create a poll →_.

### 2. Create poll (`/create`)

- **Purpose:** set the question and two options.
- **Layout:** single centered column, max 600px.
- **Components:** eyebrow "Step 1 · Create"; H1 "Set up your matchup."; a **Question**
  text input (sand fill); then **two option cards** (white, `line` border, radius 22).
  Each card = an A/B badge (coral/teal) + "Option A/B" label, a **label text input**
  (sand fill, display font 22px), and a **fluid optional-photo control**:
  - No photo → dashed button "＋ Add a photo · optional".
  - Photo set → 16:10 preview (rendered as a `background-image`, **not** an `<img>` with
    a bound src) with "Change photo" (bottom-left) and "✕" remove (top-right) overlays.
  - **Important:** an option always has a text label; the photo is additive. There is
    **no text/photo toggle** — this replaced an earlier toggle design.
- Between the cards: a circular "VS" badge overlapping the gap.
- Footer: full-width coral **Create poll →** → opens the email modal (below).

### 3. Email capture — form & 4. Email capture — link sent (modal)

- **Trigger:** pressing _Create poll_. A centered modal over a dimmed
  (`rgba(36,26,17,0.5)` + blur) backdrop; card is cream, radius 26, max 420px, with a
  "✕" that returns to the form.
- **Step form:** coral ✉ tile; "Save your poll first."; explainer ("…voters still never
  need an account."); email input; primary **Send me a magic link →** (disabled at 50%
  opacity until the email matches `/.+@.+\..+/`); text button **No thanks — just give me
  the link** (skips auth straight to Share).
- **Step link-sent:** teal ✦ tile (`success-bg`); "Check your inbox."; "We sent a magic
  link to **{email}**…"; a **mock inbox row** (dashed card: ✉ · "This or That" ·
  "Confirm & publish your poll →"); primary **Open the magic link →** which stands in
  for tapping the emailed link and **publishes** the poll → Share; "Didn't get it?…".
- **Behavior/auth model:** magic-link (passwordless). Real build: submitting emails a
  signed link; clicking it verifies + creates the account/session and publishes the poll.
  Skipping publishes anonymously (maker can claim later). Voters never authenticate.

### 5. Share + link unfurl (`/create` success, or post-verify)

- **Purpose:** confirm live + give share surfaces.
- **Layout:** centered column, max 600px.
- **Components:** coral ✓ badge (pop-in); H1 "Your poll is live."; a **short-link row**
  (`thisor.that/mxk29`, Space Grotesk) with a coral **Copy link** button (→ "Copied!"
  for 1.6s); a row of tiles: **QR** (striped placeholder — generate a real QR),
  **Share…** (native share sheet), **live vote counter**; an **OG unfurl preview**
  ("How your link looks when shared") — a chat bubble containing the link-unfurl card:
  a coral|teal split banner (option labels, or their photos, + VS badge), then
  domain / question title / "● Tap to vote · live poll". Primary **Preview the voter
  link →** (opens the voter cold-open for this poll) and **Go to my polls**.
- **Production note:** the unfurl must be a real **OG image** (`/api/og` dynamic image +
  `og:title`/`og:image` meta) so link previews render in iMessage/WhatsApp/Slack. This is
  a key acquisition surface.

### 6. Voter — vote (cold-open, `/p/[slug]`)

- **Purpose:** what a friend sees opening the shared link. Highest-traffic screen.
- **Layout:** minimal chrome — small centered top bar (logo + "Create your own →"),
  centered content max 1000px, "Made with This or That" footer. **No maker nav.**
- **Components:** attribution eyebrow ("● {Maker} asked", avatar = initial); big H1
  question; live sub "● {N} votes · tap to add yours"; **two large tappable panels**
  (side-by-side ≥ ~720px via `flex-wrap`, else stacked) with a center VS badge — same
  visual as the maker vote: photo → full-bleed `background-image` + bottom gradient +
  white label; no photo → centered display label on white (A) / sand (B); A/B corner
  badge. Panels lift + colored border/glow on hover, press on click. Caption "One tap to
  vote — completely anonymous, no sign-up."
- **Behavior:** one tap = one vote → animated results (below). Enforce one-vote-per-person
  without accounts via device/cookie heuristic (accept some noise for low-stakes polls).

### 7. Voter — results / closed

- After voting (or returning), the voter view swaps to results: status pill (**Live · N
  votes** teal, or **Voting closed** sand), centered question, the two result rows
  (A coral / B teal: badge, label, winner ★ pill, big %, animated bar over a sand track),
  a note ("You picked **X**. Results update…" or "This poll has closed — here's how it
  landed."), and a coral **Create your own poll →** (the acquisition loop).
- **Three variants to build:** not-yet-voted (vote screen), just-voted/return
  (results w/ "you picked"), and closed (final results, no voting).

### 8–9. Maker preview — vote / results (`/create` preview)

- The maker's own preview of the voting + results experience (same components as the
  voter/detail results but inside maker chrome with a Home/My-polls header). In the real
  app this can simply reuse the voter route in a preview mode; kept here for parity.

### 10. Dashboard (`/dashboard`)

- **Purpose:** manage all polls.
- **Layout:** own sticky header (logo, **＋ New poll**, avatar "O"); centered content max
  1100px.
- **Components:** H1 "Your polls" + subtitle; **3 stat cards** (total polls / active /
  votes); a **segmented filter** (All / Active / Closed, sand track, white active chip);
  a `flex-wrap` **grid of poll cards**. Each card (white, radius 22, clickable → detail):
  status pill (green "Active" / sand "Closed") + relative age; question; both options
  with label, % (coral/teal), and a mini bar; footer row with total votes, a
  **Close/Reopen** toggle (stops propagation), and "View →". Empty state for filters with
  no matches (CTA to create).

### 11–12. Poll detail — active / closed (`/dashboard/[id]`)

- **Purpose:** results + light analytics + management for one poll.
- **Layout:** own header; centered content max 900px.
- **Components:** "← All polls" back; status pill + "Created {age}"; big question;
  **short-link row** with dark **Copy link**; **Results card** (A/B rows: 44px badge,
  label, winner ★, big %, per-option vote count, animated bar); a 2-column `flex-wrap`
  panel — **Votes over time** (7-bar mini chart, last bar coral, rest `#E4D8C8`) and
  **Recent votes** (avatar initial or "?" for anonymous, name, colored dot + "Voted A/B",
  relative time); actions row: dark **Open voter link →**, outline **Close/Reopen poll**,
  outline **Back to dashboard**.

---

## Interactions & behavior

- **Navigation:** prototype is a single component switching `view`/`screen`. In Next.js,
  map to routes (see below). Every "Create a poll" / "Create your own" CTA → create flow.
- **One tap = one vote.** The tap _is_ the vote; identity (optional name) and results
  come after. Don't gate voting behind anything.
- **Animations:** percentage + total count-up over ~0.85–1.1s, ease-out cubic
  (`1 - (1-t)³`); bars transition width; winner row/badge appears at the end. Modal card
  rises/pops in (~0.3s). Pills use a 1.6s pulse on the live dot. Cards fade-up on view
  change.
- **Hover/active:** hero rows and vote panels translateY up with a colored shadow on
  hover and settle slightly on active/press. Copy button → "Copied!" for 1.6s.
- **Form validation:** email must match `/.+@.+\..+/` to enable the magic-link button.
- **Responsive:** mobile-first. Two-up matchups stack below ~720px; nav collapses/centers
  below 560px; type scales via `clamp()`. Hit targets stay generous.

## State management

Prototype state (per session): `view`, `screen`, option `textA/textB` + `imgA/imgB`
(data URLs), `question`, `voted`, animated display values, `copied`, email modal
(`emailModal`,`emailStep`,`email`), a `polls[]` array (id, slug, question, a/b {label,
votes}, status, age, maker), `detailId`, `pollFilter`, voter state
(`voterPollId`,`voterScreen`,`voterVoted`), and the interactive hero pick.

Real app data model (suggested):

- **Poll**: id, slug, question, options[2] {label, imageUrl}, status
  (`active`|`closed`), createdAt, ownerId (nullable for anonymous).
- **Vote**: id, pollId, optionIndex, voterFingerprint (cookie/device), name?, createdAt.
- **User** (maker): id, email (magic-link/passwordless), createdAt.
- Results = aggregate vote counts per option; "recent votes" = latest N votes; "votes
  over time" = counts bucketed by day. Consider realtime (websocket/SSE) so results feel
  live; refresh-on-load is an acceptable v1.

---

## Suggested Next.js + Tailwind mapping

- **Routes (App Router):** `/` landing · `/create` (create + email modal + share as steps
  or nested) · `/auth/verify` (magic-link landing → publish) · `/p/[slug]` voter
  cold-open (server-renders poll; shows vote / results / closed by status + a "has this
  device voted" cookie) · `/dashboard` · `/dashboard/[id]` detail · `/api/og` dynamic
  unfurl image.
- **Tailwind theme:** put the color table into `theme.extend.colors`
  (`bg`, `ink`, `sand`, `coral`, `teal`, …), add the three font families to
  `fontFamily`, and the shadows to `boxShadow`. Load fonts via `next/font/google`
  (Bricolage Grotesque, Hanken Grotesk, Space Grotesk).
- **Components:** `OptionCard` (create), `MatchupPanel` (vote, A/B variant),
  `ResultRow` (bar + %), `PollCard` (dashboard), `StatusPill`, `ShareUnfurl`,
  `EmailModal`. Keep the coral=A / teal=B convention as a variant prop.
- Drop the "Preview states" switcher (it's a prototype-only affordance).

## Assets

- **Fonts:** Bricolage Grotesque, Hanken Grotesk, Space Grotesk (Google Fonts).
- **Icons/glyphs:** simple Unicode/emoji in the prototype (✓ ✦ ✉ ★ ↗ ☝ ✕ 🔥 👑 ⚔ ＋).
  Replace with your icon set (e.g. Lucide) in production.
- **Images:** user-uploaded option photos (data URLs in the prototype → real upload
  pipeline: resize, store, moderate). **QR code** and **OG unfurl image** are placeholders
  → generate for real.
- No proprietary/brand assets are used; all styling is original.

## Files

- `This or That Site.dc.html` — the full high-fidelity prototype (all screens/states).
  Open in a browser to explore; use the bottom-left "Preview states" switcher to jump
  between states. `support.js` (included) is the prototype runtime only — not part of the
  production build.
