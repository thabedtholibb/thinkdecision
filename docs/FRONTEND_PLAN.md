# Think Decision Frontend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun frontend Next.js 14 untuk Think Decision yang terhubung ke backend FastAPI, dengan design system terinspirasi Wise (lime green, near-black, Inter).

**Architecture:** Next.js 14 App Router dengan route groups `(auth)`, `(creator)`, `(expert)`. TanStack Query untuk semua data fetching. Shadcn/ui sebagai base komponen yang di-override dengan DESIGN.md tokens.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui, TanStack Query v5, React Hook Form, Zod, Recharts, Lucide React

**Referensi penting:**
- `docs/FRONTEND_SPEC.md` — spec ini
- `docs/DESIGN.md` — design system (warna, tipografi, komponen)
- `API_INTEGRATION_GUIDE.md` — semua endpoint + contoh response
- `FRONTEND_INTEGRATION_CHECKLIST.md` — checklist implementasi

---

## Task 1: Project Setup Next.js + Tailwind + Shadcn

**Files:**
- Create: `frontend/` (direktori baru)
- Create: `frontend/.env.local`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/styles/globals.css`
- Create: `frontend/components.json`

- [ ] **Step 1: Scaffold Next.js 14**

```bash
cd "C:\Apps\Think Decision"
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
cd frontend
```

Expected: folder `frontend/` terbuat dengan struktur Next.js 14 App Router.

- [ ] **Step 2: Install dependencies**

```bash
npm install @tanstack/react-query@5 react-hook-form zod @hookform/resolvers recharts lucide-react class-variance-authority clsx tailwind-merge
```

- [ ] **Step 3: Install Shadcn/ui**

```bash
npx shadcn@latest init
```

Pilih saat ditanya:
- Style: **Default**
- Base color: **Neutral**
- CSS variables: **Yes**

- [ ] **Step 4: Install Shadcn components yang dibutuhkan**

```bash
npx shadcn@latest add button card dialog form input label select tabs badge progress table toast separator dropdown-menu alert
```

- [ ] **Step 5: Buat `frontend/.env.local`**

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- [ ] **Step 6: Update `frontend/tailwind.config.ts`**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "near-black": "#0e0f0c",
        "wise-green": "#9fe870",
        "dark-green": "#163300",
        "light-mint": "#e2f6d5",
        "pastel-green": "#cdffad",
        "warm-dark": "#454745",
        "td-gray": "#868685",
        "light-surface": "#e8ebe6",
        "td-positive": "#054d28",
        "td-danger": "#d03238",
        "td-warning": "#ffd11a",
      },
      borderRadius: {
        pill: "9999px",
        "card-sm": "16px",
        "card-md": "30px",
        "card-lg": "40px",
      },
      fontFamily: {
        display: ["var(--font-display)", "Inter", "sans-serif"],
        body: ["var(--font-inter)", "Helvetica", "Arial", "sans-serif"],
      },
      boxShadow: {
        ring: "rgba(14,15,12,0.12) 0px 0px 0px 1px",
        "ring-green": "rgba(159,232,112,0.4) 0px 0px 0px 2px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

- [ ] **Step 7: Update `frontend/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');

:root {
  --font-inter: 'Inter', sans-serif;
  --font-display: 'Inter', sans-serif; /* fallback karena Wise Sans proprietary */
  --color-near-black: #0e0f0c;
  --color-wise-green: #9fe870;
  --color-dark-green: #163300;
  --color-light-mint: #e2f6d5;
  --color-warm-dark: #454745;
  --color-gray: #868685;
  --background: #ffffff;
  --foreground: #0e0f0c;
  --radius: 0.625rem;

  /* Shadcn override */
  --primary: 159 232 112;
  --primary-foreground: 22 51 0;
  --secondary: 226 246 213;
  --secondary-foreground: 14 15 12;
  --muted: 232 235 230;
  --muted-foreground: 134 134 133;
  --border: rgba(14, 15, 12, 0.12);
  --ring: 159 232 112;
}

* {
  font-feature-settings: "calt" 1;
}

body {
  color: var(--color-near-black);
  background: #ffffff;
  font-family: var(--font-inter);
  font-weight: 600;
}

h1, h2, h3, h4 {
  font-family: var(--font-display);
  font-weight: 900;
  line-height: 0.85;
  letter-spacing: normal;
}
```

- [ ] **Step 8: Commit**

```bash
git add frontend/
git commit -m "feat: Next.js 14 frontend setup with Tailwind and Shadcn/ui"
```

---

## Task 2: Types, API Client, Auth Context

**Files:**
- Create: `frontend/types/index.ts`
- Create: `frontend/lib/api.ts`
- Create: `frontend/lib/auth.tsx`
- Create: `frontend/lib/utils.ts`

- [ ] **Step 1: Buat `frontend/types/index.ts`**

```typescript
export type UserRole = 'creator' | 'expert';
export type DecisionMethod = 'AHP' | 'ANP' | 'FUZZY_AHP' | 'FUZZY_ANP';
export type AggregationMethod = 'GMJ' | 'GMP';
export type CaseStatus = 'draft' | 'active' | 'closed';
export type InviteStatus = 'pending' | 'accepted' | 'completed';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Case {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  method: DecisionMethod;
  aggregation_method: AggregationMethod;
  status: CaseStatus;
  created_at: string;
  updated_at: string;
}

export interface Criteria {
  id: string;
  case_id: string;
  parent_id?: string;
  label: string;
  description?: string;
  level: number;
  order_index: number;
  children: Criteria[];
}

export interface Alternative {
  id: string;
  case_id: string;
  label: string;
  description?: string;
  order_index: number;
}

export interface ExpertProgress {
  expert_id: string;
  email: string;
  full_name: string;
  status: InviteStatus;
  invited_at: string;
  accepted_at?: string;
  completed_at?: string;
  comparisons_submitted: number;
  comparisons_required: number;
  progress_percent: number;
}

export interface Comparison {
  id: string;
  case_id: string;
  expert_id: string;
  node_type: string;
  parent_id?: string;
  value_matrix: number[][];
  priority_vector?: number[];
  cr?: number;
  is_consistent?: boolean;
  submitted_at: string;
  updated_at: string;
}

export interface RankingItem {
  rank: number;
  alternative_id: string;
  alternative_label: string;
  global_weight: number;
  percentage: number;
}

export interface AggregatedResult {
  case_id: string;
  aggregation_method_used: AggregationMethod;
  ranking: RankingItem[];
  criteria_weights: Record<string, number>;
  aggregate_cr?: number;
  computed_at: string;
  experts_included: number;
}

