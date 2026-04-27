'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Kriteria', path: 'criteria' },
  { label: 'Alternatif', path: 'alternatives' },
  { label: 'Pakar', path: 'experts' },
  { label: 'Progress', path: 'progress' },
  { label: 'Hasil', path: 'results' },
];

export function CaseTabs({ caseId }: { caseId: string }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b border-black/10 mb-6">
      {TABS.map((tab) => {
        const href = `/cases/${caseId}/${tab.path}`;
        const isActive = pathname.includes(`/${tab.path}`);
        return (
          <Link
            key={tab.path}
            href={href}
            className={cn(
              'px-4 py-2.5 text-sm font-semibold rounded-t-[10px] transition-colors',
              isActive
                ? 'bg-wise-green text-dark-green'
                : 'text-warm-dark hover:bg-light-surface'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
