#!/bin/bash
# Runs every tests/*.test.js and prints failures plus a one-line summary.
cd "$(dirname "$0")"; files=0; bad=0; ok=0; all=0
for t in tests/*.test.js; do files=$((files+1)); out=$(node "$t" 2>&1); line=$(printf '%s\n' "$out" | grep -oE 'PASS [0-9]+/[0-9]+' | tail -1)
  a=${line#PASS }; p=${a%/*}; n=${a#*/}
  if [ -z "$line" ] || [ "$p" != "$n" ]; then bad=$((bad+1)); echo "FAIL $t: ${line:-no PASS line}"; printf '%s\n' "$out" | grep -E 'FAIL|Error' | head -3; fi
  ok=$((ok+${p:-0})); all=$((all+${n:-0})); done
echo "$files test files, $bad failing, checks $ok/$all"
