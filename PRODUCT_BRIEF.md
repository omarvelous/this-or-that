# This or That — Product Brief

A frictionless micro-app for getting a quick gut-check between options. Someone
creates a matchup (photos, text, or both), shares one link, and friends vote in a
single tap — no account required. Think Doodle's zero-friction ethos, applied to
"which one?" decisions.

---

## The premise

People constantly ask their group chats "A or B?" — which cover, which outfit,
which logo, which apartment, which name. Those threads are messy: votes scatter,
you re-count screenshots, latecomers can't catch up. **This or That** turns that
into a single shareable link with a live, tallied result.

**Core loop:** Create → Share → Vote → Results.

**Guiding principle:** nothing should stand between a friend and casting a vote.
No sign-up, no app install, no learning curve. The maker may have an account
(to manage polls); **voters never need one.**

---

## Who it's for

- **Makers** — anyone with a low-stakes decision and a group whose opinion they
  want: designers, creators, shoppers, event planners, indecisive friends.
- **Voters** — the maker's friends/audience. They arrive via a link (DM, group
  chat, story, QR) and should be able to vote within ~2 seconds of landing.

---

## Business model

Freemium, low barriers to entry:

- **Free:** create polls, share links, unlimited voting, basic live results.
- **Paid (later):** more than two options / advanced formats (bracket, gauntlet),
  private/results-hidden-until-close polls, custom branding, audience analytics,
  longer retention, remove watermark.

The free tier must feel generous enough to spread organically — every shared link
is an acquisition surface.

---

## Voting formats (prototyped)

We explored four survey shapes. All share the same create → share → vote →
results skeleton and the same visual system.

1. **Classic A/B (one-tap)** — two options head-to-head, single anonymous tap,
   animated percentage reveal. The fastest possible path. _(prototype: `1a`/`1b`)_

2. **Split + name-after** — full-bleed split voting screen; because the tap _is_
   the vote, the optional "who's voting?" step appears **after** you pick (and is
   skippable), so nothing slows the vote itself. _(prototype: `2a`)_

3. **Gauntlet (king-of-the-hill)** — a reigning pick faces a new challenger each
   round. Win and it **holds its slot**; lose and the challenger takes the crown.
   Ends in a ranked leaderboard. Good for "rank these" from a pile of options.
   _(prototype: `3a`)_

4. **Bracket (single elimination)** — seed 8 contenders, tap through every
   matchup (quarters → semis → final). A readable summary appears **between
   rounds**, and the champion screen shows the full bracket. _(prototype: `3b`)_

Formats 1–2 are the free core; 3–4 are natural premium upsells.

---

## Content types

Each option can be **text, an image, or both**:

- **Text** — a word, name, or short phrase.
- **Image** — uploaded from library or camera. In setup, a photo button sits
  beside each option; once added, its thumbnail is shown prominently.
- Links/URL previews were scoped but not prototyped — a future addition.

**Image handling decisions (from prototyping):**

- Voting panels show the **whole image** (contained) over a blurred fill of
  itself — no aggressive cropping.
- A **"view full"** control opens the complete image in a fullscreen lightbox.

---

## Key UX decisions (validated in prototype)

- **One tap = one vote.** The vote is the primary action; everything else
  (naming yourself, seeing results) comes after or is optional.
- **Name is optional and post-vote.** Asking up front adds friction; asking after
  (skippable) lets voters attach identity without slowing the tap.
- **Results feel alive.** Animated percentage bars, running vote count, a clear
  winner moment, live "updates as votes come in" framing.
- **Mobile-first.** Phone is where links get opened; every hit target is generous.
- **Share surfaces:** copyable short link + QR + native share sheet.

---

## Screen inventory (per format)

- **Create/Setup** — question field + option inputs (text and/or photo). Bracket
  seeds 8 vertically; Gauntlet takes an add/remove contender list.
- **Share** — "your poll is live," short link + copy, QR, share sheet, live vote
  counter; entry points to preview voting or jump to results.
- **Vote** — the format-specific matchup; one tap casts a vote.
- **Results** — A/B percentage split + winner; Gauntlet ranked leaderboard;
  Bracket champion + full bracket recap.

---

## Two visual directions explored

- **Sunset** — playful & bold; warm cream background, coral + teal accents,
  Bricolage Grotesque / Hanken Grotesk.
- **Electric** — trendy & social (Gen-Z); near-black background, lime + violet
  neon accents, Space Grotesk.

Both are the same component parametrized by theme — a good sign the design system
is coherent enough to skin.

---

## Open questions for the build

1. **Auth model** — makers likely need lightweight accounts (magic link / social)
   to manage polls; confirm voters stay fully anonymous, and how anti-abuse
   (one-vote-per-person) is enforced without accounts (device fingerprint? cookie?
   IP heuristics? accept some noise for low-stakes polls?).
2. **Realtime** — do results update live for viewers (websockets) or on refresh?
3. **Poll lifecycle** — open forever, or close by time/vote-count? Editable after
   publish? Deletable?
4. **Media storage & moderation** — image upload pipeline, resizing, abuse
   reporting/takedown for public links.
5. **Link/QR** — short-link service, OG image generation for rich unfurls in chats.
6. **Results privacy** — always visible vs. hidden until you vote vs. hidden until
   close (premium).
7. **Free/paid boundary** — exactly which formats/limits gate to paid.
8. **Scale of a poll** — 2 options (free) vs. many (bracket/gauntlet); max
   contenders; how ties are handled.

---

## Prototype reference

The interactive prototype lives in this project as a set of Design Components
(phone-framed, clickable end-to-end):

- `This or That.dc.html` — the canvas presenting all options side by side.
- `Poll.dc.html` — classic A/B flow (themeable: sunset/electric).
- `Poll2.dc.html` — split + name-after flow.
- `Gauntlet.dc.html` — king-of-the-hill format.
- `Bracket.dc.html` — single-elimination format.

These are design artifacts (client-side, in-memory state; uploaded photos reset on
reload). They define intended UX, layout, copy, and interaction — not the
production architecture.
