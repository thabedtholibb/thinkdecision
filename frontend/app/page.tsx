'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="td-page">
      {/* Hero */}
      <section className="td-container" style={{ paddingTop: '96px', paddingBottom: '64px' }}>
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-[var(--td-mint)] text-[var(--td-green-dark)] rounded-full text-xs font-black tracking-wider mb-6">
            <span className="td-dot" style={{ backgroundColor: 'var(--td-green-dark)' }}></span>
            Multi-Criteria Decision Making · AHP
          </div>

          <h1 className="text-9xl font-black leading-none mb-6">
            Keputusan terbaik, <br />
            bersama <span className="bg-[var(--td-green)] px-2 rounded-2xl inline-block">para ahli</span>.
          </h1>

          <p className="text-2xl text-[var(--td-text-muted)] max-w-3xl mb-10 leading-relaxed">
            Think Decision menyatukan penilaian banyak pakar ke dalam satu keputusan yang konsisten dan dapat
            dipertanggungjawabkan — dengan metode AHP, agregasi otomatis, dan verifikasi rasio konsistensi.
          </p>

          <div className="flex gap-3 flex-wrap mb-20">
            <Link href="/auth/register" className="td-btn td-btn-primary td-btn-lg">
              Mulai sebagai Creator →
            </Link>
            <Link href="/auth/login" className="td-btn td-btn-secondary td-btn-lg">
              Masuk sebagai Pakar
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 pt-8 border-t border-[var(--td-border)]">
            <div className="py-6">
              <div className="text-6xl font-black leading-none tracking-tighter">1–9</div>
              <div className="text-sm text-[var(--td-text-muted)] mt-2">Skala Saaty terstandar untuk perbandingan berpasangan</div>
            </div>
            <div className="py-6">
              <div className="text-6xl font-black leading-none tracking-tighter">CR ≤ 0.1</div>
              <div className="text-sm text-[var(--td-text-muted)] mt-2">Verifikasi rasio konsistensi otomatis</div>
            </div>
            <div className="py-6">
              <div className="text-6xl font-black leading-none tracking-tighter">∞</div>
              <div className="text-sm text-[var(--td-text-muted)] mt-2">Pakar per kasus, hierarki kriteria fleksibel</div>
            </div>
            <div className="py-6">
              <div className="text-6xl font-black leading-none tracking-tighter">GMJ / GMP</div>
              <div className="text-sm text-[var(--td-text-muted)] mt-2">Dua mode agregasi geometris</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '96px 0', background: 'var(--td-bg-soft)' }}>
        <div className="td-container">
          <h2 className="text-7xl font-black mb-4 max-w-3xl leading-none">Tiga pilar di balik setiap keputusan.</h2>
          <p className="text-lg text-[var(--td-text-muted)] max-w-xl mb-16 leading-relaxed">
            Sebuah keputusan multi-kriteria tidak ditentukan oleh satu suara, tapi oleh proses yang transparan dan
            terukur. Inilah yang Think Decision otomatisasi.
          </p>

          <div className="td-grid-3">
            <article className="td-card">
              <div className="w-14 h-14 rounded-2xl bg-[var(--td-green)] text-[var(--td-green-dark)] flex items-center justify-center mb-6">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="7" r="3" />
                  <circle cx="17" cy="7" r="3" />
                  <path d="M3 21v-1a5 5 0 0 1 5-5h2" />
                  <path d="M14 21v-1a5 5 0 0 1 5-5h2" />
                </svg>
              </div>
              <h3 className="text-4xl font-black mb-4">Multi-Expert</h3>
              <p className="text-[var(--td-text-muted)] text-lg leading-relaxed flex-1">
                Undang pakar lewat email. Setiap pakar mengisi matriks perbandingan secara independen, tanpa saling
                memengaruhi — menjaga objektivitas penilaian.
              </p>
              <div className="mt-6 font-mono text-xs text-[var(--td-warm-dark)] font-bold tracking-wider">
                // independent_assessment
              </div>
            </article>

            <article className="td-card">
              <div className="w-14 h-14 rounded-2xl bg-[var(--td-green)] text-[var(--td-green-dark)] flex items-center justify-center mb-6">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="M7 14l4-4 4 4 5-7" />
                </svg>
              </div>
              <h3 className="text-4xl font-black mb-4">Agregasi Otomatis</h3>
              <p className="text-[var(--td-text-muted)] text-lg leading-relaxed flex-1">
                Pilih GMJ (Geometric Mean of Judgments) atau GMP (Geometric Mean of Priorities). Sistem menggabungkan
                penilaian semua pakar menjadi satu prioritas akhir.
              </p>
              <div className="mt-6 font-mono text-xs text-[var(--td-warm-dark)] font-bold tracking-wider">
                // gmj · gmp
              </div>
            </article>

            <article className="td-card">
              <div className="w-14 h-14 rounded-2xl bg-[var(--td-green)] text-[var(--td-green-dark)] flex items-center justify-center mb-6">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12l2 2 4-4" />
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className="text-4xl font-black mb-4">CR Terverifikasi</h3>
              <p className="text-[var(--td-text-muted)] text-lg leading-relaxed flex-1">
                Setiap matriks dihitung Consistency Ratio-nya secara real-time. Jika CR > 0.1, pakar diminta merevisi
                — keputusan akhir hanya dari penilaian konsisten.
              </p>
              <div className="mt-6 font-mono text-xs text-[var(--td-warm-dark)] font-bold tracking-wider">
                // cr ≤ 0.1
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '96px 0' }}>
        <div className="td-container">
          <div className="bg-[var(--td-near-black)] text-white rounded-[var(--td-radius-card)] p-16 flex items-center justify-between gap-8">
            <h2 className="text-6xl font-black leading-none max-w-2xl">
              Buat kasus pertamamu <span className="text-[var(--td-green)]">dalam 2 menit</span>.
            </h2>
            <Link href="/auth/register" className="td-btn td-btn-primary td-btn-lg flex-shrink-0">
              Daftar Gratis →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--td-border)', padding: '32px 0' }}>
        <div className="td-container">
          <div className="td-row-between text-sm">
            <div className="td-row gap-3">
              <span className="td-logo-mark">T</span>
              <span className="td-mute font-semibold">© 2026 Think Decision</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-[var(--td-text-muted)] font-semibold hover:text-[var(--td-near-black)]">
                Tentang
              </a>
              <a href="#" className="text-[var(--td-text-muted)] font-semibold hover:text-[var(--td-near-black)]">
                Dokumentasi
              </a>
              <a href="#" className="text-[var(--td-text-muted)] font-semibold hover:text-[var(--td-near-black)]">
                Kontak
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
