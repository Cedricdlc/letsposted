# Landing v2 Relaunch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `landing/index.html`'s nav, hero, and mid-page sections per `docs/superpowers/specs/2026-07-23-landing-relaunch-v2-design.md`, and change the lead-magnet mechanic from an instant AI-generated preview to an honest 24h manual-triage promise.

**Architecture:** Single self-contained `landing/index.html` (inline `<style>` + inline `<script>`, no build system). All new interactive behavior reuses the scrollspy pattern already shipped for `#how` (`IntersectionObserver`, `rootMargin: '0px 0px -50% 0px'`, mobile falls back to static stacked content, `prefers-reduced-motion` disables the observer entirely).

**Tech Stack:** Vanilla HTML/CSS/JS, Netlify Forms, Netlify Functions (`readiness.js` — untouched by this plan; `platform-copy.js` — becomes dead code, not deleted).

## Global Constraints

- Single file to edit: `landing/index.html`. No new files, no build step introduced.
- Never fabricate data or personalization — every visual/claim must be either real (readiness scan) or explicitly generic/illustrative (`aria-hidden="true"` decorative elements).
- Every new animated component must: (a) default to a static, fully-visible mobile fallback below `min-width:900px`, (b) fully disable via `prefers-reduced-motion: reduce`, (c) reuse the existing scrollspy JS pattern rather than inventing a new one.
- No platform named as part of a fixed list in body copy (Reddit/X/Product Hunt can still appear as decorative icons, matching the existing `#book` sticker-cloud precedent, but never as "these are the N platforms we cover").
- Deploy every task with `netlify deploy` (preview) from `landing/`, verify visually, then only promote to prod once at the very end (Task 5) via `netlify api restoreSiteDeploy --data '{"site_id":"d4a26bd1-7f35-41c7-bf41-b4e83b981e0d","deploy_id":"<ID>"}'` — `netlify deploy --prod` is known to fail with `Forbidden`, do not retry it in a loop.
- Commit after every task with `git add landing/index.html && git commit`, following the repo's existing commit-message style (imperative, explains why not just what, `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` trailer).

---

### Task 1: Nav bar simplification + footer guide links

**Files:**
- Modify: `landing/index.html:1672-1684` (nav), `landing/index.html:2075-2083` (footer)

**Interfaces:**
- Produces: `#guides` anchor id in the footer (consumed by the new nav "Guides" link)

- [ ] **Step 1: Replace the nav markup**

Current (`landing/index.html:1672-1684`):
```html
<nav class="nav" aria-label="Main navigation">
  <div class="wrap nav-in">
    <a class="brand brand-sticker" href="#">
      <span class="sticker-patch">Posted<span class="sticker-dot">.</span></span>
    </a>
    <div class="nav-links">
      <a href="/product-hunt-launch.html">Product Hunt Guide</a>
      <a href="/reddit-launch.html">Reddit Guide</a>
      <a href="/x-launch.html">X Guide</a>
    </div>
    <a class="btn" href="#book">Show me the plan <span class="a" aria-hidden="true">→</span></a>
  </div>
</nav>
```

Replace with:
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

- [ ] **Step 2: Add a guides block to the footer**

Current (`landing/index.html:2075-2083`):
```html
<footer>
  <div class="wrap foot-in">
    <span class="brand brand-sticker">
      <span class="sticker-patch sticker-patch--sm">Posted<span class="sticker-dot">.</span></span>
    </span>
    <p>Done-for-you launches + human approval. No bots, no spam, no bought upvotes.</p>
    <a href="/privacy.html" class="foot-privacy">Privacy Policy</a>
  </div>
</footer>
```

Replace with:
```html
<footer id="guides">
  <div class="wrap foot-in">
    <span class="brand brand-sticker">
      <span class="sticker-patch sticker-patch--sm">Posted<span class="sticker-dot">.</span></span>
    </span>
    <p>Done-for-you launches + human approval. No bots, no spam, no bought upvotes.</p>
    <div class="foot-guides">
      <a href="/product-hunt-launch.html">Product Hunt Guide</a>
      <a href="/reddit-launch.html">Reddit Guide</a>
      <a href="/x-launch.html">X Guide</a>
    </div>
    <a href="/privacy.html" class="foot-privacy">Privacy Policy</a>
  </div>
</footer>
```

- [ ] **Step 3: Add `.foot-guides` CSS**

Find `.foot-privacy{ font-size:.82rem; color:var(--faint); text-decoration:none; }` in the `<style>` block and add just before it:
```css
.foot-guides{ display:flex; gap:1.2rem; flex-wrap:wrap; margin:.6rem 0; }
.foot-guides a{ font-size:.82rem; color:var(--faint); text-decoration:none; }
.foot-guides a:hover{ color:var(--ink); }
```

- [ ] **Step 4: Deploy preview and verify**

```bash
cd /Users/cedricdlc/Developer/getseen/landing && netlify deploy
```
Open the draft URL. Confirm: nav shows logo + "How it works" + "Guides" + "Get access to the beta"; clicking "Guides" scrolls to the footer; the 3 guide links work from the footer.

- [ ] **Step 5: Commit**

```bash
cd /Users/cedricdlc/Developer/getseen
git add landing/index.html
git commit -m "$(cat <<'EOF'
feat: simplify nav to logo + 2 links + beta CTA

Moves the 3 guide links into the footer under a new #guides anchor,
linked from a single "Guides" nav item — premium minimal nav per
landing v2 spec, guides remain discoverable, not deleted.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Scroll-animated full-screen hero

**Files:**
- Modify: `landing/index.html:1687-1728` (hero HTML), `<style>` block (new hero CSS, old hero-sticker-cloud/hero-platforms CSS removed), final `<script>` block (new scrollspy IIFE, old sticker-cloud-converge IIFE removed)

**Interfaces:**
- Produces: `#capture-form-hero` form with `#cap-url-hero` input — same ids as before, so the existing `wire('capture-form-hero', 'cap-success-hero', null, true)` call and `openPlatformModal()` flow (Task 4 territory) keep working unmodified.
- Consumes: the existing `.mark-word` CSS class (marker-underline motif, already defined) and `.cap-btn`/`.capzone--hero`/`.capbar-in`/`.seg-url` classes (existing form styling, unchanged).

