import Link from 'next/link';
import { Case } from '@/types';
import { CaseStatusBadge } from './CaseStatusBadge';
import { formatDate } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

export function CaseCard({ case: c }: { case: Case }) {
  return (
    <Link href={`/cases/${c.id}/criteria`}>
      <div className="bg-white rounded-card-md shadow-ring p-6 hover:shadow-ring-green transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <CaseStatusBadge status={c.status} />
          <span className="text-xs text-td-gray font-normal">{c.method}</span>
        </div>
        <h3 className="font-black text-xl text-near-black mb-2" style={{ lineHeight: 1.1 }}>
          {c.title}
        </h3>
        {c.description && (
          <p className="text-warm-dark font-normal text-sm mb-4 line-clamp-2" style={{ lineHeight: 1.44 }}>
            {c.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-td-gray font-normal">{formatDate(c.created_at)}</span>
          <ArrowRight className="w-4 h-4 text-td-gray group-hover:text-dark-green transition-colors" />
        </div>
      </div>
    </Link>
  );
}
