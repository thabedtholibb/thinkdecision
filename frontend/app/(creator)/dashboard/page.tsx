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
