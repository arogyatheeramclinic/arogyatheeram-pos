'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { X, Calendar } from 'lucide-react';
import { getTodayDate, formatDate } from '@/lib/utils';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPatientId?: string;
  defaultDate?: string;
  refRxId?: string;
}

export default function AppointmentModal({
  isOpen,
  onClose,
  defaultPatientId,
  defaultDate,
  refRxId,
}: AppointmentModalProps) {
  const { state, bookAppointment } = useClinic();

  const registeredPatients = state.pts.filter((p) => p.id !== 'PW');
  const [patientId, setPatientId] = useState(defaultPatientId || registeredPatients[0]?.id || '');
  const [date, setDate] = useState(defaultDate || getTodayDate());
  const [time, setTime] = useState('10:00');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const setPresetDate = (daysAhead: number) => {
    const d = new Date(Date.now() + daysAhead * 86400000);
    setDate(d.toLocaleDateString('en-CA'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !date) return;
    bookAppointment(patientId, date, time, note.trim(), refRxId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[var(--ink)]/40 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-[var(--sf)] border border-[var(--hl)] rounded-2xl shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 my-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--hl)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--sage)]/70 text-[var(--ac)] border border-[var(--ac)]/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-serif text-[var(--ink)]">
                Schedule Consultation
              </h3>
              <p className="text-xs text-[var(--s2)] mt-0.5">
                Reserve patient appointment slot in doctor's daily calendar
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
            {/* Left Column: Patient & Purpose */}
            <div className="p-4 rounded-xl bg-white border border-[var(--hl)]/50 shadow-xs space-y-3.5">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] border-b border-[var(--hl)]/40 pb-2">
                Patient & Case Details
              </div>

              <div>
                <label className="block font-semibold text-[var(--ink)] mb-1">
                  Select Patient *
                </label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all cursor-pointer"
                >
                  {registeredPatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--ink)] mb-1">
                  Clinical Purpose / Visit Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Follow-up Check, Panchakarma review"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] placeholder:text-[var(--s2)]/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all"
                />
              </div>
            </div>

            {/* Right Column: Date & Time Schedule */}
            <div className="p-4 rounded-xl bg-white border border-[var(--hl)]/50 shadow-xs space-y-3.5">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] border-b border-[var(--hl)]/40 pb-2 flex items-center justify-between">
                <span>Date & Timing</span>
                {date && (
                  <span className="text-[11px] font-semibold text-[var(--ac)]">
                    {formatDate(new Date(date).getTime())}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-[var(--ink)]">
                    Appointment Date *
                  </label>
                  {/* Quick Preset Date Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPresetDate(0)}
                      className="px-2 py-0.5 rounded text-[11px] bg-[var(--sf)] border border-[var(--hl)] text-[var(--s2)] hover:bg-[var(--sage)] hover:text-[var(--ac)] font-medium transition-colors cursor-pointer"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetDate(1)}
                      className="px-2 py-0.5 rounded text-[11px] bg-[var(--sf)] border border-[var(--hl)] text-[var(--s2)] hover:bg-[var(--sage)] hover:text-[var(--ac)] font-medium transition-colors cursor-pointer"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetDate(7)}
                      className="px-2 py-0.5 rounded text-[11px] bg-[var(--sf)] border border-[var(--hl)] text-[var(--s2)] hover:bg-[var(--sage)] hover:text-[var(--ac)] font-medium transition-colors cursor-pointer"
                    >
                      +1 Wk
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  min={getTodayDate()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--ink)] mb-1">
                  Time Slot *
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] font-bold shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all cursor-pointer"
                />
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
              Confirm Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
