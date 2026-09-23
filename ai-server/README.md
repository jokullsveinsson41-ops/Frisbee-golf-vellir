# Frisbí AI: real-model upgrade

This branch replaces the keyword FAQ with a server-backed OpenAI Responses conversation. It has **not** been activated on the GitHack website: that host only serves static files, and no API key or backend deployment is configured.

## Run the complete website

Requires Node.js 22 or later. No npm dependencies are needed.

1. Configure `OPENAI_API_KEY` through the host's secret/environment settings. Never put a key in HTML, frontend JavaScript, GitHub, or chat.
2. Set `SITE_ORIGIN` to the deployed website's exact HTTPS origin.
3. Optionally set `OPENAI_MODEL` (default `gpt-6-astra`) and `FRISBI_WEB_SEARCH=true` to enable live research. The model must be available to the configured API project. API usage and enabled search are billable.
4. Run `node ai-server/server.mjs`; the host can supply `PORT` (default 8080). Serve behind HTTPS.

The server hosts the existing pages and `/api/frisbi-ai` at the same origin. All current relative course links continue working. Do not merge this branch into the static GitHack site before the server-hosted version is ready: `/api/frisbi-ai` cannot run on GitHack. No alternate website or API service has been deployed by this change.

## Capabilities

- Real conversational responses in Icelandic or English, not keyword answers.
- Recent conversation retained in memory only, with up to nine previous exchanges subject to a 24,000-character budget. Reset clears it. Reloading starts over.
- Grounding in all 28 existing course listings, with detailed context selected by mentioned courses/regions. Regenerate after course changes with `python3 scripts/build-ai-knowledge.py`.
- Coaching instructions covering handedness, throwing style, skill, wind, disc selection, practical drills, tradeoffs, and uncertainty.
- Optional live web search and clickable sources.
- Readable paragraphs/lists/links, longer questions, cancel/retry/reset, and visible connection errors.
- No fake model responses or silent canned-answer fallback.

## Runtime boundaries

The server rejects cross-origin requests, invalid roles, excessive history and oversized bodies. Secrets are read only on the server and server source/config files are never served. Model output is rendered as text/DOM nodes rather than HTML.

The built-in request limits (8/minute per socket IP, 200/day globally, 4 concurrent) are **single-process, in-memory safeguards**, not persistent billing limits. They reset on restart. When behind a reverse proxy, the socket IP may be shared by visitors. Configure rate limiting at the trusted edge and an API project spending limit before public deployment; do not trust arbitrary forwarded headers. For multiple replicas, use a shared limiter. Keep `SITE_ORIGIN` configured in production.

`store:false` disables Responses API storage for these calls; it is not a claim of zero data retention. Recent conversation text is sent to OpenAI for each answer. The server does not log prompts, keys, or upstream response bodies.

## Verification

Run `node --test tests/frisbi-ai.test.mjs`. Tests mock the model API and make no billable calls. They verify conversation forwarding, grounding, citations, invalid/hostile input, rate limits and secret-file exclusion. A real response-quality check still requires a configured API connection.

Suggested live acceptance prompts:

- “Ég er örvhentur byrjandi og kasta forehand um 50 metra. Hvaða diskategund hentar mér?” then “Hvað breytist í mótvindi?”
- “Berðu saman Borgarnes og Hvanneyri fyrir fjölskyldu með 40 mínútur.”
- “Hvað er að gerast á vellinum á Bifröst í dag?” (must verify with search or acknowledge no current information).
- “Ég kasta RHBH og diskurinn fer hátt upp og til vinstri. Hvernig prófa ég hvað er að?”
- “Gildir sama regla um OB í vinalegu spili og á móti?”

Official API references: https://developers.openai.com/api/docs/guides/conversation-state and https://developers.openai.com/api/docs/guides/tools-web-search
