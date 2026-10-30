// Counts CRITICAL / HIGH findings from Trivy's JSON on stdin.
//   trivy image -q -f json --severity CRITICAL,HIGH campus-ledger:before | node scripts/trivy-count.mjs
let raw = ''
process.stdin.on('data', (d) => (raw += d))
process.stdin.on('end', () => {
  const report = JSON.parse(raw)
  const c = { CRITICAL: 0, HIGH: 0 }
  for (const r of report.Results || []) for (const v of r.Vulnerabilities || []) if (v.Severity in c) c[v.Severity]++
  console.log(`CRITICAL: ${c.CRITICAL}   HIGH: ${c.HIGH}   TOTAL: ${c.CRITICAL + c.HIGH}`)
})
