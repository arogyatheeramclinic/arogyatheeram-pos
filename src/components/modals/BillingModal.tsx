'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { calculateBill, formatMoney, getAvailableStock, parseQueryMultiplier } from '@/lib/utils';
import {
  Search,
  Trash2,
  X,
  Plus,
  AlertCircle,
  Receipt,
  User,
  Tag,
  CreditCard,
  Minus,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { InventoryItem } from '@/types';

export default function BillingModal() {
  const {
    state,
    activeBill,
    updateActiveBill,
    cancelBillingSession,
    finalizeInvoice,
    getPatient,
  } = useClinic();

  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown when clicking outside
  useEffect(() => {
    if (!isSearchFocused) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchFocused]);

  // Keyboard shortcuts: Ctrl+Enter to finalize invoice, Escape to cancel
  useEffect(() => {
    if (!activeBill) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (activeBill.items.length > 0) {
          finalizeInvoice();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (isSearchFocused) {
          setIsSearchFocused(false);
        } else {
          cancelBillingSession();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeBill, finalizeInvoice, isSearchFocused, cancelBillingSession]);

  if (!activeBill) return null;

  const currentPatient = getPatient(activeBill.pid);
  const calculations = calculateBill({
    items: activeBill.items,
    disc: activeBill.disc,
    dt: activeBill.dt,
  });

  // Numeric payment calculation for live change / balance display
  const numPaid = parseFloat(activeBill.paid) || 0;
  const changeToReturn = Math.max(0, numPaid - calculations.t);
  const balanceDue = Math.max(0, calculations.t - numPaid);

  // Filter inventory for search combobox
  const { text: cleanSearch, multiplier } = parseQueryMultiplier(searchQuery);
  const searchTokens = cleanSearch.toLowerCase().split(/\s+/).filter(Boolean);

  const searchResults: InventoryItem[] = cleanSearch
    ? state.inv
        .filter((item) =>
          searchTokens.every((token) =>
            `${item.name} ${item.type}`.toLowerCase().includes(token)
          )
        )
        .slice(0, 8)
    : state.inv.slice(0, 8);

  const addItemToBill = (item: InventoryItem, qty: number) => {
    updateActiveBill((prev) => {
      const existingIndex = prev.items.findIndex((x) => x.iid === item.id);
      if (existingIndex !== -1) {
        const updated = [...prev.items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: updated[existingIndex].qty + qty,
        };
        return { ...prev, items: updated };
      }
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            iid: item.id,
            name: item.name,
            type: item.type,
            qty,
            price: item.price,
            tax: item.tax || 0,
          },
        ],
      };
    });
    setSearchQuery('');
    setHighlightedIndex(0);
    searchInputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isSearchFocused) {
        setIsSearchFocused(true);
        return;
      }
      if (searchResults.length > 0) {
        setHighlightedIndex((prev) => (prev + 1) % searchResults.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isSearchFocused) {
        setIsSearchFocused(true);
        return;
      }
      if (searchResults.length > 0) {
        setHighlightedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
      }
    } else if (e.key === 'Enter') {
      if (!isSearchFocused) {
        e.preventDefault();
        setIsSearchFocused(true);
        return;
      }
      e.preventDefault();
      const selected = searchResults[highlightedIndex];
      if (selected) {
        addItemToBill(selected, multiplier);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsSearchFocused(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[var(--ink)]/40 backdrop-blur-xs overflow-hidden">
      <div className="w-full max-w-6xl xl:max-w-7xl h-[92vh] sm:h-[95vh] bg-[var(--sf)] border border-[var(--hl)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 my-auto">
        {/* Top Integrated Action Bar */}
        <div className="px-5 py-3.5 bg-white border-b border-[var(--hl)] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--sage)]/70 text-[var(--ac)] border border-[var(--ac)]/20 shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-serif text-[var(--ink)]">
                  {activeBill.rxid
                    ? `Prescription Billing · ${currentPatient?.name || 'Patient'}`
                    : 'Over-the-Counter / Walk-in Sale'}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--sage)] text-[var(--ac)]">
                  Dispensary POS
                </span>
              </div>
              <p className="text-xs text-[var(--s2)] mt-0.5">
                Fast dispensary checkout · Changes made here affect the invoice only
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[var(--sf)] border border-[var(--hl)] text-[var(--s2)]">
              {activeBill.items.length} {activeBill.items.length === 1 ? 'item' : 'items'}
            </span>
            <button
              onClick={cancelBillingSession}
              className="p-1.5 rounded-lg text-[var(--s2)] hover:text-[var(--ink)] hover:bg-[var(--sf)] border border-transparent hover:border-[var(--hl)] transition-colors cursor-pointer"
              title="Close (Esc)"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main 2-Pane Spacious Layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Workspace Pane: Order Entry Search & Spacious Items Table (68% Width) */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white p-4 sm:p-6 space-y-4 border-r border-[var(--hl)]/50">
            {/* Top Autocomplete Search Input */}
            <div ref={searchContainerRef} className="relative">
              <div
                className="relative cursor-text"
                onClick={() => {
                  setIsSearchFocused(true);
                  searchInputRef.current?.focus();
                }}
              >
                <Search className="w-4 h-4 text-[var(--s2)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                    setIsSearchFocused(true);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onClick={() => setIsSearchFocused(true)}
                  onMouseDown={() => setIsSearchFocused(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search catalogue to add medicines or treatments (type 'Item x2' for qty)..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] placeholder:text-[var(--s2)]/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {isSearchFocused && (
                <div
                  onMouseDown={(e) => e.preventDefault()}
                  className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-72 overflow-y-auto bg-white border border-[var(--hl)]/60 rounded-xl shadow-xl p-1 text-xs"
                >
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-[var(--s2)]">
                      No matching medicine or treatment found in catalogue.
                    </div>
                  ) : (
                    searchResults.map((item, k) => {
                      const available = getAvailableStock(item);
                      const isHighlighted = k === highlightedIndex;

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            addItemToBill(item, multiplier);
                            setIsSearchFocused(false);
                          }}
                          onMouseEnter={() => setHighlightedIndex(k)}
                          className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                            isHighlighted
                              ? 'bg-[var(--sage)] text-[var(--ac)] font-medium'
                              : 'hover:bg-[var(--sf)] text-[var(--ink)]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Plus className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-semibold">{item.name}</span>
                            <span className="text-[10px] capitalize px-1.5 py-0.5 rounded bg-white border border-[var(--hl)]">
                              {item.type}
                            </span>
                            {multiplier > 1 && isHighlighted && (
                              <span className="text-[10px] font-bold text-[var(--ac)]">
                                × {multiplier}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">{formatMoney(item.price)}</span>
                            {item.stock !== null && (
                              <span
                                className={`text-[11px] ${
                                  available <= 0
                                    ? 'text-[var(--err)] font-semibold'
                                    : 'text-[var(--s2)]'
                                }}`}
                              >
                                {available <= 0 ? 'Out of stock' : `${available} in stock`}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div className="p-2 text-[11px] text-[var(--s2)] border-t border-[var(--hl)] mt-1 flex justify-between items-center">
                    <span>Use ↑ ↓ to navigate · Enter to add · "Name x2" sets quantity</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSearchFocused(false);
                      }}
                      className="underline hover:text-[var(--ink)] cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Spacious Items Table Taking Full Real Estate */}
            <div className="flex-1 overflow-y-auto rounded-xl border border-[var(--hl)]/40 bg-white shadow-xs">
              {activeBill.items.length === 0 ? (
                <div className="h-full min-h-[220px] flex flex-col items-center justify-center p-8 text-center text-[var(--s2)] space-y-1.5">
                  <Receipt className="w-8 h-8 text-[var(--s2)]/40" />
                  <span className="font-semibold text-sm text-[var(--ink)]">No items in this invoice yet</span>
                  <span className="text-xs text-[var(--s2)]">
                    Type in the search bar above to quickly add medicines or therapy treatments.
                  </span>
                </div>
              ) : (
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[var(--sf)]/70 text-[var(--s2)] border-b border-[var(--hl)]/40 sticky top-0 z-10 backdrop-blur-xs">
                    <tr>
                      <th className="px-4 py-3 font-bold text-[var(--ink)]">Item & Category</th>
                      <th className="px-3 py-3 font-bold text-[var(--ink)] w-28 text-right">Unit Price (₹)</th>
                      <th className="px-3 py-3 font-bold text-[var(--ink)] w-32 text-center">Quantity</th>
                      <th className="px-4 py-3 font-bold text-[var(--ink)] w-28 text-right">Line Total</th>
                      <th className="px-3 py-3 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--hl)]/30">
                    {activeBill.items.map((item, idx) => {
                      const invItem = state.inv.find((i) => i.id === item.iid);
                      const available = invItem ? getAvailableStock(invItem) : Infinity;
                      const isStockShort = invItem?.stock !== null && item.qty > available;

                      return (
                        <tr
                          key={`${item.iid}-${idx}`}
                          className="hover:bg-[var(--sf)]/20 transition-colors"
                        >
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-[var(--ink)] text-sm">{item.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] capitalize px-1.5 py-0.5 rounded bg-[var(--sage)]/70 text-[var(--ac)] font-semibold">
                                {item.type}
                              </span>
                              {isStockShort && (
                                <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--err-bg)] text-[var(--err)] flex items-center gap-1 font-bold">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  Only {available} in stock
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3.5 text-right">
                            <input
                              type="number"
                              min="0"
                              value={item.price}
                              onChange={(e) => {
                                const val = Math.max(0, +e.target.value || 0);
                                updateActiveBill((prev) => {
                                  const updated = [...prev.items];
                                  updated[idx] = { ...updated[idx], price: val };
                                  return { ...prev, items: updated };
                                });
                              }}
                              className="w-24 px-2.5 py-1.5 text-xs bg-white border border-[var(--hl)] rounded-lg text-[var(--ink)] text-right font-semibold shadow-2xs focus:outline-none focus:ring-1 focus:ring-[var(--ac)] focus:border-[var(--ac)] transition-all"
                            />
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <div className="inline-flex items-center bg-white rounded-lg p-0.5 border border-[var(--hl)] shadow-2xs">
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.qty > 1) {
                                    updateActiveBill((prev) => {
                                      const updated = [...prev.items];
                                      updated[idx] = { ...updated[idx], qty: item.qty - 1 };
                                      return { ...prev, items: updated };
                                    });
                                  }
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded text-[var(--s2)] hover:text-[var(--ink)] hover:bg-[var(--sf)] transition-colors cursor-pointer"
                                title="Decrease"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.qty}
                                onChange={(e) => {
                                  const val = Math.max(1, parseInt(e.target.value) || 1);
                                  updateActiveBill((prev) => {
                                    const updated = [...prev.items];
                                    updated[idx] = { ...updated[idx], qty: val };
                                    return { ...prev, items: updated };
                                  });
                                }}
                                className="w-10 text-center font-bold bg-transparent text-[var(--ink)] text-xs border-0 focus:outline-none focus:ring-1 focus:ring-[var(--ac)] rounded p-0"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  updateActiveBill((prev) => {
                                    const updated = [...prev.items];
                                    updated[idx] = { ...updated[idx], qty: item.qty + 1 };
                                    return { ...prev, items: updated };
                                  });
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded text-[var(--s2)] hover:text-[var(--ink)] hover:bg-[var(--sf)] transition-colors cursor-pointer"
                                title="Increase"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-[var(--ink)] text-sm">
                            {formatMoney(item.qty * item.price)}
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                updateActiveBill((prev) => ({
                                  ...prev,
                                  items: prev.items.filter((_, i) => i !== idx),
                                }));
                              }}
                              className="p-1.5 text-[var(--s2)]/60 hover:text-[var(--err)] hover:bg-[var(--err-bg)]/40 rounded-lg transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Bottom Status Summary Bar */}
            <div className="flex items-center justify-between text-xs text-[var(--s2)] pt-2 border-t border-[var(--hl)]/40 shrink-0">
              <div className="flex items-center gap-3">
                <span>
                  Items on Bill: <strong className="text-[var(--ink)]">{activeBill.items.length}</strong>
                </span>
                <span>·</span>
                <span>
                  Total Units: <strong className="text-[var(--ink)]">{activeBill.items.reduce((s, x) => s + x.qty, 0)}</strong>
                </span>
              </div>
              <div className="text-[11px] text-[var(--s2)]">
                Press <code className="bg-white px-1.5 py-0.5 rounded border border-[var(--hl)] font-semibold">Enter</code> in search to add · <code className="bg-white px-1.5 py-0.5 rounded border border-[var(--hl)] font-semibold">Ctrl+Enter</code> to finalize
              </div>
            </div>
          </div>

          {/* Right Summary & Checkout Pane (32% Width) */}
          <div className="lg:w-84 xl:w-96 shrink-0 bg-[var(--sf)]/60 flex flex-col justify-between overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="space-y-4">
              {/* Customer / Billed To Card */}
              <div className="p-3.5 rounded-xl bg-white border border-[var(--hl)]/50 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--ink)] border-b border-[var(--hl)]/40 pb-2">
                  <User className="w-3.5 h-3.5 text-[var(--ac)]" />
                  <span>Billed Patient / Customer</span>
                </div>
                {!activeBill.rxid ? (
                  <select
                    value={activeBill.pid}
                    onChange={(e) =>
                      updateActiveBill((prev) => ({ ...prev, pid: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all cursor-pointer"
                  >
                    {state.pts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.phone !== '—' ? `(${p.phone})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs">
                    <span className="font-bold text-[var(--ink)]">{currentPatient?.name}</span>
                    <span className="text-[var(--s2)] ml-2">· {currentPatient?.phone}</span>
                  </div>
                )}
              </div>

              {/* Discount Card */}
              <div className="p-3.5 rounded-xl bg-white border border-[var(--hl)]/50 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--ink)] border-b border-[var(--hl)]/40 pb-2">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-[var(--ac)]" />
                    <span>Discount & Concessions</span>
                  </div>
                  {calculations.d > 0 && (
                    <span className="text-[11px] font-bold text-[var(--err)]">
                      − {formatMoney(calculations.d)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={activeBill.disc || ''}
                    onChange={(e) =>
                      updateActiveBill((prev) => ({
                        ...prev,
                        disc: Math.max(0, +e.target.value || 0),
                      }))
                    }
                    placeholder="0"
                    className="flex-1 px-3 py-2 text-xs border border-[var(--hl)] rounded-xl bg-white text-[var(--ink)] font-semibold shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all"
                  />
                  <select
                    value={activeBill.dt}
                    onChange={(e) =>
                      updateActiveBill((prev) => ({
                        ...prev,
                        dt: e.target.value as 'p' | 'f',
                      }))
                    }
                    className="w-32 px-3 py-2 text-xs border border-[var(--hl)] rounded-xl bg-white text-[var(--ink)] font-medium shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all cursor-pointer"
                  >
                    <option value="p">% Percent</option>
                    <option value="f">₹ Flat Off</option>
                  </select>
                </div>

                {/* Quick Discount Presets */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  {[0, 5, 10, 15].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() =>
                        updateActiveBill((prev) => ({
                          ...prev,
                          dt: 'p',
                          disc: pct,
                        }))
                      }
                      className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        activeBill.dt === 'p' && activeBill.disc === pct
                          ? 'bg-[var(--ac)] text-white shadow-xs'
                          : 'bg-[var(--sf)]/80 text-[var(--s2)] hover:bg-[var(--sage)] hover:text-[var(--ac)]'
                      }`}
                    >
                      {pct === 0 ? 'None' : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Settlement Card */}
              <div className="p-3.5 rounded-xl bg-white border border-[var(--hl)]/50 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--ink)] border-b border-[var(--hl)]/40 pb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-[var(--ac)]" />
                    <span>Payment Collection</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateActiveBill((prev) => ({ ...prev, paid: calculations.t.toString() }))
                    }
                    className="text-[11px] text-[var(--ac)] font-bold hover:underline cursor-pointer"
                  >
                    Fill Exact (₹{calculations.t})
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--s2)] mb-1">
                      Received Amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={activeBill.paid}
                      onChange={(e) =>
                        updateActiveBill((prev) => ({ ...prev, paid: e.target.value }))
                      }
                      placeholder={`Full: ${calculations.t}`}
                      className="w-full px-3 py-2 text-xs border border-[var(--hl)] rounded-xl bg-white text-[var(--ink)] font-bold shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--s2)] mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={activeBill.pm}
                      onChange={(e) =>
                        updateActiveBill((prev) => ({ ...prev, pm: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-xs border border-[var(--hl)] rounded-xl bg-white text-[var(--ink)] shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all cursor-pointer"
                    >
                      <option>Cash</option>
                      <option>UPI</option>
                      <option>Card</option>
                      <option>Credit</option>
                    </select>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={activeBill.pref}
                    onChange={(e) =>
                      updateActiveBill((prev) => ({ ...prev, pref: e.target.value }))
                    }
                    placeholder="Transaction Reference (UPI ID / Card Ref / Txn #)"
                    className="w-full px-3 py-2 text-xs border border-[var(--hl)] rounded-xl bg-white text-[var(--ink)] placeholder:text-[var(--s2)]/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all"
                  />
                </div>

                {/* Change or Balance Badge */}
                {numPaid > 0 && (
                  <div className="pt-1">
                    {changeToReturn > 0 ? (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--sage)]/60 border border-[var(--ac)]/20 text-xs">
                        <span className="font-medium text-[var(--ink)]">Change to Return:</span>
                        <span className="font-bold text-[var(--ac)] text-sm">
                          {formatMoney(changeToReturn)}
                        </span>
                      </div>
                    ) : balanceDue > 0 ? (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--err-bg)]/60 border border-[var(--err)]/20 text-xs">
                        <span className="font-medium text-[var(--err)]">Unpaid Balance:</span>
                        <span className="font-bold text-[var(--err)] text-sm">
                          {formatMoney(balanceDue)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--ac)] px-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Exact amount paid in full</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Financial Totals & Checkout Actions */}
            <div className="space-y-3 pt-2 border-t border-[var(--hl)]/40">
              <div className="space-y-1.5 text-xs text-[var(--s2)]">
                <div className="flex justify-between">
                  <span>Gross Subtotal:</span>
                  <span className="font-semibold text-[var(--ink)]">{formatMoney(calculations.s)}</span>
                </div>
                {calculations.d > 0 && (
                  <div className="flex justify-between text-[var(--err)] font-medium">
                    <span>Discount Applied:</span>
                    <span>− {formatMoney(calculations.d)}</span>
                  </div>
                )}
                {calculations.tx > 0 && (
                  <div className="flex justify-between">
                    <span>Tax (GST):</span>
                    <span className="font-semibold text-[var(--ink)]">{formatMoney(calculations.tx)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-[var(--hl)]/40 text-[var(--ink)]">
                  <span className="text-sm font-bold font-serif uppercase tracking-wider">Total Payable:</span>
                  <span className="text-2xl font-bold font-serif text-[var(--ac)]">
                    {formatMoney(calculations.t)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={cancelBillingSession}
                  className="flex-1 py-2.5 px-3 text-xs font-semibold rounded-xl border border-[var(--hl)] bg-white text-[var(--s2)] hover:bg-[var(--sf)] transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={finalizeInvoice}
                  disabled={activeBill.items.length === 0}
                  className="flex-2 py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-xl bg-[var(--ac)] hover:bg-[var(--ac-hover)] text-white shadow-md disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Finalize & Issue Bill</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
