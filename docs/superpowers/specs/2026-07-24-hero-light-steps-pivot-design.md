# Hero light "steps" pivot — design

**Status:** Approved by Cédric in conversation (copy, mechanism, and site-wide-consistency framing all confirmed). Ready for the implementation plan.

## Context

Same day as the dark DA pivot (also shipped today, 2026-07-24): Cédric saw the dark hero live, first asked for small style tweaks (nav pill color, a "sticker" border on `.hero-screen` — both shipped), then changed direction more fundamentally after re-sending a screenshot of the existing `/how-it-works.html` page: *"désolé de changer de design, je trouve ça beaucoup plus clair... Ça fait une meilleure identité."*

Clarified in conversation:
- The hero's headline should become **static** (not crossfading through 4 phrases) — the description card + visual scroll underneath it, exactly like `how-it-works.html` already does.
- The redundancy this creates with `/how-it-works.html` (near-identical mechanism, overlapping story) is **intentional**: the hero becomes a **4-step teaser**, `/how-it-works.html` keeps its own **5-step detailed version**. Repetition assumed, not a problem to solve away.
- The static hero title should be **new copy, distinct from** `/how-it-works.html`'s "From submission to live, in one flow." — agreed on **"You don't do it. We do it for you."**, a phrase already validated in earlier user research (documented in this project's `CLAUDE.md`), not fresh invented copy.
- Reverting the hero to the light palette **also resolves a site-wide inconsistency**: since this morning's dark pivot, `index.html` was dark while `how-it-works.html`/`guides.html`/`use-case.html` stayed light (they were explicitly out of scope for that pivot). This reversion makes the whole site visually consistent again — confirmed explicitly with Cédric.

## Goal

Replace the current hero (fixed dark palette, 4 crossfading phrases, sticky-pinned 2-column split) with a light-palette hero that reuses `how-it-works.html`'s own scrollspy mechanism verbatim: a static badge + title, then a 2-column "steps" row (4 short step cards on the left, a sticky visual on the right) that scrolls like real content — no more invisible 100vh trigger blocks.

## What changes in `landing/index.html`

### 1. Palette reverts to light, page-wide

Revert the `:root` block (currently lines 30-44) to the exact light values already used by `how-it-works.html`/`guides.html`/`use-case.html`:

```
--bg:        #FBF8F1
--card:      #F3EEE0
--card-2:    #EFE9D8
--line:      #E2DBC8
--line-soft: #EAE4D3
--ink:       #1A1917
--body:      #57534A
--faint:     #8A8478
--accent:    #F2E96A
--accent-2:  #C9A800
--accent-soft: rgba(201,168,0,.14)
--accent-line: rgba(201,168,0,.4)
--grad:      #F2E96A
--ok:        #4ADE80   (unchanged — already token-based, not part of today's dark-only additions)
```

Because the nav pill and `.hero-screen`'s "sticker" border were already tokenized (`background:var(--card)`, `border:...solid var(--ink)`) rather than hardcoded during today's earlier edits, they'll flip back to light automatically — no separate fix needed there. Two things ARE hardcoded and need a manual revert alongside the token block:
- `body`'s background-image grid texture (added for the dark pivot, `rgba(255,255,255,.035)` lines) — remove entirely; it was tuned to be barely-visible against near-black and would look wrong/dirty against a cream background. `how-it-works.html` has no such texture.
- `.mark-word::after`'s inline SVG data-URI stroke color (`stroke='%23FCF05F'`) — revert to `stroke='%23F2E96A'` (its pre-dark-pivot value; can't use a CSS variable inside a data-URI).

### 2. Hero structure: badge + static title, then a steps row (mirrors `.hw-scroll`)

Replace the current `<header class="hero" id="hero-scroll">` contents. New structure, modeled directly on `how-it-works.html`'s `#how`/`.hw-scroll` (same class-naming convention, prefixed `hero-` instead of `hw-` to avoid collisions since both files are self-contained but for consistency of pattern):

