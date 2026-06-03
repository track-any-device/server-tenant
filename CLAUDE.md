# server-tenant — AI Instructions

This is the **tenant operational portal** for the Track Any Device platform.
Docker image: `trackanydevice/server-tenant` | One running instance per tenant.

Read this file completely before making any change.

---

## Platform-Wide Rules

These three rules apply in every repository under the `track-any-device` organisation.

**Cross-repo changes: file a GitHub issue first.**
If a task in this repository requires a change in another package or server app — stop. Open a
GitHub issue in the target repository describing exactly what is needed and why. Reference that
issue number in your commit message (`ref track-any-device/{repo}#{n}`). Do not directly edit
files in another repository. When picking up a cross-repo issue, run Claude locally inside that
repository's working directory and work only within its scope.

**Release order: packages before server apps.**
This app depends on `package-core` and `package-sso-client`. Both must be released before
bumping their versions here. Release order:
`package-core → package-sso-client → server-tenant`.

**Database layer lives in `package-core` only.**
All Eloquent models for platform data (devices, beats, incidents, signals) live in
`track-any-device/core` and are served via the central `app/` API — not queried directly here.
The only local models are `TenantConfig` (branding/feature flags) and Laravel internals

**Keep API documentation up to date on the website.**
The platform's public docs live in the `web` repository under `src/app/docs/`.
When you add a new portal feature, change a portal API call, or modify the integration
contract with the central `app/` API:

1. File a GitHub issue against the `web` repo describing the doc change needed.
2. Reference the issue in your commit (`ref track-any-device/web#{n}`).
3. The `web` AI agent will implement the doc update when it picks up the issue.

Mapping for this repo (`server-tenant/`):
- New portal page or feature → update `web/src/app/docs/tenant/`
- Changed PlatformApiClient endpoint usage → update API usage docs
(sessions, cache). No platform migrations in this repo.

---

## Rule 1 — Plan before implementing

Before writing any code, ask clarifying questions. Present a plan and get explicit agreement.
Only begin once the approach is confirmed. Never start on an ambiguous requirement.

---

## What this app IS and IS NOT

### IS — a portal
- Renders the tenant operational UI (live map, incidents, beats, assignees, device commands)
- Holds user sessions (who is logged in)
- Calls the central `app/` REST API for all platform data using a machine API key
- Subscribes to the central Soketi WebSocket for real-time device updates
- Can be hosted by the platform (default) or deployed on-premise by the tenant

### IS NOT — a backend
- Does not own device data, signals, incidents, beats, or workflows
- Does not connect to the central MySQL database directly
- Does not run queue workers for platform jobs (those run in central `app/`)
- Does not run its own JT808 server, admin panel, or SSO server
- Does not expose a public API — it is a browser portal

---

## Deployment model

**One Docker service per tenant.** The same image runs for every tenant — only the env vars differ.

```yaml
# docker-compose.yml (central platform infrastructure)
services:
  tenant_acme:
    image: trackanydevice/server-tenant:latest
    environment:
      APP_TENANT_SLUG: acme
      APP_TENANT_ID: 42
      APP_TENANT_API_KEY: tpk_live_xxxx   ← identifies this tenant to the central API

  tenant_globex:
    image: trackanydevice/server-tenant:latest
    environment:
      APP_TENANT_SLUG: globex
      APP_TENANT_ID: 43
      APP_TENANT_API_KEY: tpk_live_yyyy
```

Cloudflare Tunnel routes `{slug}.tad.com` to the correct container.
On-premise tenants run the same image on their own servers with the same env vars.

---

## Tenant identity — set at boot, not per-request

There is **no per-request tenant resolution**. This app is not a multi-tenant app in the
traditional sense — it IS a single tenant. `AppServiceProvider::boot()` reads `APP_TENANT_SLUG`
and `APP_TENANT_ID` from the environment and sets them as application constants for the lifetime
of the container.

```php
// AppServiceProvider::boot()
config(['tenant.slug' => env('APP_TENANT_SLUG')]);
config(['tenant.id'   => env('APP_TENANT_ID')]);
```

Do not use `stancl/tenancy`. Do not resolve the tenant from the `Host:` header.
The tenant is a fixed property of the container, not a request property.

---

## Authentication — SSO via central server-login

Authentication is handled by the central SSO identity provider. This app ships with SSO
as the only authentication method. Tenants who deploy on-premise may later replace this
with their own identity provider, but the shipped configuration always uses the central login.