- [ ] **Step 1: Replace the hero HTML**

Current (`landing/index.html:1687-1728`):
```html
<!-- ================= HERO ================= -->
<header class="hero">
  <div class="hero-sticker-cloud" aria-hidden="true">
    <span class="hsc hsc-1"><svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#FF6154"/><path fill="#FFFFFF" fill-rule="evenodd" d="M9.3 17.4V6.6h4a3.7 3.7 0 0 1 0 7.4h-1.8v3.4H9.3zm2.2-8.6v3h1.8a1.5 1.5 0 0 0 0-3h-1.8z"/></svg></span>
    <span class="hsc hsc-2"><svg width="17" height="17" viewBox="0 0 24 24"><path fill="#F5F5F5" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z"/></svg></span>
    <span class="hsc hsc-3"><svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#FF4500"/><path d="M12 8.2c.1-1.9 1.1-3.2 2.9-3.4" fill="none" stroke="#FFFFFF" stroke-width="1.1" stroke-linecap="round"/><circle cx="15.3" cy="4.6" r="1.15" fill="#FFFFFF"/><circle cx="5.5" cy="12.6" r="1.5" fill="#FFFFFF"/><circle cx="18.5" cy="12.6" r="1.5" fill="#FFFFFF"/><ellipse cx="12" cy="13.8" rx="5.7" ry="4.3" fill="#FFFFFF"/><circle cx="9.7" cy="13.3" r="1.05" fill="#FF4500"/><circle cx="14.3" cy="13.3" r="1.05" fill="#FF4500"/><path d="M9.6 15.8c1.55 1.15 3.25 1.15 4.8 0" fill="none" stroke="#FF4500" stroke-width="1" stroke-linecap="round"/></svg></span>
    <span class="hsc hsc-4"><svg width="16" height="16" viewBox="0 0 24 24"><rect width="24" height="24" rx="4.5" fill="#0A66C2"/><path fill="#FFFFFF" d="M7.94 18.5H5.2V9.85h2.74v8.65zM6.57 8.67a1.59 1.59 0 1 1 0-3.17 1.59 1.59 0 0 1 0 3.17zM18.8 18.5h-2.73v-4.21c0-1-.02-2.3-1.4-2.3-1.4 0-1.62 1.1-1.62 2.22v4.29H10.3V9.85h2.62v1.18h.04c.36-.69 1.25-1.42 2.58-1.42 2.76 0 3.26 1.82 3.26 4.18v4.71z"/></svg></span>
    <span class="hsc hsc-5"><svg width="16" height="16" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#FFBC00"/><path d="M8.2 17.5 12 6.5l3.8 11M9.7 13.6h4.6" fill="none" stroke="#141414" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
  </div>
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <span class="badge">Built for Solo SaaS Founders</span>
      <h1><span class="pain-line">You still haven't</span><br><span class="pain-line">posted it!</span></h1>
      <p class="lede">You built it. That was the easy part. <span class="mark-word">We post it for you.</span> 25+ platforms, and we know exactly which ones work for you.</p>
      <div class="hero-cta">
        <div class="capzone capzone--hero">
          <div class="vf">
            <span class="fr" aria-hidden="true"></span>
            <form action='/' id='capture-form-hero' method='POST' name='liste-attente' data-netlify="true" netlify-honeypot="bot-field">
              <input type="hidden" name="form-name" value="liste-attente" />
              <p hidden aria-hidden="true"><label>Don't fill this out: <input name="bot-field" /></label></p>
              <div class="capbar-in">
                <label class="sr-only" for="cap-url-hero">Product URL</label>
                <input class="seg-url" type="text" inputmode="url" autocomplete="url" id="cap-url-hero" name="url" required placeholder="https://yourproduct.com">
                <button type="submit" class="cap-btn">Show me the plan <span class="a" aria-hidden="true">→</span></button>
              </div>
            </form>
          </div>
        </div>
        <p class="hero-reassure">No bots. No spam. Nothing posts without you. Ever.</p>
        <div class="hero-platforms" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#FF6154"/><path fill="#FFFFFF" fill-rule="evenodd" d="M9.3 17.4V6.6h4a3.7 3.7 0 0 1 0 7.4h-1.8v3.4H9.3zm2.2-8.6v3h1.8a1.5 1.5 0 0 0 0-3h-1.8z"/></svg>
          <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#FF4500"/><path d="M12 8.2c.1-1.9 1.1-3.2 2.9-3.4" fill="none" stroke="#FFFFFF" stroke-width="1.1" stroke-linecap="round"/><circle cx="15.3" cy="4.6" r="1.15" fill="#FFFFFF"/><circle cx="5.5" cy="12.6" r="1.5" fill="#FFFFFF"/><circle cx="18.5" cy="12.6" r="1.5" fill="#FFFFFF"/><ellipse cx="12" cy="13.8" rx="5.7" ry="4.3" fill="#FFFFFF"/><circle cx="9.7" cy="13.3" r="1.05" fill="#FF4500"/><circle cx="14.3" cy="13.3" r="1.05" fill="#FF4500"/><path d="M9.6 15.8c1.55 1.15 3.25 1.15 4.8 0" fill="none" stroke="#FF4500" stroke-width="1" stroke-linecap="round"/></svg>
          <svg width="15" height="15" viewBox="0 0 24 24"><path fill="#E7E9EA" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z"/></svg>
          <svg width="16" height="16" viewBox="0 0 24 24"><rect width="24" height="24" rx="4.5" fill="#0A66C2"/><path fill="#FFFFFF" d="M7.94 18.5H5.2V9.85h2.74v8.65zM6.57 8.67a1.59 1.59 0 1 1 0-3.17 1.59 1.59 0 0 1 0 3.17zM18.8 18.5h-2.73v-4.21c0-1-.02-2.3-1.4-2.3-1.4 0-1.62 1.1-1.62 2.22v4.29H10.3V9.85h2.62v1.18h.04c.36-.69 1.25-1.42 2.58-1.42 2.76 0 3.26 1.82 3.26 4.18v4.71z"/></svg>
          <svg width="16" height="16" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#FFBC00"/><path d="M8.2 17.5 12 6.5l3.8 11M9.7 13.6h4.6" fill="none" stroke="#141414" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="hero-platforms-more">+20 more</span>
        </div>
      </div>
    </div>

  </div>
</header>
```

