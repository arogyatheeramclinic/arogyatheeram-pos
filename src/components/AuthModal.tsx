'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { KeyRound, Lock, ShieldAlert } from 'lucide-react';

export default function AuthModal() {
  const { state, currentUser, login } = useClinic();
  const [selectedUserId, setSelectedUserId] = useState<string>(
    state.users[0]?.id || ''
  );
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) {
      setError('Please enter your PIN');
      return;
    }
    const res = login(selectedUserId, pin);
    if (!res.success) {
      setError(res.error || 'Incorrect PIN');
      setPin('');
    } else {
      setError(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--ink)]/30 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[var(--sf)] border border-[var(--hl)] rounded-2xl shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95">
        <div className="text-center">
          <div className="inline-block p-1 rounded-2xl bg-white border border-[var(--hl)] shadow-xs mb-3">
            <img
              src="/logo.webp"
              alt="Arogya Theeram Ayurvedic Clinic"
              className="w-16 h-16 rounded-xl object-cover"
            />
          </div>
          <h2 className="text-2xl font-bold font-serif text-[var(--ink)]">
            Arogya Theeram
          </h2>
          <div className="w-12 h-0.5 bg-[var(--brass)] mx-auto mt-2 rounded-full" />
          <p className="text-xs text-[var(--s2)] mt-2">
            Ayurvedic Clinic Management & POS System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--s2)] uppercase tracking-wider mb-1.5">
              Select Staff Profile
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--hl)] bg-white text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--ac)]"
            >
              {state.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--s2)] uppercase tracking-wider mb-1.5">
              Security PIN
            </label>
            <div className="relative">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(null);
                }}
                placeholder="Enter 4-8 digit PIN"
                autoFocus
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[var(--hl)] bg-white text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--ac)]"
              />
              <KeyRound className="w-4 h-4 text-[var(--s2)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--err-bg)] text-[var(--err)] text-xs font-medium border border-[var(--err)]/20 animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[var(--ac)] hover:bg-[var(--ac-hover)] text-white font-medium text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--ac)]"
          >
            Sign In to Arogya Theeram
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[var(--hl)]/60 text-center">
          <p className="text-xs text-[var(--s2)]">
            <span className="font-semibold text-[var(--ink)]">Starting PINs:</span> Doctor: <code className="bg-white px-1.5 py-0.5 rounded border border-[var(--hl)]">1234</code> · Reception: <code className="bg-white px-1.5 py-0.5 rounded border border-[var(--hl)]">1111</code>
          </p>
        </div>
      </div>
    </div>
  );
}
