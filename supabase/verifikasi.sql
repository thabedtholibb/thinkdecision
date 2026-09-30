-- verifikasi.sql — jalankan SETELAH 01-04. Ekspektasi di tiap blok.

-- 1. RLS aktif di semua tabel (row count 12, semua t).
SELECT count(*) AS rls_on_count FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity IS TRUE;
-- EKSPEKTASI: >= 12

-- 2. FK + unique sesuai 02 (nama constraint harus muncul).
SELECT conname FROM pg_constraint
WHERE connamespace = 'public'::regnamespace AND conname LIKE '%_fk'
ORDER BY conname;
-- EKSPEKTASI: goals_case_fk, criteria_case_fk,
-- alternatives_case_fk, dependencies_case_fk,
-- judgments_case_fk, judgments_expert_fk, consistency_case_fk,
-- aggregated_case_fk, case_experts_case_fk, case_experts_expert_fk,
-- notifications_recipient_fk, audit_logs_user_fk
-- (TIDAK ADA criteria_parent_fk / dependencies_from|to_fk: criteria.id
-- bukan unique — diganti trigger, cek di bawah.)
SELECT tgname FROM pg_trigger WHERE NOT tgisinternal
  AND tgrelid IN ('public.criteria'::regclass, 'public.dependencies'::regclass)
ORDER BY tgname;
-- EKSPEKTASI: criteria_parent_check, dependency_criteria_check
SELECT conname FROM pg_constraint
WHERE connamespace = 'public'::regnamespace AND conname LIKE '%unique%'
ORDER BY conname;
-- EKSPEKTASI: judgments_unique_level, consistency_unique_level,
-- case_experts_unique, users_email_lower_unique (ini index, cek di no.3)

-- 3. Index sesuai 03.
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE '%_idx'
ORDER BY indexname;
-- EKSPEKTASI: judgments_case_submitted_idx, judgments_case_expert_level_idx,
-- case_experts_case_idx, case_experts_expert_status_idx,
-- criteria_case_parent_idx, alternatives_case_idx, dependencies_case_idx,
-- goals_case_idx, notifications_recipient_created_idx,
-- audit_logs_user_created_idx, cases_creator_idx, cases_name_trgm_idx,
-- consistency_case_level_idx, users_email_lower_unique

-- 4. RPC ada dan bisa dipanggil service_role.
SELECT proname FROM pg_proc WHERE proname = 'audit_summary';
-- EKSPEKTASI: 1 baris

-- 5. Kolom lipatan goal ada dan terisi penuh.
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cases' AND column_name = 'goal_name';
-- EKSPEKTASI: 1 baris
SELECT count(*) AS cases_tanpa_goal FROM cases WHERE goal_name IS NULL;
-- EKSPEKTASI: hanya case yang memang tidak punya goal (bandingkan dengan
-- count goals yang hilang); tabel goals boleh di-drop bila query ini 0
-- dan aplikasi sudah membaca goal_name semata.
