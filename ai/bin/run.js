#!/usr/bin/env node

/**
 * AI Execution System V3 — CLI Runner
 *
 * Usage:
 *   node ai/bin/run.js              — Run next todo task
 *   node ai/bin/run.js --task T12   — Run specific task
 *   node ai/bin/run.js --dry-run    — Show plan without executing
 *   node ai/bin/run.js --status     — Show kanban status
 *   node ai/bin/run.js --list       — List all tasks
 *   node ai/bin/run.js --done T12   — Mark task T12 as done
 *   node ai/bin/run.js --move T12 review — Move to: todo|in_progress|review|done
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..');

// ─── Paths ───────────────────────────────────────────────────────────────────
const KANBAN_INDEX = join(PROJECT_ROOT, 'ai', 'kanban', 'index.json');
const KANBAN_TASKS = join(PROJECT_ROOT, 'ai', 'kanban', 'tasks');
const MEMORY_SESSIONS = join(PROJECT_ROOT, 'ai', 'memory', 'sessions');
const MEMORY_CONTEXT = join(PROJECT_ROOT, 'ai', 'memory', 'context.md');
const MEMORY_DECISIONS = join(PROJECT_ROOT, 'ai', 'memory', 'decisions.md');
const RUNS_DIR = join(PROJECT_ROOT, 'ai', 'runs');
const AGENTS_DIR = join(PROJECT_ROOT, 'ai', 'agents');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg, level = 'info') {
  const prefix = { info: 'ℹ', success: '✓', warn: '⚠', error: '✗', step: '▸' };
  console.log(`  ${prefix[level] || '·'} ${msg}`);
}

function readJSON(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function readMD(path) {
  return readFileSync(path, 'utf-8');
}

function writeJSON(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function extractField(content, field) {
  const regex = new RegExp(`^##\\s+${field}\\s*$`, 'mi');
  const match = content.match(regex);
  if (!match) return '';
  const start = match.index + match[0].length;
  const rest = content.slice(start);
  const nextSection = rest.match(/^##\s+/m);
  const end = nextSection ? nextSection.index : rest.length;
  return rest.slice(0, end).trim();
}

function extractFieldRaw(content, field) {
  const lines = content.split('\n');
  let capturing = false;
  const result = [];
  for (const line of lines) {
    if (line.match(new RegExp(`^##\\s+${field}\\s*$`, 'i'))) {
      capturing = true;
      continue;
    }
    if (capturing) {
      if (line.match(/^##\s+/)) break;
      result.push(line);
    }
  }
  return result.join('\n').trim();
}

// ─── Kanban Operations ───────────────────────────────────────────────────────

function loadKanban() {
  return readJSON(KANBAN_INDEX);
}

function saveKanban(data) {
  writeJSON(KANBAN_INDEX, data);
}

function getTaskById(id) {
  const kanban = loadKanban();
  return kanban.tasks.find(t => t.id === id);
}

function getNextTodoTask() {
  const kanban = loadKanban();
  return kanban.tasks.find(t => t.status === 'todo');
}

function getTaskDetails(id) {
  const path = join(KANBAN_TASKS, `${id}.md`);
  if (!existsSync(path)) return null;
  return readMD(path);
}

function updateTaskStatus(id, newStatus, newCol) {
  const kanban = loadKanban();
  const task = kanban.tasks.find(t => t.id === id);
  if (task) {
    task.status = newStatus;
    if (newCol) task.col = newCol;
  }
  kanban.updated = new Date().toISOString().slice(0, 10);
  saveKanban(kanban);
}

// ─── Commands ────────────────────────────────────────────────────────────────

function cmdStatus() {
  const kanban = loadKanban();
  const counts = { todo: 0, in_progress: 0, review: 0, done: 0 };
  kanban.tasks.forEach(t => {
    if (t.status === 'todo') counts.todo++;
    else if (t.status === 'in_progress') counts.in_progress++;
    else if (t.status === 'review') counts.review++;
    else if (t.status === 'done') counts.done++;
  });
  console.log('\n📊 Kanban Status:');
  console.log(`  To Do:       ${counts.todo}`);
  console.log(`  In Progress: ${counts.in_progress}`);
  console.log(`  Review:      ${counts.review}`);
  console.log(`  Done:        ${counts.done}`);
  console.log(`  Total:       ${kanban.tasks.length}`);
  console.log(`  Updated:     ${kanban.updated}\n`);
}

function cmdList() {
  const kanban = loadKanban();
  console.log('\n📋 All Tasks:');
  console.log('─'.repeat(60));
  kanban.tasks.forEach(t => {
    const details = getTaskDetails(t.id);
    const title = details ? extractField(details, 'Title') : t.id;
    const statusIcons = { todo: '○', in_progress: '◐', review: '◑', done: '●' };
    const icon = statusIcons[t.status] || '?';
    console.log(`  ${icon} ${t.id.padEnd(4)} ${title.padEnd(40)} [${t.status}]`);
  });
  console.log('─'.repeat(60) + '\n');
}

function cmdDryRun(taskId) {
  const taskEntry = taskId ? getTaskById(taskId) : getNextTodoTask();
  if (!taskEntry) { log('No todo tasks found', 'warn'); return; }

  const details = getTaskDetails(taskEntry.id);
  if (!details) { log(`Task file missing: ${taskEntry.id}.md`, 'error'); return; }

  const title = extractField(details, 'Title');
  const goal = extractField(details, 'Goal');
  const criteria = extractField(details, 'Acceptance Criteria');
  const agentCtx = extractField(details, 'Agent Context');
  const files = extractField(details, 'Related Files');

  console.log(`\n📋 Task: ${taskEntry.id} — ${title}`);
  console.log(`   Status: ${taskEntry.status}`);
  console.log(`\n🎯 Goal:\n   ${goal}`);
  console.log(`\n✅ Acceptance Criteria:\n   ${criteria}`);
  console.log(`\n📁 Related Files:\n   ${files}`);
  console.log(`\n🧠 Agent Context:\n   ${agentCtx}\n`);

  log('DRY RUN — no agents executed', 'warn');
}

function cmdRun(taskId) {
  const taskEntry = taskId ? getTaskById(taskId) : getNextTodoTask();
  if (!taskEntry) { log('No todo tasks found. All tasks complete!', 'success'); return; }

  const details = getTaskDetails(taskEntry.id);
  if (!details) { log(`Task file missing: ${taskEntry.id}.md`, 'error'); process.exit(1); }

  const title = extractField(details, 'Title');
  const status = taskEntry.status;

  // Check if task is already in progress or review — still runnable
  if (status !== 'todo' && status !== 'in_progress') {
    log(`Task ${taskEntry.id} status is "${status}" — not "todo". Use --task ${taskEntry.id} to force.`, 'warn');
  }

  log(`Starting execution: ${taskEntry.id} — ${title}`, 'step');

  // Update status to in_progress
  updateTaskStatus(taskEntry.id, 'in_progress', 'prog');
  log(`Task ${taskEntry.id} → in_progress`, 'info');

  // Create run log
  const sessionId = `${taskEntry.id}_${new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-')}`;
  const runLog = join(RUNS_DIR, `${sessionId}.md`);
  if (!existsSync(RUNS_DIR)) mkdirSync(RUNS_DIR, { recursive: true });

  const runHeader = `# Run: ${taskEntry.id} — ${title}\n**Started:** ${new Date().toISOString()}\n**Agent:** Orchestrator (V3)\n\n---\n`;
  writeFileSync(runLog, runHeader, 'utf-8');

  // ── Simulate pipeline (actual agent execution is done by human/AI) ──────
  // This runner creates the structure and logs. Actual code generation
  // happens when an AI agent reads these files and executes.

  appendFileSync(runLog, '## Step 1: Planner\n', 'utf-8');
  log('Planner: loading task brief...', 'step');
  appendFileSync(runLog, 'Task brief loaded. Ready for decomposition.\n\n', 'utf-8');

  appendFileSync(runLog, '## Step 2: Worker Agents\n', 'utf-8');
  log('Workers: backend + frontend agents ready', 'step');
  appendFileSync(runLog, 'Backend and frontend agents briefed.\n\n', 'utf-8');

  appendFileSync(runLog, '## Step 3: QA\n', 'utf-8');
  log('QA: agent ready', 'step');
  appendFileSync(runLog, 'QA agent ready.\n\n', 'utf-8');

  appendFileSync(runLog, '## Step 4: Review\n', 'utf-8');
  log('Review: agent ready', 'step');
  appendFileSync(runLog, 'Review agent ready.\n\n', 'utf-8');

  appendFileSync(runLog, `## Result\n**Status:** Awaiting agent execution\n**Log:** ${sessionId}\n`, 'utf-8');

  // Create session file
  const sessionFile = join(MEMORY_SESSIONS, `${sessionId}.md`);
  const sessionContent = `# Session: ${sessionId}\n\n## Task\n${taskEntry.id} — ${title}\n\n## Status\nIn Progress\n\n## Log\nSee ai/runs/${sessionId}.md\n`;
  writeFileSync(sessionFile, sessionContent, 'utf-8');
  log(`Session saved: ${sessionId}.md`, 'success');

  console.log(`\n📂 Task brief prepared in: ai/runs/${sessionId}.md`);
  console.log(`📋 Session log: ai/memory/sessions/${sessionId}.md`);
  console.log(`\n🤖 AI agents should now read the task brief and execute.`);
  console.log(`   When done, update kanban status to "done".\n`);
}

function cmdDone(taskId) {
  if (!taskId) { log('Usage: --done T12', 'error'); return; }
  const task = getTaskById(taskId);
  if (!task) { log(`Task ${taskId} not found`, 'error'); return; }
  updateTaskStatus(taskId, 'done', 'done');

  // Update task file status field
  const taskFile = join(KANBAN_TASKS, `${taskId}.md`);
  if (existsSync(taskFile)) {
    const content = readMD(taskFile);
    const updated = content.replace(/^(##\s+Status\s*\n)([a-z_]+)/m, '$1done');
    writeFileSync(taskFile, updated, 'utf-8');
  }

  log(`Task ${taskId} → done ✓`, 'success');
}

const STATUS_COLS = {
  todo: 'todo',
  in_progress: 'prog',
  review: 'rev',
  done: 'done',
};

function cmdMove(taskId, newStatus) {
  const validStatuses = Object.keys(STATUS_COLS);
  if (!taskId) { log('Usage: --move T12 review', 'error'); return; }
  if (!newStatus || !validStatuses.includes(newStatus)) {
    log(`Invalid status "${newStatus}". Use: ${validStatuses.join(' | ')}`, 'error');
    return;
  }
  const task = getTaskById(taskId);
  if (!task) { log(`Task ${taskId} not found`, 'error'); return; }
  const oldStatus = task.status;
  updateTaskStatus(taskId, newStatus, STATUS_COLS[newStatus]);

  // Update task file
  const taskFile = join(KANBAN_TASKS, `${taskId}.md`);
  if (existsSync(taskFile)) {
    const content = readMD(taskFile);
    const updated = content.replace(/^(##\s+Status\s*\n)([a-z_]+)/m, `$1${newStatus}`);
    writeFileSync(taskFile, updated, 'utf-8');
  }

  log(`Task ${taskId}: ${oldStatus} → ${newStatus}`, 'success');
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  const taskId = args.find(a => a.match(/^T\d+$/i));
  const dryRun = args.includes('--dry-run');
  const showStatus = args.includes('--status');
  const showList = args.includes('--list');
  const markDone = args.includes('--done');
  const doMove = args.includes('--move');
  const help = args.includes('--help') || args.includes('-h');

  if (help) {
    console.log(`
AI Execution System V3 — CLI Runner

Usage:
  node ai/bin/run.js              Run next todo task
  node ai/bin/run.js --task T12   Run specific task by ID
  node ai/bin/run.js --dry-run    Show task brief without executing
  node ai/bin/run.js --status     Show kanban status
  node ai/bin/run.js --list       List all tasks
  node ai/bin/run.js --done T12   Mark task T12 as done
  node ai/bin/run.js --move T12 review  Move task (todo|in_progress|review|done)
  node ai/bin/run.js --help       Show this help

Examples:
  node ai/bin/run.js --status         # check current sprint
  node ai/bin/run.js --dry-run        # preview next task
  node ai/bin/run.js                  # execute next task
  node ai/bin/run.js --task T12       # execute specific task
  node ai/bin/run.js --done T12       # mark T12 complete
  node ai/bin/run.js --move T12 review  # move T12 to review
`);
    return;
  }

  if (showStatus) { cmdStatus(); return; }
  if (showList) { cmdList(); return; }
  if (markDone) { cmdDone(taskId); return; }
  if (doMove) {
    // --move T12 review → args after --move
    const moveIdx = args.indexOf('--move');
    const moveTask = args[moveIdx + 1]?.match(/^T\d+$/i) ? args[moveIdx + 1] : taskId;
    const moveStatus = args.find((a, i) => i > moveIdx && !a.startsWith('--') && !a.match(/^T\d+$/i));
    cmdMove(moveTask, moveStatus);
    return;
  }
  if (dryRun) { cmdDryRun(taskId); return; }
  cmdRun(taskId);
}

main();