export interface CaseProgress {
  total_experts: number;
  completed: number;
  pending: number;
  accepted: number;
  completion_percent: number;
}
```

- [ ] **Step 2: Buat `frontend/lib/api.ts`**

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Unauthorized');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new ApiError(res.status, error.detail || 'Request failed');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Auth
export const authApi = {
  register: (data: { email: string; password: string; full_name: string; role: string }) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => apiFetch('/auth/me'),
};

// Cases
export const casesApi = {
  list: (status?: string) => apiFetch(`/cases${status ? `?status=${status}` : ''}`),
  get: (id: string) => apiFetch(`/cases/${id}`),
  create: (data: object) => apiFetch('/cases', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: object) => apiFetch(`/cases/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) => apiFetch(`/cases/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  delete: (id: string) => apiFetch(`/cases/${id}`, { method: 'DELETE' }),
};

// Criteria
export const criteriaApi = {
  list: (caseId: string) => apiFetch(`/cases/${caseId}/criteria`),
  create: (caseId: string, data: object) => apiFetch(`/cases/${caseId}/criteria`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: object) => apiFetch(`/criteria/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/criteria/${id}`, { method: 'DELETE' }),
};

// Alternatives
export const alternativesApi = {
  list: (caseId: string) => apiFetch(`/cases/${caseId}/alternatives`),
  create: (caseId: string, data: object) => apiFetch(`/cases/${caseId}/alternatives`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: object) => apiFetch(`/alternatives/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/alternatives/${id}`, { method: 'DELETE' }),
};

// Experts
export const expertsApi = {
  list: (caseId: string) => apiFetch(`/cases/${caseId}/experts`),
  invite: (caseId: string, email: string) => apiFetch(`/cases/${caseId}/experts`, { method: 'POST', body: JSON.stringify({ email }) }),
  remove: (caseId: string, expertId: string) => apiFetch(`/cases/${caseId}/experts/${expertId}`, { method: 'DELETE' }),
};

// Expert comparisons
export const comparisonsApi = {
  listMyCases: () => apiFetch('/expert/cases'),
  getCaseDetail: (caseId: string) => apiFetch(`/expert/cases/${caseId}`),
  submit: (caseId: string, data: object) => apiFetch(`/expert/cases/${caseId}/comparisons`, { method: 'POST', body: JSON.stringify(data) }),
  list: (caseId: string) => apiFetch(`/expert/cases/${caseId}/comparisons`),
};

// Results
export const resultsApi = {
  progress: (caseId: string) => apiFetch(`/cases/${caseId}/progress`),
  aggregate: (caseId: string) => apiFetch(`/cases/${caseId}/aggregate`, { method: 'POST' }),
  get: (caseId: string) => apiFetch(`/cases/${caseId}/results`),
};
```

- [ ] **Step 3: Buat `frontend/lib/auth.tsx`**

```typescript
'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
```

- [ ] **Step 4: Update `frontend/lib/utils.ts`** (Shadcn sudah generate, tambahkan helpers)

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getCRColor(cr: number): string {
  if (cr <= 0.1) return 'text-td-positive';
  if (cr <= 0.2) return 'text-td-warning';
  return 'text-td-danger';
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    draft: 'bg-light-surface text-warm-dark',
    active: 'bg-light-mint text-dark-green',
    closed: 'bg-gray-100 text-td-gray',
    pending: 'bg-yellow-50 text-yellow-700',
    accepted: 'bg-light-mint text-dark-green',
    completed: 'bg-wise-green/20 text-dark-green',
  };
  return map[status] || 'bg-gray-100 text-td-gray';
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat: types, API client, auth context"
```

---

## Task 3: Root Layout & Providers

**Files:**
- Modify: `frontend/app/layout.tsx`
- Create: `frontend/components/providers.tsx`

- [ ] **Step 1: Buat `frontend/components/providers.tsx`**

```typescript
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from '@/components/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 30_000 },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Update `frontend/app/layout.tsx`**

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '900'],
});

export const metadata: Metadata = {
  title: 'Think Decision — Multi-Expert AHP Platform',
  description: 'Platform MCDM berbasis web untuk pengambilan keputusan multi-pakar',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-body antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/app/layout.tsx frontend/components/providers.tsx
git commit -m "feat: root layout with TanStack Query and Auth providers"
```

---

## Task 4: Landing Page

**Files:**
- Modify: `frontend/app/page.tsx`
- Create: `frontend/components/layout/Navbar.tsx`

- [ ] **Step 1: Buat `frontend/components/layout/Navbar.tsx`**

```typescript
'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-black/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-near-black font-black text-2xl tracking-tight" style={{ lineHeight: 0.85 }}>
          Think Decision
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-warm-dark text-sm font-semibold">{user.full_name}</span>
              <button
                onClick={handleLogout}
                className="bg-[rgba(22,51,0,0.08)] text-near-black font-semibold text-sm px-4 py-2 rounded-pill transition-transform hover:scale-105 active:scale-95"
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="bg-[rgba(22,51,0,0.08)] text-near-black font-semibold text-sm px-4 py-2 rounded-pill transition-transform hover:scale-105 active:scale-95">
                Masuk
              </Link>
              <Link href="/register" className="bg-wise-green text-dark-green font-semibold text-sm px-4 py-2 rounded-pill transition-transform hover:scale-105 active:scale-95">
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Update `frontend/app/page.tsx`**

```typescript
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="max-w-4xl">
          <h1
            className="text-near-black font-black mb-6"
            style={{ fontSize: '96px', lineHeight: 0.85, fontFeatureSettings: '"calt"' }}
          >
            Keputusan Terbaik,<br />Bersama Para Ahli
          </h1>
          <p className="text-warm-dark text-lg font-normal mb-10 max-w-xl" style={{ lineHeight: 1.44 }}>
            Platform MCDM berbasis web untuk agregasi penilaian multi-pakar secara otomatis. Didukung metode AHP dengan konsistensi terverifikasi.
          </p>
          <div className="flex gap-4">
            <Link
              href="/register"
              className="bg-wise-green text-dark-green font-semibold text-lg px-6 py-3 rounded-pill transition-transform hover:scale-105 active:scale-95"
            >
              Mulai Sebagai Creator
            </Link>
            <Link
              href="/login?role=expert"
              className="bg-[rgba(22,51,0,0.08)] text-near-black font-semibold text-lg px-6 py-3 rounded-pill transition-transform hover:scale-105 active:scale-95"
            >
              Masuk Sebagai Pakar
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-light-surface">
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-near-black font-black mb-12 text-center"
            style={{ fontSize: '48px', lineHeight: 0.85 }}
          >
            Mengapa Think Decision?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Multi-Expert', desc: 'Undang banyak pakar untuk menilai secara independen tanpa saling mempengaruhi.' },
              { title: 'Agregasi Otomatis', desc: 'GMJ dan GMP dihitung otomatis — tidak ada lagi spreadsheet manual seperti Super Decision.' },
              { title: 'CR Terverifikasi', desc: 'Consistency Ratio dihitung real-time setiap kali pakar submit penilaian.' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-card-md p-8 shadow-ring">
                <h3 className="font-black text-2xl text-near-black mb-3" style={{ lineHeight: 1.2 }}>
                  {f.title}
                </h3>
                <p className="text-warm-dark font-normal text-base" style={{ lineHeight: 1.44 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-black/10 text-center">
        <p className="text-td-gray text-sm font-normal">
          © 2026 Think Decision. Platform MCDM Multi-Expert.
        </p>
      </footer>
    </div>
  );
}
```

- [ ] **Step 3: Verifikasi landing page**

```bash
cd frontend
npm run dev
```

Buka `http://localhost:3000` — harus tampil landing page dengan headline besar, dua CTA, dan 3 feature card.

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: landing page with Wise-inspired design"
```

---

## Task 5: Auth Pages (Login & Register)

**Files:**
- Create: `frontend/app/(auth)/login/page.tsx`
- Create: `frontend/app/(auth)/register/page.tsx`
- Create: `frontend/app/(auth)/layout.tsx`

- [ ] **Step 1: Buat `frontend/app/(auth)/layout.tsx`**

```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-light-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-near-black font-black text-4xl" style={{ lineHeight: 0.85 }}>
            Think Decision
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Buat `frontend/app/(auth)/login/page.tsx`**

```typescript
'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { AuthResponse } from '@/types';

const schema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await authApi.login(data) as AuthResponse;
      login(res.access_token, res.user);
      if (res.user.role === 'creator') {
        router.push('/dashboard');
      } else {
        router.push('/expert/dashboard');
      }
    } catch (e: any) {
      setError(e.message || 'Login gagal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-card-md shadow-ring p-8">
      <h2 className="font-black text-3xl text-near-black mb-2" style={{ lineHeight: 0.85 }}>
        Masuk
      </h2>
      <p className="text-warm-dark font-normal mb-6 text-sm">
        Masuk sebagai Creator atau Pakar
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-near-black mb-1">Email</label>
          <input
            {...register('email')}
            type="email"
            placeholder="nama@email.com"
            className="w-full px-4 py-3 rounded-[10px] border border-black/10 text-near-black font-normal text-sm focus:outline-none focus:ring-2 focus:ring-wise-green/50"
          />
          {errors.email && <p className="text-td-danger text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-near-black mb-1">Password</label>
          <input
            {...register('password')}
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-[10px] border border-black/10 text-near-black font-normal text-sm focus:outline-none focus:ring-2 focus:ring-wise-green/50"
          />
          {errors.password && <p className="text-td-danger text-xs mt-1">{errors.password.message}</p>}
        </div>

        {error && (
          <div className="bg-red-50 border border-td-danger/20 rounded-[10px] px-4 py-3">
            <p className="text-td-danger text-sm font-normal">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-wise-green text-dark-green font-semibold py-3 rounded-pill transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
        >
          {isLoading ? 'Memproses...' : 'Masuk'}
        </button>
      </form>

      <p className="text-center text-sm text-warm-dark font-normal mt-6">
        Belum punya akun?{' '}
        <Link href="/register" className="text-dark-green font-semibold hover:underline">
          Daftar sebagai Creator
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Buat `frontend/app/(auth)/register/page.tsx`**

```typescript
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { AuthResponse } from '@/types';

const schema = z.object({
  full_name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await authApi.register({ ...data, role: 'creator' }) as AuthResponse;
      login(res.access_token, res.user);
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.message || 'Registrasi gagal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-card-md shadow-ring p-8">
      <h2 className="font-black text-3xl text-near-black mb-2" style={{ lineHeight: 0.85 }}>
        Daftar Creator
      </h2>
      <p className="text-warm-dark font-normal mb-6 text-sm">
        Buat akun untuk mulai merancang kasus keputusan
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {[
          { name: 'full_name', label: 'Nama Lengkap', type: 'text', placeholder: 'Dr. Ahmad Fauzi' },
          { name: 'email', label: 'Email', type: 'email', placeholder: 'nama@email.com' },
          { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
        ].map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-semibold text-near-black mb-1">{field.label}</label>
            <input
              {...register(field.name as any)}
              type={field.type}
              placeholder={field.placeholder}
              className="w-full px-4 py-3 rounded-[10px] border border-black/10 text-near-black font-normal text-sm focus:outline-none focus:ring-2 focus:ring-wise-green/50"
            />
            {errors[field.name as keyof typeof errors] && (
              <p className="text-td-danger text-xs mt-1">
                {errors[field.name as keyof typeof errors]?.message}
              </p>
            )}
          </div>
        ))}

        {error && (
          <div className="bg-red-50 border border-td-danger/20 rounded-[10px] px-4 py-3">
            <p className="text-td-danger text-sm font-normal">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-wise-green text-dark-green font-semibold py-3 rounded-pill transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
        >
          {isLoading ? 'Memproses...' : 'Daftar & Mulai'}
        </button>
      </form>

      <p className="text-center text-sm text-warm-dark font-normal mt-6">
        Sudah punya akun?{' '}
        <Link href="/login" className="text-dark-green font-semibold hover:underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/app/\(auth\)/
git commit -m "feat: login and register pages"
```

---

## Task 6: Creator Layout & Dashboard

**Files:**
- Create: `frontend/app/(creator)/layout.tsx`
- Create: `frontend/app/(creator)/dashboard/page.tsx`
- Create: `frontend/components/cases/CaseCard.tsx`
- Create: `frontend/components/cases/CaseStatusBadge.tsx`
- Create: `frontend/hooks/useCases.ts`

- [ ] **Step 1: Buat `frontend/hooks/useCases.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { casesApi } from '@/lib/api';
import { Case } from '@/types';

export function useCases(status?: string) {
  return useQuery<Case[]>({
    queryKey: ['cases', status],
    queryFn: () => casesApi.list(status) as Promise<Case[]>,
  });
}

export function useCase(id: string) {
  return useQuery<Case>({
    queryKey: ['cases', id],
    queryFn: () => casesApi.get(id) as Promise<Case>,
    enabled: !!id,
  });
}

export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => casesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases'] }),
  });
}

export function useUpdateCase(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => casesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases', id] }),
  });
}

