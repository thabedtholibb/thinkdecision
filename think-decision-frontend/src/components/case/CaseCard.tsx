import { Link } from "react-router-dom";
import { ChevronRight, Calendar, Users, Layers } from "lucide-react";
import { cn, formatDate } from "../../lib/utils";
import type { Case } from "../../types";

const statusConfig = {
  draft: { label: "Draft", class: "bg-slate-100 text-slate-700 border border-slate-200" },
  active: { label: "Aktif", class: "bg-blue-50 text-blue-700 border border-blue-200" },
  completed: { label: "Selesai", class: "bg-green-50 text-green-700 border border-green-200" },
};

const methodConfig: Record<string, string> = {
  AHP: "bg-indigo-50 text-indigo-700",
  "Fuzzy AHP": "bg-purple-50 text-purple-700",
  ANP: "bg-cyan-50 text-cyan-700",
  "Fuzzy ANP": "bg-fuchsia-50 text-fuchsia-700",
};

interface Props {
  case_: Case;
}

export function CaseCard({ case_ }: Props) {
  const status = statusConfig[case_.status] ?? statusConfig.draft;
  const methodClass = methodConfig[case_.method] ?? "bg-indigo-50 text-indigo-700";

  return (
    <Link
      to={`/cases/${case_.id}`}
      className="group block bg-white rounded-xl border border-slate-200 p-6 shadow-card hover:shadow-card-hover hover:border-primary/30 transition-all duration-200 animate-fade-in"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", status.class)}>
              {status.label}
            </span>
            <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", methodClass)}>
              {case_.method}
            </span>
          </div>
        </div>
        <ChevronRight size={20} className="text-slate-300 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
      </div>

      {/* Title & Description */}
      <h3 className="font-display font-semibold text-slate-900 text-base mb-2 group-hover:text-primary transition-colors line-clamp-2">
        {case_.name}
      </h3>
      <p className="text-slate-600 text-sm mb-4 line-clamp-2">{case_.description || case_.objective}</p>

      {/* Metadata */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Users size={14} />
          <span>{case_.expertsCount ?? 0} pakar</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Layers size={14} />
          <span>{case_.criteriaCount ?? 0} kriteria</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={14} />
          <span>{formatDate(case_.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
