# Repo conventions

## Workspace package names

Always `@hivemq-study/<short-name>`. The prefix is scoped for clarity; not published.

## TypeScript imports

- Path alias `@/*` inside each app → `./src/*`
- Workspace packages via their scoped name (`@hivemq-study/types`, `@hivemq-study/ui`)
- No reaching into another workspace's `src/` directly

## Environment variables

- Every app has a `.env.example`. Real values live in `.env.local` (git-ignored).
- Browser-exposed vars must start with `NEXT_PUBLIC_` (Next enforces this).
- Backend: `MQTT_HOST`, `MQTT_PORT`, etc. See `apps/backend/src/main/resources/application.yml` for the full list.

## i18n

- Locales: `en` (default) + `de`.
- Every user-visible string goes through `useTranslations` / `getTranslations`.
- Keys live in `apps/shell/messages/<locale>.json`. Keys are namespaced (`dashboard.title`, not flat).
- No hardcoded English in components.

## MQTT topic naming

- `devices/<deviceId>/telemetry` — device → server
- `devices/<deviceId>/status` — device → server (online/offline/fault)
- `devices/<deviceId>/cmd` — server → device
- Wildcards only for the server-side subscriber: `devices/+/telemetry`.

## Commit messages

Conventional Commits with these scopes:
- `shell`, `backend`, `ui`, `types`, `infra`, `docs`, `repo`

Examples:
- `feat(shell): add device detail page`
- `fix(backend): handle malformed telemetry without crashing subscriber`
- `chore(repo): bump turbo to 2.1.3`

## Testing discipline

- New logic ships with tests (unit or integration — judge by the boundary).
- Snapshot tests only for stable fixture data. Never for whole components.
- Every PR touching an MQTT topic or API response updates the Zod schema and the Java record in the same PR.
