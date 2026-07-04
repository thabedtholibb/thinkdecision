# Think Decision — Frontend Design Spec

> **Status:** Approved  
> **Date:** 2026-04-27  
> **Stack:** Next.js 14 (App Router) + Shadcn/ui + TanStack Query + Tailwind CSS  
> **Design System:** DESIGN.md (Wise-inspired — lime green, near-black, Inter + Wise Sans)

---

## 1. Arsitektur Frontend

### Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 14 (App Router) |
| UI Components | Shadcn/ui (customized sesuai DESIGN.md) |
| Styling | Tailwind CSS |
| State & Fetching | TanStack Query v5 |
| Auth State | React Context + localStorage |
| HTTP Client | fetch (native, wrapped di `lib/api.ts`) |
| Font | Inter (Google Fonts) + Wise Sans (lokal/fallback) |
| Icons | Lucide React |
| Form | React Hook Form + Zod |
| Charts | Recharts (untuk hasil ranking) |

### Struktur Direktori

```
frontend/
├── app/
│   ├── layout.tsx                    # Root layout (font, providers)
│   ├── page.tsx                      # Landing page
│   ├── (auth)/
│   │   ├── login/page.tsx            # Login creator & expert
│   │   └── register/page.tsx         # Register creator
│   ├── (creator)/
│   │   ├── layout.tsx                # Creator layout (sidebar nav)
│   │   ├── dashboard/page.tsx        # List semua kasus
│   │   ├── cases/
│   │   │   ├── new/page.tsx          # Buat kasus baru
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Case detail (redirect ke tab)
│   │   │       ├── criteria/page.tsx # Tab kriteria
│   │   │       ├── alternatives/page.tsx
│   │   │       ├── experts/page.tsx
│   │   │       ├── progress/page.tsx
│   │   │       └── results/page.tsx
│   └── (expert)/
│       ├── layout.tsx                # Expert layout
│       ├── dashboard/page.tsx        # List kasus yang diundang
│       └── cases/
│           └── [id]/
│               ├── page.tsx          # Detail kasus + scoring
│               └── compare/[node]/page.tsx  # Halaman isi matriks
├── components/
│   ├── ui/                           # Shadcn/ui components (auto-generated)
│   ├── layout/
│   │   ├── Navbar.tsx                # Top navigation bar
│   │   ├── Sidebar.tsx               # Creator sidebar
│   │   └── PageHeader.tsx            # Judul halaman + breadcrumb
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── cases/
│   │   ├── CaseCard.tsx              # Card kasus di dashboard
│   │   ├── CaseStatusBadge.tsx       # Badge draft/active/closed
│   │   ├── CreateCaseForm.tsx
│   │   └── CaseTabs.tsx              # Tab navigator per kasus
│   ├── criteria/
│   │   ├── CriteriaTree.tsx          # Tree view kriteria
│   │   ├── CriteriaNode.tsx          # Satu node di tree
│   │   └── AddCriteriaForm.tsx
│   ├── alternatives/
│   │   ├── AlternativeList.tsx
│   │   └── AddAlternativeForm.tsx
│   ├── experts/
│   │   ├── ExpertList.tsx
│   │   ├── ExpertProgressCard.tsx    # Progress bar per pakar
│   │   └── InviteExpertForm.tsx
│   ├── comparison/
│   │   ├── MatrixInput.tsx           # Input matriks perbandingan
│   │   ├── MatrixCell.tsx            # Satu sel matriks (Saaty scale)
│   │   └── ConsistencyBadge.tsx      # CR badge (hijau/merah)
│   └── results/
│       ├── RankingTable.tsx          # Tabel ranking alternatif
│       ├── RankingChart.tsx          # Bar chart hasil
│       └── CriteriaWeightTree.tsx    # Bobot kriteria visual
├── lib/
│   ├── api.ts                        # API client (fetch wrapper + auth header)
│   ├── auth.ts                       # Auth context & hooks
│   └── utils.ts                      # cn(), format helpers
├── hooks/
│   ├── useCases.ts                   # TanStack Query hooks untuk cases
│   ├── useCriteria.ts
│   ├── useAlternatives.ts
│   ├── useExperts.ts
│   ├── useComparisons.ts
│   └── useResults.ts
├── types/
│   └── index.ts                      # TypeScript types dari API response
├── styles/
│   └── globals.css                   # Tailwind base + CSS variables DESIGN.md
├── .env.local
├── next.config.ts
├── tailwind.config.ts
└── components.json                   # Shadcn config
```

