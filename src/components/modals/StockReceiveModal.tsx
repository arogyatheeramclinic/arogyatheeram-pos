'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { X, PackagePlus, Calculator } from 'lucide-react';
import { getTodayDate, formatMoney } from '@/lib/utils';

interface StockReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultItemId?: string;
}

export default function StockReceiveModal({
  isOpen,
  onClose,
  defaultItemId,
}: StockReceiveModalProps) {
  const { state, receiveStockBatch } = useClinic();

  const medicineItems = state.inv.filter((i) => i.stock !== null);
  const [itemId, setItemId] = useState(defaultItemId || medicineItems[0]?.id || '');
  const [batchNo, setBatchNo] = useState('');
  const [exp, setExp] = useState('');
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  const [supplier, setSupplier] = useState('');

  if (!isOpen) return null;

  const totalCost = (parseInt(qty) || 0) * (parseFloat(cost) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = parseInt(qty);
    if (!itemId || isNaN(q) || q <= 0) return;
    receiveStockBatch(itemId, batchNo.trim(), exp, q, +cost || 0, supplier.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[var(--ink)]/40 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-[var(--sf)] border border-[var(--hl)] rounded-2xl shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 my-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--hl)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--sage)]/70 text-[var(--ac)] border border-[var(--ac)]/20">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-serif text-[var(--ink)]">
                Receive Inventory Stock Batch
              </h3>
              <p className="text-xs text-[var(--s2)] mt-0.5">
                Log fresh formulation shipment and supplier batch into dispensary stock
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--s2)] hover:text-[var(--ink)] hover:bg-[var(--sf)] border border-transparent hover:border-[var(--hl)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5 text-xs sm:text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Column: Item & Supplier */}
            <div className="p-4 rounded-xl bg-white border border-[var(--hl)]/50 shadow-xs space-y-3.5">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] border-b border-[var(--hl)]/40 pb-2">
                Item & Source
              </div>

              <div>
                <label className="block font-semibold text-[var(--ink)] mb-1">
                  Select Formulation *
                </label>
                <select
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all cursor-pointer"
                >
                  {medicineItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.stock ?? 0} in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--ink)] mb-1">
                  Supplier / Pharmacy Distributor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kottakkal Arya Vaidya Sala, Vaidyaratnam"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] placeholder:text-[var(--s2)]/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all"
                />
              </div>
            </div>

            {/* Right Column: Batch Logistics & Quantities */}
            <div className="p-4 rounded-xl bg-white border border-[var(--hl)]/50 shadow-xs space-y-3.5">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] border-b border-[var(--hl)]/40 pb-2 flex items-center justify-between">
                <span>Batch Details</span>
                {totalCost > 0 && (
                  <span className="text-[11px] font-bold text-[var(--ac)]">
                    Val: {formatMoney(totalCost)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--ink)] mb-1">
                    Batch # *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B-2024-9"
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] placeholder:text-[var(--s2)]/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--ink)] mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    min={getTodayDate()}
                    value={exp}
                    onChange={(e) => setExp(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--ink)] mb-1">
                    Units Received *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] font-bold shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--ink)] mb-1">
                    Cost / Unit (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 110"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--hl)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-[var(--hl)] bg-white text-[var(--s2)] hover:bg-[var(--sf)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-[var(--ac)] text-white hover:bg-[var(--ac-hover)] transition-colors shadow-sm cursor-pointer"
            >
              Receive & Add to Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
