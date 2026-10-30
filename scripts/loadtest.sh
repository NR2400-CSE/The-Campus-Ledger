#!/usr/bin/env bash
# Q1(b): Apache Bench against the hardest-hit API, identical settings for every run.
#   ./scripts/loadtest.sh <label> [requests=1000] [concurrency=50]
# Appends one row to results/summary.csv and stores the raw ab output in results/<label>.txt
set -uo pipefail
cd "$(dirname "$0")/.."
LABEL="${1:?usage: loadtest.sh <label> [requests] [concurrency]}"
N="${2:-1000}"; C="${3:-50}"
URL="http://127.0.0.1/api/items?type=found&status=open&limit=100"
mkdir -p results

echo "Warm-up (100 requests, not recorded)..."
ab -q -n 100 -c 10 "$URL" >/dev/null 2>&1 || true

echo "Measuring: $N requests, concurrency $C -> $URL"
ab -n "$N" -c "$C" "$URL" > "results/$LABEL.txt" 2>&1 || true

RPS=$(grep -m1 "Requests per second" "results/$LABEL.txt" | awk '{print $4}')
MEAN=$(grep -m1 "Time per request" "results/$LABEL.txt" | awk '{print $4}')
P95=$(grep -E "^ +95%" "results/$LABEL.txt" | awk '{print $2}')
FAILED=$(grep -m1 "Failed requests" "results/$LABEL.txt" | awk '{print $3}')
NON2XX=$(grep -m1 "Non-2xx responses" "results/$LABEL.txt" | awk '{print $3}')
NON2XX="${NON2XX:-0}"

[ -f results/summary.csv ] || echo "label,requests,concurrency,req_per_sec,mean_ms,p95_ms,failed,non_2xx" > results/summary.csv
echo "$LABEL,$N,$C,$RPS,$MEAN,$P95,$FAILED,$NON2XX" >> results/summary.csv

printf "\n%-22s %s\n" "Requests per second:" "$RPS"
printf "%-22s %s ms\n" "Mean time/request:" "$MEAN"
printf "%-22s %s ms\n" "95th percentile:" "$P95"
printf "%-22s %s\n" "Failed requests:" "$FAILED"
printf "%-22s %s\n" "Non-2xx responses:" "$NON2XX"
