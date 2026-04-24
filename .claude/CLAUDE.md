# Project — hivemq-study

A monorepo study: microfrontend-ready Next.js shell + Java Spring Boot backend + local HiveMQ CE broker. Shared TypeScript types (Zod) live in `packages/types`.

## Layout

```
apps/
  shell/          # Next.js 15 App Router (en + de i18n)
  backend/        # Spring Boot 3, HiveMQ MQTT Client, Java 21
packages/
  types/          # Zod schemas — single source of truth for MQTT payloads and API contracts
  ui/             # Tailwind + shadcn-style primitives
  config-typescript/
  config-eslint/
infra/
  docker/         # docker-compose HiveMQ CE
docs/             # ADRs and architecture notes
```

## Local dev

```bash
pnpm install              # once
pnpm broker:up            # start HiveMQ in Docker
pnpm --filter @hivemq-study/shell dev     # shell on :3000
pnpm backend:dev          # Spring Boot on :8081
```

## What to keep in mind when changing code

- Any change to an MQTT payload shape MUST be reflected in both:
  - `packages/types/src/mqtt.ts` (Zod schema — consumed by frontend)
  - `apps/backend/src/main/java/com/hivemqstudy/backend/mqtt/Telemetry.java` (Java record)
  These will be code-generated from a single source later — see `docs/ROADMAP.md`.
- The shell app talks to the broker via MQTT-over-WebSocket (`:8000/mqtt`), the backend talks via MQTT TCP (`:1883`). Don't cross-wire them — WebSocket has higher overhead.
- i18n: every user-visible string goes in `apps/shell/messages/<locale>.json`. No hardcoded copy in components.
- Testing: Vitest (unit), Playwright (e2e) for frontend; JUnit 5 + Testcontainers (HiveMQ) for backend.

## Future perspectives (documented for reviewers)

- NestJS backend alongside Java — language unification across the monorepo, shared Zod → type flow. See `README.md` and `docs/FUTURE.md`.
- Module Federation for true runtime composition between zones.
- Code-gen Zod ↔ Java record to eliminate the duplicated payload definition.

## Details

See:
- `~/.claude/rules/*.md` (user-level defaults still apply)
- `.claude/architecture.md` (this repo's architecture decisions)
- `.claude/conventions.md` (repo-specific conventions)
