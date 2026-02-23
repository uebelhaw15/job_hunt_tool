# Architecture Documentation Task

Update `ARCHITECTURE.md` to reflect the current system design.

## When to Run

- After the **exploration phase**, before creating a plan (for new features)
- After any **significant structural change** (new module, schema change, new integration)
- On demand: `/architecture`

## What to Document

Read the actual code — never assume. Cover:

### 1. System Overview
- What the app does and who uses it (one paragraph)
- Single-user vs multi-tenant; auth model
- Deployment model (local, hosted, etc.)

### 2. Module Map
For each top-level directory/module:
- **Purpose** — what does it own?
- **Key files** — which files matter most and why
- **Boundaries** — what does it depend on? What depends on it?

### 3. Data Model Decisions
- Why this database? (SQLite vs Postgres vs other)
- Key schema choices and the reasoning
- What's stored as JSON vs normalized columns, and why

### 4. API Design Rationale
- Route structure and naming conventions
- How AI calls are handled (helper pattern, logging, model choice)
- Error handling strategy

### 5. Frontend Architecture
- Component hierarchy (pages vs shared components vs UI primitives)
- State management approach and why
- How the API client is structured

### 6. Key Architectural Decisions (ADRs)
For each significant decision, capture:
```
**Decision**: [What was decided]
**Why**: [Rationale — constraints, tradeoffs considered]
**Alternatives rejected**: [What else was considered and why it lost]
```

## Style Rules

✅ Accurate — read code, don't guess
✅ Concise — bullets over paragraphs
✅ Decision-focused — explain *why*, not just *what*
✅ Living document — update when decisions change

❌ No enterprise fluff
❌ No aspirational design (document what exists, not what's planned)
❌ No duplication of CHANGELOG.md (decisions, not changes)

## Output

Write to `ARCHITECTURE.md` at project root. If the file exists, update only the sections affected by recent changes — don't rewrite everything.

**Always** append a new row to the `## Revision History` table at the bottom with today's date and a one-line summary of what changed. This makes the document's evolution readable without digging through git log.
