'use client';

export default function CriteriaPage({ params }: { params: { id: string } }) {
  return (
    <div className="py-12">
      <div className="td-card">
        <h2 className="text-3xl font-black mb-2">Kriteria Keputusan</h2>
        <p className="text-[var(--td-text-muted)] mb-8">Daftar kriteria dan sub-kriteria dalam hierarki pengambilan keputusan.</p>

        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--td-surface)]">
              <div className="w-8 h-8 rounded-xl bg-[var(--td-mint)] text-[var(--td-green-dark)] flex items-center justify-center flex-shrink-0 font-black text-sm">
                K{i}
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm">Kriteria {i}</div>
              </div>
              <button className="text-[var(--td-warm-dark)] hover:bg-[var(--td-surface)] p-2 rounded-lg">
                ⋮
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <button className="td-btn td-btn-secondary">Batalkan</button>
          <button className="td-btn td-btn-primary">Simpan</button>
        </div>
      </div>
    </div>
  );
}
