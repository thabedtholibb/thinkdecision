# Think Decision — database migrations (Supabase)
#
# Cara pakai (Supabase Dashboard → SQL Editor → New query), URUT:
#   1. 2025100101_rls.sql          (kunci anon key; backend service_role tidak terpengaruh)
#   2. 2025100102_constraints.sql  (FK + unique; baca STEP 0 dulu)
#   3. 2025100103_indexes.sql      (index pola akses nyata)
#   4. 2025100104_rpc.sql          (fungsi agregat audit)
#   5. 2025100105_goals.sql         (lipat goals -> cases.goal_name + backfill)
#   6. 2025100106_notification_types.sql (CHECK kanonis tipe notifikasi)
#
# Tiap file idempoten (aman di-run ulang). Kalau satu statement gagal,
# perbaiki datanya dulu (query pembersih ada di tiap file), lalu run ulang
# file itu saja. Jangan loncat urutan.
#
# Verifikasi pasca-apply: verifikasi.sql (ekspektasi hasil ada di dalamnya).
