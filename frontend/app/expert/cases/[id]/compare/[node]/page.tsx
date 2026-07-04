'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function MatrixComparePage({ params }: { params: { id: string; node: string } }) {
  const [matrix, setMatrix] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [peerData, setPeerData] = useState<Record<string, any>>({});
  const [showPeerHints, setShowPeerHints] = useState(false);
  const [isLoadingPeerData, setIsLoadingPeerData] = useState(false);

  const items = ['Kualitas', 'Harga', 'Keberlanjutan'];

  // Fetch peer data on component mount
  useEffect(() => {
    if (showPeerHints && Object.keys(peerData).length === 0) {
      fetchPeerData();
    }
  }, [showPeerHints]);

  const fetchPeerData = async () => {
    setIsLoadingPeerData(true);
    try {
      const response = await fetch(`/api/expert/${params.id}/comparisons/${params.node}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch peer comparison data: ${response.statusText}`);
      }

      const data = await response.json();
      setPeerData(data.comparisons || {});
    } catch (error) {
      console.error('Error fetching peer data:', error);
    } finally {
      setIsLoadingPeerData(false);
    }
  };

  const handleChange = (i: number, j: number, value: string) => {
    const key = `${i}-${j}`;
    setMatrix({ ...matrix, [key]: value });
    // Update peer data for this pair if hints are showing
    if (showPeerHints && peerData[key]) {
      setPeerData({
        ...peerData,
        [key]: {
          ...peerData[key],
          your_value: value ? parseInt(value) : null,
        },
      });
    }
  };

  const handleSubmit = () => {
    // Call API to submit matrix
    setShowResult(true);
  };

  return (
    <main className="td-page">
      <div className="td-container">
        <div className="py-8 border-b border-[var(--td-border)] mb-8">
          <div className="flex items-center gap-2 mb-4 text-sm text-[var(--td-text-muted)]">
            <Link href={`/expert/cases/${params.id}`} className="hover:text-[var(--td-near-black)]">
              Perbandingan
            </Link>
            <span>/</span>
            <span>Kriteria Utama</span>
          </div>

          <h1 className="text-5xl font-black leading-none mb-3">Matriks Perbandingan Berpasangan</h1>
          <p className="text-[var(--td-text-muted)] max-w-2xl">
            Bandingkan setiap pasang item menggunakan skala Saaty 1–9. Nilai 1 berarti sama pentingnya, 9 berarti jauh lebih penting.
          </p>
        </div>

        <div className="td-card">
          {!showResult ? (
            <>
              {/* Saaty Scale Legend */}
              <div className="bg-[var(--td-mint)] rounded-2xl p-5 mb-6 flex gap-6 overflow-x-auto items-center justify-between">
                <div className="flex gap-6">
                  <h4 className="font-black text-xs uppercase tracking-wider text-[var(--td-green-dark)] flex-shrink-0 py-1">
                    Skala Saaty:
                  </h4>
                  <div className="flex gap-5 text-xs text-[var(--td-green-dark)] flex-wrap">
                    {['1: Sama', '3: Sedang', '5: Kuat', '7: Sangat Kuat', '9: Ekstrem'].map((scale) => (
                      <span key={scale} className="whitespace-nowrap font-bold">
                        {scale}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setShowPeerHints(!showPeerHints)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                    showPeerHints
                      ? 'bg-[var(--td-green-dark)] text-white'
                      : 'bg-white text-[var(--td-green-dark)] border border-[var(--td-green-dark)]'
                  }`}
                >
                  👥 {showPeerHints ? 'Hide' : 'Show'} Peer Data
                </button>
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto mb-8">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th></th>
                      {items.map((item) => (
                        <th
                          key={item}
                          className="p-4 h-16 text-center text-xs font-black uppercase tracking-wider text-[var(--td-near-black)]"
                        >
                          {item}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((rowItem, i) => (
                      <tr key={i}>
                        <th className="text-right pr-4 text-xs font-black uppercase tracking-wider text-[var(--td-near-black)] w-32">
                          {rowItem}
                        </th>
                        {items.map((colItem, j) => {
                          if (i === j) {
                            return (
                              <td key={j} className="h-16 p-1">
                                <div className="h-full rounded-2xl bg-[var(--td-near-black)] text-[var(--td-green)] font-mono font-bold text-lg flex items-center justify-center">
                                  1
                                </div>
                              </td>
                            );
                          }

                          if (i > j) {
                            return (
                              <td key={j} className="h-16 p-1">
                                <div className="h-full rounded-2xl bg-[var(--td-surface)] text-[var(--td-warm-dark)] font-mono font-bold text-sm flex items-center justify-center">
                                  {matrix[`${j}-${i}`] ? `1/${matrix[`${j}-${i}`]}` : '...'}
                                </div>
                              </td>
                            );
                          }

                          const pairKey = `${i}-${j}`;
                          const peerInfo = peerData[pairKey];

                          return (
                            <td key={j} className="h-auto p-1">
                              <div className="flex flex-col">
                                <select
                                  className="w-full h-16 rounded-t-2xl bg-white border-2 border-[var(--td-border)] text-center font-bold focus:border-[var(--td-near-black)] appearance-none px-2"
                                  value={matrix[pairKey] || ''}
                                  onChange={(e) => handleChange(i, j, e.target.value)}
                                >
                                  <option value="">—</option>
                                  <option value="1">1</option>
                                  <option value="2">2</option>
                                  <option value="3">3</option>
                                  <option value="4">4</option>
                                  <option value="5">5</option>
                                  <option value="6">6</option>
                                  <option value="7">7</option>
                                  <option value="8">8</option>
                                  <option value="9">9</option>
                                </select>

                                {/* Peer Hint */}
                                {showPeerHints && peerInfo && (
                                  <div className="p-2 rounded-b-2xl bg-blue-50 border-2 border-t-0 border-blue-200 text-xs text-blue-700">
                                    <div className="font-bold">Peers: {peerInfo.peer_range[0]}-{peerInfo.peer_range[1]}</div>
                                    <div className="text-blue-600">med: {peerInfo.peer_median}</div>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 justify-end">
                <Link href={`/expert/cases/${params.id}`} className="td-btn td-btn-secondary">
                  Kembali
                </Link>
                <button onClick={handleSubmit} className="td-btn td-btn-primary">
                  Lihat Hasil
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Result State */}
              <div className="bg-[var(--td-mint)] rounded-2xl p-6 mb-8 flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[var(--td-green-dark)] text-[var(--td-green)] flex items-center justify-center flex-shrink-0 text-2xl font-black">
                  ✓
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-[var(--td-green-dark)] mb-1">Konsisten!</h3>
                  <p className="text-[var(--td-green-dark)]">
                    Consistency Ratio: <span className="font-black">0.082</span> (≤ 0.1 ✓)
                  </p>
                </div>
              </div>

              {/* Priority vector */}
              <div className="mb-8">
                <h3 className="font-black text-lg mb-4">Vektor Prioritas</h3>
                <div className="space-y-3">
                  {items.map((item, i) => (
                    <div key={item} className="flex items-center gap-4">
                      <div className="w-32 font-bold text-sm">{item}</div>
                      <div className="flex-1 h-8 rounded-full bg-[var(--td-surface)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--td-green)] flex items-center justify-end pr-3 font-black text-xs text-[var(--td-green-dark)]"
                          style={{ width: `${[40, 35, 25][i]}%` }}
                        >
                          {[40, 35, 25][i]}%
                        </div>
                      </div>
                      <div className="w-16 text-right font-mono font-bold text-sm">{[0.4, 0.35, 0.25][i]}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowResult(false)} className="td-btn td-btn-secondary">
                  Ubah Input
                </button>
                <button className="td-btn td-btn-primary">Simpan & Lanjut</button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
