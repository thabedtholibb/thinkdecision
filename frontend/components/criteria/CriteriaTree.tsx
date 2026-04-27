'use client';
import { useState } from 'react';
import { Criteria } from '@/types';
import { useDeleteCriteria } from '@/hooks/useCriteria';
import { AddCriteriaForm } from './AddCriteriaForm';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';

interface NodeProps {
  node: Criteria;
  caseId: string;
  depth?: number;
}

function CriteriaNode({ node, caseId, depth = 0 }: NodeProps) {
  const [expanded, setExpanded] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const deleteCriteria = useDeleteCriteria(caseId);

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-light-mint pl-4' : ''}`}>
      <div className="flex items-center gap-2 py-2 group">
        <button onClick={() => setExpanded(!expanded)} className="text-td-gray hover:text-near-black">
          {hasChildren ? (
            expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            <span className="w-4 h-4 block" />
          )}
        </button>
        <span className="font-semibold text-near-black text-sm flex-1">{node.label}</span>
        <span className="text-xs text-td-gray font-normal bg-light-surface px-2 py-0.5 rounded-pill">
          Level {node.level}
        </span>
        <button
          onClick={() => setShowAddChild(!showAddChild)}
          className="opacity-0 group-hover:opacity-100 text-td-gray hover:text-dark-green transition-all"
          title="Tambah sub-kriteria"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => deleteCriteria.mutate(node.id)}
          className="opacity-0 group-hover:opacity-100 text-td-gray hover:text-td-danger transition-all"
          title="Hapus kriteria"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {showAddChild && (
        <div className="ml-6">
          <AddCriteriaForm
            caseId={caseId}
            parentId={node.id}
            parentLabel={node.label}
            onClose={() => setShowAddChild(false)}
          />
        </div>
      )}

      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <CriteriaNode key={child.id} node={child} caseId={caseId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CriteriaTree({ criteria, caseId }: { criteria: Criteria[]; caseId: string }) {
  return (
    <div className="bg-white rounded-card-md shadow-ring p-6">
      {criteria.length === 0 ? (
        <p className="text-td-gray font-normal text-sm text-center py-8">
          Belum ada kriteria. Tambahkan kriteria pertama.
        </p>
      ) : (
        criteria.map((node) => (
          <CriteriaNode key={node.id} node={node} caseId={caseId} />
        ))
      )}
    </div>
  );
}
