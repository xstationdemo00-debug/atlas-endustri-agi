# Atlas Endüstri Ağı — Base44 Bağımsızlaştırma / Pilot 0.1

This is a **new independent pilot**, not the finished migration of the 238-file Base44 application. It implements the public services page and a first-contact form in a self-hosted Python/FastAPI backend and plain HTML/CSS/JavaScript frontend. No Base44 SDK or Base44 hosted API is used. The company/worker/project/offer dashboard is **not yet ported**.

## Status and safe handling
- Original live Base44 site is unchanged; Atlas Earth is untouched.
- Neon project: `wispy-term-01261231` (separate `production` branch). Read-only access is currently confirmed; schema migrations and POST inquiry storage against Neon have **not** been executed or tested.
- No account credentials or connection string are included in this package.
- No charge should be incurred; Render's free plan and Neon free limits must be checked before creating a service.
- The form **returns 503** if DATABASE_URL is absent or the database cannot write. That is intentional and prevents lost submissions.
- Privacy/KVKK final disclosure, data controller, retention period, DPA, mail notification, bot protection, backups, security tests and legal invoicing must be finalized before real customer use. Local rate limiting is not sufficient for multi-instance production.

## Build and tests
```
npm run build
ATLAS_DEV_SQLITE=1 python -m pytest -q tests/
ATLAS_DEV_SQLITE=1 uvicorn backend.app:app --host 127.0.0.1 --port 8765
```
Go to http://localhost:8765/ilk-hizmet for local inspection. SQLite storage is only for local testing, not production; no SQLite production data should be trusted.

## Next deployment steps (not yet executed)
1. Create a **new private** GitHub repo for Atlas Endüstri Ağı (never reuse the Atlas Earth repository).
2. Push the files from this directory. Do not commit `.env`, DB URLs, API keys or test data.
3. In Neon project `wispy-term-01261231` on branch `production`, grant a scoped write role, run `sql/001_public_inquiries.sql` after reviewing it, and create separate `DATABASE_URL` (pooled SSL connection string) for the server. Keep secret values in Render's environment variables only.
4. Deploy the web service to Render using `render.yaml` and `plan: free`, after confirming the pricing/usage policy. Render must serve the API and site from the same origin. Check `GET /api/health` reports `database: ready`.
5. Submit a **test inquiry**, confirm its row in Neon using an authenticated server-side query, and verify no public query/list endpoint exists. Only then switch public traffic.
6. Create a separate migration plan for the original 32 Base44 entity types and user accounts. Source ID mapping, RLS, auth/password migration, sensitive documents and legal data obligations need a tested design. Never claim these are transferred already.

## Migration references
- Original Base44 app: `6ae8583432c3a0d63a7b7938`.
- Original Base44 source snapshot: 237 of 238 source files separately exported; `src/pages/CommercialServices.jsx` exceeded the connector transfer limit.
- Stage-only SQL from the earlier preparation package can preserve unnormalized entity records as JSONB until a reviewed schema migration is ready.

## Phase 2: private network interest & curated project board

- `POST /api/network-interest`: **non-account** private interest submission for worker, team or company; stored with `pending` status; limited fields, required consent; no public contact directory.
- `GET /api/projects`: only returns public-safe fields for entries with `approval_status='approved'`, `public_visible=true`, and `is_demo=false`.
- `sql/002_network_interest_and_projects.sql`: additive Neon schema, indexes and least-privilege grants. Apply to the **Atlas Endüstri Ağı** Neon project only; never Atlas Earth.
- The web DB role may INSERT private interest records and SELECT approved project summaries, **but cannot publish project records**.
- Worker/company forms are **interest expressions, not verified user accounts, legally binding employment placements, or guaranteed jobs**. No fees are charged to workers. Complete data-controller privacy notice and legal compliance review remain prerequisites for broader commercial launch.
