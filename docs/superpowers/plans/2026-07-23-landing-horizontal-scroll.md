# Landing Horizontal Scroll + Multi-Page Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `landing/index.html` as a nav + horizontal-scroll-only single page (5 screens: 4 hero phrases + capture form), extract the "How It Works" content to a new `landing/how-it-works.html`, add a new `landing/guides.html` hub page, and replace the dark theme with a light/neutral base palette — per `docs/superpowers/specs/2026-07-23-landing-horizontal-scroll-design.md`.

**Architecture:** Three self-contained static HTML files (existing pattern, no build system, no shared stylesheet). `index.html` becomes purely the horizontal hero sequence + capture flow; `how-it-works.html` and `guides.html` are conventional vertical-scroll pages that copy the same new light `:root` tokens independently.

**Tech Stack:** Vanilla HTML/CSS/JS, Netlify Forms, Netlify Functions (unchanged: `readiness.js`, `platform-copy.js`).

## Global Constraints

- No shared CSS/JS file between pages — each `landing/*.html` is independently self-contained (established pattern: `product-hunt-launch.html`, `reddit-launch.html`, `x-launch.html`).
- `index.html` must have **zero vertical scroll** — `body{ overflow:hidden; height:100vh; }` on that page only.
- Preserve these interfaces exactly (other code depends on them, do not rename): `#capture-form-hero` / `#cap-url-hero` form, `openPlatformModal()` / `runReadinessCheck()` / `#platform-modal-backdrop` / `#leadmagnet-modal` / `lm-form-modal` flow, `readiness.js`, `platform-copy.js` — none of these are touched by this plan.
- Desktop wheel→horizontal redirect only applies at `min-width:900px` (matches the breakpoint already used site-wide); mobile relies on native horizontal touch scroll, no JS.
- `prefers-reduced-motion` requires no special-casing beyond what's already true: the wheel-redirect JS uses `behavior:'auto'` (never `'smooth'`), so reduced-motion users get the same non-animated instant scroll as everyone else by construction.
- New light palette tokens (exact values, copy verbatim into every new/modified page):
  ```css
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
  ```
- `guides.html`/`how-it-works.html` get a normal footer with the Privacy Policy link; `index.html` gets no footer at all (no room without vertical scroll).
- Content decision made in this plan (not explicit in the spec, flagged here for visibility): `#book`'s value-prop copy ("You didn't build for six weeks to end at 3 likes", the 4-item gain list) and `#cta`'s banner tagline/headline are being retired from `index.html` per the spec's "5 screens only" scope. Rather than deleting this copy outright, Task 2 folds it into `how-it-works.html` as a closing section (that page already ends with `.hw-cta`, and it's the natural home for a deeper "why this pays off" pitch now that it's not on the main landing). If this isn't wanted, it's a one-task, easy revert.

---

### Task 1: New light palette tokens

**Files:**
- Modify: `landing/index.html:32-49` (the `:root` block)

**Interfaces:**
- Produces: the exact token values listed in Global Constraints above — Tasks 2-5 all consume these same values.

- [ ] **Step 1: Replace the `:root` block**

Current (`landing/index.html:32-49`):
```css
:root{
  --bg:        #0B0B12;
  --card:      #12121A;
  --card-2:    #16161F;
  --line:      #26262E;
  --line-soft: #1D1D26;
  --ink:       #F4F4F5;
  --body:      #A1A1AA;
  --faint:     #71717A;
  --accent:    #F2E96A;
  --accent-2:  #F2E96A;
  --accent-soft: rgba(242,233,106,.12);
  --accent-line: rgba(242,233,106,.35);
  --grad:      #F2E96A;
  --ok:        #4ADE80;
  --display: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
}
```
Replace with:
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
(`--accent-soft`/`--accent-line` switched to reference the darker `--accent-2` gold rather than the pale `--accent` yellow, so badge outlines/link-hover tints stay visible against the new light background instead of nearly disappearing.)

- [ ] **Step 2: Deploy preview and verify**

```bash
cd /Users/cedricdlc/Developer/getseen/landing && netlify deploy
```
Open the draft URL. Confirm: background is light cream, text is dark and legible, the yellow accent/stickers/badges are still visible and readable against the new background (check the hero, nav, `#how` section — everything currently reads correctly on light, since none of it depended on a specific dark value, only on the CSS variables).

- [ ] **Step 3: Commit**

```bash
cd /Users/cedricdlc/Developer/getseen
git add landing/index.html
git commit -m "$(cat <<'EOF'
style: replace dark theme with light/neutral base palette

Cédric's first-look feedback on landing v2 rejected the dark "AI
generic" look outright. This is a deliberately minimal, reversible
base (cream background, near-black text, same brand yellow accent) —
final art direction stays open, to be explored with more references
before committing further.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Extract "How It Works" to its own page

**Files:**
- Create: `landing/how-it-works.html`
- Modify: `landing/index.html` (remove `#how`, temporarily still linked from nav — Task 4 fixes the nav)

**Interfaces:**
- Consumes: the light palette tokens from Task 1 (copied fresh into this new file, not shared).
- Produces: `landing/how-it-works.html` as a real, linkable page — Task 4's nav link depends on this file existing.

