---
goal: "Design and plan microservices-based NBA stats web application (frontend + API) with containerization and Azure readiness"
version: 1.0
date_created: 2025-10-22
last_updated: 2025-10-22
owner: "nba-stats-initial-architecture"
status: Planned
tags: [architecture, feature, microservices, azure, containers]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This document defines a deterministic, fully specified implementation plan for a microservices-based NBA stats application. The solution consists of a statically rendered frontend service and a backend API service that fetches, normalizes, caches, and exposes NBA statistics from third-party data providers. All services must be containerized and designed for future deployment to Azure (Azure Static Web Apps or CDN for frontend; Azure Container Apps or AKS for API; optional future services for caching, messaging, and observability). No code is included here—only implementation details and execution steps.

## 1. Requirements & Constraints

- **REQ-001**: Provide a static frontend displaying NBA player/team/game stats.
- **REQ-002**: Backend API service to aggregate data from an external NBA stats provider (e.g., balldontlie.io) and expose simplified, versioned REST endpoints.
- **REQ-003**: Architecture must use microservices: at minimum `frontend` and `api` services, isolated build and deploy pipelines.
- **REQ-004**: All deployable components must run in containers (OCI compliant).
- **REQ-005**: Use environment-based configuration (dev, staging, prod) via `.env` files and Azure environment variables.
- **REQ-006**: Implement versioned API endpoints (e.g., `/v1/players`, `/v1/teams`).
- **REQ-007**: Include basic health and readiness endpoints (`/health`, `/ready`).
- **REQ-008**: Provide rate limiting strategy placeholder (token bucket design doc) for future implementation.
- **REQ-009**: Support local development with `docker compose` orchestration.
- **REQ-010**: Logging must be structured (JSON) to ease ingestion by Azure Monitor / Application Insights.
- **REQ-011**: Caching layer defined (Phase 2) to reduce third-party API calls (in-memory first; later Redis/Azure Cache for Redis optional).
- **REQ-012**: API error model standardized (fields: `timestamp`, `status`, `error`, `message`, `path`, `traceId`).
- **REQ-013**: Observability placeholders (OpenTelemetry instrumentation ready hooks) without full implementation in Phase 1.
- **REQ-014**: Frontend must call backend API only via relative base path configurable per environment.
- **REQ-015**: Provide Infrastructure as Code (IaC) blueprint (Bicep or Terraform) skeleton in `infra/`.
- **REQ-016**: Container images tagged with semantic version + git SHA (e.g., `api:1.0.0-<shortsha>`).
- **REQ-017**: CI/CD defined (GitHub Actions workflow placeholders) for build, test, scan, and push to registry.

- **SEC-001**: No secrets committed—use environment variables and GitHub/Azure Key Vault later.
- **SEC-002**: Implement CORS policy restricting allowed origins per environment.
- **SEC-003**: Input validation for query/path parameters (numeric ranges, string length constraints).
- **SEC-004**: HTTPS enforced in production (Azure front door / Static Web Apps / ingress controller).

- **PER-001**: API must respond < 500ms P95 for cached player list (local baseline).
- **PER-002**: Third-party API requests batched where supported to minimize latency.

- **CON-001**: External NBA data API has rate limits; must design caching and backoff.
- **CON-002**: Project currently minimal; no existing code—plan must create all directories.
- **CON-003**: Must remain language/framework agnostic until locked (chosen: Node.js + Express for API, static frontend using React + Vite).

- **GUD-001**: Favor small, single-purpose services—avoid premature splitting.
- **GUD-002**: Keep Dockerfiles minimal; use multi-stage builds.
- **GUD-003**: Prefer explicit interface contracts (OpenAPI spec) early.

