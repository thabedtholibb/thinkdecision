'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateCase } from '@/lib/hooks';
import { createCaseSchema, type CreateCaseInput } from '@/lib/validations';
import { useState } from 'react';

export default function NewCasePage() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const createCaseMutation = useCreateCase();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateCaseInput>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: { method: 'AHP', aggregationMethod: 'GMJ' },
  });

  const method = watch('method');
  const aggregationMethod = watch('aggregationMethod');

  const onSubmit = async (data: CreateCaseInput) => {
    setServerError('');
    try {
      await createCaseMutation.mutateAsync(data);
      router.push('/dashboard');
    } catch (err: any) {
      setServerError(err.message || 'Gagal membuat kasus. Coba lagi.');
    }
  };

  return (
    <main className="td-page" style={{ background: 'var(--td-surface)' }}>
      <div className="td-container-narrow">
        <div className="flex items-center justify-between gap-6 py-8">
          <div className="flex items-center gap-2 text-sm text-[var(--td-text-muted)]">
            <Link href="/dashboard" className="hover:text-[var(--td-near-black)]">
              Kasus Saya
            </Link>
            <span>/</span>
            <span>Baru</span>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-6xl font-black leading-none">Kasus Baru</h1>
        </div>

        <div className="td-card mb-6">
          {serverError && <div className="td-error mb-5">{serverError}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            {/* Nama Kasus */}
            <div className="td-field">
              <label className="td-label">Nama Kasus</label>
              <input
                className="td-input"
                type="text"
                placeholder="Mis. Pemilihan Supplier Bahan Baku"
                {...register('name')}
              />
              {errors.name && <p className="text-xs text-[var(--td-status-error-fg)]">{errors.name.message}</p>}
              <span className="td-help">Deskripsi singkat untuk identifikasi kasus Anda.</span>
            </div>

            {/* Deskripsi */}
            <div className="td-field">
              <label className="td-label">Deskripsi</label>
              <textarea
                className="td-input"
                placeholder="Jelaskan konteks dan tujuan kasus ini..."
                {...register('description')}
              />
              {errors.description && <p className="text-xs text-[var(--td-status-error-fg)]">{errors.description.message}</p>}
            </div>

            {/* Metode & Agregasi */}
            <div className="grid grid-cols-2 gap-8">
              <div className="td-field">
                <label className="td-label">Metode</label>
                <select className="td-select" {...register('method')}>
                  <option value="AHP">AHP</option>
                  <option value="TOPSIS">TOPSIS</option>
                </select>
              </div>
              <div className="td-field">
                <label className="td-label">Agregasi</label>
                <select className="td-select" {...register('aggregationMethod')}>
                  <option value="GMJ">GMJ</option>
                  <option value="GMP">GMP</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Link href="/dashboard" className="td-btn td-btn-ghost">
                Batal
              </Link>
              <button type="submit" disabled={isSubmitting} className="td-btn td-btn-primary">
                {isSubmitting ? 'Membuat...' : 'Buat Kasus'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
