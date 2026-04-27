'use client';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'creator')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><p className="text-td-gray">Memuat...</p></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-light-surface">
      <Navbar />
      <main className="pt-20 max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
