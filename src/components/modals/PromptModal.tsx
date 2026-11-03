'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface PromptModalProps {
  title: string;
  description?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isOpen: boolean;
  onConfirm: (text: string) => void;
  onClose: () => void;
}

export default function PromptModal({
  title,
  description,
  placeholder = 'Enter details...',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isOpen,
  onConfirm,
  onClose,
}: PromptModalProps) {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length >= 2) {
      onConfirm(text.trim());
      setText('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--ink)]/35 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[var(--sf)] border border-[var(--hl)]/40 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--hl)]/40">
          <h3 className="text-base sm:text-lg font-semibold text-[var(--ink)] font-serif">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--s2)]/70 hover:text-[var(--ink)] hover:bg-[var(--hl)]/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {description && (
          <p className="text-xs text-[var(--s2)] mt-2 leading-relaxed">
            {description}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            rows={3}
            autoFocus
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] placeholder:text-[var(--s2)]/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all"
          />

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--hl)]/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-[var(--hl)]/40 bg-white text-[var(--s2)] hover:bg-[var(--sf)] transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-[var(--ac)] text-white hover:bg-[var(--ac-hover)] transition-colors shadow-xs"
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