Replace entirely with:
```html
<!-- ================= HERO : scroll-animated sequence ================= -->
<header class="hero" id="hero-scroll">
  <div class="hero-triggers">
    <div class="hero-trigger is-active" data-hero-step="1"></div>
    <div class="hero-trigger" data-hero-step="2"></div>
    <div class="hero-trigger" data-hero-step="3"></div>
    <div class="hero-trigger" data-hero-step="4"></div>
  </div>
  <div class="hero-pin">
    <span class="badge hero-pin-badge">Built for Solo SaaS Founders</span>

    <!-- Illustrative animation only — a "you" hub pulsing toward
         platform badges, adapted from the same broadcast/pulse SVG
         technique used elsewhere on the page. Not tied to real data,
         not naming "the platforms we cover" (see landing v2 spec §5). -->
    <svg class="hero-bcast" viewBox="0 0 420 260" aria-hidden="true" focusable="false">
      <path class="hb-wire" d="M210 130 Q210 90 90 60"/>
      <path class="hb-wire" d="M210 130 Q210 100 210 40"/>
      <path class="hb-wire" d="M210 130 Q210 90 330 60"/>
      <g class="hb-dots">
        <g visibility="hidden">
          <circle r="4.5" fill="#F2E96A" opacity=".3"/>
          <set attributeName="visibility" to="visible" begin=".3s" fill="freeze"/>
          <animateMotion dur="2.2s" begin=".3s" repeatCount="indefinite"><mpath href="#hb-wire-none"/></animateMotion>
        </g>
      </g>
      <g class="hb-hub">
        <circle cx="210" cy="130" r="26" fill="#F2E96A"/>
        <text x="210" y="137" text-anchor="middle" font-size="15" font-weight="800" fill="#141414">You</text>
      </g>
      <g class="hb-badge" data-hb-badge="1">
        <circle cx="90" cy="52" r="22" fill="#12121A" stroke="#141414" stroke-width="3"/>
        <svg x="79" y="41" width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#FF6154"/><path fill="#FFFFFF" fill-rule="evenodd" d="M9.3 17.4V6.6h4a3.7 3.7 0 0 1 0 7.4h-1.8v3.4H9.3zm2.2-8.6v3h1.8a1.5 1.5 0 0 0 0-3h-1.8z"/></svg>
      </g>
      <g class="hb-badge" data-hb-badge="2">
        <circle cx="210" cy="30" r="22" fill="#12121A" stroke="#141414" stroke-width="3"/>
        <svg x="200" y="20" width="20" height="20" viewBox="0 0 24 24"><rect width="24" height="24" rx="4.5" fill="#0A66C2"/><path fill="#FFFFFF" d="M7.94 18.5H5.2V9.85h2.74v8.65zM6.57 8.67a1.59 1.59 0 1 1 0-3.17 1.59 1.59 0 0 1 0 3.17zM18.8 18.5h-2.73v-4.21c0-1-.02-2.3-1.4-2.3-1.4 0-1.62 1.1-1.62 2.22v4.29H10.3V9.85h2.62v1.18h.04c.36-.69 1.25-1.42 2.58-1.42 2.76 0 3.26 1.82 3.26 4.18v4.71z"/></svg>
      </g>
      <g class="hb-badge" data-hb-badge="3">
        <circle cx="330" cy="52" r="22" fill="#12121A" stroke="#141414" stroke-width="3"/>
        <svg x="319" y="41" width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#FF4500"/><path d="M12 8.2c.1-1.9 1.1-3.2 2.9-3.4" fill="none" stroke="#FFFFFF" stroke-width="1.1" stroke-linecap="round"/><circle cx="15.3" cy="4.6" r="1.15" fill="#FFFFFF"/><circle cx="5.5" cy="12.6" r="1.5" fill="#FFFFFF"/><circle cx="18.5" cy="12.6" r="1.5" fill="#FFFFFF"/><ellipse cx="12" cy="13.8" rx="5.7" ry="4.3" fill="#FFFFFF"/><circle cx="9.7" cy="13.3" r="1.05" fill="#FF4500"/><circle cx="14.3" cy="13.3" r="1.05" fill="#FF4500"/><path d="M9.6 15.8c1.55 1.15 3.25 1.15 4.8 0" fill="none" stroke="#FF4500" stroke-width="1" stroke-linecap="round"/></svg>
      </g>
      <g class="hb-comment" data-hb-badge="3">
        <circle cx="352" cy="34" r="9" fill="#F2E96A"/>
        <text x="352" y="38" text-anchor="middle" font-size="11" fill="#141414">💬</text>
      </g>
    </svg>

    <div class="hero-phase-zone">
      <p class="hero-phase is-active" data-hero-frame="1">Stop procrastinating on your business launch.</p>
      <p class="hero-phase" data-hero-frame="2">No posts. No leads. And you know it.</p>
      <p class="hero-phase" data-hero-frame="3">We find the right platforms for your niche <span class="mark-word">and do the posting for you</span>.</p>
      <p class="hero-phase" data-hero-frame="4">Get your <span class="mark-word">first customers</span>. Not just views.</p>
    </div>
  </div>

  <div class="wrap hero-cta-zone">
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

Note: the `<animateMotion>` block references `#hb-wire-none` (intentionally a dead reference so no stray pulse renders before Step 3 wires the real per-badge animation below) — Step 3 of this task replaces it with 3 real per-wire pulses once the CSS/ids are in place. This keeps Step 1 a valid, renderable HTML change on its own.

