import { Link } from "react-router-dom";
import { Plus, Brain, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import { useCases } from "../../hooks/useCases";
import { CaseCard } from "../../components/case/CaseCard";
import { useAuthStore } from "../../stores/authStore";

export function DashboardPage() {
  const { data: cases, isLoading } = useCases();
  const user = useAuthStore((s) => s.user);

  const stats = {
    total: cases?.length ?? 0,
    active: cases?.filter(c => c.status === "active").length ?? 0,
    completed: cases?.filter(c => c.status === "completed").length ?? 0,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">
            Selamat datang, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-600 text-base mt-2">Kelola kasus keputusan AHP Anda dengan mudah</p>
        </div>
        <Link
          to="/cases/new"
          className="inline-flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg shadow-lg shadow-primary/25 transition-all duration-150"
        >
          <Plus size={18} />
          Kasus Baru
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-5">
        {[
          { icon: Brain, label: "Total Kasus", value: stats.total, color: "indigo", trend: "+2 bulan ini" },
          { icon: TrendingUp, label: "Sedang Aktif", value: stats.active, color: "blue", trend: "4 kasus" },
          { icon: CheckCircle2, label: "Selesai", value: stats.completed, color: "green", trend: "2 kasus" },
        ].map(({ icon: Icon, label, value, color, trend }) => {
          const bgColors = {
            indigo: "bg-indigo-50",
            blue: "bg-blue-50",
            green: "bg-green-50",
          };
          const textColors = {
            indigo: "text-indigo-600",
            blue: "text-blue-600",
            green: "text-green-600",
          };
          return (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-6 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${bgColors[color as keyof typeof bgColors]} flex items-center justify-center`}>
                  <Icon size={24} className={textColors[color as keyof typeof textColors]} />
                </div>
              </div>
              <p className="text-3xl font-display font-bold text-slate-900 mb-1">{value}</p>
              <p className="text-slate-600 text-sm font-medium mb-2">{label}</p>
              <p className="text-slate-400 text-xs">{trend}</p>
            </div>
          );
        })}
      </div>

      {/* Cases Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-slate-900">Daftar Kasus</h2>
          <Link to="/dashboard" className="text-primary hover:text-primary-dark text-sm font-semibold flex items-center gap-1">
            Lihat Semua <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 shadow-card animate-pulse h-48" />
            ))}
          </div>
        ) : cases?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
            <Brain size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="font-display font-semibold text-slate-600 text-lg">Belum ada kasus</p>
            <p className="text-slate-500 text-base mb-6">Buat kasus keputusan pertama Anda sekarang</p>
            <Link to="/cases/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors">
              <Plus size={16} /> Buat Kasus
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            {cases?.map(c => <CaseCard key={c.id} case_={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}