- **PAT-001**: Use adapter pattern for external NBA API provider integration.
- **PAT-002**: Use repository/service layering in API for testability.
- **PAT-003**: Use centralized error handler middleware.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Establish base repository structure, define service boundaries, containerization, API contract skeleton, frontend scaffolding, local orchestration, and CI placeholders.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Create directory structure: `/frontend`, `/services/api`, `/infra`, `/docs`, `/scripts`, `/tests` |  |  |
| TASK-002 | Define API OpenAPI spec stub in `/services/api/openapi/v1.yml` (endpoints: players, teams, games, health) |  |  |
| TASK-003 | Create API configuration spec file `/services/api/config/schema.json` with required env vars (PORT, LOG_LEVEL, CACHE_TTL_SECONDS) |  |  |
| TASK-004 | Draft Dockerfile for API `/services/api/Dockerfile` (multi-stage: build -> runtime, node:20-alpine) |  |  |
| TASK-005 | Draft Dockerfile for frontend `/frontend/Dockerfile` (multi-stage: build static -> nginx or node serve) |  |  |
| TASK-006 | Create `docker-compose.yml` at root to orchestrate `frontend` and `api` with network bridge and environment injection |  |  |
| TASK-007 | Create `.env.example` with placeholders for local dev |  |  |
| TASK-008 | Implement logging conventions doc `/docs/logging.md` (JSON structure, fields) |  |  |
| TASK-009 | Define error model doc `/docs/error-model.md` |  |  |
| TASK-010 | Create GitHub Actions workflow stub `/scripts/ci/build.yml` (jobs: lint, test, build, push-image) |  |  |
| TASK-011 | Add README architecture section describing microservices and data flow |  |  |
| TASK-012 | Add rate limiting design stub `/docs/rate-limiting.md` (token bucket spec, config params) |  |  |
| TASK-013 | Frontend architecture doc `/frontend/ARCHITECTURE.md` (React components structure, data fetch strategy, env config) |  |  |
| TASK-014 | API architecture doc `/services/api/ARCHITECTURE.md` (layers: controller, service, adapter, model, cache) |  |  |
| TASK-015 | Create placeholder cache interface `/services/api/src/cache/ICache.ts` (methods: get, set, delete) |  |  |
| TASK-016 | Health/readiness endpoint spec `/services/api/docs/health.md` |  |  |
| TASK-017 | Define tracing integration plan `/docs/observability.md` (OpenTelemetry hooks) |  |  |
| TASK-018 | Define naming/tagging conventions `/docs/container-tags.md` |  |  |
| TASK-019 | Security checklist `/docs/security-checklist.md` (CORS, secrets, dependencies scan) |  |  |
| TASK-020 | Establish versioning policy `/docs/versioning.md` (SemVer + API version path strategy) |  |  |

### Implementation Phase 2

- GOAL-002: Introduce caching, add test coverage, implement resilience (retry/backoff), Azure deployment scaffolding (IaC), observability hooks, and production configuration strategy.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-021 | Implement in-memory cache in `/services/api/src/cache/InMemoryCache.ts` with TTL management |  |  |
| TASK-022 | Add external API adapter `/services/api/src/adapters/NbaProvider.ts` with abstraction to swap providers |  |  |
| TASK-023 | Add retry + exponential backoff utility `/services/api/src/utils/retry.ts` |  |  |
| TASK-024 | Implement structured logger wrapper `/services/api/src/logger/index.ts` |  |  |
| TASK-025 | Create initial tests (unit) under `/tests/api/` for cache, adapter, error handler |  |  |
| TASK-026 | Create frontend API client module `/frontend/src/lib/apiClient.ts` with typed methods |  |  |
| TASK-027 | Add integration test harness using `docker compose` in `/tests/integration/compose.test.yml` |  |  |
| TASK-028 | Add OpenTelemetry instrumentation placeholders `/services/api/src/telemetry/otel.ts` |  |  |
| TASK-029 | Implement standardized error handler `/services/api/src/middleware/errorHandler.ts` |  |  |
| TASK-030 | Add rate limiting middleware stub `/services/api/src/middleware/rateLimit.ts` |  |  |
| TASK-031 | Create IaC skeleton `/infra/bicep/main.bicep` (resources: Container Registry, Container App Environment, Static Web App placeholder) |  |  |
| TASK-032 | Provision Azure monitor integration config stub `/infra/monitor/README.md` |  |  |
| TASK-033 | Add deployment workflow stub `/scripts/ci/deploy.yml` (env matrix: staging, prod) |  |  |
| TASK-034 | Define environment config mapping `/docs/env-config.md` (dev/staging/prod variables) |  |  |
| TASK-035 | Add load test script `/scripts/perf/loadtest.sh` (k6 or autocannon spec) |  |  |
| TASK-036 | Add API contract test `/tests/api/contract/openapi.test.ts` verifying spec alignment |  |  |
| TASK-037 | Introduce linting + formatting config `/services/api/.eslintrc.json` and `/frontend/.eslintrc.json` |  |  |
| TASK-038 | Implement CORS config module `/services/api/src/middleware/cors.ts` |  |  |
| TASK-039 | Add container security scan job (Trivy) to build workflow |  |  |
| TASK-040 | Document operational runbook `/docs/runbook.md` (common issues, restart steps) |  |  |

## 3. Alternatives

