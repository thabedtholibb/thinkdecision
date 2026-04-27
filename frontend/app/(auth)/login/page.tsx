'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { AuthResponse } from '@/types';

const schema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await authApi.login(data) as AuthResponse;
      login(res.access_token, res.user);
      if (res.user.role === 'creator') {
        router.push('/dashboard');
      } else {
        router.push('/expert/dashboard');
      }
    } catch (e: any) {
      setError(e.message || 'Login gagal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-card-md shadow-ring p-8">
      <h2 className="font-black text-3xl text-near-black mb-2" style={{ lineHeight: 0.85 }}>
        Masuk
      </h2>
      <p className="text-warm-dark font-normal mb-6 text-sm">
        Masuk sebagai Creator atau Pakar
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-near-black mb-1">Email</label>
          <input
            {...register('email')}
            type="email"
            placeholder="nama@email.com"
            className="w-full px-4 py-3 rounded-[10px] border border-black/10 text-near-black font-normal text-sm focus:outline-none focus:ring-2 focus:ring-wise-green/50"
          />
          {errors.email && <p className="text-td-danger text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-near-black mb-1">Password</label>
          <input
            {...register('password')}
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-[10px] border border-black/10 text-near-black font-normal text-sm focus:outline-none focus:ring-2 focus:ring-wise-green/50"
          />
          {errors.password && <p className="text-td-danger text-xs mt-1">{errors.password.message}</p>}
        </div>

        {error && (
          <div className="bg-red-50 border border-td-danger/20 rounded-[10px] px-4 py-3">
            <p className="text-td-danger text-sm font-normal">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-wise-green text-dark-green font-semibold py-3 rounded-pill transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
        >
          {isLoading ? 'Memproses...' : 'Masuk'}
        </button>
      </form>

      <p className="text-center text-sm text-warm-dark font-normal mt-6">
        Belum punya akun?{' '}
        <Link href="/register" className="text-dark-green font-semibold hover:underline">
          Daftar sebagai Creator
        </Link>
      </p>
    </div>
  );
}
