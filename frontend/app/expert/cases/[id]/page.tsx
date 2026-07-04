'use client';

import Link from 'next/link';

export default function ExpertCaseChecklist({ params }: { params: { id: string } }) {
  const comparisons = [
    { id: 1, name: 'Kriteria Utama', level: 'L1', status: 'done' },
    { id: 2, name: 'Sub-Kriteria Kualitas', level: 'L2', status: 'done' },
    { id: 3, name: 'Sub-Kriteria Harga', level: 'L2', status: 'progress' },
    { id: 4, name: 'Sub-Kriteria Keberlanjutan', level: 'L2', status: 'todo' },
  ];

  return (
    <main className="td-page">
      <div className="td-container">
        <div className="py-8">
          <div className="flex items-center gap-2 mb-6 text-sm text-[var(--td-text-muted)]">
            <Link href="/expert/dashboard" className="hover:text-[var(--td-near-black)]">
              Kasus Saya
            </Link>
            <span>/</span>
            <span>Pemilihan Supplier Bahan Baku</span>
          </div>

          <h1 className="text-6xl font-black leading-none mb-6">Pemilihan Supplier Bahan Baku</h1>

          {/* Progress card */}
          <div className="bg-[var(--td-near-black)] text-white rounded-[var(--td-radius-card)] p-8 mb-8 flex items-center gap-8">
            <div>
              <div className="text-8xl font-black leading-none text-[var(--td-green)]">
                2<span className="text-4xl text-white/40">/4</span>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black mb-2">Setengah jalan</h2>
              <p className="text-white/70 leading-relaxed">
                Anda telah menyelesaikan 2 dari 4 matriks perbandingan. Lanjutkan dengan sub-kriteria untuk mendekati selesai.
              </p>
              <div className="td-progress td-progress-lg mt-4 bg-white/12">
                <div className="td-progress-fill" style={{ width: '50%' }}></div>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="td-card">
            <h3 className="text-2xl font-black mb-6">Daftar Perbandingan</h3>

            <div className="space-y-2">
              {comparisons.map((comparison) => (
                <Link
                  key={comparison.id}
                  href={`/expert/cases/${params.id}/compare/${comparison.id}`}
                  className={`grid grid-cols-[40px_1fr_120px_32px] gap-5 items-center p-5 rounded-2xl cursor-pointer transition-all ${
                    comparison.status === 'done'
                      ? 'bg-[var(--td-mint)] hover:shadow-lg'
                      : 'bg-white border border-[var(--td-border)] hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-black ${
                      comparison.status === 'done'
                        ? 'bg-[var(--td-green-dark)]'
                        : comparison.status === 'progress'
                          ? 'bg-[var(--td-warm-dark)]'
                          : 'bg-[var(--td-surface)]'
                    }`}
                  >
                    {comparison.status === 'done' ? '✓' : comparison.status === 'progress' ? '→' : '○'}
                  </div>
                  <div>
                    <div className="font-bold text-base">{comparison.name}</div>
                    <div
                      className={`text-xs font-mono font-bold tracking-wider uppercase mt-1 ${
                        comparison.status === 'done'
                          ? 'text-[var(--td-green-dark)]'
                          : 'text-[var(--td-text-muted)]'
                      }`}
                    >
                      {comparison.level}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-bold ${
                      comparison.status === 'done'
                        ? 'text-[var(--td-green-dark)]'
                        : comparison.status === 'progress'
                          ? 'text-[var(--td-warm-dark)]'
                          : 'text-[var(--td-text-muted)]'
                    }`}
                  >
                    {comparison.status === 'done'
                      ? 'Selesai'
                      : comparison.status === 'progress'
                        ? 'Sedang'
                        : 'Belum'}
                  </div>
                  <div className="text-[var(--td-text-muted)]">→</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
