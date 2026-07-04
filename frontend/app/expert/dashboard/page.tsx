'use client';

import Link from 'next/link';

export default function ExpertDashboardPage() {
  const cases = [
    {
      id: 1,
      name: 'Pemilihan Supplier Bahan Baku',
      creator: 'Ahmad Saputra',
      status: 'accepted',
      progress: 50,
    },
    {
      id: 2,
      name: 'Seleksi Pegawai Baru Q2',
      creator: 'Budi Santoso',
      status: 'pending',
      progress: 0,
    },
    {
      id: 3,
      name: 'Evaluasi Vendor IT 2026',
      creator: 'Siti Nurhaliza',
      status: 'completed',
      progress: 100,
    },
  ];

  return (
    <main className="td-page">
      <div className="td-container">
        <div className="py-12 border-b border-[var(--td-border)]">
          <h1 className="text-7xl font-black mb-3">Kasus Saya</h1>
          <p className="text-[var(--td-text-muted)]">Daftar kasus yang sudah Anda terima undangan.</p>
        </div>

        {/* Cases list */}
        <div className="py-12 space-y-3">
          {cases.map((caseItem) => (
            <Link
              key={caseItem.id}
              href={`/expert/cases/${caseItem.id}`}
              className="block p-5 rounded-2xl border border-[var(--td-border)] hover:shadow-lg hover:border-[var(--td-green)] transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-lg font-bold">{caseItem.name}</h3>
                  <p className="text-xs text-[var(--td-text-muted)] mt-1">Creator: {caseItem.creator}</p>
                </div>
                <span
                  className={`td-badge ${
                    caseItem.status === 'completed'
                      ? 'td-badge-completed'
                      : caseItem.status === 'accepted'
                        ? 'td-badge-accepted'
                        : 'td-badge-pending'
                  }`}
                >
                  {caseItem.status === 'completed' ? '✓ Selesai' : caseItem.status === 'accepted' ? '● Diterima' : '○ Menunggu'}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--td-surface)]">
                <div
                  className="h-full rounded-full bg-[var(--td-green)] transition-all"
                  style={{ width: `${caseItem.progress}%` }}
                ></div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
