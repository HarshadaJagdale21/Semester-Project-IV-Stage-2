# StudyMate

StudyMate is a full-stack academic assistance platform for RCPIT students with resource discovery, aptitude testing, progress analytics, and server-side AI study support.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/studymate/src/App.tsx` — student/admin routes and responsive interface
- `artifacts/studymate/src/index.css` — StudyMate theme tokens and shared visual primitives
- `artifacts/api-server/src/routes/studymate.ts` — authenticated REST routes and AI agent endpoints
- `artifacts/api-server/src/lib/seed.ts` — replaceable demonstration data and admin seeding
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/db/src/schema/studymate.ts` — persistent database schema

## Architecture decisions

- The frontend uses the generated API client so API shapes stay synchronized with OpenAPI.
- The API signs short-lived bearer tokens server-side and hashes passwords with Node's built-in scrypt.
- Correct aptitude answers are only read by the submit endpoint and are never returned by the test-list endpoint.
- AI routes send selected academic resource context to Gemini and fail explicitly when the provider is not configured.
- Demonstration content is seeded separately from the route logic so institute-owned resources can replace it.

## Product

Students can register, explore academic resources, practice aptitude, submit timed tests, review performance, generate study plans, ask grounded doubts, and discover project and book recommendations. Administrators get protected dashboards for students, resources, and test outcomes.

## User preferences

- Keep API changes in `lib/api-spec/openapi.yaml` and run codegen after each change.
- Keep server secrets in Replit Secrets; never put Gemini credentials in frontend code.

## Gotchas

- Use `pnpm run typecheck` after backend or API contract changes.
- The managed API server owns `/api`; the StudyMate web artifact owns `/`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
