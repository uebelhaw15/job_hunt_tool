# Changelog

## [Unreleased]

### Added

**Database**
- Schema: `Job`, `JobDescription`, `Question`, `Category`, `PracticeSession`, `PracticeAttempt`, `ApiUsage` models
- SQLite via Prisma ORM; migration applied (`init_full_schema`)
- Default categories seeded on startup: Behavioral, Technical, System Design, Role-Specific

**API (Fastify)**
- `GET/POST/PUT/DELETE /jobs` — full job CRUD
- `POST /jobs/:id/description` — upsert job description
- `GET /questions` — list with `?jobId=` and `?bank=true` filters
- `POST/PUT/DELETE /questions` — question CRUD
- `POST /questions/:id/copy-to-job` — duplicate bank question to a job
- `GET/POST/DELETE /categories` — user-managed question categories
- `POST /practice/sessions` — create practice session (optional job link)
- `GET /practice/sessions` + `GET /practice/sessions/:id` — list and detail
- `POST /practice/sessions/:id/generate` — AI generates role-specific questions via Claude API
- `POST /practice/attempts` — submit answer, receive AI score + feedback
- `PUT /practice/attempts/:id/notes` — save self-reflection notes
- `GET /api-usage/summary` — monthly + all-time token cost totals

**AI Integration**
- Claude Haiku via `@anthropic-ai/sdk`; all calls routed through `callClaude()` helper
- Every API call logs `inputTokens`, `outputTokens`, `costUsd` to `ApiUsage` table
- AI scoring returns: per-dimension scores (clarity, specificity, relevance, structure), letter grade, feedback, improvement notes

**Frontend (React + Tailwind)**
- Sidebar layout with persistent API cost display (monthly + all-time)
- **Jobs page** — list with status badges, add/edit/delete via modal
- **Job detail page** — metadata, job description editor, questions list
- **Question bank page** — global questions (jobId = null), category filter pills, copy-to-job
- **Practice page** — session list, create session (tied to job or freeform)
- **Practice session page** — generate AI questions, submit answers, view scored results with grade + dimension bars + AI feedback + self-notes, attempt history per question
- **Settings page** — add/remove question categories

### Changed
- `api/package.json` — added `"type": "module"` for ESM + top-level await support
- `api/tsconfig.json` — module set to `NodeNext`
- `web/tsconfig.app.json` — added `@/*` path alias
- `web/vite.config.ts` — added `@tailwindcss/vite` plugin + `@` alias

### Fixed
- All API write endpoints destructure only known fields (no raw body passthrough to Prisma)
- `ANTHROPIC_API_KEY` validated at startup — process exits immediately if missing
- `JSON.parse` on attempt scores replaced with `safeJsonParse<T>()` — no crash on malformed data
- All frontend API calls wrapped in try/catch with toast error notifications
- "Copy to job" button moved into `QuestionCard` component (was fragile absolute-positioned overlay)
- `console.log` replaced with `app.log.info` throughout API

### Security
- API key kept server-side only — never exposed to frontend
- Prisma ORM used throughout — no raw SQL
