import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Brain, Loader2, AlertCircle, UserCog, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";
import type { UserRole } from "../../types";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});
type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [role, setRole] = useState<UserRole>("creator");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    try {
      // Backend memisahkan login per peran: /auth/login/creator & /auth/login/expert
      const res = await api.post(`/auth/login/${role}`, data);
      const user = res.data.data;
      setAuth(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        res.data.token
      );
      toast.success("Selamat datang kembali!");
      navigate(user.role === "expert" ? "/expert" : "/dashboard");
    } catch (err: any) {
      toast.error(apiErrorMessage(err, "Login gagal"));
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary/10 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-xl mb-4 shadow-lg shadow-primary/30">
            <Brain size={24} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Think Decision</h1>
          <p className="text-slate-600 text-sm mt-1">Platform Keputusan Multi-Kriteria</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-card">
          <h2 className="font-display text-xl font-bold text-slate-900 mb-1">Masuk</h2>
          <p className="text-slate-500 text-sm mb-6">Masuk ke akun Anda untuk melanjutkan</p>

          {/* Role Toggle */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              type="button"
              onClick={() => setRole("creator")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                role === "creator"
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/25"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              <UserCog size={16} />
              Creator
            </button>
            <button
              type="button"
              onClick={() => setRole("expert")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                role === "expert"
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/25"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              <GraduationCap size={16} />
              Pakar
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>
              <input
                id="email"
                {...register("email")}
                type="email"
                placeholder="nama@email.com"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-all ${
                  errors.email ? "border-danger bg-danger/5" : "border-slate-200 hover:border-slate-300"
                } focus:border-primary focus:ring-2 focus:ring-primary/10`}
              />
              {errors.email && (
                <div className="flex items-center gap-1.5 text-danger text-xs mt-1.5">
                  <AlertCircle size={14} />
                  {errors.email.message}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <input
                id="password"
                {...register("password")}
                type="password"
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-all ${
                  errors.password ? "border-danger bg-danger/5" : "border-slate-200 hover:border-slate-300"
                } focus:border-primary focus:ring-2 focus:ring-primary/10`}
              />
              {errors.password && (
                <div className="flex items-center gap-1.5 text-danger text-xs mt-1.5">
                  <AlertCircle size={14} />
                  {errors.password.message}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? "Sedang Masuk..." : `Masuk sebagai ${role === "creator" ? "Creator" : "Pakar"}`}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs text-slate-500">atau</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-slate-600 text-sm">
            Belum punya akun?{" "}
            <Link to="/register" className="font-semibold text-primary hover:text-primary-dark transition-colors">
              Daftar sekarang
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          © 2026 Think Decision. Semua hak cipta dilindungi.
        </p>
      </div>
    </div>
  );
}
