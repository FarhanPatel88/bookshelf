---
name: errio
description: Set up, configure, and troubleshoot Errio error tracking (@errio/node) in any Node.js project
user_invocable: true
---

# Errio — Setup, Configure & Troubleshoot

Errio is an AI-powered error tracking platform. The `@errio/node` package automatically catches errors in Node.js apps and sends them to the Errio dashboard for AI-powered fixes.

Use this skill to set up Errio in the current project, troubleshoot issues, or check configuration.

## Usage

- `/errio` or `/errio setup` — Full setup: install, configure, and wire integrations
- `/errio fix` — Diagnose and fix common issues (errors not appearing, connection problems, etc.)
- `/errio config` — Show or update environment variable configuration

---

## Setup

Follow these steps in order. Skip any step that's already done.

### 1. Detect Package Manager & Install

Check which package manager the project uses:
- `yarn.lock` → `yarn add @errio/node`
- `pnpm-lock.yaml` → `pnpm add @errio/node`
- `bun.lockb` → `bun add @errio/node`
- Default → `npm install @errio/node`

### 2. Configure API Key

Find the `.env` file (or `.env.local`). If it doesn't exist, create `.env`. Add:

```
ERRIO_API_KEY=ak_your_api_key_here
```

If the user provides their API key as an argument, use it. Otherwise, ask them to paste it (they can find it in the Errio dashboard under Settings > API Keys).

**Important:** The API key must start with `ak_`. If it doesn't, it's invalid.

### 3. Add Import to Entry File

Find the main entry file. Look for (in order):
1. `package.json` → `"main"` field
2. `src/index.ts` or `src/index.js`
3. `src/app.ts` or `src/app.js`
4. `src/server.ts` or `src/server.js`
5. `index.ts` or `index.js`

Add this as the **FIRST import** in that file (after any `dotenv` import):

```typescript
import '@errio/node';
```

This single import automatically:
- Catches uncaught exceptions and unhandled promise rejections
- Patches `console.error()` and `console.warn()` to capture errors
- Starts infrastructure metrics collection
- Registers all framework/logger plugins (dormant until wired)

**Critical:** The `.env` file must be loaded BEFORE this import. If the project uses `dotenv`, ensure `import 'dotenv/config'` comes first.

### 4. Detect & Wire Framework

Search the codebase for framework usage and wire the appropriate middleware.

#### Express

If the project imports `express` (search for `from 'express'` or `require('express')`):

```typescript
import { requestHandler, errorHandler } from '@errio/node';

const app = express();
app.use(requestHandler());  // Add as the FIRST middleware
// ... existing routes and middleware ...
app.use(errorHandler());    // Add as the LAST middleware (after all routes)
```

- `requestHandler()` must be the first middleware — it sets up async context tracking per request.
- `errorHandler()` must be the last middleware — it catches errors thrown in routes.

#### Fastify

If the project imports `fastify` (search for `from 'fastify'` or `require('fastify')`):

```typescript
import { fastifyErrioPlugin } from '@errio/node';

// Register early, before routes
await app.register(fastifyErrioPlugin);
```

### 5. Detect & Wire Logger

Search the codebase for logger imports and add the appropriate Errio transport/stream.

#### Pino

If the project uses `pino` (search for `from 'pino'` or `require('pino')`):

```typescript
import { pinoErrioTransport } from '@errio/node';

const log = pino(
  { level: 'debug' },
  pino.multistream([
    { stream: process.stdout },
    { stream: pinoErrioTransport() },
  ])
);
```

#### Winston

If the project uses `winston` (search for `from 'winston'` or `require('winston')`):

```typescript
import { winstonErrioTransport } from '@errio/node';

const log = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    winstonErrioTransport(),
  ],
});
```

#### Bunyan

If the project uses `bunyan` (search for `from 'bunyan'` or `require('bunyan')`):

```typescript
import { bunyanErrioStream } from '@errio/node';

const log = bunyan.createLogger({
  name: 'my-app',
  streams: [
    { stream: process.stdout },
    { type: 'raw', stream: bunyanErrioStream() },
  ],
});
```

#### Log4js

If the project uses `log4js` (search for `from 'log4js'` or `require('log4js')`):

