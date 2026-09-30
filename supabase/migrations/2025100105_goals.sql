-- 2025100105_goals.sql — A4: lipat goals 1-to-1 ke cases.goal_name
--
-- Satu case punya tepat satu goal; tabel terpisah hanya menambah 1 query
-- per baca case. Kolom dilipat, kode dual-write/read dengan fallback
-- (lihat caseService: selectCaseDetail), jadi aman sebelum/sesudah apply.
-- Tabel goals dibiarkan (kompatibilitas baca lama) — drop di rilis berikut
-- setelah goal_name terbukti terisi penuh:
--   SELECT count(*) FROM cases WHERE goal_name IS NULL;
-- Idempoten: ADD COLUMN IF NOT EXISTS + backfill hanya yang NULL.

ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS goal_name text;

UPDATE public.cases c
SET goal_name = g.name
FROM public.goals g
WHERE g.case_id = c.id AND c.goal_name IS NULL;
