'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

export default function CaseLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const caseId = params.id;

  const currentTab = pathname?.split('/').pop() || 'criteria';

  const tabs = [
    { name: 'Kriteria', href: `/cases/${caseId}/criteria` },
    { name: 'Alternatif', href: `/cases/${caseId}/alternatives` },
    { name: 'Pakar', href: `/cases/${caseId}/experts` },
    { name: 'Progress', href: `/cases/${caseId}/progress` },
    { name: 'Hasil', href: `/cases/${caseId}/results` },
  ];

  return (
    <main className="td-page">
      <div className="td-container">
        {/* Case head section */}
        <div className="py-10 border-b border-[var(--td-border)]">
          <div className="flex items-center gap-2 mb-5 text-xs text-[var(--td-text-muted)]">
            <Link href="/dashboard" className="hover:text-[var(--td-near-black)]">
              Kasus Saya
            </Link>
            <span>/</span>
            <span>Seleksi Pegawai Baru Q2</span>
          </div>

          <div className="flex items-end justify-between gap-6 mb-5">
            <div>
              <h1 className="text-6xl font-black leading-none mb-3">Seleksi Pegawai Baru Q2</h1>
              <div className="flex items-center gap-3 text-sm text-[var(--td-text-muted)]">
                <span className="td-badge td-badge-active">● Aktif</span>
                <span className="font-mono font-bold tracking-wider">AHP · GMJ</span>
                <span>·</span>
                <span>Diperbarui 12 menit lalu</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between gap-4 mt-8">
            <div className="td-tabs">
              {tabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`td-tab ${currentTab === tab.name.toLowerCase() ? 'is-active' : ''}`}
                >
                  {tab.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {children}
      </div>
    </main>
  );
}
