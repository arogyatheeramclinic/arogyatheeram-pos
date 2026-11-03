'use client';

import React from 'react';
import { useClinic } from '@/context/ClinicContext';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Toast() {
  const { toast } = useClinic();

  if (!toast) return null;

  return (
    <div
      role="status"
      id="toast"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-lg border shadow-lg text-sm font-medium transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
        toast.isError
          ? 'bg-[var(--err-bg)] text-[var(--err)] border-[var(--err)]/30'
          : 'bg-[var(--sf)] text-[var(--ink)] border-[var(--hl)] shadow-[var(--lift)]'
      }`}
    >
      {toast.isError ? (
        <AlertCircle className="w-4 h-4 text-[var(--err)] shrink-0" />
      ) : (
        <CheckCircle2 className="w-4 h-4 text-[var(--ac)] shrink-0" />
      )}
      <span>{toast.message}</span>
    </div>
  );
}
