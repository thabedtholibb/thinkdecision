# Think Decision — Multi-Expert MCDM Decision Support System

Platform pengambilan keputusan multi-kriteria multi-pakar dengan metode **AHP, Fuzzy AHP, ANP, Fuzzy ANP, dan ISM** (MICMAC tersedia sebagai analisis turunan dari case ISM yang sudah selesai, bukan metode yang dipilih terpisah).

## Struktur Repo

```
backend/    Node.js/Express + Supabase — REST API di /api/v1 (port 3000)
frontend/   React (no-build, Babel standalone) — DecideAI.html (port 8000)
```

## Menjalankan

Cara cepat (Windows):

```powershell
.\start-all.ps1
```

Atau manual:

```powershell
# Backend
cd backend
npm install        # sekali saja
npm start          # http://localhost:3000  (health check: /health)

# Frontend (terminal terpisah)
cd frontend
python -m http.server 8000
# buka http://localhost:8000/DecideAI.html
```

Konfigurasi backend ada di `backend/.env` (salin dari `backend/.env.example` dan isi):
Supabase URL + service key (project Supabase sendiri, lalu jalankan migrasi di `supabase/migrations/` lewat SQL editor Supabase, berurutan sesuai nama file), `JWT_SECRET` (random 32+ karakter), `CORS_ORIGIN=http://localhost:8000`.

## Fitur

- **Multi-Expert** — creator mengundang pakar; setiap pakar menilai secara independen
- **5 Metode MCDM** — AHP, Fuzzy AHP (TFN + Chang's extent analysis), ANP, Fuzzy ANP, ISM; MICMAC otomatis dari ISM yang selesai
- **Agregasi otomatis** — geometric mean (AIJ) antar pakar untuk AHP/ANP; voting mayoritas antar pakar untuk ISM
- **Consistency Ratio** — dihitung otomatis per pakar per level (AHP/ANP); konsensus antar-pakar untuk ISM
- **Hasil & ranking** — bobot kriteria, skor alternatif, rekomendasi, analisis sensitivitas
- **Analytics & audit log** — dashboard analitik dan jejak aktivitas

## Akun pertama (belum ada data)

Database baru tidak punya akun. Daftarkan creator pertama lewat API (atau form register di UI):

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"name":"Nama Anda","institution":"Institusi Anda","email":"creator@example.com","password":"minimal6karakter","defaultMethod":"AHP"}'
```

`-c cookies.txt` menyimpan sesi (httpOnly cookie) supaya dipakai di request berikutnya. Login sebagai creator yang sama lewat UI (`http://localhost:8000/DecideAI.html`) pakai email/password di atas, buat case, lalu undang pakar dari dashboard creator — setiap undangan menghasilkan password sementara yang dipakai pakar untuk login pertama kali (ditampilkan sekali di response/UI, tidak dikirim email karena belum ada layanan email).

## API

Dokumentasi Swagger: `http://localhost:3000/api/docs` saat backend berjalan.
Semua endpoint berada di bawah `/api/v1` (auth, cases, experts, judgments, results, analytics, notifications).

## Lisensi

MIT — lihat [LICENSE](LICENSE).