```typescript
import { log4jsErrioAppender } from '@errio/node';

log4js.configure({
  appenders: {
    out: { type: 'stdout' },
    errio: { type: log4jsErrioAppender() },
  },
  categories: {
    default: { appenders: ['out', 'errio'], level: 'debug' },
  },
});
```

#### Roarr

If the project uses `roarr` (search for `from 'roarr'`):

```typescript
import { setupRoarrCapture, serializeRoarrError } from '@errio/node';

setupRoarrCapture();

// When logging errors:
log.error({ err: serializeRoarrError(new Error('...')) }, 'message');
```

### 6. Detect & Wire Anthropic SDK

If the project uses `@anthropic-ai/sdk` (search for `from '@anthropic-ai/sdk'`):

```typescript
import { wrapAnthropicClient } from '@errio/node';
import Anthropic from '@anthropic-ai/sdk';

const client = wrapAnthropicClient(new Anthropic());
```

This captures API call failures, latency spikes (>10s default), and request telemetry.

### 7. Print Summary

After setup, print what was installed, what integrations were wired, and what was skipped.

---

## Troubleshooting

### Errors not appearing in dashboard

1. Check API key: grep for `ERRIO_API_KEY` in `.env`. Must start with `ak_`.
2. Check import order: `import '@errio/node'` must come AFTER dotenv but BEFORE everything else.
3. Enable debug: set `ERRIO_DEBUG=true` in `.env` — logs Errio internals to console.
4. Check sample rate: `ERRIO_SAMPLE_RATE` defaults to `1.0`. If set lower, not all errors are captured.

### Connection errors

1. Key must start with `ak_`. Check for typos or whitespace.
2. If `ERRIO_ENDPOINT` is set, verify the URL. Default: `https://errio.mosaicwellness.in`.
3. Ensure the app can reach the API endpoint (port 443).

### Framework errors not caught

1. Express: `requestHandler()` must be FIRST middleware, `errorHandler()` must be LAST.
2. Fastify: `fastifyErrioPlugin` must be registered before routes.

### Logger events missing

1. Verify the Errio transport/stream is added to the logger config.
2. Check `ERRIO_LOGGER_CAPTURE_MIN_LEVEL` — default is `error`. Set to `warn` or `debug` to capture more.
3. Roarr: call `setupRoarrCapture()` AFTER importing roarr. Use `serializeRoarrError()` for Error objects.

### Duplicate errors

Errio deduplicates errors with identical fingerprints within a 5-minute window. This is normal behavior.

### Metrics not reporting

Check `ERRIO_METRICS` isn't `false`. Default interval is 10s (`ERRIO_METRICS_INTERVAL_MS=10000`).

---

## Configuration Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ERRIO_API_KEY` | Yes | — | API key (must start with `ak_`) |
| `ERRIO_ENDPOINT` | No | `https://errio.mosaicwellness.in` | API endpoint URL |
| `ERRIO_ENVIRONMENT` | No | `NODE_ENV` value | Environment name |
| `ERRIO_SERVICE_NAME` | No | — | Service identifier |
| `ERRIO_SAMPLE_RATE` | No | `1.0` | Error capture sample rate (0.0–1.0) |
| `ERRIO_DEBUG` | No | `false` | Enable debug logging |
| `ERRIO_LOGGER_CAPTURE_MIN_LEVEL` | No | `error` | Min log level to capture |
| `ERRIO_METRICS` | No | `true` | Enable infra metrics |
| `ERRIO_METRICS_INTERVAL_MS` | No | `10000` | Metrics sampling interval (ms) |
| `ERRIO_HOST_INFO` | No | `full` | Host info detail (full/minimal/off) |
| `ERRIO_REDACT_HOST` | No | `false` | Redact hostname in metrics |

## Manual Error Capture

```typescript
import { captureError } from '@errio/node';

try {
  riskyOperation();
} catch (error) {
  captureError(error, {
    severity: 'high',
    tags: { route: '/checkout' },
    extra: { orderId: '123' },
  });
}
```

## Serverless / Lambda

```typescript
import { flush } from '@errio/node';

export async function handler(event) {
  // ... your logic ...
  await flush(); // Ship events before Lambda freezes
}
```
