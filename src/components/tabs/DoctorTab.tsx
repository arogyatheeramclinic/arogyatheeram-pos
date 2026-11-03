'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import {
  formatDateTime,
  formatDate,
} from '@/lib/utils';
import {
  Stethoscope,
  Clock,
  History,
  Printer,
  FilePlus2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import PromptModal from '../modals/PromptModal';

export default function DoctorTab() {
  const {
    state,
    currentUser,
    startConsultation,
    addPrescriptionAddendum,
    triggerPrint,
    setCurrentTab,
    getPatient,
  } = useClinic();

  const [addendumRxId, setAddendumRxId] = useState<string | null>(null);

  // Filter today's queue
  const waitingVisits = state.vis
    .filter((v) => v.st !== 'done' && !v.cancelled)
    .sort((a, b) => (b.urg ? 1 : 0) - (a.urg ? 1 : 0) || a.t - b.t);

  // Filter completed prescriptions today
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const completedToday = state.rx
    .filter((r) => r.t >= todayStart)
    .reverse();

  const isPrescriptionBilled = (rxId: string) =>
    state.invs.some((i) => i.rxid === rxId && !i.void);

  const openPatientHistory = (patientId: string) => {
    // We can navigate to 'pts' tab
    setCurrentTab('pts');
    // Store patientId in session or dispatch
    sessionStorage.setItem('arogya_selected_patient', patientId);
  };

  return (
    <div className="space-y-6">
      {/* Today's Waiting Patients Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[var(--sf-card)] border border-[var(--hl)] shadow-[var(--lift)]">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--hl)]">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-[var(--ac)]" />
            <h3 className="text-lg font-semibold font-serif text-[var(--ink)]">
              Consultation Queue · Today's Patients
            </h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--sage)] text-[var(--ac)] font-bold">
            {waitingVisits.length} awaiting doctor
          </span>
        </div>

        <div className="mt-4 divide-y divide-[var(--hl)]/60">
          {waitingVisits.length === 0 ? (
            <div className="p-8 text-center text-xs sm:text-sm text-[var(--s2)]">
              No patients currently waiting in queue. When reception checks in a patient, they will appear here automatically.
            </div>
          ) : (
            waitingVisits.map((visit) => {
              const patient = getPatient(visit.pid);
              const isUrgent = !!visit.urg;
              const isConsulting = visit.st === 'consulting';

              return (
                <div
                  key={visit.id}
                  className="py-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--ink)] text-sm">
                        Token #{visit.tk ?? '–'}
                      </span>
                      <span className="font-bold text-[var(--ink)] text-sm sm:text-base">
                        {patient?.name || 'Patient'}
                      </span>
                      {isUrgent && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--err-bg)] text-[var(--err)] font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          High Priority (Emergency)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--s2)] mt-0.5">
                      {[patient?.age ? `${patient.age} yrs` : '', patient?.sex, patient?.phone]
                        .filter(Boolean)
                        .join(' · ')}
                      {' · '}
                      {isConsulting ? (
                        <span className="text-[var(--ac)] font-semibold">
                          Consultation in progress...
                        </span>
                      ) : (
                        `Waiting since ${formatDateTime(visit.t)}`
                      )}
                    </div>
                    {patient?.allergies && (
                      <div className="text-[11px] text-[var(--err)] font-semibold mt-1">
                        Allergies: {patient.allergies}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openPatientHistory(visit.pid)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-[var(--hl)] bg-white text-[var(--s2)] hover:bg-[var(--sf)] transition-colors flex items-center gap-1"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Medical History</span>
                    </button>
                    <button
                      onClick={() => startConsultation(visit.id)}
                      className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[var(--ac)] text-white hover:bg-[var(--ac-hover)] transition-colors shadow-xs"
                    >
                      {isConsulting ? 'Resume Consultation' : 'Start Consultation'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Completed Today Section */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[var(--sf-card)] border border-[var(--hl)] shadow-[var(--lift)]">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--hl)]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[var(--ac)]" />
            <h3 className="text-lg font-semibold font-serif text-[var(--ink)]">
              Consultations Completed Today
            </h3>
          </div>
          <span className="text-xs text-[var(--s2)]">
            {completedToday.length} prescription{completedToday.length === 1 ? '' : 's'} issued
          </span>
        </div>

        <div className="mt-4 divide-y divide-[var(--hl)]/60 max-h-96 overflow-y-auto">
          {completedToday.length === 0 ? (
            <div className="p-8 text-center text-xs sm:text-sm text-[var(--s2)]">
              No prescriptions saved yet today. Completed consultations will be recorded here.
            </div>
          ) : (
            completedToday.map((rx) => {
              const patient = getPatient(rx.pid);
              const billed = isPrescriptionBilled(rx.id);

              return (
                <div key={rx.id} className="py-3.5 space-y-2 text-xs sm:text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--ink)]">
                          {patient?.name || 'Patient'}
                        </span>
                        <span className="text-xs text-[var(--s2)]">({rx.no})</span>
                        <span className="text-xs text-[var(--s2)]">· {formatDateTime(rx.t)}</span>
                      </div>
                      <div className="text-xs text-[var(--s2)] mt-1">
                        {rx.items.map((x) => `${x.name} × ${x.qty}`).join(', ') || 'No medications'}
                      </div>
                      {rx.notes && (
                        <div className="text-xs text-neutral-600 mt-0.5 line-clamp-1 italic">
                          "{rx.notes}"
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {billed ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--sage)] text-[var(--ac)] font-bold">
                          Billed
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--sf)] text-[var(--s2)] border border-[var(--hl)] font-semibold">
                          Awaiting Billing
                        </span>
                      )}
                      <button
                        onClick={() => triggerPrint('rx', rx.id)}
                        className="px-2.5 py-1 text-xs rounded-md border border-[var(--hl)] bg-white text-[var(--s2)] hover:bg-[var(--sf)] flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                      <button
                        onClick={() => setAddendumRxId(rx.id)}
                        className="px-2.5 py-1 text-xs rounded-md border border-[var(--hl)] bg-white text-[var(--s2)] hover:bg-[var(--sf)] flex items-center gap-1"
                      >
                        <FilePlus2 className="w-3.5 h-3.5" />
                        <span>Add Note</span>
                      </button>
                      <button
                        onClick={() => openPatientHistory(rx.pid)}
                        className="px-2.5 py-1 text-xs rounded-md border border-[var(--hl)] bg-white text-[var(--s2)] hover:bg-[var(--sf)]"
                      >
                        History
                      </button>
                    </div>
                  </div>

                  {/* Notes display if present */}
                  {rx.add && rx.add.length > 0 && (
                    <div className="pt-1.5 pl-3 border-l-2 border-[var(--ac)] text-xs text-[var(--s2)] space-y-1">
                      {rx.add.map((a, i) => (
                        <div key={i}>
                          <span className="font-semibold text-[var(--ink)]">
                            Doctor's Note ({formatDate(a.t)} by {a.by}):
                          </span>{' '}
                          {a.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Note Prompt Modal */}
      <PromptModal
        isOpen={addendumRxId !== null}
        onClose={() => setAddendumRxId(null)}
        title="Add Follow-up Note to Prescription"
        description="The original prescription remains as written. This extra note will be added with today's date and your signature."
        placeholder="What changed or needs clinical correction?"
        confirmLabel="Save Note"
        onConfirm={(text) => {
          if (addendumRxId) {
            addPrescriptionAddendum(addendumRxId, text);
            setAddendumRxId(null);
          }
        }}
      />
    </div>
  );
}
