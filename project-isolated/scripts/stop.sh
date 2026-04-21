#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG="$ROOT/logs/server.log"
PID_FILE="$ROOT/logs/server.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "Server is not running (no PID file found)"
  exit 0
fi

PID="$(cat "$PID_FILE")"

if ! kill -0 "$PID" 2>/dev/null; then
  echo "Server is not running (PID $PID not alive)"
  rm -f "$PID_FILE"
  exit 0
fi

echo "Stopping server (PID $PID)..."
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ====== SERVER STOP (PID $PID) ======" >> "$LOG"

# Graceful stop: SIGTERM
kill -TERM "$PID" 2>/dev/null

# Wait up to 10 seconds for process to exit
TIMEOUT=10
COUNT=0
while kill -0 "$PID" 2>/dev/null; do
  sleep 1
  COUNT=$((COUNT + 1))
  if [ "$COUNT" -ge "$TIMEOUT" ]; then
    echo "Process did not exit after ${TIMEOUT}s — sending SIGKILL..."
    kill -KILL "$PID" 2>/dev/null || true
    break
  fi
done

rm -f "$PID_FILE"
echo "Server stopped."
