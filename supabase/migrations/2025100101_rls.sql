-- 2025100101_rls.sql — C1: kunci akses anon, RLS deny-by-default
--
-- Konteks jujur: aplikasi memakai JWT sendiri + service_role (bypass RLS),
-- BUKAN Supabase Auth. Jadi policy berbasis auth.uid() tidak bisa jalan
-- sebelum migrasi ke Supabase Auth (tindak lanjut terpisah, lihat catatan).
-- Yang file ini lakukan: ENABLE RLS di semua tabel TANPA policy permisif.
-- Efek: service_role (backend) tidak terpengaruh sama sekali;
-- anon/authenticated key yang bocor tidak bisa baca/tulis apa pun.
-- Ini menutup lubang "anon key = akses penuh" hari ini.
--
-- Idempoten: aman di-run ulang.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'cases', 'goals', 'criteria', 'alternatives',
    'case_experts', 'dependencies', 'judgments', 'consistency_ratios',
    'aggregated_results', 'notifications', 'audit_logs'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END
$$;

-- TINDAK LANJUT (bukan file ini): migrasi ke Supabase Auth agar RLS per-user
-- bisa hidup: (1) sign JWT backend dengan Supabase JWT secret + klaim sub =
-- users.id, (2) backend pakai anon key + Authorization: Bearer <user jwt>,
-- (3) service_role hanya untuk job sistem, (4) tulis policy per tabel, misal:
--
--   CREATE POLICY "creator owns cases" ON public.cases
--     FOR ALL USING (creator_id = auth.uid());
--   CREATE POLICY "invited experts read cases" ON public.cases
--     FOR SELECT USING (EXISTS (
--       SELECT 1 FROM public.case_experts ce
--       WHERE ce.case_id = cases.id AND ce.expert_id = auth.uid()));
