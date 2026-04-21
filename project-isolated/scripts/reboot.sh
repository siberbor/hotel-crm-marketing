#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG="$ROOT/logs/server.log"

mkdir -p "$ROOT/logs"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ====== SERVER REBOOT ======" >> "$LOG"
echo "Rebooting server..."

"$SCRIPT_DIR/stop.sh"
"$SCRIPT_DIR/start.sh"
