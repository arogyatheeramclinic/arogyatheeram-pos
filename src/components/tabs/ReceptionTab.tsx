'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import {
  formatDateTime,
  formatDate,
  formatMoney,
  getTodayDate,
} from '@/lib/utils';
import {
  Search,
  UserPlus,
  ShoppingBag,
  Clock,
  Receipt,
  Calendar,
  CreditCard,
  UserCheck,
  XCircle,
  AlertTriangle,
  Printer,
  X,
  Check,
} from 'lucide-react';
import AppointmentModal from '../modals/AppointmentModal';
import PromptModal from '../modals/PromptModal';

export default function ReceptionTab() {
  const {
    state,
    registerPatient,
    checkInPatient,
    toggleVisitUrgent,
    cancelVisit,
    startBillingSession,
    recordPayment,
    updateAppointmentStatus,
    dismissFollowUp,
    triggerPrint,
    getPatient,
  } = useClinic();

  // Search & registration state
  const [patientSearch, setPatientSearch] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('Female');
  const [allergies, setAllergies] = useState('');
  const [cond, setCond] = useState('');
  const [autoCheckIn, setAutoCheckIn] = useState(true);
  const [isUrgentNewPatient, setIsUrgentNewPatient] = useState(false);
  const [isUrgentSearchCheckin, setIsUrgentSearchCheckin] = useState(false);

  // Tab switch for right-column secondary card: 'appointments' | 'unpaid'
  const [rightSubTab, setRightSubTab] = useState<'appointments' | 'unpaid'>('appointments');

  // Modals state
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [appointmentModalParams, setAppointmentModalParams] = useState<{
    patientId?: string;
    date?: string;
    refRxId?: string;
  }>({});

  const [cancelVisitId, setCancelVisitId] = useState<string | null>(null);

  // Active payment settlement modal state
  const [settleInvoiceId, setSettleInvoiceId] = useState<string | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMethod, setSettleMethod] = useState('Cash');
  const [settleRef, setSettleRef] = useState('');

  // Filter existing patients for check-in autocomplete
  const cleanQuery = patientSearch.trim().toLowerCase();
  const matchedPatients = cleanQuery.length >= 2
    ? state.pts
        .filter(
          (p) =>
            p.id !== 'PW' &&
            (p.name.toLowerCase().includes(cleanQuery) || p.phone.includes(cleanQuery))
        )
        .slice(0, 5)
    : [];

  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2 || phone.replace(/\D/g, '').length < 8) return;
    const newPt = registerPatient({
      name: name.trim(),
      phone: phone.trim(),
      age: age ? parseInt(age) : '',
      sex,
      allergies: allergies.trim(),
      cond: cond.trim(),
    });

    if (autoCheckIn) {
      checkInPatient(newPt.id, isUrgentNewPatient);
    }

    // Reset form & close modal
    setName('');
    setPhone('');
    setAge('');
    setAllergies('');
    setCond('');
    setIsUrgentNewPatient(false);
    setIsRegisterModalOpen(false);
  };

  // Waiting Room Queue
  const waitingVisits = state.vis
    .filter((v) => v.st !== 'done' && !v.cancelled)
    .sort((a, b) => (b.urg ? 1 : 0) - (a.urg ? 1 : 0) || a.t - b.t);

  // Prescriptions ready for billing
  const readyPrescriptions = state.rx.filter(
    (r) => !state.invs.some((i) => i.rxid === r.id && !i.void)
  );

  // Outstanding Unpaid Invoices
  const outstandingInvoices = state.invs.filter((i) => !i.void && i.paid < i.total);
  const totalUnpaidAmount = outstandingInvoices.reduce((acc, i) => acc + (i.total - i.paid), 0);

  // Appointments
  const today = getTodayDate();
  const nextThreeDays = new Date(Date.now() + 3 * 86400000).toLocaleDateString('en-CA');
  const todayAppointments = state.ap
    .filter((a) => a.date === today && a.st === 'booked')
    .sort((a, b) => a.time.localeCompare(b.time));

  const dueFollowUps = state.rx
    .filter(
      (r) =>
        r.fu &&
        !r.fud &&
        r.fu <= nextThreeDays &&
        !state.vis.some((v) => v.pid === r.pid && v.t > r.t && !v.cancelled)
    )
    .sort((a, b) => (a.fu || '').localeCompare(b.fu || ''));

  const invoiceToSettle = settleInvoiceId
    ? state.invs.find((i) => i.id === settleInvoiceId)
    : null;

  const handleOpenSettle = (invId: string) => {
    const inv = state.invs.find((i) => i.id === invId);
    if (!inv) return;
    const balance = inv.total - inv.paid;
    setSettleInvoiceId(invId);
    setSettleAmount(balance.toString());
    setSettleMethod('Cash');
    setSettleRef('');
  };

  const handleConfirmSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleInvoiceId) return;
    const amt = parseFloat(settleAmount);
    if (amt > 0) {
      recordPayment(settleInvoiceId, amt, settleMethod, settleRef);
      setSettleInvoiceId(null);
    }
  };

  return (
    <div className=\"space-y-5\">
      {/* Top Situational Awareness Bar & Action Shortcuts */}
      <div className=\"p-3 sm:p-4 rounded-xl bg-[var(--sf-card)] border border-[var(--hl)]/40 shadow-xs flex flex-wrap items-center justify-between gap-3\">
        {/* Metric Counter Pills - Clean borderless chips */}
        <div className=\"flex flex-wrap items-center gap-2\">
          <div className=\"flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--sf)]/80 text-xs font-medium text-[var(--ink)]\">
            <span className=\"w-2 h-2 rounded-full bg-[var(--ac)]\" />
            <span className=\"font-bold\">{waitingVisits.length}</span>
            <span className=\"text-[var(--s2)]\">In Waiting Room</span>
          </div>

          <div className=\"flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--sf)]/80 text-xs font-medium text-[var(--ink)]\">
            <span className=\"w-2 h-2 rounded-full bg-[var(--brass)]\" />
            <span className=\"font-bold\">{readyPrescriptions.length}</span>
            <span className=\"text-[var(--s2)]\">Ready for Billing</span>
          </div>

          <div className=\"flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--sf)]/80 text-xs font-medium text-[var(--ink)]\">
            <span className=\"w-2 h-2 rounded-full bg-blue-600\" />
            <span className=\"font-bold\">{todayAppointments.length}</span>
            <span className=\"text-[var(--s2)]\">Appointments Today</span>
          </div>

          {totalUnpaidAmount > 0 && (
            <div className=\"flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--err-bg)] text-xs font-medium text-[var(--err)]\">
              <span className=\"font-bold\">{formatMoney(totalUnpaidAmount)}</span>
              <span>Unpaid Balances</span>
            </div>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className=\"flex items-center gap-2.5\">
          <button
            type=\"button\"
            onClick={() => setIsRegisterModalOpen(true)}
            className=\"flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--ac)] text-white text-xs font-semibold hover:bg-[var(--ac-hover)] transition-colors shadow-xs\"
          >
            <UserPlus className=\"w-4 h-4\" />
            <span>Register New Patient</span>
          </button>

          <button
            type=\"button\"
            onClick={() => startBillingSession(null, 'PW')}
            className=\"flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--sf)]/80 text-[var(--ink)] text-xs font-semibold hover:bg-[var(--sage)] transition-colors shadow-xs\"
          >
            <ShoppingBag className=\"w-4 h-4 text-[var(--ac)]\" />
            <span>Walk-in Direct Sale</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Operational Grid */}
      <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-5 items-start\">
        {/* Column 1: Intake Search & Waiting Room Queue */}
        <div className=\"space-y-5\">
          {/* Patient Quick Check-In Card */}
          <div className=\"p-4 sm:p-5 rounded-xl bg-[var(--sf-card)] border border-[var(--hl)]/40 shadow-xs\">
            <div className=\"flex items-center justify-between pb-3 border-b border-[var(--hl)]/40\">
              <h3 className=\"text-sm sm:text-base font-semibold font-serif text-[var(--ink)]\">
                Patient Search & Check-In
              </h3>
              <label className=\"flex items-center gap-1.5 text-xs text-[var(--err)] font-medium cursor-pointer\">
                <input
                  type=\"checkbox\"
                  checked={isUrgentSearchCheckin}
                  onChange={(e) => setIsUrgentSearchCheckin(e.target.checked)}
                  className=\"rounded border-[var(--hl)] text-[var(--err)] focus:ring-[var(--err)]\"
                />
                <span>High Priority Check-In</span>
              </label>
            </div>

            <div className=\"mt-3\">
              <div className=\"relative\">
                <Search className=\"w-4 h-4 text-[var(--s2)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none\" />
                <input
                  type=\"text\"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setPatientSearch('');
                  }}
                  placeholder=\"Search registered patient by name or phone...\"
                  className=\"w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] placeholder:text-[var(--s2)]/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all\"
                />
              </div>

              {/* Autocomplete Dropdown Search Results */}
              {cleanQuery.length >= 2 && (
                <div className=\"mt-2 divide-y divide-[var(--hl)]/60 border border-[var(--hl)] rounded-lg bg-white overflow-hidden shadow-sm\">
                  {matchedPatients.length === 0 ? (
                    <div className=\"p-3 text-xs text-[var(--s2)] flex items-center justify-between\">
                      <span>No existing record found for \"{patientSearch}\".</span>
                      <button
                        type=\"button\"
                        onClick={() => {
                          setName(patientSearch);
                          setIsRegisterModalOpen(true);
                        }}
                        className=\"text-[var(--ac)] font-semibold hover:underline\"
                      >
                        Register Patient
                      </button>
                    </div>
                  ) : (
                    matchedPatients.map((p) => {
                      const lastVisit = state.vis
                        .filter((v) => v.pid === p.id && !v.cancelled)
                        .pop();

                      return (
                        <div
                          key={p.id}
                          className=\"flex items-center justify-between p-2.5 hover:bg-[var(--sf)] transition-colors text-xs\"
                        >
                          <div>
                            <span className=\"font-semibold text-[var(--ink)]\">{p.name}</span>
                            <span className=\"text-[var(--s2)] ml-2\">
                              {p.phone} · {[p.age ? `${p.age} yrs` : '', p.sex].filter(Boolean).join(', ')}
                            </span>
                            {lastVisit && (
                              <div className=\"text-[11px] text-[var(--s2)] mt-0.5\">
                                Last visit: {formatDate(lastVisit.t)}
                              </div>
                            )}
                          </div>
                          <button
                            type=\"button\"
                            onClick={() => {
                              checkInPatient(p.id, isUrgentSearchCheckin);
                              setPatientSearch('');
                              setIsUrgentSearchCheckin(false);
                            }}
                            className=\"px-3 py-1.5 rounded-md bg-[var(--ac)] text-white text-xs font-semibold hover:bg-[var(--ac-hover)] transition-colors\"
                          >
                            Check In
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Live Waiting Room Queue Card */}
          <div className=\"p-4 sm:p-5 rounded-xl bg-[var(--sf-card)] border border-[var(--hl)]/40 shadow-xs\">
            <div className=\"flex items-center justify-between pb-3 border-b border-[var(--hl)]/40\">
              <div className=\"flex items-center gap-2\">
                <Clock className=\"w-4 h-4 text-[var(--ac)]\" />
                <h3 className=\"text-sm sm:text-base font-semibold font-serif text-[var(--ink)]\">
                  Live Waiting Room Queue
                </h3>
              </div>
              <span className=\"text-xs px-2.5 py-0.5 rounded-full bg-[var(--sage)]/70 text-[var(--ac)] font-bold\">
                {waitingVisits.length} in clinic
              </span>
            </div>

            <div className=\"mt-3 divide-y divide-[var(--hl)]/30 max-h-[460px] overflow-y-auto\">
              {waitingVisits.length === 0 ? (
                <div className=\"p-8 text-center text-xs sm:text-sm text-[var(--s2)]\">
                  Waiting room is currently empty.
                </div>
              ) : (
                waitingVisits.map((visit) => {
                  const patient = getPatient(visit.pid);
                  const isUrgent = !!visit.urg;
                  const isWithDoctor = visit.st === 'consulting';

                  return (
                    <div
                      key={visit.id}
                      className=\"py-3 flex items-center justify-between gap-3 text-xs sm:text-sm hover:bg-[var(--sf)]/20 px-1 rounded transition-colors\"
                    >
                      <div className=\"flex items-start gap-3\">
                        {/* High-Visibility Token Badge */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                            isUrgent
                              ? 'bg-[var(--err-bg)] text-[var(--err)] border-[var(--err)]/30'
                              : isWithDoctor
                              ? 'bg-[var(--sage)] text-[var(--ac)] border-[var(--ac)]/30'
                              : 'bg-[var(--sf)] text-[var(--ink)] border-[var(--hl)]/30'
                          }`}
                        >
                          #{visit.tk ?? '–'}
                        </div>

                        <div>
                          <div className=\"flex items-center gap-2 flex-wrap\">
                            <span className=\"font-bold text-[var(--ink)]\">
                              {patient?.name || 'Patient'}
                            </span>
                            {isUrgent && (
                              <span className=\"text-[10px] px-1.5 py-0.5 rounded bg-[var(--err-bg)] text-[var(--err)] font-bold flex items-center gap-1\">
                                <AlertTriangle className=\"w-3 h-3\" />
                                High Priority
                              </span>
                            )}
                          </div>
                          <div className=\"text-xs text-[var(--s2)] mt-0.5\">
                            {isWithDoctor ? (
                              <span className=\"text-[var(--ac)] font-semibold flex items-center gap-1.5\">
                                <span className=\"w-2 h-2 rounded-full bg-[var(--ac)] animate-pulse\" />
                                In consultation with Doctor
                              </span>
                            ) : (
                              `Waiting since ${formatDateTime(visit.t)}`
                            )}
                          </div>
                        </div>
                      </div>

                      {!isWithDoctor && (
                        <div className=\"flex items-center gap-1.5 shrink-0\">
                          <button
                            type=\"button\"
                            onClick={() => toggleVisitUrgent(visit.id)}
                            className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                              isUrgent
                                ? 'border-[var(--hl)]/30 bg-white text-[var(--s2)] hover:bg-[var(--sf)]'
                                : 'border-[var(--err)]/30 bg-[var(--err-bg)]/50 text-[var(--err)] hover:bg-[var(--err-bg)] font-medium'
                            }`}
                          >
                            {isUrgent ? 'Set as Normal' : 'Move to Top'}
                          </button>
                          <button
                            type=\"button\"
                            onClick={() => setCancelVisitId(visit.id)}
                            className=\"px-2 py-1 text-xs rounded-md border border-[var(--hl)]/30 bg-white text-[var(--s2)] hover:text-[var(--err)] hover:border-[var(--err)]/40 transition-colors\"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Billing Checkout & Appointments / Balances */}
        <div className=\"space-y-5\">
          {/* Card A: Prescriptions Ready for Billing */}
          <div className=\"p-4 sm:p-5 rounded-xl bg-[var(--sf-card)] border border-[var(--hl)]/40 shadow-xs\">
            <div className=\"flex items-center justify-between pb-3 border-b border-[var(--hl)]/40\">
              <div className=\"flex items-center gap-2\">
                <Receipt className=\"w-4 h-4 text-[var(--ac)]\" />
                <h3 className=\"text-sm sm:text-base font-semibold font-serif text-[var(--ink)]\">
                  Prescriptions Ready for Billing
                </h3>
              </div>
              <span className=\"text-xs px-2 py-0.5 rounded-full bg-[var(--sage)]/70 text-[var(--ac)] font-bold\">
                {readyPrescriptions.length} pending
              </span>
            </div>

            <div className=\"mt-3 divide-y divide-[var(--hl)]/30 max-h-56 overflow-y-auto\">
              {readyPrescriptions.length === 0 ? (
                <div className=\"p-6 text-center text-xs sm:text-sm text-[var(--s2)]\">
                  No completed prescriptions awaiting billing right now.
                </div>
              ) : (
                readyPrescriptions.map((rx) => {
                  const patient = getPatient(rx.pid);

                  return (
                    <div
                      key={rx.id}
                      className=\"py-3 flex items-center justify-between gap-3 text-xs sm:text-sm\"
                    >
                      <div>
                        <div className=\"flex items-center gap-1.5\">
                          <span className=\"font-bold text-[var(--ink)]\">
                            {patient?.name || 'Patient'}
                          </span>
                          <span className=\"text-[11px] text-[var(--s2)]\">({rx.no})</span>
                        </div>
                        <div className=\"text-[11px] text-[var(--s2)] mt-0.5\">
                          {rx.items.length} items · {formatDateTime(rx.t)}
                        </div>
                      </div>

                      <div className=\"flex items-center gap-1.5\">
                        <button
                          type=\"button\"
                          onClick={() => triggerPrint('rx', rx.id)}
                          className=\"px-2.5 py-1 text-xs rounded border border-[var(--hl)] bg-white text-[var(--s2)] hover:bg-[var(--sf)] flex items-center gap-1\"
                          title=\"Print prescription copy\"
                        >
                          <Printer className=\"w-3 h-3\" />
                          <span>Print</span>
                        </button>
                        <button
                          type=\"button\"
                          onClick={() => startBillingSession(rx.id, rx.pid)}
                          className=\"px-3 py-1 text-xs rounded bg-[var(--ac)] text-white font-semibold hover:bg-[var(--ac-hover)] transition-colors shadow-xs\"
                        >
                          Generate Invoice
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Card B: Tabbed Appointments & Unpaid Balances */}
          <div className=\"p-4 sm:p-5 rounded-xl bg-[var(--sf-card)] border border-[var(--hl)]/40 shadow-xs\">
            {/* Tab Selector Header */}
            <div className=\"flex items-center justify-between pb-3 border-b border-[var(--hl)]/40\">
              <div className=\"flex items-center gap-1 p-0.5 rounded-lg bg-[var(--sf)]/80 text-xs\">
                <button
                  type=\"button\"
                  onClick={() => setRightSubTab('appointments')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    rightSubTab === 'appointments'
                      ? 'bg-white text-[var(--ac)] shadow-xs'
                      : 'text-[var(--s2)] hover:text-[var(--ink)]'
                  }`}
                >
                  Appointments ({todayAppointments.length})
                </button>
                <button
                  type=\"button\"
                  onClick={() => setRightSubTab('unpaid')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    rightSubTab === 'unpaid'
                      ? 'bg-white text-[var(--ac)] shadow-xs'
                      : 'text-[var(--s2)] hover:text-[var(--ink)]'
                  }`}
                >
                  Unpaid Balances ({outstandingInvoices.length})
                </button>
              </div>

              {rightSubTab === 'appointments' && (
                <button
                  type=\"button\"
                  onClick={() => {
                    setAppointmentModalParams({});
                    setIsAppointmentModalOpen(true);
                  }}
                  className=\"text-xs text-[var(--ac)] font-semibold hover:underline\"
                >
                  + Book New
                </button>
              )}
            </div>

            {/* Sub-tab 1: Appointments & Follow-ups */}
            {rightSubTab === 'appointments' && (
              <div className=\"mt-3 space-y-3 max-h-72 overflow-y-auto text-xs sm:text-sm\">
                <div>
                  <div className=\"text-[11px] font-bold uppercase tracking-wider text-[var(--s2)] mb-1.5\">
                    Today's Schedule
                  </div>
                  {todayAppointments.length === 0 ? (
                    <div className=\"text-xs text-[var(--s2)] italic py-1\">
                      No appointments booked for today.
                    </div>
                  ) : (
                    <div className=\"divide-y divide-[var(--hl)]/50\">
                      {todayAppointments.map((apt) => {
                        const patient = getPatient(apt.pid);
                        return (
                          <div key={apt.id} className=\"py-2 flex items-center justify-between gap-2\">
                            <div>
                              <span className=\"font-bold text-[var(--ac)]\">{apt.time}</span>
                              <span className=\"ml-2 font-medium\">{patient?.name}</span>
                              {apt.note && (
                                <span className=\"text-[var(--s2)] ml-1\">· {apt.note}</span>
                              )}
                            </div>
                            <div className=\"flex items-center gap-1.5\">
                              <button
                                type=\"button\"
                                onClick={() => updateAppointmentStatus(apt.id, 'arrived')}
                                className=\"px-2 py-0.5 rounded bg-[var(--sage)] text-[var(--ac)] hover:bg-[var(--ac)] hover:text-white font-medium text-xs transition-colors flex items-center gap-1\"
                              >
                                <UserCheck className=\"w-3.5 h-3.5\" />
                                <span>Arrived</span>
                              </button>
                              <button
                                type=\"button\"
                                onClick={() => updateAppointmentStatus(apt.id, 'noshow')}
                                className=\"p-1 rounded text-[var(--s2)] hover:text-[var(--err)]\"
                                title=\"Mark no-show\"
                              >
                                <XCircle className=\"w-4 h-4\" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {dueFollowUps.length > 0 && (
                  <div className=\"pt-2 border-t border-[var(--hl)]\">
                    <div className=\"text-[11px] font-bold uppercase tracking-wider text-[var(--s2)] mb-1.5\">
                      Follow-ups Due (Next 3 Days)
                    </div>
                    <div className=\"divide-y divide-[var(--hl)]/50\">
                      {dueFollowUps.map((rx) => {
                        const patient = getPatient(rx.pid);
                        const isOverdue = rx.fu && rx.fu < today;

                        return (
                          <div key={rx.id} className=\"py-1.5 flex items-center justify-between gap-2\">
                            <div>
                              <span className=\"font-medium\">{patient?.name}</span>
                              <span className=\"text-xs text-[var(--s2)] ml-2\">
                                Due {formatDate(rx.fu!)}
                              </span>
                              {isOverdue && (
                                <span className=\"text-[10px] ml-1.5 px-1 rounded bg-[var(--err-bg)] text-[var(--err)] font-bold\">
                                  Overdue
                                </span>
                              )}
                            </div>
                            <div className=\"flex items-center gap-1\">
                              <button
                                type=\"button\"
                                onClick={() => {
                                  setAppointmentModalParams({
                                    patientId: rx.pid,
                                    date: rx.fu,
                                    refRxId: rx.id,
                                  });
                                  setIsAppointmentModalOpen(true);
                                }}
                                className=\"px-2 py-0.5 text-xs rounded bg-[var(--sf)] border border-[var(--hl)] text-[var(--ac)] font-medium hover:bg-[var(--sage)]\"
                              >
                                Book
                              </button>
                              <button
                                type=\"button\"
                                onClick={() => dismissFollowUp(rx.id)}
                                className=\"px-1.5 py-0.5 text-xs text-[var(--s2)] hover:text-[var(--err)]\"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab 2: Unpaid Balances List */}
            {rightSubTab === 'unpaid' && (
              <div className=\"mt-3 divide-y divide-[var(--hl)]/50 max-h-72 overflow-y-auto text-xs sm:text-sm\">
                {outstandingInvoices.length === 0 ? (
                  <div className=\"p-6 text-center text-xs text-[var(--s2)]\">
                    Zero unpaid balances! All patient bills are settled.
                  </div>
                ) : (
                  outstandingInvoices.map((inv) => {
                    const patient = getPatient(inv.pid);
                    const balance = inv.total - inv.paid;

                    return (
                      <div
                        key={inv.id}
                        className=\"py-2.5 flex items-center justify-between gap-2\"
                      >
                        <div>
                          <div className=\"font-semibold text-[var(--ink)]\">
                            {patient?.name || 'Patient'}
                          </div>
                          <div className=\"text-[11px] text-[var(--s2)]\">
                            {inv.id} · Total: {formatMoney(inv.total)} · Paid: {formatMoney(inv.paid)}
                          </div>
                        </div>

                        <div className=\"flex items-center gap-3 shrink-0\">
                          <span className=\"font-bold text-[var(--err)] text-xs sm:text-sm\">
                            {formatMoney(balance)}
                          </span>
                          <button
                            type=\"button\"
                            onClick={() => handleOpenSettle(inv.id)}
                            className=\"px-2.5 py-1 text-xs rounded-md bg-[var(--ac)] text-white font-medium hover:bg-[var(--ac-hover)] transition-colors shadow-xs\"
                          >
                            Collect
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Register New Patient Modal - Spacious Real-Estate */}
      {isRegisterModalOpen && (
        <div className=\"fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[var(--ink)]/40 backdrop-blur-xs overflow-y-auto\">
          <div className=\"w-full max-w-3xl bg-[var(--sf)] border border-[var(--hl)] rounded-2xl shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 my-auto\">
            {/* Header */}
            <div className=\"flex items-center justify-between pb-4 border-b border-[var(--hl)]\">
              <div className=\"flex items-center gap-3\">
                <div className=\"p-2 rounded-xl bg-[var(--sage)]/70 text-[var(--ac)] border border-[var(--ac)]/20\">
                  <UserPlus className=\"w-5 h-5\" />
                </div>
                <div>
                  <h3 className=\"text-lg sm:text-xl font-bold font-serif text-[var(--ink)]\">
                    Register New Patient
                  </h3>
                  <p className=\"text-xs text-[var(--s2)] mt-0.5\">
                    Create permanent clinical health record & intake card
                  </p>
                </div>
              </div>
              <button
                type=\"button\"
                onClick={() => setIsRegisterModalOpen(false)}
                className=\"p-1.5 rounded-lg text-[var(--s2)] hover:text-[var(--ink)] hover:bg-[var(--sf)] border border-transparent hover:border-[var(--hl)] transition-colors cursor-pointer\"
                title=\"Close\"
              >
                <X className=\"w-5 h-5\" />
              </button>
            </div>

            <form onSubmit={handleRegisterPatient} className=\"mt-5 space-y-5 text-xs sm:text-sm\">
              {/* 2-Column Balanced Intake Form */}
              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-5\">
                {/* Column 1: Demographics & Contact */}
                <div className=\"p-4 rounded-xl bg-white border border-[var(--hl)]/50 shadow-xs space-y-3.5\">
                  <div className=\"text-xs font-bold uppercase tracking-wider text-[var(--ink)] border-b border-[var(--hl)]/40 pb-2 flex items-center justify-between\">
                    <span>1. Patient Demographics</span>
                    <span className=\"text-[11px] text-[var(--ac)] font-semibold\">Identity</span>
                  </div>

                  <div>
                    <label className=\"block font-semibold text-[var(--ink)] mb-1\">
                      Full Name *
                    </label>
                    <input
                      type=\"text\"
                      required
                      autoFocus
                      placeholder=\"e.g. Radhika Namboodiri\"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className=\"w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] placeholder:text-[var(--s2)]/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all\"
                    />
                  </div>

                  <div>
                    <label className=\"block font-semibold text-[var(--ink)] mb-1\">
                      Phone Number *
                    </label>
                    <input
                      type=\"tel\"
                      required
                      placeholder=\"e.g. 9847012345\"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className=\"w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] placeholder:text-[var(--s2)]/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all\"
                    />
                  </div>

                  <div className=\"grid grid-cols-2 gap-3 pt-1\">
                    <div>
                      <label className=\"block font-semibold text-[var(--ink)] mb-1\">Age</label>
                      <input
                        type=\"number\"
                        min=\"0\"
                        max=\"120\"
                        placeholder=\"e.g. 38\"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className=\"w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] placeholder:text-[var(--s2)]/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all\"
                      />
                    </div>
                    <div>
                      <label className=\"block font-semibold text-[var(--ink)] mb-1\">Gender</label>
                      <select
                        value={sex}
                        onChange={(e) => setSex(e.target.value)}
                        className=\"w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all cursor-pointer\"
                      >
                        <option>Female</option>
                        <option>Male</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Column 2: Clinical Intake Profile */}
                <div className=\"p-4 rounded-xl bg-white border border-[var(--hl)]/50 shadow-xs space-y-3.5\">
                  <div className=\"text-xs font-bold uppercase tracking-wider text-[var(--ink)] border-b border-[var(--hl)]/40 pb-2 flex items-center justify-between\">
                    <span>2. Clinical Background</span>
                    <span className=\"text-[11px] text-[var(--err)] font-semibold\">Medical Safety</span>
                  </div>

                  <div>
                    <label className=\"block font-semibold text-[var(--ink)] mb-1\">
                      Known Drug & Food Allergies
                    </label>
                    <input
                      type=\"text\"
                      placeholder=\"e.g. Dust, Penicillin, Sesame, Sulfonamides\"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      className=\"w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] placeholder:text-[var(--s2)]/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all\"
                    />
                    <p className=\"text-[11px] text-[var(--s2)] mt-1\">
                      Flagged to doctors during prescription ordering
                    </p>
                  </div>

                  <div>
                    <label className=\"block font-semibold text-[var(--ink)] mb-1\">
                      Underlying Conditions / Primary Complaints
                    </label>
                    <textarea
                      rows={3}
                      placeholder=\"e.g. Type-2 Diabetes, Hypertension, Lumbar spondylosis, Chronic migraines...\"
                      value={cond}
                      onChange={(e) => setCond(e.target.value)}
                      className=\"w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] placeholder:text-[var(--s2)]/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all resize-none\"
                    />
                  </div>
                </div>
              </div>

              {/* Consultation Queue Immediate Check-In Tray */}
              <div className=\"p-3.5 rounded-xl bg-white border border-[var(--hl)]/50 shadow-xs space-y-2.5\">
                <label className=\"flex items-center gap-2.5 cursor-pointer font-semibold text-[var(--ink)]\">
                  <input
                    type=\"checkbox\"
                    checked={autoCheckIn}
                    onChange={(e) => setAutoCheckIn(e.target.checked)}
                    className=\"w-4 h-4 rounded text-[var(--ac)] focus:ring-[var(--ac)] cursor-pointer\"
                  />
                  <span>Check in to doctor's consultation queue immediately</span>
                </label>

                {autoCheckIn && (
                  <label className=\"flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--err)] pl-6\">
                    <input
                      type=\"checkbox\"
                      checked={isUrgentNewPatient}
                      onChange={(e) => setIsUrgentNewPatient(e.target.checked)}
                      className=\"w-3.5 h-3.5 rounded text-[var(--err)] focus:ring-[var(--err)] cursor-pointer\"
                    />
                    <span>Mark as High Priority (Emergency / Severe Acute Condition)</span>
                  </label>
                )}
              </div>

              {/* Action Buttons */}
              <div className=\"flex items-center justify-end gap-3 pt-2 border-t border-[var(--hl)]\">
                <button
                  type=\"button\"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className=\"px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-[var(--hl)] bg-white text-[var(--s2)] hover:bg-[var(--sf)] transition-colors cursor-pointer\"
                >
                  Cancel
                </button>
                <button
                  type=\"submit\"
                  className=\"px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-[var(--ac)] text-white hover:bg-[var(--ac-hover)] transition-colors shadow-sm cursor-pointer\"
                >
                  Save & Confirm Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect / Settle Payment Dialog */}
      {invoiceToSettle && (
        <div className=\"fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--ink)]/40 backdrop-blur-xs\">
          <div className=\"w-full max-w-lg bg-[var(--sf)] border border-[var(--hl)] rounded-2xl shadow-2xl p-6 sm:p-7 animate-in fade-in zoom-in-95 my-auto\">
            <div className=\"flex items-center justify-between pb-3.5 border-b border-[var(--hl)]\">
              <div>
                <h4 className=\"font-bold text-base font-serif text-[var(--ink)]\">
                  Record Balance Payment
                </h4>
                <p className=\"text-xs text-[var(--s2)] mt-0.5\">
                  Invoice #{invoiceToSettle.id} · {getPatient(invoiceToSettle.pid)?.name}
                </p>
              </div>
              <button
                type=\"button\"
                onClick={() => setSettleInvoiceId(null)}
                className=\"p-1.5 rounded-lg text-[var(--s2)] hover:text-[var(--ink)] hover:bg-[var(--sf)] border border-transparent hover:border-[var(--hl)] transition-colors cursor-pointer\"
              >
                <X className=\"w-4 h-4\" />
              </button>
            </div>

            {/* Financial Summary Glance */}
            <div className=\"my-4 p-3.5 rounded-xl bg-white border border-[var(--hl)]/50 shadow-xs flex justify-between text-xs\">
              <div>
                <span className=\"text-[var(--s2)]\">Invoice Total:</span>
                <div className=\"font-bold text-sm text-[var(--ink)]\">{formatMoney(invoiceToSettle.total)}</div>
              </div>
              <div>
                <span className=\"text-[var(--s2)]\">Already Paid:</span>
                <div className=\"font-bold text-sm text-[var(--ac)]\">{formatMoney(invoiceToSettle.paid)}</div>
              </div>
              <div>
                <span className=\"text-[var(--s2)]\">Outstanding Due:</span>
                <div className=\"font-bold text-sm text-[var(--err)]\">
                  {formatMoney(invoiceToSettle.total - invoiceToSettle.paid)}
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmSettle} className=\"space-y-4 text-xs sm:text-sm\">
              <div>
                <div className=\"flex items-center justify-between mb-1.5\">
                  <label className=\"font-semibold text-[var(--ink)]\">
                    Payment Amount to Settle (₹) *
                  </label>
                  <button
                    type=\"button\"
                    onClick={() => setSettleAmount((invoiceToSettle.total - invoiceToSettle.paid).toString())}
                    className=\"text-xs text-[var(--ac)] font-bold hover:underline cursor-pointer\"
                  >
                    Pay Full: {formatMoney(invoiceToSettle.total - invoiceToSettle.paid)}
                  </button>
                </div>
                <div className=\"relative\">
                  <span className=\"absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--s2)]/70 font-semibold text-sm\">₹</span>
                  <input
                    type=\"number\"
                    min=\"1\"
                    max={invoiceToSettle.total - invoiceToSettle.paid}
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    required
                    className=\"w-full pl-8 pr-4 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] font-bold text-lg shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all\"
                  />
                </div>
              </div>

              <div className=\"grid grid-cols-2 gap-3\">
                <div>
                  <label className=\"block font-semibold text-[var(--ink)] mb-1\">
                    Payment Method
                  </label>
                  <select
                    value={settleMethod}
                    onChange={(e) => setSettleMethod(e.target.value)}
                    className=\"w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all cursor-pointer\"
                  >
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Card</option>
                  </select>
                </div>

                <div>
                  <label className=\"block font-semibold text-[var(--ink)] mb-1\">
                    Transaction Reference
                  </label>
                  <input
                    type=\"text\"
                    placeholder=\"e.g. UPI Ref / Txn #\"
                    value={settleRef}
                    onChange={(e) => setSettleRef(e.target.value)}
                    className=\"w-full px-3.5 py-2.5 rounded-xl border border-[var(--hl)] bg-white text-[var(--ink)] placeholder:text-[var(--s2)]/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 focus:border-[var(--ac)] transition-all\"
                  />
                </div>
              </div>

              <div className=\"flex items-center justify-end gap-3 pt-3.5 border-t border-[var(--hl)]\">
                <button
                  type=\"button\"
                  onClick={() => setSettleInvoiceId(null)}
                  className=\"px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-[var(--hl)] bg-white text-[var(--s2)] hover:bg-[var(--sf)] transition-colors cursor-pointer\"
                >
                  Cancel
                </button>
                <button
                  type=\"submit\"
                  className=\"px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-[var(--ac)] text-white hover:bg-[var(--ac-hover)] transition-colors shadow-sm cursor-pointer\"
                >
                  Confirm & Settle Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Booking Modal */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        defaultPatientId={appointmentModalParams.patientId}
        defaultDate={appointmentModalParams.date}
        refRxId={appointmentModalParams.refRxId}
      />

      {/* Cancel Visit Prompt Modal */}
      <PromptModal
        isOpen={cancelVisitId !== null}
        onClose={() => setCancelVisitId(null)}
        title=\"Cancel Patient Check-in\"
        description=\"Provide a brief clinical or administrative reason. The cancelled check-in will be saved in the activity history.\"
        placeholder=\"e.g. Patient had an emergency, left before consultation\"
        confirmLabel=\"Cancel Check-in\"
        onConfirm={(reason) => {
          if (cancelVisitId) {
            cancelVisit(cancelVisitId, reason);
            setCancelVisitId(null);
          }
        }}
      />
    </div>
  );
}
