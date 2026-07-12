# Design Implementation Plan

> Transforms the functional MVP into the polished design from the design handoff.
> Each phase = a logical group of commits. Steps within a phase are sequential.

---

## Decisions Log

| Question        | Decision                                                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color system    | Two themes via CSS custom properties: "default" (current Geist/slate) and "warm" (design's cream/coral/teal). No runtime switcher needed yet — just the token layer. |
| Typography      | Same approach — theme-scoped. Geist for "default", Bricolage Grotesque + Hanken Grotesk + Space Grotesk for "warm".                                                  |
| Routes          | `/p/[shortId]` = voter (public). `/polls/[shortId]` = maker detail. `/polls/[shortId]/share` = post-creation share screen. `/polls/new` stays. `/dashboard` stays.   |
| Auth flow       | Inline email modal on create page (design's approach). Keep `/login` as fallback.                                                                                    |
| Share placement | Post-creation at `/polls/[shortId]/share`. Remove from results page.                                                                                                 |
| Poll detail     | `/polls/[shortId]` = maker's dashboard detail view (stats, recent votes, management actions).                                                                        |
| Landing hero    | Simple static first, structured to add interactivity later.                                                                                                          |
| Scope           | Everything in the design handoff, phased for incremental completion.                                                                                                 |

---

## Route Map (Final)

```
Public (no auth)
  /                          Landing page (marketing)
  /p/[shortId]               Voter vote page (anonymous)
  /p/[shortId]/results       Voter results page
  /login                     Standalone login (fallback)

Auth required
  /polls/new                 Create poll + inline email modal
  /polls/[shortId]           Maker poll detail (stats, management)
  /polls/[shortId]/share     Post-creation share screen
  /dashboard                 Maker poll list

API
  POST   /api/polls                         Create poll
  GET    /api/polls/[shortId]               Fetch poll (exists, used by OG)
  PATCH  /api/polls/[shortId]               Update poll
  DELETE /api/polls/[shortId]               Soft-delete poll
  POST   /api/polls/[shortId]/vote          Cast vote
  PATCH  /api/polls/[shortId]/vote          Update voter name
  GET    /api/polls/[shortId]/results       Vote aggregation
  POST   /api/polls/[shortId]/upload        Image upload
  GET    /api/polls/[shortId]/og            OG image generation
```

---

## Phase 1: Theme Infrastructure

Foundation layer. No visual changes to existing pages — just the token system.

### Step 1.1: Theme tokens in CSS

**Modify:** `src/app/globals.css`

- Define a `[data-theme="default"]` block with current colors/fonts mapped to semantic tokens
- Define a `[data-theme="warm"]` block with the design's full token set:
  - Colors: `bg`, `ink`, `body`, `muted`, `muted-2`, `surface`, `sand`, `line`, `coral`, `teal`, `coral-tint`, `teal-tint`, `success-bg`, `success-ink`, `dark-panel`
  - Shadows: card-float, cta-glow, vote-hover-a, vote-hover-b, switcher-dark
  - Radii: input (14-16px), card (18-26px), pill (full), icon-tile (9-16px)
- Both themes share the same `@theme inline` token names so components are theme-agnostic
- `:root` defaults to `[data-theme="warm"]` (the design theme)

**Commit:** `style: add dual-theme CSS token system`

### Step 1.2: Google Fonts for design theme

**Modify:** `src/app/layout.tsx`

- Import Bricolage Grotesque (600, 700, 800), Hanken Grotesk (400–800), Space Grotesk (500–700) from `next/font/google`
- Apply font CSS variables alongside existing Geist ones
- Theme tokens reference the appropriate font family per theme

**Commit:** `style: add design theme fonts (Bricolage, Hanken, Space Grotesk)`

### Step 1.3: Update Tailwind `@theme inline` mapping

**Modify:** `src/app/globals.css`

- Map all semantic tokens into `@theme inline` so Tailwind classes like `bg-surface`, `text-ink`, `text-coral`, `shadow-card-float` etc. work
- Remove old hardcoded color values from the `@theme` block

**Commit:** `style: wire theme tokens into Tailwind`

---

## Phase 2: Route Restructuring

Move pages to match the final route map. Functional, not visual.

### Step 2.1: Create voter route `/p/[shortId]`

**Create:** `src/app/p/[shortId]/page.tsx` — copy logic from current `src/app/polls/[shortId]/page.tsx`
**Create:** `src/app/p/[shortId]/results/page.tsx` — copy from current results page

These are the public voter-facing pages. They do NOT require auth.

**Commit:** `feat: add voter routes at /p/[shortId]`

### Step 2.2: Create share route `/polls/[shortId]/share`

**Create:** `src/app/polls/[shortId]/share/page.tsx`

- Auth-gated (maker only)
- Shows: success badge, short link + copy, QR code, OG unfurl preview, "Preview voter link" CTA, "Go to my polls" link
- Poll creation form redirects here instead of `/polls/[shortId]`

**Modify:** `src/components/poll-form.tsx` — redirect to `/polls/${shortId}/share` after creation

**Commit:** `feat: add post-creation share screen`

### Step 2.3: Repurpose `/polls/[shortId]` as maker detail

**Modify:** `src/app/polls/[shortId]/page.tsx`

- Auth-gated: if not the creator, redirect to `/p/[shortId]` (voter view)
- Shows: poll status, question, short link, results card (A/B bars), votes-over-time placeholder, recent votes list, management actions (close/reopen, delete, open voter link)

**Commit:** `feat: repurpose /polls/[shortId] as maker detail view`

### Step 2.4: Update all internal links

**Modify:** Multiple files

- Dashboard poll cards → link to `/polls/[shortId]` (maker detail)
- VotingUI post-vote redirect → `/p/[shortId]/results` (voter results)
- Share panel voter link → `/p/[shortId]`
- Proxy protected routes → add `/polls/[shortId]/share`
- OG metadata on voter page → use `/p/[shortId]` URLs
- Update `generateMetadata` on both `/p/` and `/polls/` routes

**Commit:** `fix: update internal links to match new route structure`

---

## Phase 3: Shared Components

Build the design system components. Theme-agnostic (they use semantic tokens). Built in isolation — not wired into pages yet.

### Step 3.1: Layout shell — Header + Footer

**Create:**

- `src/components/site-header.tsx` — sticky translucent header: logo, nav links (How it works, My polls), Create CTA. Collapses below 560px.
- `src/components/site-footer.tsx` — simple branding + tagline
- `src/components/layout-shell.tsx` — wraps children with header + footer for public pages

**Commit:** `feat: add site header, footer, and layout shell`

### Step 3.2: StatusPill + OptionBadge

**Create:**

- `src/components/status-pill.tsx` — colored pill (live/closed/draft/expired) using theme tokens
- `src/components/option-badge.tsx` — circular A/B badge (coral/teal) in multiple sizes

**Commit:** `feat: add StatusPill and OptionBadge components`

### Step 3.3: OptionCard (create flow)

**Create:** `src/components/option-card.tsx`

- White card with line border, radius 22
- A/B badge, label input (Display font, sand fill)
- Photo control: dashed "+ Add a photo" button → 16:10 preview with change/remove overlays
- Used in the create form

**Commit:** `feat: add OptionCard component for create flow`

### Step 3.4: MatchupPanel (vote flow)

**Create:** `src/components/matchup-panel.tsx`

- Large tappable panel for voter page
- Two variants: with photo (full-bleed bg + gradient + label), without photo (centered label)
- A/B badge corner, hover lift + colored shadow
- Side-by-side above 720px, stacked below

**Commit:** `feat: add MatchupPanel component for vote flow`

### Step 3.5: ResultRow + AnimatedBar redesign

**Modify:** `src/components/animated-bar.tsx` → rename/redesign as `result-row.tsx`

**Create:** `src/components/result-row.tsx`

- 44px circular badge, label, winner ★ pill, large percentage number
- Per-option vote count
- Animated bar over sand track (coral A / teal B)
- Count-up animation: ~1s ease-out cubic

**Commit:** `feat: add ResultRow component with count-up animation`

### Step 3.6: PollCard (dashboard)

**Modify:** `src/components/poll-list.tsx` → extract/redesign card

**Create:** `src/components/poll-card.tsx`

- White card, radius 22
- Status pill + relative age
- Question text
- Both options: label, %, mini bar (coral/teal)
- Footer: total votes, close/reopen toggle, "View →"

**Commit:** `feat: add PollCard component for dashboard`

### Step 3.7: IdentityModal (shared modal for create + vote flows)

**Create:** `src/components/identity-modal.tsx`

- Centered modal, cream bg, radius 26, max 420px, backdrop blur
- Close button (✕)
- Two modes, controlled by a `mode` prop:

  **Mode: "create" (maker auth)**
  - Coral ✉ tile, "Save your poll first", email input, "Send me a magic link →" (disabled until email valid), "No thanks — just give me the link" (skip)
  - On submit: Supabase signInWithOtp → transition to "sent" state
  - Sent state: Teal ✦ tile, "Check your inbox", mock inbox row, "Open the magic link →"

  **Mode: "vote" (voter identity)**
  - Teal tile, "Add your name?" heading, "Optional — show others who voted."
  - Name input (max 50 chars, autofocus)
  - Email input (optional, for future notifications: "Get notified when results change")
  - Primary: "Vote →" (casts the vote with name/email attached)
  - Text: "Skip — just vote" (casts vote without identity)
  - Both paths trigger the actual vote submission, then redirect to results

- Same visual structure, different content — one component, consistent UX pattern

**Commit:** `feat: add IdentityModal for create-flow auth and vote-flow identity`

### Step 3.8: ShareView (post-creation)

**Create:** `src/components/share-view.tsx`

- Coral ✓ badge (pop-in animation)
- "Your poll is live" heading
- Short link row (Space Grotesk) + coral Copy button → "Copied!" 1.6s
- Tile row: QR code, Share… button, live vote counter
- OG unfurl preview card (chat bubble mockup)
- "Preview the voter link →" + "Go to my polls"

**Commit:** `feat: add ShareView component`

---

## Phase 4: Landing Page

### Step 4.1: Landing page — hero section

**Modify:** `src/app/page.tsx`

- Wrap in `LayoutShell`
- Hero: 2-column flex-wrap (copy left + preview card right), stacks below 720px
- Copy: eyebrow pill, H1 "Settle it in one tap", paragraph, dual CTAs (Create + See how it works)
- Preview card: static matchup card (placeholder for future interactivity, structured with the right markup/styles so animation can be layered on)

**Commit:** `feat: add landing page hero section`

### Step 4.2: Landing page — How it works + value band

**Modify:** `src/app/page.tsx`

- How it works: 4-card row (Create, Share, Vote, Results) with alternating coral/teal numbered badges
- Value band (dark panel): "Built for the group chat" + stat tiles (2s / 0 / 1)
- Closing CTA: "What's it gonna be?" + Create button

**Commit:** `feat: add landing page how-it-works and value band`

---

## Phase 5: Create Flow Redesign

### Step 5.1: Redesign create page with OptionCards

**Modify:** `src/app/polls/new/page.tsx`, `src/components/poll-form.tsx`

- Replace current form with design layout:
  - Eyebrow: "Step 1 · Create"
  - H1: "Set up your matchup"
  - Question input (sand fill, 280 char max)
  - Two `OptionCard` components with VS badge between
  - Full-width "Create poll →" button
- On submit (if not authenticated): show `EmailModal` instead of redirecting to /login
- On submit (if authenticated or skip): create poll → redirect to `/polls/[shortId]/share`

**Commit:** `feat: redesign create flow with option cards and email modal`

### Step 5.2: Wire up share page

**Modify:** `src/app/polls/[shortId]/share/page.tsx`

- Fetch poll data server-side
- Render `ShareView` component with real short link, QR code, vote counter
- Auth-gated: only creator can see

**Commit:** `feat: wire up post-creation share page`

---

## Phase 6: Voter Experience Redesign

### Step 6.1: Voter vote page `/p/[shortId]`

**Modify:** `src/app/p/[shortId]/page.tsx`

- Minimal chrome: small centered top bar (logo + "Create your own →")
- Attribution eyebrow: "● {Maker} asked" (fetch creator display_name)
- Big H1 question
- Live sub: "● {N} votes · tap to add yours" (pulsing dot)
- Two `MatchupPanel` components (side-by-side ≥720px, stacked below) + VS badge
- Caption: "One tap to vote — completely anonymous, no sign-up."
- **Vote flow (mirrors create flow pattern):**
  1. Voter taps an option → selected option is stored in state (vote NOT yet cast)
  2. `IdentityModal` appears in "vote" mode (name + optional email, skippable)
  3. On "Vote →" or "Skip — just vote": the actual `POST /api/polls/[shortId]/vote` fires with name/email attached
  4. On success → redirect to `/p/[shortId]/results`
  5. On 409 (duplicate) → show "already voted" message + link to results
- This replaces the current post-vote `NamePrompt` component

**API change:** Update `POST /api/polls/[shortId]/vote` to accept optional `voterName` and `voterEmail` fields on the initial vote submission. The separate `PATCH` endpoint for voter name becomes a legacy fallback. Add `voter_email` column to the `votes` table (new migration).

**Commit:** `feat: redesign voter vote page with matchup panels and pre-vote identity modal`

### Step 6.2: Voter results page `/p/[shortId]/results`

**Modify:** `src/app/p/[shortId]/results/page.tsx`

- Status pill: Live or Voting closed
- Centered question
- Two `ResultRow` components (A coral / B teal)
- "You picked X" note (or closed message)
- "Create your own poll →" CTA (acquisition loop)
- Live polling still every 2.5s

**Commit:** `feat: redesign voter results page with result rows`

---

## Phase 7: Maker Experience Redesign

### Step 7.1: Dashboard redesign

**Modify:** `src/app/dashboard/page.tsx`, `src/components/poll-list.tsx`

- Own header: Logo + "+ New poll" button + avatar
- H1: "Your polls" + subtitle
- 3 stat cards: Total polls / Active / Votes collected
- Segmented filter: All / Active / Closed (sand track, white active chip)
- Poll grid using `PollCard` components (flex-wrap)
- Empty state: "Nothing here yet" + CTA

**Commit:** `feat: redesign dashboard with stat cards and poll grid`

### Step 7.2: Maker poll detail `/polls/[shortId]`

**Modify:** `src/app/polls/[shortId]/page.tsx`

- Auth-gated: if not creator → redirect to `/p/[shortId]`
- "← All polls" back link
- Status pill + "Created {age}"
- Big question
- Short-link row + Copy button
- Results card (A/B `ResultRow` components)
- 2-column panel:
  - **Votes over time:** 7-bar mini chart placeholder (last bar coral, rest sand)
  - **Recent votes:** avatar initial, name, "Voted A/B", relative time
- Actions: "Open voter link →", "Close/Reopen poll", "Back to dashboard"

**Commit:** `feat: add maker poll detail view`

---

## Phase 8: Polish + Animations

### Step 8.1: CSS animations

**Modify:** `src/app/globals.css`

- Add `@keyframes`: fadeUp, pop, pulse, rise, floaty
- Percentage/count-up: ~1s ease-out cubic
- Bar width transition
- Modal rise/pop-in: ~0.3s
- Live dot pulse: 1.6s
- Card fade-up on view change
- Hover lift + shadow for cards and vote panels

**Commit:** `style: add design animations and transitions`

### Step 8.2: Responsive refinements

**Modify:** Multiple components

- Vote panels: side-by-side ≥720px, stacked below
- Landing hero: 2-column → stacked below 720px
- Nav: collapses/centers below 560px
- Typography: apply `clamp()` fluid sizing from design spec
- Hit targets: ensure ≥44px on all interactive elements

**Commit:** `style: responsive refinements for mobile-first design`

### Step 8.3: OG image redesign

**Modify:** `src/app/api/polls/[shortId]/og/route.tsx`

- Update to match design's coral/teal split card style
- Use design's warm background color
- Match the "chat bubble" look from the OG unfurl preview in the design

**Commit:** `style: update OG image to match design theme`

### Step 8.4: Apply warm theme as default

**Modify:** `src/app/layout.tsx`

- Set `data-theme="warm"` on the `<html>` element
- Verify all pages render correctly with the design theme
- Fix any remaining hardcoded colors that don't use tokens

**Commit:** `style: set design theme as default`

---

## Build Order

```
Phase 1: Theme Infrastructure     1.1 → 1.2 → 1.3
Phase 2: Route Restructuring      2.1 → 2.2 → 2.3 → 2.4
Phase 3: Shared Components        3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6 → 3.7 → 3.8
Phase 4: Landing Page             4.1 → 4.2
Phase 5: Create Flow Redesign     5.1 → 5.2
Phase 6: Voter Experience         6.1 → 6.2
Phase 7: Maker Experience         7.1 → 7.2
Phase 8: Polish + Animations      8.1 → 8.2 → 8.3 → 8.4
```

Phases 1-2 are sequential prerequisites. Phases 3-7 each depend on Phase 1 (tokens) but steps within them reference specific components from Phase 3. Phase 8 is a final pass.

**Critical path:** 1 → 2 → 3 → 5 (create) → 6 (vote) → 4 (landing) → 7 (dashboard) → 8 (polish)

The create and vote flows are the core product — landing and dashboard are important but less critical.

---

## Verification Checkpoints

- After Phase 1: All existing pages still render. `npm run build` passes. Two themes defined in CSS.
- After Phase 2: Voter can reach `/p/[shortId]`, maker can reach `/polls/[shortId]`. All links resolve.
- After Phase 3: Components render in Storybook with both themes.
- After Phase 5: Full create → share flow works end-to-end.
- After Phase 6: Full vote → results flow works end-to-end.
- After Phase 7: Dashboard shows polls, detail page shows analytics.
- After Phase 8: Visual parity with design prototype. Mobile-first responsive. Animations smooth.
