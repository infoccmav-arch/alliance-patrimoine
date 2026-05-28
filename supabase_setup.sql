-- ============================================================
-- Alliance Patrimoine Inc. — Supabase Setup SQL
-- Copiez-collez ce script dans l'éditeur SQL de Supabase
-- (Dashboard → SQL Editor → New Query → Paste → Run)
-- ============================================================

-- ── 1. Table principale : données partagées (membres, finances, etc.) ────────
CREATE TABLE IF NOT EXISTS public.app_data (
  key         TEXT        PRIMARY KEY,
  value       JSONB       NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour accélerer les requêtes temps réel
CREATE INDEX IF NOT EXISTS idx_app_data_updated ON public.app_data (updated_at DESC);

-- ── 2. Table des messages de discussion ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id            BIGINT      PRIMARY KEY DEFAULT extract(epoch from now()) * 1000,
  text          TEXT        NOT NULL,
  cat           TEXT        NOT NULL DEFAULT 'general',
  author        TEXT        NOT NULL,
  "authorInitial" TEXT      NOT NULL DEFAULT '?',
  "isAdmin"     BOOLEAN     NOT NULL DEFAULT FALSE,
  time          TEXT        NOT NULL,
  date          TEXT        NOT NULL,
  pinned        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_date ON public.messages (created_at ASC);

-- ── 3. Row Level Security (RLS) — données accessibles à tous les membres ─────
-- app_data : lecture + écriture pour tous (pas d'auth Supabase requise)
ALTER TABLE public.app_data  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages  ENABLE ROW LEVEL SECURITY;

-- Politique : accès complet avec la clé anon (votre app utilise la clé publique)
CREATE POLICY "anon_all_app_data" ON public.app_data
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "anon_all_messages" ON public.messages
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ── 4. Activer la réplication temps réel ────────────────────────────────────
-- (Fait automatiquement par Supabase pour les nouvelles tables)
-- Si nécessaire, allez dans Database → Replication et activez app_data et messages.

-- ── 5. Vérification ─────────────────────────────────────────────────────────
SELECT 'app_data' AS table_name, COUNT(*) AS rows FROM public.app_data
UNION ALL
SELECT 'messages', COUNT(*) FROM public.messages;
