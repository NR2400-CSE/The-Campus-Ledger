# DA3 Runbook — The Campus Ledger (BACSE344)

Everything below is run on **your** machine (Docker Desktop, Node ≥ 20.6, Apache Bench, Trivy).
Save every screenshot/output into `results/` using the names in **[brackets]** so the report is easy to assemble.

## 0. One-time setup
1. In Supabase → **SQL Editor**, run `schema_da3.sql` (creates `users`, locks down `items`).
2. Supabase → Project Settings → API → copy the **service_role** key (not the anon key).
3. `cp .env.example .env` and `cp .env.example .env.local`; fill in `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`
   (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
4. `npm install`
5. Install tools: Docker Desktop, `ab` (preinstalled on macOS; `apt install apache2-utils` on Linux), Trivy (`brew install trivy`).
6. Because the old DA1 policies are removed, **the Vercel deployment needs the new env vars too**
   (Vercel → Settings → Environment Variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`), then redeploy `assignment-3`.

## Q2(a) — bcrypt, before/after
```bash
node --env-file=.env.local scripts/seed-users.mjs --plaintext   # creates the BEFORE state
```
**[q2a-before.png]** Supabase → Table Editor → `users`: `password_hash` shows raw passwords.
```bash
node --env-file=.env.local scripts/hash-passwords.mjs           # migration
```
**[q2a-after.png]** Same table: values now look like `$2b$12$…` (60 chars). Also run the seed once more with the
`--plaintext` flag removed *only if* you want fresh hashed demo users.

## Q2(b) — MFA + role-protected APIs
1. `npm run dev` → open http://localhost:3000 → **Sign in** as `security@vit.ac.in` / `Security@12345`.
2. First login shows a QR code → scan with Google/Microsoft Authenticator → enter the 6-digit code. **[q2b-qr.png]**
3. Sign out, sign in again → now it asks only for the code. **[q2b-code-prompt.png]**
4. Rejected requests (Postman or curl) **[q2b-401.png] [q2b-403.png]**:
```bash
ID=<any item id>
curl -i -X DELETE http://localhost:3000/api/items/$ID                                  # 401 – no token
curl -i -X DELETE -H "Authorization: Bearer <student token>" http://localhost:3000/api/items/$ID   # 403 – wrong role
curl -i -X DELETE -H "Authorization: Bearer <staff token>"   http://localhost:3000/api/items/$ID   # 200 – allowed
```
Get a token by logging in through the UI and copying `ledger_token` from DevTools → Application → Session Storage.
5. Also show that the direct-to-database route is closed: using the anon key against Supabase REST now returns `[]`/permission error.

## Q1(a) — three instances behind Nginx
```bash
docker compose up -d --build
docker compose ps                         # [q1a-docker-ps.png] 3 backends + nginx, ports 3001–3003, 80
./scripts/set-mode.sh resilient
./scripts/show-distribution.sh 30         # [q1a-distribution.png] ~10 requests per instance
curl -i http://127.0.0.1/api/items?limit=1 | grep -i -E "x-instance|x-upstream"
```
Optional data for a realistic payload (do this before load tests): `node --env-file=.env.local scripts/seed-items.mjs 1000`

## Q1(b) — 1 vs 3 instances (same tool, same concurrency)
```bash
./scripts/set-mode.sh single      && ./scripts/loadtest.sh one-instance    1000 50
./scripts/set-mode.sh resilient   && ./scripts/loadtest.sh three-instances 1000 50
cat results/summary.csv           # [q1b-table.png]
```
Improvement % = (RPS₃ − RPS₁) / RPS₁ × 100 and (Mean₁ − Mean₃) / Mean₁ × 100.
If the gain is small, say why (see `docs/DA3_WRITTEN_ANSWERS.md`) — that is a valid, honest finding.

## Q1(c) — stop one instance mid-test
```bash
./scripts/failover-test.sh naive        # BEFORE  → expect many Non-2xx / failed
./scripts/failover-test.sh resilient    # AFTER   → expect 0
cat results/failover.csv                # [q1c-table.png]
```
Take screenshots of both terminal outputs **[q1c-naive.png] [q1c-resilient.png]** and of `docker ps -a` showing `ledger-backend2` stopped
during the run. If `ab` finishes before the stop, increase requests: `./scripts/failover-test.sh naive 20000`.

## Q2(c) — Trivy
```bash
docker build -f Dockerfile.before -t campus-ledger:before .
docker build -t campus-ledger:after .
trivy image -q -f json --severity CRITICAL,HIGH campus-ledger:before | node scripts/trivy-count.mjs
trivy image -q -f json --severity CRITICAL,HIGH campus-ledger:after  | node scripts/trivy-count.mjs
trivy image --severity CRITICAL,HIGH campus-ledger:after            # full table for the screenshot
docker run --rm campus-ledger:before id; docker run --rm campus-ledger:after id   # root vs uid=1000(node)
docker images campus-ledger                                          # size before vs after
```
**[q2c-before.png] [q2c-after.png] [q2c-user.png]** — Residual findings in `after` will come from Next.js 14.2.35 itself
(the last 14.x release; its remaining advisories are only fixed in Next 16). Explain in the report which features they affect
(image optimiser, Server Actions, rewrites, i18n, middleware) and that this app uses none of them.

## Submit
```bash
git add -A && git commit -m "DA3: scaling + security" && git push -u origin assignment-3
```
Report = screenshots above + the tables + text from `docs/DA3_WRITTEN_ANSWERS.md`; diagram = `docs/architecture-da3.png`.
Video script: `docs/VIDEO_SCRIPT.md`.

## Demo accounts (password / role)
| Email | Password | Role |
|---|---|---|
| student@vitstudent.ac.in | Student@12345 | student |
| security@vit.ac.in | Security@12345 | security_staff |
| admin@vit.ac.in | Admin@12345 | admin |
Change or delete these before any real deployment.
