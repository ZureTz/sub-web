# AGENTS GUIDE

Vue 3 + Vite 8 SPA with shadcn-vue and Tailwind CSS 4. Keep changes small, follow existing patterns, avoid refactors during fixes.

## Quick Facts

- Framework: Vue 3.5 (Options API for application components)
- Build tool: Vite 8
- UI: shadcn-vue (Reka UI primitives)
- Router: Vue Router 4 (history mode, base from `import.meta.env.BASE_URL`)
- Package manager: Bun 1.4.2 (pinned by `packageManager` in `package.json`)
- Node: 24.x (toolchain and Node test runner)
- Node built-in test runner; regression coverage in `tests/subscriptions.test.mjs`

## Commands

| Command | Description |
|---------|-------------|
| `bun install` | Install dependencies |
| `bun run dev` | Start dev server (host: 0.0.0.0) |
| `bun run build` | Production build |
| `bun run preview` | Preview production build locally |
| `bun run lint` | ESLint check (src, functions, tests and Vite config; zero warnings) |
| `bun run test` | Subscription and service regression tests |

## CI / Workflows

- **build.yml**: push / PR to `master` — Node 24 + pinned Bun frozen install, production ESLint, tests, build and 7-day artifact. A separate Pages deployment job depends on checks and only runs for a push to `master`.
- **docker-build-push.yml**: builds and publishes the Docker image on push to `master`.
- Use Bun everywhere and commit only `bun.lock`. Run `bun install` after dependency changes. Keep the Bun version in `package.json` and `Dockerfile` aligned.

## Repository Layout

```
src/
├── main.js                      # App bootstrap, plugin registration, Vue mount
├── App.vue
├── router/index.js              # Vue Router (history mode)
├── views/Subconverter.vue       # Main page
├── components/
│   ├── ConfigUploadDialog.vue   # Config upload dialog
│   ├── UrlParseDialog.vue       # URL parse dialog
│   ├── GithubIcon.vue          # Local brand icon
│   └── ui/                     # Official shadcn-vue JavaScript components
├── composables/
│   ├── useSubscription.js       # URL building logic (makeUrl, buildBaseUrl, buildAdvancedParams)
│   ├── useSubscriptionForm.js   # Reactive form state + addCustomParam + saveSubUrl
│   └── useUrlParser.js          # Short-link expansion + URL-to-form parser (analyzeUrl, parseUrl)
├── services/
│   ├── backendService.js        # BackendService.getBackendVersion()
│   ├── shortUrlService.js       # ShortUrlService.generateShortUrl()
│   └── configUploadService.js   # ConfigUploadService.uploadConfig()
├── config/
│   ├── constants.js             # CONSTANTS (env-backed, DEFAULT_CLIENT_TYPE='clash')
│   ├── client-types.js          # CLIENT_TYPES map (display label → target value)
│   └── remote-configs.js        # REMOTE_CONFIGS grouped options array
├── utils/
│   ├── storage.js               # getLocalStorageItem / setLocalStorageItem (TTL-based)
│   ├── validators.js            # validateSubUrl → { valid, message } | validateForm → boolean
│   ├── formatters.js            # formatVersion, formatErrorMessage, processSubUrl
│   └── search.js                # Backend autocomplete search helper
├── assets/main.css              # Tailwind and light/dark theme variables
└── lib/utils.js                 # shadcn-vue class name helper
services/                        # Docker Compose stack (subweb + myurls + redis)
```

## Key Modules

### `src/config/constants.js`
All values read from `import.meta.env` with `VITE_` prefix. Key constants:
- `DEFAULT_BACKEND` — appends `/sub?` to `VITE_SUBCONVERTER_DEFAULT_BACKEND`
- `DEFAULT_CLIENT_TYPE` — hardcoded `'clash'`
- `SHORT_URL_API`, `CONFIG_UPLOAD_API`, `PROJECT`, `BOT_LINK`, etc.

### `src/composables/useSubscriptionForm.js`
Returns plain object merged into `data()` via spread. Form fields include: `sourceSubUrl`, `clientType`, `customBackend`, `remoteConfig`, `emoji`, `nodeList`, `sort`, `udp`, `tfo`, `scv`, `fdn`, `expand`, `appendType`, `insert`, `new_name`, `tpl.surge.doh`, `tpl.clash.doh`. Default mode is advanced (`advanced: "2"`).

### `src/composables/useSubscription.js`
`makeUrl(form, advanced, processedSubUrl, currentBackend, customParams, needUdp)` — returns empty string on validation failure, otherwise builds full query string. Advanced mode adds remote config, include/exclude, filename, UDP, template, and custom params.

