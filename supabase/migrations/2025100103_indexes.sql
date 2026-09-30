-- 2025100103_indexes.sql — B5: index pola akses nyata (hasil audit query)
--
-- Supabase sudah meng-index PK + unique otomatis. Sisanya tidak ada
-- (verifikasi: select * from pg_indexes where schemaname='public').
-- Tiap index di bawah menjawab pola .eq/.in/.order di kode backend.
-- Idempoten: semua IF NOT EXISTS, aman di-run ulang.

-- Agregasi & submit: filter utama judgments.
CREATE INDEX IF NOT EXISTS judgments_case_submitted_idx
  ON public.judgments (case_id, submitted);
CREATE INDEX IF NOT EXISTS judgments_case_expert_level_idx
  ON public.judgments (case_id, expert_id, level_id);

-- Membership + bobot per case (dipakai hampir tiap endpoint).
CREATE INDEX IF NOT EXISTS case_experts_case_idx
  ON public.case_experts (case_id, expert_id);
CREATE INDEX IF NOT EXISTS case_experts_expert_status_idx
  ON public.case_experts (expert_id, status);

-- Struktur case (results, progress, wizard).
CREATE INDEX IF NOT EXISTS criteria_case_parent_idx
  ON public.criteria (case_id, parent_criteria_id);
CREATE INDEX IF NOT EXISTS alternatives_case_idx
  ON public.alternatives (case_id);
CREATE INDEX IF NOT EXISTS dependencies_case_idx
  ON public.dependencies (case_id);
CREATE INDEX IF NOT EXISTS goals_case_idx
  ON public.goals (case_id);

-- Notifikasi: inbox per user, terbaru dulu (B4: order created_at desc).
CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx
  ON public.notifications (recipient_id, created_at DESC);

-- Audit: filter user + rentang waktu (routes/auditLogs.js).
CREATE INDEX IF NOT EXISTS audit_logs_user_created_idx
  ON public.audit_logs (user_id, created_at DESC);

-- Daftar case kreator + pencarian nama (B6: siapkan trigram).
CREATE INDEX IF NOT EXISTS cases_creator_idx
  ON public.cases (creator_id, deleted_at, created_at DESC);
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS cases_name_trgm_idx
  ON public.cases USING gin (name gin_trgm_ops);

-- CR per level (results/discrepancy).
CREATE INDEX IF NOT EXISTS consistency_case_level_idx
  ON public.consistency_ratios (case_id, level_id);
