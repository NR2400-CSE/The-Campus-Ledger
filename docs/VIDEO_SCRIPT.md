# 3-minute demo — suggested run of show (≈ 20 s per block)
Record the screen with voice-over. Have everything pre-run so you only *show* results; keep terminals large.

| Time | Show | Say |
|---|---|---|
| 0:00 | Repo + architecture diagram | "The Campus Ledger: Next.js + Supabase. Scenario: the morning after the fest, thousands check found items. Hardest-hit API: GET /api/items." |
| 0:20 | `docker compose ps`, then `show-distribution.sh` | "Three containers behind Nginx on port 80; requests rotate across backend1, 2 and 3." |
| 0:40 | `results/summary.csv` | "Same Apache Bench settings: 1 instance versus 3. Requests/sec went from X to Y, mean time from A to B." |
| 1:00 | Run `failover-test.sh naive` (sped up / pre-recorded), then `resilient` | "I stop backend2 mid-test. Naive config: N failures. With max_fails and proxy_next_upstream: zero." |
| 1:30 | Diagram — orange bursting path | "Overflow goes to the Vercel deployment from Assignment 1; same Supabase DB. Chosen because the peak is short and predictable." |
| 1:50 | Supabase users table before/after | "Passwords were plain text; now bcrypt with a salt." |
| 2:10 | UI login with QR + code | "TOTP MFA with an authenticator app." |
| 2:30 | curl 401 and 403, then staff 200 | "Delete without a token is rejected; student gets 403; only security staff can delete." |
| 2:45 | Trivy before/after table, `id` output | "Critical/High findings dropped from X to Y; container now runs as non-root." |
| 2:58 | Close | "Threats and GDPR mapping are in the report." |
