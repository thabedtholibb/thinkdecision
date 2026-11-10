-- 2025100108_expert_ownership.sql — P0.3
-- Scope creator-managed expert records. Existing experts remain unowned
-- (created_by NULL) and cannot be reset/deleted until manually assigned.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS created_by uuid;

DO $$
BEGIN
  BEGIN
    ALTER TABLE public.users ADD CONSTRAINT users_created_by_fk
      FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END
$$;

CREATE INDEX IF NOT EXISTS users_created_by_idx
  ON public.users (created_by, role);
