# Think Decision — database migrations (Supabase)
#
# Cara pakai (Supabase Dashboard -> SQL Editor -> New query), URUT:
#   0. 2025100100_initial_schema.sql    (13 tabel inti + seed; WAJIB pertama
#                                         di project Supabase kosong)
#   1. 2025100101_rls.sql               (kunci anon key; service_role backend
#                                         tidak terpengaruh)
#   2. 2025100102_constraints.sql       (FK + unique; baca STEP 0 di file dulu)
#   3. 2025100103_indexes.sql           (index pola akses nyata)
#   4. 2025100104_rpc.sql               (fungsi agregat audit)
#   5. 2025100105_goals.sql             (lipat goals -> cases.goal_name + backfill)
#   6. 2025100106_notification_types.sql (CHECK kanonis tipe notifikasi)
#   7. 2025100107_methods.sql           (registry metode: AHP/ANP/FUZZY_*/ISM/MICMAC)
#
# Seluruh urutan 0-7 diuji end-to-end dari database kosong (Postgres 17 +
# schema/role/publication bawaan Supabase) — jalan tanpa error, jadi tiap
# file aman di-run ulang di atas hasil file sebelumnya. Kalau satu statement
# gagal karena data (bukan karena struktur), perbaiki datanya dulu (query
# pembersih ada di tiap file), lalu run ulang file itu saja. Jangan loncat
# urutan.
#
# Verifikasi pasca-apply: verifikasi.sql (ekspektasi hasil ada di dalamnya).
