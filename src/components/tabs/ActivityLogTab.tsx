'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { formatDateTime } from '@/lib/utils';
import { History, Filter } from 'lucide-react';
import { ActivityLog } from '@/types';

export default function ActivityLogTab() {
  const { state, getPatient } = useClinic();
  const [filterType, setFilterType] = useState<string>('all');

  const filteredLogs = state.log.filter(
    (l) => filterType === 'all' || l.type === filterType
  );

  const LOG_TYPES = [
    { key: 'all', label: 'All Activities' },
    { key: 'check-in', label: 'Check-ins' },
    { key: 'consultation', label: 'Consultations' },
    { key: 'prescription', label: 'Prescriptions' },
    { key: 'invoice', label: 'Invoices' },
    { key: 'payment', label: 'Payments' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'appointment', label: 'Appointments' },
    { key: 'treatment', label: 'Treatment Sessions' },
    { key: 'login', label: 'Sign-ins' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[var(--sf-card)] border border-[var(--hl)] shadow-[var(--lift)] space-y-4">
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[var(--hl)] gap-2">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-[var(--ac)]" />
          <h3 className="text-lg font-semibold font-serif text-[var(--ink)]">
            Clinic Activity History
          </h3>
        </div>
        <span className="text-xs text-[var(--s2)] font-medium">
          {filteredLogs.length} logged events
        </span>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {LOG_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilterType(t.key)}
            className={`px-2.5 py-1 rounded-md capitalize transition-colors font-medium ${
              filterType === t.key
                ? 'bg-[var(--ac)] text-white shadow-xs'
                : 'bg-[var(--sf)] text-[var(--s2)] hover:text-[var(--ink)] border border-[var(--hl)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Logs Table / List */}
      <div className="divide-y divide-[var(--hl)]/60 max-h-[650px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--s2)]">
            No activities found matching filter.
          </div>
        ) : (
          filteredLogs.map((log, idx) => {
            const patient = log.pid ? getPatient(log.pid) : null;

            return (
              <div
                key={idx}
                className="py-3 flex items-start justify-between gap-3 text-xs sm:text-sm hover:bg-[var(--sf)]/40 px-2 rounded-lg transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--sage)] text-[var(--ac)] border border-[var(--ac)]/20">
                      {log.type}
                    </span>
                    {patient && (
                      <span className="font-bold text-[var(--ink)]">
                        {patient.name}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--ink)] mt-1">{log.msg}</div>
                  <div className="text-[11px] text-[var(--s2)] mt-0.5">
                    By: <span className="font-semibold text-neutral-700">{log.by || 'System'}</span>
                  </div>
                </div>

                <div className="text-[11px] text-[var(--s2)] whitespace-nowrap shrink-0 text-right">
                  {formatDateTime(log.t)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
