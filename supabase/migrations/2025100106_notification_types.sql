-- 2025100106_notification_types.sql — A6: CHECK kanonis tipe notifikasi
--
-- Kode dan frontend memakai varian nama berbeda ('expert_completed' vs
-- 'expert_submission', ...); constraint lama (nama tak diketahui) mungkin
-- menolak tipe yang sah. Migrasi ini: tambah CHECK kanonis NOT VALID,
-- validasi, lalu drop CHECK lama yang menyebut kolom type.
-- Kalau VALIDATE gagal: ada baris dengan type di luar daftar — normalkan
-- manual dulu (SELECT DISTINCT type FROM notifications), lalu run ulang.
-- Idempoten: aman di-run ulang.

ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_canonical
  CHECK (type IN (
    'expert_invited', 'expert_completed', 'expert_submission',
    'case_published', 'case_completed', 'aggregation_ready',
    'judgment_reminder', 'invitation', 'clarity_request'
  )) NOT VALID;

ALTER TABLE public.notifications VALIDATE CONSTRAINT notifications_type_canonical;

-- Drop CHECK lama yang mengatur kolom type (hanya setelah kanonis valid).
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT oid, conname FROM pg_constraint
    WHERE conrelid = 'public.notifications'::regclass
      AND contype = 'c'
      AND conname <> 'notifications_type_canonical'
      AND pg_get_constraintdef(oid) ILIKE '%type%IN%'
  LOOP
    EXECUTE format('ALTER TABLE public.notifications DROP CONSTRAINT %I', r.conname);
    RAISE NOTICE 'dropped legacy check %', r.conname;
  END LOOP;
END
$$;