export function useUpdateCaseStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => casesApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases'] }),
  });
}

export function useDeleteCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => casesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases'] }),
  });
}
```

- [ ] **Step 2: Buat `frontend/components/cases/CaseStatusBadge.tsx`**

```typescript
import { CaseStatus } from '@/types';
import { cn, getStatusColor } from '@/lib/utils';

const STATUS_LABEL: Record<CaseStatus, string> = {
  draft: 'Draft',
  active: 'Aktif',
  closed: 'Ditutup',
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span className={cn('text-xs font-semibold px-3 py-1 rounded-pill', getStatusColor(status))}>
      {STATUS_LABEL[status]}
    </span>
  );
}
```

- [ ] **Step 3: Buat `frontend/components/cases/CaseCard.tsx`**

```typescript
import Link from 'next/link';
import { Case } from '@/types';
import { CaseStatusBadge } from './CaseStatusBadge';
import { formatDate } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

export function CaseCard({ case: c }: { case: Case }) {
  return (
    <Link href={`/cases/${c.id}/criteria`}>
      <div className="bg-white rounded-card-md shadow-ring p-6 hover:shadow-ring-green transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <CaseStatusBadge status={c.status} />
          <span className="text-xs text-td-gray font-normal">{c.method}</span>
        </div>
        <h3 className="font-black text-xl text-near-black mb-2" style={{ lineHeight: 1.1 }}>
          {c.title}
        </h3>
        {c.description && (
          <p className="text-warm-dark font-normal text-sm mb-4 line-clamp-2" style={{ lineHeight: 1.44 }}>
            {c.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-td-gray font-normal">{formatDate(c.created_at)}</span>
          <ArrowRight className="w-4 h-4 text-td-gray group-hover:text-dark-green transition-colors" />
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: Buat `frontend/app/(creator)/layout.tsx`**

```typescript
'use client';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'creator')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><p className="text-td-gray">Memuat...</p></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-light-surface">
      <Navbar />
      <main className="pt-20 max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Buat `frontend/app/(creator)/dashboard/page.tsx`**

```typescript
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useCases } from '@/hooks/useCases';
import { CaseCard } from '@/components/cases/CaseCard';
import { Plus } from 'lucide-react';
import { CaseStatus } from '@/types';

const FILTERS: { label: string; value: string | undefined }[] = [
  { label: 'Semua', value: undefined },
  { label: 'Draft', value: 'draft' },
  { label: 'Aktif', value: 'active' },
  { label: 'Ditutup', value: 'closed' },
];

export default function DashboardPage() {
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const { data: cases, isLoading } = useCases(filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-black text-5xl text-near-black" style={{ lineHeight: 0.85 }}>
          Kasus Saya
        </h1>
        <Link
          href="/cases/new"
          className="flex items-center gap-2 bg-wise-green text-dark-green font-semibold px-5 py-2.5 rounded-pill transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Kasus Baru
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-pill text-sm font-semibold transition-all ${
              filter === f.value
                ? 'bg-near-black text-white'
                : 'bg-white text-warm-dark border border-black/10 hover:border-black/20'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-card-md shadow-ring p-6 animate-pulse h-40" />
          ))}
        </div>
      ) : cases?.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-td-gray font-normal text-lg mb-4">Belum ada kasus</p>
          <Link href="/cases/new" className="bg-wise-green text-dark-green font-semibold px-5 py-2.5 rounded-pill transition-transform hover:scale-105 active:scale-95">
            Buat Kasus Pertama
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cases?.map((c) => <CaseCard key={c.id} case={c} />)}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: creator layout and dashboard with case cards"
```

---

## Task 7: Buat Kasus & Case Tabs

**Files:**
- Create: `frontend/app/(creator)/cases/new/page.tsx`
- Create: `frontend/app/(creator)/cases/[id]/layout.tsx`
- Create: `frontend/components/cases/CaseTabs.tsx`

- [ ] **Step 1: Buat `frontend/app/(creator)/cases/new/page.tsx`**

```typescript
'use client';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateCase } from '@/hooks/useCases';
import { Case } from '@/types';

const schema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter'),
  description: z.string().optional(),
  method: z.enum(['AHP', 'ANP', 'FUZZY_AHP', 'FUZZY_ANP']),
  aggregation_method: z.enum(['GMJ', 'GMP']),
});

type FormData = z.infer<typeof schema>;

