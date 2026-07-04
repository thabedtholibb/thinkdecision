'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { register as registerApi } from '@/lib/api';
import { registerSchema, type RegisterInput } from '@/lib/validations';

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'creator' },
  });

  const role = watch('role');

  const onSubmit = async (data: RegisterInput) => {
    setServerError('');
    try {
      const result = await registerApi(data.name, data.email, data.password, data.role);
      localStorage.setItem('token', result.access_token);
      localStorage.setItem('user', JSON.stringify(result.user));

      router.push('/dashboard');
    } catch (err: any) {
      setServerError(err.message || 'Pendaftaran gagal. Coba lagi.');
    }
  };

  return (
    <div style={{ background: 'var(--td-surface)' }} className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <nav className="td-nav" style={{ position: 'static', height: 'auto', padding: 0, background: 'none', borderBottom: 'none' }}>
          <div className="td-nav-inner" style={{ maxWidth: '100%' }}>
            <Link href="/" className="td-logo">
              <span className="td-logo-mark">T</span>
              Think Decision
            </Link>
            <div className="flex items-center gap-2">
              Sudah punya akun?
              <Link href="/auth/login" className="td-btn td-btn-secondary td-btn-sm">
                Masuk
              </Link>
            </div>
          </div>
        </nav>

        <div className="td-card mt-12">
          <h1 className="text-5xl font-black mb-2">Daftar Creator</h1>
          <p className="text-[var(--td-text-muted)] text-base mb-8">Mulai membuat kasus dan mengundang pakar dalam hitungan menit.</p>

          {serverError && <div className="td-error mb-5">{serverError}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-2 bg-[var(--td-surface)] p-1.5 rounded-full mb-4">
              <button
                type="button"
                onClick={() => setValue('role', 'creator')}
                className={`px-3 py-3 rounded-full font-bold text-sm transition-all ${
                  role === 'creator'
                    ? 'bg-[var(--td-near-black)] text-[var(--td-white)]'
                    : 'bg-transparent text-[var(--td-warm-dark)]'
                }`}
              >
                Creator
              </button>
              <button
                type="button"
                onClick={() => setValue('role', 'expert')}
                className={`px-3 py-3 rounded-full font-bold text-sm transition-all ${
                  role === 'expert'
                    ? 'bg-[var(--td-near-black)] text-[var(--td-white)]'
                    : 'bg-transparent text-[var(--td-warm-dark)]'
                }`}
              >
                Pakar
              </button>
            </div>
            <input type="hidden" {...register('role')} />

            <div className="td-field">
              <label className="td-label" htmlFor="name">
                Nama lengkap
              </label>
              <input
                className="td-input"
                id="name"
                type="text"
                placeholder="Mis. Ahmad Saputra"
                {...register('name')}
              />
              {errors.name && <p className="text-xs text-[var(--td-status-error-fg)]">{errors.name.message}</p>}
            </div>

            <div className="td-field">
              <label className="td-label" htmlFor="email">
                Email
              </label>
              <input
                className="td-input"
                id="email"
                type="email"
                placeholder="anda@contoh.com"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-[var(--td-status-error-fg)]">{errors.email.message}</p>}
            </div>

            <div className="td-field">
              <label className="td-label" htmlFor="password">
                Kata sandi
              </label>
              <input
                className="td-input"
                id="password"
                type="password"
                placeholder="Min. 6 karakter"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-[var(--td-status-error-fg)]">{errors.password.message}</p>}
              <span className="td-help">Gunakan kombinasi huruf, angka, dan simbol.</span>
            </div>

            <p className="text-xs text-[var(--td-text-muted)] leading-relaxed">
              Dengan mendaftar, Anda menyetujui{' '}
              <a href="#" className="text-[var(--td-green-dark)] font-bold">
                Ketentuan Layanan
              </a>{' '}
              dan{' '}
              <a href="#" className="text-[var(--td-green-dark)] font-bold">
                Kebijakan Privasi
              </a>{' '}
              Think Decision.
            </p>

            <div className="mt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="td-btn td-btn-primary w-full py-4"
              >
                {isSubmitting ? 'Memproses...' : 'Daftar & Mulai'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--td-border)] text-center text-sm text-[var(--td-text-muted)]">
            Sudah punya akun?
            <Link href="/auth/login" className="ml-1 text-[var(--td-green-dark)] font-bold">
              Masuk →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
