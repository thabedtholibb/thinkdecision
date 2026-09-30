# Rencana migrasi ke Supabase Auth (RLS per-user hidup)
#
# Status kini: JWT sendiri + service_role di semua query. RLS sudah deny-by-
# default (2025100101) sebagai lapis kedua, tapi policy per-user BELUM BISA
# karena auth.uid() tidak mengenal users.id aplikasi. Dokumen ini rencananya.
#
# Prinsip: nol downtime, rollback = kembalikan 2 baris config.
#
# Fase 0 — Persiapan (tanpa ubah runtime)
# - [ ] Pastikan users.id bertipe uuid (cek: \d public.users di SQL Editor).
# - [ ] Catat semua pemanggil supabase di backend (sudah service_role semua).
#
# Fase 1 — Terbitkan JWT ganda (kode, aman, RLS tetap bypass)
# - [ ] authService menandatangani token akses DUA kali: token aplikasi
#       (seperti kini) + token Supabase (HS256 dengan Supabase JWT secret,
#       klaim sub = users.id, role = authenticated).
# - [ ] Frontend kirim keduanya; backend validasi token aplikasi seperti kini.
# - [ ] Verifikasi: token Supabase lolos jwt.verify dengan secret dashboard.
#
# Fase 2 — Backend pakai anon key + JWT pengguna (staging dulu)
# - [ ] config/supabase.js: dua client — `supabaseService` (kini) dan
#       `supabaseAs(userJwt)` (anon key + header Authorization).
# - [ ] Ganti per-route: query milik-pengguna via supabaseAs; job sistem
#       (agregat lintas pakar, cleanup) tetap service.
# - [ ] Tulis policy per tabel (contoh di 2025100101_rls.sql), apply, uji
#       matriks: creator lihat miliknya; pakar lihat case undangannya;
#       anonim 0 baris (buktikan via REST + anon key manual).
#
# Fase 3 — Cutover + kunci
# - [ ] Hapus token aplikasi; satu JWT (Supabase) untuk semua.
# - [ ] Monitor 401/403 seminggu; rollback = kembali ke client service
#       (satu commit revert, RLS deny-by-default tetap melindungi anon).
#
# Estimasi: Fase 1 setengah hari, Fase 2 dua-tiga hari (matriks uji),
# Fase 3 setengah hari. Jangan mulai sebelum monetisasi butuh multi-tenant
# keras (misal: API publik / akses DB langsung dari klien).
