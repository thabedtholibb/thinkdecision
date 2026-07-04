'use client';

export default function ProgressPage() {
  return (
    <div className="py-12">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Pakar', value: '3', delta: 'Semua undangan terkirim' },
          { label: 'Selesai', value: '1', delta: 'CR Verified' },
          { label: 'Sedang Mengisi', value: '1', delta: 'In progress' },
          { label: 'Belum Mulai', value: '1', delta: 'Pending' },
        ].map((card) => (
          <div key={card.label} className="td-card">
            <div className="text-xs uppercase font-black tracking-wider text-[var(--td-text-muted)]">
              {card.label}
            </div>
            <div className="text-5xl font-black mt-3 leading-none">{card.value}</div>
            <div className="text-xs text-[var(--td-text-muted)] mt-2">{card.delta}</div>
          </div>
        ))}
      </div>

      {/* Main progress card */}
      <div className="td-card mb-8">
        <div className="flex items-center gap-8">
          <div>
            <div className="text-7xl font-black leading-none text-[var(--td-green)]">
              1<span className="text-3xl text-[var(--td-text-muted)]">/3</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-black mb-2">Sepertiga Jalan</h3>
            <p className="text-[var(--td-text-muted)] leading-relaxed">Anda telah menerima 1 dari 3 penilaian pakar.</p>
            <div className="td-progress td-progress-lg mt-4">
              <div className="td-progress-fill" style={{ width: '33%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Aggregation card */}
      <div className="bg-[var(--td-mint)] rounded-3xl p-7 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-[var(--td-green-dark)] mb-2">Siap Agregasi</h3>
          <p className="text-[var(--td-green-dark)] text-sm leading-relaxed max-w-md">
            Minimal 1 pakar sudah menyelesaikan. Klik tombol di samping untuk mulai agregasi hasil.
          </p>
        </div>
        <button className="td-btn td-btn-dark flex-shrink-0">Agregasi Sekarang</button>
      </div>
    </div>
  );
}
