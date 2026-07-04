'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { login } from '@/lib/api';
import { loginSchema, type LoginInput } from '@/lib/validations';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError('');
    try {
      const result = await login(data.email, data.password);
      localStorage.setItem('token', result.access_token);
      localStorage.setItem('user', JSON.stringify(result.user));

      if (result.user.role === 'creator') {
        router.push('/dashboard');
      } else {
        router.push('/expert/cases');
      }
    } catch (err: any) {
      setServerError(err.message || 'Login gagal. Coba lagi.');
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
              Belum punya akun?
              <Link href="/auth/register" className="td-btn td-btn-secondary td-btn-sm">
                Daftar
              </Link>
            </div>
          </div>
        </nav>

        <div className="td-card mt-12">
          <h1 className="text-6xl font-black mb-2">Masuk</h1>
          <p className="text-[var(--td-text-muted)] text-base mb-8">Lanjutkan ke kasus dan penilaian pakar Anda.</p>

          {serverError && <div className="td-error mb-5">{serverError}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
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
              <div className="flex items-center justify-between">
                <label className="td-label" htmlFor="password">
                  Kata sandi
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs font-bold text-[var(--td-warm-dark)] hover:text-[var(--td-near-black)]"
                >
                  {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                </button>
              </div>
              <input
                className="td-input"
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-[var(--td-status-error-fg)]">{errors.password.message}</p>}
            </div>

            <div className="mt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="td-btn td-btn-primary w-full py-4"
              >
                {isSubmitting ? 'Memproses...' : 'Masuk'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--td-border)] text-center text-sm text-[var(--td-text-muted)]">
            Belum punya akun?
            <Link href="/auth/register" className="ml-1 text-[var(--td-green-dark)] font-bold">
              Daftar Creator →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
