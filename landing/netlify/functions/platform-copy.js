// Generates 3 short, platform-distinct reasons ("why does this platform
// matter for THIS product's niche") for Reddit, X and Product Hunt, from
// a product's real scraped title/description, using Claude. Research
// (2026-07-13 session, see docs/user-research.md) found that a founder
// wants to be told directly where to focus, not shown a mock post — a
// template can only reshuffle one input sentence three ways anyway,
// which read as copy-paste. If generation fails for any reason (no key,
// rate limit, malformed output), the function returns ok:false so the
// caller falls back to generic-but-honest reasons instead of fabricating.

const MODEL = 'claude-haiku-4-5-20251001';

function stripFences(text) {
  return text.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim();
}

exports.handler = async function (event) {
  const params = event.queryStringParameters || {};
  const title = (params.title || '').trim().slice(0, 200);
  const description = (params.description || '').trim().slice(0, 400);

  if (!title && !description) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Missing title/description' }),
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'No API key configured' }),
    };
  }

  const prompt = `Product title: ${title || '(unknown)'}\nProduct description: ${description || '(none)'}\n\n` +
    `A founder is stuck on WHERE to post about this product — not what to write. ` +
    `For each platform below, write ONE short, concrete reason THIS SPECIFIC product's niche/audience shows up there. ` +
    `Be specific to the product, not generic platform boilerplate. Genuinely different angle per platform — do not reword one sentence three times.\n\n` +
    `1. reddit: which kind of subreddit/community for this niche would actually engage with it, and why (max 1-2 short sentences).\n` +
    `2. x: why this niche's audience is active on X specifically, tied to this product (1 sentence).\n` +
    `3. producthunt: why PH's audience (tool-hunters, early adopters) fits this specific product (1 sentence).\n\n` +
    `Never use: game-changer, revolutionize, disrupt, seamless, unlock, cutting-edge. Never use an em dash (—); use a period or comma instead.\n` +
    `Respond with ONLY this JSON, no markdown fences, no commentary:\n` +
    `{"reddit":"...","x":"...","producthunt":"..."}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, error: `Anthropic API ${res.status}` }),
      };
    }

    const data = await res.json();
    const raw = data && data.content && data.content[0] && data.content[0].text;
    const parsed = JSON.parse(stripFences(raw || ''));

    if (!parsed.reddit || !parsed.x || !parsed.producthunt) {
      throw new Error('Incomplete generation');
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({
        ok: true,
        reddit: String(parsed.reddit).slice(0, 260),
        x: String(parsed.x).slice(0, 260),
        producthunt: String(parsed.producthunt).slice(0, 260),
      }),
    };
  } catch (e) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Generation failed' }),
    };
  }
};