- [ ] **Step 1: Create `landing/how-it-works.html`**

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>How It Works — Posted.</title>
<meta name="description" content="From submission to live, in one flow — how Posted. gets your launch in front of real buyers.">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&display=swap">
<style>
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
  --display: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
}
*,*::before,*::after{ box-sizing:border-box; margin:0; padding:0; }
html{ scroll-behavior:smooth; }
@media (prefers-reduced-motion: reduce){
  html{ scroll-behavior:auto; }
  *,*::before,*::after{ animation:none !important; transition:none !important; }
}
body{ background:var(--bg); color:var(--body); font-family:var(--sans); font-size:1.0625rem; line-height:1.65; -webkit-font-smoothing:antialiased; }
.wrap{ max-width:70rem; margin:0 auto; padding:0 1.375rem; }
.wrap--narrow{ max-width:46rem; }
h1,h2{ font-family:var(--display); color:var(--ink); font-weight:700; text-wrap:balance; }
h2{ font-size:clamp(1.85rem, 1.1rem + 3.1vw, 3.1rem); line-height:1.06; letter-spacing:-.035em; margin-bottom:1.35rem; max-width:44rem; }
a{ color:var(--accent-2); }
.badge{ display:inline-flex; align-items:center; gap:.5rem; font-size:.74rem; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--accent-2); background:var(--accent-soft); border:1px solid var(--accent-line); border-radius:999px; padding:.32rem .9rem; margin-bottom:1.4rem; }
.badge::before{ content:""; width:.42rem; height:.42rem; border-radius:50%; background:var(--accent-2); }
.mark-word{ position:relative; display:inline-block; font-weight:600; color:var(--ink); }
.mark-word::after{ content:""; position:absolute; left:-.06em; right:-.06em; bottom:-.1em; height:.38em; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 12' preserveAspectRatio='none'%3E%3Cpath d='M1,8 Q15,2 30,7 T60,6 T99,8' fill='none' stroke='%23C9A800' stroke-width='6' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-size:100% 100%; }
nav.nav{ padding:1.2rem 0; }
.nav-in{ display:flex; align-items:center; justify-content:space-between; }
.brand{ font-family:var(--display); font-weight:800; font-size:1.2rem; color:var(--ink); text-decoration:none; }
section{ padding:5rem 0; }
@media (min-width:760px){ section{ padding:6.5rem 0; } }

/* ---------- how it works (verbatim from index.html pre-split) ---------- */
.hw-scroll{ display:grid; gap:1.1rem; margin-top:2.4rem; }
.hw-steps{ display:grid; gap:1.1rem; }
.hw-visual{ display:none; }
.hw-step{ background:var(--card); border:1px solid var(--line); border-radius:16px; padding:1.5rem 1.4rem; transition:opacity .3s ease; }
.hw-n{ display:inline-flex; align-items:center; justify-content:center; width:2.1rem; height:2.1rem; border-radius:50%; background:var(--accent); border:3px solid #141414; box-shadow:3px 4px 0 rgba(0,0,0,.5); color:#141414; font-family:var(--display); font-weight:800; font-size:.92rem; margin-bottom:1.1rem; }
.hw-step:nth-of-type(odd) .hw-n{ transform:rotate(-6deg); }
.hw-step:nth-of-type(even) .hw-n{ transform:rotate(5deg); }
.hw-t{ font-family:var(--display); font-weight:700; color:var(--ink); font-size:1rem; margin-bottom:.4rem; }
.hw-d{ font-size:.92rem; line-height:1.55; color:var(--body); }
@media (min-width:900px){
  .hw-scroll{ grid-template-columns:1fr 1fr; gap:3.5rem; align-items:start; }
  .hw-steps{ gap:9rem; padding:2rem 0; }
  .hw-step{ opacity:.4; }
  .hw-step.is-active{ opacity:1; }
  .hw-visual{ display:block; position:sticky; top:7rem; height:23rem; }
  .hw-frame{ position:absolute; inset:0; background:var(--card); border:3px solid #141414; box-shadow:6px 8px 0 rgba(0,0,0,.45); border-radius:20px; padding:1.6rem; opacity:0; transition:opacity .45s ease; }
  .hw-frame.is-active{ opacity:1; }
}
.hwm-url{ display:flex; align-items:center; gap:.6rem; background:var(--card-2); border:1px solid var(--line); border-radius:10px; padding:.6rem .9rem; font-size:.85rem; color:var(--faint); margin-bottom:1.3rem; }
.hwm-url b{ color:var(--ink); font-weight:600; }
.hwm-scan{ display:flex; align-items:center; gap:.5rem; font-size:.82rem; color:var(--accent-2); }
.hwm-scan .dot{ width:.42rem; height:.42rem; border-radius:50%; background:var(--accent-2); }
.hwm-badges{ display:flex; gap:.8rem; margin-top:1.4rem; }
.hwm-badge{ width:2.8rem; height:2.8rem; border-radius:50%; display:flex; align-items:center; justify-content:center; background:var(--card-2); border:1px solid var(--line); }
.hwm-badge--generic::after{ content:""; width:.6rem; height:.6rem; border-radius:50%; background:var(--accent-2); }
.hwm-lines{ display:grid; gap:.55rem; margin-top:.4rem; }
.hwm-line{ height:.6rem; border-radius:999px; background:var(--line); }
.hwm-line--short{ width:55%; }
.hwm-approve{ display:inline-flex; align-items:center; gap:.5rem; background:var(--grad); color:#141414; font-weight:700; font-size:.85rem; padding:.6rem 1.1rem; border-radius:999px; margin-top:1.5rem; }
.hw-cta{ margin-top:2.4rem; text-align:center; }
.btn{ display:inline-flex; align-items:center; gap:.55rem; border:0; cursor:pointer; text-decoration:none; font-family:var(--sans); font-weight:600; font-size:.95rem; color:#141414; background:var(--grad); border-radius:999px; padding:.72rem 1.5rem; }

/* ---------- closing pitch, folded in from the retired #book/#cta ---------- */
.closing{ text-align:center; }
.closing h2{ margin-left:auto; margin-right:auto; }
.gain-box{ background:var(--card); border:1px solid var(--line); border-radius:16px; padding:1.6rem; max-width:34rem; margin:2rem auto 0; text-align:left; }
.gain-list{ list-style:none; display:grid; gap:.9rem; }
.gain-list li{ display:grid; grid-template-columns:auto 1fr; gap:.7rem; font-size:.95rem; }
.g-ico{ color:var(--accent-2); font-weight:700; }

footer{ padding:2.5rem 0; border-top:1px solid var(--line-soft); text-align:center; }
.foot-privacy{ font-size:.82rem; color:var(--faint); text-decoration:none; }
.foot-privacy:hover{ color:var(--ink); }
</style>
</head>
<body>

<nav class="nav">
  <div class="wrap nav-in">
    <a class="brand" href="/">Posted.</a>
  </div>
</nav>

<section id="how">
  <div class="wrap wrap--narrow">
    <span class="badge">How It Works</span>
    <h2>From submission to live, in one flow.</h2>
    <div class="hw-scroll" id="hw-scroll">
      <div class="hw-steps">
        <div class="hw-step is-active" data-hw-step="1">
          <span class="hw-n" aria-hidden="true">1</span>
          <p class="hw-t">Submit <span class="mark-word">your product</span></p>
          <p class="hw-d">Drop your URL. We check what's already there: meta tags, load speed, what a launch post needs to look right.</p>
        </div>
        <div class="hw-step" data-hw-step="2">
          <span class="hw-n" aria-hidden="true">2</span>
          <p class="hw-t">We match <span class="mark-word">your platforms</span></p>
          <p class="hw-d">8 years of research on which niche fits which platform, so you land in the right rooms, not just any room.</p>
        </div>
        <div class="hw-step" data-hw-step="3">
          <span class="hw-n" aria-hidden="true">3</span>
          <p class="hw-t">We draft everything, in <span class="mark-word">your voice</span></p>
          <p class="hw-d">Posts, comments, DMs. Written to sound like you, not a template.</p>
        </div>
        <div class="hw-step" data-hw-step="4">
          <span class="hw-n" aria-hidden="true">4</span>
          <p class="hw-t"><span class="mark-word">You approve</span>, it goes live</p>
          <p class="hw-d">Nothing posts without your OK. Ever. We track the replies and follow up so you don't have to.</p>
        </div>
        <div class="hw-step" data-hw-step="5">
          <span class="hw-n" aria-hidden="true">5</span>
          <p class="hw-t">Real <span class="mark-word">conversations</span>, not just views</p>
          <p class="hw-d">Buying signals, not bought lists — every DM drafted and ready to send, with follow-ups for the silent ones.</p>
        </div>
      </div>
      <div class="hw-visual" aria-hidden="true">
        <div class="hw-frame is-active" data-hw-frame="1">
          <div class="hwm-url">🔗 <b>yourproduct.com</b></div>
          <div class="hwm-scan"><span class="dot"></span>Reading your page…</div>
        </div>
        <div class="hw-frame" data-hw-frame="2">
          <div class="hwm-scan"><span class="dot"></span>Ranking for your niche…</div>
          <div class="hwm-badges">
            <span class="hwm-badge hwm-badge--generic"></span>
            <span class="hwm-badge hwm-badge--generic"></span>
            <span class="hwm-badge hwm-badge--generic"></span>
          </div>
        </div>
        <div class="hw-frame" data-hw-frame="3">
          <div class="hwm-scan"><span class="dot"></span>Drafting in your voice…</div>
          <div class="hwm-lines">
            <div class="hwm-line"></div>
            <div class="hwm-line"></div>
            <div class="hwm-line hwm-line--short"></div>
          </div>
        </div>
        <div class="hw-frame" data-hw-frame="4">
          <div class="hwm-scan"><span class="dot"></span>Ready for your review</div>
          <div class="hwm-lines">
            <div class="hwm-line"></div>
            <div class="hwm-line hwm-line--short"></div>
          </div>
          <span class="hwm-approve">✓ Approve &amp; post</span>
        </div>
        <div class="hw-frame" data-hw-frame="5">
          <div class="hwm-scan"><span class="dot"></span>New reply</div>
          <div class="hwm-lines">
            <div class="hwm-line"></div>
            <div class="hwm-line hwm-line--short"></div>
          </div>
          <span class="hwm-approve">💬 Real conversation started</span>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="closing">
  <div class="wrap wrap--narrow">
    <h2>You didn't build for six weeks to end at 3 likes.</h2>
    <p>Your entire market can know you exist. Or you can refresh your analytics for another month.</p>
    <div class="gain-box">
      <ul class="gain-list">
        <li><span class="g-ico" aria-hidden="true">+</span><span>40+ hours back. The posting, the research, the follow-ups: done for you.</span></li>
        <li><span class="g-ico" aria-hidden="true">+</span><span>Live on 25+ platforms, not just the one you'd have gotten around to.</span></li>
        <li><span class="g-ico" aria-hidden="true">+</span><span>Real conversations with people who could buy. Not likes.</span></li>
        <li><span class="g-ico" aria-hidden="true">+</span><span>Nothing posts without your OK. Ever.</span></li>
      </ul>
    </div>
    <div class="hw-cta">
      <a class="btn" href="/#h-scroll">Get access to the beta <span aria-hidden="true">→</span></a>
    </div>
  </div>
</section>

<footer>
  <a href="/privacy.html" class="foot-privacy">Privacy Policy</a>
</footer>

<script>
(function () {
  var scroll = document.getElementById('hw-scroll');
  if (!scroll) return;
  var desktop = window.matchMedia('(min-width:900px)');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!desktop.matches || reduced.matches) return;

  var steps = Array.prototype.slice.call(scroll.querySelectorAll('[data-hw-step]'));
  var frames = Array.prototype.slice.call(scroll.querySelectorAll('[data-hw-frame]'));
  var above = new Set();

  function applyActive() {
    var current = null;
    steps.forEach(function (s) { if (above.has(s)) current = s; });
    if (!current) current = steps[0];
    var n = current.getAttribute('data-hw-step');
    steps.forEach(function (s) { s.classList.toggle('is-active', s === current); });
    frames.forEach(function (f) { f.classList.toggle('is-active', f.getAttribute('data-hw-frame') === n); });
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
</script>
</body>
</html>
```

- [ ] **Step 2: Remove `#how` from `landing/index.html`**

Find and delete the entire block starting at `<!-- ================= HOW IT WORKS ================= -->` through the `</section>` that closes `<section id="how">` (currently `landing/index.html:1599-1678`, but re-locate by the comment/id rather than trusting these line numbers — Task 1 doesn't shift HTML line numbers, but confirm before deleting).

Also delete the now-orphaned `#how`-only CSS from the `<style>` block: search for and remove the rule blocks for `.hw-scroll`, `.hw-steps`, `.hw-visual`, `.hw-step`, `.hw-n`, `.hw-t`, `.hw-d`, the `@media (min-width:900px){ .hw-scroll{...} ... }` block, `.hwm-*` (all of them), `.hw-cta`. These are now fully duplicated (verbatim) into `how-it-works.html` from Step 1, so `index.html` no longer needs them. Verify after deleting: `grep -n "hw-scroll\|hw-step\|hwm-" landing/index.html` returns zero matches.

- [ ] **Step 3: Deploy preview and verify**

```bash
cd /Users/cedricdlc/Developer/getseen/landing && netlify deploy
```
Open `<draft-url>/how-it-works.html` directly. Confirm: page renders with light palette, 5-step "How It Works" scrollspy works exactly as it did on the old `index.html` (steps 1-5 highlight as you scroll, mockup frames crossfade), closing pitch section renders, footer with Privacy Policy link works. Then open the draft root URL — `#how` should no longer be present there (existing hero/nav still work, `#how` section is just gone — this is expected and fine, Task 4 fixes the nav link).

- [ ] **Step 4: Commit**

```bash
git add landing/how-it-works.html landing/index.html
git commit -m "$(cat <<'EOF'
feat: extract How It Works to its own page

Landing v2's merged 5-step section moves to how-it-works.html
verbatim (same scrollspy JS, same mockups), plus the retired
#book/#cta closing pitch copy folded in as a closing section rather
than deleted outright. Prerequisite for converting index.html to a
horizontal-only single screen with no room for a 5-step section.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Create the guides hub page

**Files:**
- Create: `landing/guides.html`

**Interfaces:**
- Consumes: light palette tokens from Task 1; links to the existing, unmodified `product-hunt-launch.html`, `reddit-launch.html`, `x-launch.html`.
- Produces: `landing/guides.html` as a real page — Task 4's nav link depends on this file existing.

- [ ] **Step 1: Create `landing/guides.html`**

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Platform Guides — Posted.</title>
<meta name="description" content="Real, sourced launch guides for Product Hunt, Reddit, and X — not generic advice.">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&display=swap">
<style>
:root{
  --bg:        #FBF8F1;
  --card:      #F3EEE0;
  --line:      #E2DBC8;
  --line-soft: #EAE4D3;
  --ink:       #1A1917;
  --body:      #57534A;
  --faint:     #8A8478;
  --accent-2:  #C9A800;
  --display: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
}
*,*::before,*::after{ box-sizing:border-box; margin:0; padding:0; }
body{ background:var(--bg); color:var(--body); font-family:var(--sans); font-size:1.0625rem; line-height:1.65; -webkit-font-smoothing:antialiased; }
.wrap{ max-width:46rem; margin:0 auto; padding:0 1.375rem; }
h1{ font-family:var(--display); font-weight:700; color:var(--ink); font-size:clamp(1.85rem, 1.1rem + 3.1vw, 3.1rem); letter-spacing:-.035em; margin-bottom:.6rem; }
nav.nav{ padding:1.2rem 0; }
.brand{ font-family:var(--display); font-weight:800; font-size:1.2rem; color:var(--ink); text-decoration:none; }
main{ padding:3rem 0 5rem; }
.lede{ color:var(--body); margin-bottom:2.5rem; max-width:34rem; }
.guide-list{ display:grid; gap:1.1rem; }
.guide-card{ display:block; background:var(--card); border:1px solid var(--line); border-radius:16px; padding:1.6rem; text-decoration:none; }
.guide-card h2{ font-family:var(--display); font-weight:700; color:var(--ink); font-size:1.15rem; margin-bottom:.4rem; }
.guide-card p{ color:var(--body); font-size:.92rem; }
footer{ padding:2.5rem 0; border-top:1px solid var(--line-soft); text-align:center; }
.foot-privacy{ font-size:.82rem; color:var(--faint); text-decoration:none; }
</style>
</head>
<body>

<nav class="nav">
  <div class="wrap"><a class="brand" href="/">Posted.</a></div>
</nav>

<main class="wrap">
  <h1>Platform Guides</h1>
  <p class="lede">Real, sourced checklists — pulled from each platform's actual rules and real launch data, not generic advice.</p>
  <div class="guide-list">
    <a class="guide-card" href="/product-hunt-launch.html">
      <h2>Product Hunt</h2>
      <p>51 days of real #1 Product of the Day data, and the exact checklist behind it.</p>
    </a>
    <a class="guide-card" href="/reddit-launch.html">
      <h2>Reddit</h2>
      <p>The 90/10 rule and the real community norms most launches break.</p>
    </a>
    <a class="guide-card" href="/x-launch.html">
      <h2>X</h2>
      <p>What actually gets a launch thread seen, and the anti-engagement-farming rules to know first.</p>
    </a>
  </div>
</main>

<footer>
  <a href="/privacy.html" class="foot-privacy">Privacy Policy</a>
</footer>
</body>
</html>
```

- [ ] **Step 2: Deploy preview and verify**

```bash
cd /Users/cedricdlc/Developer/getseen/landing && netlify deploy
```
Open `<draft-url>/guides.html`. Confirm: 3 cards render, each links to its real existing guide page and loads correctly.

- [ ] **Step 3: Commit**

```bash
git add landing/guides.html
git commit -m "$(cat <<'EOF'
feat: add guides hub page

Simple index for the 3 existing platform guides (Product Hunt,
Reddit, X) — replaces the footer-based discovery on index.html,
which no longer has a footer once it becomes horizontal-only.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Rewrite `index.html` — compact nav + horizontal-scroll hero, remove everything else

**Files:**
- Modify: `landing/index.html` (nav, hero, remove `#book`/`#cta`/footer/`#ctabar`, JS cleanup)

**Interfaces:**
- Consumes: `how-it-works.html` and `guides.html` from Tasks 2-3 (nav links point to them) — must run after those tasks.
- Consumes: light palette tokens from Task 1.
- Preserves exactly: `#capture-form-hero` / `#cap-url-hero` form markup and ids, `openPlatformModal()` / `runReadinessCheck()` / `renderReadiness()` / `platformCardsInner()` / `platformPreviews()` / `fetchPlatformCopy()` / the `#platform-modal-backdrop` markup and its child ids (`ready-load-modal`, `ready-result-modal`, `leadmagnet-modal`, `lm-form-modal`, `lm-url-modal`, `lm-email-modal`, `lm-success-modal`, `modal-close`, `modal-title`) — none of these change.
- Removes: `wire('capture-form-banner', ...)` call (its form is deleted), the sticky-bar IIFE (its target `#ctabar`/`#book` are deleted), the old hero pin/scrollspy IIFE (replaced by native scroll + a small wheel-redirect script).

- [ ] **Step 1: Replace the nav**

Current (`landing/index.html:1501-1512`):
```html
<nav class="nav" aria-label="Main navigation">
  <div class="wrap nav-in">
    <a class="brand brand-sticker" href="#">
      <span class="sticker-patch">Posted<span class="sticker-dot">.</span></span>
    </a>
    <div class="nav-links">
      <a href="#how">How it works</a>
      <a href="#guides">Guides</a>
    </div>
    <a class="btn" href="#book">Get access to the beta <span class="a" aria-hidden="true">→</span></a>
  </div>
</nav>
```
Replace with:
```html
<nav class="nav-pill" aria-label="Main navigation">
  <a class="brand brand-sticker" href="/">
    <span class="sticker-patch sticker-patch--sm">Posted<span class="sticker-dot">.</span></span>
  </a>
  <div class="nav-links">
    <a href="/how-it-works.html">How it works</a>
    <a href="/guides.html">Guides</a>
  </div>
  <a class="btn nav-cta" href="#h-scroll" id="nav-beta-cta">Get access to the beta <span class="a" aria-hidden="true">→</span></a>
</nav>
```

- [ ] **Step 2: Replace the nav CSS**

Find the existing `.nav`/`.nav-in`/`.nav-links` rule block in the `<style>` section (search for `.nav{` — it's near the other layout rules, before the hero CSS) and replace it with:
```css
body{ overflow:hidden; height:100vh; }

.nav-pill{
  position:fixed;
  top:1.2rem;
  left:50%;
  transform:translateX(-50%);
  z-index:50;
  display:flex;
  align-items:center;
  gap:1.8rem;
  background:#FFFFFF;
  border:1px solid var(--line);
  border-radius:999px;
  padding:.6rem .7rem .6rem 1.1rem;
  box-shadow:0 8px 24px rgba(26,25,23,.08);
}
.nav-links{ display:flex; gap:1.4rem; }
.nav-links a{ font-size:.88rem; font-weight:500; color:var(--body); text-decoration:none; }
.nav-links a:hover{ color:var(--ink); }
.nav-cta{ padding:.55rem 1.2rem; font-size:.85rem; }
@media (max-width:640px){
  .nav-links{ display:none; }
  .nav-pill{ gap:.8rem; }
}
```
(`body{ overflow:hidden; height:100vh; }` is the load-bearing rule for "no vertical scroll at all" — everything below now happens inside the horizontally-scrolling `#h-scroll` container, which is the only thing allowed to overflow.)

- [ ] **Step 3: Replace the entire hero with the horizontal-scroll sequence**

Current (`landing/index.html:1514-1597`, the full `<header class="hero" id="hero-scroll">...</header>` block) — replace entirely with:
```html
<!-- ================= HERO : horizontal-scroll sequence ================= -->
<div id="h-scroll" tabindex="0">
  <section class="h-screen">
    <span class="badge h-badge">Built for Solo SaaS Founders</span>
    <svg class="hb-diagram" viewBox="0 0 420 260" aria-hidden="true" focusable="false">
      <path class="hb-wire" d="M210 130 Q210 90 90 60"/>
      <path class="hb-wire" d="M210 130 Q210 100 210 40"/>
      <path class="hb-wire" d="M210 130 Q210 90 330 60"/>
      <g class="hb-hub"><circle cx="210" cy="130" r="26" fill="#F2E96A"/><text x="210" y="137" text-anchor="middle" font-size="15" font-weight="800" fill="#141414">You</text></g>
      <g class="hb-badge"><circle cx="90" cy="52" r="22" fill="#FFFFFF" stroke="#141414" stroke-width="3"/><svg x="79" y="41" width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#FF6154"/><path fill="#FFFFFF" fill-rule="evenodd" d="M9.3 17.4V6.6h4a3.7 3.7 0 0 1 0 7.4h-1.8v3.4H9.3zm2.2-8.6v3h1.8a1.5 1.5 0 0 0 0-3h-1.8z"/></svg></g>
      <g class="hb-badge"><circle cx="210" cy="30" r="22" fill="#FFFFFF" stroke="#141414" stroke-width="3"/><svg x="200" y="20" width="20" height="20" viewBox="0 0 24 24"><rect width="24" height="24" rx="4.5" fill="#0A66C2"/><path fill="#FFFFFF" d="M7.94 18.5H5.2V9.85h2.74v8.65zM6.57 8.67a1.59 1.59 0 1 1 0-3.17 1.59 1.59 0 0 1 0 3.17zM18.8 18.5h-2.73v-4.21c0-1-.02-2.3-1.4-2.3-1.4 0-1.62 1.1-1.62 2.22v4.29H10.3V9.85h2.62v1.18h.04c.36-.69 1.25-1.42 2.58-1.42 2.76 0 3.26 1.82 3.26 4.18v4.71z"/></svg></g>
      <g class="hb-badge"><circle cx="330" cy="52" r="22" fill="#FFFFFF" stroke="#141414" stroke-width="3"/><svg x="319" y="41" width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#FF4500"/><path d="M12 8.2c.1-1.9 1.1-3.2 2.9-3.4" fill="none" stroke="#FFFFFF" stroke-width="1.1" stroke-linecap="round"/><circle cx="15.3" cy="4.6" r="1.15" fill="#FFFFFF"/><circle cx="5.5" cy="12.6" r="1.5" fill="#FFFFFF"/><circle cx="18.5" cy="12.6" r="1.5" fill="#FFFFFF"/><ellipse cx="12" cy="13.8" rx="5.7" ry="4.3" fill="#FFFFFF"/><circle cx="9.7" cy="13.3" r="1.05" fill="#FF4500"/><circle cx="14.3" cy="13.3" r="1.05" fill="#FF4500"/><path d="M9.6 15.8c1.55 1.15 3.25 1.15 4.8 0" fill="none" stroke="#FF4500" stroke-width="1" stroke-linecap="round"/></svg></g>
    </svg>
    <p class="h-phrase">Stop procrastinating on your business launch.</p>
  </section>

  <section class="h-screen">
    <svg class="hb-diagram" viewBox="0 0 420 260" aria-hidden="true" focusable="false">
      <path class="hb-wire" d="M210 130 Q210 90 90 60"/>
      <path class="hb-wire" d="M210 130 Q210 100 210 40"/>
      <path class="hb-wire" d="M210 130 Q210 90 330 60"/>
      <g class="hb-hub"><circle cx="210" cy="130" r="26" fill="#F2E96A"/><text x="210" y="137" text-anchor="middle" font-size="15" font-weight="800" fill="#141414">You</text></g>
      <g class="hb-badge is-lit"><circle cx="90" cy="52" r="22" fill="#FFFFFF" stroke="#141414" stroke-width="3"/><svg x="79" y="41" width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#FF6154"/><path fill="#FFFFFF" fill-rule="evenodd" d="M9.3 17.4V6.6h4a3.7 3.7 0 0 1 0 7.4h-1.8v3.4H9.3zm2.2-8.6v3h1.8a1.5 1.5 0 0 0 0-3h-1.8z"/></svg></g>
      <g class="hb-badge"><circle cx="210" cy="30" r="22" fill="#FFFFFF" stroke="#141414" stroke-width="3"/><svg x="200" y="20" width="20" height="20" viewBox="0 0 24 24"><rect width="24" height="24" rx="4.5" fill="#0A66C2"/><path fill="#FFFFFF" d="M7.94 18.5H5.2V9.85h2.74v8.65zM6.57 8.67a1.59 1.59 0 1 1 0-3.17 1.59 1.59 0 0 1 0 3.17zM18.8 18.5h-2.73v-4.21c0-1-.02-2.3-1.4-2.3-1.4 0-1.62 1.1-1.62 2.22v4.29H10.3V9.85h2.62v1.18h.04c.36-.69 1.25-1.42 2.58-1.42 2.76 0 3.26 1.82 3.26 4.18v4.71z"/></svg></g>
      <g class="hb-badge"><circle cx="330" cy="52" r="22" fill="#FFFFFF" stroke="#141414" stroke-width="3"/><svg x="319" y="41" width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#FF4500"/><path d="M12 8.2c.1-1.9 1.1-3.2 2.9-3.4" fill="none" stroke="#FFFFFF" stroke-width="1.1" stroke-linecap="round"/><circle cx="15.3" cy="4.6" r="1.15" fill="#FFFFFF"/><circle cx="5.5" cy="12.6" r="1.5" fill="#FFFFFF"/><circle cx="18.5" cy="12.6" r="1.5" fill="#FFFFFF"/><ellipse cx="12" cy="13.8" rx="5.7" ry="4.3" fill="#FFFFFF"/><circle cx="9.7" cy="13.3" r="1.05" fill="#FF4500"/><circle cx="14.3" cy="13.3" r="1.05" fill="#FF4500"/><path d="M9.6 15.8c1.55 1.15 3.25 1.15 4.8 0" fill="none" stroke="#FF4500" stroke-width="1" stroke-linecap="round"/></svg></g>
    </svg>
    <p class="h-phrase">No posts. No leads. And you know it.</p>
  </section>

  <section class="h-screen">
    <svg class="hb-diagram" viewBox="0 0 420 260" aria-hidden="true" focusable="false">
      <path class="hb-wire" d="M210 130 Q210 90 90 60"/>
      <path class="hb-wire" d="M210 130 Q210 100 210 40"/>
      <path class="hb-wire" d="M210 130 Q210 90 330 60"/>
      <g class="hb-hub"><circle cx="210" cy="130" r="26" fill="#F2E96A"/><text x="210" y="137" text-anchor="middle" font-size="15" font-weight="800" fill="#141414">You</text></g>
      <g class="hb-badge is-lit"><circle cx="90" cy="52" r="22" fill="#FFFFFF" stroke="#141414" stroke-width="3"/><svg x="79" y="41" width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#FF6154"/><path fill="#FFFFFF" fill-rule="evenodd" d="M9.3 17.4V6.6h4a3.7 3.7 0 0 1 0 7.4h-1.8v3.4H9.3zm2.2-8.6v3h1.8a1.5 1.5 0 0 0 0-3h-1.8z"/></svg></g>
      <g class="hb-badge is-lit"><circle cx="210" cy="30" r="22" fill="#FFFFFF" stroke="#141414" stroke-width="3"/><svg x="200" y="20" width="20" height="20" viewBox="0 0 24 24"><rect width="24" height="24" rx="4.5" fill="#0A66C2"/><path fill="#FFFFFF" d="M7.94 18.5H5.2V9.85h2.74v8.65zM6.57 8.67a1.59 1.59 0 1 1 0-3.17 1.59 1.59 0 0 1 0 3.17zM18.8 18.5h-2.73v-4.21c0-1-.02-2.3-1.4-2.3-1.4 0-1.62 1.1-1.62 2.22v4.29H10.3V9.85h2.62v1.18h.04c.36-.69 1.25-1.42 2.58-1.42 2.76 0 3.26 1.82 3.26 4.18v4.71z"/></svg></g>
      <g class="hb-badge is-lit"><circle cx="330" cy="52" r="22" fill="#FFFFFF" stroke="#141414" stroke-width="3"/><svg x="319" y="41" width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#FF4500"/><path d="M12 8.2c.1-1.9 1.1-3.2 2.9-3.4" fill="none" stroke="#FFFFFF" stroke-width="1.1" stroke-linecap="round"/><circle cx="15.3" cy="4.6" r="1.15" fill="#FFFFFF"/><circle cx="5.5" cy="12.6" r="1.5" fill="#FFFFFF"/><circle cx="18.5" cy="12.6" r="1.5" fill="#FFFFFF"/><ellipse cx="12" cy="13.8" rx="5.7" ry="4.3" fill="#FFFFFF"/><circle cx="9.7" cy="13.3" r="1.05" fill="#FF4500"/><circle cx="14.3" cy="13.3" r="1.05" fill="#FF4500"/><path d="M9.6 15.8c1.55 1.15 3.25 1.15 4.8 0" fill="none" stroke="#FF4500" stroke-width="1" stroke-linecap="round"/></svg></g>
      <g class="hb-comment is-lit"><circle cx="352" cy="34" r="9" fill="#F2E96A"/><text x="352" y="38" text-anchor="middle" font-size="11" fill="#141414">💬</text></g>
    </svg>
    <p class="h-phrase">We find the right platforms for your niche <span class="mark-word">and do the posting for you</span>.</p>
  </section>

  <section class="h-screen">
    <svg class="hb-diagram" viewBox="0 0 420 260" aria-hidden="true" focusable="false">
      <path class="hb-wire" d="M210 130 Q210 90 90 60"/>
      <path class="hb-wire" d="M210 130 Q210 100 210 40"/>
      <path class="hb-wire" d="M210 130 Q210 90 330 60"/>
      <g class="hb-hub"><circle cx="210" cy="130" r="26" fill="#F2E96A"/><text x="210" y="137" text-anchor="middle" font-size="15" font-weight="800" fill="#141414">You</text></g>
      <g class="hb-badge is-lit"><circle cx="90" cy="52" r="22" fill="#FFFFFF" stroke="#141414" stroke-width="3"/><svg x="79" y="41" width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#FF6154"/><path fill="#FFFFFF" fill-rule="evenodd" d="M9.3 17.4V6.6h4a3.7 3.7 0 0 1 0 7.4h-1.8v3.4H9.3zm2.2-8.6v3h1.8a1.5 1.5 0 0 0 0-3h-1.8z"/></svg></g>
      <g class="hb-badge is-lit"><circle cx="210" cy="30" r="22" fill="#FFFFFF" stroke="#141414" stroke-width="3"/><svg x="200" y="20" width="20" height="20" viewBox="0 0 24 24"><rect width="24" height="24" rx="4.5" fill="#0A66C2"/><path fill="#FFFFFF" d="M7.94 18.5H5.2V9.85h2.74v8.65zM6.57 8.67a1.59 1.59 0 1 1 0-3.17 1.59 1.59 0 0 1 0 3.17zM18.8 18.5h-2.73v-4.21c0-1-.02-2.3-1.4-2.3-1.4 0-1.62 1.1-1.62 2.22v4.29H10.3V9.85h2.62v1.18h.04c.36-.69 1.25-1.42 2.58-1.42 2.76 0 3.26 1.82 3.26 4.18v4.71z"/></svg></g>
      <g class="hb-badge is-lit"><circle cx="330" cy="52" r="22" fill="#FFFFFF" stroke="#141414" stroke-width="3"/><svg x="319" y="41" width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#FF4500"/><path d="M12 8.2c.1-1.9 1.1-3.2 2.9-3.4" fill="none" stroke="#FFFFFF" stroke-width="1.1" stroke-linecap="round"/><circle cx="15.3" cy="4.6" r="1.15" fill="#FFFFFF"/><circle cx="5.5" cy="12.6" r="1.5" fill="#FFFFFF"/><circle cx="18.5" cy="12.6" r="1.5" fill="#FFFFFF"/><ellipse cx="12" cy="13.8" rx="5.7" ry="4.3" fill="#FFFFFF"/><circle cx="9.7" cy="13.3" r="1.05" fill="#FF4500"/><circle cx="14.3" cy="13.3" r="1.05" fill="#FF4500"/><path d="M9.6 15.8c1.55 1.15 3.25 1.15 4.8 0" fill="none" stroke="#FF4500" stroke-width="1" stroke-linecap="round"/></svg></g>
      <g class="hb-comment is-lit"><circle cx="352" cy="34" r="9" fill="#F2E96A"/><text x="352" y="38" text-anchor="middle" font-size="11" fill="#141414">💬</text></g>
    </svg>
    <p class="h-phrase">Get your <span class="mark-word">first customers</span>. Not just views.</p>
  </section>

  <section class="h-screen h-screen--form">
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
  </section>
</div>
```
(Each screen carries a static, already-correct `is-lit` state per badge instead of the old JS-toggled approach — real horizontal scroll makes the JS scrollspy unnecessary: the browser natively shows one screen at a time.)

- [ ] **Step 4: Replace the hero CSS**

Find the entire hero CSS region — starts at `.hero-triggers{` (or the first hero-specific rule after `.nav-cta`/`.nav-pill` rules from Step 2) and continues through the last `.hb-*`/`.hero-phase*`/`.hero-bcast`/`.hero-cta-zone`/`.hero-reassure`/`.hero-pin*` rule, including both the mobile-first block and the two `@media` blocks (`min-width:900px` and the `and (prefers-reduced-motion: reduce)` variant). Delete all of it and replace with:
```css
#h-scroll{
  display:flex;
  width:100vw;
  height:100vh;
  overflow-x:auto;
  overflow-y:hidden;
  scroll-snap-type:x mandatory;
  -webkit-overflow-scrolling:touch;
}
.h-screen{
  flex:0 0 100vw;
  width:100vw;
  height:100vh;
  scroll-snap-align:start;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  text-align:center;
  padding:0 1.375rem;
}
.h-badge{ margin-bottom:1.6rem; }
.hb-diagram{
  width:min(70vw, 460px);
  height:auto;
  opacity:.5;
  margin-bottom:1rem;
}
.hb-wire{ fill:none; stroke:rgba(201,168,0,.32); stroke-width:1.5; stroke-linecap:round; }
.hb-badge circle{ filter:drop-shadow(2px 3px 0 rgba(0,0,0,.25)); opacity:.3; }
.hb-badge.is-lit circle{ opacity:1; }
.hb-comment{ opacity:0; }
.hb-comment.is-lit{ opacity:1; }
.h-phrase{
  font-family:var(--display);
  font-weight:800;
  font-size:clamp(1.9rem, 1rem + 4vw, 3.4rem);
  line-height:1.15;
  letter-spacing:-.03em;
  color:var(--ink);
  max-width:44rem;
}
.h-screen--form .hero-reassure{ margin-top:.9rem; font-size:.82rem; color:var(--faint); }
```

Verify after deleting the old region: `grep -n "hero-triggers\|hero-trigger{\|hero-pin\|hero-bcast\|hero-phase\|hb-wire\b" landing/index.html` should return matches only inside the new `.h-screen`/`.hb-*` HTML/CSS just added (the old `.hero-*`-prefixed selector names should be entirely gone — the new CSS intentionally uses different class names (`.h-screen`, `.h-phrase`, `.hb-diagram`) so a stray leftover old rule is easy to spot as unexpected).

- [ ] **Step 5: Replace the hero scrollspy JS with the wheel-redirect script**

Find the IIFE `/* Hero scroll sequence : ... */ (function () { var root = document.getElementById('hero-scroll'); ... })();` (currently `landing/index.html:1877-1917`) and replace it entirely with:
```js
  /* Horizontal-only landing : desktop wheel/trackpad scroll is
     vertical by default, so redirect it into horizontal movement on
     #h-scroll. Mobile needs nothing — touch drag is already the
     right axis on a horizontally-scrollable container. behavior:'auto'
     (never 'smooth') means this is already reduced-motion-safe by
     construction, no extra media query needed. */
  (function () {
    var scroller = document.getElementById('h-scroll');
    if (!scroller) return;
    var desktop = window.matchMedia('(min-width:900px)');
    if (!desktop.matches) return;
    scroller.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        scroller.scrollBy({ left: e.deltaY, behavior: 'auto' });
      }
    }, { passive: false });
  })();
```

- [ ] **Step 6: Remove `#book`, `#cta`, footer, and the sticky bar**

Delete these four blocks entirely from `landing/index.html`:
- `<!-- ================= FINAL CTA + CAPTURE FORM ================= --> <section id="book" class="final"> ... </section>` (their content was folded into `how-it-works.html` in Task 2 — this is just removing the now-orphaned copy left in `index.html`)
- `<!-- ================= FULL-WIDTH FINAL CTA BANNER ================= --> <section id="cta" class="cta-banner"> ... </section>` (includes the `capture-form-banner` form)
- `<footer id="guides"> ... </footer>` (its 3 guide links are superseded by the new `guides.html` page)
- `<!-- ================= STICKY CTA BANNER ================= --> <div class="bar" id="ctabar" ...> ... </div>`

Then delete their now-orphaned CSS from the `<style>` block: search for and remove rules scoped to `.final`, `.split`, `.split-txt`, `.split-art`, `.gain-box`, `.gain-list`, `.g-ico`, `.sticker-zone`, `.sticker-device`, `.sticker-1` through `.sticker-5` (and their labels), `.cta-banner*`, `.banner-frame`, `.foot-in`, `.foot-guides`, `.foot-privacy`, `.bar`, `.bar-in`, `.bar-txt`. Verify after deleting: `grep -n "class=\"final\"\|class=\"cta-banner\|class=\"bar \|id=\"ctabar\"\|id=\"book\"\|id=\"cta\"" landing/index.html` returns zero matches.

- [ ] **Step 7: Clean up the JS that referenced the deleted elements**

Remove the `wire('capture-form-banner', 'cap-success-banner', null, true);` line (its form is gone).

Remove the entire sticky-bar IIFE:
```js
  /* Sticky CTA banner : ... */
  var bar = document.getElementById('ctabar');
  var hero = document.querySelector('.hero');
  var book = document.getElementById('book');
  if (bar && hero && book && 'IntersectionObserver' in window) {
    ...
  }
```

Replace the broken `focusUrl`/`a[href="#book"]` block:
```js
  /* Nav / sticky-banner links scroll to the bottom form and focus its URL field. */
  function focusUrl() {
    var url = document.getElementById('cap-url');
    if (url) setTimeout(function () { url.focus({ preventScroll: true }); }, 450);
  }
  document.querySelectorAll('a[href="#book"]').forEach(function (a) {
    a.addEventListener('click', focusUrl);
  });
```
with:
```js
  /* Nav CTA jumps straight to the form screen and focuses its input. */
  var navCta = document.getElementById('nav-beta-cta');
  if (navCta) {
    navCta.addEventListener('click', function (e) {
      e.preventDefault();
      var formScreen = document.querySelector('.h-screen--form');
      if (formScreen) formScreen.scrollIntoView({ behavior: 'auto', inline: 'start' });
      var url = document.getElementById('cap-url-hero');
      if (url) setTimeout(function () { url.focus({ preventScroll: true }); }, 300);
    });
  }
```

- [ ] **Step 8: Deploy preview and verify end-to-end**

```bash
cd /Users/cedricdlc/Developer/getseen/landing && netlify deploy
```
Open the draft URL at desktop width. Confirm: floating pill nav visible over the content; scrolling the mouse wheel/trackpad moves horizontally through 4 phrases into the form screen, snapping cleanly at each screen; badges show the correct lit/unlit state per screen (matches the old progressive-lighting logic); no vertical scrollbar appears anywhere; clicking the nav's "Get access to the beta" jumps straight to the form and focuses it; clicking "How it works" and "Guides" in the nav navigate to the new pages. Submit a test URL in the form — confirm the existing platform-check modal still opens and behaves exactly as before (this flow is untouched). Then check mobile width: confirm horizontal swipe works natively, nav links collapse per the `max-width:640px` rule from Step 2.

- [ ] **Step 9: Commit**

```bash
git add landing/index.html
git commit -m "$(cat <<'EOF'
feat: convert landing to horizontal-scroll-only single page

Nav becomes a floating compact pill (logo, How it works, Guides,
beta CTA). Hero becomes 5 real horizontally-scrolling screens (4
phrases + the capture form) instead of a vertically-pinned fake
scroll — desktop wheel input is redirected horizontal, mobile uses
native touch scroll, no JS needed there. #book, #cta, the footer,
and the sticky banner are removed (their content already relocated
in earlier tasks) since there's no vertical scroll left to hold
them. body{overflow:hidden} is the enforcement point for "zero
vertical scroll" per Cédric's explicit ask.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Production deploy

**Files:** none (deploy-only task)

- [ ] **Step 1: Final preview pass across all 3 pages**

```bash
cd /Users/cedricdlc/Developer/getseen/landing && netlify deploy
```
Click through: `index.html` (horizontal scroll, form, modal), `how-it-works.html` (5-step vertical scrollspy, closing pitch, footer), `guides.html` (3 cards, each links out correctly). Confirm nav links on `index.html` correctly reach both new pages, and each new page's own nav logo links back to `/`.

- [ ] **Step 2: Promote to production**

```bash
netlify deploy 2>&1 | tee /tmp/deploy_out.txt
DEPLOY_ID=$(grep -oE '[a-f0-9]{24}(?=--graceful-marzipan)' /tmp/deploy_out.txt | head -1)
netlify api restoreSiteDeploy --data "{\"site_id\":\"d4a26bd1-7f35-41c7-bf41-b4e83b981e0d\",\"deploy_id\":\"$DEPLOY_ID\"}"
curl -s https://letsgetposted.com/ | grep -o "h-scroll"
curl -s https://letsgetposted.com/how-it-works.html | grep -o "How It Works"
curl -s https://letsgetposted.com/guides.html | grep -o "Platform Guides"
```
Expected: all three `curl` checks find their marker text, confirming all 3 pages are live.

- [ ] **Step 3: Update CLAUDE.md**

Add a dated entry summarizing: the horizontal-scroll pivot and why (Cédric's direct feedback right after the v2 relaunch), the 3-page split, the light-palette base and that final art direction is still open. Commit this doc update separately.
