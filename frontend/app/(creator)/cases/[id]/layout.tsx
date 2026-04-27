'use client';
import { use } from 'react';
import { useCase } from '@/hooks/useCases';
import { CaseTabs } from '@/components/cases/CaseTabs';
import { CaseStatusBadge } from '@/components/cases/CaseStatusBadge';

export default function CaseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: caseId } = use(params);
  const { data: caseData, isLoading } = useCase(caseId);

  if (isLoading) return <div className="animate-pulse h-10 bg-light-surface rounded-card-sm" />;
  if (!caseData) return <p className="text-td-danger">Kasus tidak ditemukan</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-black text-4xl text-near-black mb-2" style={{ lineHeight: 0.9 }}>
            {caseData.title}
          </h1>
          <div className="flex items-center gap-3">
            <CaseStatusBadge status={caseData.status} />
            <span className="text-xs text-td-gray">{caseData.method} · {caseData.aggregation_method}</span>
          </div>
        </div>
      </div>
      <CaseTabs caseId={caseId} />
      {children}
    </div>
  );
}
