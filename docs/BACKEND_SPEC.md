# Think Decision — Backend Design Spec

> **Status:** Approved  
> **Date:** 2026-04-27  
> **Stack:** Python 3.11 + FastAPI + SQLAlchemy (async) + Supabase PostgreSQL  
> **Scope:** AHP multi-expert MCDM platform (dengan scalability ke ANP, Fuzzy AHP, Fuzzy ANP)

---

## 1. Arsitektur Sistem

### Overview

Think Decision adalah platform MCDM (Multi-Criteria Decision Making) berbasis web yang mengakomodasi kolaborasi beberapa pakar secara independen. Creator membuat kasus AHP, mengundang pakar, dan mengagregasi hasil secara otomatis — mengatasi keterbatasan Super Decision yang mensyaratkan agregasi manual.

### Stack

| Layer | Teknologi |
|---|---|
| Backend Framework | FastAPI 0.111+ (async) |
| ORM | SQLAlchemy 2.0 (async) + asyncpg |
| Migrations | Alembic |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (JWT email+password) |
| Kalkulasi | NumPy 1.26+, SciPy 1.12+ |
| Email Undangan | Supabase SMTP / Resend |
| Frontend | Next.js 14 (App Router) — konsumsi REST API |
| Testing | pytest + pytest-asyncio + httpx |

### Struktur Direktori

```
think-decision/
├── backend/
│   ├── app/
│   │   ├── main.py                   # FastAPI app entry point
│   │   ├── config.py                 # Settings via pydantic-settings
│   │   ├── database.py               # Async SQLAlchemy engine & session
│   │   ├── dependencies.py           # FastAPI dependencies (auth, db session)
│   │   ├── models/                   # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── case.py
│   │   │   ├── criteria.py
│   │   │   ├── alternative.py
│   │   │   ├── expert_invite.py
│   │   │   ├── comparison.py
│   │   │   └── aggregated_result.py
│   │   ├── schemas/                  # Pydantic request/response schemas
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── case.py
│   │   │   ├── criteria.py
│   │   │   ├── alternative.py
│   │   │   ├── expert.py
│   │   │   ├── comparison.py
│   │   │   └── result.py
│   │   ├── routers/                  # FastAPI routers per domain
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── cases.py
│   │   │   ├── criteria.py
│   │   │   ├── alternatives.py
│   │   │   ├── experts.py
│   │   │   ├── comparisons.py
│   │   │   └── results.py
│   │   └── core/                     # Business logic & kalkulasi
│   │       ├── __init__.py
│   │       ├── ahp/
│   │       │   ├── __init__.py
│   │       │   ├── matrix.py         # Validasi & normalisasi matriks
│   │       │   ├── priority.py       # Priority vector (eigenvector method)
│   │       │   ├── consistency.py    # CI, CR, Random Index table
│   │       │   ├── aggregation.py    # GMJ dan GMP
│   │       │   └── hierarchy.py      # Rekursif global weight dari tree
│   │       └── utils/
│   │           ├── __init__.py
│   │           └── matrix_utils.py   # Helper konversi JSONB ↔ numpy array
│   ├── migrations/
│   │   ├── env.py
│   │   └── versions/
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_cases.py
│   │   ├── test_comparisons.py
│   │   └── core/
│   │       ├── test_matrix.py
│   │       ├── test_priority.py
│   │       ├── test_consistency.py
│   │       ├── test_aggregation.py
│   │       └── test_hierarchy.py
│   ├── .env.example
│   ├── pyproject.toml
│   └── alembic.ini
├── frontend/                         # Next.js 14 (scope terpisah)
├── docs/
│   ├── BACKEND_SPEC.md               # File ini
│   └── BACKEND_PLAN.md               # Implementation plan
└── docker-compose.yml
```

---

## 2. Database Schema

### Enum Types

```sql
-- Method yang didukung (scalable untuk ANP, Fuzzy)
CREATE TYPE decision_method AS ENUM ('AHP', 'ANP', 'FUZZY_AHP', 'FUZZY_ANP');

-- Metode agregasi antar pakar
CREATE TYPE aggregation_method AS ENUM ('GMJ', 'GMP');

-- Status kasus
CREATE TYPE case_status AS ENUM ('draft', 'active', 'closed');

-- Status undangan pakar
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'completed');

-- Role pengguna
CREATE TYPE user_role AS ENUM ('creator', 'expert');
```

### Tabel

