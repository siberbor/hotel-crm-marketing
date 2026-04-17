#!/usr/bin/env node

/**
 * AI Execution System V3 — Live Dashboard Server
 *
 * Serves dashboard.html + JSON API for live kanban data.
 * Supports drag & drop status changes that persist to ai/kanban/index.json.
 *
 * Usage:
 *   node ai/bin/server.js           — default port 3200
 *   node ai/bin/server.js --port 8080
 */

import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..');

const PORT = process.argv.includes('--port')
  ? parseInt(process.argv[process.argv.indexOf('--port') + 1]) || 3200
  : 3200;

const KANBAN_INDEX = join(PROJECT_ROOT, 'ai', 'kanban', 'index.json');
const KANBAN_TASKS = join(PROJECT_ROOT, 'ai', 'kanban', 'tasks');
const DASHBOARD_HTML = join(__dirname, '..', 'dashboard.html');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function readJSON(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function writeJSON(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function readMD(path) {
  return existsSync(path) ? readFileSync(path, 'utf-8') : '';
}

// ── Enrich task data ─────────────────────────────────────────────────────────

// Task dependencies (architectural, rarely changes)
const DEPS_MAP = {
  T01: [], T02: ['T01'], T03: ['T01'], T04: [], T05: ['T03','T04'],
  T06: ['T01','T03'], T07: ['T01','T03'], T08: ['T03'], T09: ['T01','T02'],
  T10: ['T03','T06'], T11: ['T03'], T12: ['T03'], T13: ['T06','T01'],
  T14: ['T04','T05'], T15: ['T02'], T16: ['T04','T02'], T17: ['T01'], T18: ['T03','T06'],
};

function enrichTask(kanban) {
  return kanban.tasks.map(t => {
    const details = readMD(join(KANBAN_TASKS, `${t.id}.md`));
    return {
      ...t,
      title: extractField(details, 'Title') || t.id,
      desc: extractField(details, 'Goal') || '',
      acceptance: extractField(details, 'Acceptance Criteria') || '',
      agent_ctx: extractField(details, 'Agent Context') || '',
      files: parseListField(extractField(details, 'Related Files')),
      tags: parseListField(extractField(details, 'Tags'), ','),
      pri: extractField(details, 'Priority') || 'md',
      branch: extractField(details, 'Branch') || '',
      deps: DEPS_MAP[t.id] || [],
    };
  });
}

function extractField(content, field) {
  if (!content) return '';
  // Normalize line endings
  const normalized = content.replace(/\r\n/g, '\n');
  const regex = new RegExp(`^##\\s+${field}\\s*$`, 'mi');
  const match = normalized.match(regex);
  if (!match) return '';
  const start = match.index + match[0].length;
  const rest = normalized.slice(start);
  const nextSection = rest.match(/^##\s+/m);
  return rest.slice(0, nextSection ? nextSection.index : rest.length).trim();
}

function parseListField(raw, delimiter = '\n') {
  if (!raw) return [];
  return raw
    .split(delimiter)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.replace(/^[-*]\s*/, ''))
    .filter(Boolean);
}

// ── Request handler ───────────────────────────────────────────────────────────

function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── API: GET /api/kanban ──
  if (path === '/api/kanban' && method === 'GET') {
    try {
      const kanban = readJSON(KANBAN_INDEX);
      const tasks = enrichTask(kanban);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ...kanban, tasks }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // ── API: POST /api/kanban/update ──
  if (path === '/api/kanban/update' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { id, status, col } = JSON.parse(body);
        const kanban = readJSON(KANBAN_INDEX);
        const task = kanban.tasks.find(t => t.id === id);
        if (!task) throw new Error(`Task ${id} not found`);

        task.status = status;
        if (col) task.col = col;
        kanban.updated = new Date().toISOString().slice(0, 10);
        writeJSON(KANBAN_INDEX, kanban);

        // Also update task file status
        const taskFile = join(KANBAN_TASKS, `${id}.md`);
        if (existsSync(taskFile)) {
          const content = readFileSync(taskFile, 'utf-8');
          const statusLine = content.match(/^##\s+Status\s*$/mi);
          if (statusLine) {
            const start = statusLine.index + statusLine[0].length;
            const rest = content.slice(start);
            const currentStatus = rest.match(/^([a-z_]+)$/m);
            if (currentStatus) {
              const oldVal = currentStatus[1];
              const oldIdx = statusLine.index + start + (content.indexOf(oldVal, statusLine.index));
              // Simpler: replace the status line
              const newContent = content.replace(
                new RegExp(`(^##\\s+Status\\s*\\n)([a-z_]+)`, 'm'),
                `$1${status}`
              );
              if (newContent !== content) {
                writeFileSync(taskFile, newContent, 'utf-8');
              }
            }
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, id, status }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // ── Static: serve dashboard.html ──
  if (path === '/' || path === '/dashboard' || path === '/index.html') {
    try {
      const html = readFileSync(DASHBOARD_HTML, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch {
      res.writeHead(404);
      res.end('dashboard.html not found');
    }
    return;
  }

  // ── 404 ──
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 — Not Found');
}

// ── Start ─────────────────────────────────────────────────────────────────────

const server = createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`\n  📊 Hotel CRM Kanban Dashboard`);
  console.log(`  → http://localhost:${PORT}`);
  console.log(`  → API: http://localhost:${PORT}/api/kanban`);
  console.log(`  → Kanban: ${KANBAN_INDEX}`);
  console.log(`\n  Ctrl+C to stop\n`);
});
