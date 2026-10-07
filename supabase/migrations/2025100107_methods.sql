-- 2025100107_methods.sql — Registry metode (ISM/MICMAC) + kolom pendukung
--
-- Tujuan:
--   1. Tabel `methods` sebagai katalog metode + seed 6 baris (AHP, ANP,
--      FUZZY_AHP, FUZZY_ANP, ISM, MICMAC). Runtime tetap membaca metadata dari
--      kode (backend/src/services/methods); tabel ini menjaga integritas FK.
--   2. Normalisasi label lama 'Fuzzy AHP'/'Fuzzy ANP' di cases.method dan
--      users.default_method ke kode kanonik, lalu FK ke methods(code).
--   3. cases.method_config (jsonb, default '{}') — mis. relasi kontekstual ISM.
--   4. judgments.matrix_order (jsonb) — urutan id elemen untuk matriks ISM.
--
-- Kode backend sudah aman SEBELUM file ini di-apply untuk AHP/ANP/Fuzzy
-- (method_config hanya ditulis untuk ISM, kolom dibaca dengan fallback).
-- ISM butuh file ini (method_config + matrix_order).
--
-- STEP 0 (jalankan dulu; baris yang muncul = nilai method yang tidak dikenal,
-- bersihkan manual sebelum lanjut, atau FK di bawah gagal VALIDATE):
--   SELECT 'cases', method, count(*) FROM cases
--     WHERE method NOT IN ('AHP','ANP','Fuzzy AHP','Fuzzy ANP','FUZZY_AHP','FUZZY_ANP','ISM')
--     GROUP BY 2;
--   SELECT 'users', default_method, count(*) FROM users
--     WHERE default_method IS NOT NULL
--       AND default_method NOT IN ('AHP','ANP','Fuzzy AHP','Fuzzy ANP','FUZZY_AHP','FUZZY_ANP','ISM')
--     GROUP BY 2;
--
-- Di luar cakupan (rilis berikut): perubahan consistency_ratios dan
-- aggregated_results (hasil ISM masih dihitung saat dibaca).
-- Idempoten: aman di-run ulang.

CREATE TABLE IF NOT EXISTS public.methods (
  code             text PRIMARY KEY,
  label            text NOT NULL,
  description      text,
  family           text NOT NULL,
  structure_tier   text NOT NULL,
  judgment_shape   text,
  consistency_kind text NOT NULL,
  result_shape     text NOT NULL,
  max_elements     int  NOT NULL DEFAULT 20,
  is_selectable    boolean NOT NULL DEFAULT true,
  derived_from     text,
  active           boolean NOT NULL DEFAULT true,
  sort_order       int  NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Konsisten dengan 2025100101: RLS aktif tanpa policy (backend = service_role).
ALTER TABLE public.methods ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('methods_code_format',      'CHECK (code ~ ''^[A-Z][A-Z0-9_]*$'')'),
      ('methods_family_check',     'CHECK (family IN (''pairwise_ratio'', ''structural''))'),
      ('methods_tier_check',       'CHECK (structure_tier IN (''two_tier'', ''single_tier''))'),
      ('methods_judgment_check',   'CHECK (judgment_shape IS NULL OR judgment_shape IN (''ratio_matrix'', ''fuzzy_ratio_matrix'', ''binary_relation_matrix'', ''cross_impact_matrix''))'),
      ('methods_consistency_check','CHECK (consistency_kind IN (''cr'', ''consensus'', ''none''))'),
      ('methods_result_check',     'CHECK (result_shape IN (''ranking'', ''network_ranking'', ''level_partition'', ''quadrant_scatter''))'),
      ('methods_max_elements_check','CHECK (max_elements > 1)'),
      -- Metode turunan tidak bisa dipilih langsung di wizard.
      ('methods_derived_not_selectable', 'CHECK (derived_from IS NULL OR is_selectable = false)'),
      ('methods_derived_from_fk',  'FOREIGN KEY (derived_from) REFERENCES public.methods (code) ON UPDATE CASCADE')
    ) AS v(cname, ddl)
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.methods ADD CONSTRAINT %I %s', r.cname, r.ddl);
      RAISE NOTICE 'added %', r.cname;
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'exists, skipped %', r.cname;
    END;
  END LOOP;
END
$$;