---

## 2. Design System Implementation

### CSS Variables (globals.css)

```css
:root {
  --color-near-black: #0e0f0c;
  --color-wise-green: #9fe870;
  --color-dark-green: #163300;
  --color-light-mint: #e2f6d5;
  --color-pastel-green: #cdffad;
  --color-warm-dark: #454745;
  --color-gray: #868685;
  --color-light-surface: #e8ebe6;
  --color-positive: #054d28;
  --color-danger: #d03238;
  --color-warning: #ffd11a;
  --font-display: 'Wise Sans', 'Inter', sans-serif;
  --font-body: 'Inter', 'Helvetica', 'Arial', sans-serif;
}
```

### Tailwind Config Extension

```js
// tailwind.config.ts
extend: {
  colors: {
    'near-black': '#0e0f0c',
    'wise-green': '#9fe870',
    'dark-green': '#163300',
    'light-mint': '#e2f6d5',
    'warm-dark': '#454745',
    'td-gray': '#868685',
  },
  borderRadius: {
    'pill': '9999px',
    'card-sm': '16px',
    'card-md': '30px',
    'card-lg': '40px',
  },
  fontWeight: {
    'black': '900',
  }
}
```

### Komponen Kunci

**Button Primary (Wise Green Pill)**
```tsx
// Semua primary button menggunakan class ini
className="bg-wise-green text-dark-green font-semibold px-4 py-1.5 rounded-pill 
           transition-transform hover:scale-105 active:scale-95 
           font-feature-settings-calt"
```

**Card**
```tsx
className="rounded-card-md border border-black/10 bg-white p-6"
// Shadow: shadow-[rgba(14,15,12,0.12)_0px_0px_0px_1px]
```

---

## 3. Halaman & Alur

### Landing Page (`/`)
- Hero section: headline besar Wise Sans 900, tagline, 2 CTA (Login Creator / Login Pakar)
- Fitur utama: 3 card (Multi-Expert, Auto Agregasi, Konsistensi CR)
- Footer minimal

### Auth Pages (`/login`, `/register`)
- Dua tab di halaman login: **Creator** | **Pakar**
- Creator login redirect → `/dashboard`
- Expert login redirect → `/expert/dashboard`
- Register hanya untuk Creator (Expert didaftarkan via undangan)

### Creator Dashboard (`/dashboard`)
- List CaseCard dengan status badge
- Filter bar: All / Draft / Active / Closed
- Tombol "Buat Kasus Baru" (primary green pill)
- Empty state dengan ilustrasi

### Case Detail (`/cases/[id]/*`)
- Header: judul kasus, status badge, tombol ubah status
- Tab navigator: Kriteria | Alternatif | Pakar | Progress | Hasil

#### Tab Kriteria
- Tree view hierarki kriteria
- Tombol tambah kriteria level 1
- Setiap node: tombol tambah sub-kriteria, edit, delete
- Drag handle untuk reorder (order_index)

#### Tab Alternatif
- List card alternatif
- Tambah, edit, delete inline

#### Tab Pakar
- Input email + tombol Undang
- List ExpertProgressCard per pakar:
  - Nama, email, status badge
  - Progress bar (submitted/required)
  - Persentase progress
  - Tombol hapus (hanya pending)

