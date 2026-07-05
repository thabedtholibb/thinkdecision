import { Check, AlertTriangle } from "lucide-react";

interface Props {
  isConsistent: boolean;
  crValue?: number;
}

export function ConsistencyBadge({ isConsistent, crValue }: Props) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${isConsistent ? "bg-green-50 text-success" : "bg-warning/10 text-warning"}`}>
      {isConsistent ? <Check size={16} /> : <AlertTriangle size={16} />}
      <span>{isConsistent ? "Konsisten" : "Tidak Konsisten"}</span>
      {crValue !== undefined && <span className="ml-auto text-xs opacity-75">CR: {crValue.toFixed(4)}</span>}
    </div>
  );
}