#### `users`
```sql
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT UNIQUE NOT NULL,
    full_name   TEXT NOT NULL,
    role        user_role NOT NULL DEFAULT 'creator',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

> **Catatan:** `id` di-sync dengan Supabase Auth `user.id` untuk single source of truth.

#### `cases`
```sql
CREATE TABLE cases (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title               TEXT NOT NULL,
    description         TEXT,
    method              decision_method NOT NULL DEFAULT 'AHP',
    aggregation_method  aggregation_method NOT NULL DEFAULT 'GMJ',
    status              case_status NOT NULL DEFAULT 'draft',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `criteria`
```sql
CREATE TABLE criteria (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id     UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    parent_id   UUID REFERENCES criteria(id) ON DELETE CASCADE,  -- NULL = level 1
    label       TEXT NOT NULL,
    description TEXT,
    level       INTEGER NOT NULL DEFAULT 1,   -- 1 = kriteria utama, 2 = sub-kriteria
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

> **Scalability ANP:** Kolom `parent_id` + `level` cukup untuk AHP tree. Untuk ANP, tabel `clusters` dan `network_connections` akan ditambahkan sebagai tabel baru tanpa mengubah schema ini.

#### `alternatives`
```sql
CREATE TABLE alternatives (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id     UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    label       TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `expert_invites`
```sql
CREATE TABLE expert_invites (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id     UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    expert_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status      invite_status NOT NULL DEFAULT 'pending',
    invited_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    UNIQUE(case_id, expert_id)
);
```

#### `comparisons`
```sql
CREATE TABLE comparisons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    expert_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- node_type: 'criteria' (antar kriteria) | 'alternative' (antar alternatif per kriteria)
    node_type       TEXT NOT NULL CHECK (node_type IN ('criteria', 'alternative')),
    -- parent_id: NULL jika node_type='criteria' level 1
    -- UUID criteria jika node_type='criteria' (sub-kriteria) atau 'alternative'
    parent_id       UUID,
    -- value_matrix: matriks n×n sebagai array 2D
    -- AHP: [[1, 3, 0.333], [0.333, 1, 0.2], [3, 5, 1]]
    -- Fuzzy AHP (future): [[(1,1,1),(2,3,4),...], ...]
    value_matrix    JSONB NOT NULL,
    priority_vector JSONB,             -- hasil kalkulasi, disimpan untuk cache
    cr              FLOAT,             -- Consistency Ratio
    is_consistent   BOOLEAN,          -- CR <= 0.1
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(case_id, expert_id, node_type, parent_id)
);
```

#### `aggregated_results`
```sql
CREATE TABLE aggregated_results (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id                 UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    aggregation_method_used aggregation_method NOT NULL,
    -- global_weights: {alternative_id: weight, ...}
    global_weights          JSONB NOT NULL,
    -- criteria_weights: nested {criteria_id: {weight, children: {...}}}
    criteria_weights        JSONB NOT NULL,
    -- expert_priorities: {expert_id: {node_key: priority_vector}}
    expert_priorities       JSONB NOT NULL,
    aggregate_cr            FLOAT,
    computed_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(case_id)  -- satu hasil per kasus, di-overwrite jika re-aggregate
);
```

---

## 3. Authentication & Authorization

### Flow

1. Creator register via `POST /auth/register` → Supabase Auth membuat user → sync ke tabel `users`
2. Expert diundang via email oleh creator → Expert register/login → invite di-accept
3. Semua endpoint dilindungi JWT Bearer token dari Supabase Auth
4. Role-based access control via `user.role` di tabel `users`

### Middleware Rules

| Endpoint Prefix | Role yang Diizinkan |
|---|---|
| `/cases/*` (write) | creator |
| `/cases/{id}/experts/*` | creator (owner kasus) |
| `/expert/*` | expert (yang diundang ke kasus) |
| `/cases/{id}/results` (read) | creator (owner) + expert (invited) |
| `/cases/{id}/aggregate` | creator (owner) |

---

## 4. API Endpoints

### Auth

```
POST /auth/register          Body: {email, password, full_name, role}
POST /auth/login             Body: {email, password} → {access_token, user}
POST /auth/logout
GET  /auth/me                → {user}
```

### Cases (Creator)

```
POST   /cases                Body: {title, description, method, aggregation_method}
GET    /cases                Query: ?status=active → [{case}]
GET    /cases/{id}           → {case + criteria_tree + alternatives + experts}
PATCH  /cases/{id}           Body: partial case fields
DELETE /cases/{id}           Soft delete (status → 'closed')
PATCH  /cases/{id}/status    Body: {status: 'active'|'closed'}
```

### Criteria (Creator)

```
POST   /cases/{id}/criteria          Body: {label, description, parent_id?, order_index}
GET    /cases/{id}/criteria          → [{criteria tree}]  (nested)
PATCH  /criteria/{criteria_id}       Body: {label?, description?, order_index?}
DELETE /criteria/{criteria_id}       Cascade delete sub-kriteria
```

### Alternatives (Creator)

```
POST   /cases/{id}/alternatives      Body: {label, description, order_index}
GET    /cases/{id}/alternatives      → [{alternative}]
PATCH  /alternatives/{alt_id}        Body: {label?, description?, order_index?}
DELETE /alternatives/{alt_id}
```

### Expert Management (Creator)

```
POST   /cases/{id}/experts           Body: {email}  → cari/buat user + kirim undangan
GET    /cases/{id}/experts           → [{expert + status + progress%}]
DELETE /cases/{id}/experts/{exp_id}  → cabut undangan (hanya jika pending)
```

### Scoring (Expert)

```
GET    /expert/cases                         → list kasus yang diundang + status
GET    /expert/cases/{id}                    → detail kasus + semua matriks yang harus diisi
POST   /expert/cases/{id}/comparisons        Body: {node_type, parent_id?, value_matrix}
GET    /expert/cases/{id}/comparisons        → semua matriks yang sudah disubmit
PATCH  /expert/cases/{id}/comparisons/{cid}  Body: {value_matrix} → recalculate CR
```

### Results

```
GET  /cases/{id}/progress      → {total_experts, completed, per_expert: [{...}]}
POST /cases/{id}/aggregate     → trigger kalkulasi → simpan aggregated_results
GET  /cases/{id}/results       → {global_weights, criteria_weights, ranking, cr}
GET  /cases/{id}/results/export  Query: ?format=json|csv
```

---

## 5. Modul Kalkulasi AHP (`app/core/ahp/`)

### `matrix.py` — Validasi & Normalisasi

```python
def validate_matrix(matrix: list[list[float]]) -> tuple[bool, str]:
    """
    Validasi matriks PCM (Pairwise Comparison Matrix):
    - Square (n×n)
    - Diagonal = 1.0
    - Reciprocal: matrix[i][j] = 1 / matrix[j][i]
    - Positive values only
    - n >= 2
    Returns (is_valid, error_message)
    """

def normalize_matrix(matrix: np.ndarray) -> np.ndarray:
    """Normalisasi kolom: bagi tiap elemen dengan jumlah kolomnya."""
```

> **Scalability Fuzzy:** Parameter `fuzzy: bool = False` akan ditambahkan. Jika True, matrix berisi triplet `(l, m, u)` dan normalisasi menggunakan fuzzy arithmetic.

### `priority.py` — Priority Vector

```python
def compute_priority_vector(matrix: np.ndarray) -> np.ndarray:
    """
    Hitung priority vector via normalized column average.
    Output: 1D array panjang n, sum = 1.0
    """
```

### `consistency.py` — Consistency Ratio

```python
# Random Index table (Saaty)
RI_TABLE = {1: 0.0, 2: 0.0, 3: 0.58, 4: 0.90, 5: 1.12,
            6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49}

def compute_lambda_max(matrix: np.ndarray, priority_vector: np.ndarray) -> float:
    """Hitung λmax dari Aw / w."""

def compute_ci(lambda_max: float, n: int) -> float:
    """CI = (λmax - n) / (n - 1)"""

def compute_cr(ci: float, n: int) -> float:
    """CR = CI / RI[n]. CR <= 0.1 → konsisten."""

def check_consistency(matrix: np.ndarray) -> dict:
    """
    Returns: {lambda_max, ci, cr, is_consistent, priority_vector}
    """
```

### `aggregation.py` — Agregasi Multi-Pakar

```python
def aggregate_gmj(matrices: list[np.ndarray]) -> np.ndarray:
    """
    Geometric Mean of Judgments:
    Tiap sel = geometric mean dari sel yang sama di semua pakar.
    matrix_agg[i][j] = (prod(m[i][j] for m in matrices)) ^ (1/k)
    k = jumlah pakar
    """

def aggregate_gmp(priority_vectors: list[np.ndarray]) -> np.ndarray:
    """
    Geometric Mean of Priorities:
    priority_agg[i] = (prod(pv[i] for pv in priority_vectors)) ^ (1/k)
    Hasil dinormalisasi kembali sehingga sum = 1.0
    """
```

### `hierarchy.py` — Global Weights

```python
def build_criteria_tree(criteria_rows: list[dict]) -> dict:
    """
    Konversi flat list criteria dari DB ke nested tree dict.
    {id: {label, children: {id: {...}}, level}}
    """

def compute_global_weights(
    criteria_tree: dict,
    comparisons_by_node: dict,  # {parent_id_or_None: aggregated_priority_vector}
    alternative_comparisons: dict,  # {criteria_id: aggregated_priority_vector}
) -> dict:
    """
    Rekursif kalkulasi global weight tiap alternatif.
    Global weight alternatif = sum(local_weight_kriteria × priority_alternatif_per_kriteria)
    Returns: {alternative_id: global_weight}
    """
```

---

## 6. Alur Lengkap: Creator → Pakar → Agregasi

```
1. Creator register & login
2. Creator POST /cases → buat kasus (method=AHP, aggregation=GMJ)
3. Creator POST /cases/{id}/criteria → tambah kriteria & sub-kriteria (tree)
4. Creator POST /cases/{id}/alternatives → tambah alternatif
5. Creator PATCH /cases/{id}/status {status: 'active'} → buka kasus untuk pakar
6. Creator POST /cases/{id}/experts {email} → undang pakar (kirim email)
7. Pakar register/login → GET /expert/cases → lihat kasus
8. Pakar POST /expert/cases/{id}/comparisons → submit matriks satu per satu
   - node_type='criteria', parent_id=null → matriks antar kriteria level 1
   - node_type='criteria', parent_id={crit_id} → matriks antar sub-kriteria
   - node_type='alternative', parent_id={crit_id} → matriks antar alternatif per kriteria
   - Setiap submit → backend auto-hitung CR → return {cr, is_consistent}
9. Ketika semua matriks disubmit → invite status → 'completed'
10. Creator GET /cases/{id}/progress → pantau berapa pakar selesai
11. Creator POST /cases/{id}/aggregate → trigger agregasi
    - Kumpulkan semua matriks dari pakar yang 'completed'
    - Jalankan GMJ atau GMP sesuai setting kasus
    - Hitung global weights secara rekursif
    - Simpan ke aggregated_results
12. Creator & Pakar GET /cases/{id}/results → lihat ranking & bobot
```

---

## 7. Scalability Roadmap

### Menambahkan Fuzzy AHP
- `value_matrix` di `comparisons` sudah JSONB → simpan triplet `(l, m, u)` tanpa migrasi
- Tambah `app/core/fuzzy_ahp/` dengan modul identik tapi operasi fuzzy arithmetic
- Tambah enum `FUZZY_AHP` di `decision_method` (sudah ada)
- Router dan schema tidak berubah — hanya logic kalkulasi di `core/`

### Menambahkan ANP
- Tambah tabel `clusters` dan `network_connections` (tidak mengubah tabel existing)
- `comparisons.node_type` di-extend dengan value baru: `'cluster'`
- Tambah `app/core/anp/` dengan supermatrix computation
- Enum `ANP` di `decision_method` sudah ada

### Menambahkan Fuzzy ANP
- Kombinasi dari dua extension di atas
- Tambah `app/core/fuzzy_anp/`

---

## 8. Environment Variables

```env
# .env.example
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql+asyncpg://postgres:password@db.supabase.co:5432/postgres
SECRET_KEY=your-secret-key-for-jwt
ENVIRONMENT=development
CORS_ORIGINS=["http://localhost:3000"]
```

---

## 9. Conventions

- Semua endpoint return `{"data": ..., "message": "..."}` untuk konsistensi
- Error response: `{"detail": "pesan error", "code": "ERROR_CODE"}`
- UUID sebagai primary key di semua tabel
- `updated_at` diupdate via SQLAlchemy `onupdate`
- Soft delete via status field, bukan `DELETE` SQL
- Semua kalkulasi di `core/` adalah **pure functions** (stateless, no DB access) → mudah di-test dan di-reuse
- CR > 0.1 tidak di-block submit (pakar tetap bisa submit) tapi di-flag `is_consistent=False` → creator bisa minta revisi
