#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_FILE="$ROOT/logs/server.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "Status: STOPPED (no PID file)"
  exit 1
fi

PID="$(cat "$PID_FILE")"

if ! kill -0 "$PID" 2>/dev/null; then
  echo "Status: STOPPED (PID $PID not alive — stale PID file)"
  exit 1
fi

# Calculate uptime if 'ps' supports it
if UPTIME=$(ps -o etime= -p "$PID" 2>/dev/null | tr -d ' '); then
  echo "Status: RUNNING"
  echo "  PID:    $PID"
  echo "  Uptime: $UPTIME"
else
  echo "Status: RUNNING (PID $PID)"
fi

echo "  URL:    http://localhost:${PORT:-3000}"
echo "  Log:    $ROOT/logs/server.log"
