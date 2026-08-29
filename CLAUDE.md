# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

SnapLink — a URL shortener. Express (ESM) API + Postgres/Prisma + optional Redis cache, with a
Next.js App Router frontend. Deployed split: API on Render, frontend on Vercel, Postgres on
Supabase. `README.md` holds the full setup/deploy walkthrough; this file covers what is not
obvious from reading one file.

## Layout

Three nested npm projects — there is no workspace root, so `npm install` must be run in each:

- `Backend/` — Express API (`server.js` → `src/app.js`). Prisma schema in `Backend/prisma/`.
- `Frontend/` — a thin shim whose scripts just `npm --prefix url-shortener-frontend run …`.
- `Frontend/url-shortener-frontend/` — the actual Next.js app. **Run frontend commands here.**

## Commands

```bash
# Backend (from Backend/)
npm run dev                 # nodemon server.js  → :5000
npm start                   # node server.js
npx prisma migrate dev      # create + apply a migration locally
npm run migrate:deploy      # apply migrations (production / non-Compose)
npm run prisma:generate     # regenerate the client after editing schema.prisma
node scratch/test-redis.js  # ad-hoc Redis connectivity check

# Frontend (from Frontend/url-shortener-frontend/)
npm run dev                 # next dev → :3000
npm run build
npm run lint                # eslint (eslint-config-next)

# Whole stack
docker compose up --build   # needs a root .env; frontend :3000, API :5000, PG :5435, Redis :6379
```

There is no test suite and no backend linter. Verify backend changes by running the server and
hitting endpoints (`curl`); verify frontend changes with `npm run build` plus `npm run lint`.

## Architecture notes

**Short links resolve against the API, not the frontend.** `BASE_URL` is the *API* origin. The
redirect route is registered last in `src/app.js` as `GET /:shortCode`, so every reserved prefix
(`/auth`, `/url`, `/user`, `/analytics`, `/health`) must be mounted above it — adding a new
top-level route below that line makes it unreachable. The frontend builds short links itself as
`${NEXT_PUBLIC_API_URL}/${shortCode}`.

**Redirect path (`urlController.handleRedirect`).** Cache-aside: Redis → on miss read Postgres,
warm the cache, redirect. The cached payload carries `expiresAt` so expiry is enforced from the
cache alone (expired ⇒ evict + `410`). `cacheUrlRecord` clamps the Redis TTL to the link's
remaining lifetime so the cache can never outlive the link. `trackClick` is fired without `await`
— the redirect does not wait on the write.

**Redis is strictly optional.** `config/redis.js` skips connecting entirely when `REDIS_URL` is
unset in production, and every function in `services/redisService.js` guards on
`redisClient.isOpen` and swallows errors. New cache call sites must preserve that: a cache failure
should degrade to a database read, never surface as a 5xx.

**Click counting is transactional.** `analyticsService.trackClick` writes the `Analytics` row and
increments `Url.clicks` in one `prisma.$transaction`, so the counter and the log rows cannot
drift. Keep any new click-recording path inside that transaction.

**Sign-in is optional, and that shapes the permission model.** Anyone can `POST /url`; the link is
stored with `userId = null` and belongs to whoever holds the code. Signing in only adds ownership.
Read paths follow from that: an *unowned* link's stats are open to anyone with the code, an *owned*
link's are its owner's alone. Routes that are inherently about an account — `/user/**`,
`/analytics/dashboard` — still use `requireAuth`. The only abuse control on anonymous creation is
`urlCreationLimiter` (20/hour per IP), so don't loosen it.

**Auth is Google OAuth → JWT, no sessions.** `passport.authenticate` runs with `session: false`;
`/auth/google/callback` uses a *custom* callback (not `failureRedirect`) because a token-exchange
`TokenError` is an `error()`, not a `fail()`, and would otherwise reach `errorHandler` as a bare
JSON 500 instead of returning the user to `{FRONTEND}/auth/callback?error=…`. The JWT is passed to
the frontend in that redirect's query string and stored in `localStorage`; the API reads it from
the `Authorization: Bearer` header (`middleware/auth.js`). Cross-origin by design, so there are no
auth cookies.

**Ownership checks live in controllers, not middleware.** `optionalAuth` proves nothing on its own
and `requireAuth` only proves *a* user; `getUrlAnalytics` and `deleteMyUrl` do the real check
against `url.userId`. The analytics check is deliberately `url.userId !== null && url.userId !==
userId` — the null branch is what makes anonymous links readable, so don't "simplify" it to a plain
inequality.

**Two Postgres URLs.** `DATABASE_URL` is the pooled connection the app uses; `DIRECT_URL` is the
session connection `prisma migrate` needs (a transaction pooler cannot run migrations). Identical
against local Postgres, different on Supabase.

**`NEXT_PUBLIC_API_URL` is build-time.** It is inlined into the browser bundle, so changing it
requires a frontend rebuild — Compose passes it as a Docker build arg, not a runtime env var.
Similarly `output: "standalone"` in `next.config.ts` is gated behind `BUILD_STANDALONE=1` because
enabling it unconditionally breaks Vercel's post-build step.

**Production boots strictly, except for OAuth.** `config/env.js` aborts startup when
`NODE_ENV=production` and any of `DATABASE_URL`, `JWT_SECRET` (≥32 chars, not the placeholder),
`BASE_URL` or `FRONTEND_URL` is missing — the codebase ships development fallbacks (notably a
hardcoded JWT secret in `utils/jwt.js`) that must never serve traffic. Missing `GOOGLE_*` vars are
only a warning: `config/passport.js` skips registering the strategy, `isGoogleOAuthConfigured` goes
false, and `authRoutes` turns the two sign-in routes into a redirect to
`{FRONTEND}/auth/callback?error=google_auth_unavailable` instead of Passport's opaque "Unknown
authentication strategy" 500. Shortening still works. Add new must-have vars to the required list
rather than relying on a fallback.

**`trust proxy` is an exact hop count** (`TRUST_PROXY`, default 1 in production), never `true` —
`true` would let a client spoof `X-Forwarded-For` and bypass the rate limiter.

**`config/urls.js` normalizes `BASE_URL` / `FRONTEND_URL`** by stripping trailing slashes. Import
`BASE_URL`/`FRONTEND_URL` from there rather than reading `process.env` directly; CORS compares the
origin as an exact string.

## Frontend conventions

- All API calls go through `src/lib/api.ts` (`fetchApi`) — it attaches the JWT, sets the JSON
  content type, and turns non-2xx into a thrown `Error` carrying the API's `message`. Non-JSON
  responses (the QR PNG) come back as a raw `Response`. Don't call `fetch` directly.
- Session state comes from `useAuth()` (`src/context/AuthContext.tsx`); it re-verifies the stored
  token against `/auth/me` on mount, and `loading` starts `true` so pages can avoid a signed-out
  flash. Don't reintroduce sign-in gates around shortening or per-link stats — the landing page's
  sign-in block is an upsell rendered under the form, and the stats page lets the API decide.
- `/dashboard` is genuinely account-only and does still redirect signed-out visitors.
- Styling is Tailwind v4 with the design tokens declared in an `@theme` block in
  `src/app/globals.css` (`bg-canvas`, `text-accent-bright`, `.card`, `--radius-card`, the three
  font roles). Use those tokens and the existing component classes instead of raw hex values.
- `Frontend/url-shortener-frontend/AGENTS.md` is generated by `next dev` (Next 16) and asks you to
  consult `node_modules/next/dist/docs/` for this version's APIs. Commit it with your changes
  rather than reverting it.
