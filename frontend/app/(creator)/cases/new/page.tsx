'use client';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateCase } from '@/hooks/useCases';
import { Case } from '@/types';

const schema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter'),
  description: z.string().optional(),
  method: z.enum(['AHP', 'ANP', 'FUZZY_AHP', 'FUZZY_ANP']),
  aggregation_method: z.enum(['GMJ', 'GMP']),
});

type FormData = z.infer<typeof schema>;

export default function NewCasePage() {
  const router = useRouter();
  const createCase = useCreateCase();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { method: 'AHP', aggregation_method: 'GMJ' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await createCase.mutateAsync(data) as Case;
      router.push(`/cases/${result.id}/criteria`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-black text-5xl text-near-black mb-8" style={{ lineHeight: 0.85 }}>
        Kasus Baru
      </h1>

      <div className="bg-white rounded-card-md shadow-ring p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-near-black mb-1">Judul Kasus</label>
            <input {...register('title')} placeholder="Pemilihan Supplier Terbaik" className="w-full px-4 py-3 rounded-[10px] border border-black/10 text-near-black font-normal text-sm focus:outline-none focus:ring-2 focus:ring-wise-green/50" />
            {errors.title && <p className="text-td-danger text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-near-black mb-1">Deskripsi <span className="text-td-gray font-normal">(opsional)</span></label>
            <textarea {...register('description')} rows={3} placeholder="Jelaskan tujuan pengambilan keputusan..." className="w-full px-4 py-3 rounded-[10px] border border-black/10 text-near-black font-normal text-sm focus:outline-none focus:ring-2 focus:ring-wise-green/50 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-near-black mb-1">Metode</label>
              <select {...register('method')} className="w-full px-4 py-3 rounded-[10px] border border-black/10 text-near-black font-normal text-sm focus:outline-none focus:ring-2 focus:ring-wise-green/50">
                <option value="AHP">AHP</option>
                <option value="ANP" disabled>ANP (Segera)</option>
                <option value="FUZZY_AHP" disabled>Fuzzy AHP (Segera)</option>
                <option value="FUZZY_ANP" disabled>Fuzzy ANP (Segera)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-near-black mb-1">Metode Agregasi</label>
              <select {...register('aggregation_method')} className="w-full px-4 py-3 rounded-[10px] border border-black/10 text-near-black font-normal text-sm focus:outline-none focus:ring-2 focus:ring-wise-green/50">
                <option value="GMJ">GMJ — Geometric Mean of Judgments</option>
                <option value="GMP">GMP — Geometric Mean of Priorities</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="bg-[rgba(22,51,0,0.08)] text-near-black font-semibold px-5 py-2.5 rounded-pill transition-transform hover:scale-105 active:scale-95">
              Batal
            </button>
            <button type="submit" disabled={createCase.isPending} className="bg-wise-green text-dark-green font-semibold px-5 py-2.5 rounded-pill transition-transform hover:scale-105 active:scale-95 disabled:opacity-50">
              {createCase.isPending ? 'Menyimpan...' : 'Buat Kasus'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
