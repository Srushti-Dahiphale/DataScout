# DataScout AI

DataScout AI converts plain-English business research requests into clean, source-backed datasets. It shows the parsed intent, proposes a collection workflow, runs the workflow asynchronously, and lets users inspect records with provenance and confidence.

## What is included

- Prompt Studio with mock AI analysis
- Workflow preview and simulated asynchronous execution
- Step-by-step workflow progress and cancellation
- Dashboard metrics and source distribution charts
- Dataset explorer with search, source/confidence filters, and export actions
- History and workspace settings
- Generated OpenAPI client and Zod validation schemas
- Free-tier-friendly mock mode with no paid API keys required

## Local setup

Requirements: Node.js 20+ and pnpm 9+.

```bash
git clone <your-repository-url>
cd datascout-ai
pnpm install
cp .env.example .env
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck
```

Start the services in separate terminals:

```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/datascout-ai run dev
```

The Replit workflows start both services with the correct proxy paths automatically.

## Environment

The core demo works in mock mode without any AI or crawler credentials. See `.env.example` for optional integrations:

- `AI_MODE=mock` — default, deterministic local parser
- `HUGGINGFACE_API_KEY` — optional free-tier inference
- `OLLAMA_BASE_URL` — optional local Ollama server
- `DATABASE_URL` — optional PostgreSQL connection for a persistent deployment
- `REDIS_URL` — optional Redis connection for BullMQ workers
- `SESSION_SECRET` — required when adding authentication/session persistence

## API and migrations

The API contract lives in `lib/api-spec/openapi.yaml`. Regenerate the typed client after every spec change:

```bash
pnpm --filter @workspace/api-spec run codegen
```

The workspace includes a Drizzle/PostgreSQL package for the persistence layer. When persistence is enabled, apply the schema with:

```bash
pnpm --filter @workspace/db run push
```

The current demo intentionally seeds deterministic records in memory so it can be cloned and run without a database. This keeps the first-run experience free and fast; the route contracts do not change when the store is moved to PostgreSQL.

## Tests and checks

```bash
pnpm run typecheck
pnpm --filter @workspace/datascout-ai run build
```

## Free-tier deployment

### Vercel frontend

1. Import the repository into Vercel.
2. Set the root directory to `artifacts/datascout-ai`.
3. Build with `pnpm run build`.
4. Set the API base path to the deployed API route or keep the frontend and API behind the same proxy.

### Render API

1. Create a free web service from the repository.
2. Build command: `pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build`.
3. Start command: `pnpm --filter @workspace/api-server run start`.
4. Set `PORT`, `NODE_ENV=production`, and `CORS_ORIGIN`.

### Supabase or Neon

Create a free PostgreSQL project, set `DATABASE_URL`, then run the Drizzle push command above. Use the provider's pooled connection string for serverless deployments.

### Upstash Redis

Create a free Redis database, set `REDIS_URL`, and use it for BullMQ workers when moving workflow execution from the local simulator to a background worker.

## Repository contents

```text
artifacts/datascout-ai/    React web app
artifacts/api-server/      Express API
lib/api-spec/              OpenAPI contract
lib/api-client-react/      Generated React Query client
lib/api-zod/               Generated Zod schemas
lib/db/                    Drizzle/PostgreSQL package
```

## License

MIT