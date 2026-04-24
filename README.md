# hivemq-study

A monorepo study project exploring a microfrontend-ready full-stack setup for HiveMQ workloads:

- **Frontend:** Next.js 15 (App Router) with Tailwind, next-intl (en/de), and MQTT-over-WebSocket.
- **Backend:** Java 21 + Spring Boot 3 + HiveMQ's own MQTT 5 client.
- **Broker:** local HiveMQ CE via Docker Compose (`1883` TCP, `8000` WebSockets, `8080` Control Center).
- **Shared:** Zod schemas in `packages/types` — single source of truth for payloads; Tailwind primitives in `packages/ui`.
- **Tooling:** pnpm workspaces, Turborepo, Vitest + Playwright + JUnit 5 + Testcontainers.

## Quickstart

Prerequisites: Node 20+, pnpm 9+, Docker, Java 21, Maven (or use the included wrapper once generated).

```bash
pnpm install

# In three terminals:
pnpm broker:up                                   # 1. start HiveMQ
pnpm backend:dev                                 # 2. Spring Boot on :8081
pnpm --filter @hivemq-study/shell dev            # 3. Next.js on :3000
```

Open http://localhost:3000 (English) or http://localhost:3000/de (German).

Publish a telemetry message to see it appear on the dashboard:

```bash
docker run --rm --network host -it eclipse-mosquitto mosquitto_pub \
  -h localhost -p 1883 -t 'devices/dev-001/telemetry' \
  -m '{"deviceId":"dev-001","ts":"2026-04-24T10:00:00.000Z","temp":21.3,"humidity":42}'
```

## Repository layout

```
apps/
  shell/          Next.js 15 — i18n, Tailwind, MQTT-over-WebSocket client
  backend/        Spring Boot 3 — subscribes to devices/+/telemetry, exposes /api/devices
packages/
  types/          Zod schemas (MQTT payloads, API contracts)
  ui/             Tailwind + shadcn-style primitives
  config-typescript/
  config-eslint/
infra/
  docker/         HiveMQ CE Compose file + broker config.xml
docs/             ADRs, roadmap, future perspectives
.claude/          Project-specific Claude Code memory (CLAUDE.md, architecture, conventions)
```

## What this demonstrates

- **Microfrontend readiness.** The shell is structured so any route segment can be hoisted into a separate Next app via Next.js Multi-Zones. A commented-out `rewrites()` block in `apps/shell/next.config.mjs` shows exactly where zone cutlines go. No Module Federation build-time coupling.
- **End-to-end type safety.** The `TelemetrySchema` in `packages/types` is the single source of truth; both the React client (via `mqtt.js`) and the Spring Boot backend (via `hivemq-mqtt-client` + Jackson) validate against it.
- **Observable by default.** Spring Boot Actuator exposes `/actuator/health` and metrics; the frontend surfaces connection state visibly.
- **Testing layered.** Unit (Vitest + JUnit), component (Testing Library), integration (Testcontainers-HiveMQ), e2e (Playwright).
- **i18n as a first-class concern.** next-intl App Router integration, German + English messages, URL-based locale routing.

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Runs every workspace's `dev` in parallel (Turborepo) |
| `pnpm build` | Build all workspaces |
| `pnpm test` | Unit + component tests across the repo |
| `pnpm test:e2e` | Playwright e2e for apps that opt in |
| `pnpm typecheck` | `tsc --noEmit` across every TS workspace |
| `pnpm lint` | ESLint everywhere |
| `pnpm format` | Prettier across everything |
| `pnpm broker:up` / `broker:down` / `broker:logs` | Lifecycle the local HiveMQ CE |
| `pnpm backend:dev` / `backend:test` / `backend:build` | Spring Boot lifecycle |

---

## Performance notes

- Turborepo caches per-task, including typecheck and test. Remote-cache it in CI for fast builds.
- The shell uses RSC by default — only components that touch MQTT (i.e. `TelemetryPanel`) ship as client components. This keeps the initial JS payload minimal even as the dashboard grows.
- The MQTT client keeps a bounded ring buffer (default 50 messages) to cap browser memory under high-frequency traffic. Increase via `useTelemetryStream(N)` if needed; consider batching for >1kHz publish rates.
- The Java backend uses the MQTT 5 async client with automatic-reconnect and QoS 1 (at-least-once) on the subscription side, so device messages aren't dropped across broker restarts. For QoS 2 workloads (exactly-once), revisit message deduplication in `DeviceStore`.
- `ConcurrentHashMap` in `DeviceStore` is fine for the demo; swap for Redis when horizontal scale becomes a requirement.

## Reusability

- `packages/types` is consumed by any workspace needing MQTT/API types; swap to a published package name when going cross-repo.
- `packages/ui` is a starter for a real design system — extend with primitives (`Button`, `Card`, `Table`) co-owned by product designers.
- `packages/config-typescript` and `packages/config-eslint` normalize tooling so new apps added to the monorepo only need a two-line tsconfig and a one-line eslintrc.

---

## Future perspectives

### Why NestJS could be the better backend choice over time

The current Java stack is pragmatic — most HiveMQ devs are Java experts, and HiveMQ's own client is first-class on the JVM. But the monorepo story gets substantially better with a Node/TS backend. A realistic path forward:

1. **Keep Java for the broker-adjacent hot path.** Anything that runs as a HiveMQ *extension* has to be JVM — that's non-negotiable. Message interceptors, custom auth, topic-level ACLs stay in Java.
2. **Introduce NestJS for the surrounding platform.** Admin APIs, analytics aggregation, user management, notification services, webhooks. This is where the language-unification ROI is highest:
   - **Shared Zod → TypeScript types** across frontend and backend eliminates a whole class of contract drift. Right now `Telemetry.java` and `TelemetrySchema` in Zod are maintained by hand — this is a latent bug factory.
   - **Unified tooling** — one test runner, one linter, one formatter, one build cache. Turborepo caches both ends of the stack.
   - **Smaller hiring pool friction** — frontend devs can safely contribute to backend. Many more full-stack TS engineers than full-stack Java/TS engineers.
   - **Faster iteration** — `nest generate resource` + hot reload vs. Spring's annotation weight and startup time.
   - **Lighter deployment** — Node containers cold-start faster, cheaper to scale horizontally.
3. **Strangler migration path.** Never rewrite; always siphon. New platform services are built in Nest from day one. Existing Java services migrate only when they need a substantial rewrite anyway.

**Where Java legitimately still wins** (and should stay there):
- HiveMQ extensions (JVM-only).
- CPU-bound transforms, complex transactional systems.
- Deep Spring ecosystem integrations (Batch, Integration, Data JPA) without TS equivalents.

### Why Next.js Multi-Zones over Module Federation (for now)

The goal of the MFE architecture is **independent deploys + team autonomy**, not necessarily runtime composition. Multi-Zones delivers the deploy/team win natively with App Router, while Module Federation adds significant complexity for a benefit — dropping a live component from zone A into zone B — that a small-to-mid team rarely actually needs.

If that need shows up, migrate on a per-boundary basis using `@module-federation/nextjs-mf`. The zones we split today will be ready to expose modules the day that becomes valuable.

### Code-gen Zod ↔ Java

Long-term, payload schemas should generate both the Zod schema and the Java record from one source (candidates: JSON Schema + `quicktype`, or Zod-to-Java codegen). Tracked in `docs/ROADMAP.md`.

---

## AI assistance

This repo includes a `.claude/` folder with project-specific memory and architecture notes. If you use Claude Code, it'll pick these up automatically on top of your user-level setup.

## License

Placeholder — add before public publication.
