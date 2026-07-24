# Hero Light "Steps" Pivot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revert `landing/index.html`'s hero from the dark, crossfading-phrase layout to a light-palette hero with a static title and a 4-step scrollspy row, reusing `how-it-works.html`'s own proven CSS/JS pattern verbatim.

**Architecture:** Single-file change to `landing/index.html` (self-contained, inline `<style>`/`<script>`, no build system). No new mechanism is invented — this plan ports an existing, working pattern from `how-it-works.html` (read-only reference, not modified) into `index.html`'s hero, replacing the current sticky-pin/invisible-trigger-block system entirely.

**Tech Stack:** Plain HTML/CSS/JS, Netlify static hosting, `netlify deploy` (from `landing/`, not the repo root) + `netlify api restoreSiteDeploy` for preview→prod promotion.

## Global Constraints

- File: `landing/index.html` only. Do not modify `how-it-works.html`, `guides.html`, `use-case.html`, `privacy.html`, or the platform guide pages — they already use the light palette this plan reverts to; they are read-only references, not targets.
- Do not modify `#capture-form-hero`/`#cap-url-hero` field IDs, the Netlify form name (`liste-attente`), or anything inside `#leadmagnet-modal`/`#lm-form-modal`/`runReadinessCheck()`/`openPlatformModal()` — the lead-magnet modal already uses `:root` tokens and will revert to light automatically once Task 1 lands; no modal code changes in this plan.
- Do not change the nav CTA (`#nav-beta-cta`) text, link, or click-to-scroll/focus behavior. Its `var(--card)` background will revert to light automatically via the token change (Task 1) — no separate nav edit needed.
- The 4 `.hs-state` illustrative card contents (AI Outreach Agent / Scanning platforms / New Lead-Not Relevant / idle glow) keep their exact existing markup and copy — only their CSS *positioning/crossfade mechanism* changes (Task 3).
- Exact copy (from the approved spec, `docs/superpowers/specs/2026-07-24-hero-light-steps-pivot-design.md`) — use verbatim, do not paraphrase:
  - Badge: `Built for Solo SaaS Founders`
  - Title: `You don't do it. We do it for you.` (with "We do it for you" wrapped in `<span class="mark-word">`)
  - Step 1: title `Stop procrastinating`, description `No posts. No leads. And you know it. The longer you wait, the more it costs you.`
  - Step 2: title `We find your platforms`, description `The right channels for your niche, not a generic blast.`
  - Step 3: title `We post for you`, description `Real copy, written in your voice — not templated spam.`
  - Step 4: title `Get real customers`, description `Not just views. Actual conversations with people who could buy.`
- No automated test suite exists in this codebase. Verification throughout is manual: deploy to a Netlify preview URL and inspect with the browser tools (screenshot + real mouse-wheel scroll — not JS `scrollTo()`/`scrollIntoView()` calls, which don't reliably move the rendered viewport in this project's browser-automation environment, confirmed repeatedly this session). Test desktop (≥900px), mobile (<900px), and `prefers-reduced-motion: reduce`.

---

### Task 1: Revert palette to light, remove dark-only additions

**Files:**
- Modify: `landing/index.html:19-28` (header comment), `landing/index.html:30-47` (`:root` tokens), `landing/index.html:57-69` (`body` — remove grid texture), `landing/index.html:167` (`.mark-word::after` inline SVG stroke)

**Interfaces:**
- Produces: the light token set every later task's CSS relies on (`--bg`, `--card`, `--card-2`, `--line`, `--line-soft`, `--ink`, `--body`, `--faint`, `--accent`, `--accent-2`, `--accent-soft`, `--accent-line`, `--grad`, `--ok`).

- [ ] **Step 1: Replace the stale header comment**

The current comment (lines 19-28) describes the dark pivot, now being reverted. Replace it:

```css
/* ============================================================
   POSTED. — LANDING
   Hero light "steps" pivot (2026-07-24): static title, 4-step
   scrollspy row reusing how-it-works.html's own proven CSS/JS
   pattern verbatim. See docs/superpowers/specs/2026-07-24-hero-light-steps-pivot-design.md.
   Netlify form name="liste-attente" (fields url) on the hero
   capture form, "lead-magnet" (fields url + email) in the modal.
   Only external request: Google Fonts above.
   ============================================================ */
```

