// Real, honest launch-readiness check for a submitted product URL.
// Two independent signals, both genuine — never fabricated:
//  1. A direct fetch of the site's own <head> to check for the meta
//     tags that actually affect how a launch post/share looks and ranks.
//  2. Google PageSpeed Insights (public API) for a real performance/SEO score.
// Either signal can fail independently (unreachable site, slow PSI) —
// the function always returns whatever it managed to gather rather
// than erroring out, so the page can show partial results honestly.

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

function normalizeUrl(input) {
  const raw = (input || '').trim();
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withScheme);
  } catch (e) {
    return null;
  }
}

async function fetchMeta(target) {
  try {
    const res = await fetch(target.href, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GetSeenReadinessBot/1.0; +https://getseen.example)' },
    });
    const html = await res.text();
    const titleMatch = html.match(/<title>\s*([^<\s][^<]{2,})<\/title>/i);
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{10,})["']/i);
    return {
      reachable: true,
      hasTitle: !!titleMatch,
      hasDescription: !!descMatch,
      hasOgImage: /<meta[^>]+property=["']og:image["']/i.test(html),
      hasOgTitle: /<meta[^>]+property=["']og:title["']/i.test(html),
      title: titleMatch ? titleMatch[1].trim().slice(0, 160) : null,
      description: descMatch ? descMatch[1].trim().slice(0, 300) : null,
    };
  } catch (e) {
    return { reachable: false, hasTitle: false, hasDescription: false, hasOgImage: false, hasOgTitle: false, title: null, description: null };
  }
}

async function fetchScores(target) {
  try {
    // Without a key, PageSpeed Insights shares one tiny global quota across
    // every anonymous caller worldwide — it's exhausted almost immediately.
    // Set PAGESPEED_API_KEY (free, from Google Cloud Console) as a Netlify
    // env var to get a real per-project quota instead.
    //
    // strategy=desktop, not mobile: mobile Lighthouse runs simulate CPU/network
    // throttling, which routinely pushes PSI past 14s — well over Netlify's
    // ~10s synchronous function ceiling, so mobile runs almost always got
    // killed before returning. desktop runs land around 8s (verified
    // 2026-07-16), comfortably inside that budget.
    const key = process.env.PAGESPEED_API_KEY;
    const api = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(target.href)}&category=performance&category=seo&strategy=desktop` + (key ? `&key=${key}` : '');
    const res = await fetch(api);
    if (!res.ok) return { performance: null, seo: null };
    const json = await res.json();
    const perf = json && json.lighthouseResult && json.lighthouseResult.categories && json.lighthouseResult.categories.performance;
    const seo = json && json.lighthouseResult && json.lighthouseResult.categories && json.lighthouseResult.categories.seo;
    return {
      performance: perf && typeof perf.score === 'number' ? Math.round(perf.score * 100) : null,
      seo: seo && typeof seo.score === 'number' ? Math.round(seo.score * 100) : null,
    };
  } catch (e) {
    return { performance: null, seo: null };
  }
}

exports.handler = async function (event) {
  const params = event.queryStringParameters || {};
  const target = normalizeUrl(params.url);

  if (!target) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing or invalid url' }),
    };
  }

  // desktop-strategy PSI ran ~8s from a local test but took ~9.2s+ from
  // inside the deployed function (Lambda's network path to Google adds
  // latency a local curl doesn't see) — bumped from an initial 9s once that
  // showed up truncating real responses in the function logs (2026-07-16).
  const [meta, scores] = await Promise.all([
    fetchMeta(target),
    withTimeout(fetchScores(target), 20000).then((r) => r || { performance: null, seo: null }),
  ]);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify({ url: target.href, meta, scores }),
  };
};
