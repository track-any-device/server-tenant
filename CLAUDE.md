# server-tenant — AI Instructions

This is the **standalone, public device tracker** for the Track Any Device platform.
Docker image: `trackanydevice/server-tenant` | One running instance per tenant.

**This app is independent.** It has NO `track-any-device/*` package dependencies, no SSO,
and no connection to the central MySQL. It owns its own SQLite database and keeps the
**current state** of each device fresh by listening to the central Soketi websocket.

It is **public and current-state only**: the primary surface is a no-login page where
anyone enters a device id and sees that device's latest position, battery, speed,
last-seen and online/offline status. There is **no signal history** and **no incidents** —
the local database holds essentially one meaningful table, `devices` (current state).

Read this file completely before making any change.

---

## Architecture — how this app stays independent

The only platform credential is the tenant's **machine access key** (`TENANT_API_TOKEN`, a
`tk_…` value generated/copied from the admin org-details screen). It's sent to the platform's
**`/api/portal`** endpoints as `Authorization: Bearer {key}` + `X-Tenant-Id: {APP_TENANT_ID}`
(validated by `ValidateTenantApiKey` against the tenant's `key_hash` — not a Sanctum token, no
scopes). It is used for exactly two things:

1. **One-time device load** — `php artisan tenant:sync-devices` pages through
   `GET {PLATFORM_API_URL}/api/portal/devices` and upserts into the local `devices` table.
2. **Soketi private-channel auth** — `POST {PLATFORM_API_URL}/api/portal/broadcasting/auth`
   signs channel subscriptions for the background listener and the browser live map.

Everything else is local:

```
central Soketi ──websocket──▶ php artisan tenant:listen-signals (supervisord)
                                 │  private-tenant.{id}.device-logs  → device.signal.received
                                 │  private-tenant.{id}.locations    → signal.created, locations.batch
                                 └─▶ devices table — CURRENT state overwritten in place
                                     (last position/battery/speed/status/last_seen;
                                      unknown devices AUTO-CREATED)
```

**Current-state only.** The listener stores nothing per signal. Each event overwrites the
matching `devices` row. No `signals` table, no `incidents` table, no local incident
calculation. A periodic sweep flips silent devices to `is_online = false` (the only thing
the offline threshold still drives) — it opens no incident.

**Stale-device pruning.** A separate scheduled command, `tenant:prune-stale-devices` (hourly,
run by the `schedule:work` supervisord program), deletes any device that hasn't broadcast for
`TENANT_PRUNE_AFTER_HOURS` (default 24; 0 disables) — judged by `last_signal_at`, falling back to
`created_at` for a device that was synced but never reported. The listener re-creates a device if
it ever reports again, so deletion is safe.

---

## Authentication — built-in Laravel (Fortify)

The **public tracker needs no login**. The small operational portal (devices list, device
detail, live map) is gated by Laravel Fortify auth — users are local rows in this app's
SQLite database. There is **no SSO** — do not reintroduce `package-sso-client`, Socialite,
or central-user lookups.

---

## Local database — owns everything

SQLite by default (`database/database.sqlite`), MySQL possible for on-premise.

| Table | Purpose |
|---|---|
| `devices` | This tenant's devices — synced once, then kept at CURRENT state by the listener |
| `users` | Local portal users (Fortify auth) |
| `sessions`, `cache`, `jobs` | Laravel internals |

There is no `signals` table and no `incidents` table — they were dropped when this app
became a current-state-only tracker (see
`database/migrations/2026_06_29_000001_drop_signals_and_incidents_tables.php`). Do not
reintroduce history tables.

Migrations live **in this repo** (`database/migrations/`) — this app is exempt from the
platform's "models live in package-core" rule because it is standalone.

---

## Public surface (no auth) — the primary one

| Route | What it does |
|---|---|
| `GET /` | Public device-id lookup page (form). The app's landing page. |
| `GET /track/{deviceId?}` | Same page pre-loaded with one device's current state (or a not-found flag). |
| `GET /public/devices/{deviceId}` | Public JSON API — `{ "data": { ...current state... } }`, or `404` for an unknown id (no fabricated data). |

