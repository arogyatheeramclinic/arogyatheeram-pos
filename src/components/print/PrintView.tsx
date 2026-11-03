'use client';

import React from 'react';
import { useClinic } from '@/context/ClinicContext';
import { formatDate, formatMoney } from '@/lib/utils';
import { Printer, X } from 'lucide-react';

export default function PrintView() {
  const { state, printData, setPrintData, getPatient } = useClinic();

  if (!printData) return null;

  const { type, id } = printData;
  const cfg = state.cfg;

  let content: React.ReactNode = null;

  if (type === 'rx') {
    const rx = state.rx.find((r) => r.id === id);
    if (!rx) return null;
    const patient = getPatient(rx.pid);
    const vit = rx.vit || {};

    content = (
      <div className="print-container bg-white text-black p-6 sm:p-10 font-sans text-sm max-w-2xl mx-auto border border-black/15 shadow-sm">
        {/* Letterhead */}
        <div className="flex justify-between items-start pb-4 border-b-2 border-black">
          <div className="flex items-start gap-3.5">
            <img
              src="/logo.png"
              alt="Clinic Emblem"
              className="w-14 h-14 rounded-lg object-cover border border-neutral-300"
            />
            <div>
              <h1 className="text-2xl font-bold font-serif tracking-tight text-black">
                {cfg.name}
              </h1>
              <p className="text-xs text-neutral-600 mt-1">{cfg.addr}</p>
              {cfg.phone && <p className="text-xs text-neutral-600">Ph: {cfg.phone}</p>}
            </div>
          </div>
          <div className="text-right">
            {cfg.reg && <p className="text-xs font-semibold text-neutral-700">Reg: {cfg.reg}</p>}
            <p className="text-sm font-bold text-black mt-1 font-serif">{cfg.dr}</p>
          </div>
        </div>

        {/* Patient Demographics */}
        <div className="flex justify-between items-center py-3 border-b border-neutral-300 text-xs">
          <div>
            <span className="font-bold text-sm">{patient?.name || 'Patient'}</span>
            <span className="text-neutral-600 ml-2">
              · {[patient?.age ? `${patient.age} yrs` : '', patient?.sex].filter(Boolean).join(', ')} · Ph: {patient?.phone}
            </span>
          </div>
          <div className="text-right">
            <span className="font-semibold text-neutral-800">{rx.no}</span>
            <span className="text-neutral-500 ml-2">· {formatDate(rx.t)}</span>
          </div>
        </div>

        {/* Allergies / Vitals */}
        {patient?.allergies && (\n          <div className="mt-3 text-xs bg-neutral-100 p-2 rounded border border-neutral-300">
            <span className="font-bold">Allergies:</span> {patient.allergies}
          </div>
        )}

        {(vit.wt || vit.bp || vit.pulse) && (
          <div className="mt-2 text-xs text-neutral-700">
            <span className="font-semibold">Vitals: </span>
            {[
              vit.wt && `Weight: ${vit.wt} kg`,
              vit.bp && `BP: ${vit.bp}`,
              vit.pulse && `Pulse: ${vit.pulse} bpm`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>
        )}

        {/* Diagnosis / Notes */}
        {rx.notes && (
          <div className="mt-3 text-xs">
            <span className="font-bold">Diagnosis & Clinical Notes: </span>
            <span className="whitespace-pre-line text-neutral-800">{rx.notes}</span>
          </div>
        )}

        {/* Prescription Table */}
        <div className="mt-4">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
            Rx / Prescribed Medication & Therapy
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-black text-neutral-600">
                <th className="py-2 pr-2">Medication / Treatment</th>
                <th className="py-2 px-2 w-16 text-center">Qty</th>
                <th className="py-2 px-2 w-16 text-center">Days</th>
                <th className="py-2 pl-2">Dosage & Instructions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {rx.items.map((item, idx) => (\n                <tr key={idx}>\n                  <td className="py-2 pr-2 font-medium">{item.name}</td>
                  <td className="py-2 px-2 text-center">{item.qty}</td>
                  <td className="py-2 px-2 text-center">{item.days || '—'}</td>
                  <td className="py-2 pl-2 text-neutral-700">{item.dose || 'As advised'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Follow-up Notes */}
        {rx.add && rx.add.length > 0 && (
          <div className="mt-4 pt-3 border-t border-dashed border-neutral-300 text-xs space-y-1">
            {rx.add.map((a, i) => (
              <div key={i} className="text-neutral-700">
                <span className="font-bold">Follow-up Note ({formatDate(a.t)} by {a.by}):</span>{' '}
                {a.text}
              </div>
            ))}
          </div>
        )}

        {/* Follow-up */}
        {rx.fu && (
          <div className="mt-4 text-xs font-semibold text-neutral-800">
            Next Follow-up Consultation: {formatDate(rx.fu)}
          </div>
        )}

        {/* Signature Line */}
        <div className="mt-16 flex justify-between items-end pt-4 border-t border-neutral-200">
          <div className="text-[10px] text-neutral-500">
            Generated via Arogya Theeram EMR System · Valid Ayush Prescription
          </div>
          <div className="text-right">
            <div className="w-40 border-b border-black mb-1 ml-auto" />
            <div className="font-bold text-xs">{cfg.dr}</div>
            <div className="text-[11px] text-neutral-600">Authorized Signature</div>
          </div>
        </div>
      </div>
    );
  } else {
    // Invoice
    const inv = state.invs.find((i) => i.id === id);
    if (!inv) return null;
    const patient = getPatient(inv.pid);
    const relatedRx = inv.rxid ? state.rx.find((r) => r.id === inv.rxid) : null;

    content = (
      <div className="print-container bg-white text-black p-6 sm:p-10 font-sans text-sm max-w-2xl mx-auto border border-black/15 shadow-sm">
        {/* Letterhead */}
        <div className="flex justify-between items-start pb-4 border-b-2 border-black">
          <div className="flex items-start gap-3.5">
            <img
              src="/logo.png"
              alt="Clinic Emblem"
              className="w-14 h-14 rounded-lg object-cover border border-neutral-300"
            />
            <div>
              <h1 className="text-2xl font-bold font-serif tracking-tight text-black">
                {cfg.name}
              </h1>
              <p className="text-xs text-neutral-600 mt-1">{cfg.addr}</p>
              {cfg.phone && <p className="text-xs text-neutral-600">Ph: {cfg.phone}</p>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-base font-bold uppercase tracking-wider text-neutral-800">
              Tax Invoice / Receipt
            </div>
            {cfg.reg && <p className="text-xs text-neutral-600">Reg: {cfg.reg}</p>}
          </div>
        </div>

        {/* Invoice Metadata */}
        <div className="flex justify-between items-center py-3 border-b border-neutral-300 text-xs">
          <div>
            <span className="font-bold text-sm">{patient?.name || 'Walk-in Customer'}</span>
            {patient?.phone && patient.phone !== '—' && (
              <span className="text-neutral-600 ml-2">· Ph: {patient.phone}</span>
            )}
          </div>
          <div className="text-right">
            <span className="font-bold text-neutral-800 text-sm">{inv.id}</span>
            <span className="text-neutral-500 ml-2">· {formatDate(inv.t)}</span>
          </div>
        </div>

        {/* Void Alert */}
        {inv.void && (
          <div className="my-3 p-2 bg-neutral-200 border-2 border-black text-center font-bold text-xs uppercase tracking-widest">
            INVOICE CANCELLED · Reason: {inv.void.reason}
          </div>
        )}

        {/* Line Items Table */}
        <table className="w-full text-left text-xs border-collapse mt-4">
          <thead>
            <tr className="border-b border-black text-neutral-600">
              <th className="py-2 pr-2">Item Description</th>
              <th className="py-2 px-2 w-20 text-right">Price</th>
              <th className="py-2 px-2 w-16 text-center">Qty</th>
              <th className="py-2 pl-2 w-24 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {inv.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-2 pr-2">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-[10px] text-neutral-500 capitalize">{item.type}</div>
                </td>
                <td className="py-2 px-2 text-right">{formatMoney(item.price)}</td>
                <td className="py-2 px-2 text-center">{item.qty}</td>
                <td className="py-2 pl-2 text-right font-medium">
                  {formatMoney(item.qty * item.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Financial Summary */}
        <div className="mt-4 pt-3 border-t border-black flex justify-end text-xs">
          <div className="w-64 space-y-1.5">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal:</span>
              <span>{formatMoney(inv.sub)}</span>
            </div>
            {inv.discAmt > 0 && (
              <div className="flex justify-between text-neutral-700">
                <span>Discount ({inv.dt === 'p' ? `${inv.disc}%` : 'Flat'}):</span>
                <span>− {formatMoney(inv.discAmt)}</span>
              </div>
            )}
            {inv.tax > 0 && (
              <div className="flex justify-between text-neutral-600">
                <span>Tax (GST):</span>
                <span>{formatMoney(inv.tax)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm pt-2 border-t border-neutral-300">
              <span>Total Amount:</span>
              <span>{formatMoney(inv.total)}</span>
            </div>
            <div className="flex justify-between text-neutral-700 pt-1">
              <span>Amount Paid:</span>
              <span className="font-semibold">{formatMoney(inv.paid)}</span>
            </div>
            <div className="flex justify-between text-neutral-900 font-bold pt-1 border-t border-neutral-200">
              <span>Balance Due:</span>
              <span>{formatMoney(inv.void ? 0 : Math.max(0, inv.total - inv.paid))}</span>
            </div>
          </div>
        </div>

        {/* Signature Line */}
        <div className="mt-16 flex justify-between items-end pt-4 border-t border-neutral-200">
          <div className="text-[10px] text-neutral-500">
            Thank you for choosing Arogya Theeram · Please retain receipt for records
          </div>
          <div className="text-right">
            <div className="w-40 border-b border-black mb-1 ml-auto" />
            <div className="font-bold text-xs">{cfg.name}</div>
            <div className="text-[11px] text-neutral-600">Authorized Signatory</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 print-wrapper">
      {/* Action Toolbar on Screen */}
      <div className="no-print max-w-2xl mx-auto w-full mb-3 flex items-center justify-between bg-white px-4 py-2.5 rounded-xl shadow-lg border border-neutral-200">
        <span className="text-xs font-semibold text-neutral-700">
          Print Preview · {type === 'rx' ? 'Prescription' : 'Tax Invoice'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--ac)] text-white text-xs font-semibold hover:bg-[var(--ac-hover)] transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Now</span>
          </button>
          <button
            onClick={() => setPrintData(null)}
            className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Printable Paper Document */}
      <div className="my-auto">{content}</div>
    </div>
  );
}
