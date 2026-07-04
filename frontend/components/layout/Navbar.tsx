'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Don't show navbar on login/register pages
  if (pathname?.startsWith('/auth')) {
    return null;
  }

  return (
    <nav className="td-nav">
      <div className="td-nav-inner">
        <Link href="/" className="td-logo">
          <span className="td-logo-mark">T</span>
          Think Decision
        </Link>

        {user ? (
          <div className="td-row" style={{ gap: '16px' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--td-near-black)] text-[var(--td-green)] flex items-center justify-center font-black text-sm">
                {user.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-bold">{user.name}</div>
                <div className="text-xs text-[var(--td-text-muted)] mt-0.5 capitalize">{user.role}</div>
              </div>
            </div>
            <button onClick={logout} className="td-btn td-btn-secondary td-btn-sm">
              Keluar
            </button>
          </div>
        ) : (
          <div className="td-row" style={{ gap: '8px' }}>
            <Link href="/auth/login" className="td-btn td-btn-ghost td-btn-sm">
              Masuk
            </Link>
            <Link href="/auth/register" className="td-btn td-btn-primary td-btn-sm">
              Daftar
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
