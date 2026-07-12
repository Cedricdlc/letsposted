// Generates 3 short, platform-distinct launch-post previews (Reddit, X,
// Product Hunt) from a product's real scraped title/description, using
// Claude. This is the actual "agents write for each platform" preview —
// a template can only reshuffle one input sentence three ways, which
// reads as copy-paste. If generation fails for any reason (no key, rate
// limit, malformed output), the function returns ok:false so the caller
// can fall back to the plain scraped text instead of fabricating copy.

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
    `Write 3 short previews of how this exact product's launch could look on different platforms. ` +
    `Same product, genuinely different voice per platform — do not just reword one sentence three times.\n\n` +
    `1. reddit: first-person post opener for r/SideProject, casual, asks for real feedback, max 2 short sentences.\n` +
    `2. x: a punchy X/Twitter announcement, 1 sentence, no hashtags, no emoji.\n` +
    `3. producthunt: a tagline under 12 words, no ending punctuation.\n\n` +
    `Never use: game-changer, revolutionize, disrupt, seamless, unlock, cutting-edge.\n` +
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
        reddit: String(parsed.reddit).slice(0, 300),
        x: String(parsed.x).slice(0, 280),
        producthunt: String(parsed.producthunt).slice(0, 120),
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