**Flow:**
```
User visits {slug}.tad.com (unauthenticated)
  → SsoRedirectController → Socialite::driver('sso')->redirect()
  → login.track-any-device.com/oauth/authorize?client_id={TENANT_CLIENT_ID}
  → User authenticates
  → Passport issues auth code
  → GET /sso/callback?code=...
  → SsoCallbackController (package-sso-client)
  → exchanges code → Passport access token
  → fetches central /api/sso/user
  → Auth::login($user) → session established
  → redirect to /dashboard
```

The user's **Passport access token** is stored in the session. It is forwarded as
`X-User-Token` in all requests to the central `app/` API so the platform can attribute
actions to the correct user.

**OAuth client:** `OAuthClientKind::Tenant` — one client per tenant, seeded/created
automatically when the tenant is registered. `APP_SURFACE=tenant` tells
`SsoClientServiceProvider` which OAuth client to load.

---

## Machine auth — API key to central platform

All data requests from this app to the central `app/` API use a **tenant API key**:

```
Authorization: Bearer {APP_TENANT_API_KEY}
X-User-Token:  {user's Passport token from session}
```

- `APP_TENANT_API_KEY` identifies which tenant this portal represents (machine identity)
- `X-User-Token` identifies which user within the tenant is taking the action (user identity)
- The central `app/` validates both and scopes all queries to the correct tenant

The API key is generated automatically when a tenant is created in Filament admin and is
stored hashed in the central database (`tenant_api_keys` table in `package-core`).
It is shown **once** — treat it like a password.

---

## Data flow — everything goes through the central API

```
browser → server-tenant (Inertia controller)
            → GET {PLATFORM_API_URL}/api/tenant/devices
              Authorization: Bearer {API_KEY}
              X-User-Token: {passport_token}
            ← JSON response (tenant-scoped)
          → Inertia::render('devices/index', $devices)
```

**Never** connect to the central MySQL database from this app. All data goes through
`PLATFORM_API_URL`. If a data type is missing from the central API, file an issue against
the `app` repository.

---

## Real-time — central Soketi

This app connects to the **central Soketi** instance for real-time device updates.
Private channel authentication is proxied through the central `app/` API:

```
browser → POST /broadcasting/auth (this app)
  → this app forwards to {PLATFORM_API_URL}/api/tenant/broadcasting/auth
    Authorization: Bearer {API_KEY}
  ← signed channel auth response
browser ← auth response → connects to central Soketi channel
```

On-premise tenants connect to the platform's Soketi over the internet — this is just a
WebSocket connection and works fine. Tenants do not run their own Soketi.

---

## Local database — minimal

This app has a **small local database** for things that cannot or should not be stored centrally:

| Table | Purpose |
|---|---|
| `sessions` | Laravel session storage |
| `cache` | Optional local cache (can use Redis or file instead) |
| `tenant_config` | Branding (logo, colours, app name), feature flags, custom nav items |

**No** device, beat, incident, signal, or workflow data is stored locally.
Local DB can be SQLite for simplicity or MySQL for production on-premise deployments.

---

## Frontend stack

| Tool | Notes |
|---|---|
| React 19 + Inertia.js v3 | Same pattern as the rest of the platform |
| `@trackany-device/components` | Shared UI library — installed from npm |
| Tailwind CSS v4 | Via `@tailwindcss/vite` plugin |
| Platform Adapter | `createInertiaAdapter(...)` injected at root |
| pnpm | Package manager — switch from npm (see below) |

**Switch the package manager to pnpm.** The React starter kit uses npm by default.
This app must use pnpm for consistency with the rest of the platform.
Add `node-linker=hoisted` to `.npmrc` for Rolldown compatibility.

**Remove the starter kit's bundled UI components.** The starter kit ships its own
shadcn/Radix components in `resources/js/components/`. Remove them — all UI comes from
`@trackany-device/components`. Pages must not use raw HTML.

---

## PHP packages required

```json
"require": {
    "track-any-device/core":        "^0.x",
    "track-any-device/sso-client":  "^0.x",
    "guzzlehttp/guzzle":            "^7.0"
}
```

- `core` — User model, Role enum, shared middleware, BelongsToTenant (for local models)
- `sso-client` — SSO redirect + callback controllers, Socialite driver
- `guzzle` — HTTP client for central API calls