- [ ] **Step 2: Revert `:root` to the light palette**

Replace lines 30-47:

```css
:root{
  --bg:        #FBF8F1;
  --card:      #F3EEE0;
  --card-2:    #EFE9D8;
  --line:      #E2DBC8;
  --line-soft: #EAE4D3;
  --ink:       #1A1917;
  --body:      #57534A;
  --faint:     #8A8478;
  --accent:    #F2E96A;
  --accent-2:  #C9A800;
  --accent-soft: rgba(201,168,0,.14);
  --accent-line: rgba(201,168,0,.4);
  --grad:      #F2E96A;
  --ok:        #4ADE80;
  --display: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
}
```

- [ ] **Step 3: Remove the dark-only background grid texture**

Replace the `body` rule (lines 57-69), dropping `background-image`/`background-size` (tuned to be barely-visible against near-black; wrong against cream):

```css
body{
  background-color:var(--bg);
  color:var(--body);
  font-family:var(--sans);
  font-size:1.0625rem;
  line-height:1.65;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
```

- [ ] **Step 4: Revert the mark-word underline stroke color**

Line 167 hardcodes the dark-pivot yellow inside an inline SVG data-URI (can't reference a CSS variable there). Find:
```
stroke='%23FCF05F'
```
Replace with:
```
stroke='%23F2E96A'
```

- [ ] **Step 5: Deploy a preview and visually confirm**

```bash
cd landing && netlify deploy
```

Open the printed draft URL. Confirm: page background is light cream (`#FBF8F1`), body text is dark and legible, the nav pill (still using `var(--card)`) is now light again, no dark residue anywhere outside the hero (the hero itself will still look broken/dark-styled internally until Task 2 — that's expected, this task only changes tokens).

- [ ] **Step 6: Commit**

```bash
git add landing/index.html
git commit -m "Revert landing hero to light palette

Exact values match how-it-works.html/guides.html/use-case.html,
restoring site-wide visual consistency broken by this morning's dark
pivot. Also drops the dark-only background grid texture and reverts
the mark-word underline color. Hero structure itself is untouched —
that's the next task."
```

---

### Task 2: Rebuild hero HTML — static title + steps row, remove old crossfade markup

**Files:**
- Modify: `landing/index.html:1191-1278` (hero HTML)

**Interfaces:**
- Consumes: light tokens from Task 1.
- Produces: `.hero-scroll` (id `hero-scroll`, replaces the old trigger-block root), `.hero-steps` containing 4 `.hero-step[data-hero-step="1..4"]`, `.hero-screen` containing the unchanged 4 `.hs-state[data-hero-screen-state="1..4"]` blocks. Task 3 (CSS) and Task 4 (JS) both depend on this exact structure/naming existing first.

- [ ] **Step 1: Replace the entire hero HTML block**

Replace lines 1191-1278 (from the `<!-- ================= HERO -->` comment through the closing `</header>`) with:

```html
<!-- ================= HERO : static title + 4-step scrollspy (mirrors how-it-works.html) ================= -->
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
        <div class="hs-state is-active" data-hero-screen-state="1">
          <div class="hs-panel--idle">
            <div class="hs-idle-glow"></div>
          </div>
        </div>

        <div class="hs-state" data-hero-screen-state="2">
          <div class="hs-card hs-outreach">
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
          <div class="hs-card hs-scan">
            <div class="hs-scan-head"><span class="hs-scan-dot"></span>Scanning platforms&hellip;<span class="hs-scan-count">85 posts scanned</span></div>
            <ul class="hs-scan-list">
              <li><span class="hs-scan-src">r/startups &middot; 2m ago</span><span class="hs-scan-txt">Looking for a project management tool that actually works for small teams</span><span class="hs-scan-score">9.0</span></li>
              <li><span class="hs-scan-src">r/smallbusiness &middot; 8m ago</span><span class="hs-scan-txt">Any recommendations for a lightweight CRM? HubSpot is overkill for us</span><span class="hs-scan-score">9.0</span></li>
              <li><span class="hs-scan-src">X &middot; 14m ago</span><span class="hs-scan-txt">Need a no-code tool to build internal dashboards. Budget is tight.</span><span class="hs-scan-score">8.0</span></li>
            </ul>
          </div>
        </div>

        <div class="hs-state" data-hero-screen-state="4">
          <div class="hs-card hs-leads">
            <ul class="hs-leads-list">
              <li class="hs-leads-hit"><span class="hs-leads-tag hs-leads-tag--hit">New Lead</span><span class="hs-leads-meta">Right now</span><p>Searching for a UX designer who's worked with B2B tools. DM me!</p></li>
              <li class="hs-leads-hit"><span class="hs-leads-tag hs-leads-tag--hit">New Lead</span><span class="hs-leads-meta">Right now</span><p>Trying to boost MRR - what's worked best for you?</p></li>
              <li class="hs-leads-skip"><span class="hs-leads-tag hs-leads-tag--skip">Not Relevant</span><span class="hs-leads-meta">Right now</span><p>Just crossed $10K MRR! Not looking for growth tips, just celebrating!</p></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="wrap hero-cta-zone" id="hero-form">
    <div class="capzone capzone--hero">
      <div class="vf">
        <span class="fr" aria-hidden="true"></span>
        <form action='/' id='capture-form-hero' method='POST' name='liste-attente' data-netlify="true" netlify-honeypot="bot-field">
          <input type="hidden" name="form-name" value="liste-attente" />
          <p hidden aria-hidden="true"><label>Don't fill this out: <input name="bot-field" /></label></p>
          <div class="capbar-in">
            <label class="sr-only" for="cap-url-hero">Product URL</label>
            <input class="seg-url" type="text" inputmode="url" autocomplete="url" id="cap-url-hero" name="url" required placeholder="https://yourproduct.com">
            <button type="submit" class="cap-btn">Get my plan <span class="a" aria-hidden="true">→</span></button>
          </div>
        </form>
      </div>
    </div>
    <p class="hero-reassure">No bots. No spam. Nothing posts without you. Ever.</p>
  </div>
</header>
```

Notes for the implementer:
- The `#capture-form-hero` block is copied verbatim, unchanged, from the original — do not alter any attribute, id, or class inside it.
- The 4 `.hs-state` blocks (including `.hs-chrome`) are copied verbatim, unchanged, from the original — same markup, same copy, same `data-hero-screen-state` values. Only their *container* changed (now inside the new `.hero-scroll`/`.hero-screen` structure) and their CSS behavior changes in Task 3, not this task.
- `.hero-triggers` (4 invisible `.hero-trigger` divs), `.hero-phase-zone` (4 `.hero-phase` crossfading paragraphs), and `.hero-scroll-cue` (bouncing arrow) are gone from the HTML — their CSS is removed in Task 3, don't leave orphaned references.

- [ ] **Step 2: Deploy and confirm the HTML renders (unstyled/partially-styled is expected)**

```bash
cd landing && netlify deploy
```

Confirm via `get_page_text` or a screenshot that the badge, title, 4 step titles/descriptions, and the hero-screen content (idle glow / AI Outreach / Scanning / Leads markup) are all present in the page — layout will look wrong (no 2-column grid yet, states 2-4 possibly overlapping state 1) until Task 3 lands. That's expected at this checkpoint.

- [ ] **Step 3: Commit**

```bash
git add landing/index.html
git commit -m "Rebuild hero HTML: static title + 4-step structure

Replaces the crossfading-phrase/invisible-trigger hero markup with a
static badge+title followed by a .hero-scroll row (4 .hero-step
blocks + .hero-screen), mirroring how-it-works.html's own proven
structure. The 4 .hs-state card contents are unchanged, just
recontainered. CSS (Task 3) and JS (Task 4) still need to catch up —
layout will look wrong until then."
```

---

### Task 3: CSS — steps/visual layout, remove dead rules

**Files:**
- Modify: `landing/index.html` (hero CSS block, currently lines 321-522 — replace in full)

**Interfaces:**
- Consumes: `.hero-scroll`/`.hero-steps`/`.hero-step`/`.hero-screen`/`.hs-state` structure from Task 2.
- Produces: `.hero-step.is-active` / `.hs-state.is-active` toggling targets that Task 4's JS drives.

- [ ] **Step 1: Replace the entire hero CSS section**

Replace the full block from the `/* ---------- hero : ... ---------- */` comment (line 321) through the closing `}` of the reduced-motion media query (line 522) with:

```css
/* ---------- hero : static title + 4-step scrollspy row ----------
   Light "steps" pivot (2026-07-24): reuses how-it-works.html's own
   proven .hw-scroll/.hw-steps/.hw-visual pattern verbatim (renamed
   hero-/hs- to match this file's existing prefixes), replacing the
   dark pivot's sticky-pin/invisible-trigger-block system entirely. */

.hero{
  position:relative;
  background:var(--bg);
}

.hero-scroll{ display:grid; gap:1.1rem; margin-top:2.4rem; }
.hero-steps{ display:grid; gap:1.1rem; }
.hero-step{
  background:var(--card);
  border:1px solid var(--line);
  border-radius:16px;
  padding:1.5rem 1.4rem;
  transition:opacity .3s ease;
}
.hero-n{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  width:2.1rem;
  height:2.1rem;
  border-radius:50%;
  background:var(--accent);
  border:3px solid #141414;
  box-shadow:3px 4px 0 rgba(0,0,0,.5);
  color:#141414;
  font-family:var(--display);
  font-weight:800;
  font-size:.92rem;
  margin-bottom:1.1rem;
}
.hero-step:nth-of-type(odd) .hero-n{ transform:rotate(-6deg); }
.hero-step:nth-of-type(even) .hero-n{ transform:rotate(5deg); }
.hero-t{ font-family:var(--display); font-weight:700; color:var(--ink); font-size:1rem; margin-bottom:.4rem; }
.hero-d{ font-size:.92rem; line-height:1.55; color:var(--body); }

/* ---------- hero screen mockup (evolves per active step) ---------- */

.hero-screen{
  display:none;
  background:var(--card);
  border:3px solid var(--ink);
  border-radius:20px;
  overflow:hidden;
  box-shadow:6px 8px 0 rgba(0,0,0,.5);
}
@media (max-width:899.98px){
  .hero-screen{ display:block; margin-bottom:2rem; }
  .hs-state{ display:none; }
  .hs-state[data-hero-screen-state="1"]{ display:block; }
}

.hs-chrome{
  display:flex;
  align-items:center;
  gap:.55rem;
  padding:.8rem 1.1rem;
  background:var(--card-2);
  border-bottom:1px solid var(--line);
  font-size:.82rem;
  color:var(--faint);
}
.hs-chrome b{ color:var(--ink); font-weight:600; }

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
.hs-scan-score{ grid-column:2; grid-row:1 / span 2; align-self:center; font-weight:700; font-size:.78rem; color:var(--bg); background:var(--ok); border-radius:999px; padding:.15rem .55rem; height:fit-content; }

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

.hero-cta-zone{
  padding:2rem 1.375rem 3.5rem;
  display:flex;
  flex-direction:column;
  align-items:center;
  text-align:center;
  gap:.9rem;
}
.hero-reassure{ font-size:.82rem; color:var(--faint); letter-spacing:.01em; }

@media (min-width:900px){
  .hero-scroll{ grid-template-columns:1fr 1fr; gap:3.5rem; align-items:start; }
  .hero-steps{ gap:9rem; padding:2rem 0; }
  .hero-step{ opacity:.4; }
  .hero-step.is-active{ opacity:1; }

  .hero-screen{ display:block; position:sticky; top:7rem; min-height:22rem; }
  .hs-state{ display:none; position:absolute; inset:0; opacity:0; transition:opacity .45s ease; }
  .hs-state.is-active{ display:block; opacity:1; }
}
@media (min-width:900px) and (prefers-reduced-motion: reduce){
  .hero-step{ opacity:1; }
  .hs-state{ position:static; display:none; opacity:1; transition:none; }
  .hs-state[data-hero-screen-state="1"]{ display:block; }
  .hs-idle-glow{ animation:none; opacity:.5; }
}
```

Notes for the implementer:
- `.hero-triggers`, `.hero-trigger`, `.hero-pin`, `.hero-phase-zone`, `.hero-phase`, `.hero-scroll-cue`, and the `hero-phase-in`/`hero-cue-bounce` keyframes are all deleted — none of them are referenced by the new HTML from Task 2, and none should remain in the CSS.
- The desktop `.hs-state` rule needs BOTH a `display:none`/`.is-active{display:block}` toggle AND `opacity` — `display:none` is required so inactive states don't affect `.hero-screen`'s sizing or intercept clicks/text-selection while stacked via `position:absolute`, while `opacity` still drives the crossfade transition on the active one. This mirrors `how-it-works.html`'s `.hw-frame` exactly (`opacity:0` + `.is-active{opacity:1}`, no separate `display` toggle there) — but that file's `.hw-frame` uses `position:absolute` from a plain (non-conditional) rule, so it never needs a `display` toggle at all. Follow the pattern above (with the extra `display` toggle) since our `.hs-state` base rule isn't always `position:absolute` (mobile keeps normal-flow `display:none/block` toggling, per the `max-width:899.98px` block above) — don't collapse this into the simpler `how-it-works.html` version, they have genuinely different mobile fallback needs.
- Reduced-motion block: steps show at full opacity (no dimming animation) and `.hero-screen` shows only state 1, statically. Note this is a deliberate *improvement* over `how-it-works.html`'s own current behavior, not a copy of it: that page's script also early-returns under reduced motion (`if (!desktop.matches || reduced.matches) return;`), but it has no matching CSS override for `.hw-step{opacity:.4}` — so on `how-it-works.html` today, steps 2-5 stay permanently dimmed for reduced-motion users (only step 1 ships with `is-active` in the static HTML). The `.hero-step{opacity:1}` override above fixes that gap for the hero. Don't "fix" `how-it-works.html` to match — that page is out of scope for this plan; only note the difference here so a future reviewer doesn't mistake it for an inconsistency.

- [ ] **Step 2: Deploy and verify layout at all 3 conditions**

```bash
cd landing && netlify deploy
```

Desktop (≥900px): confirm a 2-column row — 4 step cards on the left (first one at full opacity, others dimmed to .4 opacity by default before JS runs — that's expected pre-Task-4, JS will handle the crossfade), `.hero-screen` on the right showing state 1 (idle glow) only, since no `.is-active` class exists on states 2-4 yet and the mobile-only `display:block` override doesn't apply at this width — confirm nothing overlaps or breaks layout. Mobile (<900px): confirm steps stack normally, `.hero-screen` shows state 1 only, no horizontal scrollbar. Reduced-motion at desktop width: confirm steps all show at full opacity, screen shows state 1 only.

- [ ] **Step 3: Commit**

```bash
git add landing/index.html
git commit -m "Hero CSS: steps/visual scrollspy layout, remove dead rules

Ports how-it-works.html's .hw-scroll/.hw-steps/.hw-visual pattern to
the hero (renamed hero-/hs- prefixes), replacing the sticky-pin +
invisible-trigger-block system. Deletes .hero-triggers, .hero-pin,
.hero-phase-zone/.hero-phase, .hero-scroll-cue and their keyframes —
none are referenced by the new HTML. Scrollspy toggling (Task 4)
still needed for the crossfade to actually animate on scroll."
```

---

### Task 4: JS — adopt how-it-works.html's scrollspy pattern

**Files:**
- Modify: `landing/index.html:1391-1431` (JS scrollspy IIFE)

**Interfaces:**
- Consumes: `.hero-scroll`/`.hero-step[data-hero-step]`/`.hs-state[data-hero-screen-state]` from Tasks 2-3.
- Produces: `.is-active` toggling on both `.hero-step` and `.hs-state` elements, driven by real scroll position.

- [ ] **Step 1: Replace the scrollspy IIFE**

Replace lines 1391-1431 (from the `/* Hero scroll sequence ... */` comment through the closing `})();`) with:

```js
  /* Hero scroll sequence : same technique as how-it-works.html's own
     scrollspy — the 4 real .hero-step blocks (not separate invisible
     triggers) are the IntersectionObserver targets; whichever one is
     currently crossing the viewport's vertical middle decides which
     step/screen-state is active. Desktop only, disabled under
     prefers-reduced-motion — mobile/reduced-motion users just see
     step 1 and the idle screen state statically (CSS default). */
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

Note for the implementer: this observes `.hero-step` elements directly (real, visible content blocks with real height from their own padding/line-height/the `gap:9rem` desktop spacing) — there are no more separate invisible trigger divs. This is a straight port of `how-it-works.html`'s own `hw-scroll` IIFE (same `rootMargin`/`threshold`, same `applyActive()` shape), renamed to this file's `hero-`/`data-hero-step`/`data-hero-screen-state` identifiers.

- [ ] **Step 2: Deploy and verify the full scroll-driven behavior**

```bash
cd landing && netlify deploy
```

Desktop (≥900px), using real scroll (mouse-wheel simulation via the browser tool's `scroll` action, not JS `scrollTo()`/`scrollIntoView()`): scroll slowly through the 4 steps and confirm (a) each step card brightens to full opacity as it becomes current and dims back to .4 opacity once passed, (b) `.hero-screen`'s content crossfades in sync — idle glow → AI Outreach Agent → Scanning platforms → New Lead/Not Relevant — never showing two states at once or a blank gap between transitions, (c) scrolling back up re-triggers the earlier states correctly. Mobile (<900px): confirm the whole hero still reads fine as plain stacked content (no JS runs, matches the `if (!desktop.matches...) return`). `prefers-reduced-motion: reduce` at desktop width: confirm no scroll-driven animation occurs and step 1 / screen state 1 remain visible throughout (CSS-only static fallback from Task 3, JS never engages here either).

- [ ] **Step 3: Commit**

```bash
git add landing/index.html
git commit -m "Hero JS: scrollspy observes real step blocks, not triggers

Direct port of how-it-works.html's own IntersectionObserver pattern
(same rootMargin/threshold/applyActive shape) onto the new hero
structure — completes the light steps pivot's scroll-driven
crossfade."
```

---

### Task 5: Final visual pass, prod deploy, CLAUDE.md update

**Files:** None planned (verification + deploy only, unless the visual pass surfaces a fix).

**Interfaces:**
- Consumes: everything from Tasks 1-4.

- [ ] **Step 1: Full-page visual sweep on the latest preview**

```bash
cd landing && netlify deploy
```

Check, in order: (a) nav pill and CTA read correctly against the light background, CTA still scrolls to and focuses `#hero-form` correctly; (b) hero desktop ≥900px — full scroll-through of all 4 steps as in Task 4 Step 2, plus confirm the badge and static title render above the steps row and never change; (c) hero mobile <900px — stacked steps, static screen state 1, no overflow; (d) `prefers-reduced-motion: reduce` at both widths; (e) submit the capture form with a test URL, confirm the lead-magnet modal still opens correctly, shows the PageSpeed score + blurred teaser card (from the earlier dark-pivot cycle, untouched by this plan) on the now-light palette, and a real submission still shows the existing success state; (f) spot-check `/how-it-works.html`, `/guides.html`, `/use-case.html` still render exactly as before (untouched files) and now match the hero's palette with no visual seam between pages.

- [ ] **Step 2: Fix anything found, re-deploy, re-check**

If the sweep in Step 1 surfaces an issue, fix it directly in `landing/index.html`, redeploy, and re-run the relevant part of Step 1's checklist before proceeding. Commit any fix separately with a message describing what was wrong.

- [ ] **Step 3: Merge any concurrent remote changes before promoting**

```bash
git fetch origin main
git log --oneline HEAD..origin/main
```

If there are commits (e.g. an automated PH-winners cron commit, seen earlier this session), merge them:

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

Load `https://letsgetposted.com/` in a fresh tab and re-run the key parts of Step 1's checklist directly against production.

- [ ] **Step 6: Update `CLAUDE.md`**

Following the pattern already established for this project's prior same-day pivots (each gets its own dated `##` section, explicitly noting what it supersedes), add a new section: light palette reversion (and the site-wide-consistency reasoning behind it), the new static badge+title, the 4-step scrollspy row reusing `how-it-works.html`'s own pattern, and the intentional content overlap with `/how-it-works.html` (hero = 4-step teaser, that page = 5-step detail — confirmed with Cédric, not a bug to fix later). Mark the earlier "Hero en thème sombre..." section as superseded.

```bash
git add CLAUDE.md
git commit -m "Document the hero light steps pivot in CLAUDE.md"
git push origin main
```
