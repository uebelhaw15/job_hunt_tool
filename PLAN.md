# Feature Implementation Plan

**Overall Progress:** `100%` ✅ Reviewed · Documented

---

## TLDR
Building a full job hunt tool with two core pillars: (1) a structured repository for jobs, job descriptions, and interview questions with CRUD management, and (2) an AI-powered practice engine that generates role-specific questions, scores attempts across multiple dimensions, and tracks improvement over time. API usage costs are tracked and displayed persistently in the UI.

---

## Critical Decisions

- **AI Provider**: Anthropic Claude API via `@anthropic-ai/sdk` — stored as `ANTHROPIC_API_KEY` in `api/.env`
- **AI calls via backend only**: Frontend never calls Anthropic directly — all AI requests go through the Fastify API to centralize token tracking
- **Copy-to-job = duplicate**: Copying a bank question to a job creates a new record (`jobId` set) — no FK tracing in MVP
- **AI-generated questions flagged**: `aiGenerated: true` on Question model; user can optionally save them to the bank
- **Practice scoring**: Stored as JSON (multiple dimensions + letter grade) in `PracticeAttempt.score`
- **Categories are DB-managed**: Stored in a `Category` table, seeded with defaults, user-manageable via UI
- **Job statuses**: `Considering`, `Applied`, `Phone Screen`, `Interview`, `Offer`, `Rejected`, `Passed`
- **Cost tracking**: Monthly + all-time totals derived from `ApiUsage` table, displayed persistently in UI header

---

## Tasks

- [x] 🟩 **Step 1: Schema & Database**
  - [x] 🟩 Update `Job.status` comment to reflect agreed status values
  - [x] 🟩 Add `aiGenerated Boolean @default(false)` to `Question` model
  - [x] 🟩 Add `Category` model (`id`, `name`, `createdAt`)
  - [x] 🟩 Remove hardcoded category comment from `Question.category` — reference Category by name (string FK kept as string for flexibility)
  - [x] 🟩 Add `PracticeSession` model (`id`, `jobId?`, `title`, `createdAt`)
  - [x] 🟩 Add `PracticeAttempt` model (`id`, `sessionId`, `questionId`, `answer`, `score` as JSON string, `aiFeedback`, `userNotes?`, `createdAt`)
  - [x] 🟩 Add `ApiUsage` model (`id`, `endpoint`, `inputTokens`, `outputTokens`, `costUsd`, `createdAt`)
  - [x] 🟩 Run `prisma migrate dev`

- [x] 🟩 **Step 2: Backend — Job & Question CRUD**
  - [x] 🟩 `GET /jobs` — list all jobs
  - [x] 🟩 `GET /jobs/:id` — single job with description + questions
  - [x] 🟩 `POST /jobs` — create job
  - [x] 🟩 `PUT /jobs/:id` — update job
  - [x] 🟩 `DELETE /jobs/:id` — delete job
  - [x] 🟩 `POST /jobs/:id/description` — upsert job description
  - [x] 🟩 `GET /questions` — list all questions (supports `?jobId=` and `?bank=true` filters)
  - [x] 🟩 `POST /questions` — create question
  - [x] 🟩 `PUT /questions/:id` — update question
  - [x] 🟩 `DELETE /questions/:id` — delete question
  - [x] 🟩 `POST /questions/:id/copy-to-job` — duplicate question with target `jobId`

- [x] 🟩 **Step 3: Backend — Category Management**
  - [x] 🟩 Seed default categories: `Behavioral`, `Technical`, `System Design`, `Role-Specific`
  - [x] 🟩 `GET /categories` — list all categories
  - [x] 🟩 `POST /categories` — add new category
  - [x] 🟩 `DELETE /categories/:id` — remove category

- [x] 🟩 **Step 4: Backend — AI Practice Engine**
  - [x] 🟩 Create Anthropic SDK helper with built-in token usage logger (writes to `ApiUsage` on every call)
  - [x] 🟩 `POST /practice/sessions` — create session (optional `jobId`, required `title`)
  - [x] 🟩 `GET /practice/sessions` — list all sessions
  - [x] 🟩 `GET /practice/sessions/:id` — session detail with attempts
  - [x] 🟩 `POST /practice/sessions/:id/generate` — AI generates practice questions based on role; saves to session and optionally to question bank
  - [x] 🟩 `POST /practice/attempts` — submit answer; AI scores + provides feedback; stores result

- [x] 🟩 **Step 5: Backend — API Cost Tracking**
  - [x] 🟩 `GET /api-usage/summary` — returns `{ monthly: { inputTokens, outputTokens, costUsd }, allTime: { ... } }`

- [x] 🟩 **Step 6: Frontend Setup**
  - [x] 🟩 Install and configure TailwindCSS
  - [x] 🟩 Install and configure shadcn/ui
  - [x] 🟩 Install `react-router-dom`
  - [x] 🟩 Scaffold route structure: `/`, `/jobs/:id`, `/bank`, `/practice`, `/practice/:sessionId`, `/settings`

- [x] 🟩 **Step 7: Frontend — App Shell & Cost Display**
  - [x] 🟩 Persistent sidebar or top nav with route links
  - [x] 🟩 Cost display component — polls `/api-usage/summary`, shows monthly + all-time cost

- [x] 🟩 **Step 8: Frontend — Job Repository**
  - [x] 🟩 Job list page — table/card list with status badges, link to detail
  - [x] 🟩 Add/edit job modal with all fields + status dropdown
  - [x] 🟩 Job detail page — metadata, job description editor, questions list

- [x] 🟩 **Step 9: Frontend — Question Management**
  - [x] 🟩 Question bank page — flat list of all bank questions, add/edit/delete
  - [x] 🟩 Questions tab on job detail — job-specific questions, add/edit/delete
  - [x] 🟩 Copy from bank to job UI — select target job, confirm, duplicate
  - [x] 🟩 Add/edit question form — category dropdown (from `/categories`), question, answer, notes

- [x] 🟩 **Step 10: Frontend — Practice**
  - [x] 🟩 Practice sessions list — create new session (with optional job link + title)
  - [x] 🟩 Session view — shows AI-generated questions, allows starting an attempt on any
  - [x] 🟩 Attempt UI — text area for answer, submit to AI, display multi-dimension scores + letter grade + AI feedback
  - [x] 🟩 Self-notes field — editable after AI feedback is shown
  - [x] 🟩 Attempt history per question — list of past attempts with scores

- [x] 🟩 **Step 11: Frontend — Category Management**
  - [x] 🟩 Settings page — list current categories, add new, delete existing
