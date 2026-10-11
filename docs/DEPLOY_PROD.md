# Deploy Produksi ThinkDecision (single host + Docker)

Checklist sebelum `docker compose up`. Bahasa: Indonesia.

## 0. Prasyarat

- Docker + Compose plugin, domain + TLS (reverse proxy di depan compose;
  port compose hanya bind loopback `127.0.0.1`).
- Project Supabase **staging** (untuk uji migrasi) dan **produksi**.
- Backup DB produksi terbaru dan sudah uji restore sekali.

## 1. Env backend (`backend/.env`) — JANGAN commit

```ini
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>
JWT_SECRET=<96-hex-dari-crypto.randomBytes(48)>   # min 32 char, enforced server.js
PORT=3000
CORS_ORIGIN=https://<frontend-host>               # persis, tanpa trailing slash
NODE_ENV=production                                # cookie Secure → butuh HTTPS
REDIS_URL=redis://redis:6379                      # WAJIB di prod (denylist refresh token)
DOCS_ENABLED=false                                # matikan /api/docs + openapi.json
```

## 2. Build + start

```powershell
# dari folder thinkdecision/
$env:API_URL = "https://<backend-host>/api/v1"   # URL publik backend
docker compose --env-file backend/.env up -d --build
docker compose ps
curl http://localhost:3000/health                 # status healthy/degraded, bukan critical
curl http://localhost:8000/DecideAI.html          # 200
```

## 3. Verifikasi pasca-deploy

1. `GET /api/docs` → 404 (docs mati).
2. Register + login creator → cookie `Secure; HttpOnly; SameSite=Lax`.
3. Logout → refresh token lama ditolak (denylist Redis).
4. Buka satu case AHP lama → hasil sama seperti staging.
5. Cek log: `docker compose logs backend --tail 50` — tanpa secret/token.

## 4. Migrasi DB (manual, via SQL editor Supabase)

1. Backup dulu (Database → Backups / ekspor CSV `cases`, `users` bila paket gratis).
2. Jalankan STEP 0 di header file migrasi; lanjut hanya bila 0 baris asing.
3. Apply file `supabase/migrations/2025100*.sql` berurutan di **staging** dulu,
   lalu `supabase/verifikasi.sql` per bagian.
4. Ulangi di produksi di jam sepi. Rollback: bagian ROLLBACK di tiap file,
   urutan atas→bawah (belum ada runner migrasi — itu tech debt tercatat).

## 5. Operasional

- Log: file `logs/` di container (ephemeral) — tail via
  `docker compose logs`; agregator log/Sentry belum ada (tech debt).
- Restart policy `unless-stopped`; healthcheck 30s menandai container sakit.
- Rotate `JWT_SECRET` = semua user login ulang (komunikasikan dulu).
- Belum ada: rate-limit tuning berbasis trafik nyata, E2E prod, load test,
  CSRF token, verifikasi email, precompile frontend (Babel/Tailwind CDN
  masih dipakai — lihat blocker audit).
