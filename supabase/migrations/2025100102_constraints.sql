-- 2025100102_constraints.sql — C2/A3: foreign key + unique + guard model
--
-- STEP 0 (jalankan dulu, harus 0 baris sebelum lanjut):
--   SELECT 'judgments->cases', count(*) FROM judgments j
--     LEFT JOIN cases c ON c.id = j.case_id WHERE c.id IS NULL;
--   SELECT 'case_experts->cases', count(*) FROM case_experts ce
--     LEFT JOIN cases c ON c.id = ce.case_id WHERE c.id IS NULL;
--   SELECT 'case_experts->users', count(*) FROM case_experts ce
--     LEFT JOIN users u ON u.id = ce.expert_id WHERE u.id IS NULL;
--   SELECT 'criteria->cases', count(*) FROM criteria k
--     LEFT JOIN cases c ON c.id = k.case_id WHERE c.id IS NULL;
--   SELECT 'criteria self-parent', count(*) FROM criteria k
--     LEFT JOIN criteria p ON p.id = k.parent_criteria_id
--     WHERE k.parent_criteria_id IS NOT NULL AND p.id IS NULL;
--   SELECT 'criteria cross-case parent', count(*) FROM criteria k
--     JOIN criteria p ON p.id = k.parent_criteria_id AND p.case_id <> k.case_id;
--   SELECT 'criteria self-cycle', count(*) FROM criteria WHERE parent_criteria_id = id;
--   SELECT 'dependencies->criteria', count(*) FROM dependencies d
--     LEFT JOIN criteria k ON k.id IN (d.from_criteria_id, d.to_criteria_id)
--     WHERE k.id IS NULL;
--   SELECT 'alternatives->cases', count(*) FROM alternatives a
--     LEFT JOIN cases c ON c.id = a.case_id WHERE c.id IS NULL;
--   SELECT 'consistency->cases', count(*) FROM consistency_ratios cr
--     LEFT JOIN cases c ON c.id = cr.case_id WHERE c.id IS NULL;
--   SELECT 'notifications->users', count(*) FROM notifications n
--     LEFT JOIN users u ON u.id = n.recipient_id WHERE u.id IS NULL;
--   SELECT 'dup judgments', case_id, expert_id, level_id, count(*)
--     FROM judgments GROUP BY 1,2,3 HAVING count(*) > 1;
--   SELECT 'dup case_experts', case_id, expert_id, count(*)
--     FROM case_experts GROUP BY 1,2 HAVING count(*) > 1;
--   SELECT 'dup emails (case-insensitive)', lower(email), count(*)
--     FROM users GROUP BY 1 HAVING count(*) > 1;
--
-- Kalau ada baris yatim/duplikat: bersihkan manual dulu (sesuai domain),
-- baru lanjut. Idempoten: aman di-run ulang (yang sudah ada di-skip).
--
-- CATATAN SKEMA (ditemukan saat apply): criteria.id BUKAN unique/primary,
-- sehingga FK apa pun yang menunjuk ke criteria(id) error 42830. Oleh karena
-- itu parent/dependensi divalidasi TRIGGER (di bawah), bukan FK.

-- Audit bertahan walau user dihapus (no-op bila sudah nullable).
ALTER TABLE public.audit_logs ALTER COLUMN user_id DROP NOT NULL;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      -- Komposisi milik case: hapus case => anak ikut (ganti delete manual 6 tabel).
      ('goals',              'goals_case_fk',            'FOREIGN KEY (case_id) REFERENCES public.cases (id) ON DELETE CASCADE'),
      ('criteria',           'criteria_case_fk',         'FOREIGN KEY (case_id) REFERENCES public.cases (id) ON DELETE CASCADE'),
      ('alternatives',       'alternatives_case_fk',     'FOREIGN KEY (case_id) REFERENCES public.cases (id) ON DELETE CASCADE'),
      ('dependencies',       'dependencies_case_fk',     'FOREIGN KEY (case_id) REFERENCES public.cases (id) ON DELETE CASCADE'),
      ('judgments',          'judgments_case_fk',        'FOREIGN KEY (case_id) REFERENCES public.cases (id) ON DELETE CASCADE'),
      ('consistency_ratios', 'consistency_case_fk',      'FOREIGN KEY (case_id) REFERENCES public.cases (id) ON DELETE CASCADE'),
      ('aggregated_results', 'aggregated_case_fk',       'FOREIGN KEY (case_id) REFERENCES public.cases (id) ON DELETE CASCADE'),
      -- Relasi protektif: tolak hapus bila masih dirujuk.
      ('case_experts', 'case_experts_case_fk',   'FOREIGN KEY (case_id) REFERENCES public.cases (id) ON DELETE RESTRICT'),
      ('case_experts', 'case_experts_expert_fk', 'FOREIGN KEY (expert_id) REFERENCES public.users (id) ON DELETE RESTRICT'),
      ('judgments',    'judgments_expert_fk',    'FOREIGN KEY (expert_id) REFERENCES public.users (id) ON DELETE RESTRICT'),
      ('notifications','notifications_recipient_fk', 'FOREIGN KEY (recipient_id) REFERENCES public.users (id) ON DELETE RESTRICT'),
      -- Guard murni tanpa FK (lihat CATATAN SKEMA di atas).
      ('criteria', 'criteria_no_self_parent', 'CHECK (parent_criteria_id IS NULL OR parent_criteria_id <> id)'),
      ('audit_logs',   'audit_logs_user_fk',   'FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE SET NULL')
    ) AS v(tbl, cname, ddl)
  LOOP
    BEGIN
      -- NOT VALID: tidak scan tabel saat apply; validasi di langkah berikut.
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I %s NOT VALID', r.tbl, r.cname, r.ddl);
      RAISE NOTICE 'added %', r.cname;
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'exists, skipped %', r.cname;
    END;
  END LOOP;
