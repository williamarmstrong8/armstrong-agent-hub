# life-hub

A personal operating system — one hub to **visualize and connect every aspect of your life**. Built with Next.js on Vercel, styled as light-mode Geist neomorphism with Framer Motion.

It plugs into your custom life-MCPs (Garmin, StreetEasy, …) and pulls **live data** in-process, then lets an agent reason across all of it.

## Modules

| Module | What it does | Source | Live when… |
|---|---|---|---|
| **Dashboard** | Everything at a glance + a cross-life "connected insight" | all | always |
| **Home Search** | East Village rentals with your exact rules (2BR ≤ $5k, 3BR ≤ $7.5k) | StreetEasy | always (no key needed) |
| **Health** | Steps, sleep, recovery, RHR, VO₂, activities | Garmin Connect | `GARMIN_EMAIL` + `GARMIN_PASSWORD` set |
| **Work** | Deployments, ready-rate, velocity | Vercel API | `VERCEL_TOKEN` set |
| **Automations** | Cross-life workflows you can run on demand | Vercel Workflows | always |
| **Assistant** | One agent with live tools across every module | AI Gateway | `AI_GATEWAY_API_KEY` set (auto on Vercel) |

Every integration **degrades gracefully to realistic sample data** when its credentials are missing, so the hub always renders. Each card shows a `Live` / `Sample` badge.

## The apartment rules

The two saved searches live in `src/lib/config.ts`, and the hard geographic constraints are enforced in `src/lib/apartments/geo.ts`:

- **Not east of Avenue B** (`longitude > -73.9805` is excluded)
- **Not on / south of Houston St** (`latitude ≤ 40.7228` is excluded, plus an address-string guard)

Excluded listings are still shown (dimmed, with the reason) when you toggle **Show excluded**.

## MCP → in-process adapters

The referenced MCP servers are wrapped as direct, server-side adapters so the app is fully deployable on Vercel (no stdio subprocess required):

- **StreetEasy** uses [`streeteasy-api`](https://github.com/evandcoleman/streeteasy-api) — the same package the [streeteasy-mcp](https://github.com/SahilAshar/streeteasy-mcp) wraps.
- **Garmin** uses [`garmin-connect`](https://www.npmjs.com/package/garmin-connect), mirroring the [garmin_mcp](https://github.com/Taxuspt/garmin_mcp) tool surface.

Adapters live in `src/lib/adapters/`. To add a new part of your life (Spotify, calendar, finances…), drop in a new adapter + a `MODULES` entry + a tool in `src/app/api/chat/route.ts`.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # optional — fill in what you have
pnpm dev
```

Open http://localhost:3000.

## Deploy

```bash
vercel
```

On Vercel, the assistant works automatically via OIDC (no `AI_GATEWAY_API_KEY` needed). Add `GARMIN_*` and `VERCEL_TOKEN` as environment variables to light up the Health and Work modules.

## Stack

Next.js 16 · React 19 · Tailwind v4 · shadcn-style neomorphic UI · Framer Motion · Geist · AI SDK 7 + AI Gateway · Zod.
