'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { X, Tag, Pill, Activity, ShieldCheck, Percent, IndianRupee } from 'lucide-react';
import { InventoryItem } from '@/types';

interface ItemModalProps {
  item?: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
}

export default function ItemModal({ item, isOpen, onClose }: ItemModalProps) {
  const { saveInventoryItem } = useClinic();

  const [name, setName] = useState(item?.name || '');
  const [type, setType] = useState<'medicine' | 'treatment'>(item?.type || 'medicine');
  const [price, setPrice] = useState(item?.price?.toString() || '');
  const [tax, setTax] = useState(item?.tax?.toString() || '5');
  const [low, setLow] = useState(item?.low?.toString() || '8');
  const [sess, setSess] = useState(item?.sess?.toString() || '1');

  if (!isOpen) return null;

  const numPrice = parseFloat(price) || 0;
  const numTax = parseFloat(tax) || 0;
  const taxAmount = (numPrice * numTax) / 100;
  const grossPrice = numPrice + taxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isNaN(+price) || +price < 0) return;
    saveInventoryItem({
      id: item?.id,
      name: name.trim(),
      type,
      price: +price,
      tax: +tax || 0,
      low: +low || 0,
      sess: +sess || 1,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--ink)]/40 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-[var(--sf)] border border-[var(--hl)]/50 rounded-2xl shadow-2xl p-6 sm:p-7 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[var(--hl)]/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white border border-[var(--hl)]/40 text-[var(--ac)] shadow-2xs">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-serif text-[var(--ink)] tracking-tight">
                {item ? `Edit Item · ${item.name}` : 'New Medicine or Treatment'}
              </h3>
              <p className="text-xs text-[var(--s2)] mt-0.5">
                Configure catalogue classification, pricing, tax rate, and dispensary controls
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
          {/* 2-Column Responsive Form Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Column: Classification & Identification */}
            <div className="space-y-4">
              {!item && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--s2)] mb-1.5">
                    Item Classification *
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white border border-[var(--hl)] shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setType('medicine')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        type === 'medicine'
                          ? 'bg-[var(--sf)] text-[var(--ac)] border border-[var(--hl)]/40 shadow-2xs'
                          : 'text-[var(--s2)] hover:text-[var(--ink)]'
                      }`}
                    >
                      <Pill className="w-3.5 h-3.5" />
                      <span>Medicine / Formulation</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('treatment')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        type === 'treatment'
                          ? 'bg-[var(--sf)] text-[var(--ac)] border border-[var(--hl)]/40 shadow-2xs'
                          : 'text-[var(--s2)] hover:text-[var(--ink)]'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Clinical Treatment</span>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-[var(--ink)] mb-1.5">
                  Item Name & Specification *
                </label>
                <input
                  type="text"
                  placeholder={type === 'medicine' ? 'e.g. Ashwagandha Tablets (60s)' : 'e.g. Shirodhara (45 mins)'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] placeholder:text-[var(--s2)]/50 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/30 focus:border-[var(--ac)] transition-all"
                />
                <span className="block text-[11px] text-[var(--s2)]/70 mt-1">
                  {type === 'medicine'
                    ? 'Include packaging dosage form (e.g. 60s, 200ml, 100g powder)'
                    : 'Specify therapeutic modality and session duration'}
                </span>
              </div>

              {type === 'medicine' ? (
                <div>
                  <label className="block font-semibold text-[var(--ink)] mb-1.5">
                    Low-Stock Reorder Threshold
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 8"
                      value={low}
                      onChange={(e) => setLow(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] font-medium placeholder:text-[var(--s2)]/50 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/30 focus:border-[var(--ac)] transition-all"
                    />
                    <span className="text-xs font-medium text-[var(--s2)] shrink-0">units</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[11px] text-[var(--s2)]/70">Quick set:</span>
                    {[5, 10, 15, 25].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setLow(val.toString())}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
                          low === val.toString()
                            ? 'bg-[var(--ac)] text-white border-[var(--ac)]'
                            : 'bg-white border-[var(--hl)] text-[var(--s2)] hover:text-[var(--ink)]'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-[var(--ink)] mb-1.5">
                    Sessions per Package
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1 for single, 7 for weekly protocol"
                    value={sess}
                    onChange={(e) => setSess(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] font-medium placeholder:text-[var(--s2)]/50 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/30 focus:border-[var(--ac)] transition-all"
                  />
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[11px] text-[var(--s2)]/70">Typical regimens:</span>
                    {[1, 3, 7, 14].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSess(val.toString())}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
                          sess === val.toString()
                            ? 'bg-[var(--ac)] text-white border-[var(--ac)]'
                            : 'bg-white border-[var(--hl)] text-[var(--s2)] hover:text-[var(--ink)]'
                        }`}
                      >
                        {val} {val === 1 ? 'day' : 'days'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Pricing & Financials */}
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-[var(--ink)] mb-1.5">
                  Unit Selling Price (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--s2)] font-semibold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] font-bold text-base placeholder:text-[var(--s2)]/50 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/30 focus:border-[var(--ac)] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--ink)] mb-1.5">
                  GST Tax Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="5"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    className="w-full px-3.5 pr-8 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] font-medium placeholder:text-[var(--s2)]/50 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/30 focus:border-[var(--ac)] transition-all"
                  />
                  <Percent className="w-4 h-4 text-[var(--s2)] absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-[var(--s2)]/70">GST slabs:</span>
                  {['0', '5', '12', '18'].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setTax(rate)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
                        tax === rate
                          ? 'bg-[var(--ac)] text-white border-[var(--ac)]'
                          : 'bg-white border-[var(--hl)] text-[var(--s2)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Calculation Overview Card */}
              <div className="p-3.5 rounded-xl bg-white border border-[var(--hl)] shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs text-[var(--s2)]">
                  <span>Base Unit Price:</span>
                  <span className="font-medium text-[var(--ink)]">₹{numPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--s2)]">
                  <span>Applicable GST ({numTax}%):</span>
                  <span className="font-medium text-[var(--ink)]">₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-[var(--hl)]/40 flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--ink)]">Final Invoice Price:</span>
                  <span className="text-sm font-bold font-serif text-[var(--ac)]">
                    ₹{grossPrice.toFixed(2)}
                  </span>
                </div>
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
              {item ? 'Save Catalogue Changes' : 'Confirm & Add to Catalogue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
