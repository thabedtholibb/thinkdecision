import { useParams, useNavigate } from "react-router-dom";
import { useResults } from "../../hooks/useResults";
import { ArrowLeft, BarChart3, AlertCircle, Loader2, CheckCircle2, Award, Hourglass, Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#4F46E5", "#6366F1", "#818CF8", "#A5B4FC", "#C7D2FE", "#E0E7FF"];

export function CaseResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: response, isLoading, error } = useResults(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  if (error || !response) {
    return (
      <div className="text-center py-16">
        <AlertCircle size={48} className="text-danger mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Hasil belum tersedia</p>
        <p className="text-slate-500 text-sm mt-2">Tunggu sampai pakar selesai melakukan penilaian</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 inline-block px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  const results = response.data;

  // Status "waiting" — belum ada judgment masuk
  if (response.status === "waiting") {
    return (
      <div className="text-center py-16 animate-fade-in">
        <Hourglass size={48} className="text-slate-300 mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">{results.caseName}</h1>
        <p className="text-slate-600 font-medium">{results.message || "Menunggu penilaian dari pakar"}</p>
        <p className="text-slate-500 text-sm mt-2">
          {results.completedExperts} dari {results.totalExperts} pakar sudah menilai
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 inline-block px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  const alternativeScores = results.alternativeScores ?? [];
  const criteriaWeights = results.criteriaWeights ?? [];
  const cr = results.consistencyRatio;
  const isConsistent = cr !== null && cr !== undefined && cr <= 0.1;

  const chartData = alternativeScores.map((alt) => ({
    name: alt.name.length > 10 ? `${alt.name.slice(0, 10)}…` : alt.name,
    fullName: alt.name,
    priority: parseFloat((alt.score * 100).toFixed(2)),
  }));

  const crStatus = isConsistent
    ? { label: "Konsisten", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" }
    : { label: "Tidak Konsisten", color: "text-danger", bgColor: "bg-red-50", borderColor: "border-red-200" };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary hover:text-primary-dark font-semibold mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            Kembali ke Kasus
          </button>
          <h1 className="font-display text-3xl font-bold text-slate-900">Hasil Analisis {results.method}</h1>
          <p className="text-slate-600 text-base mt-2">
            {results.caseName} — penilaian {results.completedExperts} dari {results.totalExperts} pakar
          </p>
        </div>
      </div>

      {/* Recommendation Banner */}
      {results.recommendation && (
        <div className="flex items-center gap-4 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-5">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
            <Trophy size={24} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Rekomendasi Terbaik</p>
            <p className="font-display text-xl font-bold text-slate-900">
              {results.recommendation.name}{" "}
              <span className="text-primary text-base font-semibold">
                ({(results.recommendation.score * 100).toFixed(2)}%)
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Consistency Ratio",
            value: cr !== null && cr !== undefined ? cr.toFixed(4) : "—",
            subtext: crStatus.label,
            icon: CheckCircle2,
            color: crStatus.color,
          },
          {
            label: "Total Pakar",
            value: `${results.completedExperts}/${results.totalExperts}`,
            subtext: "Sudah menilai",
            icon: Award,
            color: "text-blue-600",
          },
          {
            label: "Metode",
            value: results.method,
            subtext: `Agregasi ${results.aggregationMethod || "AIJ"}`,
            icon: BarChart3,
            color: "text-purple-600",
          },
        ].map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div key={idx} className={`rounded-lg border ${crStatus.borderColor} ${crStatus.bgColor} p-6`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-slate-600 text-xs font-semibold uppercase mb-1">{metric.label}</p>
                  <p className="text-2xl font-display font-bold text-slate-900">{metric.value}</p>
                  <p className={`text-sm font-medium mt-1 ${metric.color}`}>{metric.subtext}</p>
                </div>
                <Icon size={24} className={metric.color} />
              </div>

              {metric.label === "Consistency Ratio" && (
                <div className="mt-4 pt-4 border-t border-slate-200/50">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${isConsistent ? "bg-green-600" : "bg-red-600"}`}
                      style={{ width: isConsistent ? "100%" : "30%" }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    Status: {isConsistent ? "Konsisten ✓ (CR ≤ 0.1)" : "Tidak Konsisten ✗ (CR > 0.1)"}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts & Ranking */}
      <div className="grid grid-cols-3 gap-6">
        {/* Priority Chart */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-card">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-4">Prioritas Alternatif</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 12 }} />
              <YAxis tick={{ fill: "#64748B", fontSize: 12 }} label={{ value: "Skor (%)", angle: -90, position: "insideLeft" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #E2E8F0", borderRadius: "8px" }}
                formatter={(value) => `${(value as number).toFixed(2)}%`}
                labelFormatter={(label) => `${label}`}
              />
              <Bar dataKey="priority" fill="#4F46E5" radius={[8, 8, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ranking Table */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-4">Ranking</h2>
          <div className="space-y-2">
            {alternativeScores.map((alt) => (
              <div
                key={alt.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-7 h-7 bg-primary text-white text-xs font-bold rounded-full">
                    {alt.rank}
                  </span>
                  <span className="font-medium text-slate-900 text-sm">{alt.name}</span>
                </div>
                <span className="font-semibold text-primary text-sm">{(alt.score * 100).toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Criteria Priorities */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card">
        <h2 className="font-display text-lg font-bold text-slate-900 mb-4">Prioritas Kriteria</h2>
        <div className="grid grid-cols-2 gap-4">
          {criteriaWeights.map((crit, idx) => (
            <div key={crit.id ?? idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/20">
              <span className="font-medium text-slate-900">{crit.name}</span>
              <span className="font-display font-bold text-primary text-lg">{(crit.weight * 100).toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expert CRs */}
      {results.experts && results.experts.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-4">Konsistensi per Pakar</h2>
          <div className="grid grid-cols-2 gap-4">
            {results.experts.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p className="font-medium text-slate-900">{exp.name}</p>
                  <p className="text-xs text-slate-500">{exp.email}</p>
                </div>
                <span className={`font-semibold text-sm ${exp.cr <= 0.1 ? "text-green-600" : "text-danger"}`}>
                  CR {exp.cr.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-900 text-sm">
          <strong>ℹ️ Interpretasi:</strong> Nilai prioritas menunjukkan bobot relatif setiap alternatif
          berdasarkan agregasi penilaian seluruh pakar. Semakin tinggi nilai, semakin diprioritaskan.
        </p>
      </div>
    </div>
  );
}
