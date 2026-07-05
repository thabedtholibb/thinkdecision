# Think Decision — Multi-Expert MCDM Decision Support System

Platform pengambilan keputusan multi-kriteria multi-pakar dengan metode **AHP, Fuzzy AHP, ANP, dan Fuzzy ANP**.

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

Konfigurasi backend ada di `backend/.env` (lihat `backend/.env.example`):
Supabase URL + service key, `JWT_SECRET`, `CORS_ORIGIN=http://localhost:8000`.

## Fitur

- **Multi-Expert** — creator mengundang pakar; setiap pakar menilai secara independen
- **4 Metode MCDM** — AHP, Fuzzy AHP (TFN + Chang's extent analysis), ANP, Fuzzy ANP
- **Agregasi otomatis** — geometric mean (AIJ) antar pakar
- **Consistency Ratio** — dihitung otomatis per pakar per level
- **Hasil & ranking** — bobot kriteria, skor alternatif, rekomendasi, analisis sensitivitas
- **Analytics & audit log** — dashboard analitik dan jejak aktivitas

## API

Dokumentasi Swagger: `http://localhost:3000/api/docs` saat backend berjalan.
Semua endpoint berada di bawah `/api/v1` (auth, cases, experts, judgments, results, analytics, notifications).
