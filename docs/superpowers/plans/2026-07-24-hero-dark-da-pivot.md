# Hero Dark DA Pivot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current light, centered hero (badge + phrase + pulsing SVG diagram) in `landing/index.html` with a dark, split-screen hero — an evolving "screen" mockup on the left illustrating each phrase, larger headline text on the right — plus a matching dark lead-magnet modal with a new blurred teaser card. The scroll mechanic itself (`position:sticky` + `IntersectionObserver`) does not change.

**Architecture:** Single-file change to `landing/index.html` (self-contained, inline `<style>`/`<script>`, no build system, no other landing pages touched). The existing scroll-trigger wiring (`[data-hero-step]` → `applyActive()`) is extended with one more parallel toggle target (`[data-hero-screen-state]`) alongside the existing `[data-hero-frame]` toggle — no new observers, no new mechanism.

**Tech Stack:** Plain HTML/CSS/JS, Netlify static hosting, Netlify Forms (unchanged), `netlify deploy` + `netlify api restoreSiteDeploy` for preview→prod promotion (must run from `landing/`, which holds the correct site link — running from repo root deploys to the wrong Netlify site).

## Global Constraints

- File: `landing/index.html` only. Do not touch `how-it-works.html`, `guides.html`, `use-case.html`, `privacy.html`, or the platform guide pages — they stay light-themed, untouched.
- Do not modify the scroll mechanic: `#hero-scroll` root, `[data-hero-step]` triggers, the `IntersectionObserver`/`applyActive()` control flow, `rootMargin:'0px 0px -50% 0px'`.
- Do not modify the 4 hero phrase strings (`data-hero-frame="1"`..`"4"`), `#capture-form-hero`/`#cap-url-hero` field IDs, `runReadinessCheck()`/`openPlatformModal()` control flow, `#lm-form-modal`, Netlify form names (`liste-attente`, `lead-magnet`).
- Do not change the nav CTA (`#nav-beta-cta`) text, link, or click-to-scroll/focus behavior — confirmed out of scope.
- All new colors reference `:root` custom properties — never hardcode a hex value in a new rule (the one exception, `.mark-word::after`'s inline SVG data-URI, is fixed in Task 1 as a one-line polish, not a new hardcode).
- Exact palette (from Cédric, `docs/superpowers/specs/2026-07-24-hero-dark-da-pivot-design.md`): `--bg:#161412`, `--accent:#FCF05F`. All other dark tokens below are derived by eye from those two and documented as such.
- New card-style UI states (AI Outreach Agent, Scanning platforms, New Lead/Not Relevant) show static, illustrative placeholder content — never wire them to real data. Same for the modal teaser card ("2 platforms to post on", "23 posts identified" are fixed strings, not computed).
- No automated test suite exists in this codebase (static HTML/CSS/JS, no build step). Verification throughout is manual: deploy to a Netlify preview URL and inspect with the browser tools (screenshot + real scroll, not `scrollTo`/`scrollIntoView` calls via JS-exec, which do not reliably reflect in this environment's rendered viewport — confirmed earlier in this project's session history). Test both desktop (≥900px) and mobile (<900px) widths, and `prefers-reduced-motion: reduce`.

---

### Task 1: Dark palette, background grid texture, stale comment cleanup

**Files:**
- Modify: `landing/index.html:19-30` (stale header comment), `landing/index.html:32-49` (`:root` tokens), `landing/index.html:59-67` (`body` — add grid texture), `landing/index.html:165` (`.mark-word::after` inline SVG stroke color)

**Interfaces:**
- Produces: the full dark token set every later task's CSS relies on (`--bg`, `--card`, `--card-2`, `--line`, `--line-soft`, `--ink`, `--body`, `--faint`, `--accent`, `--accent-2`, `--accent-soft`, `--accent-line`, `--grad`, `--ok`).

- [ ] **Step 1: Replace the stale top-of-file comment**

The current comment block (lines 19-30) describes a "v6 broadcast... Dark rebuild... violet gradient accent... hub-and-spoke diagram" — this predates the light-theme pivot and the vertical-scroll restoration from earlier the same day, and is actively misleading (it's dark-themed language sitting above light tokens, about to become dark-themed language sitting above different dark tokens). Replace lines 19-30:

```css
/* ============================================================
   POSTED. — LANDING
   Dark hero pivot (2026-07-24): split-screen hero, evolving
   "screen" mockup left / phrase text right, driven by the same
   position:sticky + IntersectionObserver scroll mechanic restored
   earlier the same day. See docs/superpowers/specs/2026-07-24-hero-dark-da-pivot-design.md.
   Netlify form name="liste-attente" (fields url) on the hero
   capture form, "lead-magnet" (fields url + email) in the modal.
   Only external request: Google Fonts above.
   ============================================================ */
```

- [ ] **Step 2: Flip `:root` to the dark palette**

Replace lines 32-49:

```css
:root{
  --bg:        #161412;
  --card:      #201D19;
  --card-2:    #29251F;
  --line:      #38332B;
  --line-soft: #2A251F;
  --ink:       #F5F3EC;
  --body:      #A8A399;
  --faint:     #6E6A60;
  --accent:    #FCF05F;
  --accent-2:  #D4C700;
  --accent-soft: rgba(252,240,95,.14);
  --accent-line: rgba(252,240,95,.4);
  --grad:      #FCF05F;
  --ok:        #4ADE80;
  --display: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
}
```

- [ ] **Step 3: Add the faint background grid texture**

Modify the `body` rule (currently lines 59-67) to add a subtle tiled grid, matching Cédric's reference image — barely visible, not a bold pattern:

```css
body{
  background-color:var(--bg);
  background-image:
    linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
  background-size:42px 42px;
  color:var(--body);
  font-family:var(--sans);
  font-size:1.0625rem;
  line-height:1.65;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
```

- [ ] **Step 4: Match the mark-word underline stroke to the new accent**

Line 165 currently hardcodes the old yellow (`stroke='%23F2E96A'`) inside an inline SVG data-URI (can't reference a CSS variable inside a data-URI). Update the hex to the new accent so the hand-drawn underline under "and do the posting for you" / "first customers" in the hero phrases matches the new `--accent:#FCF05F`:

Find:
```
stroke='%23F2E96A'
```
Replace with:
```
stroke='%23FCF05F'
```

- [ ] **Step 5: Deploy a preview and visually confirm**

```bash
cd landing && netlify deploy
```

Open the printed draft URL. Confirm: page background is dark (`#161412`) with a faint grid visible on close inspection, body text is legible (light gray on dark), the hero phrase text and its yellow underline squiggle (phrase 3) render in the new yellow. The hero will still look structurally like the old centered layout at this point — that's expected, Task 2 restructures it. The nav pill stays white (unchanged, confirmed out of scope) — verify it still looks intentional (a white floating pill on a dark page), not broken.

- [ ] **Step 6: Commit**

```bash
git add landing/index.html
git commit -m "Flip landing hero to dark palette with grid texture

Exact colors from Cédric's DA reference (bg #161412, accent #FCF05F).
Palette-only change — hero layout restructure is a separate task."
```

---

### Task 2: Remove old hero diagram/badge, restructure `.hero-pin` into a 2-column grid

**Files:**
- Modify: `landing/index.html:350-357` (remove `.hero-pin-badge`/`.hero-bcast` CSS), `landing/index.html:400-410` (remove `.hero-bcast` desktop CSS), `landing/index.html:339-349` (`.hero-pin` restructure), `landing/index.html:359-370` (`.hero-phase` size), `landing/index.html:1083-1120` (HTML: remove badge + SVG, wrap phase-zone for grid)

**Interfaces:**
- Consumes: `:root` tokens from Task 1.
- Produces: `.hero-pin` as a 2-column grid container (`.hero-screen` | `.hero-phase-zone`) at ≥900px, ready for Task 3 to fill `.hero-screen`'s content. Task 3 depends on this task's grid structure existing first.

- [ ] **Step 1: Remove the old badge and SVG diagram from the HTML**

In the current `<div class="hero-pin">` block (lines 1083-1120), delete the badge line and the entire SVG block, keeping `.hero-phase-zone` and `.hero-scroll-cue`. Replace lines 1083-1125:

```html
  <div class="hero-pin">
    <div class="hero-screen" aria-hidden="true">
      <!-- Task 3 fills this in — 4 evolving states -->
    </div>

    <div class="hero-phase-zone">
      <p class="hero-phase is-active" data-hero-frame="1">Stop procrastinating on your business launch.</p>
      <p class="hero-phase" data-hero-frame="2">No posts. No leads. And you know it.</p>
      <p class="hero-phase" data-hero-frame="3">We find the right platforms for your niche <span class="mark-word">and do the posting for you</span>.</p>
      <p class="hero-phase" data-hero-frame="4">Get your <span class="mark-word">first customers</span>. Not just views.</p>
    </div>

    <div class="hero-scroll-cue is-active" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>
    </div>
  </div>
```

(`.hero-screen` is aria-hidden since it's purely illustrative — same reasoning as the old SVG's `aria-hidden="true"`/comment "Illustrative animation only".)

- [ ] **Step 2: Remove the old badge/diagram CSS**

Delete lines 350-357 entirely (`.hero-pin-badge`, `.hero-bcast{ display:none; }`, `.hb-wire`, `.hb-badge circle`, `.hb-badge.is-lit circle`, `.hb-comment`, `.hb-comment.is-lit`):

```css
.hero-pin-badge{ position:relative; z-index:2; margin-bottom:1.6rem; }

.hero-bcast{ display:none; }
.hb-wire{ fill:none; stroke:rgba(201,168,0,.32); stroke-width:1.5; stroke-linecap:round; }
.hb-badge circle{ filter:drop-shadow(2px 3px 0 rgba(0,0,0,.25)); opacity:.3; }
.hb-badge.is-lit circle{ opacity:1; transition:opacity .4s ease; }
.hb-comment{ opacity:0; }
.hb-comment.is-lit{ opacity:1; transition:opacity .4s ease; }
```

And delete the matching desktop block, lines 400-410 (the `.hero-bcast{ display:block; position:absolute; ... }` rule inside the `@media (min-width:900px)` block):

```css
  .hero-bcast{
    display:block;
    position:absolute;
    top:50%; left:50%;
    transform:translate(-50%, 18%);
    width:min(70vw, 460px);
    height:auto;
    opacity:.5;
    z-index:1;
    pointer-events:none;
  }
```

- [ ] **Step 3: Restructure `.hero-pin` for the 2-column desktop layout**

Mobile-first base rule (currently lines 339-349) stays a stacked flex column — `.hero-screen` will render above `.hero-phase-zone` in DOM order, which is what we want on mobile (no CSS change needed here beyond what Task 3 adds for `.hero-screen` itself). Confirm the base rule is unchanged:

```css
.hero-pin{
  position:relative;
  height:auto;
  overflow:visible;
  padding:3.5rem 1.375rem 1rem;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  text-align:center;
}
```

Inside the `@media (min-width:900px)` block, replace the existing `.hero-pin{ ... }` rule (lines 388-396) with a 2-column grid version:

```css
  .hero-pin{
    grid-column:1; grid-row:1;
    position:sticky;
    top:0;
    align-self:start;
    height:100vh;
    overflow:hidden;
    padding:0 3vw;
    display:grid;
    grid-template-columns:minmax(280px, 1fr) minmax(320px, 1fr);
    align-items:center;
    gap:4vw;
    text-align:left;
  }
```

- [ ] **Step 4: Enlarge the phrase text for the new right-column layout**

Replace the `.hero-phase` rule (lines 360-369):

```css
.hero-phase{
  display:block;
  margin-bottom:1.1rem;
  font-family:var(--display);
  font-weight:800;
  font-size:clamp(1.5rem,4vw,2rem);
  line-height:1.15;
  letter-spacing:-.03em;
  color:var(--ink);
}
```

with a desktop-only larger size added inside the existing `@media (min-width:900px)` block (leave the base rule above untouched — mobile keeps its current size):

```css
  .hero-phase-zone{ text-align:left; }
  .hero-phase{ font-size:clamp(2rem,3.2vw,3.1rem); line-height:1.12; }
```

Add this right after the `.hero-pin{...}` rule from Step 3, still inside the same `@media (min-width:900px)` block.

- [ ] **Step 5: Deploy and visually confirm structure**

```bash
cd landing && netlify deploy
```

At ≥900px viewport: confirm the old SVG diagram and "Built for Solo SaaS Founders" badge are gone, phrase text is visibly larger and left-aligned, sitting in the right half of the hero with empty space on the left (expected — `.hero-screen` is still empty, Task 3 fills it). At <900px: confirm phrases still stack and read top-to-bottom as before (no visual regression on mobile from this task). Confirm `.hero-scroll-cue` (bouncing arrow) still renders centered at the bottom of `.hero-pin` — it's positioned `absolute` inside `.hero-pin`, which is still the containing block, so no change should be needed, but visually confirm it doesn't overlap oddly with the new 2-column content.

- [ ] **Step 6: Commit**

```bash
git add landing/index.html
git commit -m "Restructure hero into a 2-column dark layout, remove old diagram

Removes the pulsing SVG hub diagram and Solo-SaaS-Founders badge.
.hero-pin becomes a 2-column grid (screen mockup left, larger phrase
text right) at >=900px. .hero-screen is left empty for the next task."
```

---

### Task 3: Build the `.hero-screen` evolving mockup (4 states) and wire it into the scrollspy

**Files:**
- Modify: `landing/index.html:1083-1085` (HTML: fill `.hero-screen`), `landing/index.html` CSS (new rules, insert after the `.hero-phase` block from Task 2 Step 4, i.e. after line ~370 pre-Task-2-edits — insert as a new `/* ---------- hero screen mockup ---------- */` section right before `.hero-cta-zone`), `landing/index.html:1272-1290` (JS: `applyActive()` — replace dead badge wiring with screen-state wiring)

**Interfaces:**
- Consumes: `.hero-pin` 2-column grid from Task 2, `applyActive()`'s `n` (current step number, `'1'`–`'4'`) from the existing scrollspy IIFE.
- Produces: `[data-hero-screen-state="1..4"]` elements, toggled by the same step number that already drives `[data-hero-frame]`. Task 4 does not depend on this task (modal is independent), but if reviewing both together, note they share no code.

- [ ] **Step 1: Add the 4 screen-state HTML blocks**

Replace the placeholder comment left by Task 2 (`<!-- Task 3 fills this in — 4 evolving states -->`) inside `<div class="hero-screen" aria-hidden="true">`:

```html
    <div class="hero-screen" aria-hidden="true">
      <div class="hs-state is-active" data-hero-screen-state="1">
        <div class="hs-panel hs-panel--idle">
          <div class="hs-idle-glow"></div>
        </div>
      </div>

      <div class="hs-state" data-hero-screen-state="2">
        <div class="hs-panel hs-card hs-outreach">
          <div class="hs-outreach-head">
            <span class="hs-outreach-icon">💬</span>
            <span class="hs-outreach-label">AI Outreach Agent</span>
            <span class="hs-toggle"><span class="hs-toggle-label">Enabled</span><span class="hs-toggle-pill"><span class="hs-toggle-dot"></span></span></span>
          </div>
          <div class="hs-bubble hs-bubble--out">
            <p>hey, saw your post about struggling to get your first clients .. there's a tool that does exactly what you're looking for .. just thought you might find it useful :)</p>
            <span class="hs-bubble-time">2:31 PM</span>
          </div>
          <div class="hs-bubble hs-bubble--in">
            <span class="hs-bubble-from">Lead</span>
            <p>Hey. Yeah I'll be happy to get any suggestions</p>
            <span class="hs-bubble-time">2:33 PM</span>
          </div>
        </div>
      </div>

      <div class="hs-state" data-hero-screen-state="3">
        <div class="hs-panel hs-card hs-scan">
          <div class="hs-scan-head"><span class="hs-scan-dot"></span>Scanning platforms&hellip;<span class="hs-scan-count">85 posts scanned</span></div>
          <ul class="hs-scan-list">
            <li><span class="hs-scan-src">r/startups &middot; 2m ago</span><span class="hs-scan-txt">Looking for a project management tool that actually works for small teams</span><span class="hs-scan-score">9.0</span></li>
            <li><span class="hs-scan-src">r/smallbusiness &middot; 8m ago</span><span class="hs-scan-txt">Any recommendations for a lightweight CRM? HubSpot is overkill for us</span><span class="hs-scan-score">9.0</span></li>
            <li><span class="hs-scan-src">X &middot; 14m ago</span><span class="hs-scan-txt">Need a no-code tool to build internal dashboards. Budget is tight.</span><span class="hs-scan-score">8.0</span></li>
          </ul>
        </div>
      </div>

      <div class="hs-state" data-hero-screen-state="4">
        <div class="hs-panel hs-card hs-leads">
          <ul class="hs-leads-list">
            <li class="hs-leads-hit"><span class="hs-leads-tag hs-leads-tag--hit">New Lead</span><span class="hs-leads-meta">Right now</span><p>Searching for a UX designer who's worked with B2B tools. DM me!</p></li>
            <li class="hs-leads-hit"><span class="hs-leads-tag hs-leads-tag--hit">New Lead</span><span class="hs-leads-meta">Right now</span><p>Trying to boost MRR - what's worked best for you?</p></li>
            <li class="hs-leads-skip"><span class="hs-leads-tag hs-leads-tag--skip">Not Relevant</span><span class="hs-leads-meta">Right now</span><p>Just crossed $10K MRR! Not looking for growth tips, just celebrating!</p></li>
          </ul>
        </div>
      </div>
    </div>
```

- [ ] **Step 2: Add the `.hero-screen` container and shared card CSS**

Insert a new section right before the `.hero-cta-zone{...}` rule (after Task 2's edits, this is right after the `.hero-phase:last-child{ margin-bottom:0; }` rule):

```css
/* ---------- hero screen mockup (evolves per active phrase) ---------- */

.hero-screen{ display:none; }
@media (max-width:899.98px){
  .hero-screen{ display:block; margin-bottom:2rem; }
  .hs-state{ display:none; }
  .hs-state[data-hero-screen-state="1"]{ display:block; }
}

.hs-panel{
  background:var(--card);
  border:1px solid var(--line);
  border-radius:16px;
  overflow:hidden;
  box-shadow:0 24px 56px rgba(0,0,0,.45);
}
.hs-panel--idle{
  position:relative;
  aspect-ratio:4/3;
  display:flex;
  align-items:center;
  justify-content:center;
}
.hs-idle-glow{
  width:34%;
  aspect-ratio:1;
  border-radius:50%;
  background:radial-gradient(circle, var(--accent) 0%, transparent 70%);
  opacity:.5;
  animation:hs-idle-pulse 2.4s ease-in-out infinite;
}
@keyframes hs-idle-pulse{ 0%,100%{ opacity:.35; transform:scale(.94); } 50%{ opacity:.6; transform:scale(1); } }

.hs-card{ padding:1.3rem 1.4rem; font-size:.86rem; }

/* AI Outreach Agent card */
.hs-outreach-head{ display:flex; align-items:center; gap:.5rem; margin-bottom:1.1rem; }
.hs-outreach-icon{ font-size:.95rem; }
.hs-outreach-label{ font-weight:700; color:var(--ink); flex:1; }
.hs-toggle{ display:flex; align-items:center; gap:.4rem; font-size:.72rem; color:var(--ok); font-weight:600; }
.hs-toggle-pill{ width:1.6rem; height:.9rem; border-radius:999px; background:rgba(74,222,128,.25); position:relative; display:inline-block; }
.hs-toggle-dot{ position:absolute; top:1px; right:1px; width:.7rem; height:.7rem; border-radius:50%; background:var(--ok); }
.hs-bubble{ border-radius:12px; padding:.75rem .9rem; margin-bottom:.7rem; max-width:92%; }
.hs-bubble p{ margin:0; line-height:1.45; }
.hs-bubble--out{ background:rgba(74,222,128,.12); border:1px solid rgba(74,222,128,.25); color:var(--ink); margin-left:auto; }
.hs-bubble--in{ background:var(--card-2); border:1px solid var(--line); color:var(--ink); }
.hs-bubble-from{ display:block; font-size:.72rem; color:var(--faint); margin-bottom:.3rem; }
.hs-bubble-time{ display:block; font-size:.68rem; color:var(--faint); margin-top:.35rem; }

/* Scanning platforms card */
.hs-scan-head{ display:flex; align-items:center; gap:.5rem; font-size:.78rem; color:var(--faint); font-weight:600; margin-bottom:1rem; }
.hs-scan-dot{ width:.5rem; height:.5rem; border-radius:50%; background:var(--ok); flex:none; }
.hs-scan-count{ margin-left:auto; }
.hs-scan-list{ list-style:none; display:flex; flex-direction:column; gap:.7rem; }
.hs-scan-list li{ display:grid; grid-template-columns:1fr auto; gap:.15rem .6rem; padding-bottom:.7rem; border-bottom:1px solid var(--line-soft); }
.hs-scan-list li:last-child{ border-bottom:0; padding-bottom:0; }
.hs-scan-src{ font-size:.72rem; color:var(--faint); grid-column:1; }
.hs-scan-txt{ grid-column:1; color:var(--ink); line-height:1.4; }
.hs-scan-score{ grid-column:2; grid-row:1 / span 2; align-self:center; font-weight:700; font-size:.78rem; color:#161412; background:var(--ok); border-radius:999px; padding:.15rem .55rem; height:fit-content; }

/* New Lead / Not Relevant card */
.hs-leads-list{ list-style:none; display:flex; flex-direction:column; gap:.9rem; }
.hs-leads-list li{ padding-bottom:.9rem; border-bottom:1px solid var(--line-soft); }
.hs-leads-list li:last-child{ border-bottom:0; padding-bottom:0; }
.hs-leads-list p{ margin-top:.4rem; color:var(--ink); line-height:1.4; }
.hs-leads-tag{ font-size:.68rem; font-weight:700; letter-spacing:.02em; border-radius:999px; padding:.15rem .55rem; }
.hs-leads-tag--hit{ color:var(--ok); background:rgba(74,222,128,.14); }
.hs-leads-tag--skip{ color:var(--faint); background:var(--card-2); }
.hs-leads-meta{ margin-left:.5rem; font-size:.7rem; color:var(--faint); }
.hs-leads-skip p{ color:var(--faint); text-decoration:line-through; }
```

- [ ] **Step 3: Desktop layout + active-state animation**

Inside the existing `@media (min-width:900px)` block (same one Task 2 edited), add:

```css
  .hero-screen{ display:block; position:relative; min-height:22rem; }
  .hs-state{ display:none; }
  .hs-state.is-active{ display:block; animation:hero-phase-in .5s ease both; }
```

(`hero-phase-in` is the same keyframe already used by `.hero-phase.is-active` — reused deliberately so both columns animate in with the same motion.)

- [ ] **Step 4: `prefers-reduced-motion` fallback**

Inside the existing `@media (min-width:900px) and (prefers-reduced-motion: reduce)` block, add:

```css
  .hs-state{ display:none; }
  .hs-state[data-hero-screen-state="1"]{ display:block; }
  .hs-state.is-active{ animation:none; }
  .hs-idle-glow{ animation:none; opacity:.5; }
```

This mirrors the existing pattern in that block (static, phase-1-only, no animation) — same reasoning as `.hero-phase` and `.hb-dots` above it.

- [ ] **Step 5: Wire `applyActive()` to toggle screen states, drop the dead badge code**

The `badges`/`data-hb-badge` wiring in the scrollspy IIFE now targets elements that no longer exist (deleted in Task 2) — replace it with the new screen-state wiring rather than leaving it silently querying zero elements. Current code (inside the IIFE, after `var phases = ...`):

```js
    var badges = Array.prototype.slice.call(root.querySelectorAll('[data-hb-badge]'));
    var cue = root.querySelector('.hero-scroll-cue');
    var above = new Set();

    function applyActive() {
      var current = null;
      steps.forEach(function (s) { if (above.has(s)) current = s; });
      if (!current) current = steps[0];
      var n = current.getAttribute('data-hero-step');
      steps.forEach(function (s) { s.classList.toggle('is-active', s === current); });
      phases.forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-hero-frame') === n); });
      var lit = { '1': [], '2': ['1'], '3': ['1','2','3'], '4': ['1','2','3'] }[n] || [];
      badges.forEach(function (b) {
        b.classList.toggle('is-lit', lit.indexOf(b.getAttribute('data-hb-badge')) !== -1);
      });
      if (cue) cue.classList.toggle('is-active', n === '1');
    }
```

Replace with:

```js
    var screens = Array.prototype.slice.call(root.querySelectorAll('[data-hero-screen-state]'));
    var cue = root.querySelector('.hero-scroll-cue');
    var above = new Set();

    function applyActive() {
      var current = null;
      steps.forEach(function (s) { if (above.has(s)) current = s; });
      if (!current) current = steps[0];
      var n = current.getAttribute('data-hero-step');
      steps.forEach(function (s) { s.classList.toggle('is-active', s === current); });
      phases.forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-hero-frame') === n); });
      screens.forEach(function (s) { s.classList.toggle('is-active', s.getAttribute('data-hero-screen-state') === n); });
      if (cue) cue.classList.toggle('is-active', n === '1');
    }
```

- [ ] **Step 6: Deploy and verify all 4 states, desktop + mobile + reduced-motion**

```bash
cd landing && netlify deploy
```

Desktop (≥900px), real scroll (not JS `scrollTo`): confirm phase 1 shows the pulsing glow panel, phase 2 shows the AI Outreach chat card, phase 3 shows the Scanning platforms list, phase 4 shows the New Lead/Not Relevant list with the "Not Relevant" item struck through — and that the screen state changes in sync with the phrase text each time you cross a trigger. Confirm the scroll cue arrow still appears/fades correctly (unaffected by this task, but verify no regression). Mobile (<900px): confirm only the idle-glow panel shows, stacked above the phrase text, no animation. `prefers-reduced-motion: reduce` at ≥900px: confirm the idle-glow panel shows statically (no pulse), no crossfade animation on scroll.

- [ ] **Step 7: Commit**

```bash
git add landing/index.html
git commit -m "Add evolving hero-screen mockup (4 states), wire into scrollspy

Idle glow -> AI Outreach Agent card -> Scanning platforms card -> New
Lead/Not Relevant card, synced to the same step number driving the
phrase text. Removes the now-dead [data-hb-badge] wiring left over
from the deleted SVG diagram."
```

---

### Task 4: Blurred teaser card in the lead-magnet modal

**Files:**
- Modify: `landing/index.html` CSS (new rules near `.ready-result`, i.e. after line ~914 pre-Task-1-edits), `landing/index.html:1430-1444` (`renderReadiness()` JS function)

**Interfaces:**
- Consumes: `:root` tokens from Task 1, existing `#ready-result-modal` container and `renderReadiness(data)` call site inside `runReadinessCheck()` (unmodified).
- Produces: nothing consumed by other tasks — independent of Tasks 2/3.

- [ ] **Step 1: Add the teaser card CSS**

Insert a new section right after the existing `.ready-note{...}` rule (before the `/* ---------- platform preview cards ---------- */` comment):

```css
/* ---------- readiness teaser (blurred, pre-email) ---------- */

.ready-teaser{
  position:relative;
  margin-top:1rem;
  background:var(--card-2);
  border:1px solid var(--line);
  border-radius:12px;
  padding:1.3rem 1.4rem;
  overflow:hidden;
}
.ready-teaser-blur{ filter:blur(5px); user-select:none; }
.ready-teaser-row{ display:flex; align-items:baseline; justify-content:space-between; padding:.4rem 0; font-size:.86rem; color:var(--ink); }
.ready-teaser-row + .ready-teaser-row{ border-top:1px dashed var(--line); }
.ready-teaser-row strong{ color:var(--accent); }
.ready-teaser-lock{
  position:absolute;
  inset:0;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:.5rem;
  background:rgba(22,20,18,.55);
  font-size:.8rem;
  font-weight:600;
  color:var(--ink);
}
.ready-teaser-lock svg{ flex:none; }
```

- [ ] **Step 2: Return the teaser markup from `renderReadiness()`**

Current function (lines 1430-1444):

```js
  function renderReadiness(data) {
    var meta = data.meta || {};
    var scores = data.scores || {};
    var known = [scores.performance, scores.seo].filter(function (v) { return typeof v === 'number'; });
    var scoreHtml = '';
    if (known.length) {
      var avg = Math.round(known.reduce(function (a, b) { return a + b; }, 0) / known.length);
      scoreHtml = '<div class="ready-score"><span class="ready-score-num">' + avg + '</span>' +
        '<span class="ready-score-lbl">/ 100 &middot; Launch Readiness (PageSpeed)</span></div>';
    }
    if (!meta.reachable) {
      return '<p style="font-size:.86rem;color:var(--faint)">We couldn\'t load your page directly — some sites block automated requests. That\'s fine, we\'ll still put together your priority plan by hand.</p>';
    }
    return scoreHtml;
  }
```

Replace with (adds a fixed-content teaser block after the score, still returns early with no teaser if the page wasn't reachable — the teaser claims "we found your platforms", which shouldn't render if we admittedly couldn't read the page):

```js
  function renderReadiness(data) {
    var meta = data.meta || {};
    var scores = data.scores || {};
    var known = [scores.performance, scores.seo].filter(function (v) { return typeof v === 'number'; });
    var scoreHtml = '';
    if (known.length) {
      var avg = Math.round(known.reduce(function (a, b) { return a + b; }, 0) / known.length);
      scoreHtml = '<div class="ready-score"><span class="ready-score-num">' + avg + '</span>' +
        '<span class="ready-score-lbl">/ 100 &middot; Launch Readiness (PageSpeed)</span></div>';
    }
    if (!meta.reachable) {
      return '<p style="font-size:.86rem;color:var(--faint)">We couldn\'t load your page directly — some sites block automated requests. That\'s fine, we\'ll still put together your priority plan by hand.</p>';
    }
    var teaserHtml = '<div class="ready-teaser">' +
      '<div class="ready-teaser-blur">' +
        '<div class="ready-teaser-row"><span>Best platforms to post on</span><strong>2 identified</strong></div>' +
        '<div class="ready-teaser-row"><span>Matching posts this week</span><strong>23 identified</strong></div>' +
      '</div>' +
      '<div class="ready-teaser-lock">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>' +
        '<span>Unlocks with your email below</span>' +
      '</div>' +
    '</div>';
    return scoreHtml + teaserHtml;
  }
```

- [ ] **Step 3: Deploy and verify the modal**

```bash
cd landing && netlify deploy
```

On the draft URL, submit a URL through the hero capture form to open the modal. Confirm: after the "Reading your page…" loading state, the PageSpeed score still renders as before, and below it a new card shows "Best platforms to post on" / "Matching posts this week" rows, visibly blurred, with a lock icon and "Unlocks with your email below" overlay — sitting above the existing email capture field. Confirm the modal's dark styling (inherited from Task 1's `:root` flip) reads correctly — no leftover light-colored elements. Also test the unreachable-page path if convenient (a URL that blocks scraping) — confirm it still shows only the fallback message, no teaser card (matches Step 2's early return).

- [ ] **Step 4: Commit**

```bash
git add landing/index.html
git commit -m "Add blurred teaser card to the readiness modal

Static placeholder content (\"2 platforms\", \"23 posts\") behind a
blur + lock overlay, sitting above the email field to suggest
entering an email unlocks it. No new computation — renderReadiness()
still only has real PageSpeed data to work with."
```

---

### Task 5: Final visual pass and production deploy

**Files:** None (verification + deploy only, unless the visual pass surfaces a fix — see Step 2).

**Interfaces:**
- Consumes: everything from Tasks 1-4.

- [ ] **Step 1: Full-page visual sweep on the latest preview**

```bash
cd landing && netlify deploy
```

Check, in order: (a) nav pill still white/unchanged and still readable against the dark page; (b) hero desktop ≥900px — scroll through all 4 phrases slowly, confirm text and screen mockup stay in sync, confirm the scroll-cue arrow behaves as before (visible on phrase 1 only); (c) hero mobile <900px — confirm stacked phrases + static idle-glow panel, no layout overflow or horizontal scrollbar; (d) `prefers-reduced-motion: reduce` at both widths; (e) submit the capture form, confirm the modal opens dark-themed with the score + blurred teaser card + working email field, and that a real submission still shows the existing success state (`#lm-success-modal`); (f) spot-check `/how-it-works.html`, `/guides.html`, `/use-case.html` still render in their original light theme, completely unaffected by this file's changes (they're separate self-contained files, but confirm nothing was accidentally shared/broken).

- [ ] **Step 2: Fix anything found, re-deploy, re-check**

If the sweep in Step 1 surfaces an issue, fix it directly in `landing/index.html`, redeploy, and re-run the relevant part of Step 1's checklist before proceeding. Commit any fix separately with a message describing what was wrong.

- [ ] **Step 3: Merge any concurrent remote changes before promoting**

Automated commits (e.g. the daily PH-winners cron) can land on `main` between sessions. Check before pushing:

```bash
git fetch origin main
git log --oneline HEAD..origin/main
```

If there are commits, merge them (they've been unrelated data-file changes so far, safe to merge):

```bash
git merge origin/main --no-edit
```

- [ ] **Step 4: Push and promote to production**

```bash
git push origin main
```

Note the deploy ID from the final `netlify deploy` run in Step 1 (or Step 2 if a fix was needed), then:

```bash
netlify api restoreSiteDeploy --data '{"site_id":"d4a26bd1-7f35-41c7-bf41-b4e83b981e0d","deploy_id":"<DEPLOY_ID_FROM_LATEST_PREVIEW>"}'
```

Confirm the response shows `"url": "https://letsgetposted.com"` and `"state": "ready"`.

- [ ] **Step 5: Verify live**

Load `https://letsgetposted.com/` in a fresh tab and re-run the key parts of Step 1's checklist (dark hero, 4 synced states on real scroll, modal teaser card) directly against production.

- [ ] **Step 6: Update `CLAUDE.md`**

Following the pattern already established for the 3 prior same-project pivots documented in `CLAUDE.md` (each gets its own dated `##` section, explicitly noting what it supersedes), add a new section for this pivot: dark palette, split-screen layout, the 4 `.hero-screen` states, and the modal teaser card. Note explicitly that the scroll *mechanic* itself did not change — only this pivot's visual layer sits on top of the existing `position:sticky`/`IntersectionObserver` restoration from earlier the same day.

```bash
git add CLAUDE.md
git commit -m "Document the hero dark DA pivot in CLAUDE.md"
git push origin main
```
