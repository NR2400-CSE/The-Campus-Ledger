# DA3 — written answers for The Campus Ledger (edit the numbers after you run the tests)

## Q1(a) Peak-demand situation
**Situation:** the morning after the annual cultural/technical fest. Several thousand attendees lose phones, ID cards and bags, and
staff log hundreds of *found* items overnight. Within a few hours most of the campus opens the Ledger to check whether their item
was handed in.
**Hardest-hit API:** `GET /api/items?type=found&status=open` — a public, read-only listing that every visitor calls on page load
and again on every refresh. Writes (`POST`/`PUT`/`DELETE`) are a tiny fraction of the traffic.
**Setup:** three identical Next.js containers (`ledger-backend1/2/3`, host ports 3001–3003 → 3000) behind Nginx on port 80, all using
the same cloud Supabase project. Distribution evidence: `scripts/show-distribution.sh`.

## Q1(b) Results table (fill in from `results/summary.csv`)
| Setup | Requests/sec | Mean time per request (ms) | Failed |
|---|---|---|---|
| 1 instance | … | … | … |
| 3 instances | … | … | … |
| Improvement | …% | …% | |
Tool: Apache Bench, 1,000 requests, concurrency 50, URL identical for both runs.
**If the gain is below 3×, explain honestly:** all containers share one laptop's CPU and network, and every request waits on a remote
database round-trip, so the database/network path caps throughput before CPU does. In production the instances would sit on separate
machines, and the database would be scaled separately (read replicas / caching).

## Q1(c) Failover table
| Nginx config | Requests | Completed | Non-2xx / failed |
|---|---|---|---|
| Naive (`max_fails=0`, `proxy_next_upstream off`) | … | … | … |
| Resilient (`max_fails=1 fail_timeout=10s`, `proxy_next_upstream error timeout http_502 http_503 http_504`) | … | … | 0 |
Why it works: after the first failed attempt Nginx marks the stopped instance unavailable for 10 s, and any request that already hit it
is transparently retried on the next instance, so the user never sees the error. Limitation: Nginx only retries idempotent requests
(GET) by default, which is what the peak situation consists of.

## Q1(d) Cloud bursting — explanation
**What is added (orange, dashed in the diagram):** the existing DA1 deployment on **Vercel** becomes the burst target. Under normal load
Nginx sends everything to the three local containers. When they are saturated (each `server` gets a `max_conns` cap, and the Vercel
endpoint is declared `backup`) the overflow is forwarded to Vercel's serverless runtime, which scales out automatically and is billed
only for the minutes it is used. Both paths use the same Supabase database, so users see identical data.
**How it handles the post-fest rush:** the spike lasts a few hours and is predictable, so the fixed local capacity is sized for the
normal day and the burst absorbs the peak instead of paying for idle servers all year.
**Why bursting (and not edge/fog) for this domain:** a campus ledger has one location and a short, bursty peak — exactly what bursting
is for. Edge/fog helps when users are geographically spread or latency-critical, which a single campus is not.
**Limits to state:** bursting adds compute, not database capacity; Supabase remains the shared bottleneck (mitigate with caching of the
list endpoint or read replicas). *The bursting routing was designed, not load-tested here.*

## Q2(a) Most sensitive data
Student contact details (email/phone in `items.contact`) and account credentials (`users`: email, bcrypt hash, TOTP secret, role).
Contact details are the main privacy risk: they identify a student and are tied to a location and time ("lost near Hostel B at 9 pm").
Control: only signed-in users receive `contact`; anonymous API responses return `null`.
Passwords: bcrypt (`bcryptjs`, cost 12, per-hash random salt). Note: DA1 had no accounts, so the "before" screenshot is a baseline
`users` table seeded with plain-text passwords by `scripts/seed-users.mjs --plaintext`, then migrated by `scripts/hash-passwords.mjs`.

## Q2(d) Threat agents, controls and GDPR
| Threat agent | Control implemented | GDPR requirement (and why it applies) |
|---|---|---|
| **Malicious student / insider** who tries to alter or delete other people's entries or read contact details | JWT + role check (`security_staff`/`admin` only on PUT/DELETE → 401/403), contact hidden from anonymous callers, DB policies that let the public key write directly removed | **Art. 5(1)(f)** integrity and confidentiality — personal data must be protected against unauthorised alteration or disclosure |
| **External attacker** (credential stuffing, stolen DB dump) | bcrypt hashes, TOTP MFA, rate-limited login/MFA endpoints, no secrets in the browser (service-role key server-side only), hardened non-root image | **Art. 32** security of processing — appropriate technical measures (e.g. access control, pseudonymisation/hashing) for the risk |
**Why GDPR applies:** the Ledger processes personal data of identifiable individuals (names, university emails, phone numbers, where and
when they lost something, plus login accounts). HIPAA does not apply because no health data is stored. If the university serves EU
exchange students GDPR applies directly; otherwise it is the accepted baseline, and India's DPDP Act 2023 sets similar duties.
Also relevant: **Art. 33** (notify a breach within 72 hours) and **Art. 5(1)(c)** (data minimisation — the reason `contact` is hidden by default).
