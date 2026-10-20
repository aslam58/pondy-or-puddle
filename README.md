# Pondy or Puddle? — Vercel edition

A no-login community flood-report map for urban Pondicherry. This version runs on standard Next.js on Vercel and PostgreSQL. It has no runtime dependency on Sites, Cloudflare Workers or D1. The existing Sites application remains unchanged until the migration is complete.

## Local setup

Use Node 22.13+.

```sh
npm ci
cp .env.example .env.local
# Configure DATABASE_URL and a long random NETWORK_HASH_SECRET in .env.local.
npm run db:migrate
npm run dev
```

Use the chosen PostgreSQL provider's transaction pooler for Vercel. With Supabase, copy the actual transaction-pooler connection string from the project's Connect dialog; do not infer the pooler hostname. The server disables prepared statements, uses a small connection pool, and requires TLS for remote database hosts.

`DATABASE_URL` and `NETWORK_HASH_SECRET` are server-only secrets. Do not prefix them with NEXT_PUBLIC_ and do not commit them. The database tables live in the private `pondy` schema, have row-level security enabled, and have no public policies. The server connection must use a database role permitted to access those tables (the schema owner works). No browser connects directly to the database.

## Vercel deployment

1. Push this folder as the root of the chosen GitHub repository.
2. Import it into Vercel as a Next.js project.
3. Apply `database/schema.sql` to the chosen PostgreSQL database.
4. Configure `DATABASE_URL` and `NETWORK_HASH_SECRET` as encrypted Vercel environment variables for the intended environment.
5. Deploy and verify `/api/reports`, the map, weather, and a real report submission.

`vercel.json` selects Next.js and the Mumbai region. Vercel builds with `npm run build`. A clean production build does not require database credentials; runtime report endpoints do.

## Migrating existing records

Export the hosted D1 `reports` and `actions` tables through an authenticated owner-only export. The public feed is not a complete backup: it excludes expired/flagged reports and private author/action identifiers. Never import local QA data as production data.

After choosing the target database, apply the schema and use:

```sh
node --env-file=.env.local scripts/import-reports.mjs /absolute/path/to/private-backup.json
```

The import expects `{ "reports": [...], "actions": [...] }` using D1's original snake_case column names. It is transactional and idempotent, retaining report IDs, observation times and action history. It does not import transient rate-limit buckets. Keep exports under the ignored `backups/` folder or outside the repository. Validate counts after import, perform a final export/import before cutover, then redirect the old site once the new site is verified.

Anonymous device cookies are scoped to the old domain and will not transfer automatically. Imported history and counts are retained, but visitors receive new device identifiers on Vercel.

## Tests

```sh
npm test
npm run typecheck
npm run build
# Start the production server against a disposable local PostgreSQL database:
npm start -- --port 8766
node scripts/test-api.mjs
```

The integration test refuses non-localhost targets. It checks cross-visitor persistence, validation, cross-origin rejection, duplicate confirmation prevention, clearing, three-flag hiding and weather. It creates disposable local records only.

## Product behaviour

- Coverage: 11.88–12.04° N, 79.73–79.87° E, an approximate product boundary rather than an official administrative boundary.
- Reports need a map pin and condition; name and note are optional.
- Reports refresh every 20 seconds, need a fresh check after 2 hours, and expire after 6 hours.
- Three device flags hide a report. Confirmation does not extend report expiry.
- Rate limits and anonymous device cookies provide basic abuse controls, not verified identity.
- Old records are pruned after 7 days on new submission. Network identifiers are daily hashes salted with a server secret; raw IPs are not stored in the application database.
- MapLibre GL / OpenFreeMap render vector streets and 3D buildings where available. Bay waves, rippling markers and optional decorative rain respect reduced-motion preferences.
- Open-Meteo provides hourly modelled rain forecasts. Forecasts do not imply street flooding.

## Current migration state

The Next.js production build and local PostgreSQL integration tests pass. GitHub destination, target hosted database and renewed Vercel access must be selected/connected before publication. No Vercel deployment or GitHub push has occurred yet.