`deviceId` is the device's **public-facing id** — its IMEI / broadcast id (a numeric
platform id is also accepted for convenience). `Device::toPublicArray()` is the contract
for both surfaces and deliberately exposes no internal database id.

---

## Authenticated portal (kept minimal)

| Route | Page |
|---|---|
| `GET /dashboard` | Device + online counts, links to devices/map |
| `GET /devices` `GET /devices/{id}` | Current-state device list + detail |
| `GET /map` | Live map of current positions (Soketi real-time) |
| `POST /broadcasting/auth` | Proxies private-channel auth to the central platform |

The incidents, beats and assignees pages were **removed** — those concepts depended on
signal history / central data that this app no longer holds.

---

## Key classes

```
app/
├── Console/Commands/
│   ├── SyncDevices.php           ← tenant:sync-devices — one-time load via Tenant API
│   ├── ListenSignals.php         ← tenant:listen-signals — websocket listener (background job)
│   └── PruneStaleDevices.php     ← tenant:prune-stale-devices — hourly: delete devices silent > N hours
├── Models/
│   ├── User.php                  ← local Fortify user
│   └── Device.php                ← toPortalArray() (authed pages) + toPublicArray() (public)
├── Services/
│   ├── TenantApiClient.php       ← the ONLY way to talk to the central platform
│   └── SignalProcessor.php       ← current-state upsert from the Soketi stream
└── Http/Controllers/
    ├── PublicTrackerController.php   ← public lookup page + public JSON API
    └── Portal/                       ← authed Inertia controllers reading the LOCAL database
```

---

## Real-time in the browser

The authed live map subscribes to the same Soketi channels as the listener. Channel auth is
proxied: browser → `POST /broadcasting/auth` (this app) → central
`/api/portal/broadcasting/auth` with the tenant access key (Bearer) + `X-Tenant-Id`. The browser
never sees the key or the Pusher secret.

---

## Running

```
composer setup                          # install, key, migrate (SQLite)
php artisan tenant:sync-devices         # one-time device load (needs TENANT_API_TOKEN)
php artisan tenant:listen-signals       # background listener (supervisord in production)
composer dev                            # serve + vite
```

`docker/supervisord.conf` runs nginx + php-fpm + the signal listener + the Laravel scheduler
(`schedule:work`, which fires `tenant:prune-stale-devices` hourly).

---

## Environment variables

| Variable | Purpose |
|---|---|
| `APP_TENANT_SLUG` / `APP_TENANT_ID` | Tenant identity — id must match the central platform (channel names) |
| `TENANT_API_TOKEN` | Tenant machine access key (`tk_…`, from the admin org-details screen) — sent as `Authorization: Bearer` + `X-Tenant-Id`; the only platform credential |
| `PLATFORM_API_URL` | Central API base URL |
| `PUSHER_APP_KEY` / `PUSHER_HOST` / `PUSHER_PORT` / `PUSHER_SCHEME` | Central Soketi connection |
| `DB_CONNECTION` | `sqlite` (default) |
| `TENANT_OFFLINE_AFTER_MINUTES` | Silence after which the sweep flips a device offline (default 15) |
| `TENANT_PRUNE_AFTER_HOURS` | Silence after which `tenant:prune-stale-devices` deletes a device (default 24; 0 disables) |

---

## What does NOT belong here

- Any `track-any-device/*` composer package — this app must stay dependency-free
- SSO, Socialite, or central-user authentication
- Direct MySQL queries to the central database
- Proxying portal page data from the central API (the old `PlatformApiClient` pattern — removed)
- **Signal history or incident tables / logic** — this app is current-state only
- Filament, Livewire, JT808/TAD-101 protocol code, SMS gateway logic

---

## Frontend stack

React 19 + Inertia v3, `@trackany-device/components` from npm, Tailwind v4, pnpm
(`node-linker=hoisted` in `.npmrc`). Pages compose package components. The public
`track` page opts out of the authed sidebar layout. The React pages' prop shapes are the
contract: `Device::toPortalArray()` (authed pages) and `Device::toPublicArray()` (public
page + API) must keep matching them.

---

## Versioning

Docker images are published on every merge to `main`.
Tag format: `latest` + `v0.1.{commit-count}-{short-sha}`.
On-premise tenants pull and redeploy at their own schedule.
