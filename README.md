# The Campus Ledger — Lost & Found

A cloud-hosted CRUD web app for reporting and claiming lost/found items on campus.
Built for BACSE344 (Cloud Infrastructure and Architecture), C1 Slot.

## Stack

- **Frontend + API:** Next.js 14 (App Router, TypeScript, Tailwind CSS)
- **Cloud database:** Supabase (managed PostgreSQL)
- **Hosting:** Vercel (frontend + serverless API routes)

## 1. Create the cloud database (Supabase)

1. Go to https://supabase.com → sign up (free tier is enough) → "New project".
2. Once the project is provisioned, open **SQL Editor → New query**, paste the contents of
   `schema.sql` from this repo, and run it. This creates the `items` table and its policies.
3. Go to **Project Settings → API** and copy:
   - `Project URL` → this is `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Run locally

```bash
npm install
cp .env.example .env.local   # then paste your Supabase URL + anon key
npm run dev
```

Visit http://localhost:3000.

## 3. Deploy to the cloud (Vercel)

1. Push this folder to a new GitHub repository.
2. Go to https://vercel.com → "Add New Project" → import the repo.
3. In **Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` with the same values as your `.env.local`.
4. Click **Deploy**. Vercel builds the Next.js app and gives you a live URL
   (e.g. `https://campus-ledger.vercel.app`) — this is your deployed application URL.

Every API route under `app/api/items` becomes a serverless function automatically —
no separate backend server to manage.

## API surface

See `API_DOCUMENTATION.md` for the full REST contract.

| Method | Route              | Purpose                       |
|--------|--------------------|--------------------------------|
| GET    | /api/items         | List items (filter by type/status) |
| POST   | /api/items         | Create a new lost/found entry |
| GET    | /api/items/:id     | Read a single entry           |
| PUT    | /api/items/:id     | Update an entry / mark claimed |
| DELETE | /api/items/:id     | Delete an entry               |

## Project structure

```
lostfound-app/
├── app/
│   ├── api/items/route.ts          # GET (list), POST (create)
│   ├── api/items/[id]/route.ts     # GET, PUT, DELETE (single item)
│   ├── layout.tsx
│   └── page.tsx                    # UI: browse, filter, report, claim, delete
├── lib/supabaseClient.ts           # Cloud DB client + types
├── schema.sql                      # Database design (run once in Supabase)
├── styles/globals.css
└── .env.example
```


---

## DA3 additions (BACSE344)

- **Security:** accounts with bcrypt-hashed passwords, TOTP multi-factor login, JWT access tokens, role checks
  (`student` / `security_staff` / `admin`) on every write API, and a server-side-only Supabase service-role key.
  The old public write policies on `items` are removed (`schema_da3.sql`).
- **Scaling:** three containers behind an Nginx load balancer (`docker-compose.yml`, `nginx/`), with load-test and failover scripts (`scripts/`).
- **Hardening:** multi-stage, non-root Alpine image (`Dockerfile`) compared against a naive baseline (`Dockerfile.before`) with Trivy.

Start with `RUNBOOK.md`. Environment variables are listed in `.env.example`.
