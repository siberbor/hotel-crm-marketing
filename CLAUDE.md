---
# CLAUDE.md — Claude Code specific context
# Imports the universal AGENTS.md and adds Claude-specific behavior
---

@AGENTS.md

## Claude-Specific Rules

### Memory Protocol
At the START of every session:
```
1. Read docs/sprints/current-sprint.md          ← активный спринт и задачи
2. Read docs/sprints/session-log.md (last 20 lines)
3. Read docs/sprints/sprint5-staff-portal-guest-lk.md  ← если Sprint 5 активен
4. Check docs/decisions/ for any recent ADRs
5. ONLY THEN start working
```

### Sprint 5 Quick Context (auto-load)
Active sprint: **Sprint 5 — Hotel Website + Staff Portal + Guest LK**
Design refs: `landing/*.png` (зелёный брендинг)

URL map:
- `/`            → витрина отеля (REPLACE page.tsx, зелёный)
- `/guest/*`     → личный кабинет гостя (email+пароль, JWT scope=guest)
- `/staff/*`     → operations portal (Номера/Задачи/Сотрудники/Check-in)
- `/login`+`/app/*` → CRM (синий, НЕ ТРОГАТЬ)

Start order: Блок 1 (DB+JWT+middleware+CSS) → Блок 2 (витрина) → Блок 3 (ЛК) → Блок 4 (staff)

New DB tables needed: `guest_accounts`, `tasks`, `shifts`
New files: `src/styles/tokens-green.css`, `src/app/(staff)/`, `src/app/(guest)/`
Touch: `src/db/schema.ts`, `src/auth/jwt.ts`, `src/middleware/auth.ts`, `src/app/page.tsx`

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
