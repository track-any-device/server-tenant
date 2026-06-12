# server-tenant — AI Instructions

This is the **standalone tenant operational portal** for the Track Any Device platform.
Docker image: `trackanydevice/server-tenant` | One running instance per tenant.

**This app is independent.** It has NO `track-any-device/*` package dependencies, no SSO,
and no connection to the central MySQL. It owns its own SQLite database (users, devices,
signals, incidents) and keeps itself current by listening to the central Soketi websocket.

Read this file completely before making any change.

---

## Architecture — how this app stays independent

The only platform credential is the **tenant API token** (`TENANT_API_TOKEN`) — a scoped
Sanctum token issued by the central platform (`devices.read` + `signals.read`). It is used
for exactly two things:

1. **One-time device load** — `php artisan tenant:sync-devices` pages through
   `GET {PLATFORM_API_URL}/api/v1/tenant/devices` and upserts into the local `devices` table.
2. **Soketi private-channel auth** — `POST {PLATFORM_API_URL}/api/v1/tenant/broadcasting/auth`
   signs channel subscriptions for the background listener and the browser live map.

Everything else is local:

```
central Soketi ──websocket──▶ php artisan tenant:listen-signals (supervisord)
                                 │  private-tenant.{id}.device-logs  → device.signal.received
                                 │  private-tenant.{id}.locations    → signal.created, locations.batch
                                 ├─▶ signals table   (every event logged)
                                 ├─▶ devices table   (last position/battery updated;
                                 │                    unknown devices AUTO-CREATED)
                                 └─▶ incidents table (calculated LOCALLY — see rules below)
```

The central platform has incident monitoring **turned off for tenant devices**
(`app/` skips `CheckBeatViolation` when `device->tenant_id` is set). This app is the
source of truth for its own incidents.

### Incident rules (`App\Services\SignalProcessor`)

| Type | Opens when | Auto-resolves when |
|---|---|---|
| `device_offline` | no signal for `TENANT_OFFLINE_AFTER_MINUTES` (sweep runs every 60 s inside the listener) | device signals again |
| `low_battery` | battery ≤ `TENANT_LOW_BATTERY_THRESHOLD` | battery ≥ `TENANT_LOW_BATTERY_RECOVERED` |

Add new rules in `SignalProcessor::evaluateIncidents()` — never in controllers.

---

## Authentication — built-in Laravel (Fortify)

Users are **local rows in this app's SQLite database**. Login, registration, password reset,
two-factor, and passkeys are all handled by Laravel Fortify (`FortifyServiceProvider`,
`config/fortify.php`). There is **no SSO** — do not reintroduce `package-sso-client`,
Socialite, or central-user lookups.

---

## Local database — owns everything

SQLite by default (`database/database.sqlite`), MySQL possible for on-premise.

| Table | Purpose |
|---|---|
| `users` | Local portal users (Fortify auth) |
| `devices` | This tenant's devices — synced once, then maintained by the listener |
| `signals` | Every broadcast signal, tracked per device (`device_id`, `recorded_at` indexed) |
| `incidents` | Locally calculated incidents |
| `sessions`, `cache`, `jobs` | Laravel internals |

Migrations live **in this repo** (`database/migrations/`) — this app is exempt from the
platform's "models live in package-core" rule because it is standalone.

---

## Key classes

```
app/
├── Console/Commands/
│   ├── SyncDevices.php        ← tenant:sync-devices — one-time load via Tenant API
│   └── ListenSignals.php      ← tenant:listen-signals — websocket listener (background job)
├── Models/
│   ├── User.php               ← local Fortify user
│   ├── Device.php             ← toPortalArray() shapes data for the React pages
│   ├── Signal.php
│   └── Incident.php
├── Services/
│   ├── TenantApiClient.php    ← the ONLY way to talk to the central platform
│   └── SignalProcessor.php    ← signal ingestion + incident calculation
└── Http/Controllers/Portal/   ← Inertia controllers reading the LOCAL database
```

`BeatController` / `AssigneeController` render their pages' built-in empty states —
beats and assignees are central-platform concepts not included in the standalone data set.

---

## Real-time in the browser

The live map subscribes to the same Soketi channels as the listener. Channel auth is
proxied: browser → `POST /broadcasting/auth` (this app) → central
`/api/v1/tenant/broadcasting/auth` with the tenant API token. The browser never sees
the token or the Pusher secret.

---

## Running

```
composer setup                          # install, key, migrate (SQLite)
php artisan tenant:sync-devices         # one-time device load (needs TENANT_API_TOKEN)
php artisan tenant:listen-signals       # background listener (supervisord in production)
composer dev                            # serve + vite
```

`docker/supervisord.conf` runs nginx + php-fpm + the signal listener.

---

## Environment variables

| Variable | Purpose |
|---|---|
| `APP_TENANT_SLUG` / `APP_TENANT_ID` | Tenant identity — id must match the central platform (channel names) |
| `TENANT_API_TOKEN` | Scoped Sanctum token — the only platform credential |
| `PLATFORM_API_URL` | Central API base URL |
| `PUSHER_APP_KEY` / `PUSHER_HOST` / `PUSHER_PORT` / `PUSHER_SCHEME` | Central Soketi connection |
| `DB_CONNECTION` | `sqlite` (default) |
| `TENANT_OFFLINE_AFTER_MINUTES` | Offline incident threshold (default 15) |
| `TENANT_LOW_BATTERY_THRESHOLD` / `TENANT_LOW_BATTERY_RECOVERED` | Battery incident thresholds (15 / 25) |

---

## What does NOT belong here

- Any `track-any-device/*` composer package — this app must stay dependency-free
- SSO, Socialite, or central-user authentication
- Direct MySQL queries to the central database
- Proxying portal page data from the central API (the old `PlatformApiClient` pattern — removed)
- Filament, Livewire, JT808/TAD-101 protocol code, SMS gateway logic

---

## Frontend stack

React 19 + Inertia v3, `@trackany-device/components` from npm, Tailwind v4, pnpm
(`node-linker=hoisted` in `.npmrc`). Pages compose package components only — no raw HTML.
The React pages' prop shapes are the contract: `Device::toPortalArray()` and
`Incident::toPortalArray()` must keep matching them.

---

## Versioning

Docker images are published on every merge to `main`.
Tag format: `latest` + `v0.1.{commit-count}-{short-sha}`.
On-premise tenants pull and redeploy at their own schedule.
