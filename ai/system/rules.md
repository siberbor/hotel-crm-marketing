# AI Execution System — Rules V3

## Core Principles

1. **Deterministic > Smart** — follow explicit rules, don't improvise
2. **Inspect before writing** — always read existing code first
3. **Reuse, don't duplicate** — search before creating
4. **Small steps** — never break existing functionality
5. **Single source of truth** — AGENTS.md > architecture.md > this file

## Hard Constraints

- NEVER modify business logic outside assigned task
- NEVER bypass RBAC/permissions middleware
- NEVER hardcode secrets or read CLAUDE.local.md
- NEVER run migrations without human confirmation
- NEVER overwrite AGENTS.md content
- NEVER commit to git or push to remote
- NEVER install new npm packages without approval

## Execution Rules

### Before Starting
1. Read task from kanban (ai/kanban/index.json)
2. Read memory (ai/memory/context.md, decisions.md)
3. Check dependencies are Done in kanban
4. Read AGENTS.md project context

### During Execution
1. Search existing implementations first (grep, glob)
2. Read 2-3 similar files to understand patterns
3. Follow project conventions (named exports, Zod schemas co-located)
4. Write minimal, focused changes
5. Validate against acceptance criteria

### After Execution
1. Run `npm run lint:fix` — zero errors required
2. Run `npm run test` — all must pass
3. Update ai/memory/decisions.md with architecture choices
4. Update ai/memory/context.md with current state
5. Append to ai/memory/sessions/{session-id}.md

## Security

- Every mutating request MUST go through permissions middleware
- JWT validation required on all protected routes
- Manager role CANNOT delete — enforce at middleware level
- Secrets in .env only — never log, never hardcode

## Output Format

All agents MUST output:
```
## Agent: <name>
## Task: <id>
## Status: success | failure
## Files Changed:
- <path>
## Summary:
<brief description>
## Issues:
<any blockers or questions for human>
```

## Conflict Resolution

If rules conflict: AGENTS.md wins → then architecture.md → then this file.
When in doubt: STOP and ask human.