export default function NewCasePage() {
  const router = useRouter();
  const createCase = useCreateCase();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { method: 'AHP', aggregation_method: 'GMJ' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await createCase.mutateAsync(data) as Case;
      router.push(`/cases/${result.id}/criteria`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-black text-5xl text-near-black mb-8" style={{ lineHeight: 0.85 }}>
        Kasus Baru
      </h1>

      <div className="bg-white rounded-card-md shadow-ring p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-near-black mb-1">Judul Kasus</label>
            <input {...register('title')} placeholder="Pemilihan Supplier Terbaik" className="w-full px-4 py-3 rounded-[10px] border border-black/10 text-near-black font-normal text-sm focus:outline-none focus:ring-2 focus:ring-wise-green/50" />
            {errors.title && <p className="text-td-danger text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-near-black mb-1">Deskripsi <span className="text-td-gray font-normal">(opsional)</span></label>
            <textarea {...register('description')} rows={3} placeholder="Jelaskan tujuan pengambilan keputusan..." className="w-full px-4 py-3 rounded-[10px] border border-black/10 text-near-black font-normal text-sm focus:outline-none focus:ring-2 focus:ring-wise-green/50 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-near-black mb-1">Metode</label>
              <select {...register('method')} className="w-full px-4 py-3 rounded-[10px] border border-black/10 text-near-black font-normal text-sm focus:outline-none focus:ring-2 focus:ring-wise-green/50">
                <option value="AHP">AHP</option>
                <option value="ANP" disabled>ANP (Segera)</option>
                <option value="FUZZY_AHP" disabled>Fuzzy AHP (Segera)</option>
                <option value="FUZZY_ANP" disabled>Fuzzy ANP (Segera)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-near-black mb-1">Metode Agregasi</label>
              <select {...register('aggregation_method')} className="w-full px-4 py-3 rounded-[10px] border border-black/10 text-near-black font-normal text-sm focus:outline-none focus:ring-2 focus:ring-wise-green/50">
                <option value="GMJ">GMJ — Geometric Mean of Judgments</option>
                <option value="GMP">GMP — Geometric Mean of Priorities</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="bg-[rgba(22,51,0,0.08)] text-near-black font-semibold px-5 py-2.5 rounded-pill transition-transform hover:scale-105 active:scale-95">
              Batal
            </button>
            <button type="submit" disabled={createCase.isPending} className="bg-wise-green text-dark-green font-semibold px-5 py-2.5 rounded-pill transition-transform hover:scale-105 active:scale-95 disabled:opacity-50">
              {createCase.isPending ? 'Menyimpan...' : 'Buat Kasus'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Buat `frontend/components/cases/CaseTabs.tsx`**

```typescript
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Kriteria', path: 'criteria' },
  { label: 'Alternatif', path: 'alternatives' },
  { label: 'Pakar', path: 'experts' },
  { label: 'Progress', path: 'progress' },
  { label: 'Hasil', path: 'results' },
];

export function CaseTabs({ caseId }: { caseId: string }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b border-black/10 mb-6">
      {TABS.map((tab) => {
        const href = `/cases/${caseId}/${tab.path}`;
        const isActive = pathname.includes(`/${tab.path}`);
        return (
          <Link
            key={tab.path}
            href={href}
            className={cn(
              'px-4 py-2.5 text-sm font-semibold rounded-t-[10px] transition-colors',
              isActive
                ? 'bg-wise-green text-dark-green'
                : 'text-warm-dark hover:bg-light-surface'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Buat `frontend/app/(creator)/cases/[id]/layout.tsx`**

```typescript
'use client';
import { useCase } from '@/hooks/useCases';
import { CaseTabs } from '@/components/cases/CaseTabs';
import { CaseStatusBadge } from '@/components/cases/CaseStatusBadge';

export default function CaseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const { data: caseData, isLoading } = useCase(params.id);

  if (isLoading) return <div className="animate-pulse h-10 bg-light-surface rounded-card-sm" />;
  if (!caseData) return <p className="text-td-danger">Kasus tidak ditemukan</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-black text-4xl text-near-black mb-2" style={{ lineHeight: 0.9 }}>
            {caseData.title}
          </h1>
          <div className="flex items-center gap-3">
            <CaseStatusBadge status={caseData.status} />
            <span className="text-xs text-td-gray">{caseData.method} · {caseData.aggregation_method}</span>
          </div>
        </div>
      </div>
      <CaseTabs caseId={params.id} />
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: new case form and case tabs layout"
```

---

## Task 8: Criteria Tab

**Files:**
- Create: `frontend/app/(creator)/cases/[id]/criteria/page.tsx`
- Create: `frontend/components/criteria/CriteriaTree.tsx`
- Create: `frontend/components/criteria/AddCriteriaForm.tsx`
- Create: `frontend/hooks/useCriteria.ts`

- [ ] **Step 1: Buat `frontend/hooks/useCriteria.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { criteriaApi } from '@/lib/api';
import { Criteria } from '@/types';

export function useCriteria(caseId: string) {
  return useQuery<Criteria[]>({
    queryKey: ['criteria', caseId],
    queryFn: () => criteriaApi.list(caseId) as Promise<Criteria[]>,
    enabled: !!caseId,
  });
}

export function useCreateCriteria(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => criteriaApi.create(caseId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['criteria', caseId] }),
  });
}

export function useDeleteCriteria(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => criteriaApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['criteria', caseId] }),
  });
}
```

- [ ] **Step 2: Buat `frontend/components/criteria/AddCriteriaForm.tsx`**

```typescript
'use client';
import { useState } from 'react';
import { useCreateCriteria } from '@/hooks/useCriteria';
import { Plus } from 'lucide-react';

interface Props {
  caseId: string;
  parentId?: string;
  parentLabel?: string;
  onClose?: () => void;
}

export function AddCriteriaForm({ caseId, parentId, parentLabel, onClose }: Props) {
  const [label, setLabel] = useState('');
  const createCriteria = useCreateCriteria(caseId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    await createCriteria.mutateAsync({ label: label.trim(), parent_id: parentId || null, order_index: 0 });
    setLabel('');
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={parentId ? `Sub-kriteria dari ${parentLabel}` : 'Nama kriteria baru'}
        className="flex-1 px-3 py-2 rounded-[10px] border border-black/10 text-near-black font-normal text-sm focus:outline-none focus:ring-2 focus:ring-wise-green/50"
        autoFocus
      />
      <button type="submit" disabled={createCriteria.isPending} className="bg-wise-green text-dark-green font-semibold px-4 py-2 rounded-pill text-sm transition-transform hover:scale-105 active:scale-95">
        <Plus className="w-4 h-4" />
      </button>
      {onClose && (
        <button type="button" onClick={onClose} className="bg-[rgba(22,51,0,0.08)] text-near-black font-semibold px-3 py-2 rounded-pill text-sm">
          ✕
        </button>
      )}
    </form>
  );
}
```

- [ ] **Step 3: Buat `frontend/components/criteria/CriteriaTree.tsx`**

```typescript
'use client';
import { useState } from 'react';
import { Criteria } from '@/types';
import { useDeleteCriteria } from '@/hooks/useCriteria';
import { AddCriteriaForm } from './AddCriteriaForm';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';

interface NodeProps {
  node: Criteria;
  caseId: string;
  depth?: number;
}

