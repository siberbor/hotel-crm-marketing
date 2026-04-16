---
# CLAUDE.md — Claude Code specific context
# Imports the universal AGENTS.md and adds Claude-specific behavior
---

@AGENTS.md

## Claude-Specific Rules

### Memory Protocol
At the START of every session:
```
1. Read docs/sprints/current-sprint.md
2. Read docs/sprints/session-log.md (last 20 lines)
3. Check docs/decisions/ for any recent ADRs
4. ONLY THEN start working
```

At the END of every session, append to `docs/sprints/session-log.md`:
```markdown
## Session [DATE TIME]
**Done:** [what was completed]
**Blocked:** [what needs human input]
**Decisions:** [any arch choices made]
**Next:** [recommended next step]
```

### Subagent Usage
Use `@explore` subagent when you need to understand unfamiliar parts of the codebase.
Use `@plan` subagent before implementing features touching >3 files.
Never run migrations without explicit human confirmation.

### Tool Permissions
- Auto-approve: read files, run lint, run tests
- Ask first: npm install new packages, delete files, run migrations
- Never: commit to git, push to remote, modify .env files

### Code Style (Claude-specific enforcement)
- Named exports only (no default exports except pages)
- ES modules throughout (`import/export`, no `require`)
- 2-space indentation
- Zod schemas co-located with their route handlers
- No `any` types — use `unknown` and narrow

### When You're Unsure
If a task requires modifying permissions logic, auth middleware, or database schema:
STOP → summarize what you plan to do → wait for confirmation.

These are the three most dangerous areas of this codebase.