### `src/composables/useUrlParser.js`
`analyzeUrl(url)` — delegates HTTP(S) validation and short-link resolution to `UrlResolveService`; direct links must contain the `target` query parameter. Short links require CORS support.
`parseUrl(url, form, customParams, onSuccess, onError)` — parses all query params back into form fields; unknown params become `customParams` entries.

### `src/services/`
Service classes use static methods. HTTP services take the shared `http` instance from `src/services/http.js` as the first argument. Silent failures are acceptable for `getBackendVersion`. Upload response shape: `{ code: 0, data: { url }, msg }`. Short URL response shape: `{ Code: 1, ShortUrl, Message }`.

### `src/utils/storage.js`
TTL stored inside the JSON value as `{ setTime, ttl, expire, value }`. `expire` checked on every read; expired entries are removed automatically. TTL value comes from `VITE_CACHE_TTL` env var.

## Code Style

- Indentation: 2 spaces
- Quotes: single quotes preferred
- Semicolons: none (`semi: 0`)
- Vue component names: single-word allowed (`vue/multi-word-component-names: off`)
- `no-console` / `no-debugger`: error in production, off in dev
- ESLint extends: `plugin:vue/vue3-essential`, `eslint:recommended`
- Parser: `@babel/eslint-parser` with `requireConfigFile: false`

## Imports & Modules

- ES modules (`import`/`export`) throughout
- Absolute alias `@` maps to `src/` (see `vite.config.mjs`)
- Import order: core libs → local config/utils → services → components
- Dynamic imports only for route lazy-load

## Vue Patterns

- Keep application components in Options API. Official shadcn-vue components under `src/components/ui/` retain generated `script setup` code.
- Component structure: `<template>`, `<script>`, `<style>`
- Reactive state in `data()`; derived state in `computed`
- Composables spread via `...useSubscription()` / `...useUrlParser()` in `methods`
- `useSubscriptionForm()` spread via `...subscriptionForm` in `data()`

## Icons

- Use named imports from `@lucide/vue` for interface icons.
- The GitHub brand icon is kept locally in `src/components/GithubIcon.vue`.

## Environment Variables

- All env vars use `VITE_` prefix; access via `import.meta.env`
- Do not commit `.env.local`, `.env.*.local`
- Constants centralised in `src/config/constants.js` — do not scatter `import.meta.env` calls

## Validation

- Use `src/utils/validators.js` for user-facing checks
- `validateSubUrl` returns `{ valid, message }`; `validateForm` returns boolean
- Do not throw for validation flow

## Error Handling

- UI feedback via the page `notify(text, type)` method; errors use an accessible alert.
- Silent failures acceptable only when UX demands it (e.g., backend version fetch)
- Use `formatErrorMessage` from `src/utils/formatters.js` for consistent error strings

## Docker

- Base images: `oven/bun:1.4.2-alpine` (build), `nginx:alpine` (runtime)
- Build: `bun install --frozen-lockfile && bun run build`, output copied to `/usr/share/nginx/html`
- Services compose stack in `services/` includes myurls + Redis

## Git Hygiene

- Do not commit `dist/`, `node_modules/`, `.env.local`, `.env.*.local`
- Avoid adding generated files

## Frontend Safety

- Avoid inline styles unless already present in nearby code
- Prefer the local shadcn-vue components; alias HTML-reserved names (e.g. `Button as UiButton`) in Options API components.
- Keep UI message strings consistent (mostly Chinese)

## Performance

- Do not introduce heavy dependencies; prefer existing utilities
- Keep all network calls in `src/services/`

## Example Patterns

```js
// Route lazy-load
component: () => import('../views/Subconverter.vue')

// Service class
export class BackendService {
  static async getBackendVersion($axios) { ... }
}

// Composable (Options API style)
export function useSubscription() {
  return { makeUrl, buildBaseUrl, buildAdvancedParams }
}

// Spread composable into methods
methods: {
  ...useSubscription(),
  ...useUrlParser()
}

// Spread form state into data()
data() {
  return { ...useSubscriptionForm(), otherField: '' }
}
```

## Suggested Manual Checks

- `bun run lint`
- `bun run test`
- `bun run build`
- Run `bun run dev` and smoke the main screen

## Notes for Agents

- Follow existing patterns; minimise scope
- No large refactors unless explicitly requested
- Do not introduce TypeScript or new tooling without approval
- Tests use Node’s built-in runner with Vite module loading. Single case: `node --test --test-name-pattern="advanced parameters" tests/subscriptions.test.mjs`.