function CriteriaNode({ node, caseId, depth = 0 }: NodeProps) {
  const [expanded, setExpanded] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const deleteCriteria = useDeleteCriteria(caseId);

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-light-mint pl-4' : ''}`}>
      <div className="flex items-center gap-2 py-2 group">
        <button onClick={() => setExpanded(!expanded)} className="text-td-gray hover:text-near-black">
          {hasChildren ? (
            expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            <span className="w-4 h-4 block" />
          )}
        </button>
        <span className="font-semibold text-near-black text-sm flex-1">{node.label}</span>
        <span className="text-xs text-td-gray font-normal bg-light-surface px-2 py-0.5 rounded-pill">
          Level {node.level}
        </span>
        <button
          onClick={() => setShowAddChild(!showAddChild)}
          className="opacity-0 group-hover:opacity-100 text-td-gray hover:text-dark-green transition-all"
          title="Tambah sub-kriteria"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => deleteCriteria.mutate(node.id)}
          className="opacity-0 group-hover:opacity-100 text-td-gray hover:text-td-danger transition-all"
          title="Hapus kriteria"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {showAddChild && (
        <div className="ml-6">
          <AddCriteriaForm
            caseId={caseId}
            parentId={node.id}
            parentLabel={node.label}
            onClose={() => setShowAddChild(false)}
          />
        </div>
      )}

      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <CriteriaNode key={child.id} node={child} caseId={caseId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CriteriaTree({ criteria, caseId }: { criteria: Criteria[]; caseId: string }) {
  return (
    <div className="bg-white rounded-card-md shadow-ring p-6">
      {criteria.length === 0 ? (
        <p className="text-td-gray font-normal text-sm text-center py-8">
          Belum ada kriteria. Tambahkan kriteria pertama.
        </p>
      ) : (
        criteria.map((node) => (
          <CriteriaNode key={node.id} node={node} caseId={caseId} />
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 4: Buat `frontend/app/(creator)/cases/[id]/criteria/page.tsx`**

```typescript
'use client';
import { useCriteria } from '@/hooks/useCriteria';
import { CriteriaTree } from '@/components/criteria/CriteriaTree';
import { AddCriteriaForm } from '@/components/criteria/AddCriteriaForm';

export default function CriteriaPage({ params }: { params: { id: string } }) {
  const { data: criteria, isLoading } = useCriteria(params.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-black text-2xl text-near-black">Hierarki Kriteria</h2>
        <span className="text-xs text-td-gray font-normal bg-light-surface px-3 py-1 rounded-pill">
          {criteria?.length ?? 0} kriteria
        </span>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-card-md shadow-ring p-6 animate-pulse h-40" />
      ) : (
        <CriteriaTree criteria={criteria ?? []} caseId={params.id} />
      )}

      <div className="mt-4 bg-white rounded-card-md shadow-ring p-4">
        <p className="text-xs text-td-gray font-semibold mb-2">TAMBAH KRITERIA LEVEL 1</p>
        <AddCriteriaForm caseId={params.id} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat: criteria tree with add/delete and hierarchy display"
```

---

## Task 9: Alternatives, Experts, Progress Tabs

**Files:**
- Create: `frontend/app/(creator)/cases/[id]/alternatives/page.tsx`
- Create: `frontend/app/(creator)/cases/[id]/experts/page.tsx`
- Create: `frontend/app/(creator)/cases/[id]/progress/page.tsx`
- Create: `frontend/hooks/useAlternatives.ts`
- Create: `frontend/hooks/useExperts.ts`

- [ ] **Step 1: Buat `frontend/hooks/useAlternatives.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alternativesApi } from '@/lib/api';
import { Alternative } from '@/types';

export function useAlternatives(caseId: string) {
  return useQuery<Alternative[]>({
    queryKey: ['alternatives', caseId],
    queryFn: () => alternativesApi.list(caseId) as Promise<Alternative[]>,
    enabled: !!caseId,
  });
}

export function useCreateAlternative(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => alternativesApi.create(caseId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alternatives', caseId] }),
  });
}

export function useDeleteAlternative(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alternativesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alternatives', caseId] }),
  });
}
```

- [ ] **Step 2: Buat `frontend/hooks/useExperts.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expertsApi } from '@/lib/api';
import { ExpertProgress } from '@/types';

export function useExperts(caseId: string) {
  return useQuery<ExpertProgress[]>({
    queryKey: ['experts', caseId],
    queryFn: () => expertsApi.list(caseId) as Promise<ExpertProgress[]>,
    enabled: !!caseId,
    refetchInterval: 30_000, // refresh tiap 30 detik
  });
}

export function useInviteExpert(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => expertsApi.invite(caseId, email),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['experts', caseId] }),
  });
}

export function useRemoveExpert(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (expertId: string) => expertsApi.remove(caseId, expertId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['experts', caseId] }),
  });
}
```

- [ ] **Step 3: Buat `frontend/app/(creator)/cases/[id]/alternatives/page.tsx`**

```typescript
'use client';
import { useState } from 'react';
import { useAlternatives, useCreateAlternative, useDeleteAlternative } from '@/hooks/useAlternatives';
import { Plus, Trash2 } from 'lucide-react';

export default function AlternativesPage({ params }: { params: { id: string } }) {
  const { data: alternatives, isLoading } = useAlternatives(params.id);
  const createAlt = useCreateAlternative(params.id);
  const deleteAlt = useDeleteAlternative(params.id);
  const [newLabel, setNewLabel] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    await createAlt.mutateAsync({ label: newLabel.trim(), order_index: alternatives?.length ?? 0 });
    setNewLabel('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-black text-2xl text-near-black">Alternatif</h2>
        <span className="text-xs text-td-gray font-normal bg-light-surface px-3 py-1 rounded-pill">
          {alternatives?.length ?? 0} alternatif
        </span>
      </div>

      <div className="space-y-3 mb-4">
        {isLoading ? (
          [1, 2].map(i => <div key={i} className="bg-white rounded-card-sm shadow-ring p-4 h-14 animate-pulse" />)
        ) : alternatives?.length === 0 ? (
          <p className="text-td-gray font-normal text-sm text-center py-8 bg-white rounded-card-md shadow-ring">
            Belum ada alternatif
          </p>
        ) : (
          alternatives?.map((alt, idx) => (
            <div key={alt.id} className="bg-white rounded-card-sm shadow-ring p-4 flex items-center gap-3 group">
              <span className="text-xs font-black text-wise-green w-6 text-center">{idx + 1}</span>
              <span className="font-semibold text-near-black text-sm flex-1">{alt.label}</span>
              {alt.description && <span className="text-xs text-td-gray font-normal">{alt.description}</span>}
              <button onClick={() => deleteAlt.mutate(alt.id)} className="opacity-0 group-hover:opacity-100 text-td-gray hover:text-td-danger">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="bg-white rounded-card-md shadow-ring p-4">
        <p className="text-xs text-td-gray font-semibold mb-2">TAMBAH ALTERNATIF</p>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Nama alternatif (misal: Supplier A)"
            className="flex-1 px-3 py-2 rounded-[10px] border border-black/10 text-near-black font-normal text-sm focus:outline-none focus:ring-2 focus:ring-wise-green/50"
          />
          <button type="submit" disabled={createAlt.isPending} className="bg-wise-green text-dark-green font-semibold px-4 py-2 rounded-pill text-sm transition-transform hover:scale-105 active:scale-95">
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Buat `frontend/app/(creator)/cases/[id]/experts/page.tsx`**

```typescript
'use client';
import { useState } from 'react';
import { useExperts, useInviteExpert, useRemoveExpert } from '@/hooks/useExperts';
import { getStatusColor } from '@/lib/utils';
import { UserPlus, Trash2 } from 'lucide-react';

export default function ExpertsPage({ params }: { params: { id: string } }) {
  const { data: experts, isLoading } = useExperts(params.id);
  const inviteExpert = useInviteExpert(params.id);
  const removeExpert = useRemoveExpert(params.id);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    try {
      await inviteExpert.mutateAsync(email.trim());
      setEmail('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div>
      <h2 className="font-black text-2xl text-near-black mb-4">Manajemen Pakar</h2>

      {/* Invite form */}
      <div className="bg-white rounded-card-md shadow-ring p-5 mb-4">
        <p className="text-xs text-td-gray font-semibold mb-2">UNDANG PAKAR</p>
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@pakar.com"
            className="flex-1 px-3 py-2 rounded-[10px] border border-black/10 text-near-black font-normal text-sm focus:outline-none focus:ring-2 focus:ring-wise-green/50"
          />
          <button type="submit" disabled={inviteExpert.isPending} className="flex items-center gap-2 bg-wise-green text-dark-green font-semibold px-4 py-2 rounded-pill text-sm transition-transform hover:scale-105 active:scale-95">
            <UserPlus className="w-4 h-4" />
            Undang
          </button>
        </form>
        {error && <p className="text-td-danger text-xs mt-2">{error}</p>}
      </div>

      {/* Expert list */}
      <div className="space-y-3">
        {isLoading ? (
          [1, 2].map(i => <div key={i} className="bg-white rounded-card-sm shadow-ring p-5 h-24 animate-pulse" />)
        ) : experts?.length === 0 ? (
          <p className="text-td-gray font-normal text-sm text-center py-8 bg-white rounded-card-md shadow-ring">
            Belum ada pakar diundang
          </p>
        ) : (
          experts?.map((expert) => (
            <div key={expert.expert_id} className="bg-white rounded-card-sm shadow-ring p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-near-black text-sm">{expert.full_name}</p>
                  <p className="text-td-gray font-normal text-xs">{expert.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-pill ${getStatusColor(expert.status)}`}>
                    {expert.status}
                  </span>
                  {expert.status === 'pending' && (
                    <button onClick={() => removeExpert.mutate(expert.expert_id)} className="opacity-0 group-hover:opacity-100 text-td-gray hover:text-td-danger">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-light-surface rounded-pill h-2">
                  <div
                    className="bg-wise-green h-2 rounded-pill transition-all"
                    style={{ width: `${expert.progress_percent}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-warm-dark">
                  {expert.comparisons_submitted}/{expert.comparisons_required}
                </span>
                <span className="text-xs text-td-gray font-normal">{expert.progress_percent}%</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Buat `frontend/app/(creator)/cases/[id]/progress/page.tsx`**

```typescript
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resultsApi } from '@/lib/api';
import { CaseProgress } from '@/types';
import { useRouter } from 'next/navigation';

export default function ProgressPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: progress, isLoading } = useQuery<CaseProgress>({
    queryKey: ['progress', params.id],
    queryFn: () => resultsApi.progress(params.id) as Promise<CaseProgress>,
    refetchInterval: 15_000,
  });

  const aggregate = useMutation({
    mutationFn: () => resultsApi.aggregate(params.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['results', params.id] });
      router.push(`/cases/${params.id}/results`);
    },
  });

  if (isLoading) return <div className="bg-white rounded-card-md shadow-ring p-8 animate-pulse h-40" />;

  const canAggregate = (progress?.completed ?? 0) > 0;

  return (
    <div>
      <h2 className="font-black text-2xl text-near-black mb-6">Progress Penilaian</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Pakar', value: progress?.total_experts ?? 0, color: 'text-near-black' },
          { label: 'Selesai', value: progress?.completed ?? 0, color: 'text-td-positive' },
          { label: 'Sedang Mengisi', value: progress?.accepted ?? 0, color: 'text-dark-green' },
          { label: 'Belum Mulai', value: progress?.pending ?? 0, color: 'text-td-gray' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-card-sm shadow-ring p-5 text-center">
            <p className={`font-black text-4xl ${item.color} mb-1`} style={{ lineHeight: 0.9 }}>
              {item.value}
            </p>
            <p className="text-xs text-td-gray font-normal">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Progress ring */}
      <div className="bg-white rounded-card-md shadow-ring p-8 text-center mb-6">
        <p className="font-black text-6xl text-near-black mb-2" style={{ lineHeight: 0.85 }}>
          {progress?.completion_percent ?? 0}%
        </p>
        <p className="text-warm-dark font-normal text-sm mb-6">pakar telah menyelesaikan penilaian</p>
        <div className="w-full bg-light-surface rounded-pill h-3 max-w-md mx-auto">
          <div
            className="bg-wise-green h-3 rounded-pill transition-all"
            style={{ width: `${progress?.completion_percent ?? 0}%` }}
          />
        </div>
      </div>

      {/* Aggregate button */}
      <div className="bg-white rounded-card-md shadow-ring p-6 flex items-center justify-between">
        <div>
          <p className="font-semibold text-near-black text-sm">Agregasi Hasil</p>
          <p className="text-td-gray font-normal text-xs">
            {canAggregate
              ? `${progress?.completed} pakar siap diagregasi`
              : 'Menunggu minimal 1 pakar menyelesaikan penilaian'}
          </p>
        </div>
        <button
          onClick={() => aggregate.mutate()}
          disabled={!canAggregate || aggregate.isPending}
          className="bg-wise-green text-dark-green font-semibold px-6 py-2.5 rounded-pill transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100"
        >
          {aggregate.isPending ? 'Menghitung...' : 'Agregasi Sekarang'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: alternatives, experts, and progress tabs"
```

---

## Task 10: Results Tab

**Files:**
- Create: `frontend/app/(creator)/cases/[id]/results/page.tsx`
- Create: `frontend/components/results/RankingTable.tsx`
- Create: `frontend/components/results/RankingChart.tsx`
- Create: `frontend/hooks/useResults.ts`

- [ ] **Step 1: Buat `frontend/hooks/useResults.ts`**

```typescript
import { useQuery } from '@tanstack/react-query';
import { resultsApi } from '@/lib/api';
import { AggregatedResult } from '@/types';

export function useResults(caseId: string) {
  return useQuery<AggregatedResult>({
    queryKey: ['results', caseId],
    queryFn: () => resultsApi.get(caseId) as Promise<AggregatedResult>,
    enabled: !!caseId,
    retry: false,
  });
}
```

- [ ] **Step 2: Buat `frontend/components/results/RankingChart.tsx`**

```typescript
'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { RankingItem } from '@/types';

export function RankingChart({ ranking }: { ranking: RankingItem[] }) {
  const data = ranking.map(r => ({
    name: r.alternative_label,
    value: r.percentage,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30 }}>
        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#868685' }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#0e0f0c', fontWeight: 600 }} width={100} />
        <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Bobot']} />
        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === 0 ? '#9fe870' : '#e2f6d5'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 3: Buat `frontend/components/results/RankingTable.tsx`**

```typescript
import { RankingItem } from '@/types';

export function RankingTable({ ranking }: { ranking: RankingItem[] }) {
  return (
    <div className="overflow-hidden rounded-card-md shadow-ring">
      <table className="w-full bg-white">
        <thead>
          <tr className="border-b border-black/10">
            <th className="text-left px-5 py-3 text-xs font-semibold text-td-gray">RANK</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-td-gray">ALTERNATIF</th>
            <th className="text-right px-5 py-3 text-xs font-semibold text-td-gray">BOBOT</th>
            <th className="text-right px-5 py-3 text-xs font-semibold text-td-gray">%</th>
            <th className="px-5 py-3 text-xs font-semibold text-td-gray">VISUALISASI</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((item) => (
            <tr key={item.alternative_id} className="border-b border-black/5 hover:bg-light-surface transition-colors">
              <td className="px-5 py-4">
                <span className={`font-black text-xl ${item.rank === 1 ? 'text-dark-green' : 'text-td-gray'}`}>
                  #{item.rank}
                </span>
              </td>
              <td className="px-5 py-4 font-semibold text-near-black text-sm">{item.alternative_label}</td>
              <td className="px-5 py-4 text-right font-normal text-warm-dark text-sm">
                {item.global_weight.toFixed(4)}
              </td>
              <td className="px-5 py-4 text-right font-semibold text-near-black text-sm">
                {item.percentage.toFixed(1)}%
              </td>
              <td className="px-5 py-4">
                <div className="w-32 bg-light-surface rounded-pill h-2">
                  <div
                    className="bg-wise-green h-2 rounded-pill"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Buat `frontend/app/(creator)/cases/[id]/results/page.tsx`**

```typescript
'use client';
import { useResults } from '@/hooks/useResults';
import { RankingTable } from '@/components/results/RankingTable';
import { RankingChart } from '@/components/results/RankingChart';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function ResultsPage({ params }: { params: { id: string } }) {
  const { data: result, isLoading, error } = useResults(params.id);

  if (isLoading) return <div className="bg-white rounded-card-md shadow-ring p-8 animate-pulse h-60" />;

  if (error) return (
    <div className="bg-white rounded-card-md shadow-ring p-8 text-center">
      <p className="text-td-gray font-normal mb-4">Belum ada hasil agregasi</p>
      <Link href={`/cases/${params.id}/progress`} className="bg-wise-green text-dark-green font-semibold px-5 py-2.5 rounded-pill text-sm transition-transform hover:scale-105 active:scale-95">
        Ke Halaman Progress
      </Link>
    </div>
  );

  if (!result) return null;

  const exportCSV = () => {
    const rows = [
      ['Rank', 'Alternatif', 'Bobot Global', 'Persentase'],
      ...result.ranking.map(r => [r.rank, r.alternative_label, r.global_weight.toFixed(6), `${r.percentage.toFixed(2)}%`]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hasil-agregasi-${params.id}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="bg-light-mint rounded-card-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-dark-green">Metode: {result.aggregation_method_used}</span>
          <span className="text-xs font-semibold text-dark-green">{result.experts_included} Pakar</span>
          <span className="text-xs font-normal text-dark-green">Dihitung: {formatDate(result.computed_at)}</span>
        </div>
        <button onClick={exportCSV} className="bg-white text-dark-green border border-dark-green/20 font-semibold text-xs px-4 py-1.5 rounded-pill transition-transform hover:scale-105 active:scale-95">
          Export CSV
        </button>
      </div>

      {/* Ranking table */}
      <div>
        <h2 className="font-black text-2xl text-near-black mb-4">Ranking Alternatif</h2>
        <RankingTable ranking={result.ranking} />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-card-md shadow-ring p-6">
        <h3 className="font-semibold text-near-black text-sm mb-4">Visualisasi Bobot</h3>
        <RankingChart ranking={result.ranking} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat: results tab with ranking table, chart, and CSV export"
```

---

## Task 11: Expert Interface

**Files:**
- Create: `frontend/app/(expert)/layout.tsx`
- Create: `frontend/app/(expert)/dashboard/page.tsx`
- Create: `frontend/app/(expert)/cases/[id]/page.tsx`
- Create: `frontend/app/(expert)/cases/[id]/compare/[node]/page.tsx`
- Create: `frontend/components/comparison/MatrixInput.tsx`
- Create: `frontend/components/comparison/ConsistencyBadge.tsx`
- Create: `frontend/hooks/useComparisons.ts`

- [ ] **Step 1: Buat `frontend/hooks/useComparisons.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { comparisonsApi } from '@/lib/api';

export function useExpertCases() {
  return useQuery<any[]>({
    queryKey: ['expert-cases'],
    queryFn: () => comparisonsApi.listMyCases() as Promise<any[]>,
  });
}

export function useExpertCaseDetail(caseId: string) {
  return useQuery<any>({
    queryKey: ['expert-case', caseId],
    queryFn: () => comparisonsApi.getCaseDetail(caseId),
    enabled: !!caseId,
  });
}

export function useExpertComparisons(caseId: string) {
  return useQuery<any[]>({
    queryKey: ['expert-comparisons', caseId],
    queryFn: () => comparisonsApi.list(caseId) as Promise<any[]>,
    enabled: !!caseId,
  });
}

export function useSubmitComparison(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => comparisonsApi.submit(caseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expert-comparisons', caseId] });
      qc.invalidateQueries({ queryKey: ['expert-case', caseId] });
    },
  });
}
```

- [ ] **Step 2: Buat `frontend/app/(expert)/layout.tsx`**

```typescript
'use client';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';

export default function ExpertLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'expert')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><p className="text-td-gray">Memuat...</p></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-light-surface">
      <Navbar />
      <main className="pt-20 max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Buat `frontend/app/(expert)/dashboard/page.tsx`**

```typescript
'use client';
import Link from 'next/link';
import { useExpertCases } from '@/hooks/useComparisons';
import { getStatusColor } from '@/lib/utils';

export default function ExpertDashboard() {
  const { data: cases, isLoading } = useExpertCases();

  return (
    <div>
      <h1 className="font-black text-5xl text-near-black mb-8" style={{ lineHeight: 0.85 }}>
        Kasus Saya
      </h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="bg-white rounded-card-md shadow-ring p-6 h-24 animate-pulse" />)}
        </div>
      ) : cases?.length === 0 ? (
        <p className="text-td-gray font-normal text-center py-16">Belum ada kasus yang ditugaskan</p>
      ) : (
        <div className="space-y-3">
          {cases?.map((c) => (
            <Link key={c.case_id} href={`/expert/cases/${c.case_id}`}>
              <div className="bg-white rounded-card-md shadow-ring p-5 hover:shadow-ring-green transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-xl text-near-black mb-1" style={{ lineHeight: 1 }}>
                      {c.title}
                    </h3>
                    <span className="text-xs text-td-gray font-normal">{c.method}</span>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-pill ${getStatusColor(c.invite_status)}`}>
                    {c.invite_status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Buat `frontend/components/comparison/ConsistencyBadge.tsx`**

```typescript
import { cn, getCRColor } from '@/lib/utils';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export function ConsistencyBadge({ cr, isConsistent }: { cr: number; isConsistent: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-2 px-4 py-2 rounded-card-sm',
      isConsistent ? 'bg-light-mint' : 'bg-red-50'
    )}>
      {isConsistent
        ? <CheckCircle className="w-4 h-4 text-td-positive" />
        : <AlertTriangle className="w-4 h-4 text-td-danger" />
      }
      <span className={cn('text-sm font-semibold', getCRColor(cr))}>
        CR = {cr.toFixed(4)} {isConsistent ? '✓ Konsisten' : '⚠ Tidak Konsisten (CR > 0.1)'}
      </span>
    </div>
  );
}
```

- [ ] **Step 5: Buat `frontend/components/comparison/MatrixInput.tsx`**

```typescript
'use client';
import { useState, useEffect } from 'react';

const SAATY_VALUES = [1/9, 1/8, 1/7, 1/6, 1/5, 1/4, 1/3, 1/2, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function formatVal(v: number): string {
  if (v >= 1) return v.toFixed(0);
  const fracs: Record<number, string> = {
    [1/9]: '1/9', [1/8]: '1/8', [1/7]: '1/7', [1/6]: '1/6',
    [1/5]: '1/5', [1/4]: '1/4', [1/3]: '1/3', [1/2]: '1/2',
  };
  return fracs[v] || v.toFixed(3);
}

interface Props {
  labels: string[];
  onSubmit: (matrix: number[][]) => void;
  isLoading?: boolean;
  initialMatrix?: number[][];
}

export function MatrixInput({ labels, onSubmit, isLoading, initialMatrix }: Props) {
  const n = labels.length;
  const [matrix, setMatrix] = useState<number[][]>(() => {
    if (initialMatrix) return initialMatrix;
    return Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (i === j ? 1 : 1))
    );
  });

  const setValue = (i: number, j: number, val: number) => {
    setMatrix(prev => {
      const next = prev.map(row => [...row]);
      next[i][j] = val;
      next[j][i] = 1 / val; // auto reciprocal
      return next;
    });
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-2 text-xs text-td-gray font-semibold text-left"></th>
              {labels.map((l) => (
                <th key={l} className="p-2 text-xs text-td-gray font-semibold text-center max-w-[80px] truncate">{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((rowLabel, i) => (
              <tr key={rowLabel} className="border-t border-black/5">
                <td className="p-2 text-xs font-semibold text-near-black whitespace-nowrap pr-4">{rowLabel}</td>
                {labels.map((_, j) => (
                  <td key={j} className="p-1 text-center">
                    {i === j ? (
                      <span className="block w-14 h-10 leading-10 text-center text-near-black font-black text-sm bg-light-surface rounded-[8px]">1</span>
                    ) : i < j ? (
                      <select
                        value={matrix[i][j]}
                        onChange={(e) => setValue(i, j, parseFloat(e.target.value))}
                        className="w-14 h-10 text-center text-near-black font-semibold text-sm border border-black/10 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-wise-green/50 bg-white"
                      >
                        {SAATY_VALUES.map(v => (
                          <option key={v} value={v}>{formatVal(v)}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="block w-14 h-10 leading-10 text-center text-td-gray font-normal text-sm bg-light-surface/50 rounded-[8px]">
                        {formatVal(matrix[i][j])}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => onSubmit(matrix)}
        disabled={isLoading}
        className="mt-6 w-full bg-wise-green text-dark-green font-semibold py-3 rounded-pill transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        {isLoading ? 'Menghitung CR...' : 'Submit Penilaian'}
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Buat `frontend/app/(expert)/cases/[id]/page.tsx`**

```typescript
'use client';
import Link from 'next/link';
import { useExpertCaseDetail, useExpertComparisons } from '@/hooks/useComparisons';
import { CheckCircle, Circle } from 'lucide-react';

export default function ExpertCasePage({ params }: { params: { id: string } }) {
  const { data: detail, isLoading } = useExpertCaseDetail(params.id);
  const { data: submitted } = useExpertComparisons(params.id);

  if (isLoading) return <div className="bg-white rounded-card-md shadow-ring p-8 animate-pulse h-60" />;
  if (!detail) return null;

  // Build list of all matrices yang harus diisi
  const submittedKeys = new Set(
    (submitted ?? []).map((c: any) => `${c.node_type}__${c.parent_id ?? 'null'}`)
  );

  // 1. Matriks kriteria level 1
  const matrices: { key: string; label: string; node_type: string; parent_id: string | null }[] = [
    { key: 'criteria__null', label: 'Perbandingan Kriteria Utama', node_type: 'criteria', parent_id: null },
  ];

  // 2. Sub-kriteria parents
  const parentIds = [...new Set(detail.criteria.filter((c: any) => c.parent_id).map((c: any) => c.parent_id))];
  parentIds.forEach((pid: string) => {
    const parent = detail.criteria.find((c: any) => c.id === pid);
    matrices.push({
      key: `criteria__${pid}`,
      label: `Sub-kriteria: ${parent?.label ?? pid}`,
      node_type: 'criteria',
      parent_id: pid,
    });
  });

  // 3. Alternatif per leaf kriteria
  const leafCriteriaIds = detail.criteria
    .filter((c: any) => !detail.criteria.some((x: any) => x.parent_id === c.id))
    .map((c: any) => c.id);

  leafCriteriaIds.forEach((cid: string) => {
    const crit = detail.criteria.find((c: any) => c.id === cid);
    matrices.push({
      key: `alternative__${cid}`,
      label: `Alternatif: ${crit?.label ?? cid}`,
      node_type: 'alternative',
      parent_id: cid,
    });
  });

  const doneCount = matrices.filter(m => submittedKeys.has(m.key)).length;

  return (
    <div>
      <h1 className="font-black text-4xl text-near-black mb-2" style={{ lineHeight: 0.85 }}>
        {detail.case.title}
      </h1>
      <p className="text-td-gray font-normal text-sm mb-6">{detail.case.method}</p>

      {/* Progress */}
      <div className="bg-white rounded-card-sm shadow-ring p-4 mb-6 flex items-center gap-4">
        <div className="flex-1 bg-light-surface rounded-pill h-2">
          <div className="bg-wise-green h-2 rounded-pill transition-all" style={{ width: `${(doneCount / matrices.length) * 100}%` }} />
        </div>
        <span className="text-sm font-semibold text-near-black">{doneCount}/{matrices.length}</span>
      </div>

      {/* Matrix checklist */}
      <div className="space-y-3">
        {matrices.map((m) => {
          const isDone = submittedKeys.has(m.key);
          return (
            <Link
              key={m.key}
              href={`/expert/cases/${params.id}/compare/${encodeURIComponent(m.key)}`}
            >
              <div className={`flex items-center gap-4 p-4 rounded-card-sm shadow-ring cursor-pointer transition-all ${isDone ? 'bg-light-mint' : 'bg-white hover:shadow-ring-green'}`}>
                {isDone
                  ? <CheckCircle className="w-5 h-5 text-td-positive flex-shrink-0" />
                  : <Circle className="w-5 h-5 text-td-gray flex-shrink-0" />
                }
                <span className={`font-semibold text-sm ${isDone ? 'text-dark-green' : 'text-near-black'}`}>
                  {m.label}
                </span>
                {isDone && <span className="ml-auto text-xs text-dark-green font-normal">Selesai ✓</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Buat `frontend/app/(expert)/cases/[id]/compare/[node]/page.tsx`**

```typescript
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useExpertCaseDetail } from '@/hooks/useComparisons';
import { useSubmitComparison } from '@/hooks/useComparisons';
import { MatrixInput } from '@/components/comparison/MatrixInput';
import { ConsistencyBadge } from '@/components/comparison/ConsistencyBadge';
import { Comparison } from '@/types';

export default function ComparePage({ params }: { params: { id: string; node: string } }) {
  const router = useRouter();
  const nodeKey = decodeURIComponent(params.node);
  const [nodeType, parentIdStr] = nodeKey.split('__');
  const parentId = parentIdStr === 'null' ? null : parentIdStr;

  const { data: detail, isLoading } = useExpertCaseDetail(params.id);
  const submitComparison = useSubmitComparison(params.id);
  const [result, setResult] = useState<Comparison | null>(null);

  if (isLoading || !detail) return <div className="animate-pulse h-60 bg-white rounded-card-md shadow-ring" />;

  // Tentukan label yang dibandingkan
  let labels: string[] = [];
  let title = '';

  if (nodeType === 'criteria' && parentId === null) {
    const topLevel = detail.criteria.filter((c: any) => !c.parent_id);
    labels = topLevel.map((c: any) => c.label);
    title = 'Perbandingan Kriteria Utama';
  } else if (nodeType === 'criteria' && parentId) {
    const children = detail.criteria.filter((c: any) => c.parent_id === parentId);
    labels = children.map((c: any) => c.label);
    const parent = detail.criteria.find((c: any) => c.id === parentId);
    title = `Sub-kriteria: ${parent?.label}`;
  } else if (nodeType === 'alternative' && parentId) {
    labels = detail.alternatives.map((a: any) => a.label);
    const crit = detail.criteria.find((c: any) => c.id === parentId);
    title = `Alternatif untuk: ${crit?.label}`;
  }

  const handleSubmit = async (matrix: number[][]) => {
    const res = await submitComparison.mutateAsync({
      node_type: nodeType,
      parent_id: parentId,
      value_matrix: matrix,
    }) as Comparison;
    setResult(res);
  };

  return (
    <div className="max-w-2xl">
      <button onClick={() => router.back()} className="text-td-gray font-semibold text-sm mb-4 hover:text-near-black flex items-center gap-1">
        ← Kembali
      </button>

      <h1 className="font-black text-3xl text-near-black mb-6" style={{ lineHeight: 0.9 }}>
        {title}
      </h1>

      <div className="bg-white rounded-card-md shadow-ring p-6 mb-4">
        <p className="text-xs text-td-gray font-semibold mb-4">
          Gunakan skala Saaty 1–9. Nilai otomatis diisi secara resiprokal.
        </p>
        {labels.length < 2 ? (
          <p className="text-td-danger text-sm font-normal">Minimal 2 item diperlukan untuk membandingkan.</p>
        ) : (
          <MatrixInput
            labels={labels}
            onSubmit={handleSubmit}
            isLoading={submitComparison.isPending}
          />
        )}
      </div>

      {result && (
        <div className="bg-white rounded-card-md shadow-ring p-6 space-y-4">
          <ConsistencyBadge cr={result.cr ?? 0} isConsistent={result.is_consistent ?? false} />
          {result.priority_vector && (
            <div>
              <p className="text-xs text-td-gray font-semibold mb-2">PRIORITY VECTOR</p>
              <div className="space-y-2">
                {labels.map((label, i) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-near-black w-32 truncate">{label}</span>
                    <div className="flex-1 bg-light-surface rounded-pill h-2">
                      <div className="bg-wise-green h-2 rounded-pill" style={{ width: `${(result.priority_vector![i]) * 100}%` }} />
                    </div>
                    <span className="text-xs text-warm-dark font-semibold w-12 text-right">
                      {(result.priority_vector![i] * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => router.push(`/expert/cases/${params.id}`)}
            className="w-full bg-wise-green text-dark-green font-semibold py-3 rounded-pill transition-transform hover:scale-105 active:scale-95"
          >
            Lanjut ke Penilaian Berikutnya
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add frontend/
git commit -m "feat: expert interface - dashboard, case detail, matrix input, compare page"
```

---

## Task 12: Verifikasi End-to-End & Run

- [ ] **Step 1: Pastikan backend running**

```bash
cd "C:\Apps\Think Decision\backend"
uvicorn app.main:app --reload --port 8000
```

- [ ] **Step 2: Jalankan frontend**

```bash
cd "C:\Apps\Think Decision\frontend"
npm run dev
```

- [ ] **Step 3: Verifikasi semua halaman**

Buka `http://localhost:3000` dan cek:
- [ ] Landing page tampil dengan hero dan 3 feature card
- [ ] `/register` — form register creator berfungsi
- [ ] `/login` — form login berfungsi, redirect sesuai role
- [ ] `/dashboard` — list kasus dengan filter
- [ ] `/cases/new` — form buat kasus baru
- [ ] `/cases/{id}/criteria` — tree kriteria dengan add/delete
- [ ] `/cases/{id}/alternatives` — list alternatif
- [ ] `/cases/{id}/experts` — invite pakar + progress bar
- [ ] `/cases/{id}/progress` — tombol agregasi
- [ ] `/cases/{id}/results` — ranking table + chart
- [ ] `/expert/dashboard` — list kasus pakar
- [ ] `/expert/cases/{id}` — checklist matriks
- [ ] `/expert/cases/{id}/compare/{node}` — MatrixInput + CR hasil

- [ ] **Step 4: Build production check**

```bash
cd frontend
npm run build
```

Expected: Build berhasil tanpa error TypeScript.

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: Think Decision frontend v0.1.0 - complete Next.js implementation"
```

---

## Catatan untuk Eksekusi di VS Code

1. **Jalankan dari direktori `C:\Apps\Think Decision\`** — semua perintah `npx create-next-app` dijalankan dari root
2. **Backend harus running** di `http://localhost:8000` sebelum test frontend
3. **Node.js 18+** diperlukan — cek dengan `node --version`
4. **Setelah Task 1**, pastikan `frontend/.env.local` sudah ada dengan `NEXT_PUBLIC_API_URL=http://localhost:8000`
5. **Shadcn/ui** akan generate file `components/ui/` secara otomatis — jangan edit manual
