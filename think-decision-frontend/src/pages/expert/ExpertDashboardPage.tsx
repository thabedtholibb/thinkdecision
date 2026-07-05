import { Link } from "react-router-dom";
import { Brain, CheckCircle2, Clock, TrendingUp, ArrowRight, Loader2, GraduationCap } from "lucide-react";
import { useExpertDashboard } from "../../hooks/useJudgments";
import { useAuthStore } from "../../stores/authStore";

const statusLabel: Record<string, { label: string; class: string }> = {
  invited: { label: "Diundang", class: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
  in_progress: { label: "Sedang Menilai", class: "bg-blue-50 text-blue-700 border border-blue-200" },
  completed: { label: "Selesai", class: "bg-green-50 text-green-700 border border-green-200" },
};

export function ExpertDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useExpertDashboard();

  const stats = data?.stats;
  const invitations = data?.invitations ?? [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">
          Selamat datang, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-600 text-base mt-2">
          Berikut kasus keputusan yang membutuhkan penilaian Anda sebagai pakar
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5">
        {[
          { icon: TrendingUp, label: "Sedang Berjalan", value: stats?.activeCases ?? 0, bg: "bg-blue-50", fg: "text-blue-600" },
          { icon: CheckCircle2, label: "Selesai Dinilai", value: stats?.completedCases ?? 0, bg: "bg-green-50", fg: "text-green-600" },
          { icon: Brain, label: "Total Kontribusi", value: stats?.totalContributions ?? 0, bg: "bg-indigo-50", fg: "text-indigo-600" },
        ].map(({ icon: Icon, label, value, bg, fg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-6 shadow-card">
            <div className={`w-12 h-12 rounded-lg ${bg} flex items-center justify-center mb-4`}>
              <Icon size={24} className={fg} />
            </div>
            <p className="text-3xl font-display font-bold text-slate-900 mb-1">{value}</p>
            <p className="text-slate-600 text-sm font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Invitations */}
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900 mb-6">Undangan Penilaian</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="text-primary animate-spin" />
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
            <GraduationCap size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="font-display font-semibold text-slate-600 text-lg">Belum ada undangan</p>
            <p className="text-slate-500 text-base">Anda akan melihat kasus di sini saat creator mengundang Anda</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            {invitations.map((inv) => {
              const st = statusLabel[inv.status] ?? statusLabel.invited;
              return (
                <Link
                  key={inv.case_id}
                  to={`/expert/assess/${inv.case_id}`}
                  className="group block bg-white rounded-xl border border-slate-200 p-6 shadow-card hover:shadow-card-hover hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.class}`}>{st.label}</span>
                    {inv.cases?.method && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                        {inv.cases.method}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-semibold text-slate-900 text-base mb-2 group-hover:text-primary transition-colors">
                    {inv.cases?.name ?? inv.case_id}
                  </h3>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      <span>
                        Deadline:{" "}
                        {inv.cases?.deadline ? new Date(inv.cases.deadline).toLocaleDateString("id-ID") : "—"}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-primary font-semibold group-hover:gap-2 transition-all">
                      {inv.status === "completed" ? "Lihat" : "Mulai Menilai"} <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
