# Disc Golf Iceland

A source-led Icelandic disc golf atlas with English and Icelandic interfaces, course profiles, trip itineraries, personal scorecards, and a grounded server-side caddie integration.

This new full-stack application lives separately from the repository's original static site. No original root pages are replaced. It runs on React / Vinext, Cloudflare Workers, D1 and R2, with the existing Sites build and deployment adapters.

## Running the application

Use Node 22.13 or newer and pnpm. Install with `pnpm install --frozen-lockfile`, then `pnpm dev`. Copy `.env.example` to `.env` for local integration configuration. Never commit secrets.

Build with `pnpm build`. Generate schema migrations with `pnpm db:generate`. Local D1 schema needs to be applied using Wrangler and the generated `dist/server/wrangler.json`; production migrations are applied by Sites before deployment.

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_lowly_ink.sql
```

For a new independent deployment, create a Site and replace only the `project_id` in `.openai/hosting.json`. `DB` and `BUCKET` are logical, platform-managed bindings. Do not copy production identity headers from untrusted incoming requests on another host; this application relies on the trusted Sites dispatcher for authentication.

## What works

- Course/town/region search, supported attribute filters, clustered map markers, synchronized selection, mobile map/list toggle, shareable filter links and up to three-course comparison.
- Persistent directory records in D1, source references, check dates, explicitly unverified fields, dedicated course URLs and sitemap.
- Optional ChatGPT sign-in, private saved courses and played status, saved itineraries, solo/group scorecards, and personal round history. Unsaved trip and scorecard drafts are temporary browser-session state; saved records live in D1.
- Course-aware caddie using the server-side OpenAI Chat Completions API, strict response format, catalogue grounding, clickable source cards and durable per-user/global rate limits. Missing credentials produce an explicitly labeled unavailable state and database matches, not a simulated AI answer.
- Open-Meteo wind, gust, temperature and precipitation forecasts with time/provider labels. Failures have a usable fallback link.
- Road routing integration for openrouteservice. No driving distance is calculated without the provider, and no straight-line distance is substituted. Grímsey is excluded from continuous driving routes.
- Moderated reviews, dated condition reports, photo submissions, corrections, missing-course suggestions and verified events. Only approved content is public. JPEG/PNG metadata is removed before storage.
- Server-protected administration for course records, source review, event publishing, submissions and an immutable change log.

## Configuration still needed

| Setting | Purpose | Without it |
| --- | --- | --- |
| `OPENAI_API_KEY` | Server-only OpenAI credential | Caddie unavailable; source lookup remains usable |
| `OPENAI_MODEL` | Compatible chat model, default `gpt-4.1-mini` | Uses default |
| `ORS_API_KEY` | Server-only openrouteservice credential | Road estimates unavailable; itinerary save/share work |
| `ADMIN_USER_IDS` | Comma-separated allowlisted Site user IDs | Administrative access denied |

Set production secrets using the Site environment configuration, then redeploy. The owner can obtain their Site user ID from `/admin` after signing in. Do not infer administrator privilege from being signed in or from client UI state. For OpenAI credentials use the approved OpenAI Developers connection.

The review deployment starts private. Its public browsing routes are account-optional in the application, but changing the hosting audience to public is a separate owner action.

## Coverage and verification

The first release contains **10 source-checked listings**, not complete national coverage. Hole counts and populated course facts were checked against [Íslenska frisbígolfsambandið](https://www.folf.is/folfvellir-a-islandi-4/) on 2026-09-22. Coordinates were imported from the existing repository and are explicitly marked **approximate / not independently verified**. None is claimed to be a verified first tee.

A record's `source` and `checked` fields apply to its populated factual attributes. `locationSource` and `locationVerified` track map coordinates separately. Missing fees, toilets, accessibility, live closures, durations and hole-level layout data stay null. Blank values must never be converted into “free”, “open”, or “accessible”.

Editorial ordering highlights three regions and is not a quality ranking. Ratings are not displayed because verified community rating data is unavailable. Current course or road access is never inferred from a favorable weather forecast. Operator closure feeds and additional club contacts remain to be sourced. No upcoming event is invented to populate the calendar.

For additions: reconcile names and duplicate coordinates, verify a primary source, record supported fields and the date, obtain image permission, then publish through administration with a change note. Keep layouts inside their parent course. Record temporary/seasonal/permanently closed arrangements in access information; preserve identifiers and historical rounds.

## Verification

```sh
pnpm typecheck
pnpm build
pnpm verify
```

The integration verifier runs the built Worker with real D1/R2 APIs in an isolated disposable Miniflare environment. It tests source directory access, authorization, user isolation, CSRF, saved courses, itinerary persistence and ownership, score totals, incomplete scores, round history, AI/routing unavailable states, moderation, audit logging, page rendering and sitemap. It never writes production data or uses user credentials.

Browser visual/interaction QA was blocked by unavailable managed preview infrastructure. Live AI, live routing, production sign-in and supported WebMCP execution remain unverified. The core server workflows passed 32 checks before publication. Re-run the same suite after backend changes; credentials require a separate real-provider test before calling those integrations live.

## Assets

See [ASSETS.md](ASSETS.md). Course photography is not implied by generic Iceland landscape imagery. The Klambratún photo shows the park in 2008; it is not a current condition report. Leaflet is locally vendored so the map interface can load independently of a script CDN. The local Natural Earth coastline is an offline fallback when CARTO tiles fail. The searchable directory remains usable without the map.
