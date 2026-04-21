#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG="$ROOT/logs/server.log"
PID_FILE="$ROOT/logs/server.pid"

mkdir -p "$ROOT/logs"

# Source .env if present
if [ -f "$ROOT/.env" ]; then
  set -o allexport
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +o allexport
fi

# Check if already running
if [ -f "$PID_FILE" ]; then
  PID="$(cat "$PID_FILE")"
  if kill -0 "$PID" 2>/dev/null; then
    echo "Server already running (PID $PID)"
    echo "  Log: $LOG"
    exit 0
  else
    echo "Stale PID file found (PID $PID not alive). Cleaning up..."
    rm -f "$PID_FILE"
  fi
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ====== SERVER START ======" >> "$LOG"

cd "$ROOT"

# Start server in background, redirect stdout+stderr to log
npm run dev >> "$LOG" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"

echo "Server started (PID $NEW_PID)"
echo "  URL: http://localhost:${PORT:-3000}"
echo "  Log: $LOG"
echo "  PID: $PID_FILE"
