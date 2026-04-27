import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="max-w-4xl">
          <h1
            className="text-near-black font-black mb-6"
            style={{ fontSize: '96px', lineHeight: 0.85, fontFeatureSettings: '"calt"' }}
          >
            Keputusan Terbaik,<br />Bersama Para Ahli
          </h1>
          <p className="text-warm-dark text-lg font-normal mb-10 max-w-xl" style={{ lineHeight: 1.44 }}>
            Platform MCDM berbasis web untuk agregasi penilaian multi-pakar secara otomatis. Didukung metode AHP dengan konsistensi terverifikasi.
          </p>
          <div className="flex gap-4">
            <Link
              href="/register"
              className="bg-wise-green text-dark-green font-semibold text-lg px-6 py-3 rounded-pill transition-transform hover:scale-105 active:scale-95"
            >
              Mulai Sebagai Creator
            </Link>
            <Link
              href="/login?role=expert"
              className="bg-[rgba(22,51,0,0.08)] text-near-black font-semibold text-lg px-6 py-3 rounded-pill transition-transform hover:scale-105 active:scale-95"
            >
              Masuk Sebagai Pakar
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-light-surface">
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-near-black font-black mb-12 text-center"
            style={{ fontSize: '48px', lineHeight: 0.85 }}
          >
            Mengapa Think Decision?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Multi-Expert', desc: 'Undang banyak pakar untuk menilai secara independen tanpa saling mempengaruhi.' },
              { title: 'Agregasi Otomatis', desc: 'GMJ dan GMP dihitung otomatis — tidak ada lagi spreadsheet manual seperti Super Decision.' },
              { title: 'CR Terverifikasi', desc: 'Consistency Ratio dihitung real-time setiap kali pakar submit penilaian.' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-card-md p-8 shadow-ring">
                <h3 className="font-black text-2xl text-near-black mb-3" style={{ lineHeight: 1.2 }}>
                  {f.title}
                </h3>
                <p className="text-warm-dark font-normal text-base" style={{ lineHeight: 1.44 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-black/10 text-center">
        <p className="text-td-gray text-sm font-normal">
          © 2026 Think Decision. Platform MCDM Multi-Expert.
        </p>
      </footer>
    </div>
  );
}
