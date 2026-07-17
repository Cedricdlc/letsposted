# PH Winners Dynamic Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the 50 hardcoded Product Hunt winner rows out of `product-hunt-launch.html` into a JSON data file, and make the page render the table and its stats from that file at load time — so the n8n workflow (built separately by Cédric, per `docs/superpowers/specs/2026-07-17-n8n-agent-workflow-design.md`) can append new days by committing to the JSON alone, with zero HTML edits.

**Architecture:** A new `landing/data/ph-winners.json` holds an array of `{date, product, tagline, score, mentionsAI}` objects, oldest-safe order not required (sorted newest-first on render). `product-hunt-launch.html` fetches this file client-side on load, renders the table rows, recomputes the "X / Y mention AI" stat and the surrounding copy from the live array instead of hardcoded numbers, so the page never goes stale relative to the data file.

**Tech Stack:** Static HTML/CSS/vanilla JS (no framework, no bundler — matches the rest of `landing/`). No test runner exists in this repo; verification is manual per the pattern already used throughout the project: `node --check` for JS syntax validation, and `curl` content checks against the deployed preview/prod URLs. Steps below use that pattern in place of an automated test suite.

## Global Constraints

- Never fabricate data: if the JSON is missing, empty, or fails to parse, the page must show an honest empty/error state — never a fallback to fake rows.
- All existing visual styling (`.winner-row`, `.insight-box`, etc.) stays exactly as-is — this is a data-source change, not a redesign.
- The bold-highlighting of "AI"/"agent" mentions must be computed from escaped text, never by trusting raw HTML embedded in the data file (the data will eventually be written by an automated n8n workflow pulling from Product Hunt's API — treat tagline text as untrusted input).
- The one-off ChatCut comment-count callout (`Also worth noting: ChatCut hit #1 with only 105 upvotes...`) stays a static, hardcoded sentence — it's a curated historical anecdote, not a formula, and doesn't need to generalize.

---

### Task 1: Create `landing/data/ph-winners.json`

**Files:**
- Create: `landing/data/ph-winners.json`

**Interfaces:**
- Produces: a JSON array at the file's root, each element shaped `{ "date": "YYYY-MM-DD", "product": string, "tagline": string (plain text, no HTML), "score": string, "mentionsAI": boolean }`. `score` is a string because most entries are a plain vote count (e.g. `"725"`) but one entry (ChatCut) uses the format `"105v / 761c"` — keeping this a string avoids a mixed-type field. Consumed by Task 2's fetch/render code.

- [ ] **Step 1: Write the JSON file**

```json
[
  { "date": "2026-07-14", "product": "ClawTeams", "tagline": "The first goal-driven, proactive AI team for e-commerce", "score": "725", "mentionsAI": true },
  { "date": "2026-07-13", "product": "AgentKey", "tagline": "One-stop live data marketplace for your agent", "score": "681", "mentionsAI": true },
  { "date": "2026-07-12", "product": "Miora", "tagline": "Scale creativity on editable canvas with agent memory", "score": "593", "mentionsAI": true },
  { "date": "2026-07-11", "product": "Effects SDK", "tagline": "AI video & audio effects SDK for real-time apps", "score": "503", "mentionsAI": true },
  { "date": "2026-07-10", "product": "ChatCut", "tagline": "Your AI video editor in ChatGPT, desktop & web", "score": "105v / 761c", "mentionsAI": true },
  { "date": "2026-07-09", "product": "Auriko", "tagline": "Trading desk for LLM calls", "score": "752", "mentionsAI": false },
  { "date": "2026-07-08", "product": "ExploreYC", "tagline": "Open-source API for YC & a16z company data", "score": "859", "mentionsAI": false },
  { "date": "2026-07-07", "product": "Badge", "tagline": "AI agents collect peer reviews to generate proof of work", "score": "488", "mentionsAI": true },
  { "date": "2026-07-06", "product": "AnySearch", "tagline": "Real-time structured search trusted by agents and developers", "score": "924", "mentionsAI": true },
  { "date": "2026-07-05", "product": "WorkBuddy", "tagline": "Produce sharpened results faster with a team of AI experts", "score": "443", "mentionsAI": true },
  { "date": "2026-07-04", "product": "Vida", "tagline": "Clone yourself. Let AI do the work before you ask", "score": "473", "mentionsAI": true },
  { "date": "2026-07-03", "product": "Glaze by Raycast", "tagline": "Create your own Mac apps by chatting with AI", "score": "673", "mentionsAI": true },
  { "date": "2026-07-02", "product": "Context.dev", "tagline": "One API to scrape, enrich, and extract the internet", "score": "1148", "mentionsAI": false },
  { "date": "2026-07-01", "product": "Acti", "tagline": "Agentic keyboard for mobile commands and search", "score": "1490", "mentionsAI": true },
  { "date": "2026-06-30", "product": "Cursor for iOS", "tagline": "Build with coding agents from anywhere", "score": "644", "mentionsAI": true },
  { "date": "2026-06-29", "product": "Spira", "tagline": "Social media growth agents that build your momentum", "score": "487", "mentionsAI": true },
  { "date": "2026-06-28", "product": "discode.ai", "tagline": "100+ AI models, one interface. ECO friendly.", "score": "408", "mentionsAI": true },
  { "date": "2026-06-27", "product": "Folio AI", "tagline": "Claude for PowerPoint, on steroids", "score": "362", "mentionsAI": false },
  { "date": "2026-06-26", "product": "Agent Arena", "tagline": "The first public arena for AI agents", "score": "407", "mentionsAI": true },
  { "date": "2026-06-25", "product": "BrowserAct", "tagline": "Web browser automation for AI agents", "score": "746", "mentionsAI": true },
  { "date": "2026-06-24", "product": "Tencent EdgeOne Makers", "tagline": "Ship AI agents like web apps, in minutes", "score": "1210", "mentionsAI": true },
  { "date": "2026-06-23", "product": "Bluerails Discovery", "tagline": "The rails AI agents use to find and pay you", "score": "705", "mentionsAI": true },
  { "date": "2026-06-22", "product": "AgentX", "tagline": "Evaluate AI agent, pinpoint issues, fix with one click", "score": "668", "mentionsAI": true },
  { "date": "2026-06-21", "product": "Agent 37 Cloud", "tagline": "Give every customer their own Hermes or OpenClaw agent", "score": "450", "mentionsAI": true },
  { "date": "2026-06-20", "product": "WorkClaw", "tagline": "Collaborative, proactive AI coworkers who work in Slack", "score": "405", "mentionsAI": true },
  { "date": "2026-06-19", "product": "Claude Code Artifacts", "tagline": "Preview and share your coding work live", "score": "519", "mentionsAI": false },
  { "date": "2026-06-18", "product": "Upstream", "tagline": "The inbox designed for humans and agents", "score": "970", "mentionsAI": true },
  { "date": "2026-06-17", "product": "Framer 3.0", "tagline": "With Agents, Branching, Community...", "score": "703", "mentionsAI": true },
  { "date": "2026-06-16", "product": "Goldfish", "tagline": "Press Option. It knows your work and replies like you", "score": "989", "mentionsAI": false },
  { "date": "2026-06-15", "product": "Novu Connect", "tagline": "Ship agents where your users already work", "score": "442", "mentionsAI": true },
  { "date": "2026-06-14", "product": "Slashy", "tagline": "The AI assistant that does email for you", "score": "506", "mentionsAI": true },
  { "date": "2026-06-13", "product": "Vercel Drop", "tagline": "Drop it. It's live.", "score": "483", "mentionsAI": false },
  { "date": "2026-06-12", "product": "Firma.dev", "tagline": "E-signatures API, ~3¢ per envelope", "score": "380", "mentionsAI": false },
  { "date": "2026-06-11", "product": "Bond", "tagline": "The AI to-do list that does itself", "score": "815", "mentionsAI": true },
  { "date": "2026-06-10", "product": "Publora", "tagline": "A publishing API for agents to post on 10 social platforms", "score": "686", "mentionsAI": true },
  { "date": "2026-06-09", "product": "VC Boom", "tagline": "Score your deck, meet investors, raise more", "score": "555", "mentionsAI": false },
  { "date": "2026-06-08", "product": "Honen", "tagline": "Automated teaching + learning infrastructure", "score": "587", "mentionsAI": false },
  { "date": "2026-06-07", "product": "Dreambeans", "tagline": "Daily AI stories personalised to you, by Google Labs", "score": "401", "mentionsAI": true },
  { "date": "2026-06-06", "product": "Google Search Profiles", "tagline": "Profile for publishers/creators to highlight work on Search", "score": "413", "mentionsAI": false },
  { "date": "2026-06-05", "product": "SellerClaw", "tagline": "A team of AI agents that runs your stores", "score": "606", "mentionsAI": true },
  { "date": "2026-06-04", "product": "Mailwarm 2.0", "tagline": "The email warmup tool, upgraded", "score": "719", "mentionsAI": false },
  { "date": "2026-06-03", "product": "Elentaria", "tagline": "Your GTM: from diagnosis to execution", "score": "614", "mentionsAI": false },
  { "date": "2026-06-02", "product": "Fundraisly", "tagline": "AI fundraising agent that finds investors", "score": "1554", "mentionsAI": true },
  { "date": "2026-06-01", "product": "Mina Meeting Assistant", "tagline": "Your AI Teammate now responds during calls", "score": "505", "mentionsAI": true },
  { "date": "2026-05-31", "product": "Clipto", "tagline": "Fully local, natural language search over terabytes", "score": "493", "mentionsAI": false },
  { "date": "2026-05-30", "product": "Wandesk", "tagline": "Build the apps you need by describing them", "score": "509", "mentionsAI": false },
  { "date": "2026-05-29", "product": "Ava 2.0", "tagline": "Your AI BDR that runs outbound sales autonomously", "score": "379", "mentionsAI": true },
  { "date": "2026-05-28", "product": "Pancake", "tagline": "OpenClaw in Slack that makes your company autonomous", "score": "634", "mentionsAI": false },
  { "date": "2026-05-27", "product": "Powabase", "tagline": "Build AI apps with Postgres, RAG, and agents", "score": "472", "mentionsAI": true },
  { "date": "2026-05-26", "product": "Brew", "tagline": "Like Claude design for email marketing", "score": "990", "mentionsAI": false }
]
```

- [ ] **Step 2: Validate JSON syntax and entry count**

Run: `python3 -c "import json; d = json.load(open('landing/data/ph-winners.json')); print('entries:', len(d)); print('mentionsAI true:', sum(1 for x in d if x['mentionsAI']))"`
Expected output:
```
entries: 50
mentionsAI true: 33
```
If either number is off, find the mismatched row before continuing — do not proceed to Task 2 with a wrong count.

- [ ] **Step 3: Commit**

```bash
git add landing/data/ph-winners.json
git commit -m "Add ph-winners.json data file, migrated from hardcoded HTML rows"
```

---

### Task 2: Render the winners table and stats dynamically from the JSON

**Files:**
- Modify: `landing/product-hunt-launch.html` (winners section markup ~line 420-490, add a `<script>` block near end of `<body>`)

**Interfaces:**
- Consumes: `landing/data/ph-winners.json` (Task 1's output), fetched via `fetch('/data/ph-winners.json')`.
- Produces: nothing consumed by later tasks — this is the final task in the plan.

- [ ] **Step 1: Replace the hardcoded winner rows with empty containers and add stable IDs**

Find this block (the current hardcoded table, header row through the closing of `.winners`):

```html
    <div class="winners">
      <div class="winners-scroll">
      <div class="winner-row winner-head">
        <span>Date</span><span>Product</span><span>Tagline</span><span>Score</span>
      </div>
      <div class="winner-row"><span>Jul 14</span><span>ClawTeams</span>...
      [... 49 more hardcoded rows ...]
      </div>
    </div>
```

Replace it with:

```html
    <div class="winners">
      <div class="winners-scroll" id="winners-scroll">
        <div class="winner-row winner-head">
          <span>Date</span><span>Product</span><span>Tagline</span><span>Score</span>
        </div>
        <!-- rows injected by JS from /data/ph-winners.json -->
      </div>
    </div>
```

Also find the `<h2>` and first `.section-note` immediately above (currently: `<h2>We pulled the last 50 winners. Here's the real pattern.</h2>` and `<p class="section-note">Every #1 Product of the Day from May 26 to Jul 14, 2026, ...`) and give them IDs:

```html
    <h2 id="winners-heading">We pulled the last 50 winners. Here's the real pattern.</h2>
    <p class="section-note" id="winners-date-range">Every #1 Product of the Day from May 26 to Jul 14, 2026, pulled directly from Product Hunt's own daily archive — scroll the table, every row is checkable. Not a curated sample.</p>
```

(Text content stays as a same-shape placeholder for now — JS overwrites it once real data loads, so a page with JS disabled or a slow connection still shows plausible text rather than an empty heading.)

Also find the `.insight-box` block and give its two `<p>` elements IDs:

```html
    <div class="insight-box">
      <p class="insight-n" id="insight-ratio">33 / 50</p>
      <p id="insight-text">33 of the last 50 #1 Products of the Day say "AI" or "agent" directly in their tagline — 66%. Not all of them (Vercel Drop, Firma.dev, Google Search Profiles didn't need to), so it's a real signal, not a rule. That's the difference between a category to chase and a pattern to read.</p>
    </div>
```

- [ ] **Step 2: Add the fetch/render script**

Add this new `<script>` block right before the closing `</body>` tag (after the existing footer markup):

```html
<script>
(function () {
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function highlightAI(escapedText) {
    return escapedText.replace(/\b(AI|agents?|agentic)\b/gi, '<b>$1</b>');
  }

  function formatDate(isoDate) {
    var d = new Date(isoDate + 'T00:00:00Z');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  }

  function formatDateRange(oldestIso, newestIso, year) {
    return 'Every #1 Product of the Day from ' + formatDate(oldestIso) + ' to ' + formatDate(newestIso) + ', ' + year +
      ', pulled directly from Product Hunt\'s own daily archive — scroll the table, every row is checkable. Not a curated sample.';
  }

  fetch('/data/ph-winners.json')
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (winners) {
      if (!Array.isArray(winners) || winners.length === 0) {
        throw new Error('Empty or invalid dataset');
      }

      // newest first
      var sorted = winners.slice().sort(function (a, b) { return b.date < a.date ? -1 : 1; });

      var scroll = document.getElementById('winners-scroll');
      var rowsHtml = sorted.map(function (w) {
        var tagline = highlightAI(escapeHtml(w.tagline));
        return '<div class="winner-row"><span>' + formatDate(w.date) + '</span><span>' +
          escapeHtml(w.product) + '</span><span>' + tagline + '</span><span>' +
          escapeHtml(w.score) + '</span></div>';
      }).join('');
      scroll.insertAdjacentHTML('beforeend', rowsHtml);

      var total = sorted.length;
      var aiCount = sorted.filter(function (w) { return w.mentionsAI; }).length;
      var pct = Math.round((aiCount / total) * 100);

      document.getElementById('winners-heading').textContent =
        'We pulled the last ' + total + ' winners. Here\'s the real pattern.';
      document.getElementById('winners-date-range').textContent =
        formatDateRange(sorted[sorted.length - 1].date, sorted[0].date, sorted[0].date.slice(0, 4));

      document.getElementById('insight-ratio').textContent = aiCount + ' / ' + total;

      var nonAI = sorted.filter(function (w) { return !w.mentionsAI; }).slice(0, 3).map(function (w) { return w.product; });
      var exceptionClause = nonAI.length
        ? ' Not all of them (' + nonAI.join(', ') + (nonAI.length < sorted.filter(function (w) { return !w.mentionsAI; }).length ? ', among others' : '') + ' didn\'t need to), so it\'s a real signal, not a rule.'
        : '';
      document.getElementById('insight-text').textContent =
        aiCount + ' of the last ' + total + ' #1 Products of the Day say "AI" or "agent" directly in their tagline — ' + pct + '%.' +
        exceptionClause + ' That\'s the difference between a category to chase and a pattern to read.';
    })
    .catch(function (err) {
      var scroll = document.getElementById('winners-scroll');
      scroll.insertAdjacentHTML('beforeend',
        '<div class="winner-row"><span colspan="4" style="grid-column:1/-1;color:var(--faint)">Couldn\'t load the data right now. Nothing fabricated in its place — try refreshing.</span></div>');
    });
})();
</script>
```

- [ ] **Step 3: Verify JS syntax**

Run:
```bash
cd "/Users/cedricdlc/Developer/getseen/landing" && python3 -c "
import re
html = open('product-hunt-launch.html').read()
scripts = re.findall(r'<script>(.*?)</script>', html, re.S)
open('/tmp/getseen-check-ph-dynamic.js','w').write(scripts[-1])
"
node --check /tmp/getseen-check-ph-dynamic.js && echo "JS OK"
```
Expected: `JS OK`

- [ ] **Step 4: Verify the JSON file will be served by Netlify**

The `landing/` directory is Netlify's publish root (per `landing/netlify.toml`), so `landing/data/ph-winners.json` is served at `/data/ph-winners.json` automatically — no redirect or function needed. Confirm this locally before deploying:

Run: `ls "/Users/cedricdlc/Developer/getseen/landing/data/ph-winners.json"`
Expected: the file path printed back (confirms it's inside the publish root, not accidentally created elsewhere).

- [ ] **Step 5: Deploy to preview and verify real rendering**

```bash
cd "/Users/cedricdlc/Developer/getseen/landing" && netlify deploy 2>&1 | grep "Draft URL"
```

Take the printed draft URL and run:
```bash
curl -s "<draft-url>/data/ph-winners.json" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d))"
```
Expected: `50`

```bash
curl -s "<draft-url>/product-hunt-launch.html" | grep -o "winners-scroll\|winner-row\"><span>"
```
Expected: `winners-scroll` present, but no `winner-row"><span>` matches in the raw HTML (rows are injected client-side, so curl on raw HTML won't see them — that's expected and correct, it confirms the hardcoded rows were successfully removed).

- [ ] **Step 6: Promote to production**

```bash
cd "/Users/cedricdlc/Developer/getseen/landing" && netlify deploy --prod 2>&1 | tail -6
```

If this fails with `JSONHTTPError: Forbidden` (known recurring issue, see main `CLAUDE.md`), use the documented workaround instead:
```bash
netlify api restoreSiteDeploy --data '{"site_id":"d4a26bd1-7f35-41c7-bf41-b4e83b981e0d","deploy_id":"<draft-deploy-id-from-step-5>"}'
```

Then verify live:
```bash
curl -s "https://letsgetposted.com/data/ph-winners.json" -o /dev/null -w "%{http_code}\n"
```
Expected: `200`

- [ ] **Step 7: Commit**

```bash
cd /Users/cedricdlc/Developer/getseen
git add landing/product-hunt-launch.html
git commit -m "Render PH winners table and stats dynamically from ph-winners.json

Removes the 50 hardcoded winner rows from the HTML. The table, the
33/50-style ratio stat, the heading, and the date-range copy are now
all computed client-side from data/ph-winners.json at load time, so
the n8n daily sync workflow can update the page by committing to the
JSON alone — zero HTML edits needed per new day."
git push
```

---

## Self-Review Notes

- **Spec coverage**: the design spec's website-side scope was "migrate the 50 days to JSON" + "render table/stat dynamically" — both covered (Task 1, Task 2). The n8n workflow itself is explicitly out of scope for this plan (Cédric builds it directly in n8n per the spec).
- **Fabrication guard**: Step 2's `.catch()` branch shows an honest failure message instead of falling back to stale/fake rows — matches the Global Constraint.
- **Untrusted-input guard**: `highlightAI` runs after `escapeHtml`, so even if a future n8n-sourced tagline contains `<script>` or other markup, it renders as inert text, not executable HTML.
- **Exception-name copy**: capped at 3 names plus an "among others" qualifier when more than 3 non-AI entries exist, so the sentence never grows unboundedly as the dataset grows past 50 — checked in Step 2's code (`slice(0, 3)` + conditional clause).
