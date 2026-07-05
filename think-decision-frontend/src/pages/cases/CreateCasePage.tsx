import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronRight, ChevronLeft, Plus, Trash2, AlertCircle, CheckCircle2, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "../../lib/api";

const schema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  goal: z.string().min(10, "Goal minimal 10 karakter"),
  method: z.enum(["AHP", "Fuzzy AHP", "ANP", "Fuzzy ANP"]),
  deadline: z.string().min(1, "Deadline wajib diisi"),
  criteria: z.array(z.string().min(2)).min(2, "Minimal 2 kriteria"),
  alternatives: z.array(z.string().min(2)).min(2, "Minimal 2 alternatif"),
  experts: z.array(z.string().email()),
});
type FormData = z.infer<typeof schema>;

const defaultDeadline = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
};

export function CreateCasePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [newCriteria, setNewCriteria] = useState("");
  const [newAlternative, setNewAlternative] = useState("");
  const [newExpert, setNewExpert] = useState("");

  const { register, watch, setValue, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      goal: "",
      method: "AHP",
      deadline: defaultDeadline(),
      criteria: [],
      alternatives: [],
      experts: [],
    },
  });

  const criteria = watch("criteria");
  const alternatives = watch("alternatives");
  const experts = watch("experts");

  const handleAddExpert = () => {
    const email = newExpert.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Format email tidak valid");
      return;
    }
    if (experts.includes(email)) {
      toast.error("Email pakar sudah ada");
      return;
    }
    setValue("experts", [...experts, email]);
    setNewExpert("");
  };

  const handleRemoveExpert = (index: number) => {
    setValue("experts", experts.filter((_, i) => i !== index));
  };

  const handleAddCriteria = () => {
    if (newCriteria.trim().length < 2) {
      toast.error("Kriteria minimal 2 karakter");
      return;
    }
    if (criteria.includes(newCriteria)) {
      toast.error("Kriteria sudah ada");
      return;
    }
    setValue("criteria", [...criteria, newCriteria]);
    setNewCriteria("");
  };

  const handleRemoveCriteria = (index: number) => {
    setValue("criteria", criteria.filter((_, i) => i !== index));
  };

  const handleAddAlternative = () => {
    if (newAlternative.trim().length < 2) {
      toast.error("Alternatif minimal 2 karakter");
      return;
    }
    if (alternatives.includes(newAlternative)) {
      toast.error("Alternatif sudah ada");
      return;
    }
    setValue("alternatives", [...alternatives, newAlternative]);
    setNewAlternative("");
  };

  const handleRemoveAlternative = (index: number) => {
    setValue("alternatives", alternatives.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    try {
      // 1. Pastikan setiap pakar punya akun (backend membuat akun + password sementara)
      const tempPasswords: { email: string; password: string }[] = [];
      for (const email of data.experts) {
        const res = await api.post("/experts", { email, name: email.split("@")[0] });
        if (res.data.data?.tempPassword) {
          tempPasswords.push({ email, password: res.data.data.tempPassword });
        }
      }

      // 2. Buat kasus lengkap dalam satu payload (kontrak backend Node)
      const res = await api.post("/cases", {
        name: data.title,
        description: data.goal,
        objective: data.goal,
        method: data.method,
        deadline: data.deadline,
        goal: { name: data.goal },
        criteria: data.criteria.map((name, i) => ({ id: `c${i + 1}`, name })),
        alternatives: data.alternatives.map((name, i) => ({ id: `a${i + 1}`, name })),
        experts: data.experts.map((email) => ({ email, weight: 1 })),
      });

      toast.success("Kasus berhasil dibuat!");
      // Tampilkan password sementara pakar baru agar bisa dibagikan creator
      tempPasswords.forEach(({ email, password }) => {
        toast.info(`Password sementara ${email}: ${password}`, { duration: 20000 });
      });
      // withTransaction backend membungkus respons dua lapis — unwrap dengan aman
      const payload = res.data.data;
      const created = payload?.data ?? payload;
      navigate(created?.id ? `/cases/${created.id}` : "/dashboard");
    } catch (err: any) {
      toast.error(apiErrorMessage(err, "Gagal membuat kasus"));
    }
  };

  const steps = [
    { number: 1, label: "Informasi", description: "Judul, goal & metode" },
    { number: 2, label: "Kriteria", description: "Tambah kriteria" },
    { number: 3, label: "Alternatif", description: "Tambah alternatif" },
    { number: 4, label: "Pakar & Konfirmasi", description: "Undang & buat" },
  ];

  const isStepValid = {
    1: watch("title") && watch("goal") && watch("method") && watch("deadline"),
    2: criteria.length >= 2,
    3: alternatives.length >= 2,
    4: true,
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-slate-900 mb-2">Buat Kasus Baru</h1>
        <p className="text-slate-600">Ikuti 4 langkah untuk membuat kasus keputusan AHP</p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => (
            <div key={s.number} className="flex items-center flex-1">
              {/* Step Circle */}
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 font-semibold transition-all ${
                  step >= s.number
                    ? "bg-primary border-primary text-white"
                    : "bg-white border-slate-300 text-slate-600"
                }`}
              >
                {step > s.number ? (
                  <CheckCircle2 size={24} className="text-white" />
                ) : (
                  <span>{s.number}</span>
                )}
              </div>

              {/* Connector Line */}
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-all ${
                    step > s.number ? "bg-primary" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="flex justify-between mt-4">
          {steps.map((s) => (
            <div key={s.number} className="text-center flex-1">
              <p className="font-semibold text-slate-900 text-sm">{s.label}</p>
              <p className="text-slate-500 text-xs">{s.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* STEP 1: INFO */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2">
                Judul Kasus
              </label>
              <input
                id="title"
                {...register("title")}
                type="text"
                placeholder="Contoh: Pemilihan Strategi Pemasaran"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-all ${
                  errors.title ? "border-danger bg-danger/5" : "border-slate-200 hover:border-slate-300"
                } focus:border-primary focus:ring-2 focus:ring-primary/10`}
              />
              {errors.title && (
                <div className="flex items-center gap-1.5 text-danger text-xs mt-1.5">
                  <AlertCircle size={14} />
                  {errors.title.message}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="goal" className="block text-sm font-semibold text-slate-700 mb-2">
                Goal/Objektif
              </label>
              <textarea
                id="goal"
                {...register("goal")}
                placeholder="Jelaskan tujuan utama keputusan ini..."
                rows={4}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-all ${
                  errors.goal ? "border-danger bg-danger/5" : "border-slate-200 hover:border-slate-300"
                } focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none`}
              />
              {errors.goal && (
                <div className="flex items-center gap-1.5 text-danger text-xs mt-1.5">
                  <AlertCircle size={14} />
                  {errors.goal.message}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="method" className="block text-sm font-semibold text-slate-700 mb-2">
                  Metode MCDM
                </label>
                <select
                  {...register("method")}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                >
                  <option value="AHP">AHP</option>
                  <option value="Fuzzy AHP">Fuzzy AHP</option>
                  <option value="ANP">ANP</option>
                  <option value="Fuzzy ANP">Fuzzy ANP</option>
                </select>
              </div>

              <div>
                <label htmlFor="deadline" className="block text-sm font-semibold text-slate-700 mb-2">
                  Deadline
                </label>
                <input
                  id="deadline"
                  {...register("deadline")}
                  type="date"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
                {errors.deadline && (
                  <div className="flex items-center gap-1.5 text-danger text-xs mt-1.5">
                    <AlertCircle size={14} />
                    {errors.deadline.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CRITERIA */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Tambah Kriteria ({criteria.length})
              </label>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newCriteria}
                  onChange={(e) => setNewCriteria(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddCriteria()}
                  placeholder="Contoh: Harga, Kualitas, Kecepatan..."
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
                <button
                  type="button"
                  onClick={handleAddCriteria}
                  className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-all flex items-center gap-2"
                >
                  <Plus size={16} />
                  Tambah
                </button>
              </div>

              {criteria.length > 0 && (
                <div className="space-y-2">
                  {criteria.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-sm text-slate-700 font-medium">{idx + 1}. {c}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCriteria(idx)}
                        className="text-danger hover:bg-danger/10 p-1 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {errors.criteria && (
                <div className="flex items-center gap-1.5 text-danger text-xs mt-3">
                  <AlertCircle size={14} />
                  {errors.criteria.message}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: ALTERNATIVES */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Tambah Alternatif ({alternatives.length})
              </label>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newAlternative}
                  onChange={(e) => setNewAlternative(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddAlternative()}
                  placeholder="Contoh: Strategi A, Strategi B, Strategi C..."
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
                <button
                  type="button"
                  onClick={handleAddAlternative}
                  className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-all flex items-center gap-2"
                >
                  <Plus size={16} />
                  Tambah
                </button>
              </div>

              {alternatives.length > 0 && (
                <div className="space-y-2">
                  {alternatives.map((a, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-sm text-slate-700 font-medium">{idx + 1}. {a}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAlternative(idx)}
                        className="text-danger hover:bg-danger/10 p-1 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {errors.alternatives && (
                <div className="flex items-center gap-1.5 text-danger text-xs mt-3">
                  <AlertCircle size={14} />
                  {errors.alternatives.message}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: EXPERTS + CONFIRMATION */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in">
            {/* Experts Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Undang Pakar ({experts.length})
              </label>
              <div className="flex gap-2 mb-4">
                <input
                  type="email"
                  value={newExpert}
                  onChange={(e) => setNewExpert(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddExpert())}
                  placeholder="email.pakar@contoh.com"
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
                <button
                  type="button"
                  onClick={handleAddExpert}
                  className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-all flex items-center gap-2"
                >
                  <Plus size={16} />
                  Tambah
                </button>
              </div>

              {experts.length > 0 && (
                <div className="space-y-2 mb-2">
                  {experts.map((email, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-sm text-slate-700 font-medium">{idx + 1}. {email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExpert(idx)}
                        className="text-danger hover:bg-danger/10 p-1 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
                <KeyRound size={14} className="flex-shrink-0 mt-0.5" />
                <span>
                  Pakar yang belum punya akun akan dibuatkan otomatis. Password sementara mereka
                  ditampilkan setelah kasus dibuat — bagikan ke pakar agar bisa login.
                </span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-900 text-sm">
                ℹ️ Review informasi kasus Anda. Klik "Buat Kasus" untuk membuat kasus keputusan.
              </p>
            </div>

            <div className="space-y-4">
              {/* Case Info */}
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Informasi Kasus</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-500">Judul</p>
                    <p className="font-semibold text-slate-900">{watch("title")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Goal</p>
                    <p className="text-slate-700 text-sm">{watch("goal")}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Metode</p>
                      <p className="text-slate-900 font-medium">{watch("method")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Deadline</p>
                      <p className="text-slate-900 font-medium">{watch("deadline")}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Criteria */}
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Kriteria ({criteria.length})</p>
                <div className="space-y-1">
                  {criteria.map((c, idx) => (
                    <p key={idx} className="text-sm text-slate-700">
                      {idx + 1}. {c}
                    </p>
                  ))}
                </div>
              </div>

              {/* Alternatives */}
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Alternatif ({alternatives.length})</p>
                <div className="space-y-1">
                  {alternatives.map((a, idx) => (
                    <p key={idx} className="text-sm text-slate-700">
                      {idx + 1}. {a}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2.5 text-slate-700 font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Sebelumnya
          </button>

          <div className="text-sm text-slate-600">
            Step {step} dari {steps.length}
          </div>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(Math.min(4, step + 1))}
              disabled={!isStepValid[step as keyof typeof isStepValid]}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selanjutnya
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2.5 bg-success hover:bg-green-700 text-white font-semibold rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? "Membuat..." : "Buat Kasus"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
