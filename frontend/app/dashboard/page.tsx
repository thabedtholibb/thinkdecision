'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCases } from '@/lib/hooks';
import { LoadingState, ErrorState } from '@/components/LoadingSpinner';

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data: cases = [], isLoading: casesLoading, error } = useCases();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
    if (!authLoading && user && user.role !== 'creator') {
      router.push('/expert/cases');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="td-page flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-12 bg-[var(--td-surface)] rounded-full w-32"></div>
        </div>
      </div>
    );
  }

  const filteredCases = cases.filter((c: any) => {
    if (selectedFilter === 'all') return true;
    return c.status === selectedFilter;
  });

  return (
    <main className="td-page">
      <div className="td-container">
        {/* Page Head */}
        <div className="py-12 flex items-end justify-between gap-6 border-b border-[var(--td-border)]">
          <div>
            <h1 className="text-7xl font-black mb-3">Kasus Saya</h1>
            <p className="text-[var(--td-text-muted)] text-base">
              Kelola, undang pakar, dan agregasi keputusan multi-kriteria Anda.
            </p>
          </div>
          <Link href="/cases/new" className="td-btn td-btn-primary flex-shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Kasus Baru
          </Link>
        </div>

        {/* Toolbar */}
        <div className="py-8 flex items-center justify-between gap-4">
          <div className="td-filter-group">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`td-filter-pill ${selectedFilter === 'all' ? 'is-active' : ''}`}
            >
              Semua · {cases.length}
            </button>
            <button
              onClick={() => setSelectedFilter('draft')}
              className={`td-filter-pill ${selectedFilter === 'draft' ? 'is-active' : ''}`}
            >
              Draft · {cases.filter((c: any) => c.status === 'draft').length}
            </button>
            <button
              onClick={() => setSelectedFilter('active')}
              className={`td-filter-pill ${selectedFilter === 'active' ? 'is-active' : ''}`}
            >
              Aktif · {cases.filter((c: any) => c.status === 'active').length}
            </button>
            <button
              onClick={() => setSelectedFilter('closed')}
              className={`td-filter-pill ${selectedFilter === 'closed' ? 'is-active' : ''}`}
            >
              Ditutup · {cases.filter((c: any) => c.status === 'closed').length}
            </button>
          </div>
        </div>

        {/* Case Grid */}
        {error && <ErrorState message={error instanceof Error ? error.message : 'Gagal memuat kasus'} />}
        {casesLoading && <LoadingState />}

        {!casesLoading && filteredCases.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--td-text-muted)] mb-4">Belum ada kasus.</p>
            <Link href="/cases/new" className="td-btn td-btn-primary">
              Buat Kasus Pertama
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6 pb-16">
            {filteredCases.map((caseItem: any) => (
              <Link
                key={caseItem.id}
                href={`/cases/${caseItem.id}/${caseItem.status === 'closed' ? 'results' : 'criteria'}`}
                className="td-card hover:shadow-lg hover:scale-105 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <span className={`td-badge td-badge-${caseItem.status}`}>
                    {caseItem.status === 'draft' ? 'Draft' : caseItem.status === 'active' ? '● Aktif' : 'Ditutup'}
                  </span>
                  <span className="font-mono text-xs font-bold text-[var(--td-warm-dark)] tracking-wider">
                    {caseItem.method} · {caseItem.aggregationMethod}
                  </span>
                </div>
                <h3 className="text-3xl font-black leading-tight mb-4">{caseItem.name}</h3>
                <p className="text-[var(--td-text-muted)] text-sm leading-relaxed mb-4">
                  {caseItem.description}
                </p>
                {caseItem.status === 'active' && (
                  <div className="td-progress mb-4">
                    <div className="td-progress-fill" style={{ width: '50%' }}></div>
                  </div>
                )}
                <div className="flex gap-6 py-4 border-t border-[var(--td-border)] text-xs">
                  <div>
                    <div className="text-2xl font-black">{caseItem.criteriaCount || 0}</div>
                    <div className="text-[var(--td-text-muted)] mt-1">Kriteria</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black">{caseItem.alternativesCount || 0}</div>
                    <div className="text-[var(--td-text-muted)] mt-1">Alternatif</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black">{caseItem.expertsCount || 0}</div>
                    <div className="text-[var(--td-text-muted)] mt-1">Pakar</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 text-xs text-[var(--td-text-muted)]">
                  <span>Diperbarui {new Date(caseItem.updatedAt).toLocaleDateString('id-ID')}</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