END
$$;

-- Unique yang selama ini hanya diasumsikan kode (upsert onConflict).
-- Tanpa NOT VALID (Postgres belum mendukungnya untuk UNIQUE): bila gagal,
-- ada duplikat di data — bersihkan dulu (lihat STEP 0), lalu run ulang.
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.judgments ADD CONSTRAINT judgments_unique_level
      UNIQUE (case_id, expert_id, level_id);
  EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'exists, skipped judgments_unique_level'; END;
  BEGIN
    ALTER TABLE public.consistency_ratios ADD CONSTRAINT consistency_unique_level
      UNIQUE (case_id, expert_id, level_id);
  EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'exists, skipped consistency_unique_level'; END;
  BEGIN
    ALTER TABLE public.case_experts ADD CONSTRAINT case_experts_unique
      UNIQUE (case_id, expert_id);
  EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'exists, skipped case_experts_unique'; END;
END
$$;

-- Email unik case-insensitive (hentikan duplikat A@x/a@x di DB, bukan di kode).
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique
  ON public.users (lower(email));

-- Trigger pengganti FK ke criteria(id): parent sekasus + dependensi valid.
-- Trigger hanya menjaga TULISAN BARU; baris lama ditutup STEP 0 di atas.
CREATE OR REPLACE FUNCTION public.check_criteria_parent()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.parent_criteria_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.criteria p
    WHERE p.id = NEW.parent_criteria_id AND p.case_id = NEW.case_id
  ) THEN
    RAISE EXCEPTION 'parent_criteria_id % tidak ada di case %',
      NEW.parent_criteria_id, NEW.case_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS criteria_parent_check ON public.criteria;
CREATE TRIGGER criteria_parent_check
  BEFORE INSERT OR UPDATE OF parent_criteria_id, case_id ON public.criteria
  FOR EACH ROW EXECUTE FUNCTION public.check_criteria_parent();

CREATE OR REPLACE FUNCTION public.check_dependency_criteria()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.criteria k
    WHERE k.id = NEW.from_criteria_id AND k.case_id = NEW.case_id
  ) THEN
    RAISE EXCEPTION 'from_criteria_id % tidak ada di case %',
      NEW.from_criteria_id, NEW.case_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.criteria k
    WHERE k.id = NEW.to_criteria_id AND k.case_id = NEW.case_id
  ) THEN
    RAISE EXCEPTION 'to_criteria_id % tidak ada di case %',
      NEW.to_criteria_id, NEW.case_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS dependency_criteria_check ON public.dependencies;
CREATE TRIGGER dependency_criteria_check
  BEFORE INSERT OR UPDATE OF from_criteria_id, to_criteria_id, case_id
  ON public.dependencies
  FOR EACH ROW EXECUTE FUNCTION public.check_dependency_criteria();

-- Validasi semua constraint terhadap data (gagal = masih ada data kotor,
-- BUKAN salah migrasi; bersihkan lalu run ulang file ini).
ALTER TABLE public.goals               VALIDATE CONSTRAINT goals_case_fk;
ALTER TABLE public.criteria            VALIDATE CONSTRAINT criteria_case_fk;
ALTER TABLE public.alternatives        VALIDATE CONSTRAINT alternatives_case_fk;
ALTER TABLE public.dependencies        VALIDATE CONSTRAINT dependencies_case_fk;
ALTER TABLE public.judgments           VALIDATE CONSTRAINT judgments_case_fk;
ALTER TABLE public.consistency_ratios  VALIDATE CONSTRAINT consistency_case_fk;
ALTER TABLE public.aggregated_results  VALIDATE CONSTRAINT aggregated_case_fk;
ALTER TABLE public.case_experts        VALIDATE CONSTRAINT case_experts_case_fk;
ALTER TABLE public.case_experts        VALIDATE CONSTRAINT case_experts_expert_fk;
ALTER TABLE public.judgments           VALIDATE CONSTRAINT judgments_expert_fk;
ALTER TABLE public.notifications       VALIDATE CONSTRAINT notifications_recipient_fk;
ALTER TABLE public.criteria            VALIDATE CONSTRAINT criteria_no_self_parent;
ALTER TABLE public.audit_logs          VALIDATE CONSTRAINT audit_logs_user_fk;
-- (UNIQUE langsung valid saat dibuat; tidak perlu VALIDATE.)