```html
<header class="hero">
  <div class="wrap wrap--narrow">
    <span class="badge">Built for Solo SaaS Founders</span>
    <h1>You don't do it. <span class="mark-word">We do it for you</span>.</h1>
    <div class="hero-scroll" id="hero-scroll">
      <div class="hero-steps">
        <div class="hero-step is-active" data-hero-step="1">
          <span class="hero-n" aria-hidden="true">1</span>
          <p class="hero-t">Stop procrastinating</p>
          <p class="hero-d">No posts. No leads. And you know it. The longer you wait, the more it costs you.</p>
        </div>
        <div class="hero-step" data-hero-step="2">
          <span class="hero-n" aria-hidden="true">2</span>
          <p class="hero-t">We find your platforms</p>
          <p class="hero-d">The right channels for your niche, not a generic blast.</p>
        </div>
        <div class="hero-step" data-hero-step="3">
          <span class="hero-n" aria-hidden="true">3</span>
          <p class="hero-t">We post for you</p>
          <p class="hero-d">Real copy, written in your voice — not templated spam.</p>
        </div>
        <div class="hero-step" data-hero-step="4">
          <span class="hero-n" aria-hidden="true">4</span>
          <p class="hero-t">Get real customers</p>
          <p class="hero-d">Not just views. Actual conversations with people who could buy.</p>
        </div>
      </div>
      <div class="hero-screen" aria-hidden="true">
        <div class="hs-chrome">🔗 <b>yourproduct.com</b></div>
        <!-- the 4 existing .hs-state blocks move here unchanged in content,
             re-targeted by data-hero-step instead of data-hero-screen-state
             (see Interfaces below) -->
      </div>
    </div>
  </div>

  <div class="wrap hero-cta-zone" id="hero-form">
    <!-- #capture-form-hero block: entirely unchanged -->
  </div>
</header>
```

Notes on this structure:
- **Badge reintroduced**: "Built for Solo SaaS Founders" was removed during the dark pivot ("on enlève le reste" — at the time, referring to decluttering the crossfading-phrase hero). It fits naturally here, mirroring `how-it-works.html`'s own badge-above-title pattern. Same exact copy as before, no new decision needed.
- **`.hero-screen`'s chrome bar stays**: the "🔗 yourproduct.com" persistent header (added after the dark-pivot final review) is orthogonal to this pivot — kept as-is, just re-themed automatically by the palette revert.
- **The 4 `.hs-state` blocks move as-is** (AI Outreach Agent / Scanning platforms / New Lead-Not Relevant content unchanged) — only their *positioning mechanism* changes, from `display:none`/`.is-active{display:block}` to `how-it-works.html`'s absolute-stack-crossfade (`.hw-frame`-style: `position:absolute; inset:0; opacity:0; transition:opacity .45s ease;` → `.is-active{opacity:1}`), since the right column is now `position:sticky` inside a normal-flow steps column rather than a full-height pinned box.
- **`.hero-triggers` (4 invisible 100vh blocks) is deleted entirely** — no longer needed. The real `.hero-step` blocks themselves become the `IntersectionObserver` targets, exactly like `.hw-step` does on `how-it-works.html`.
- **`.hero-scroll-cue` (bouncing down-arrow) is deleted** — it existed specifically to hint "keep scrolling" on the old sticky-pin/invisible-trigger layout, where nothing on screen suggested more content followed. With real, visibly-stacked step cards (the same reason `how-it-works.html` has never needed one), the affordance is redundant.

### 3. CSS: adopt `how-it-works.html`'s steps/visual pattern verbatim

Reuse (not reinvent) the exact rules already proven on `how-it-works.html`, renamed with the `hero-`/`hs-` prefixes already used in this file:

```css
.hero-scroll{ display:grid; gap:1.1rem; margin-top:2.4rem; }
.hero-steps{ display:grid; gap:1.1rem; }
.hero-step{ background:var(--card); border:1px solid var(--line); border-radius:16px; padding:1.5rem 1.4rem; transition:opacity .3s ease; }
.hero-n{ display:inline-flex; align-items:center; justify-content:center; width:2.1rem; height:2.1rem; border-radius:50%; background:var(--accent); border:3px solid #141414; box-shadow:3px 4px 0 rgba(0,0,0,.5); color:#141414; font-family:var(--display); font-weight:800; font-size:.92rem; margin-bottom:1.1rem; }
.hero-step:nth-of-type(odd) .hero-n{ transform:rotate(-6deg); }
.hero-step:nth-of-type(even) .hero-n{ transform:rotate(5deg); }
.hero-t{ font-family:var(--display); font-weight:700; color:var(--ink); font-size:1rem; margin-bottom:.4rem; }
.hero-d{ font-size:.92rem; line-height:1.55; color:var(--body); }
@media (min-width:900px){
  .hero-scroll{ grid-template-columns:1fr 1fr; gap:3.5rem; align-items:start; }
  .hero-steps{ gap:9rem; padding:2rem 0; }
  .hero-step{ opacity:.4; }
  .hero-step.is-active{ opacity:1; }
}
```

