#!/usr/bin/env bash
# Q1(a) evidence: send N requests through Nginx and count which container answered each.
#   ./scripts/show-distribution.sh [N=30]
N="${1:-30}"
echo "Sending $N requests to http://127.0.0.1/api/health ..."
for i in $(seq 1 "$N"); do
  curl -s http://127.0.0.1/api/health | sed -E 's/.*"instance":"([^"]+)".*/\1/'
done | sort | uniq -c | awk '{printf "  %-10s answered %s requests\n", $2, $1}'
