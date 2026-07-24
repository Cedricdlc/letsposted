# Hero dark DA pivot — design

**Status:** Both previously-open inputs (palette, phase-2 content) are now resolved below with Cédric's reference images. Ready for the implementation plan pending his final read of this doc.

## Context

The vertical pinned-scroll mechanic (`position:sticky` hero + `IntersectionObserver` phrase/badge crossfade) shipped and was validated live on 2026-07-24 ("la mécanique fonctionne, bravo, c'est super"). This spec covers a visual/structural pivot on top of that same scroll mechanic — the scroll wiring itself does not change, only what's rendered.

Cédric supplied 4 reference images during a voice-dictated design review, each anchoring a different part of this spec:
- A dark, minimal geometric device-frame mockup ("The mobile first company") — tone/finish reference.
- A Linktree marketing section (visual left, bold headline + subtext + CTA right) — layout reference for the hero split.
- A dark "Scanning platforms…" card listing scored Reddit/X posts (8.0–9.0) — content reference for one animation state.
- A dark "New Lead / Not Relevant" card with struck-through irrelevant messages — content reference for another animation state.
- A phone/device skeleton with a single soft glow in one corner, otherwise empty — content reference for the hero's opening (idle) state.

## Goal

Replace the current light hero (centered text + pulsing SVG "hub" diagram) with a dark, split-screen hero: an evolving "screen" mockup on the left that illustrates each phrase, and larger headline text on the right. Same 4 scroll-triggered phrases as today, same `#hero-form` capture zone at the end, same nav CTA behavior — only the visual treatment and layout change.

## What changes in `landing/index.html`

### 1. Palette flips to dark, page-wide

`index.html` today is entirely the nav + hero + capture zone — no sections below it (How It Works and Guides were split out in the prior pivot). So the dark theme applies by changing the `:root` token *values* directly (not a scoped override), and everything on the page — including the platform-readiness modal, which reuses `var(--card)`/`var(--ink)`/etc. — inherits it automatically. `how-it-works.html`, `guides.html`, and `use-case.html` keep their own light token copies (self-contained per page, per existing convention) — this pivot does not touch them.

**Resolved.** Cédric sent a reference mockup ("The mobile first company") for tone/palette. Proposed values below are read off that screenshot by eye, not pixel-sampled — close enough to build with; easy to nudge later since they all live in one `:root` block:

```
--bg:        #0B0B0A   /* near-black page background */
--card:      #171613   /* card / screen-frame surface, one step up from bg */
--card-2:    #1E1D19   /* nested surface (e.g. inner rows inside a card) */
--line:      #2C2A25   /* card borders */
--line-soft: #221F1B
--ink:       #F5F3EC   /* headline text */
--body:      #A8A399   /* secondary/body text */
--faint:     #6E6A60   /* placeholder/meta text */
--accent:    #F2E96A   /* unchanged — existing brand yellow already matches */
--accent-2:  #C9A800   /* unchanged */
--ok:        #4ADE80   /* unchanged token, now actually used: outreach-card green (image 106) */
```

