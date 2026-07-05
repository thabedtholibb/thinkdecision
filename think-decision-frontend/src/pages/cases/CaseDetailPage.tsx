import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCase, usePublishCase } from "../../hooks/useCases";
import { useExperts } from "../../hooks/useExperts";
import { ArrowLeft, Users, FileText, CheckCircle2, Clock, AlertCircle, Copy, Loader2, Rocket, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { apiErrorMessage } from "../../lib/api";

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"info" | "experts" | "results">("info");

  const { data: caseData, isLoading: caseLoading } = useCase(id);
  const { data: experts, isLoading: expertsLoading } = useExperts(id);
  const publishCase = usePublishCase(id ?? "");

  const criteria = caseData?.criteria ?? [];
  const alternatives = caseData?.alternatives ?? [];

  const handlePublish = async () => {
    try {
      await publishCase.mutateAsync();
      toast.success("Kasus berhasil dipublikasikan — pakar sudah bisa menilai!");
    } catch (err: any) {
      toast.error(apiErrorMessage(err, "Gagal mempublikasikan kasus"));
    }
  };

  const copyInviteLink = () => {
    // Pakar login dengan email + password sementara yang dibagikan creator
    const link = `${window.location.origin}/login`;
    navigator.clipboard.writeText(link);
    toast.success("Link halaman login pakar disalin!");
  };

  if (caseLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-16">
        <AlertCircle size={48} className="text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600">Kasus tidak ditemukan</p>
      </div>
    );
  }

  const tabs = [
    { id: "info", label: "Informasi", icon: FileText },
    { id: "experts", label: "Expert", icon: Users },
    { id: "results", label: "Hasil", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-primary hover:text-primary-dark font-semibold mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            Kembali ke Dashboard
          </button>
          <h1 className="font-display text-3xl font-bold text-slate-900 mb-2">{caseData.name}</h1>
          <p className="text-slate-600 text-base">{caseData.description || caseData.objective}</p>
        </div>

        {/* Status Badge + Actions */}
        <div className="flex-shrink-0 flex items-center gap-3">
          {caseData.status === "draft" && (
            <button
              onClick={handlePublish}
              disabled={publishCase.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg text-sm transition-all disabled:opacity-60"
            >
              {publishCase.isPending ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
              Publikasikan
            </button>
          )}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
              caseData.status === "active"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : caseData.status === "completed"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-slate-100 text-slate-700 border border-slate-200"
            }`}
          >
            {caseData.status === "active" ? (
              <Clock size={14} />
            ) : caseData.status === "completed" ? (
              <CheckCircle2 size={14} />
            ) : null}
            {caseData.status === "active" ? "Aktif" : caseData.status === "completed" ? "Selesai" : "Draft"}
          </span>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Kriteria", value: criteria.length },
          { label: "Alternatif", value: alternatives.length },
          { label: "Pakar", value: experts?.length ?? 0 },
          { label: "Metode", value: caseData.method },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-slate-600 text-xs font-semibold uppercase mb-1">{item.label}</p>
            <p className="text-2xl font-display font-bold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-semibold text-sm transition-all ${
                  isActive
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* INFO TAB */}
          {activeTab === "info" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-6">
                {/* Case Settings */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Pengaturan Kasus</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Metode MCDM</p>
                      <p className="text-slate-900 font-medium">{caseData.method}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Deadline</p>
                      <p className="text-slate-900 font-medium">
                        {caseData.deadline ? new Date(caseData.deadline).toLocaleDateString("id-ID") : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Invite Link */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Link Undangan Expert</h3>
                  <button
                    onClick={copyInviteLink}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700"
                  >
                    <span className="truncate">Salin Link</span>
                    <Copy size={16} className="flex-shrink-0" />
                  </button>
                  <p className="text-xs text-slate-500 mt-2">
                    Bagikan link ini ke expert untuk assessment
                  </p>
                </div>
              </div>

              {/* Criteria & Alternatives */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Kriteria</h3>
                  <div className="space-y-2">
                    {criteria && Array.isArray(criteria) && criteria.length > 0 ? (
                      criteria.map((c: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded border border-slate-200">
                          <span className="flex items-center justify-center w-6 h-6 bg-primary text-white text-xs font-bold rounded-full flex-shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-sm text-slate-700">{typeof c === "string" ? c : c.name || c}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-sm">Tidak ada kriteria</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Alternatif</h3>
                  <div className="space-y-2">
                    {alternatives && Array.isArray(alternatives) && alternatives.length > 0 ? (
                      alternatives.map((a: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded border border-slate-200">
                          <span className="flex items-center justify-center w-6 h-6 bg-secondary text-white text-xs font-bold rounded-full flex-shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-sm text-slate-700">{typeof a === "string" ? a : a.name || a}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-sm">Tidak ada alternatif</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EXPERTS TAB */}
          {activeTab === "experts" && (
            <div className="space-y-6 animate-fade-in">
              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-1">Pakar ditambahkan saat pembuatan kasus</h3>
                <p className="text-blue-900 text-sm">
                  Pakar login memakai email + password sementara yang ditampilkan saat kasus dibuat.
                  Bagikan link login dan kredensial tersebut kepada pakar.
                </p>
              </div>

              {/* Expert List */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Daftar Pakar ({experts?.length ?? 0})</h3>
                {expertsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 size={24} className="text-primary animate-spin mx-auto" />
                  </div>
                ) : experts && experts.length > 0 ? (
                  <div className="space-y-3">
                    {experts.map((expert: any) => (
                      <div
                        key={expert.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{expert.name || expert.email}</p>
                          <p className="text-xs text-slate-500 mt-1">{expert.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {expert.status === "completed" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200">
                              <CheckCircle2 size={12} />
                              Sudah Assess
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-semibold border border-yellow-200">
                              <Clock size={12} />
                              Menunggu
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <Users size={32} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-600 font-medium">Belum ada pakar</p>
                    <p className="text-slate-500 text-sm">Pakar ditambahkan saat pembuatan kasus</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RESULTS TAB */}
          {activeTab === "results" && (
            <div className="text-center py-12 animate-fade-in">
              <BarChart3 size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Lihat agregasi penilaian seluruh pakar</p>
              <p className="text-slate-500 text-sm mt-2 mb-6">Status kasus: {caseData.status}</p>
              <Link
                to={`/cases/${id}/results`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors"
              >
                <BarChart3 size={16} />
                Buka Halaman Hasil
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
