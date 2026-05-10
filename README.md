# TaskFlow API

> A Trello/Jira-style task management API. Backend-only, built around production patterns.

![CI](https://github.com/ankuryadav0811/taskflow-api/actions/workflows/ci.yml/badge.svg) &nbsp; ![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg) &nbsp; ![Node](https://img.shields.io/badge/node-22.x-brightgreen)

**Status:** 🚧 Phase 1 in active development (May 2026) - see [Roadmap](#roadmap) for what's shipped.

---

## Why this repo

I'm building TaskFlow as a deliberate exercise in production-grade Node.js - not a CRUD app dressed up. Every choice - Fastify over Express, Kysely over a heavy ORM, JSON-Schema-first OpenAPI, audit log from day one, Testcontainers over mocks - is a pattern I want fluent in my hands.

If you're learning Node.js backend patterns, the code here should be readable and the choices justified in commit messages.

---

## What it does (when complete)

- Users register / log in with JWT
- Create boards → columns → cards → comments (Trello-style hierarchy)
- Every state change recorded in an immutable audit log (`who`, `when`, `before`, `after`)
- Real-time updates over WebSockets (Phase 2)
- External services subscribe to changes via webhooks, with retries + idempotency (Phase 2)
- Full OpenAPI 3 spec served at `/docs`

---

## Quick start

```bash
git clone https://github.com/ankuryadav0811/taskflow-api.git
cd taskflow-api
docker-compose up -d         # Postgres + Redis
npm install
npm run migrate              # apply migrations
npm run dev                  # → http://localhost:3000
```

Swagger UI: http://localhost:3000/docs

---

## API at a glance

| Method | Path | Auth | Purpose |
|---|---|:---:|---|
| POST | `/auth/register` | - | Create user |
| POST | `/auth/login` | - | Exchange creds for JWT |
| GET | `/boards` | ✓ | List user's boards |
| POST | `/boards` | ✓ | Create board |
| GET | `/boards/:id` | ✓ | Fetch one board |
| PATCH | `/boards/:id` | ✓ | Rename |
| DELETE | `/boards/:id` | ✓ | Delete (cascade) |
| GET | `/boards/:boardId/columns` | ✓ | List columns |
| POST | `/boards/:boardId/columns` | ✓ | Append column |
| PATCH | `/columns/:id` | ✓ | Rename / reorder |
| DELETE | `/columns/:id` | ✓ | Delete (cascade cards) |
| GET | `/columns/:columnId/cards` | ✓ | List cards |
| POST | `/columns/:columnId/cards` | ✓ | Create card |
| PATCH | `/cards/:id` | ✓ | Edit / move |
| DELETE | `/cards/:id` | ✓ | Delete |
| POST | `/cards/:cardId/comments` | ✓ | Add comment |
| GET | `/cards/:cardId/comments` | ✓ | Paginated list |

Full schema at `/docs` (Swagger UI) once running.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Runtime | **Node 22 (LTS)** | Modern V8, native fetch, stable workers |
| Framework | **Fastify** | TypeScript-first, schema-based validation, ~3× Express throughput |
| Language | **TypeScript (strict)** | Catches bugs before tests do |
| DB | **Postgres 16** | Relational shape fits this domain; JSONB where it doesn't |
| DB layer | **Kysely** | Type-safe SQL builder; no ORM magic |
| Cache / pubsub | **Redis 7** | Sessions, rate limiting, WebSocket fan-out |
| Auth | **bcrypt + @fastify/jwt** | Standard, no surprises |
| Logging | **Pino** | Structured JSON logs, fast |
| Validation + OpenAPI | **JSON Schema** (via Fastify) | One source of truth for runtime validation, types, and docs |
| Tests | **Jest + Supertest + Testcontainers** | Real Postgres in tests, not mocks |
| CI | **GitHub Actions** | Lint + type-check + test on every PR |

---

## Project structure

```
src/
  server.ts          # bootstrap
  plugins/           # Fastify plugins (db, jwt, swagger)
  routes/            # HTTP handlers grouped by resource
  lib/               # cross-cutting helpers (audit, errors)
  schemas/           # JSON schemas (request/response)
  types/             # generated DB types (Kysely)
migrations/          # forward-only SQL migrations
tests/               # Jest unit + integration tests
docker-compose.yml
```

---

## Architecture

```
┌────────────┐      ┌──────────────┐      ┌───────────┐
│  Client    │ ───▶ │  Fastify API │ ───▶ │ Postgres  │
│ (Postman)  │      │  (stateless) │      └───────────┘
└────────────┘      │              │
                    │              │      ┌───────────┐
                    │              │ ───▶ │   Redis   │
                    └──────┬───────┘      └─────┬─────┘
                           │                    │
                     WebSocket layer ◀──── pubsub │  (Phase 2)
```

Each board is owner-scoped; cascading deletes go board → columns → cards → comments. Every mutation calls `lib/audit.logAudit()` which writes a row to `audit_log` (entity, actor, action, payload diff, timestamp) - the foundation for Phase 2's webhook delivery.

Full architecture diagram lives in `docs/architecture.png`.

---

## Testing

```bash
npm test                    # all tests
npm run test:watch          # watch mode
npm test -- --coverage      # with coverage
```

Integration tests use [Testcontainers](https://node.testcontainers.org/) - every test run spins up a real Postgres container, applies migrations, runs the test, tears down. No mocks for the DB layer. CI does the same.

---

## Roadmap

### Phase 1 - Month 1 (in progress)
- [ ] Fastify + TypeScript skeleton
- [ ] docker-compose (Postgres + Redis)
- [ ] Migrations + Kysely setup
- [ ] Auth: register / login / JWT middleware
- [ ] Boards CRUD
- [ ] Columns CRUD
- [ ] Cards CRUD
- [ ] Comments (paginated)
- [ ] Audit log skeleton
- [ ] OpenAPI 3 spec + Swagger UI
- [ ] Jest unit tests
- [ ] GitHub Actions CI
- [ ] Deploy to Fly.io

### Phase 2 - Month 2 (planned)
- [ ] WebSockets for real-time updates
- [ ] Redis-backed pubsub (multi-instance fan-out)
- [ ] Webhook delivery system (retries, idempotency, dead-letter queue)
- [ ] Rate limiting (token bucket via Redis)
- [ ] Testcontainers integration tests
- [ ] One Cypress E2E flow
- [ ] Performance pass with `clinic.js` (flame graph in `docs/`)

### Stretch (Month 3+)
- [ ] Webhook signing (HMAC) + replay protection
- [ ] OpenTelemetry tracing
- [ ] Prometheus `/metrics`
- [ ] Multi-tenancy (workspace concept)

---

## Contributing

This is a personal portfolio project - issues and PRs welcome but I won't always merge.

---

## License

[MIT](LICENSE) - © 2026 Ankur Yadav
