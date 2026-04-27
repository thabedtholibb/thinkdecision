'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-black/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-near-black font-black text-2xl tracking-tight" style={{ lineHeight: 0.85 }}>
          Think Decision
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-warm-dark text-sm font-semibold">{user.full_name}</span>
              <button
                onClick={handleLogout}
                className="bg-[rgba(22,51,0,0.08)] text-near-black font-semibold text-sm px-4 py-2 rounded-pill transition-transform hover:scale-105 active:scale-95"
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="bg-[rgba(22,51,0,0.08)] text-near-black font-semibold text-sm px-4 py-2 rounded-pill transition-transform hover:scale-105 active:scale-95">
                Masuk
              </Link>
              <Link href="/register" className="bg-wise-green text-dark-green font-semibold text-sm px-4 py-2 rounded-pill transition-transform hover:scale-105 active:scale-95">
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
