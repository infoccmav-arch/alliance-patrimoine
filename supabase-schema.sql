-- ============================================================
-- Alliance Patrimoine Inc. — Schéma Supabase
-- Coller dans : Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Table clé-valeur pour toutes les données partagées
--    (membres, propriétés, finances, checklist, etc.)
create table if not exists app_data (
  key        text primary key,
  value      jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

-- 2. Table messages pour le chat en temps réel
create table if not exists messages (
  id             bigint primary key,       -- timestamp côté client (Date.now())
  text           text not null,
  cat            text default 'general',
  author         text not null,
  "authorInitial" text,
  "isAdmin"      boolean default false,
  time           text,
  date           text,
  pinned         boolean default false
);

-- ── Activer Row Level Security ────────────────────────────────────────────────
alter table app_data enable row level security;
alter table messages  enable row level security;

-- ── Politiques d'accès (accès public pour tous les membres connectés) ─────────
create policy "Lecture publique app_data"
  on app_data for select using (true);

create policy "Écriture publique app_data"
  on app_data for all using (true) with check (true);

create policy "Lecture publique messages"
  on messages for select using (true);

create policy "Écriture publique messages"
  on messages for all using (true) with check (true);

-- ── Activer la réplication temps réel ────────────────────────────────────────
alter publication supabase_realtime add table app_data;
alter publication supabase_realtime add table messages;

-- ── Valeurs initiales (capital à 0) ──────────────────────────────────────────
insert into app_data (key, value) values
  ('capital',      '0'::jsonb),
  ('proprietes',   '[]'::jsonb),
  ('franchises',   '[]'::jsonb),
  ('transactions', '[]'::jsonb),
  ('checklist',    '{}'::jsonb)
on conflict (key) do nothing;

-- ============================================================
-- Terminé ! L'application va maintenant synchroniser toutes
-- les données en temps réel entre les 10 membres.
-- ============================================================
