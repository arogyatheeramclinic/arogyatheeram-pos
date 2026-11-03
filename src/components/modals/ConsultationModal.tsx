'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useClinic } from '@/context/ClinicContext';
import {
  formatDate,
  formatMoney,
  getAvailableStock,
  checkAllergyMatch,
  parseQueryMultiplier,
} from '@/lib/utils';
import {
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  Star,
  AlertTriangle,
  History,
  Clock,
  Check,
  BookmarkCheck,
  Activity,
  Heart,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { InventoryItem, PrescriptionItem } from '@/types';
import PromptModal from './PromptModal';

const FREQUENCY_MULTIPLIERS: Record<string, number> = {
  'Once daily': 1,
  'Twice daily': 2,
  'Three times daily': 3,
  'At bedtime': 1,
  'As needed': 1,
};

const FREQUENCY_OPTIONS = [
  'Frequency',
  'Once daily',
  'Twice daily',
  'Three times daily',
  'At bedtime',
  'As needed',
];

const TIMING_OPTIONS = [
  'Timing',
  'After food',
  'Before food',
  'With food',
  'Empty stomach',
];

export default function ConsultationModal() {
  const {
    state,
    activeConsultation,
    updateActiveConsultation,
    cancelConsultation,
    savePrescription,
    repeatLastPrescription,
    applyTemplate,
    saveCurrentAsTemplate,
    toggleFavoriteItem,
    getPatient,
  } = useClinic();

  const [categoryFilter, setCategoryFilter] = useState<'all' | 'medicine' | 'treatment'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

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

  // Keyboard shortcut Ctrl+Enter to save (only active when modal is open)
  useEffect(() => {
    if (!activeConsultation) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        savePrescription();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeConsultation, savePrescription]);

  if (!activeConsultation) return null;

  const patient = getPatient(activeConsultation.pid);
  const pastPrescriptions = state.rx.filter((r) => r.pid === activeConsultation.pid);
  const lastRx = pastPrescriptions[pastPrescriptions.length - 1];

  // Frequency auto-calculator for prescription item
  const updateItemAndAutoCalculate = (
    index: number,
    field: keyof PrescriptionItem,
    value: string | number
  ) => {
    updateActiveConsultation((prev) => {
      const updated = [...prev.items];
      const item = { ...updated[index], [field]: value };

      // Auto-compute quantity if dose and days are numeric
      const freq = item.fr ? FREQUENCY_MULTIPLIERS[item.fr] || 1 : null;
      const doseNum = parseFloat(item.dq || '');
      const daysNum = +item.days! || 0;

      if (freq && !isNaN(doseNum) && doseNum > 0 && daysNum > 0 && !/[a-z]/i.test(item.dq || '')) {
        item.qty = Math.ceil(freq * doseNum * daysNum);
      }

      updated[index] = item;
      return { ...prev, items: updated };
    });
  };

  // Catalog search filtering
  const { text: cleanSearch, multiplier } = parseQueryMultiplier(searchQuery);
  const tokens = cleanSearch.toLowerCase().split(/\s+/).filter(Boolean);

  // Frequently prescribed count
  const frequencyMap: Record<string, number> = {};
  state.rx.forEach((r) =>
    r.items.forEach((x) => {
      frequencyMap[x.iid] = (frequencyMap[x.iid] || 0) + 1;
    })
  );

  const filteredCatalog = state.inv
    .filter(
      (item) =>
        (categoryFilter === 'all' || item.type === categoryFilter) &&
        tokens.every((t) => `${item.name} ${item.type}`.toLowerCase().includes(t))
    )
    .sort((a, b) => {
      if (b.fav !== a.fav) return b.fav ? 1 : -1;
      const freqDiff = (frequencyMap[b.id] || 0) - (frequencyMap[a.id] || 0);
      if (freqDiff !== 0) return freqDiff;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 8);

  const addItemToPrescription = (item: InventoryItem, qty: number) => {
    updateActiveConsultation((prev) => {
      const exists = prev.items.find((x) => x.iid === item.id);
      if (exists) {
        return {
          ...prev,
          items: prev.items.map((x) =>
            x.iid === item.id ? { ...x, qty: x.qty + qty } : x
          ),
        };
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
            dq: item.type === 'medicine' ? '1' : '',
            fr: item.type === 'medicine' ? 'Twice daily' : '',
            tm: item.type === 'medicine' ? 'After food' : '',
            days: 14,
            nt: '',
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
      if (filteredCatalog.length > 0) {
        setHighlightedIndex((prev) => (prev + 1) % filteredCatalog.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isSearchFocused) {
        setIsSearchFocused(true);
        return;
      }
      if (filteredCatalog.length > 0) {
        setHighlightedIndex((prev) => (prev - 1 + filteredCatalog.length) % filteredCatalog.length);
      }
    } else if (e.key === 'Enter') {
      if (!isSearchFocused) {
        e.preventDefault();
        setIsSearchFocused(true);
        return;
      }
      e.preventDefault();
      const selected = filteredCatalog[highlightedIndex];
      if (selected) {
        addItemToPrescription(selected, multiplier);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsSearchFocused(false);
    }
  };

  // Helper for quick follow-up date buttons
  const setQuickFollowUp = (daysAhead: number) => {
    const d = new Date(Date.now() + daysAhead * 86400000);
    updateActiveConsultation((prev) => ({
      ...prev,
      fu: d.toLocaleDateString('en-CA'),
    }));
  };

  // Total estimated prescription value
  const estimatedTotal = activeConsultation.items.reduce(
    (sum, x) => sum + x.qty * x.price,
    0
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[var(--ink)]/40 backdrop-blur-xs overflow-hidden">
        <div className="w-full max-w-7xl h-[95vh] bg-[var(--sf)] border border-[var(--hl)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
          {/* Top Integrated Action Bar */}
          <div className="px-5 py-3.5 bg-white border-b border-[var(--hl)] flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Patient Identity */}
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold font-serif text-[var(--ink)]">
                    {patient?.name || 'Patient Consultation'}
                  </h2>
                  <span className="text-xs text-[var(--s2)] font-medium">
                    {[patient?.age ? `${patient.age} yrs` : '', patient?.sex, patient?.phone]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--s2)] mt-0.5">
                  {pastPrescriptions.length > 0
                    ? `${pastPrescriptions.length} earlier visit${pastPrescriptions.length === 1 ? '' : 's'} · Last on ${formatDate(lastRx?.t || '')}`
                    : 'First consultation on record'}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              {lastRx && (
                <button
                  type="button"
                  onClick={repeatLastPrescription}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--hl)] bg-[var(--sf)] text-[var(--ac)] hover:bg-[var(--sage)] transition-colors flex items-center gap-1.5"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Repeat Last Rx</span>
                </button>
              )}

              {state.tp.length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      applyTemplate(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[var(--hl)] bg-white text-[var(--ink)] shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)]"
                >
                  <option value="">Apply Protocol...</option>
                  {state.tp.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.items.length} items)
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(true)}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[var(--hl)] bg-white text-[var(--s2)] hover:text-[var(--ink)] transition-colors flex items-center gap-1"
                title="Save current prescription as template"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save Protocol</span>
              </button>

              <div className="h-5 w-px bg-[var(--hl)] mx-1" />

              <button
                type="button"
                onClick={cancelConsultation}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--hl)] text-[var(--s2)] hover:bg-[var(--hl)]/30 transition-colors"
              >
                Close (Esc)
              </button>

              <button
                type="button"
                onClick={savePrescription}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[var(--ac)] text-white hover:bg-[var(--ac-hover)] transition-colors shadow-xs flex items-center gap-1.5"
                title="Ctrl + Enter to save"
              >
                <Check className="w-4 h-4" />
                <span>Save & Complete (Ctrl+Enter)</span>
              </button>
            </div>
          </div>

          {/* 2-Column Split Workspace */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-[var(--hl)]">
            {/* Left Pane: Patient Chart, Allergies, Vitals & History (30% Width) */}
            <div className="lg:w-80 xl:w-96 shrink-0 bg-[var(--sf)]/60 flex flex-col overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Allergy & Health Condition Warnings */}
              {(patient?.allergies || patient?.cond) ? (
                <div className="p-3.5 rounded-xl bg-[var(--err-bg)] text-[var(--err)] border border-[var(--err)]/20 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Clinical Safety Alerts</span>
                  </div>
                  {patient.allergies && (
                    <div>
                      <span className="font-bold">Allergies:</span> {patient.allergies}
                    </div>
                  )}
                  {patient.cond && (
                    <div>
                      <span className="font-bold">Conditions:</span> {patient.cond}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-white border border-[var(--hl)] text-xs text-[var(--s2)]">
                  No known drug allergies or chronic conditions on file.
                </div>
              )}

              {/* Health Check & Vitals Card */}
              <div className="p-4 rounded-xl bg-white border border-[var(--hl)]/40 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--ink)] border-b border-[var(--hl)]/40 pb-2">
                  <Activity className="w-4 h-4 text-[var(--ac)]" />
                  <span>Physical Vitals</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--s2)] mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 62"
                      value={activeConsultation.vit?.wt || ''}
                      onChange={(e) =>
                        updateActiveConsultation((prev) => ({
                          ...prev,
                          vit: { ...prev.vit, wt: e.target.value },
                        }))
                      }
                      className="w-full px-2.5 py-2 border border-[var(--hl)] rounded-xl bg-white text-[var(--ink)] font-semibold text-center shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--s2)] mb-1">
                      BP (mmHg)
                    </label>
                    <input
                      type="text"
                      placeholder="120/80"
                      value={activeConsultation.vit?.bp || ''}
                      onChange={(e) =>
                        updateActiveConsultation((prev) => ({
                          ...prev,
                          vit: { ...prev.vit, bp: e.target.value },
                        }))
                      }
                      className="w-full px-2.5 py-2 border border-[var(--hl)] rounded-xl bg-white text-[var(--ink)] font-semibold text-center shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--s2)] mb-1">
                      Pulse (bpm)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 74"
                      value={activeConsultation.vit?.pulse || ''}
                      onChange={(e) =>
                        updateActiveConsultation((prev) => ({
                          ...prev,
                          vit: { ...prev.vit, pulse: e.target.value },
                        }))
                      }
                      className="w-full px-2.5 py-2 border border-[var(--hl)] rounded-xl bg-white text-[var(--ink)] font-semibold text-center shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Follow-up Date Card */}
              <div className="p-4 rounded-xl bg-white border border-[var(--hl)]/40 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--ink)] border-b border-[var(--hl)]/40 pb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--ac)]" />
                    <span>Follow-up Date</span>
                  </div>
                  {activeConsultation.fu && (
                    <span className="text-[11px] font-semibold text-[var(--ac)]">
                      {formatDate(activeConsultation.fu)}
                    </span>
                  )}
                </div>

                <input
                  type="date"
                  value={activeConsultation.fu || ''}
                  onChange={(e) =>
                    updateActiveConsultation((prev) => ({ ...prev, fu: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs border border-[var(--hl)] rounded-xl bg-white text-[var(--ink)] shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all"
                />

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setQuickFollowUp(7)}
                    className="flex-1 py-1 rounded bg-[var(--sf)]/80 text-[var(--s2)] hover:bg-[var(--sage)] hover:text-[var(--ac)] text-[11px] font-medium transition-colors"
                  >
                    +1 Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickFollowUp(14)}
                    className="flex-1 py-1 rounded bg-[var(--sf)]/80 text-[var(--s2)] hover:bg-[var(--sage)] hover:text-[var(--ac)] text-[11px] font-medium transition-colors"
                  >
                    +2 Weeks
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickFollowUp(30)}
                    className="flex-1 py-1 rounded bg-[var(--sf)]/80 text-[var(--s2)] hover:bg-[var(--sage)] hover:text-[var(--ac)] text-[11px] font-medium transition-colors"
                  >
                    +1 Month
                  </button>
                </div>
              </div>

              {/* Past Consultations Glance */}
              {pastPrescriptions.length > 0 && (
                <div className="p-4 rounded-xl bg-white border border-[var(--hl)] shadow-xs space-y-2 flex-1 overflow-y-auto">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--s2)] border-b border-[var(--hl)]/60 pb-1.5">
                    Past Rx History
                  </div>
                  <div className="divide-y divide-[var(--hl)]/40 text-xs space-y-2">
                    {pastPrescriptions.slice(-3).reverse().map((r) => (
                      <div key={r.id} className="pt-2">
                        <div className="flex justify-between font-semibold text-[var(--ink)]">
                          <span>{r.no}</span>
                          <span className="text-[var(--s2)]">{formatDate(r.t)}</span>
                        </div>
                        <div className="text-[11px] text-[var(--s2)] mt-0.5 truncate">
                          {r.items.map((x) => x.name).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Pane: Clinical Encounter & Orders Desk (70% Width) */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white p-4 sm:p-6 space-y-4">
              {/* Section 1: Clinical Diagnosis & Assessment */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                    Clinical Diagnosis & Treatment Notes
                  </label>
                  <span className="text-[11px] text-[var(--s2)]">
                    Ayurvedic diagnosis, Rogi/Roga Pariksha, diet advice
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={activeConsultation.notes}
                  onChange={(e) =>
                    updateActiveConsultation((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Record symptoms, Dosha assessment, diagnosis, Pathya/Apathya (dietary/lifestyle) advice..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[var(--hl)] rounded-xl bg-white text-[var(--ink)] placeholder:text-[var(--s2)]/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all"
                />
              </div>

              {/* Section 2: Prescription Order Entry Bar */}
              <div className="space-y-2.5 flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                      Prescription & Treatment Orders
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--sage)]/70 text-[var(--ac)]">
                      {activeConsultation.items.length} items
                    </span>
                  </div>

                  {/* Category Switcher */}
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--sf)]/80 text-xs">
                    {(['all', 'medicine', 'treatment'] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setCategoryFilter(filter)}
                        className={`px-2.5 py-0.5 rounded-md capitalize font-medium transition-all ${
                          categoryFilter === filter
                            ? 'bg-white text-[var(--ac)] shadow-xs font-semibold'
                            : 'text-[var(--s2)] hover:text-[var(--ink)]'
                        }`}
                      >
                        {filter === 'all' ? 'All Items' : `${filter}s`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sleek Autocomplete Order Input */}
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
                      placeholder="Search catalogue to prescribe (press Enter to add, or type 'Ashwagandha x2')..."
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] placeholder:text-[var(--s2)]/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all"
                    />
                  </div>

                  {/* Autocomplete Dropdown */}
                  {isSearchFocused && (
                    <div
                      onMouseDown={(e) => e.preventDefault()}
                      className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-64 overflow-y-auto bg-white border border-[var(--hl)]/60 rounded-xl shadow-xl p-1 text-xs"
                    >
                      {filteredCatalog.length === 0 ? (
                        <div className="p-3 text-center text-[var(--s2)]">
                          No matching item found in catalogue.
                        </div>
                      ) : (
                        filteredCatalog.map((item, k) => {
                          const available = getAvailableStock(item);
                          const isHighlighted = k === highlightedIndex;

                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                addItemToPrescription(item, multiplier);
                                setIsSearchFocused(false);
                              }}
                              onMouseEnter={() => setHighlightedIndex(k)}
                              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                isHighlighted
                                  ? 'bg-[var(--sage)] text-[var(--ac)] font-medium'
                                  : 'hover:bg-[var(--sf)] text-[var(--ink)]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavoriteItem(item.id);
                                  }}
                                  className="p-1 text-[var(--brass)] hover:scale-110"
                                >
                                  <Star
                                    className={`w-3.5 h-3.5 ${
                                      item.fav ? 'fill-[var(--brass)] text-[var(--brass)]' : 'text-[var(--s2)]'
                                    }`}
                                  />
                                </button>
                                <span>{item.name}</span>
                                <span className="text-[10px] capitalize px-1 py-0.2 rounded bg-white/80 border border-[var(--hl)]">
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
                                    }`}
                                  >
                                    {available <= 0 ? 'Out of stock' : `${available} in stock`}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div className="p-1.5 text-[11px] text-[var(--s2)] border-t border-[var(--hl)] mt-1 flex justify-between">
                        <span>Use ↑ ↓ to navigate · Enter to add</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsSearchFocused(false);
                          }}
                          className="underline hover:text-[var(--ink)]"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Prescribed Items Table / List - Clean Unified Canvas */}
                <div className="flex-1 overflow-y-auto rounded-xl border border-[var(--hl)]/40 bg-white divide-y divide-[var(--hl)]/30">
                  {activeConsultation.items.length === 0 ? (
                    <div className="h-44 flex flex-col items-center justify-center text-xs text-[var(--s2)] space-y-1">
                      <span>No medicines or treatments prescribed yet.</span>
                      <span className="text-[11px] text-[var(--s2)]/70">
                        Use the search bar above or choose a Protocol template to add items.
                      </span>
                    </div>
                  ) : (
                    activeConsultation.items.map((item, idx) => {
                      const invItem = state.inv.find((i) => i.id === item.iid);
                      const available = invItem ? getAvailableStock(invItem) : Infinity;
                      const isShort = invItem?.stock !== null && item.qty > available;
                      const isAllergyConflict = checkAllergyMatch(patient?.allergies || '', item.name);

                      return (
                        <div
                          key={`${item.iid}-${idx}`}
                          className="p-3.5 hover:bg-[var(--sf)]/20 transition-colors space-y-2 text-xs"
                        >
                          {/* Row 1: Item Identity & Quantity Stepper */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-[var(--ink)] text-sm">
                                {item.name}
                              </span>
                              <span className="text-[10px] capitalize px-1.5 py-0.5 rounded bg-[var(--sage)]/70 text-[var(--ac)] font-medium">
                                {item.type}
                              </span>
                              <span className="text-xs text-[var(--s2)] font-medium">
                                · {formatMoney(item.price)} each
                              </span>
                              {isShort && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--err-bg)] text-[var(--err)] font-bold">
                                  Only {available} in stock
                                </span>
                              )}
                              {isAllergyConflict && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--err)] text-white font-bold">
                                  Allergy Warning
                                </span>
                              )}
                            </div>

                            {/* Tactile Capsule Stepper & Delete */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-[var(--s2)] hidden sm:inline">Total Qty:</span>
                              <div className="flex items-center bg-white rounded-lg p-0.5 border border-[var(--hl)] shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (item.qty > 1) {
                                      updateItemAndAutoCalculate(idx, 'qty', item.qty - 1);
                                    }
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded text-[var(--s2)] hover:text-[var(--ink)] hover:bg-white transition-colors"
                                  title="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.qty}
                                  onChange={(e) => {
                                    const val = Math.max(1, parseInt(e.target.value) || 1);
                                    updateItemAndAutoCalculate(idx, 'qty', val);
                                  }}
                                  className="w-10 text-center font-bold bg-transparent text-[var(--ink)] text-xs border-0 focus:outline-none focus:ring-1 focus:ring-[var(--ac)] rounded p-0"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateItemAndAutoCalculate(idx, 'qty', item.qty + 1)}
                                  className="w-6 h-6 flex items-center justify-center rounded text-[var(--s2)] hover:text-[var(--ink)] hover:bg-white transition-colors"
                                  title="Increase quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  updateActiveConsultation((prev) => ({
                                    ...prev,
                                    items: prev.items.filter((_, i) => i !== idx),
                                  }));
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--s2)]/60 hover:text-[var(--err)] hover:bg-[var(--err-bg)]/40 transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Row 2: Dosage Schedule Fields - Recessed Tray with Crisp White Inputs */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1.5 rounded-xl bg-[var(--sf)]/80 border border-[var(--hl)]/50">
                            {item.type === 'medicine' ? (
                              <>
                                <input
                                  type="text"
                                  placeholder="Dose (e.g. 1 tab, 15ml)"
                                  value={item.dq || ''}
                                  onChange={(e) =>
                                    updateItemAndAutoCalculate(idx, 'dq', e.target.value)
                                  }
                                  className="px-2.5 py-1.5 text-xs bg-white border border-[var(--hl)] rounded-lg text-[var(--ink)] placeholder:text-[var(--s2)]/60 shadow-2xs focus:outline-none focus:ring-1 focus:ring-[var(--ac)] focus:border-[var(--ac)] transition-all"
                                />
                                <div className="relative">
                                  <select
                                    value={item.fr || ''}
                                    onChange={(e) =>
                                      updateItemAndAutoCalculate(idx, 'fr', e.target.value)
                                    }
                                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[var(--hl)] rounded-lg text-[var(--ink)] shadow-2xs focus:outline-none focus:ring-1 focus:ring-[var(--ac)] focus:border-[var(--ac)] transition-all cursor-pointer appearance-none pr-5"
                                  >
                                    {FREQUENCY_OPTIONS.map((f, i) => (
                                      <option key={f} value={i === 0 ? '' : f}>
                                        {f}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown className="w-3 h-3 text-[var(--s2)]/60 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                                <div className="relative">
                                  <select
                                    value={item.tm || ''}
                                    onChange={(e) =>
                                      updateItemAndAutoCalculate(idx, 'tm', e.target.value)
                                    }
                                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[var(--hl)] rounded-lg text-[var(--ink)] shadow-2xs focus:outline-none focus:ring-1 focus:ring-[var(--ac)] focus:border-[var(--ac)] transition-all cursor-pointer appearance-none pr-5"
                                  >
                                    {TIMING_OPTIONS.map((tm, i) => (
                                      <option key={tm} value={i === 0 ? '' : tm}>
                                        {tm}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown className="w-3 h-3 text-[var(--s2)]/60 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                              </>
                            ) : (
                              <div className="col-span-3 text-xs text-[var(--s2)] font-medium italic flex items-center px-2.5">
                                Therapy session protocol
                              </div>
                            )}

                            <input
                              type="number"
                              min="1"
                              placeholder="Days"
                              value={item.days || ''}
                              onChange={(e) =>
                                updateItemAndAutoCalculate(idx, 'days', e.target.value)
                              }
                              className="px-2.5 py-1.5 text-xs bg-white border border-[var(--hl)] rounded-lg text-[var(--ink)] placeholder:text-[var(--s2)]/60 shadow-2xs focus:outline-none focus:ring-1 focus:ring-[var(--ac)] focus:border-[var(--ac)] transition-all"
                            />
                            <input
                              type="text"
                              placeholder="Instructions (e.g. with warm water)..."
                              value={item.nt || ''}
                              onChange={(e) => updateItemAndAutoCalculate(idx, 'nt', e.target.value)}
                              className="px-2.5 py-1.5 text-xs bg-white border border-[var(--hl)] rounded-lg text-[var(--ink)] placeholder:text-[var(--s2)]/60 shadow-2xs focus:outline-none focus:ring-1 focus:ring-[var(--ac)] focus:border-[var(--ac)] transition-all col-span-2 sm:col-span-1"
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Bottom Encounter Status Strip */}
              <div className="flex items-center justify-between text-xs text-[var(--s2)] pt-2.5 border-t border-[var(--hl)]/40 shrink-0">
                <div className="flex items-center gap-3">
                  <span>
                    Total: <strong className="text-[var(--ink)]">{activeConsultation.items.length} items</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Est. Value: <strong className="text-[var(--ac)]">{formatMoney(estimatedTotal)}</strong>
                  </span>
                  {activeConsultation.fu && (
                    <>
                      <span>·</span>
                      <span>Next Visit: <strong className="text-[var(--ink)]">{formatDate(activeConsultation.fu)}</strong></span>
                    </>
                  )}
                </div>
                <div className="text-[11px] text-[var(--s2)]/70 hidden sm:block">
                  Press <strong>Enter</strong> in search to add · <strong>Ctrl+Enter</strong> to save prescription
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Template Prompt Modal */}
      <PromptModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Save Protocol as Template"
        description="Save these medications, dosages, and durations to quickly reuse in future consultations."
        placeholder="e.g. Knee Osteoarthritis 21-Day Protocol"
        confirmLabel="Save Template"
        onConfirm={(name) => saveCurrentAsTemplate(name)}
      />
    </>
  );
}
