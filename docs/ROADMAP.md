# Roadmap

Not an exhaustive backlog — just the pieces we know we want, in rough priority.

## Near-term

- [ ] Add `apps/analytics` as a second Next zone and wire via Multi-Zones `rewrites()`.
- [ ] Add `apps/device-simulator` — a small Node CLI that publishes synthetic telemetry, so contributors don't need Mosquitto tools installed.
- [ ] Backend integration test using Testcontainers-HiveMQ: publish → assert `/api/devices` reflects.
- [ ] Playwright e2e scenario: publish synthetic telemetry, verify it appears on `/dashboard`.
- [ ] Basic GitHub Actions CI: `pnpm typecheck`, `pnpm test`, `pnpm --filter shell test:e2e`, `mvn test`.

## Medium-term

- [ ] Generate Java record + Zod schema from a single JSON Schema (or Zod-to-Java codegen). Eliminates the current duplication.
- [ ] HiveMQ Cloud profile — swap broker host/port via env, TLS, username/password auth, MQTT 5 session expiry.
- [ ] Auth on the `/api` surface (NextAuth-issued JWT validated by Spring's `oauth2-resource-server`).
- [ ] Shared design system expansion in `packages/ui` — `Button`, `Card`, `Table`, `Dialog`.
- [ ] Storybook for `packages/ui` with a11y + visual regression (Chromatic or Playwright + `@playwright/experimental-ct-react`).

## Long-term

- [ ] NestJS platform services workspace (`apps/platform-api`) for features where TS makes more sense than Java. See README → "Future perspectives".
- [ ] Module Federation between zones where runtime composition is actually needed.
- [ ] Observability: OpenTelemetry traces across browser → backend → broker. Prometheus metrics on the backend.
- [ ] Kubernetes manifests + a helm chart for deploying the full stack.
