'use client';

export default function AlternativesPage() {
  return (
    <div className="py-12">
      <div className="td-card">
        <h2 className="text-3xl font-black mb-2">Alternatif Keputusan</h2>
        <p className="text-[var(--td-text-muted)] mb-8">Daftar opsi yang akan diperingkat oleh pakar berdasarkan kriteria di atas.</p>

        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--td-border)]">
              <div className="w-9 h-9 rounded-full bg-[var(--td-green)] text-[var(--td-green-dark)] flex items-center justify-center flex-shrink-0 font-black">
                {i}
              </div>
              <div className="flex-1">
                <div className="font-bold">Alternatif {i}</div>
              </div>
              <button className="text-[var(--td-warm-dark)] hover:text-red-600">
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 rounded-2xl bg-[var(--td-surface)]">
          <input
            type="text"
            placeholder="Tambah alternatif baru..."
            className="w-full bg-transparent font-bold placeholder-[var(--td-warm-dark)]"
          />
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <button className="td-btn td-btn-secondary">Batalkan</button>
          <button className="td-btn td-btn-primary">Simpan</button>
        </div>
      </div>
    </div>
  );
}
