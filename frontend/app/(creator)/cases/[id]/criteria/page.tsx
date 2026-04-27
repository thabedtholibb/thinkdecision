'use client';
import { use } from 'react';
import { useCriteria } from '@/hooks/useCriteria';
import { CriteriaTree } from '@/components/criteria/CriteriaTree';
import { AddCriteriaForm } from '@/components/criteria/AddCriteriaForm';

export default function CriteriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: caseId } = use(params);
  const { data: criteria, isLoading } = useCriteria(caseId);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-black text-2xl text-near-black">Hierarki Kriteria</h2>
        <span className="text-xs text-td-gray font-normal bg-light-surface px-3 py-1 rounded-pill">
          {criteria?.length ?? 0} kriteria
        </span>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-card-md shadow-ring p-6 animate-pulse h-40" />
      ) : (
        <CriteriaTree criteria={criteria ?? []} caseId={caseId} />
      )}

      <div className="mt-4 bg-white rounded-card-md shadow-ring p-4">
        <p className="text-xs text-td-gray font-semibold mb-2">TAMBAH KRITERIA LEVEL 1</p>
        <AddCriteriaForm caseId={caseId} />
      </div>
    </div>
  );
}
