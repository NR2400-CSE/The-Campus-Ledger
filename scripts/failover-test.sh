#!/usr/bin/env bash
# Q1(c): stop one backend DURING a load test and count the failures.
#   ./scripts/failover-test.sh naive      # BEFORE
#   ./scripts/failover-test.sh resilient  # AFTER
# Optional: [requests=6000] [concurrency=50] [kill_after_seconds=4]
# If ab finishes before the container is stopped, raise `requests`.
set -euo pipefail
cd "$(dirname "$0")/.."
MODE="${1:?usage: failover-test.sh naive|resilient [requests] [concurrency] [kill_after_s]}"
N="${2:-6000}"; C="${3:-50}"; KILL_AFTER="${4:-4}"
URL="http://127.0.0.1/api/items?type=found&status=open&limit=100"
OUT="results/failover-$MODE.txt"
mkdir -p results

./scripts/set-mode.sh "$MODE"
echo "Starting load: $N requests, concurrency $C"
ab -n "$N" -c "$C" "$URL" > "$OUT" 2>&1 &
AB_PID=$!

sleep "$KILL_AFTER"
echo ">>> stopping ledger-backend2 now ($(date +%T))"
docker stop ledger-backend2 >/dev/null
wait "$AB_PID" || true
docker start ledger-backend2 >/dev/null
echo ">>> ledger-backend2 started again"

COMPLETE=$(grep -m1 "Complete requests" "$OUT" | awk '{print $3}')
FAILED=$(grep -m1 "Failed requests" "$OUT" | awk '{print $3}')
NON2XX=$(grep -m1 "Non-2xx responses" "$OUT" | awk '{print $3}')
NON2XX="${NON2XX:-0}"
[ -f results/failover.csv ] || echo "mode,requests,completed,failed,non_2xx" > results/failover.csv
echo "$MODE,$N,$COMPLETE,$FAILED,$NON2XX" >> results/failover.csv

# NOTE: ab also counts a non-2xx reply as "Failed (Length)", so do not add the two numbers together.
printf "\n[%s] completed=%s  Failed requests=%s  Non-2xx responses=%s\n" "$MODE" "$COMPLETE" "$FAILED" "$NON2XX"
