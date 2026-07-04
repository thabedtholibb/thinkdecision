'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AgreementHeatmap from '@/src/components/AgreementHeatmap';
import ConflictResolutionPanel from '@/src/components/ConflictResolutionPanel';
import ExpertRevisionDashboard from '@/src/components/ExpertRevisionDashboard';

export default function ResultsPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [isLoading, setIsLoading] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  const [isCreator, setIsCreator] = useState(true); // TODO: Check actual user role
  const [revisionRequests, setRevisionRequests] = useState([]);

  // Sample results
  const results = [
    { rank: 1, name: 'Supplier A', score: '2.145', pct: 60.4 },
    { rank: 2, name: 'Supplier B', score: '1.876', pct: 28.7 },
    { rank: 3, name: 'Supplier C', score: '0.956', pct: 10.9 },
  ];

  // Fetch conflict data when Agreement tab is opened
  useEffect(() => {
    if (activeTab === 'agreement' && !conflictData) {
      fetchConflictData();
    }
  }, [activeTab]);

  const fetchConflictData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cases/${params.id}/conflicts`);

      if (!response.ok) {
        throw new Error(`Failed to fetch conflict data: ${response.statusText}`);
      }

      const data = await response.json();
      setConflictData(data);
    } catch (error) {
      console.error('Error fetching conflict data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevisionRequested = () => {
    // Refresh conflict data after revision requested
    setConflictData(null);
    fetchConflictData();
  };

  const handleRevisionSubmitted = () => {
    // Refresh results and conflict data
    window.location.reload();
  };

  return (
    <main className="td-page">
      <div className="td-container">
        {/* Header */}
        <div className="py-8 border-b border-[var(--td-border)] mb-8">
          <div className="flex items-center gap-2 mb-4 text-sm text-[var(--td-text-muted)]">
            <Link href={`/cases/${params.id}`} className="hover:text-[var(--td-near-black)]">
              Kasus
            </Link>
            <span>/</span>
            <span>Hasil Analisis</span>
          </div>

          <h1 className="text-5xl font-black leading-none mb-3">Hasil Analisis AHP</h1>
          <p className="text-[var(--td-text-muted)] max-w-2xl">
            Peringkat alternatif berdasarkan penilaian dari semua pakar. Lihat detail penilaian pakar dan resolusi konflik di tab Persetujuan.
          </p>
        </div>

        {/* Info Bar */}
        <div className="bg-[var(--td-mint)] rounded-3xl p-5 mb-8 flex items-center justify-between gap-6">
          <div className="flex gap-8">
            <div>
              <div className="text-xs uppercase font-black tracking-wider text-[var(--td-green-dark)] opacity-70">
                Metode Agregasi
              </div>
              <div className="text-lg font-black text-[var(--td-green-dark)] mt-1">GMJ</div>
            </div>
            <div>
              <div className="text-xs uppercase font-black tracking-wider text-[var(--td-green-dark)] opacity-70">
                Total Pakar
              </div>
              <div className="text-lg font-black text-[var(--td-green-dark)] mt-1">5</div>
            </div>
            <div>
              <div className="text-xs uppercase font-black tracking-wider text-[var(--td-green-dark)] opacity-70">
                CR
              </div>
              <div className="text-lg font-black text-[var(--td-green-dark)] mt-1">0.082</div>
            </div>
          </div>
          <button className="td-btn td-btn-dark flex-shrink-0">Download Laporan</button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-[var(--td-border)] mb-8 flex gap-2 overflow-x-auto">
          {[
            { id: 'summary', label: 'Ringkasan', icon: '📊' },
            { id: 'experts', label: 'Pakar', icon: '👥' },
            { id: 'agreement', label: 'Persetujuan', icon: '✓' },
            { id: 'sensitivity', label: 'Sensitivitas', icon: '⚙️' },
            { id: 'export', label: 'Ekspor', icon: '📥' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[var(--td-green)] text-[var(--td-green)]'
                  : 'border-transparent text-[var(--td-text-muted)] hover:text-[var(--td-near-black)]'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}

        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <>
            {/* Ranking List */}
            <div className="td-card mb-8">
              <h3 className="text-2xl font-black mb-6">Peringkat Akhir</h3>

              <div className="space-y-3">
                {results.map((item, i) => (
                  <div
                    key={item.name}
                    className={`grid grid-cols-[60px_1fr_100px_80px] gap-6 items-center p-5 rounded-2xl ${
                      i === 0
                        ? 'bg-[var(--td-near-black)] text-white'
                        : 'bg-white border border-[var(--td-border)]'
                    }`}
                  >
                    <div
                      className={`text-4xl font-black leading-none ${
                        i === 0 ? 'text-[var(--td-green)]' : 'text-[var(--td-text-muted)]'
                      }`}
                    >
                      #{item.rank}
                    </div>
                    <div className="font-bold text-lg">{item.name}</div>
                    <div className="text-right font-mono text-sm font-bold">w = {item.score}</div>
                    <div className="text-right text-2xl font-black">{item.pct}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar Chart */}
            <div className="td-card">
              <h3 className="text-2xl font-black mb-6">Distribusi Prioritas</h3>

              <div className="space-y-6">
                {results.map((item, i) => (
                  <div key={item.name} className={`grid grid-cols-[180px_1fr_80px] gap-5 items-center`}>
                    <div className="font-bold text-sm">{item.name}</div>
                    <div className="h-9 rounded-2xl bg-[var(--td-surface)] overflow-hidden">
                      <div
                        className={`h-full rounded-2xl flex items-center justify-end pr-3 font-black text-xs transition-all ${
                          i === 0
                            ? 'bg-[var(--td-green)] text-[var(--td-green-dark)]'
                            : i === 1
                              ? 'bg-[#c4ec9b] text-[var(--td-near-black)]'
                              : 'bg-[var(--td-mint)] text-[var(--td-green-dark)]'
                        }`}
                        style={{ width: `${item.pct}%` }}
                      >
                        {item.pct}%
                      </div>
                    </div>
                    <div className="text-right font-mono text-sm font-bold">{item.pct}%</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* EXPERTS TAB */}
        {activeTab === 'experts' && (
          <div className="td-card">
            <h3 className="text-2xl font-black mb-6">Penilaian Pakar</h3>
            <div className="p-6 text-center text-[var(--td-text-muted)]">
              <p>Daftar penilaian dari setiap pakar akan ditampilkan di sini.</p>
            </div>
          </div>
        )}

        {/* AGREEMENT TAB */}
        {activeTab === 'agreement' && (
          <div className="space-y-8">
            {isCreator && conflictData && (
              <>
                {/* Conflict Resolution Panel - Creator Only */}
                <div className="td-card">
                  <h3 className="text-2xl font-black mb-6">Minta Revisi Penilaian</h3>
                  <ConflictResolutionPanel
                    caseId={params.id}
                    disagreementPairs={conflictData.disagreement_pairs}
                    experts={{
                      'expert_1': { name: 'Dr. Budi', email: 'budi@example.com', avatarColor: '#FF6B6B' },
                      'expert_2': { name: 'Prof. Ani', email: 'ani@example.com', avatarColor: '#4ECDC4' },
                      'expert_3': { name: 'Ir. Citra', email: 'citra@example.com', avatarColor: '#45B7D1' },
                      'expert_4': { name: 'Dr. Dede', email: 'dede@example.com', avatarColor: '#FFA07A' },
                      'expert_5': { name: 'Eng. Eka', email: 'eka@example.com', avatarColor: '#98D8C8' },
                    }}
                    onRevisionRequested={handleRevisionRequested}
                    isLoading={isLoading}
                  />
                </div>

                {/* Agreement Heatmap */}
                <div className="td-card">
                  <h3 className="text-2xl font-black mb-6">Matriks Persetujuan Pakar</h3>
                  <AgreementHeatmap
                    expertAgreement={conflictData.expert_agreement}
                    expertNames={{
                      'expert_1': 'Budi',
                      'expert_2': 'Ani',
                      'expert_3': 'Citra',
                      'expert_4': 'Dede',
                      'expert_5': 'Eka',
                    }}
                    outlierExperts={conflictData.outlier_experts}
                    onExpertSelect={(expertId) => {
                      // Could navigate to expert detail view
                      console.log('Selected expert:', expertId);
                    }}
                  />
                </div>

                {/* Disagreement Pairs Summary */}
                {conflictData.disagreement_pairs.length > 0 && (
                  <div className="td-card">
                    <h3 className="text-2xl font-black mb-6">Pasangan dengan Perbedaan Pendapat</h3>
                    <div className="space-y-4">
                      {conflictData.disagreement_pairs.map((pair, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl border border-[var(--td-border)] hover:border-[var(--td-green)] transition-colors"
                        >
                          <div className="font-bold mb-2">
                            {pair.item_a} vs {pair.item_b}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-[var(--td-text-muted)] text-xs">Varians</div>
                              <div className="font-bold">{pair.variance.toFixed(2)}</div>
                            </div>
                            <div>
                              <div className="text-[var(--td-text-muted)] text-xs">Rentang</div>
                              <div className="font-bold">{pair.min} - {pair.max}</div>
                            </div>
                            <div>
                              <div className="text-[var(--td-text-muted)] text-xs">Median</div>
                              <div className="font-bold">{pair.median}</div>
                            </div>
                            <div>
                              <div className="text-[var(--td-text-muted)] text-xs">Status</div>
                              <div className="font-bold text-amber-600">{pair.suggestion}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {!isCreator && revisionRequests.length > 0 && (
              <div className="td-card">
                <h3 className="text-2xl font-black mb-6">Permintaan Revisi Penilaian</h3>
                <ExpertRevisionDashboard
                  caseId={params.id}
                  revisionRequests={revisionRequests}
                  peerData={{}}
                  onRevisionSubmitted={handleRevisionSubmitted}
                  isLoading={isLoading}
                />
              </div>
            )}

            {isLoading && (
              <div className="td-card">
                <div className="p-6 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-[var(--td-border)] border-t-[var(--td-green)] rounded-full mx-auto mb-2" />
                  <p className="text-[var(--td-text-muted)]">Memuat data persetujuan...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SENSITIVITY TAB */}
        {activeTab === 'sensitivity' && (
          <div className="td-card">
            <h3 className="text-2xl font-black mb-6">Analisis Sensitivitas</h3>
            <div className="p-6 text-center text-[var(--td-text-muted)]">
              <p>Analisis sensitivitas akan ditampilkan di sini.</p>
            </div>
          </div>
        )}

        {/* EXPORT TAB */}
        {activeTab === 'export' && (
          <div className="td-card">
            <h3 className="text-2xl font-black mb-6">Ekspor Hasil</h3>
            <div className="p-6 text-center text-[var(--td-text-muted)]">
              <p>Opsi ekspor akan ditampilkan di sini.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
