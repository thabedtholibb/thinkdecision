'use client';
import { use } from 'react';

export default function ExpertsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: caseId } = use(params);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-black text-2xl text-near-black">Pakar</h2>
      </div>
      <div className="bg-white rounded-card-md shadow-ring p-8 text-center">
        <p className="text-td-gray font-normal">Tab Pakar sedang dalam pengembangan</p>
      </div>
    </div>
  );
}
