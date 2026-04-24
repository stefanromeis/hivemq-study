# Architecture decisions

## Monorepo: pnpm workspaces + Turborepo

Chosen over Nx because:
- Minimal, unopinionated — easy to eject
- Fastest pnpm install + symlinked workspaces
- Turborepo's remote cache is drop-in if we add CI caching later

## Frontend: Next.js 15 App Router (not React SPA)

Even though the current production stack is React + Java, the study repo uses Next.js because:
- App Router's RSC model dramatically reduces client JS for pages that don't need interactivity
- Native support for Multi-Zones = cleanest path to microfrontends (see below)
- i18n: next-intl integrates natively with the App Router
- SSR + streaming improves perceived performance for the data-heavy dashboard views

## Microfrontend strategy: Multi-Zones first, Module Federation later

Current scaffold is **a single Next app designed for zone extraction**:
- Routes live under `/[locale]/<zone>/...` so future zones can be hoisted to their own Next apps
- `next.config.mjs` has a commented-out `rewrites()` block showing how to route `/analytics/*` to a separate Next app running on port 3001

When we're ready to split:
1. `pnpm create next-app apps/analytics` with the same config
2. Move `/dashboard` into `apps/analytics/src/app/[locale]/dashboard`
3. Uncomment the rewrite in the shell's `next.config.mjs`
4. Ship them independently

**Why not Module Federation now?** The App Router's RSC streaming interacts badly with the classic Module Federation flow. Multi-Zones gets the decoupling benefit (independent deploys, independent builds) without fighting the framework. If runtime-composition becomes a hard requirement, revisit with `@module-federation/nextjs-mf`.

## Backend: Java Spring Boot + HiveMQ MQTT Client

HiveMQ's own Java client is the most battle-tested MQTT 5 client on the JVM. First-class support for:
- Automatic reconnect + backpressure
- MQTT 5 features (reason codes, user properties, shared subscriptions)
- HiveMQ Cloud compatibility via TLS + auth

Spring Boot gives us:
- Actuator endpoints for health/metrics (free observability)
- Declarative config (`application.yml` + `@ConfigurationProperties`)
- Jackson auto-config for JSON

## Payload contracts: Zod today, code-gen tomorrow

Today: `packages/types/src/mqtt.ts` (Zod) and `apps/backend/.../Telemetry.java` (record) are maintained by hand. They MUST stay in sync.

Tomorrow: one schema (likely JSON Schema or Zod) generates both. See `docs/ROADMAP.md`.

## Testing

| Layer | Framework | Why |
|---|---|---|
| Shared packages (unit) | Vitest | Fastest TS runner; no build step |
| Shell unit | Vitest + @testing-library | Standard for React components |
| Shell e2e | Playwright | Best-in-class, mature DX |
| Backend unit | JUnit 5 + AssertJ | Idiomatic for Spring |
| Backend integration | JUnit 5 + Testcontainers (HiveMQ) | Real broker in CI without leaks |

## Styling

Tailwind + a `packages/ui` shadcn-style primitive library. Primitives live in the workspace, not `node_modules`, so they can be extended per-zone without publishing.
