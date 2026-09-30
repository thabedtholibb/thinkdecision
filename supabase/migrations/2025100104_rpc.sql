-- 2025100104_rpc.sql — B3: agregat audit di DB, bukan di JS
--
-- routes/auditLogs.js:/summary hari ini menarik SEMUA baris lalu group di
-- Node (O(total) per request). Fungsi ini mengembalikan grup hitung langsung.
-- SECURITY DEFINER + search_path tetap agar aman; GRANT ke authenticated dan
-- service_role. Backend tetap fallback ke hitung-JS bila fungsi belum ada
-- (kompatibel sebelum/sesudah migrasi di-apply).
-- Idempoten: CREATE OR REPLACE.

CREATE OR REPLACE FUNCTION public.audit_summary(
  p_user_id uuid,
  p_since timestamptz,
  p_admin boolean DEFAULT false
)
RETURNS TABLE (action text, resource_type text, count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.action, a.resource_type, count(*)::bigint
  FROM public.audit_logs a
  WHERE a.created_at >= p_since
    AND (p_admin OR a.user_id = p_user_id)
  GROUP BY a.action, a.resource_type;
$$;

REVOKE ALL ON FUNCTION public.audit_summary(uuid, timestamptz, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.audit_summary(uuid, timestamptz, boolean)
  TO authenticated, service_role;
