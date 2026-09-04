# StudyMate: A Multi-Agent Academic Assistance System

StudyMate is an academic assistance platform for students and administrators at R. C. Patel Institute of Technology, Shirpur. It brings academic resources, aptitude practice, measurable progress, and AI-assisted study support into one workspace.

## What is implemented

### Student experience

- Public landing page and responsive student authentication
- JWT-backed registration and login with server-side password hashing
- Personalized dashboard with score, accuracy, study-hours, activity, and subject signals
- Syllabus, notes, and previous-year paper resource browsing
- Aptitude question bank and timed test interface
- Server-side grading with correct answers hidden until submission
- Attempt history and strong/weak topic analysis
- AI study planner, AI doubt solver, and AI test generation endpoints
- Project ideas, book recommendations, personalized recommendations, and notifications
- Progress and profile views

### Administrator experience

- Separate administrator login and role protection
- Dashboard metrics for students, resources, questions, tests, attempts, and average score
- Student directory
- Test-results table
- Seeded academic content suitable for a faculty demonstration

## Architecture

This Replit workspace uses the existing monorepo services so the app can run through Replit's managed preview and deployment routing:

- `artifacts/studymate` — React + Vite frontend with Wouter routing, Tailwind CSS, Recharts, Lucide icons, and generated React Query hooks.
- `artifacts/api-server` — modular Express REST API. The API is separated into auth, seed/data, and route modules and uses the shared workspace database.
- `lib/api-spec/openapi.yaml` — API contract source of truth.
- `lib/api-client-react` and `lib/api-zod` — generated client hooks and validation schemas.
- `lib/db/src/schema/studymate.ts` — persistent StudyMate tables.

The current runtime adapter is PostgreSQL + Express because those services are provisioned in this workspace. The data layer is isolated in the API server and database package so a Flask/MongoDB deployment adapter can be added later without changing the frontend contract.

## Environment variables

Copy `.env.example` when running outside Replit.

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Server-only Gemini key for AI agents |
| `JWT_SECRET_KEY` | Optional JWT signing secret; `SESSION_SECRET` is used when omitted |
| `ADMIN_EMAIL` | Optional admin seed email |
| `ADMIN_PASSWORD` | Optional admin seed password |
| `DATABASE_URL` | PostgreSQL connection string; supplied by Replit |

Never put `GEMINI_API_KEY` in frontend code or commit a populated `.env` file.

## Run the project

```bash
pnpm install
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-spec run codegen
```

The managed workflows run the app:

```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/studymate run dev
```

Use the Replit preview for the frontend. The API is available under `/api`.

## Admin setup

For a first administrator, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` as server environment variables before restarting the API. The seed process creates the admin only when both values are present; no credentials are hard-coded.

## Demo flow

1. Open the StudyMate landing page.
2. Create a student account from **Join StudyMate**.
3. Open **Aptitude lab** and choose a test.
4. Submit answers and review the calculated score, accuracy, and weak topics.
5. Open **Study planner**, **Doubt solver**, or **Generate a test**. These call Gemini only on the server.
6. Configure an admin account, open **Admin**, and review student and result data.
7. Browse **Syllabus**, **Notes**, **Question papers**, **Project shelf**, and **Reading list**.

## API overview

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/admin-login`
- `GET /api/auth/me`

### Student

- `GET /api/dashboard`
- `GET /api/syllabus`
- `GET /api/notes`
- `GET /api/question-papers`
- `GET /api/aptitude/questions`
- `GET /api/tests`
- `POST /api/tests/:id/submit`
- `GET /api/attempts`
- `GET /api/recommendations`
- `GET /api/notifications`

### AI

- `POST /api/ai/study-plan`
- `POST /api/ai/doubt`
- `POST /api/ai/generate-test`

The AI endpoints pass selected academic resource context into the model. If Gemini is unavailable, they return a clear service error rather than pretending that an answer was generated.

### Discovery

- `GET /api/projects`
- `GET /api/books`

### Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/students`
- `GET /api/admin/test-results`

All protected endpoints expect `Authorization: Bearer <token>`. Admin endpoints additionally verify `role = admin`.

## Database

The database schema currently includes:

- `studymate_users`
- `studymate_resources`
- `studymate_aptitude_questions`
- `studymate_tests`
- `studymate_attempts`
- `studymate_study_plans`
- `studymate_doubts`
- `studymate_projects`
- `studymate_books`
- `studymate_notifications`

The API seeds clearly labeled demonstration content on first start. It is intentionally replaceable with institute-owned uploads and catalog data.

## Verification

```bash
pnpm run typecheck
curl http://localhost:80/api/healthz
```

The API uses actual database reads/writes for registration, attempts, AI history, and seeded content. The frontend consumes the generated API client rather than hard-coded route mocks.

## Troubleshooting

- **Empty dashboard:** sign in as a student first; protected student queries are disabled until a token exists.
- **Admin access denied:** set both `ADMIN_EMAIL` and `ADMIN_PASSWORD`, restart the API workflow, then sign in through `/admin/login`.
- **AI unavailable:** verify the server-only `GEMINI_API_KEY` secret and restart the API workflow. AI features fail explicitly when the key or provider is unavailable.
- **Stale generated hooks:** rerun `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.
- **Preview blank:** restart `artifacts/studymate: web` and inspect the workflow/browser logs.