- [ ] **Step 2: Wire the 3 pulse animations to their real wire ids**

Replace the placeholder `<g class="hb-dots">...</g>` block from Step 1 with:
```html
<g class="hb-dots">
  <g visibility="hidden" data-hb-pulse="1">
    <circle r="4.5" fill="#F2E96A" opacity=".3"/>
    <set attributeName="visibility" to="visible" begin=".3s" fill="freeze"/>
    <animateMotion dur="2.2s" begin=".3s" repeatCount="indefinite"><mpath href="#hb-wire-1"/></animateMotion>
  </g>
  <g visibility="hidden" data-hb-pulse="2">
    <circle r="4.5" fill="#F2E96A" opacity=".3"/>
    <set attributeName="visibility" to="visible" begin=".9s" fill="freeze"/>
    <animateMotion dur="2s" begin=".9s" repeatCount="indefinite"><mpath href="#hb-wire-2"/></animateMotion>
  </g>
  <g visibility="hidden" data-hb-pulse="3">
    <circle r="4.5" fill="#F2E96A" opacity=".3"/>
    <set attributeName="visibility" to="visible" begin=".6s" fill="freeze"/>
    <animateMotion dur="2.4s" begin=".6s" repeatCount="indefinite"><mpath href="#hb-wire-3"/></animateMotion>
  </g>
</g>
```
And give the 3 `.hb-wire` paths from Step 1 matching ids — replace:
```html
<path class="hb-wire" d="M210 130 Q210 90 90 60"/>
<path class="hb-wire" d="M210 130 Q210 100 210 40"/>
<path class="hb-wire" d="M210 130 Q210 90 330 60"/>
```
with:
```html
<path id="hb-wire-1" class="hb-wire" d="M210 130 Q210 90 90 60"/>
<path id="hb-wire-2" class="hb-wire" d="M210 130 Q210 100 210 40"/>
<path id="hb-wire-3" class="hb-wire" d="M210 130 Q210 90 330 60"/>
```

- [ ] **Step 3: Remove the old hero CSS (sticker-cloud, hero-platforms)**

