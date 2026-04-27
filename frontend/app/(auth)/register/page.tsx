'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { AuthResponse } from '@/types';

const schema = z.object({
  full_name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
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
      const res = await authApi.register({ ...data, role: 'creator' }) as AuthResponse;
      login(res.access_token, res.user);
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.message || 'Registrasi gagal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-card-md shadow-ring p-8">
      <h2 className="font-black text-3xl text-near-black mb-2" style={{ lineHeight: 0.85 }}>
        Daftar Creator
      </h2>
      <p className="text-warm-dark font-normal mb-6 text-sm">
        Buat akun untuk mulai merancang kasus keputusan
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {[
          { name: 'full_name', label: 'Nama Lengkap', type: 'text', placeholder: 'Dr. Ahmad Fauzi' },
          { name: 'email', label: 'Email', type: 'email', placeholder: 'nama@email.com' },
          { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
        ].map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-semibold text-near-black mb-1">{field.label}</label>
            <input
              {...register(field.name as any)}
              type={field.type}
              placeholder={field.placeholder}
              className="w-full px-4 py-3 rounded-[10px] border border-black/10 text-near-black font-normal text-sm focus:outline-none focus:ring-2 focus:ring-wise-green/50"
            />
            {errors[field.name as keyof typeof errors] && (
              <p className="text-td-danger text-xs mt-1">
                {errors[field.name as keyof typeof errors]?.message}
              </p>
            )}
          </div>
        ))}

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
          {isLoading ? 'Memproses...' : 'Daftar & Mulai'}
        </button>
      </form>

      <p className="text-center text-sm text-warm-dark font-normal mt-6">
        Sudah punya akun?{' '}
        <Link href="/login" className="text-dark-green font-semibold hover:underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
