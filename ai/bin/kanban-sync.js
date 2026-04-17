#!/usr/bin/env node

/**
 * AI Execution System V3 — Kanban Sync
 *
 * Syncs kanban state between:
 * - ai/kanban/index.json (internal state)
 * - ai/kanban/tasks/*.md (task details)
 * - docs/sprints/current-sprint.md (sprint tracking)
 *
 * Usage:
 *   node ai/bin/kanban-sync.js              — Full sync (both directions)
 *   node ai/bin/kanban-sync.js --from-sprint — Import from current-sprint.md
 *   node ai/bin/kanban-sync.js --to-sprint   — Export to current-sprint.md
 *   node ai/bin/kanban-sync.js --validate    — Validate consistency
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..');

const KANBAN_INDEX = join(PROJECT_ROOT, 'ai', 'kanban', 'index.json');
const KANBAN_TASKS = join(PROJECT_ROOT, 'ai', 'kanban', 'tasks');
const SPRINT_FILE = join(PROJECT_ROOT, 'docs', 'sprints', 'current-sprint.md');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg, level = 'info') {
  const prefix = { info: 'ℹ', success: '✓', warn: '⚠', error: '✗' };
  console.log(`  ${prefix[level] || '·'} ${msg}`);
}

function readJSON(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function readMD(path) {
  if (!existsSync(path)) return '';
  return readFileSync(path, 'utf-8');
}

function writeJSON(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

// Status mapping between kanban columns and sprint file
const COL_TO_STATUS = {
  todo: 'todo',
  prog: 'in_progress',
  rev: 'review',
  done: 'done',
};

const STATUS_TO_COL = {
  todo: 'todo',
  'in_progress': 'prog',
  review: 'rev',
  done: 'done',
};

// ─── Sync Operations ─────────────────────────────────────────────────────────

function loadKanbanIndex() {
  const data = readJSON(KANBAN_INDEX);
  if (!data) {
    return { version: '1.0.0', updated: new Date().toISOString().slice(0, 10), tasks: [] };
  }
  return data;
}

function saveKanbanIndex(data) {
  data.updated = new Date().toISOString().slice(0, 10);
  writeJSON(KANBAN_INDEX, data);
}

function parseSprintFile(content) {
  const tasks = [];
  const lines = content.split('\n');
  const inTable = false;

  for (const line of lines) {
    // Detect markdown table with task data (| T## | ... | Status |)
    const match = line.match(/^\|\s*(T\d+)\s*\|(.+?)\|\s*(.+?)\s*\|(.+?)\|(.+?)\|/);
    if (match) {
      const id = match[1].trim();
      const title = match[2].trim();
      const statusRaw = match[3].trim();

      let status = 'todo';
      if (statusRaw.includes('Done') || statusRaw.includes('✅')) status = 'done';
      else if (statusRaw.includes('Progress') || statusRaw.includes('🚀')) status = 'in_progress';
      else if (statusRaw.includes('Review') || statusRaw.includes('🔍')) status = 'review';

      tasks.push({ id, title, status });
    }
  }

  return tasks;
}

function syncFromSprint() {
  log('Syncing FROM sprint file → kanban index...', 'info');

  const sprintContent = readMD(SPRINT_FILE);
  if (!sprintContent) {
    log('Sprint file not found. Skipping.', 'warn');
    return;
  }

  const sprintTasks = parseSprintFile(sprintContent);
  if (sprintTasks.length === 0) {
    log('No tasks found in sprint file.', 'warn');
    return;
  }

  const kanban = loadKanbanIndex();

  // Update or add tasks from sprint
  for (const st of sprintTasks) {
    const existing = kanban.tasks.find(t => t.id === st.id);
    if (existing) {
      existing.status = st.status;
      existing.col = STATUS_TO_COL[st.status] || 'todo';
    } else {
      kanban.tasks.push({
        id: st.id,
        status: st.status,
        col: STATUS_TO_COL[st.status] || 'todo',
      });
    }
  }

  // Sort by ID
  kanban.tasks.sort((a, b) => {
    const na = parseInt(a.id.slice(1));
    const nb = parseInt(b.id.slice(1));
    return na - nb;
  });

  saveKanbanIndex(kanban);
  log(`Synced ${sprintTasks.length} tasks from sprint file.`, 'success');
}

function syncToSprint() {
  log('Syncing TO sprint file ← kanban index...', 'info');

  const kanban = loadKanbanIndex();
  if (!kanban.tasks.length) {
    log('Kanban index empty. Skipping.', 'warn');
    return;
  }

  log('Sprint file update is READ-ONLY to prevent data loss.', 'info');
  log('To update sprint file, manually copy status from kanban index.', 'info');

  // Print status for manual update
  console.log('\n📋 Current Kanban Status (for sprint file update):');
  kanban.tasks.forEach(t => {
    const statusIcons = { todo: '○', in_progress: '🚀 In Progress', review: '🔍 Review', done: '✅ Done' };
    console.log(`  ${t.id}: ${statusIcons[t.status] || t.status}`);
  });
  console.log('');
}

function validate() {
  log('Validating kanban consistency...', 'info');

  const kanban = loadKanbanIndex();
  let errors = 0;

  // Check all tasks have matching files
  for (const t of kanban.tasks) {
    const taskFile = join(KANBAN_TASKS, `${t.id}.md`);
    if (!existsSync(taskFile)) {
      log(`Missing task file: ${t.id}.md`, 'error');
      errors++;
    }
  }

  // Check status consistency
  for (const t of kanban.tasks) {
    if (!['todo', 'in_progress', 'review', 'done'].includes(t.status)) {
      log(`Invalid status for ${t.id}: "${t.status}"`, 'error');
      errors++;
    }
    if (!['todo', 'prog', 'rev', 'done'].includes(t.col)) {
      log(`Invalid column for ${t.id}: "${t.col}"`, 'error');
      errors++;
    }
  }

  // Check for duplicates
  const ids = kanban.tasks.map(t => t.id);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicates.length) {
    log(`Duplicate task IDs: ${duplicates.join(', ')}`, 'error');
    errors += duplicates.length;
  }

  if (errors === 0) {
    log(`All ${kanban.tasks.length} tasks validated successfully.`, 'success');
  } else {
    log(`${errors} error(s) found.`, 'error');
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  const fromSprint = args.includes('--from-sprint');
  const toSprint = args.includes('--to-sprint');
  const doValidate = args.includes('--validate');
  const help = args.includes('--help') || args.includes('-h');

  if (help) {
    console.log(`
AI Execution System V3 — Kanban Sync

Usage:
  node ai/bin/kanban-sync.js              Full sync (both directions)
  node ai/bin/kanban-sync.js --from-sprint Import from current-sprint.md
  node ai/bin/kanban-sync.js --to-sprint   Export status to sprint file
  node ai/bin/kanban-sync.js --validate    Validate kanban consistency
  node ai/bin/kanban-sync.js --help        Show this help
`);
    return;
  }

  if (!fromSprint && !toSprint && !doValidate) {
    // Full sync
    syncFromSprint();
    syncToSprint();
    validate();
    return;
  }

  if (fromSprint) syncFromSprint();
  if (toSprint) syncToSprint();
  if (doValidate) validate();
}

main();