The existing yellow accent tokens carry over unchanged — they already match the reference. Solid-yellow-fill + black-text buttons (as in the reference's "Contact us" button) are a nice-to-have visual note but not required: the current `.btn`/`.cap-btn` styling already does yellow-fill-dark-text, so this falls out for free.

### 2. Hero layout: left animation column / right text column

Replaces today's centered `.hero-pin` (badge above headline above SVG diagram). Structure, desktop (≥900px):

- `.hero-pin` becomes a 2-column grid: `.hero-screen` (left) and `.hero-phase-zone` (right), vertically centered, still `position:sticky` inside the same trigger-grid mechanic as today — nothing about *how* stickiness/scroll-spy works changes, only what's inside `.hero-pin`.
- `.hero-phase-zone` text becomes larger (roughly hero-headline scale, bigger than today's `clamp(1.5rem,4vw,2rem)`) since it no longer shares the column with a badge and diagram above it.
- The current `.hero-pin-badge` ("Built for Solo SaaS Founders") and the `.hero-bcast` SVG hub/badge diagram are removed entirely — confirmed explicitly ("ça ne va pas du tout du tout").
- Mobile (<900px): stays the existing stacked, non-pinned fallback (all 4 phrases visible in flow) — the left/right split is a desktop-only affordance, same as the current `.hero-bcast` was desktop-only. `.hero-screen` collapses above the text on mobile, showing only its phase-1 (idle) state statically — no animation on mobile, matching how the current mechanic already disables scroll-driven animation below 900px.
- `prefers-reduced-motion`: same pattern already established for the current hero — static fallback stacked, `.hero-screen` shows the phase-1 idle state only, no animated glow/list transitions.

### 3. `.hero-screen`: one evolving mockup, not four separate illustrations

A single persistent device/screen frame (dark rounded rectangle with a corner glow, styled after Cédric's "device skeleton" reference) whose *inner content* changes per active phrase — not four unrelated graphics. Reuses the existing `[data-hero-frame]`/scrollspy wiring: add a parallel set of `[data-hero-screen-state]` elements inside `.hero-screen`, toggled by the same `applyActive()` step number the phrase text already uses.

| Phrase | Screen state |
|---|---|
| 1. "Stop procrastinating on your business launch." | Empty frame, single soft glow rotating/pulsing in one corner. Minimal — establishes the frame before anything happens. |
| 2. "No posts. No leads. And you know it." | **Resolved.** "AI Outreach Agent" chat card (Cédric's reference image): a dark DM-thread mockup — small header with a chat icon, label "AI Outreach Agent", and an "Enabled" toggle lit in `--ok` green top-right; below it, one outbound message bubble (green-tinted, "you") referencing a lead's own post and offering the tool, then one inbound reply bubble ("Lead", neutral gray) showing interest. Static content, fades/slides in on activation like the phase-3/4 cards — same non-live-data caveat as the rest of the hero. |
| 3. "We find the right platforms for your niche and do the posting for you." | Frame fills with the "Scanning platforms…" card: a static list of 3-4 scored posts (source badge, timestamp, snippet, score chip), fading/sliding in when this phrase becomes active — matching Cédric's reference image. Not an auto-scrolling ticker; it appears once and holds. |
| 4. "Get your first customers. Not just views." | Frame swaps to the "New Lead / Not Relevant" card: tagged messages, irrelevant ones shown struck-through, matching Cédric's reference image. |

Both card states (3 and 4) are static illustrative markup with representative placeholder content (not live data) — same spirit as the rest of the hero, which has never been backed by real per-visitor data.

### 4. Nav CTA — unchanged

The floating pill nav and its always-visible "Get my platform plan" CTA keep their current behavior (fixed position, `scrollIntoView` to `#hero-form`). Confirmed explicitly out of scope for this pass. CTA copy itself is also explicitly deferred ("on verra après, on va laisser comme ça").

### 5. Lead-magnet modal: dark styling + one new blurred teaser card

The functional mechanism is unchanged: `#capture-form-hero` (URL only) → `runReadinessCheck()` opens `#platform-modal-backdrop` → loading state → result → `#leadmagnet-modal` (email, "we'll send your priority launch plan within 24h"). No backend or JS logic changes — confirmed explicitly ("on garde ce qu'on a aujourd'hui... on verra le lead magnet après").

Today, `renderReadiness()` only ever renders a single real PageSpeed-derived score (0–100) into `#ready-result-modal` — there is no "platforms found" or "posts identified" count anywhere in the current code, live or dormant (the dormant `platformPreviews()`/`platformCardsInner()` render 3 platform cards with reach stats, which is a different shape of content and stays dormant/untouched).

What's added: a new static, generic teaser element inside `#ready-result-modal`, alongside (not replacing) the existing PageSpeed score — styled as a locked/blurred card in the same visual language as the hero's "Scanning platforms" / "New Lead" cards, showing placeholder copy like "2 platforms to post on" and "23 posts identified" with a `filter:blur(...)` treatment and a lock affordance, sitting visually above the email field so entering an email reads as "unlocking" it. The numbers are fixed placeholder text, not computed — matches Cédric's explicit "on garde ce qu'on a aujourd'hui" (no new analysis logic) while giving the visual "we already found something for you" cue he described. The modal's existing light-palette CSS custom properties inherit the page's new dark `:root` values automatically, so it reads as a natural continuation of the dark hero rather than a jarring light popup.

## What does not change

- The `position:sticky` + `IntersectionObserver` scroll-trigger mechanic itself (file: same `#hero-scroll` root, same `[data-hero-step]` triggers).
- The 4 hero phrase strings.
- `#capture-form-hero` / `#cap-url-hero` field IDs and the Netlify form wiring.
- `runReadinessCheck()` / `openPlatformModal()` control flow.
- `how-it-works.html`, `guides.html`, `use-case.html` — untouched, stay light-themed.
- Nav CTA text, link target, and click-to-scroll/focus behavior.

## Open items

None blocking. The `:root` palette values above are read by eye off Cédric's reference screenshot, not pixel-sampled — if he has exact hex codes from a design tool, swapping them in later is a one-block edit with no structural impact.
