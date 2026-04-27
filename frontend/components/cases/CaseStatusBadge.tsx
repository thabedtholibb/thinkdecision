import { CaseStatus } from '@/types';
import { cn, getStatusColor } from '@/lib/utils';

const STATUS_LABEL: Record<CaseStatus, string> = {
  draft: 'Draft',
  active: 'Aktif',
  closed: 'Ditutup',
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span className={cn('text-xs font-semibold px-3 py-1 rounded-pill', getStatusColor(status))}>
      {STATUS_LABEL[status]}
    </span>
  );
}
