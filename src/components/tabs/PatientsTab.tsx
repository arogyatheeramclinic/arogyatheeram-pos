'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '@/context/ClinicContext';
import {
  formatDateTime,
  formatDate,
  formatMoney,
} from '@/lib/utils';
import {
  Search,
  User,
  ArrowLeft,
  Edit3,
  Printer,
  FilePlus2,
  Ban,
  Activity,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import PromptModal from '../modals/PromptModal';

export default function PatientsTab() {
  const {
    state,
    currentUser,
    updatePatient,
    voidInvoice,
    addPrescriptionAddendum,
    recordTreatmentSession,
    triggerPrint,
    getPatient,
  } = useClinic();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Edit patient profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editSex, setEditSex] = useState('Female');
  const [editAllergies, setEditAllergies] = useState('');
  const [editCond, setEditCond] = useState('');

  // Modals
  const [voidInvoiceId, setVoidInvoiceId] = useState<string | null>(null);
  const [addendumRxId, setAddendumRxId] = useState<string | null>(null);

  // Check if patient was selected from another tab (e.g. Doctor tab History button)
  useEffect(() => {
    const savedId = sessionStorage.getItem('arogya_selected_patient');
    if (savedId) {
      setSelectedPatientId(savedId);
      sessionStorage.removeItem('arogya_selected_patient');
    }
  }, []);

  const selectedPatient = selectedPatientId ? getPatient(selectedPatientId) : null;

  const handleOpenEdit = () => {
    if (!selectedPatient) return;
    setEditName(selectedPatient.name);
    setEditPhone(selectedPatient.phone);
    setEditAge(selectedPatient.age?.toString() || '');
    setEditSex(selectedPatient.sex || 'Female');
    setEditAllergies(selectedPatient.allergies || '');
    setEditCond(selectedPatient.cond || '');
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || editName.trim().length < 2) return;
    updatePatient(selectedPatientId, {
      name: editName.trim(),
      phone: editPhone.trim(),
      age: editAge ? parseInt(editAge) : '',
      sex: editSex,
      allergies: editAllergies.trim(),
      cond: editCond.trim(),
    });
    setIsEditing(false);
  };

  // Filter patients list
  const cleanQ = searchQuery.toLowerCase().trim();
  const filteredPatients = state.pts.filter(
    (p) =>
      p.id !== 'PW' &&
      (p.name.toLowerCase().includes(cleanQ) || p.phone.includes(cleanQ))
  );

  // Patient detailed relations
  const patientVisits = selectedPatient
    ? state.vis.filter((v) => v.pid === selectedPatient.id && !v.cancelled)
    : [];
  const patientRx = selectedPatient
    ? state.rx.filter((r) => r.pid === selectedPatient.id)
    : [];
  const patientInvoices = selectedPatient
    ? state.invs.filter((i) => i.pid === selectedPatient.id)
    : [];
  const patientPayments = selectedPatient
    ? state.pays.filter((p) => p.pid === selectedPatient.id)
    : [];
  const patientPackages = selectedPatient
    ? state.pk.filter((k) => k.pid === selectedPatient.id && !k.void)
    : [];

  // Tally of medicines & treatments
  const nonVoidInvoices = patientInvoices.filter((i) => !i.void);
  const medicineTally: Record<string, number> = {};
  const treatmentTally: Record<string, number> = {};

  nonVoidInvoices.forEach((inv) =>
    inv.items.forEach((item) => {
      if (item.type === 'medicine') {
        medicineTally[item.name] = (medicineTally[item.name] || 0) + item.qty;
      } else {
        treatmentTally[item.name] = (treatmentTally[item.name] || 0) + item.qty;
      }
    })
  );

  return (
    <div className=\"space-y-6\">
      {!selectedPatient ? (
        // Patient Directory Search View
        <div className=\"p-5 sm:p-6 rounded-2xl bg-[var(--sf-card)] border border-[var(--hl)] shadow-[var(--lift)]\">
          <div className=\"flex items-center justify-between pb-3 border-b border-[var(--hl)]\">
            <h3 className=\"text-lg font-semibold font-serif text-[var(--ink)]\">
              Patient Medical Records Directory
            </h3>
            <span className=\"text-xs text-[var(--s2)] font-medium\">
              {filteredPatients.length} registered profiles
            </span>
          </div>

          <div className=\"mt-4\">
            <div className=\"relative\">
              <Search className=\"w-4 h-4 text-[var(--s2)] absolute left-3 top-1/2 -translate-y-1/2\" />
              <input
                type=\"text\"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder=\"Search patient by full name or phone number...\"
                className=\"w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-lg border border-[var(--hl)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--ac)]\"
              />
            </div>
          </div>

          <div className=\"mt-4 divide-y divide-[var(--hl)]/60 max-h-[600px] overflow-y-auto\">
            {filteredPatients.length === 0 ? (
              <div className=\"p-8 text-center text-xs sm:text-sm text-[var(--s2)]\">
                No patient matching \"{searchQuery}\". Register new patients from Reception tab.
              </div>
            ) : (
              filteredPatients.map((p) => {
                const visitsCount = state.vis.filter(
                  (v) => v.pid === p.id && !v.cancelled
                ).length;
                const rxCount = state.rx.filter((r) => r.pid === p.id).length;

                return (
                  <div
                    key={p.id}
                    className=\"py-3 flex items-center justify-between gap-3 text-xs sm:text-sm hover:bg-[var(--sf)]/50 px-2 rounded-lg transition-colors\"
                  >
                    <div>
                      <div className=\"font-bold text-[var(--ink)]\">{p.name}</div>
                      <div className=\"text-xs text-[var(--s2)] mt-0.5\">
                        {p.phone} · {[p.age ? `${p.age} yrs` : '', p.sex].filter(Boolean).join(', ')} · Registered {formatDate(p.t)}
                      </div>
                      <div className=\"text-[11px] text-[var(--s2)] mt-0.5\">
                        {visitsCount} visit{visitsCount === 1 ? '' : 's'} · {rxCount} prescription{rxCount === 1 ? '' : 's'}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedPatientId(p.id)}
                      className=\"px-3 py-1.5 rounded-lg border border-[var(--hl)] bg-white text-[var(--ac)] font-medium hover:bg-[var(--sage)] transition-colors shadow-xs\"
                    >
                      Open Medical Profile
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        // Comprehensive Patient Profile View
        <div className=\"space-y-6 animate-in fade-in\">
          {/* Header Bar */}
          <div className=\"p-5 sm:p-6 rounded-2xl bg-[var(--sf)] border border-[var(--hl)] shadow-[var(--lift)]\">
            <button
              onClick={() => {
                setSelectedPatientId(null);
                setIsEditing(false);
              }}
              className=\"flex items-center gap-1.5 text-xs font-semibold text-[var(--ac)] hover:underline mb-3\"
            >
              <ArrowLeft className=\"w-3.5 h-3.5\" />
              <span>Back to All Patients</span>
            </button>

            {isEditing ? (
              <form onSubmit={handleSaveEdit} className=\"space-y-3 mt-2 text-xs sm:text-sm\">
                <div className=\"grid grid-cols-1 sm:grid-cols-2 gap-3\">
                  <div>
                    <label className=\"block font-semibold text-[var(--s2)] mb-1\">
                      Full Name
                    </label>
                    <input
                      type=\"text\"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className=\"w-full px-3 py-1.5 rounded-lg border border-[var(--hl)] bg-white text-[var(--ink)]\"
                    />
                  </div>
                  <div>
                    <label className=\"block font-semibold text-[var(--s2)] mb-1\">
                      Phone Number
                    </label>
                    <input
                      type=\"tel\"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      required
                      className=\"w-full px-3 py-1.5 rounded-lg border border-[var(--hl)] bg-white text-[var(--ink)]\"
                    />
                  </div>
                </div>

                <div className=\"grid grid-cols-2 sm:grid-cols-4 gap-3\">
                  <div>
                    <label className=\"block font-semibold text-[var(--s2)] mb-1\">Age</label>
                    <input
                      type=\"number\"
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value)}
                      className=\"w-full px-3 py-1.5 rounded-lg border border-[var(--hl)] bg-white text-[var(--ink)]\"
                    />
                  </div>
                  <div>
                    <label className=\"block font-semibold text-[var(--s2)] mb-1\">Gender</label>
                    <select
                      value={editSex}
                      onChange={(e) => setEditSex(e.target.value)}
                      className=\"w-full px-3 py-1.5 rounded-lg border border-[var(--hl)] bg-white text-[var(--ink)]\"
                    >
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className=\"col-span-2\">
                    <label className=\"block font-semibold text-[var(--s2)] mb-1\">
                      Allergies
                    </label>
                    <input
                      type=\"text\"
                      value={editAllergies}
                      onChange={(e) => setEditAllergies(e.target.value)}
                      className=\"w-full px-3 py-1.5 rounded-lg border border-[var(--hl)] bg-white text-[var(--ink)]\"
                    />
                  </div>
                </div>

                <div>
                  <label className=\"block font-semibold text-[var(--s2)] mb-1\">
                    Pre-existing Conditions
                  </label>
                  <input
                    type=\"text\"
                    value={editCond}
                    onChange={(e) => setEditCond(e.target.value)}
                    className=\"w-full px-3 py-1.5 rounded-lg border border-[var(--hl)] bg-white text-[var(--ink)]\"
                  />
                </div>

                <div className=\"flex items-center gap-2 pt-2\">
                  <button
                    type=\"submit\"
                    className=\"px-4 py-1.5 text-xs rounded-lg bg-[var(--ac)] text-white font-medium hover:bg-[var(--ac-hover)]\"
                  >
                    Save Changes
                  </button>
                  <button
                    type=\"button\"
                    onClick={() => setIsEditing(false)}
                    className=\"px-3 py-1.5 text-xs rounded-lg border border-[var(--hl)] bg-white text-[var(--s2)]\"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className=\"flex items-start justify-between\">
                  <div>
                    <h2 className=\"text-2xl font-bold font-serif text-[var(--ink)]\">
                      {selectedPatient.name}
                    </h2>
                    <p className=\"text-xs text-[var(--s2)] mt-1\">
                      {selectedPatient.phone} · {[selectedPatient.age ? `${selectedPatient.age} yrs` : '', selectedPatient.sex].filter(Boolean).join(', ')} · Registered on {formatDate(selectedPatient.t)} · {patientVisits.length} consultation visit{patientVisits.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <button
                    onClick={handleOpenEdit}
                    className=\"px-3 py-1.5 rounded-lg border border-[var(--hl)] bg-white text-xs font-medium text-[var(--s2)] hover:text-[var(--ink)] transition-colors flex items-center gap-1.5\"
                  >
                    <Edit3 className=\"w-3.5 h-3.5\" />
                    <span>Edit Profile</span>
                  </button>
                </div>

                <div className=\"mt-4 pt-3 border-t border-[var(--hl)] flex flex-wrap gap-4 text-xs\">
                  <div>
                    <span className=\"font-bold text-[var(--ink)]\">Known Allergies: </span>
                    <span className={selectedPatient.allergies ? 'text-[var(--err)] font-semibold' : 'text-[var(--s2)]'}>
                      {selectedPatient.allergies || 'None recorded'}
                    </span>
                  </div>
                  <div>
                    <span className=\"font-bold text-[var(--ink)]\">Underlying Conditions: </span>
                    <span className=\"text-[var(--s2)]\">
                      {selectedPatient.cond || 'None recorded'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Treatment Packages Card */}
          {patientPackages.length > 0 && (
            <div className=\"p-5 sm:p-6 rounded-2xl bg-[var(--sf-card)] border border-[var(--hl)] shadow-[var(--lift)]\">
              <div className=\"flex items-center gap-2 pb-3 border-b border-[var(--hl)]\">
                <Sparkles className=\"w-5 h-5 text-[var(--brass)]\" />
                <h3 className=\"text-base font-semibold font-serif text-[var(--ink)]\">
                  Active Ayurvedic Treatment Packages
                </h3>
              </div>
              <div className=\"mt-3 divide-y divide-[var(--hl)]/50\">
                {patientPackages.map((pkg) => {
                  const isCompleted = pkg.used >= pkg.total;
                  return (
                    <div
                      key={pkg.id}
                      className=\"py-3 flex items-center justify-between gap-3 text-xs sm:text-sm\"
                    >
                      <div>
                        <span className=\"font-bold text-[var(--ink)]\">{pkg.name}</span>
                        <div className=\"text-xs text-[var(--s2)] mt-0.5\">
                          {pkg.used} of {pkg.total} sessions recorded
                        </div>
                      </div>
                      <button
                        onClick={() => recordTreatmentSession(pkg.id)}
                        disabled={isCompleted}
                        className=\"px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--sage)] text-[var(--ac)] border border-[var(--ac)]/20 hover:bg-[var(--ac)] hover:text-white transition-colors disabled:opacity-40\"
                      >
                        {isCompleted ? 'All Completed' : 'Record Session Usage'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Prescriptions & Invoices Grid */}
          <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
            {/* Prescriptions History */}
            <div className=\"p-5 sm:p-6 rounded-2xl bg-[var(--sf-card)] border border-[var(--hl)] shadow-[var(--lift)]\">
              <h3 className=\"text-base font-semibold font-serif text-[var(--ink)] pb-3 border-b border-[var(--hl)]\">
                Medical Prescriptions ({patientRx.length})
              </h3>
              <div className=\"mt-3 divide-y divide-[var(--hl)]/50 max-h-96 overflow-y-auto\">
                {patientRx.length === 0 ? (
                  <div className=\"p-6 text-center text-xs text-[var(--s2)]\">
                    No prescriptions recorded yet.
                  </div>
                ) : (
                  patientRx.map((rx) => (
                    <div key={rx.id} className=\"py-3 space-y-1.5 text-xs sm:text-sm\">
                      <div className=\"flex items-center justify-between\">
                        <span className=\"font-bold text-[var(--ink)]\">
                          {rx.no} · {formatDate(rx.t)}
                        </span>
                        <div className=\"flex items-center gap-1.5\">
                          <button
                            onClick={() => triggerPrint('rx', rx.id)}
                            className=\"px-2 py-1 text-xs rounded border border-[var(--hl)] bg-white text-[var(--s2)] hover:bg-[var(--sf)] flex items-center gap-1\"
                          >
                            <Printer className=\"w-3.5 h-3.5\" />
                            <span>Print</span>
                          </button>
                          {currentUser?.role === 'doctor' && (
                            <button
                              onClick={() => setAddendumRxId(rx.id)}
                              className=\"px-2 py-1 text-xs rounded border border-[var(--hl)] bg-white text-[var(--s2)] hover:bg-[var(--sf)] flex items-center gap-1\"
                            >
                              <FilePlus2 className=\"w-3.5 h-3.5\" />
                              <span>Add Note</span>
                            </button>
                          )}
                        </div>
                      </div>
                      {rx.notes && (
                        <div className=\"text-xs text-[var(--s2)] italic\">\"{rx.notes}\"</div>
                      )}
                      <div className=\"text-xs text-neutral-700\">
                        {rx.items
                          .map(
                            (x) =>
                              `${x.name} × ${x.qty}${x.days ? ` (${x.days} days)` : ''}${x.dose ? ` [${x.dose}]` : ''}`
                          )
                          .join('; ')}
                      </div>
                      {rx.add && rx.add.length > 0 && (
                        <div className=\"pt-1 text-[11px] text-[var(--s2)] space-y-0.5\">
                          {rx.add.map((a, i) => (
                            <div key={i}>
                              <span className=\"font-semibold text-[var(--ink)]\">
                                Doctor's Note ({formatDate(a.t)}):
                              </span>{' '}
                              {a.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Invoices History */}
            <div className=\"p-5 sm:p-6 rounded-2xl bg-[var(--sf-card)] border border-[var(--hl)] shadow-[var(--lift)]\">
              <h3 className=\"text-base font-semibold font-serif text-[var(--ink)] pb-3 border-b border-[var(--hl)]\">
                Billing & Invoices ({patientInvoices.length})
              </h3>
              <div className=\"mt-3 divide-y divide-[var(--hl)]/50 max-h-96 overflow-y-auto\">
                {patientInvoices.length === 0 ? (
                  <div className=\"p-6 text-center text-xs text-[var(--s2)]\">
                    No invoices generated yet.
                  </div>
                ) : (
                  patientInvoices.map((inv) => {
                    const isPaid = inv.paid >= inv.total;
                    const isVoid = !!inv.void;

                    return (
                      <div
                        key={inv.id}
                        className=\"py-3 flex items-center justify-between gap-3 text-xs sm:text-sm\"
                      >
                        <div>
                          <div className=\"flex items-center gap-2\">
                            <span className=\"font-bold text-[var(--ink)]\">{inv.id}</span>
                            <span className=\"text-xs text-[var(--s2)]\">
                              · {formatDate(inv.t)}
                            </span>
                          </div>
                          <div className=\"text-xs text-[var(--s2)] mt-0.5\">
                            Total: {formatMoney(inv.total)} · Paid: {formatMoney(inv.paid)}
                          </div>
                          {isVoid && (
                            <div className=\"text-[11px] text-[var(--err)] font-semibold mt-0.5\">
                              Cancelled: {inv.void?.reason}
                            </div>
                          )}
                        </div>

                        <div className=\"flex items-center gap-2\">
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                              isVoid
                                ? 'bg-[var(--err-bg)] text-[var(--err)]'
                                : isPaid
                                ? 'bg-[var(--sage)] text-[var(--ac)]'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isVoid ? 'Cancelled' : isPaid ? 'Paid' : 'Partial'}
                          </span>
                          <button
                            onClick={() => triggerPrint('inv', inv.id)}
                            className=\"px-2 py-1 text-xs rounded border border-[var(--hl)] bg-white text-[var(--s2)] hover:bg-[var(--sf)]\"
                          >
                            Print
                          </button>
                          {currentUser?.role === 'doctor' && !isVoid && (
                            <button
                              onClick={() => setVoidInvoiceId(inv.id)}
                              className=\"px-2 py-1 text-xs rounded border border-[var(--err)]/30 text-[var(--err)] hover:bg-[var(--err-bg)]/40\"
                            >
                              Cancel Bill
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Purchased Medicines & Treatments Tallies */}
          <div className=\"p-5 sm:p-6 rounded-2xl bg-[var(--sf-card)] border border-[var(--hl)] shadow-[var(--lift)] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm\">
            <div>
              <span className=\"font-bold text-[var(--ink)] block mb-1\">
                Medicines Purchased to Date:
              </span>
              <p className=\"text-[var(--s2)]\">
                {Object.entries(medicineTally)
                  .map(([name, qty]) => `${name} × ${qty}`)
                  .join(', ') || 'None recorded yet'}
              </p>
            </div>
            <div>
              <span className=\"font-bold text-[var(--ink)] block mb-1\">
                Treatments Received to Date:
              </span>
              <p className=\"text-[var(--s2)]\">
                {Object.entries(treatmentTally)
                  .map(([name, qty]) => `${name} × ${qty}`)
                  .join(', ') || 'None recorded yet'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Invoice Prompt Modal */}
      <PromptModal
        isOpen={voidInvoiceId !== null}
        onClose={() => setVoidInvoiceId(null)}
        title={`Cancel Invoice ${voidInvoiceId}`}
        description=\"Cancelling this invoice returns all items back into stock, records any collected money as refunded, and reopens the prescription for billing.\"
        placeholder=\"Reason for cancelling (e.g. Billed wrong items, patient returned goods)\"
        confirmLabel=\"Cancel Invoice\"
        onConfirm={(reason) => {
          if (voidInvoiceId) {
            voidInvoice(voidInvoiceId, reason);
            setVoidInvoiceId(null);
          }
        }}
      />

      {/* Add Note Prompt Modal */}
      <PromptModal
        isOpen={addendumRxId !== null}
        onClose={() => setAddendumRxId(null)}
        title=\"Add Follow-up Note to Prescription\"
        description=\"The original prescription remains as written. This extra note will be added with today's date and your signature.\"
        placeholder=\"What changed or needs clinical correction?\"
        confirmLabel=\"Save Note\"
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
