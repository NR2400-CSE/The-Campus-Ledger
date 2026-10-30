-- DA3 migration for The Campus Ledger. Run ONCE in Supabase: SQL Editor -> New query.
-- Safe to re-run.

-- 1) Accounts ------------------------------------------------------------
create table if not exists users (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  email         text not null unique,
  password_hash text not null,                      -- bcrypt hash ($2b$12$...), never the password
  role          text not null default 'student'
                check (role in ('student', 'security_staff', 'admin')),
  mfa_secret    text,                               -- base32 TOTP secret (set at enrolment)
  mfa_enabled   boolean not null default false,
  created_at    timestamptz not null default now()
);

-- RLS on with NO policies = the public anon key can read/write nothing here.
alter table users enable row level security;

-- 2) Who filed each entry ------------------------------------------------
alter table items add column if not exists created_by uuid references users(id) on delete set null;

-- 3) Close the DA1 hole ---------------------------------------------------
-- DA1 allowed anyone holding the (public) anon key to INSERT/UPDATE/DELETE rows
-- straight through Supabase, bypassing the API - which would make the role checks
-- in the API pointless. Remove those policies. The server now talks to Supabase
-- with the service-role key, which bypasses RLS, so the app keeps working.
drop policy if exists "public can read items"   on items;
drop policy if exists "public can insert items" on items;
drop policy if exists "public can update items" on items;
drop policy if exists "public can delete items" on items;
alter table items enable row level security;
