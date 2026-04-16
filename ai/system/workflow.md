# Workflow — AI Execution Pipeline

## Pipeline Stages

```
┌─────────┐     ┌──────────────┐     ┌──────────────┐     ┌────┐     ┌────────┐     ┌────────┐
│  KANBAN │ ──► │   PLANNER    │ ──► │  WORKERS     │ ──► │ QA │ ──► │ REVIEW │ ──► │ MEMORY │
│  (task) │     │  (split)     │     │  (parallel)  │     │    │     │        │     │  + KB  │
└─────────┘     └──────────────┘     └──────────────┘     └────┘     └────────┘     └────────┘
```

## Stage 1 — Load Task

1. Read ai/kanban/index.json
2. Find first task with status "todo"
3. Verify dependencies are "done"
4. If deps not met → STOP, report to human

## Stage 2 — Planner

Input: task from kanban
Output: subtasks with execution order

Actions:
- Read task details from ai/kanban/tasks/{id}.md
- Split into: backend, frontend, db, tests
- Identify parallelizable work
- Define dependencies between subtasks

## Stage 3 — Worker Agents (Parallel)

### Backend Agent
- Check existing code (grep, glob)
- Write/extend API + services
- Add Zod validation
- Follow RBAC rules

### Frontend Agent
- Use existing UI components (src/components/ui)
- Build pages + API integration
- Use React Query for data fetching
- No inline styles

Both agents run in parallel when no coupling.

## Stage 4 — QA

Input: outputs from backend + frontend
Actions:
- Write tests (Vitest/Supertest)
- Test happy path + edge cases
- Verify acceptance criteria
- Check RBAC violations

Checklist:
- [ ] Happy path
- [ ] Edge cases
- [ ] Error handling
- [ ] RBAC violations
- [ ] All acceptance criteria met

Output: test results + bugs found

## Stage 5 — Review

Input: code changes + QA results
Actions:
- Check architecture consistency
- Review security (RBAC, auth)
- Check performance
- Check code duplication

Verdict: APPROVED | CHANGES_REQUIRED

If CHANGES_REQUIRED → loop back to appropriate agent

## Stage 6 — Memory + Kanban Update

Actions:
1. Append session to ai/memory/sessions/{session-id}.md
2. Update ai/memory/decisions.md with architecture choices
3. Update ai/memory/context.md with current state
4. Update task status in ai/kanban/index.json → "done"
5. Update docs/sprints/current-sprint.md
6. Append to docs/sprints/session-log.md

## Retry Logic

- Failed QA → retry worker agent once
- Failed review → retry with feedback
- Max 2 retries → escalate to human

## Error Handling

- Any syntax error → STOP, fix, retry
- Missing dependency → STOP, report
- RBAC concern → STOP, ask human
- Migration needed → SHOW DIFF, wait for human