- **ALT-001**: Monolithic single container (simpler, rejected due to future scaling and separation of concerns).
- **ALT-002**: Pure serverless (Functions only) initial build (rejected to maintain portability and consistent local dev experience with containers).
- **ALT-003**: Use GraphQL instead of REST (rejected initially; adds complexity; REST sufficient for early feature set).
- **ALT-004**: Use Python FastAPI for backend (rejected for initial phase due to team familiarity assumption with Node.js ecosystem).

## 4. Dependencies

- **DEP-001**: Node.js (>= 20.x) runtime for API and frontend build.
- **DEP-002**: React + Vite for frontend static generation.
- **DEP-003**: External NBA data provider (balldontlie.io or similar).
- **DEP-004**: Docker (local) + container registry (Azure Container Registry later).
- **DEP-005**: GitHub Actions (CI/CD workflows).
- **DEP-006**: OpenAPI tooling (e.g., `swagger-cli` or `redocly`) for contract validation.
- **DEP-007**: Trivy (container vulnerability scanning).
- **DEP-008**: OpenTelemetry libraries (future instrumentation).

## 5. Files

- **FILE-001**: `/services/api/openapi/v1.yml` – API contract specification.
- **FILE-002**: `/services/api/Dockerfile` – API container build.
- **FILE-003**: `/frontend/Dockerfile` – Frontend container build.
- **FILE-004**: `/docker-compose.yml` – Local orchestration.
- **FILE-005**: `/infra/bicep/main.bicep` – Azure infrastructure skeleton.
- **FILE-006**: `/docs/error-model.md` – Standard error response shape.
- **FILE-007**: `/docs/logging.md` – JSON logging schema.
- **FILE-008**: `/services/api/src/middleware/errorHandler.ts` – Central error handling logic.
- **FILE-009**: `/frontend/src/lib/apiClient.ts` – Frontend typed API client.
- **FILE-010**: `/services/api/src/cache/InMemoryCache.ts` – Cache implementation.
- **FILE-011**: `/scripts/ci/build.yml` – CI build workflow stub.
- **FILE-012**: `/scripts/ci/deploy.yml` – Deployment workflow stub.

## 6. Testing

- **TEST-001**: Cache unit tests (`/tests/api/cache.test.ts`) verifying TTL expiration and retrieval.
- **TEST-002**: Adapter unit tests (`/tests/api/adapter.test.ts`) mocking external provider responses.
- **TEST-003**: Error handler unit tests (`/tests/api/errorHandler.test.ts`) verifying shape and status codes.
- **TEST-004**: Contract test (`/tests/api/contract/openapi.test.ts`) comparing runtime endpoints to OpenAPI spec.
- **TEST-005**: Frontend API client test (`/tests/frontend/apiClient.test.ts`) mocking fetch and ensuring data transformation.
- **TEST-006**: Integration test (`/tests/integration/api-flow.test.ts`) spinning up containers and validating end-to-end stats fetch.
- **TEST-007**: Performance smoke test (`/tests/perf/smoke.test.ts`) ensuring P95 latency baseline with mock data.
- **TEST-008**: Security header test (`/tests/api/securityHeaders.test.ts`) verifying CORS and basic headers.

## 7. Risks & Assumptions

- **RISK-001**: External API downtime could degrade user experience—mitigation: caching + graceful fallback messages.
- **RISK-002**: Rate limits exceeded—mitigation: implement token bucket + backoff strategy in Phase 2.
- **RISK-003**: Data inconsistency between provider updates—mitigation: timestamp responses and expose `lastUpdated`.
- **RISK-004**: Scope creep adding more microservices prematurely—mitigation: enforce architecture review before new service.
- **RISK-005**: Missing observability early—mitigation: define hooks and add instrumentation gradually.

- **ASSUMPTION-001**: Team prefers Node.js ecosystem (JS/TS) for faster initial delivery.
- **ASSUMPTION-002**: Data volume remains modest initially; in-memory cache acceptable.
- **ASSUMPTION-003**: Azure will be target cloud—designing naming, tagging, and resource layout accordingly.

## 8. Related Specifications / Further Reading

- OpenAPI 3.0 Specification: https://spec.openapis.org/oas/v3.0.3
- Example NBA Data API: https://www.balldontlie.io
- Docker Documentation: https://docs.docker.com/
- Azure Container Apps: https://learn.microsoft.com/azure/container-apps/
- Azure Static Web Apps: https://learn.microsoft.com/azure/static-web-apps/
- OpenTelemetry: https://opentelemetry.io/
- Semantic Versioning: https://semver.org/