Delete these blocks from the `<style>` section (search for each exact selector, since earlier tasks in this plan don't touch `<style>` line numbers, these positions are stable at the start of this task):

`landing/index.html:150-160` — delete entirely:
```css
.hero-platforms{
  display:flex;
  align-items:center;
  gap:.65rem;
  margin-top:1.3rem;
  opacity:.72;
}
.hero-platforms svg{ display:block; border-radius:50%; }
.hero-platforms-more{
```
(keep reading to the closing `}` of `.hero-platforms-more` and delete through it)

`landing/index.html:546-631` region — delete these specific rules only (leave `.hero{...}` and `.hero-grid{...}` for now, they get replaced in Step 4): `.hero-sticker-cloud{...}`, `.hsc{...}`, `.hsc svg{...}`, `.hsc-1` through `.hsc-5`, the `@media (max-width:900px){ .hero-sticker-cloud{...} }` block, `.hero-sticker-cloud.is-active .hsc{...}` and its 5 per-sticker variants.

Verify after deleting: `grep -n "hero-sticker-cloud\|\.hsc\|hero-platforms" landing/index.html` returns **zero** matches in the `<style>` block (matches inside the old hero HTML will also be gone after Step 1).

- [ ] **Step 4: Replace `.hero`/`.hero-grid`/`.hero-copy`/`.hero-cta` CSS with the scroll-pin system**

Find `.hero{` (originally `landing/index.html:523`) through the end of the old hero-related rules (`.hero-cta{...}` and its `@media` variants, originally ending around line 631) and replace the whole region with:

```css
.hero{
  position:relative;
  background:var(--bg);
}
.hero-triggers{
  display:grid;
}
.hero-trigger{ height:100vh; }

.hero-pin{
  position:relative;
  height:100vh;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  text-align:center;
  overflow:hidden;
  padding:0 1.375rem;
}
.hero-pin-badge{ position:relative; z-index:2; margin-bottom:1.6rem; }

.hero-bcast{
  position:absolute;
  top:50%; left:50%;
  transform:translate(-50%,-58%);
  width:min(90vw, 640px);
  height:auto;
  opacity:.55;
  z-index:1;
  pointer-events:none;
}
.hb-wire{ fill:none; stroke:rgba(255,188,0,.28); stroke-width:1.5; stroke-linecap:round; }
.hb-badge circle{ filter:drop-shadow(2px 3px 0 rgba(0,0,0,.5)); transition:opacity .4s ease; opacity:.3; }
.hb-badge.is-lit circle{ opacity:1; }
.hb-comment{ opacity:0; transition:opacity .4s ease; }
.hb-comment.is-lit{ opacity:1; }

.hero-phase-zone{
  position:relative;
  z-index:2;
  max-width:44rem;
}
.hero-phase{
  display:none;
  font-family:var(--display);
  font-weight:800;
  font-size:clamp(1.9rem, 1rem + 4vw, 3.4rem);
  line-height:1.15;
  letter-spacing:-.03em;
  color:var(--ink);
}
.hero-phase.is-active{ display:block; animation:hero-phase-in .5s ease both; }
@keyframes hero-phase-in{ from{ opacity:0; transform:translateY(10px); } to{ opacity:1; transform:translateY(0); } }
@media (prefers-reduced-motion: reduce){
  .hero-phase.is-active{ animation:none; }
}

.hero-cta-zone{
  padding:3.5rem 1.375rem 4rem;
  display:flex;
  flex-direction:column;
  align-items:center;
  text-align:center;
  gap:.9rem;
}
.hero-reassure{ font-size:.82rem; color:var(--faint); letter-spacing:.01em; }

/* Mobile-first default: no pinning, no scroll-jacking. All 4 phases
   render stacked and visible, triggers collapse to zero height. */
.hero-trigger{ height:0; }
.hero-phase{ display:block; margin-bottom:1.1rem; font-size:clamp(1.5rem,4vw,2rem); }
.hero-phase:last-child{ margin-bottom:0; }
.hero-bcast{ display:none; }

@media (min-width:900px){
  #hero-scroll{ display:grid; grid-template-columns:1fr; }
  .hero-triggers{ grid-column:1; grid-row:1; }
  .hero-trigger{ height:100vh; }
  .hero-pin{
    grid-column:1; grid-row:1;
    position:sticky;
    top:0;
    align-self:start;
  }
  .hero-phase{ display:none; }
  .hero-phase.is-active{ display:block; }
  .hero-bcast{ display:block; }
}
@media (min-width:900px) and (prefers-reduced-motion: reduce){
  .hb-badge circle, .hb-comment{ transition:none; }
}
```

- [ ] **Step 5: Add the hero scrollspy JS, remove the old sticker-cloud-converge JS**

In the final `<script>` block, find the existing IIFE (was `landing/index.html:2170-2177` before this task's edits):
```js
  /* Scattered platform chips converge toward the URL field while it's
     focused — a small hint that this field is what connects to all of
     them, without needing a permanent (and noisier) animation. */
  (function () {
    var urlField = document.getElementById('cap-url-hero');
    var cloud = document.querySelector('.hero-sticker-cloud');
    if (!urlField || !cloud) return;
    urlField.addEventListener('focus', function () { cloud.classList.add('is-active'); });
    urlField.addEventListener('blur', function () { cloud.classList.remove('is-active'); });
  })();
```

Replace it with:
```js
  /* Hero scroll sequence : same scrollspy technique as "How It Works"
     below (invisible tall trigger blocks drive which phase/badge is
     active while the visual stays pinned). Desktop only, disabled
     under prefers-reduced-motion — mobile/reduced-motion users just
     see all 4 phases stacked statically (CSS default, no JS needed). */
  (function () {
    var root = document.getElementById('hero-scroll');
    if (!root) return;
    var desktop = window.matchMedia('(min-width:900px)');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!desktop.matches || reduced.matches) return;

    var steps = Array.prototype.slice.call(root.querySelectorAll('[data-hero-step]'));
    var phases = Array.prototype.slice.call(root.querySelectorAll('[data-hero-frame]'));
    var badges = Array.prototype.slice.call(root.querySelectorAll('[data-hb-badge]'));
    var above = new Set();

    function applyActive() {
      var current = null;
      steps.forEach(function (s) { if (above.has(s)) current = s; });
      if (!current) current = steps[0];
      var n = current.getAttribute('data-hero-step');
      steps.forEach(function (s) { s.classList.toggle('is-active', s === current); });
      phases.forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-hero-frame') === n); });
      // Badges light up progressively: phase 2 lights badge 1, phase 3
      // lights badges 1-2 + the comment bubble, phase 4 lights all 3.
      var lit = { '1': [], '2': ['1'], '3': ['1','2','3'], '4': ['1','2','3'] }[n] || [];
      badges.forEach(function (b) {
        b.classList.toggle('is-lit', lit.indexOf(b.getAttribute('data-hb-badge')) !== -1);
      });
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

- [ ] **Step 6: Deploy preview and verify**

```bash
cd /Users/cedricdlc/Developer/getseen/landing && netlify deploy
```
Open the draft URL at desktop width (≥900px). Confirm: scrolling through the hero cycles through the 4 phrases one at a time while the pulsing diagram stays pinned in the background; badges light up progressively; after phrase 4 the page scrolls naturally into the URL form. Then resize to mobile width (or use the browser's device toolbar) and reload: confirm all 4 phrases show stacked, no pinning, no dead scroll space, form still works. Submit a test URL in the form and confirm the existing platform-check modal still opens (this flow is unchanged in this task — full modal correctness is verified in Task 4).

- [ ] **Step 7: Commit**

```bash
git add landing/index.html
git commit -m "$(cat <<'EOF'
feat: replace static hero with scroll-animated 4-phrase sequence

Full-screen pinned hero (same scrollspy pattern as How It Works)
cycling "Stop procrastinating on your business launch" through to
the CTA, with a pulsing hub-and-spoke diagram reused from the
broadcast animation elsewhere on the page. Mobile keeps a plain
stacked fallback, prefers-reduced-motion disables the observer
entirely. Tests the "procrastinating" wording despite it not
landing with a recent research participant — logged as a deliberate
hypothesis in the landing v2 spec, not a settled decision.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Merge Expertise + How It Works + Pipeline into one section

**Files:**
- Modify: `landing/index.html` — delete `#expertise` section, extend `#how` section with a 5th step, delete `#pipeline` section

**Interfaces:**
- Consumes: existing `.hw-step`/`.hw-frame`/`.hwm-*` CSS classes and the existing `#how` scrollspy JS (already generic over `[data-hw-step]`/`[data-hw-frame]` — a 5th step/frame pair works with zero JS changes).

- [ ] **Step 1: Delete the `#expertise` section**

Find the block starting at `<!-- ================= THE HUMAN LAYER — moved up front: credibility before mechanism ================= -->` through the `</section>` that closes `<section id="expertise">` (the full broadcast-diagram section). Delete the entire block, including both comment lines above it and the section itself.

- [ ] **Step 2: Add a 5th step to `#how`, covering the old `#pipeline` content**

Find the 4th step in `#how`'s `.hw-steps`:
```html
        <div class="hw-step" data-hw-step="4">
          <span class="hw-n" aria-hidden="true">4</span>
          <p class="hw-t"><span class="mark-word">You approve</span>, it goes live</p>
          <p class="hw-d">Nothing posts without your OK. Ever. We track the replies and follow up so you don't have to.</p>
        </div>
      </div>
```
Replace with (adds a 5th step right after the 4th, closing `</div>` unchanged):
```html
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
```

Find the 4th mockup frame:
```html
        <div class="hw-frame" data-hw-frame="4">
          <div class="hwm-scan"><span class="dot"></span>Ready for your review</div>
          <div class="hwm-lines">
            <div class="hwm-line"></div>
            <div class="hwm-line hwm-line--short"></div>
          </div>
          <span class="hwm-approve">✓ Approve &amp; post</span>
        </div>
      </div>
```
Replace with:
```html
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
```

- [ ] **Step 3: Make step 2's mockup platform-agnostic (drop named Reddit/X/PH icons)**

Find frame 2:
```html
        <div class="hw-frame" data-hw-frame="2">
          <div class="hwm-scan"><span class="dot"></span>Ranking for your niche…</div>
          <div class="hwm-badges">
            <span class="hwm-badge"><svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#FF6154"/><path fill="#FFFFFF" fill-rule="evenodd" d="M9.3 17.4V6.6h4a3.7 3.7 0 0 1 0 7.4h-1.8v3.4H9.3zm2.2-8.6v3h1.8a1.5 1.5 0 0 0 0-3h-1.8z"/></svg></span>
            <span class="hwm-badge"><svg width="18" height="18" viewBox="0 0 24 24"><path fill="#E7E9EA" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z"/></svg></span>
            <span class="hwm-badge"><svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#FF4500"/><path d="M12 8.2c.1-1.9 1.1-3.2 2.9-3.4" fill="none" stroke="#FFFFFF" stroke-width="1.1" stroke-linecap="round"/><circle cx="15.3" cy="4.6" r="1.15" fill="#FFFFFF"/><circle cx="5.5" cy="12.6" r="1.5" fill="#FFFFFF"/><circle cx="18.5" cy="12.6" r="1.5" fill="#FFFFFF"/><ellipse cx="12" cy="13.8" rx="5.7" ry="4.3" fill="#FFFFFF"/><circle cx="9.7" cy="13.3" r="1.05" fill="#FF4500"/><circle cx="14.3" cy="13.3" r="1.05" fill="#FF4500"/><path d="M9.6 15.8c1.55 1.15 3.25 1.15 4.8 0" fill="none" stroke="#FF4500" stroke-width="1" stroke-linecap="round"/></svg></span>
          </div>
        </div>
```
Replace with:
```html
        <div class="hw-frame" data-hw-frame="2">
          <div class="hwm-scan"><span class="dot"></span>Ranking for your niche…</div>
          <div class="hwm-badges">
            <span class="hwm-badge hwm-badge--generic"></span>
            <span class="hwm-badge hwm-badge--generic"></span>
            <span class="hwm-badge hwm-badge--generic"></span>
          </div>
        </div>
```

Add the matching CSS — find `.hwm-badge{...}` in the `<style>` block and add right after its closing `}`:
```css
.hwm-badge--generic::after{
  content:"";
  width:.6rem; height:.6rem; border-radius:50%;
  background:var(--accent);
}
```

- [ ] **Step 4: Delete the `#pipeline` section**

Find and delete the full block:
```html
<!-- ================= FIRST CUSTOMERS ================= -->
<section id="pipeline">
  <div class="wrap wrap--narrow">
    <span class="badge">First Customers</span>
    <h2>Visibility gets you seen. This gets you <span class="mark-word">your first customers</span>.</h2>
    <ul class="bullets">
      <li><span class="arr" aria-hidden="true">→</span><span><b>Buying signals, not bought lists:</b> people showing intent on your problem right now.</span></li>
      <li><span class="arr" aria-hidden="true">→</span><span><b>Every DM drafted:</b> personalized, one per prospect, ready to send.</span></li>
      <li><span class="arr" aria-hidden="true">→</span><span><b>Follow-ups included:</b> graduated sequences for the silent ones.</span></li>
    </ul>
  </div>
</section>
```

- [ ] **Step 5: Deploy preview and verify**

```bash
cd /Users/cedricdlc/Developer/getseen/landing && netlify deploy
```
Open the draft URL. Confirm: no separate "How We Post For You" / "First Customers" sections remain; `#how` now has 5 steps total; scrolling through step 2 shows 3 plain glowing dots (no brand logos); step 5 shows the "Real conversation started" mockup; page is visibly shorter than before.

- [ ] **Step 6: Commit**

```bash
git add landing/index.html
git commit -m "$(cat <<'EOF'
feat: merge expertise + pipeline into How It Works, cut page length

Removes the standalone credibility (#expertise) and first-customers
(#pipeline) sections — three blocks that repeated variants of the
same argument. The first-customers content becomes How It Works'
5th step; the broadcast diagram is superseded by the new hero
animation. Directly addresses the "page too long, I lose the thread
scrolling" finding confirmed across 2 independent research sessions.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Lead magnet mechanic — honest 24h triage instead of instant AI preview

**Files:**
- Modify: `landing/index.html` — `leadmagnet-modal` HTML block, `cta-banner-sub` copy, `runReadinessCheck`/`renderReadiness` JS functions

**Interfaces:**
- Consumes: existing `readiness.js` Netlify Function (unchanged, still called by `runReadinessCheck`).
- Produces: `renderReadiness(data)` no longer calls `platformPreviews()` — any future code must not assume that function runs post-scan.

- [ ] **Step 1: Stop showing instant platform-preview cards after the scan**

Find `renderReadiness`:
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
      return '<p style="font-size:.86rem;color:var(--faint)">We couldn\'t load your page directly — some sites block automated requests. Here\'s what we can still tell you:</p>' +
        platformPreviews(meta);
    }
    return scoreHtml + platformPreviews(meta);
  }
```
Replace with:
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

- [ ] **Step 2: Stop calling `fetchPlatformCopy` after the scan**

Find in `runReadinessCheck`:
```js
        var lmUrl = document.getElementById('lm-url-modal');
        if (lmUrl) lmUrl.value = data.url || url;
        modalLeadmagnet.hidden = false;
        if (meta.reachable && (meta.title || meta.description)) {
          fetchPlatformCopy(meta);
        }
      })
```
Replace with:
```js
        var lmUrl = document.getElementById('lm-url-modal');
        if (lmUrl) lmUrl.value = data.url || url;
        modalLeadmagnet.hidden = false;
      })
```

- [ ] **Step 3: Fix the network-failure fallback — it also calls `platformPreviews`**

`runReadinessCheck`'s `.catch()` branch (network failure reaching `readiness.js` itself) has its own separate call to `platformPreviews({})`, missed by Steps 1-2 since it's a different code path than the success branch. Find:
```js
      .catch(function () {
        stopLoadingCycle();
        modalLoad.hidden = true;
        modalResult.hidden = false;
        modalResult.innerHTML =
          '<p style="font-size:.86rem;color:var(--faint)">Couldn\'t reach your site to check it right now — here\'s what we can still tell you:</p>' +
          platformPreviews({});
        var lmUrl = document.getElementById('lm-url-modal');
        if (lmUrl) lmUrl.value = url;
        modalLeadmagnet.hidden = false;
      });
```
Replace with:
```js
      .catch(function () {
        stopLoadingCycle();
        modalLoad.hidden = true;
        modalResult.hidden = false;
        modalResult.innerHTML =
          '<p style="font-size:.86rem;color:var(--faint)">Couldn\'t reach your site to check it right now — that\'s fine, we\'ll still put together your priority plan by hand.</p>';
        var lmUrl = document.getElementById('lm-url-modal');
        if (lmUrl) lmUrl.value = url;
        modalLeadmagnet.hidden = false;
      });
```

After this step, `platformPreviews`, `platformCardsInner`, and `fetchPlatformCopy` have zero remaining call sites — confirm with `grep -n "platformPreviews(\|platformCardsInner(\|fetchPlatformCopy(" landing/index.html`, which should only show their own function definitions, no call sites. They stay defined but unused (dead code, matches the spec's explicit decision to keep `platform-copy.js` dormant rather than delete it — it can resurface once a real generation engine exists).

- [ ] **Step 4: Replace the lead-magnet modal content — drop the fixed-platform frise, add the 24h promise**

Find the `leadmagnet-modal` block:
```html
      <div class="lm-zone" id="leadmagnet-modal" hidden>
        <p class="lm-timeline-tag">Example 7-day plan — yours is built around your niche</p>
        <div class="lm-frise" aria-hidden="true">
          <div class="frise-node">
            <span class="frise-dot">1</span>
            <div class="frise-card"><p class="lm-day-p">Product Hunt</p><p class="lm-day-d">Listing built and timed for 12:01 AM PT. You just approve it.</p></div>
          </div>
          <div class="frise-node">
            <span class="frise-dot">2</span>
            <div class="frise-card"><p class="lm-day-p">Reddit</p><p class="lm-day-d">3 subreddits matched to your niche, comments drafted. You just create the accounts.</p></div>
          </div>
          <div class="frise-node frise-node--locked">
            <span class="frise-dot frise-dot--locked">3</span>
            <div class="frise-card frise-card--locked"><p class="lm-day-p">Hacker News</p></div>
          </div>
          <div class="frise-node frise-node--locked">
            <span class="frise-dot frise-dot--locked">4</span>
            <div class="frise-card frise-card--locked"><p class="lm-day-p">X</p></div>
          </div>
          <div class="frise-node frise-node--locked">
            <span class="frise-dot frise-dot--locked">5</span>
            <div class="frise-card frise-card--locked"><p class="lm-day-p">Indie Hackers</p></div>
          </div>
          <div class="frise-node frise-node--locked">
            <span class="frise-dot frise-dot--locked">···</span>
            <div class="frise-card frise-card--locked"><p class="lm-day-p">+ 2 more days</p></div>
          </div>
        </div>
        <p class="lm-head">Get your full platform-by-platform launch plan, ranked for your niche.</p>
        <p class="lm-urgency">In beta — taking 2 founders this round to get it right.</p>
        <div class="vf">
          <span class="fr" aria-hidden="true"></span>
          <form action='/' id='lm-form-modal' method='POST' name='lead-magnet' data-netlify="true" netlify-honeypot="bot-field">
            <input type="hidden" name="form-name" value="lead-magnet" />
            <input type="hidden" name="url" id="lm-url-modal" />
            <p hidden aria-hidden="true"><label>Don't fill this out: <input name="bot-field" /></label></p>
            <div class="lm-bar">
              <label class="sr-only" for="lm-email-modal">Enter your email to unlock your full launch plan</label>
              <input class="seg-email" type="email" autocomplete="email" id="lm-email-modal" name="email" required placeholder="Enter your email to unlock →">
              <button type="submit" class="cap-btn">Show me the full plan <span class="a" aria-hidden="true">→</span></button>
            </div>
          </form>
        </div>
        <div class="cap-success" id="lm-success-modal" hidden>
          <p>Sent. Check your inbox.</p>
          <p>We'll also reach out within 24h to book your launch slot.</p>
        </div>
      </div>
```
Replace with:
```html
      <div class="lm-zone" id="leadmagnet-modal" hidden>
        <p class="lm-head">We'll send your priority launch plan <span class="mark-word">within 24h</span> — real channels for your niche, picked by hand, not generated.</p>
        <p class="lm-urgency">In beta — taking 2 founders this round to get it right.</p>
        <div class="vf">
          <span class="fr" aria-hidden="true"></span>
          <form action='/' id='lm-form-modal' method='POST' name='lead-magnet' data-netlify="true" netlify-honeypot="bot-field">
            <input type="hidden" name="form-name" value="lead-magnet" />
            <input type="hidden" name="url" id="lm-url-modal" />
            <p hidden aria-hidden="true"><label>Don't fill this out: <input name="bot-field" /></label></p>
            <div class="lm-bar">
              <label class="sr-only" for="lm-email-modal">Enter your email to get your priority plan</label>
              <input class="seg-email" type="email" autocomplete="email" id="lm-email-modal" name="email" required placeholder="Enter your email →">
              <button type="submit" class="cap-btn">Get my plan <span class="a" aria-hidden="true">→</span></button>
            </div>
          </form>
        </div>
        <div class="cap-success" id="lm-success-modal" hidden>
          <p>Got it. We're looking at your product.</p>
          <p>Your priority launch plan lands in your inbox within 24h.</p>
        </div>
      </div>
```

- [ ] **Step 5: Fix the "in 30 seconds" over-promise in the full-width CTA banner**

Find:
```html
    <p class="cta-banner-sub">Paste your link. We'll show you exactly where to post, in 30 seconds.</p>
```
Replace with:
```html
    <p class="cta-banner-sub">Paste your link. We'll send your priority plan within 24h.</p>
```

- [ ] **Step 6: Remove now-dead CSS for the deleted frise**

Search for `.lm-timeline-tag`, `.lm-frise`, `.frise-node`, `.frise-dot`, `.frise-card` selectors in the `<style>` block and delete their rule blocks — they no longer have any matching markup after Step 4. Verify with:
```bash
grep -n "lm-timeline-tag\|lm-frise\|frise-node\|frise-dot\|frise-card" landing/index.html
```
Expected: no matches anywhere in the file after deletion.

- [ ] **Step 7: Deploy preview and verify end-to-end**

```bash
cd /Users/cedricdlc/Developer/getseen/landing && netlify deploy
```
Open the draft URL. Submit a real URL in the hero form. Confirm: the modal opens, shows the readiness score (or the honest unreachable-site message), and *immediately* shows the email-capture zone with "We'll send your priority launch plan within 24h" — no platform-preview cards, no 7-day frise. Submit an email and confirm the success message reads "Your priority launch plan lands in your inbox within 24h." Also test the network-failure path if practical (e.g., temporarily block the `readiness` function request in devtools) to confirm the catch-branch message no longer shows platform cards either.

- [ ] **Step 8: Commit**

```bash
git add landing/index.html
git commit -m "$(cat <<'EOF'
feat: lead magnet promises honest 24h manual triage, not instant AI preview

Removes the instant platform-preview cards (fetchPlatformCopy /
platformPreviews) and the fixed-platform 7-day frise from the lead
magnet modal — this is exactly what made a real prospect feel like
he'd "already gotten everything" without giving his email. Replaces
both with a direct 24h promise backed by an actual manual process,
per landing v2 spec §4. platform-copy.js and its helper functions
stay in the codebase, unused, for a future real generation engine.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Production deploy

**Files:** none (deploy-only task)

- [ ] **Step 1: Final preview pass**

```bash
cd /Users/cedricdlc/Developer/getseen/landing && netlify deploy
```
Click through the whole page top to bottom on the draft URL: nav → hero scroll sequence → How It Works (5 steps) → final CTA → cta-banner → footer with guide links. Confirm no leftover references to the old sections/copy (`grep -n "Show me the plan\"" landing/index.html` should only match the non-nav CTA buttons that were intentionally left unchanged — the spec only asked to change the nav's button label).

- [ ] **Step 2: Promote to production**

```bash
netlify deploy 2>&1 | tee /tmp/deploy_out.txt
DEPLOY_ID=$(grep -oE '[a-f0-9]{24}(?=--graceful-marzipan)' /tmp/deploy_out.txt | head -1)
netlify api restoreSiteDeploy --data "{\"site_id\":\"d4a26bd1-7f35-41c7-bf41-b4e83b981e0d\",\"deploy_id\":\"$DEPLOY_ID\"}"
curl -s https://letsgetposted.com/ | grep -o "Get access to the beta"
```
Expected: the `curl` check prints "Get access to the beta", confirming the new nav is live.

- [ ] **Step 3: Update CLAUDE.md**

Add a dated entry under the landing-page history section of `~/Developer/getseen/CLAUDE.md` summarizing: what shipped (nav, hero, section merge, lead magnet mechanic), the research trigger (2 converging user sessions), and the "procrastinating" wording being a deliberate open test per the spec. Commit this doc update separately.
