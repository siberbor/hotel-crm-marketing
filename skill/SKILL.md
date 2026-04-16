---
name: hotel-crm-sprint
description: |
  Skill for executing sprint tasks on the Hotel CRM Marketing system. Use this skill whenever
  working on any task from the hotel CRM project — implementing features, running tests, updating
  documentation, or reviewing code. This skill MUST be used even if the user says "just code X"
  or "quickly add Y" — the protocol ensures session memory and prevents regressions across 
  agents (Claude Code, Qwen Code, OpenCode, GPT-4o via operator). Triggers on: any mention of
  hotel CRM tasks, sprint work, guest module, bookings, campaigns, T01–T18, or when the user
  says "start working on [feature]" in the context of this project.
compatibility:
  tools: [bash, read_file, write_file, str_replace]
  agents: [claude-code, qwen-code, opencode, gpt-4o-operator]
---

# Hotel CRM Sprint Skill

A protocol for executing sprint tasks consistently across multiple AI agents and sessions.

---

## Step 0 — Session Start (Always First)

Before writing a single line of code, run this checklist:

```
1. READ  AGENTS.md                            (project context, rules, stack)
2. READ  docs/sprints/current-sprint.md       (what sprint are we in, what's active)
3. READ  docs/sprints/session-log.md          (last 10 lines — what happened before)
4. READ  docs/decisions/README.md             (any recent arch decisions)
5. IDENTIFY which task (T01–T18) you're working on
6. VERIFY task is in the current sprint and not already marked Done
```

If any of these files don't exist yet, create them using the templates in this skill.

---

## Step 1 — Task Analysis

For the assigned task, extract:

- **Task ID** (T01–T18)
- **Branch name** from sprint-plan.md (`feat/task-id-slug`)
- **Acceptance criteria** — the exact checklist that must pass
- **Affected files** — list from sprint-plan.md
- **Dependencies** — which other tasks must be Done first

If a dependency is not Done → STOP and report to the user. Do not proceed.

**Dependency check example:**
```
Task T07 requires T03 (guests API) to be Done.
Check current-sprint.md → T03 status.
If T03 is In Progress or To Do → stop, report.
```

---

## Step 2 — Plan Before Coding (for tasks touching >3 files)

Write a brief implementation plan (in your response, not to a file) covering:

1. Files to create
2. Files to modify
3. Database changes (if any) — requires human confirmation before applying
4. New dependencies (npm packages) — requires human confirmation before installing

**For tasks touching 1–2 files:** skip the plan, proceed directly.

---

## Step 3 — Implementation Protocol

### File Creation
- Always check if file already exists before creating
- Use the project's existing patterns (read a similar file first)
- Co-locate Zod schemas with their route handlers
- Named exports only (except Next.js pages)

### Database Changes
```
RULE: Never run migrations autonomously.
If task requires schema change:
  1. Write the schema change in src/db/schema.ts
  2. Show the diff to the user
  3. Wait for explicit "run it" before executing npm run db:migrate
```

### API Endpoint Template
```typescript
// src/api/[resource]/[action].ts
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '@/db'
import { checkPermission } from '@/middleware/permissions'

const CreateGuestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
})

export async function registerRoutes(app: FastifyInstance) {
  app.post('/guests', {
    preHandler: [checkPermission('guests', 'create')],
    schema: { body: CreateGuestSchema },
  }, async (request, reply) => {
    // implementation
  })
}
```

### Frontend Component Template
```typescript
// src/components/[ComponentName].tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

interface ComponentNameProps {
  // explicit props, no any
}

export function ComponentName({ }: ComponentNameProps) {
  // implementation
}
```

---

## Step 4 — Testing Requirements

Every completed task must have:

| Task type          | Required tests                           |
|--------------------|------------------------------------------|
| API endpoint       | Supertest: happy path + 401 + 403        |
| Permission logic   | Unit test: all 4 roles × action matrix   |
| Business logic     | Unit tests in `tests/services/`          |
| Frontend component | Not required (manual Storybook check OK) |
| DB migration       | Seed data test after migration           |

**Run tests before marking done:**
```bash
npm run test
npm run test:api
npm run lint:fix
```

All must pass. Zero lint errors. Zero TypeScript errors.

---

## Step 5 — Acceptance Criteria Verification