`.hero-screen` keeps its existing frame styling (light-token-driven card/border/shadow, already built) but changes from `position:relative` block to `position:sticky; top:7rem;` at ≥900px, matching `.hw-visual`. The 4 `.hs-state` children switch from `display:none`/`.is-active{display:block}` to absolute-stacked opacity crossfade, matching `.hw-frame`/`.hw-frame.is-active`.

### 4. JS: adopt the simpler `how-it-works.html` scrollspy

Replace the current `IntersectionObserver` IIFE (which watches invisible `[data-hero-step]` trigger blocks separate from the visible content) with `how-it-works.html`'s pattern: observe the real `.hero-step` blocks directly.

```js
(function () {
  var scroll = document.getElementById('hero-scroll');
  if (!scroll) return;
  var desktop = window.matchMedia('(min-width:900px)');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!desktop.matches || reduced.matches) return;

  var steps = Array.prototype.slice.call(scroll.querySelectorAll('[data-hero-step]'));
  var screens = Array.prototype.slice.call(scroll.querySelectorAll('[data-hero-screen-state]'));
  var above = new Set();

  function applyActive() {
    var current = null;
    steps.forEach(function (s) { if (above.has(s)) current = s; });
    if (!current) current = steps[0];
    var n = current.getAttribute('data-hero-step');
    steps.forEach(function (s) { s.classList.toggle('is-active', s === current); });
    screens.forEach(function (f) { f.classList.toggle('is-active', f.getAttribute('data-hero-screen-state') === n); });
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) above.add(entry.target);
      else above.delete(entry.target);
    });
    applyActive();
  }, { rootMargin: '0px 0px -50% 0px', threshold: 0 });
  steps.forEach(function (s) { observer.observe(s); });
})();
```

This both simplifies the file (fewer moving parts than the old sticky-pin/trigger-block system) and makes the hero and `how-it-works.html` maintain the *same pattern* independently in their own self-contained files — consistent with the project's existing convention of duplicating small shared patterns across self-contained pages rather than sharing a stylesheet.

## Interfaces

- **Consumes**: nothing from other tasks — this is a from-scratch rebuild of the hero's markup/CSS/JS, reusing the *pattern* already proven on `how-it-works.html` (a different file, read-only reference — not modified).
- **Produces**: `[data-hero-step="1..4"]` (steps, replaces the old `[data-hero-step]` on invisible triggers — name reused, target changes from invisible div to real content block), `[data-hero-screen-state="1..4"]` (unchanged attribute name, same 4 content blocks, different CSS positioning/crossfade mechanism).

## What does not change

- `#capture-form-hero` / `#cap-url-hero` field IDs and Netlify form wiring.
- The lead-magnet modal (`#platform-modal-backdrop`, `runReadinessCheck()`, `openPlatformModal()`, the blurred teaser card) — untouched, already light-palette-compatible (built during today's dark pivot using tokens, so it reverts to light automatically).
- Nav pill: unchanged markup/behavior; its `var(--card)` background flips to light automatically via the token revert.
- Nav CTA text/link/click-to-scroll-and-focus behavior.
- The 4 `.hs-state` illustrative card contents (AI Outreach Agent / Scanning platforms / New Lead-Not Relevant) — copy and structure unchanged, only their crossfade mechanism changes (see above).
- `how-it-works.html`, `guides.html`, `use-case.html`, `privacy.html`, the 3 platform guide pages — untouched; they were already on this exact palette.

## Open items

None. Copy, mechanism, and scope were all confirmed in conversation before writing this spec.