-- Seed: harus sama dengan meta di backend/src/services/methods/*.js.
-- ISM disisipkan sebelum MICMAC karena FK derived_from.
INSERT INTO public.methods
  (code, label, description, family, structure_tier, judgment_shape, consistency_kind,
   result_shape, max_elements, is_selectable, derived_from, sort_order)
VALUES
  ('AHP', 'AHP', 'Analytic Hierarchy Process: perbandingan berpasangan skala Saaty, hasil peringkat alternatif.',
   'pairwise_ratio', 'two_tier', 'ratio_matrix', 'cr', 'ranking', 20, true, NULL, 10),
  ('ANP', 'ANP', 'Analytic Network Process: seperti AHP dengan dependensi antar-kriteria.',
   'pairwise_ratio', 'two_tier', 'ratio_matrix', 'cr', 'network_ranking', 20, true, NULL, 20),
  ('FUZZY_AHP', 'Fuzzy AHP', 'AHP dengan bilangan fuzzy segitiga (TFN) untuk menangkap ketidakpastian penilaian.',
   'pairwise_ratio', 'two_tier', 'fuzzy_ratio_matrix', 'cr', 'ranking', 20, true, NULL, 30),
  ('FUZZY_ANP', 'Fuzzy ANP', 'ANP dengan bilangan fuzzy segitiga (TFN).',
   'pairwise_ratio', 'two_tier', 'fuzzy_ratio_matrix', 'cr', 'network_ranking', 20, true, NULL, 40),
  ('ISM', 'ISM', 'Interpretive Structural Modelling: memetakan relasi pengaruh antar-elemen menjadi hierarki level.',
   'structural', 'single_tier', 'binary_relation_matrix', 'consensus', 'level_partition', 40, true, NULL, 50),
  ('MICMAC', 'MICMAC', 'Analisis driving power dan dependence power dari hasil ISM.',
   'structural', 'single_tier', NULL, 'none', 'quadrant_scatter', 40, false, 'ISM', 60)
ON CONFLICT (code) DO UPDATE SET
  label            = EXCLUDED.label,
  description      = EXCLUDED.description,
  family           = EXCLUDED.family,
  structure_tier   = EXCLUDED.structure_tier,
  judgment_shape   = EXCLUDED.judgment_shape,
  consistency_kind = EXCLUDED.consistency_kind,
  result_shape     = EXCLUDED.result_shape,
  max_elements     = EXCLUDED.max_elements,
  is_selectable    = EXCLUDED.is_selectable,
  derived_from     = EXCLUDED.derived_from,
  sort_order       = EXCLUDED.sort_order;

-- Check lama (label 'Fuzzy AHP' dsb.) menolak nilai kanonik.
-- FK ke methods(code) gantikan peran check ini, jadi drop dulu.
-- ponytail: bila butuh guard tambahan selain FK, tambah check per methods.active, bukan enum statis.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.cases'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%method%'
  LOOP
    EXECUTE format('ALTER TABLE public.cases DROP CONSTRAINT %I', r.conname);
    RAISE NOTICE 'dropped %', r.conname;
  END LOOP;
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.users'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%default_method%'
  LOOP
    EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT %I', r.conname);
    RAISE NOTICE 'dropped %', r.conname;
  END LOOP;
END
$$;

-- Normalisasi label lama (no-op bila sudah kanonik).
UPDATE public.cases SET method = 'FUZZY_AHP' WHERE method = 'Fuzzy AHP';
UPDATE public.cases SET method = 'FUZZY_ANP' WHERE method = 'Fuzzy ANP';
UPDATE public.users SET default_method = 'FUZZY_AHP' WHERE default_method = 'Fuzzy AHP';
UPDATE public.users SET default_method = 'FUZZY_ANP' WHERE default_method = 'Fuzzy ANP';

-- Kolom baru.
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS method_config jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.judgments ADD COLUMN IF NOT EXISTS matrix_order jsonb;

-- FK ke methods: NOT VALID dulu (tanpa scan), lalu VALIDATE.
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.cases ADD CONSTRAINT cases_method_fk
      FOREIGN KEY (method) REFERENCES public.methods (code)
      ON UPDATE CASCADE ON DELETE RESTRICT NOT VALID;
  EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'exists, skipped cases_method_fk'; END;
  BEGIN
    ALTER TABLE public.users ADD CONSTRAINT users_default_method_fk
      FOREIGN KEY (default_method) REFERENCES public.methods (code)
      ON UPDATE CASCADE ON DELETE SET NULL NOT VALID;
  EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'exists, skipped users_default_method_fk'; END;
END
$$;

-- Gagal di sini = masih ada nilai method tak dikenal (lihat STEP 0).
ALTER TABLE public.cases VALIDATE CONSTRAINT cases_method_fk;
ALTER TABLE public.users VALIDATE CONSTRAINT users_default_method_fk;

-- ROLLBACK (jalankan manual bila perlu; urutan penting):
--   ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS cases_method_fk;
--   ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_default_method_fk;
--   ALTER TABLE public.judgments DROP COLUMN IF EXISTS matrix_order;
--   ALTER TABLE public.cases DROP COLUMN IF EXISTS method_config;
--   -- Opsional, hanya bila backend lama (pra-registry) dipakai lagi:
--   -- UPDATE public.cases SET method = 'Fuzzy AHP' WHERE method = 'FUZZY_AHP';
--   -- UPDATE public.cases SET method = 'Fuzzy ANP' WHERE method = 'FUZZY_ANP';
--   -- UPDATE public.users SET default_method = 'Fuzzy AHP' WHERE default_method = 'FUZZY_AHP';
--   -- UPDATE public.users SET default_method = 'Fuzzy ANP' WHERE default_method = 'FUZZY_ANP';
--   DROP TABLE IF EXISTS public.methods;
