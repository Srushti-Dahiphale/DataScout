# DataScout AI

DataScout AI turns natural-language business research requests into traceable, source-backed datasets.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/datascout-ai run dev` — run the web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 with the shared `/api` service
- Frontend: React + Vite + Tailwind CSS + TanStack Query
- Contracts: OpenAPI, Orval-generated React Query hooks and Zod schemas
- Data layer: Drizzle/PostgreSQL-ready shared package; the demo API uses seeded in-memory data so it starts without credentials

## Where things live

- `artifacts/datascout-ai/` — frontend dashboard and route views
- `artifacts/api-server/src/routes/datascout.ts` — DataScout API endpoints
- `artifacts/api-server/src/lib/datascout-store.ts` — deterministic demo dataset and workflow simulator
- `lib/api-spec/openapi.yaml` — API source of truth
- `lib/api-client-react/src/generated/` — generated client hooks
- `lib/api-zod/src/generated/` — generated server validation schemas

## Architecture decisions

- The first build runs in mock mode by default so a user can explore the full product without an API key or paid service.
- The API contract is OpenAPI-first; the frontend consumes generated hooks rather than hand-written request types.
- Workflow execution is simulated asynchronously in the API so progress, cancellation, step statuses, and logs can be exercised locally.
- Every sample record includes a source URL, retrieval time, confidence score, and validation state.

## Product

The dashboard covers prompt analysis, workflow execution, dataset exploration, export requests, history, and settings. The seed data demonstrates a 100-record SaaS dataset and an in-progress workflow.

## Gotchas

- Run codegen after changing `lib/api-spec/openapi.yaml`.
- The web and API services are managed workflows; use the workflow restart action instead of starting duplicate servers.
- The generated Zod barrel intentionally avoids re-exporting the query-parameter type that collides with Orval's runtime schema name.