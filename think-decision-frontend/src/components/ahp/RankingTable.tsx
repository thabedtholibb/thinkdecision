import { Medal } from "lucide-react";

interface Props {
  priorities: Record<string, number>;
}

export function RankingTable({ priorities }: Props) {
  const sorted = Object.entries(priorities)
    .sort(([, a], [, b]) => b - a)
    .map(([id, p], idx) => ({ rank: idx + 1, id, priority: p }));

  const getMedalColor = (rank: number) => {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-slate-400";
    if (rank === 3) return "text-orange-600";
    return "text-slate-300";
  };

  return (
    <div className="space-y-2">
      {sorted.map(({ rank, id, priority }) => (
        <div key={id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
          <div className="flex items-center gap-3">
            <Medal size={20} className={getMedalColor(rank)} />
            <div>
              <p className="font-medium text-sm">{rank}. Alt {id.slice(0, 8)}</p>
              <p className="text-xs text-slate-600">{(priority * 100).toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex-1 mx-3 bg-slate-200 rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: `${priority * 100}%` }} />
          </div>
          <span className="text-sm font-semibold text-slate-800 w-16 text-right">{priority.toFixed(4)}</span>
        </div>
      ))}
    </div>
  );
}
