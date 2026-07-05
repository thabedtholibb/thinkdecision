import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { apiErrorMessage } from "../../lib/api";
import { useCase } from "../../hooks/useCases";
import { useSaveJudgment, useSubmitJudgments } from "../../hooks/useJudgments";
import { useAuthStore } from "../../stores/authStore";
import type { ComparisonMap } from "../../types";

// Level ID mengikuti konvensi backend: kriteria berawalan "crit", alternatif "alt-"
const CRITERIA_LEVEL = "criteria";
const ALTERNATIVE_LEVEL = "alt-main";

const SAATY = [9, 8, 7, 6, 5, 4, 3, 2];

export function ExpertAssessPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data: caseData, isLoading } = useCase(caseId);
  const saveJudgment = useSaveJudgment();
  const submitJudgments = useSubmitJudgments();

  const [activeTab, setActiveTab] = useState<"criteria" | "alternatives">("criteria");
  // Nilai perbandingan: key "i-j", value >1 = elemen i lebih penting; <1 = elemen j lebih penting
  const [critValues, setCritValues] = useState<ComparisonMap>({});
  const [altValues, setAltValues] = useState<ComparisonMap>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const criteria = (caseData?.criteria ?? []).filter((c) => c.level === 1);
  const alternatives = caseData?.alternatives ?? [];

  const pairs = (n: number) => {
    const out: [number, number][] = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) out.push([i, j]);
    return out;
  };

  const critPairs = pairs(criteria.length);
  const altPairs = pairs(alternatives.length);

  const criteriaCompleted = critPairs.length > 0 && critPairs.every(([i, j]) => critValues[`${i}-${j}`] !== undefined);
  const alternativeCompleted = altPairs.length > 0 && altPairs.every(([i, j]) => altValues[`${i}-${j}`] !== undefined);
  const isComplete = criteriaCompleted && alternativeCompleted;

  const handleSubmit = async () => {
    if (!isComplete || !caseId || !user) {
      toast.error("Semua perbandingan harus diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Simpan matriks kriteria & alternatif per level
      await saveJudgment.mutateAsync({ levelId: CRITERIA_LEVEL, caseId, comparisons: critValues });
      await saveJudgment.mutateAsync({ levelId: ALTERNATIVE_LEVEL, caseId, comparisons: altValues });

      // 2. Finalisasi seluruh penilaian
      await submitJudgments.mutateAsync({ expertId: user.id, caseId });

      toast.success("Penilaian berhasil dikirim. Terima kasih!");
      setTimeout(() => navigate("/expert"), 1500);
    } catch (err: any) {
      toast.error(apiErrorMessage(err, "Gagal mengirim penilaian"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-16">
        <AlertCircle size={48} className="text-danger mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold text-slate-900 mb-2">Kasus Tidak Ditemukan</h2>
        <p className="text-slate-600 mb-6">Anda mungkin tidak diundang ke kasus ini, atau kasus sudah dihapus.</p>
        <button
          onClick={() => navigate("/expert")}
          className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/expert")}
          className="flex items-center gap-2 text-primary hover:text-primary-dark font-semibold mb-4 transition-colors"
        >
          <ArrowLeft size={18} />
          Kembali ke Dashboard
        </button>
        <h1 className="font-display text-3xl font-bold text-slate-900 mb-2">Penilaian {caseData.method}</h1>
        <p className="text-slate-600">{caseData.name}</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        {/* Info Section */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-slate-200 p-6">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-2">
            {caseData.goal?.name || caseData.objective || caseData.description}
          </h2>
          <p className="text-slate-600 text-sm">
            Lakukan perbandingan berpasangan (pairwise comparison) dengan skala 1–9 Saaty.
            Pilih sisi yang lebih penting beserta intensitasnya.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {[
            { id: "criteria", label: `Kriteria (${critPairs.length})`, done: criteriaCompleted },
            { id: "alternatives", label: `Alternatif (${altPairs.length})`, done: alternativeCompleted },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-6 py-4 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.done && <CheckCircle2 size={16} className="text-green-600" />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6">
          {activeTab === "criteria" && (
            <>
              <StatusBanner done={criteriaCompleted} total={critPairs.length} />
              {critPairs.map(([i, j]) => (
                <PairwiseComparison
                  key={`${i}-${j}`}
                  element1={criteria[i]?.name ?? ""}
                  element2={criteria[j]?.name ?? ""}
                  value={critValues[`${i}-${j}`]}
                  onChange={(val) => setCritValues((prev) => ({ ...prev, [`${i}-${j}`]: val }))}
                />
              ))}
            </>
          )}

          {activeTab === "alternatives" && (
            <>
              <StatusBanner done={alternativeCompleted} total={altPairs.length} />
              {altPairs.map(([i, j]) => (
                <PairwiseComparison
                  key={`${i}-${j}`}
                  element1={alternatives[i]?.name ?? ""}
                  element2={alternatives[j]?.name ?? ""}
                  value={altValues[`${i}-${j}`]}
                  onChange={(val) => setAltValues((prev) => ({ ...prev, [`${i}-${j}`]: val }))}
                />
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            {isComplete && <span className="text-green-600 font-semibold">✓ Semua data lengkap, siap submit</span>}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!isComplete || isSubmitting}
            className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? "Mengirim..." : "Kirim Penilaian"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBanner({ done, total }: { done: boolean; total: number }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <CheckCircle2 size={18} className={done ? "text-green-600" : "text-blue-600"} />
      <span className="text-sm font-medium text-blue-900">
        {done ? "✓ Semua perbandingan sudah diisi" : `${total} perbandingan diperlukan`}
      </span>
    </div>
  );
}

interface PairwiseComparisonProps {
  element1: string;
  element2: string;
  value: number | undefined;
  onChange: (value: number) => void;
}

// Dua sisi: kiri (element1 lebih penting → nilai v), tengah 1 (sama), kanan (element2 lebih penting → 1/v)
function PairwiseComparison({ element1, element2, value, onChange }: PairwiseComparisonProps) {
  const describe = () => {
    if (value === undefined) return "Pilih perbandingan";
    if (value === 1) return "Sama penting";
    if (value > 1) return `${element1} lebih penting (${value})`;
    return `${element2} lebih penting (${Math.round(1 / value)})`;
  };

  return (
    <div className="border border-slate-200 rounded-lg p-5 bg-white hover:shadow-card transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-slate-900 flex-1">{element1}</span>
        <span className="px-3 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-600 mx-3">vs</span>
        <span className="font-semibold text-slate-900 flex-1 text-right">{element2}</span>
      </div>

      {/* Scale Buttons: 9..2 (kiri) | 1 | 2..9 (kanan) */}
      <div className="flex gap-1 justify-between">
        {SAATY.map((v) => (
          <ScaleButton key={`L${v}`} label={v} active={value === v} onClick={() => onChange(v)} />
        ))}
        <ScaleButton label={1} active={value === 1} onClick={() => onChange(1)} highlight />
        {[...SAATY].reverse().map((v) => (
          <ScaleButton key={`R${v}`} label={v} active={value !== undefined && value < 1 && Math.round(1 / value) === v} onClick={() => onChange(1 / v)} />
        ))}
      </div>

      <p className="text-xs text-slate-500 mt-3 text-center">{describe()}</p>
    </div>
  );
}

function ScaleButton({ label, active, onClick, highlight }: { label: number; active: boolean; onClick: () => void; highlight?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2 rounded text-xs font-bold transition-all ${
        active
          ? "bg-primary text-white shadow-lg shadow-primary/25"
          : highlight
          ? "bg-slate-200 text-slate-800 hover:bg-slate-300"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}
