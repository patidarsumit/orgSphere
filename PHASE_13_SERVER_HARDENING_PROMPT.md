# OrgSphere — Server Hardening and Performance Prompt
# Request visibility, rate limiting, and database index foundation

---

## CONTEXT

OrgSphere is growing from feature delivery into a more production-shaped internal platform. Phase 12 added
aggregate insight APIs and Recharts views, which increases read pressure on projects, tasks, teams, users,
activity logs, and posts.

This phase improves the current Express + TypeORM + PostgreSQL server without introducing Redis, RabbitMQ,
or Kubernetes. The goal is to make the existing single-service architecture healthier before adding heavier
infrastructure.

---

## IMPLEMENTATION PLAN

1. Add request IDs and lightweight request logging.
2. Add local in-memory rate limiting for high-risk or noisy routes.
3. Add central error middleware for future controller/service cleanup.
4. Keep existing controller behavior stable.
5. Add PostgreSQL indexes for current list, search, hierarchy, and insights query patterns.
6. Update `ARCHITECTURE.md` with the new server hardening layer.
7. Verify with server typecheck and build.

---

## SERVER HARDENING

Added middleware:

- `server/src/middleware/requestLogger.ts`
  - assigns an `X-Request-Id`
  - logs method, route, response status, duration, and request id
- `server/src/middleware/rateLimit.ts`
  - provides a dependency-free fixed-window rate limiter
  - protects authentication writes, global search, and public content reads
  - uses Express `req.ip`; set `TRUST_PROXY=true` when deployed behind a trusted reverse proxy
- `server/src/middleware/errorHandler.ts`
  - provides `HttpError`, `asyncHandler`, `notFoundHandler`, and centralized error responses

Current rate-limited surfaces:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `/api/search`
- `/api/posts/public`

---

## DATABASE PERFORMANCE

Added migration:

- `server/src/migrations/1776900000000-AddPerformanceIndexes.ts`

Index groups:

- user hierarchy and directory filters
- project owner/status/date filters
- task assignment/status/due-date analytics
- note owner/project chronology
- activity feed chronology
- public/internal blog status and search
- trigram search indexes for common `ILIKE` searches
- JSONB GIN indexes for skills, tech stack, note tags, and post tags

---

## DESIGN RULES

- Do not add Redis/RabbitMQ/Kubernetes until the product has traffic or workflow pressure that justifies them.
- Prefer database indexes and query shape improvements before caching.
- Keep middleware small and composable.
- Keep request logs useful but not noisy with sensitive data.
- Keep rate limits generous for internal workflows and stricter for auth writes.
- Use centralized error handling for new controllers and gradually migrate older controllers.