#### Tab Progress
- Summary card: total/completed/pending/accepted
- Progress ring besar (completion_percent)
- Tombol **Agregasi** (aktif jika ≥1 pakar completed)

#### Tab Hasil
- Tabel ranking dengan bar visual per baris
- Bar chart Recharts horizontal
- Bobot kriteria per level
- Info: metode agregasi, jumlah pakar, waktu hitung
- Tombol Export CSV

### Expert Dashboard (`/expert/dashboard`)
- List kasus yang diundang
- Status badge per kasus (pending/accepted/completed)
- Klik → masuk ke halaman scoring

### Expert Case Scoring (`/expert/cases/[id]`)
- Daftar semua matriks yang harus diisi (checklist)
- Progress bar personal
- Klik matriks → `/expert/cases/[id]/compare/[node]`

### Expert Compare Page (`/expert/cases/[id]/compare/[node]`)
- Judul: "Perbandingan Kriteria" atau "Perbandingan Alternatif untuk [Kriteria]"
- MatrixInput component:
  - Label baris & kolom (nama kriteria/alternatif)
  - Input nilai Saaty 1-9 (atau 1/9 - 1/2)
  - Reciprocal auto-fill
  - Tombol Submit
- Setelah submit: tampilkan CR badge, priority vector
- Navigasi ke matriks berikutnya

---

## 4. API Integration

### API Client (`lib/api.ts`)

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Request failed');
  }
  return res.json();
}
```

### TanStack Query Hooks Pattern

```typescript
// hooks/useCases.ts
export function useCases() {
  return useQuery({ queryKey: ['cases'], queryFn: () => apiFetch('/cases') });
}

export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiFetch('/cases', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases'] }),
  });
}
```

---

## 5. TypeScript Types (`types/index.ts`)

```typescript
export type UserRole = 'creator' | 'expert';
export type DecisionMethod = 'AHP' | 'ANP' | 'FUZZY_AHP' | 'FUZZY_ANP';
export type AggregationMethod = 'GMJ' | 'GMP';
export type CaseStatus = 'draft' | 'active' | 'closed';
export type InviteStatus = 'pending' | 'accepted' | 'completed';

export interface User { id: string; email: string; full_name: string; role: UserRole; }
export interface AuthResponse { access_token: string; token_type: string; user: User; }
export interface Case { id: string; creator_id: string; title: string; description?: string; method: DecisionMethod; aggregation_method: AggregationMethod; status: CaseStatus; created_at: string; updated_at: string; }
export interface Criteria { id: string; case_id: string; parent_id?: string; label: string; description?: string; level: number; order_index: number; children: Criteria[]; }
export interface Alternative { id: string; case_id: string; label: string; description?: string; order_index: number; }
export interface ExpertProgress { expert_id: string; email: string; full_name: string; status: InviteStatus; invited_at: string; accepted_at?: string; completed_at?: string; comparisons_submitted: number; comparisons_required: number; progress_percent: number; }
export interface Comparison { id: string; case_id: string; expert_id: string; node_type: string; parent_id?: string; value_matrix: number[][]; priority_vector?: number[]; cr?: number; is_consistent?: boolean; submitted_at: string; }
export interface RankingItem { rank: number; alternative_id: string; alternative_label: string; global_weight: number; percentage: number; }
export interface AggregatedResult { case_id: string; aggregation_method_used: AggregationMethod; ranking: RankingItem[]; criteria_weights: Record<string, number>; aggregate_cr?: number; computed_at: string; experts_included: number; }
```

---

## 6. Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 7. Scalability Notes

- Komponen `MatrixInput` dirancang generic — bisa menerima fuzzy triplet `(l,m,u)` via prop `mode='fuzzy'` di masa depan
- `DecisionMethod` enum sudah include `ANP`, `FUZZY_AHP`, `FUZZY_ANP` — UI tinggal enable tab/flow baru
- Semua query key di TanStack Query menggunakan `[entity, id]` pattern — mudah di-invalidate saat data berubah
