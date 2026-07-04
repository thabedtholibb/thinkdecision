'use client';

import { useState } from 'react';

export default function ExpertsPage() {
  const [email, setEmail] = useState('');

  return (
    <div className="py-12">
      <div className="td-card">
        <h2 className="text-3xl font-black mb-2">Undang Pakar</h2>
        <p className="text-[var(--td-text-muted)] mb-8">Pakar akan menerima email tautan undangan dengan akses ke kasus ini.</p>

        {/* Invite form */}
        <div className="flex gap-3 items-end mb-8 p-5 rounded-2xl bg-[var(--td-mint)]">
          <div className="flex-1 td-field">
            <label className="td-label">Email pakar</label>
            <input
              type="email"
              placeholder="pakar@univ.ac.id"
              className="td-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button className="td-btn td-btn-dark">Undang →</button>
        </div>

        {/* Experts list */}
        <div className="space-y-3">
          {[
            { name: 'Dr. Ahmad Hidayat', email: 'ahmad@univ.ac.id', status: 'Completed' },
            { name: 'Prof. Siti Nurhaliza', email: 'siti@univ.ac.id', status: 'In Progress' },
            { name: 'Ir. Budi Santoso', email: 'budi@univ.ac.id', status: 'Pending' },
          ].map((expert) => (
            <div
              key={expert.email}
              className="grid grid-cols-[48px_1fr_200px_140px_60px] gap-5 items-center p-4 rounded-2xl border border-[var(--td-border)]"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--td-surface)] flex items-center justify-center font-bold text-sm">
                {expert.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-sm">{expert.name}</div>
                <div className="text-xs text-[var(--td-text-muted)] mt-1">{expert.email}</div>
              </div>
              <div className="text-xs text-[var(--td-text-muted)]">{expert.status}</div>
              <div className="text-right">
                <div className="w-full h-2 rounded-full bg-[var(--td-surface)]">
                  <div
                    className="h-full rounded-full bg-[var(--td-green)]"
                    style={{
                      width: expert.status === 'Completed' ? '100%' : expert.status === 'In Progress' ? '50%' : '0%',
                    }}
                  ></div>
                </div>
              </div>
              <button className="text-[var(--td-warm-dark)] hover:text-red-600">✕</button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <button className="td-btn td-btn-secondary">Batalkan</button>
          <button className="td-btn td-btn-primary">Simpan</button>
        </div>
      </div>
    </div>
  );
}
