# RPO / RTO — Think Decision (Supabase Postgres)
#
# Diisi SEKALI dari dashboard, lalu ditempel di bawah. Tanpa ini, "backup ada"
# hanya asumsi. Monetisasi = data keputusan berbayar = wajib terdefinisi.
#
# Checklist (Supabase Dashboard → Project → Database → Backups):
# - [X] Paket backup: Free (harian, retensi 7 hari)
# - [ ] PITR aktif? (tidak)
# - [ ] Region database: ap-southeast-2
#
# RPO/RTO yang dinyatakan (isi setelah checklist di atas jelas):
# - RPO (data hilang maksimal): 24 Jam
# - RTO (lama pulih maksimal): terbaik
#
# Aturan rilis skema (wajib, murah, tanpa tool):
# 1. Tulis migrasi di supabase/migrations/ (format: YYYYMMDDHH_nama.sql).
# 2. Apply di SQL Editor staging/kecil dulu bila ada; minimal baca STEP 0.
# 3. Snapshot/backup manual sebelum migrasi destruktif (DROP/DELETE massal).
# 4. Catat apply di bawah (tanggal + file + hasil verifikasi.sql).
# Riwayat apply:
# - 2026-10-01: 2025100101–06 OK, verifikasi hijau (cases_tanpa_goal=2, keduanya tanpa goal row)
