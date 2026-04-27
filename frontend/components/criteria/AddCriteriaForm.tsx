'use client';
import { useState } from 'react';
import { useCreateCriteria } from '@/hooks/useCriteria';
import { Plus } from 'lucide-react';

interface Props {
  caseId: string;
  parentId?: string;
  parentLabel?: string;
  onClose?: () => void;
}

export function AddCriteriaForm({ caseId, parentId, parentLabel, onClose }: Props) {
  const [label, setLabel] = useState('');
  const createCriteria = useCreateCriteria(caseId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    await createCriteria.mutateAsync({ label: label.trim(), parent_id: parentId || null, order_index: 0 });
    setLabel('');
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={parentId ? `Sub-kriteria dari ${parentLabel}` : 'Nama kriteria baru'}
        className="flex-1 px-3 py-2 rounded-[10px] border border-black/10 text-near-black font-normal text-sm focus:outline-none focus:ring-2 focus:ring-wise-green/50"
        autoFocus
      />
      <button type="submit" disabled={createCriteria.isPending} className="bg-wise-green text-dark-green font-semibold px-4 py-2 rounded-pill text-sm transition-transform hover:scale-105 active:scale-95">
        <Plus className="w-4 h-4" />
      </button>
      {onClose && (
        <button type="button" onClick={onClose} className="bg-[rgba(22,51,0,0.08)] text-near-black font-semibold px-3 py-2 rounded-pill text-sm">
          ✕
        </button>
      )}
    </form>
  );
}
