-- Campus Lost & Found — cloud database schema
-- Run this in Supabase: Project -> SQL Editor -> New query

create extension if not exists "uuid-ossp";

create table if not exists items (
  id           uuid primary key default uuid_generate_v4(),
  type         text not null check (type in ('lost', 'found')),
  title        text not null,
  description  text not null,
  category     text not null,
  location     text not null,
  contact      text not null,
  status       text not null default 'open' check (status in ('open', 'claimed')),
  created_at   timestamptz not null default now()
);

create index if not exists items_type_idx on items (type);
create index if not exists items_status_idx on items (status);
create index if not exists items_created_at_idx on items (created_at desc);

-- Row Level Security: open for a class assignment demo (public read/write via anon key).
-- In a production deployment you would scope these policies to authenticated users.
alter table items enable row level security;

create policy "public can read items"
  on items for select
  using (true);

create policy "public can insert items"
  on items for insert
  with check (true);

create policy "public can update items"
  on items for update
  using (true);

create policy "public can delete items"
  on items for delete
  using (true);
