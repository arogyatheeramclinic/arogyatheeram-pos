'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import {
  formatDate,
  formatDateTime,
  formatMoney,
  getTodayDate,
} from '@/lib/utils';
import {
  Package,
  Plus,
  SlidersHorizontal,
  Edit,
  ArrowDownToLine,
  AlertTriangle,
  History,
} from 'lucide-react';
import { InventoryItem } from '@/types';
import StockReceiveModal from '../modals/StockReceiveModal';
import StockAdjustModal from '../modals/StockAdjustModal';
import ItemModal from '../modals/ItemModal';

export default function InventoryTab() {
  const { state, currentUser } = useClinic();

  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);

  const todayStr = getTodayDate();
  const soonStr = new Date(Date.now() + 60 * 86400000).toLocaleDateString('en-CA');

  // Filter inventory movement logs
  const inventoryLogs = state.log
    .filter((l) => l.type === 'inventory')
    .slice(0, 15);

  return (
    <div className="space-y-6">
      {/* Inventory Catalogue Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[var(--sf-card)] border border-[var(--hl)] shadow-[var(--lift)]">
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[var(--hl)] gap-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[var(--ac)]" />
            <h3 className="text-lg font-semibold font-serif text-[var(--ink)]">
              Medicines & Treatments Inventory
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsReceiveModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--hl)] bg-[var(--sf)] text-[var(--ac)] text-xs font-semibold hover:bg-[var(--sage)] transition-colors shadow-xs"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>Receive Stock Batch</span>
            </button>
            {currentUser?.role === 'doctor' && (
              <button
                onClick={() => setIsNewItemModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--ac)] text-white text-xs font-semibold hover:bg-[var(--ac-hover)] transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>New Item</span>
              </button>
            )}
          </div>
        </div>

        {/* Inventory Items Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-[var(--sf)] text-[var(--s2)] border-b border-[var(--hl)]">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Item & Type</th>
                <th className="px-3 py-2.5 font-semibold">Selling Price</th>
                <th className="px-3 py-2.5 font-semibold">Tax %</th>
                <th className="px-3 py-2.5 font-semibold">Current Stock</th>
                <th className="px-3 py-2.5 font-semibold">Next Expiry</th>
                <th className="px-3 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hl)]/60">
              {state.inv.map((item) => {
                const earliestExpiry = (item.batches || [])
                  .filter((b) => b.qty > 0 && b.exp)
                  .map((b) => b.exp)
                  .sort()[0];

                const isLow = item.stock !== null && item.stock <= item.low;
                const isExpired = earliestExpiry && earliestExpiry < todayStr;
                const isSoon = earliestExpiry && earliestExpiry <= soonStr;

                return (\n                  <tr key={item.id} className=\"hover:bg-[var(--bg)]/40 transition-colors\">\n                    <td className=\"px-3 py-3\">\n                      <div className=\"font-bold text-[var(--ink)]\">{item.name}</div>\n                      <div className=\"text-[11px] text-[var(--s2)] capitalize flex items-center gap-2 mt-0.5\">\n                        <span className=\"px-1.5 py-0.2 rounded bg-[var(--sage)] text-[var(--ac)]\">\n                          {item.type}\n                        </span>\n                        {item.sess && item.sess > 1 && (\n                          <span>· {item.sess} sessions/pkg</span>\n                        )}\n                      </div>\n                    </td>\n                    <td className=\"px-3 py-3 font-semibold text-[var(--ink)]\">\n                      {formatMoney(item.price)}\n                    </td>\n                    <td className=\"px-3 py-3 text-[var(--s2)]\">{item.tax || 0}%</td>\n                    <td className=\"px-3 py-3\">\n                      {item.stock === null ? (\n                        <span className=\"text-[var(--s2)]\">Clinical Therapy</span>\n                      ) : (\n                        <div className=\"flex items-center gap-1.5\">\n                          <span className=\"font-bold text-[var(--ink)]\">{item.stock}</span>\n                          {isLow && (\n                            <span className=\"text-[10px] px-1.5 py-0.5 rounded bg-[var(--err-bg)] text-[var(--err)] font-bold\">\n                              Low Stock\n                            </span>\n                          )}\n                        </div>\n                      )}\n                    </td>\n                    <td className=\"px-3 py-3\">\n                      {earliestExpiry ? (\n                        <span\n                          className={`text-xs px-2 py-0.5 rounded font-medium ${\n                            isExpired\n                              ? 'bg-[var(--err)] text-white font-bold'\n                              : isSoon\n                              ? 'bg-[var(--err-bg)] text-[var(--err)] font-semibold'\n                              : 'text-[var(--s2)]'\n                          }`}\n                        >\n                          {formatDate(earliestExpiry)}\n                        </span>\n                      ) : (\n                        <span className=\"text-[var(--s2)]\">—</span>\n                      )}\n                    </td>\n                    <td className=\"px-3 py-3 text-right\">\n                      <div className=\"flex items-center justify-end gap-1.5\">\n                        {currentUser?.role === 'doctor' && (\n                          <button\n                            onClick={() => setEditItem(item)}\n                            className=\"px-2.5 py-1 text-xs rounded border border-[var(--hl)] bg-white text-[var(--s2)] hover:bg-[var(--sf)] flex items-center gap-1\"\n                          >\n                            <Edit className=\"w-3 h-3\" />\n                            <span>Edit</span>\n                          </button>\n                        )}\n                        {item.stock !== null && (\n                          <button\n                            onClick={() => setAdjustItem(item)}\n                            className=\"px-2.5 py-1 text-xs rounded border border-[var(--hl)] bg-white text-[var(--s2)] hover:bg-[var(--sf)] flex items-center gap-1\"\n                          >\n                            <SlidersHorizontal className=\"w-3 h-3\" />\n                            <span>Adjust</span>\n                          </button>\n                        )}\n                      </div>\n                    </td>\n                  </tr>\n                );\n              })}\n            </tbody>\n          </table>\n        </div>\n      </div>\n\n      {/* Recent Stock Movements Feed */}\n      <div className=\"p-5 sm:p-6 rounded-2xl bg-[var(--sf-card)] border border-[var(--hl)] shadow-[var(--lift)]\">\n        <div className=\"flex items-center gap-2 pb-3 border-b border-[var(--hl)]\">\n          <History className=\"w-5 h-5 text-[var(--ac)]\" />\n          <h3 className=\"text-base font-semibold font-serif text-[var(--ink)]\">\n            Recent Stock Movements & Adjustments\n          </h3>\n        </div>\n        <div className=\"mt-3 divide-y divide-[var(--hl)]/50 max-h-60 overflow-y-auto\">\n          {inventoryLogs.length === 0 ? (\n            <div className=\"p-4 text-center text-xs text-[var(--s2)]\">\n              No inventory movements recorded yet.\n            </div>\n          ) : (\n            inventoryLogs.map((log, idx) => (\n              <div key={idx} className=\"py-2.5 flex items-center justify-between text-xs\">\n                <div>\n                  <span className=\"font-medium text-[var(--ink)]\">{log.msg}</span>\n                  <span className=\"text-[var(--s2)] ml-2\">by {log.by}</span>\n                </div>\n                <span className=\"text-[var(--s2)]\">{formatDateTime(log.t)}</span>\n              </div>\n            ))\n          )}\n        </div>\n      </div>\n\n      {/* Modals */}\n      <StockReceiveModal\n        isOpen={isReceiveModalOpen}\n        onClose={() => setIsReceiveModalOpen(false)}\n      />\n\n      {adjustItem && (\n        <StockAdjustModal\n          item={adjustItem}\n          isOpen={true}\n          onClose={() => setAdjustItem(null)}\n        />\n      )}\n\n      {editItem && (\n        <ItemModal\n          item={editItem}\n          isOpen={true}\n          onClose={() => setEditItem(null)}\n        />\n      )}\n\n      <ItemModal\n        isOpen={isNewItemModalOpen}\n        onClose={() => setIsNewItemModalOpen(false)}\n      />\n    </div>\n  );\n}\n