Go through the task's acceptance checklist (from sprint-plan.md) item by item.
Mark each as ✅ or ❌. If any ❌ remain → do not mark task Done.

Example for T03 (Guests CRUD):
```
✅ REST endpoints /api/v1/guests (GET, POST, PATCH, DELETE)
✅ Search by name/phone/email works
✅ Pagination returns { data, total, page, limit }
❌ Export to CSV — not yet implemented
```

If ❌ items exist: implement them or report to user as "out of scope for this session".

---

## Step 6 — Update Sprint Tracking

After completing a task, update these files:

**docs/sprints/current-sprint.md** — change task status:
```markdown
| T03 | Guest CRUD | ✅ Done | feat/guest-crud | — |
```

**docs/sprints/session-log.md** — append session summary:
```markdown
## Session 2026-XX-XX HH:MM
**Done:** T03 Guest CRUD — all endpoints, search, pagination, tests passing
**Blocked:** Nothing
**Decisions:** Used JSONB for preferences field (flexible schema, hotel-specific data)
**Next:** T05 Dashboard can now use real guest data from API
```

---

## Step 7 — Multi-Agent Handoff

When handing off to another agent (Qwen Code, OpenCode, GPT-4o):

Include this context block at the start of the next prompt:

```
PROJECT: Hotel CRM Marketing system
CONTEXT FILES: Read AGENTS.md, docs/sprints/current-sprint.md, docs/sprints/session-log.md
CURRENT TASK: [T##] [Task title]
BRANCH: feat/[branch-name]
DEPENDENCY STATUS: [T##] Done / [T##] In Progress
LAST SESSION: [one-line summary of what was done]
YOUR JOB: [specific instruction]
```

---

## Step 8 — Sprint Transition

When all tasks in current sprint are Done:

1. Update `docs/sprints/current-sprint.md` → Status: ✅ Complete
2. Create new `docs/sprints/sprint-N-retrospective.md` with:
   - What went well
   - What was blocked and why
   - Architecture decisions made
3. Update `current-sprint.md` with next sprint's tasks from `sprint-plan.md`
4. Report to user: "Sprint N complete. Ready for Sprint N+1."

---

## Agent-Specific Notes

### Claude Code
- Uses CLAUDE.md (which imports AGENTS.md via @AGENTS.md)
- Subagents available: `@explore`, `@plan`
- Memory persists via session-log.md

### Qwen Code
- Read AGENTS.md manually at session start (no auto-import)
- Prompt prefix: "Read AGENTS.md first. Then proceed with task."
- No subagent support — keep tasks smaller and more atomic

### OpenCode
- Compatible with AGENTS.md format
- Supports parallel task execution — use for Sprint 4 independent tasks
- Branch isolation via git worktrees recommended

### GPT-4o via Operator
- Send full AGENTS.md content in system prompt (operator injects it)
- Task context must be in user message (no file access)
- Paste relevant file contents directly — no file reading tools
- Useful for: code review, documentation, test writing (lower-risk tasks)

---

## Troubleshooting

**"I don't know the project structure"**
→ Run: `find src -name "*.ts" | head -40` then read AGENTS.md

**"Tests are failing after my changes"**
→ Run `npm run lint:fix` first (many test failures are lint/type errors)
→ Check if you modified a shared type or schema

**"Migration failed"**
→ Never run `db:push` in production — only `db:migrate`
→ Check Drizzle logs, report exact error to user

**"I'm not sure if my change breaks permissions"**
→ Read `src/auth/rbac.ts` and `src/middleware/permissions.ts` first
→ Run the permissions test suite: `npm run test -- permissions`
→ If still unsure, stop and ask the user

**"The feature needs a new npm package"**
→ Check if something in the existing stack already does it
→ Prefer zero new dependencies when possible
→ If needed: show user what package + version, wait for approval

---

## Quick Reference Card

```
Start session  → Read AGENTS.md + current-sprint.md + session-log.md
Pick task      → Verify dependencies Done, create branch feat/T##-slug
Implement      → Follow templates, named exports, co-locate Zod schemas
DB changes     → Write schema diff, WAIT for human approval
Tests          → Supertest for API, unit for services, lint:fix always
Verify         → Check acceptance criteria checklist item by item  
End session    → Update current-sprint.md + append to session-log.md
Handoff        → Include context block for next agent
Sprint done    → Retrospective → create new current-sprint.md
```