**Does not require:** `sso-server`, `admin`, `drivers`, `jt808`, `tad101`, `mcp`, `sms-gateway`.
None of those packages belong in a tenant portal.

---

## Directory structure

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── DashboardController.php
│   │   ├── DeviceController.php     ← calls central API, renders Inertia pages
│   │   ├── IncidentController.php
│   │   ├── BeatController.php
│   │   ├── AssigneeController.php
│   │   └── MapController.php
│   └── Middleware/
│       └── EnsureTenantPortalAccess.php
├── Services/
│   └── PlatformApiClient.php        ← wraps all central API calls
└── Providers/
    └── AppServiceProvider.php       ← boots tenant context from env

resources/js/
├── app.tsx                          ← Inertia root + Platform Adapter
└── pages/
    ├── dashboard/
    ├── devices/
    ├── incidents/
    ├── beats/
    ├── assignees/
    └── map/

routes/
├── web.php                          ← portal routes (auth guarded)
└── settings.php                     ← tenant config pages
```

---

## `PlatformApiClient` — the only way to talk to the central platform

All calls to `{PLATFORM_API_URL}` must go through a single `PlatformApiClient` service.
Never use raw `Http::` or `Guzzle` calls to the central API in controllers.

```php
class PlatformApiClient
{
    public function devices(): array { ... }
    public function device(int $id): array { ... }
    public function incidents(): array { ... }
    public function createIncident(array $data): array { ... }
    // ...
}
```

This service handles:
- Injecting `Authorization: Bearer {API_KEY}` on every request
- Injecting `X-User-Token` from the current session
- Consistent error handling (403 → abort, 422 → validation errors, 500 → log + flash)
- Response caching where appropriate

---

## What does NOT belong here

- Direct MySQL queries to the central database
- Eloquent models for devices, beats, incidents, signals, or workflows
- Filament, Livewire, or any admin panel code
- Any JT808, TAD-101, or SMS gateway logic
- Queue workers for platform jobs (device commands, signal processing)
- Any route or controller that is not part of the tenant portal UI
- The starter kit's bundled shadcn components in `resources/js/components/` — remove them

---

## Environment variables

| Variable | Purpose |
|---|---|
| `APP_KEY` | Laravel encryption key — unique per tenant container |
| `APP_TENANT_SLUG` | Tenant identifier, e.g. `acme` |
| `APP_TENANT_ID` | Tenant database ID in the central platform |
| `APP_TENANT_API_KEY` | Machine API key to the central `app/` REST API |
| `APP_SURFACE` | Must be `tenant` — tells `SsoClientServiceProvider` which OAuth client to load |
| `PLATFORM_API_URL` | Central `app/` REST API base URL |
| `PLATFORM_SSO_URL` | Central `server-login` URL for SSO redirects |
| `PLATFORM_PUSHER_KEY` | Central Soketi app key |
| `PLATFORM_PUSHER_HOST` | Central Soketi host |
| `PLATFORM_PUSHER_PORT` | Central Soketi port |
| `DB_CONNECTION` | `sqlite` (default) or `mysql` for on-premise |
| `DB_DATABASE` | Local database path (SQLite) or name (MySQL) |
| `SESSION_DRIVER` | `database` |
| `SESSION_COOKIE` | `tenant_{slug}_session` — avoids cookie collision between tenant portals |
| `CACHE_STORE` | `redis` or `file` |
| `QUEUE_CONNECTION` | `sync` (this app does not run platform jobs) |

---

## Customisation (what tenants can change)

Tenants may customise this app within these boundaries:

| Allowed | Not allowed |
|---|---|
| Branding (logo, colours, app name in `tenant_config`) | Changing data models or migrations |
| Feature flags (hide/show specific portal sections) | Bypassing central API calls to query DB directly |
| Custom Inertia pages for tenant-specific workflows | Integrating other platform services (jt808, admin) |
| Additional REST calls to the central API | Running their own Soketi or JT808 server |
| Custom domain (their own subdomain, Cloudflare pointed at their container) | Modifying the API key machine auth |

---

## Versioning

Docker images are published on every merge to `main`.
Tag format: `latest` + `v0.1.{commit-count}-{short-sha}`.
All tenants on hosted infrastructure are updated automatically on deploy.
On-premise tenants pull and redeploy at their own schedule.
