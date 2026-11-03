'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { X, SlidersHorizontal, ArrowDown, ArrowUp, PackageCheck, AlertCircle } from 'lucide-react';
import { InventoryItem } from '@/types';

interface StockAdjustModalProps {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
}

const REASONS = [
  'Physical Count Correction',
  'Damage / Breakage',
  'Expired Shelf-Life',
  'Wastage / Dispensing Loss',
  'Returned to Supplier',
  'Internal Doctor Sample',
  'Other Administrative',
];

export default function StockAdjustModal({
  item,
  isOpen,
  onClose,
}: StockAdjustModalProps) {
  const { adjustStockBatch } = useClinic();

  const batches = item.batches || [];
  const [batchId, setBatchId] = useState(batches[0]?.id || '');
  const [mode, setMode] = useState<'deduct' | 'add'>('deduct');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('Physical Count Correction');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const selectedBatch = batches.find((b) => b.id === batchId) || batches[0];
  const currentBatchQty = selectedBatch?.qty || 0;
  const parsedAmt = Math.abs(parseInt(amount) || 0);
  const signedDelta = mode === 'deduct' ? -parsedAmt : parsedAmt;
  const projectedBatchQty = Math.max(0, currentBatchQty + signedDelta);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId || parsedAmt <= 0) return;
    adjustStockBatch(item.id, batchId, signedDelta, reason, note.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--ink)]/40 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-[var(--sf)] border border-[var(--hl)]/50 rounded-2xl shadow-2xl p-6 sm:p-7 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[var(--hl)]/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white border border-[var(--hl)]/40 text-[var(--ac)] shadow-2xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-serif text-[var(--ink)] tracking-tight">
                Stock Reconciliation · {item.name}
              </h3>
              <p className="text-xs text-[var(--s2)] mt-0.5">
                Adjust batch quantity for audit discrepancies, physical stock checks, or wastage
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--s2)]/70 hover:text-[var(--ink)] hover:bg-[var(--hl)]/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5 text-xs sm:text-sm">
          {/* 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Column: Batch Status & Live Projection */}
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-[var(--ink)] mb-1.5">
                  Select Batch to Reconcile *
                </label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/30 focus:border-[var(--ac)] transition-all cursor-pointer"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      Batch {b.no} ({b.qty} in stock{b.exp ? ` · Exp: ${b.exp}` : ''})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Batch Details Card */}
              {selectedBatch && (
                <div className="p-4 rounded-xl bg-white border border-[var(--hl)] shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-[var(--hl)]/30">
                    <span className="font-semibold text-[var(--ink)]">Batch Details</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--sf)] border border-[var(--hl)]/40 text-[var(--ink)]">
                      {selectedBatch.no}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--s2)]">
                    <span>Current In-Stock Count:</span>
                    <span className="font-bold text-[var(--ink)] text-sm">{currentBatchQty} units</span>
                  </div>
                  {selectedBatch.exp && (
                    <div className="flex items-center justify-between text-xs text-[var(--s2)]">
                      <span>Expiry Date:</span>
                      <span className="font-medium text-[var(--ink)]">{selectedBatch.exp}</span>
                    </div>
                  )}
                  {selectedBatch.sup && (
                    <div className="flex items-center justify-between text-xs text-[var(--s2)]">
                      <span>Supplier Source:</span>
                      <span className="font-medium text-[var(--ink)]">{selectedBatch.sup}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Live Batch Projection Shelf */}
              <div className="p-4 rounded-xl bg-[var(--sf)] border border-[var(--hl)]/60 shadow-2xs space-y-2">
                <span className="text-xs font-semibold text-[var(--s2)] uppercase tracking-wider block">
                  Projected Stock Count
                </span>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <span className="block text-[11px] text-[var(--s2)]">Current</span>
                    <span className="font-bold text-sm text-[var(--ink)]">{currentBatchQty}</span>
                  </div>
                  <span className="text-[var(--s2)] font-bold text-base">→</span>
                  <div className="text-center">
                    <span className="block text-[11px] text-[var(--s2)]">Change</span>
                    <span
                      className={`font-bold text-sm ${
                        signedDelta < 0
                          ? 'text-[var(--err)]'
                          : signedDelta > 0
                          ? 'text-[var(--ac)]'
                          : 'text-[var(--s2)]'
                      }`}
                    >
                      {signedDelta > 0 ? `+${signedDelta}` : signedDelta}
                    </span>
                  </div>
                  <span className="text-[var(--s2)] font-bold text-base">→</span>
                  <div className="text-center">
                    <span className="block text-[11px] text-[var(--s2)]">Final Balance</span>
                    <span
                      className={`font-bold text-base font-serif ${
                        mode === 'deduct' && parsedAmt > 0
                          ? 'text-[var(--err)]'
                          : parsedAmt > 0
                          ? 'text-[var(--ac)]'
                          : 'text-[var(--ink)]'
                      }`}
                    >
                      {projectedBatchQty} units
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Controls & Reason */}
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--s2)] mb-1.5">
                  Adjustment Direction *
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white border border-[var(--hl)] shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setMode('deduct')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      mode === 'deduct'
                        ? 'bg-[var(--err-bg)] text-[var(--err)] border border-[var(--err)]/20 shadow-2xs'
                        : 'text-[var(--s2)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>Reduce Stock (−)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('add')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      mode === 'add'
                        ? 'bg-[var(--sage)] text-[var(--ac)] border border-[var(--ac)]/20 shadow-2xs'
                        : 'text-[var(--s2)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>Add / Surplus (+)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--ink)] mb-1.5">
                  Quantity Units to {mode === 'deduct' ? 'Deduct' : 'Add'} *
                </label>
                <input
                  type="number"
                  min="1"
                  max={mode === 'deduct' ? currentBatchQty : 9999}
                  placeholder="e.g. 5"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] font-bold text-base placeholder:text-[var(--s2)]/50 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/30 focus:border-[var(--ac)] transition-all"
                />
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-[var(--s2)]/70">Quick amounts:</span>
                  {[1, 5, 10, 20].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val.toString())}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
                        amount === val.toString()
                          ? 'bg-[var(--ac)] text-white border-[var(--ac)]'
                          : 'bg-white border-[var(--hl)] text-[var(--s2)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--ink)] mb-1.5">
                  Reason for Adjustment *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/30 focus:border-[var(--ac)] transition-all cursor-pointer"
                >
                  {REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--ink)] mb-1.5">
                  Audit / Reconciliation Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stock audit variance found during monthly physical count"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] placeholder:text-[var(--s2)]/50 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/30 focus:border-[var(--ac)] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--hl)]/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--hl)] bg-white text-[var(--s2)] hover:bg-[var(--sf)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-xs font-bold rounded-xl bg-[var(--ac)] text-white hover:bg-[var(--ac-hover)] transition-colors shadow-2xs cursor-pointer"
            >
              Confirm Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
