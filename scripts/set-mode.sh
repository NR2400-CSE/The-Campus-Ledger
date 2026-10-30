#!/usr/bin/env bash
# Switch the Nginx configuration:  ./scripts/set-mode.sh single|naive|resilient
# Makes sure all three backends are running first (Nginx cannot start if a backend name does not resolve).
set -euo pipefail
cd "$(dirname "$0")/.."
MODE="${1:?usage: set-mode.sh single|naive|resilient}"
[ -f "nginx/$MODE.conf" ] || { echo "unknown mode: $MODE"; exit 1; }

docker compose up -d backend1 backend2 backend3 >/dev/null
cp "nginx/$MODE.conf" nginx/active.conf
docker compose up -d --force-recreate nginx >/dev/null
echo "Nginx is now using: $MODE"
sleep 2
