# Local HiveMQ broker (Community Edition)

Runs HiveMQ CE in Docker with three ports exposed:

- `1883` — MQTT over TCP (for the Java backend)
- `8000` — MQTT over WebSockets at `/mqtt` (for the browser/Next.js frontend)
- `8080` — HiveMQ Control Center UI (`http://localhost:8080`, default `admin`/`hivemq`)

## Start / stop

From the repo root:

```bash
pnpm broker:up        # starts HiveMQ in the background
pnpm broker:logs      # tail logs
pnpm broker:down      # stop + remove the container (volumes persist)
```

## Quick smoke test from the terminal

```bash
# Terminal 1 — subscribe
docker run --rm --network host -it eclipse-mosquitto mosquitto_sub \
  -h localhost -p 1883 -t 'devices/+/telemetry' -v

# Terminal 2 — publish
docker run --rm --network host -it eclipse-mosquitto mosquitto_pub \
  -h localhost -p 1883 -t 'devices/dev-001/telemetry' \
  -m '{"temp":21.3,"ts":"2026-04-24T10:00:00Z"}'
```

## Browser-client connection string

Inside Next.js / the browser:

```
ws://localhost:8000/mqtt
```

Note the path — HiveMQ's WebSocket listener is bound to `/mqtt`.

## Control Center credentials

Default admin user is `admin` / `hivemq`. Change in `hivemq-config/config.xml` if
you expose this anywhere other than your laptop.
