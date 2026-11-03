'use client';

import React, { useState, useRef } from 'react';
import { useClinic } from '@/context/ClinicContext';
import {
  Settings,
  Building2,
  Users,
  BookmarkCheck,
  Database,
  Download,
  Upload,
  RotateCcw,
  KeyRound,
  UserPlus,
  Trash2,
} from 'lucide-react';

export default function SettingsTab() {
  const {
    state,
    currentUser,
    saveClinicConfig,
    updateUserPin,
    addUser,
    deleteTemplate,
    exportDatabase,
    importDatabase,
    resetDatabase,
  } = useClinic();

  // Clinic config form
  const [cfgName, setCfgName] = useState(state.cfg.name);
  const [cfgPhone, setCfgPhone] = useState(state.cfg.phone);
  const [cfgAddr, setCfgAddr] = useState(state.cfg.addr);
  const [cfgReg, setCfgReg] = useState(state.cfg.reg);
  const [cfgDr, setCfgDr] = useState(state.cfg.dr);

  // New staff form
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'doctor' | 'reception'>('reception');
  const [newStaffPin, setNewStaffPin] = useState('');

  // Update staff pin inputs: { [userId]: pin }
  const [pinInputs, setPinInputs] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveClinicConfig({
      name: cfgName.trim() || 'Arogya Theeram Ayurvedic Clinic',
      phone: cfgPhone.trim(),
      addr: cfgAddr.trim(),
      reg: cfgReg.trim(),
      dr: cfgDr.trim(),
    });
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffPin) return;
    addUser(newStaffName, newStaffRole, newStaffPin);
    setNewStaffName('');
    setNewStaffPin('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importDatabase(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Clinic Details */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[var(--sf-card)] border border-[var(--hl)] shadow-[var(--lift)]">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--hl)]">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[var(--ac)]" />
            <h3 className="text-lg font-semibold font-serif text-[var(--ink)]">
              Clinic Profile & Letterhead
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <img
              src="/logo.webp"
              alt="Clinic Logo"
              className="w-8 h-8 rounded-lg object-cover border border-[var(--hl)] shadow-2xs"
            />
            <span className="text-xs font-medium text-[var(--s2)] hidden sm:inline">Official Emblem</span>
          </div>
        </div>
        <p className="text-xs text-[var(--s2)] mt-1">
          These details are automatically printed on official patient prescriptions and tax receipts.
        </p>

        <form onSubmit={handleSaveConfig} className="mt-4 space-y-3 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[var(--s2)] mb-1">
                Clinic Name
              </label>
              <input
                type=\"text\"
                value={cfgName}
                onChange={(e) => setCfgName(e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-lg border border-[var(--hl)] bg-white text-[var(--ink)]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[var(--s2)] mb-1">
                Phone Number
              </label>
              <input
                type=\"text\"
                value={cfgPhone}
                onChange={(e) => setCfgPhone(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-[var(--hl)] bg-white text-[var(--ink)]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[var(--s2)] mb-1">
              Clinic Physical Address
            </label>
            <input
              type=\"text\"
              value={cfgAddr}
              onChange={(e) => setCfgAddr(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-[var(--hl)] bg-white text-[var(--ink)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[var(--s2)] mb-1">
                AYUSH Registration Number
              </label>
              <input
                type=\"text\"
                placeholder=\"e.g. AYUSH-KL-2024-8891\"
                value={cfgReg}
                onChange={(e) => setCfgReg(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-[var(--hl)] bg-white text-[var(--ink)]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[var(--s2)] mb-1">
                Chief Doctor Name & Qualifications
              </label>
              <input
                type=\"text\"
                placeholder=\"e.g. Dr. Arya Varma, BAMS, MD (Ayurveda)\"
                value={cfgDr}
                onChange={(e) => setCfgDr(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-[var(--hl)] bg-white text-[var(--ink)]"
              />
            </div>
          </div>

          <div className=\"pt-2\">
            <button
              type=\"submit\"
              className=\"px-4 py-2 rounded-lg bg-[var(--ac)] text-white text-xs font-semibold hover:bg-[var(--ac-hover)] transition-colors shadow-xs\"
            >
              Save Clinic Letterhead
            </button>
          </div>
        </form>
      </div>

      {/* Staff & PIN Management */}
      <div className=\"p-5 sm:p-6 rounded-2xl bg-[var(--sf-card)] border border-[var(--hl)] shadow-[var(--lift)]\">
        <div className=\"flex items-center gap-2 pb-3 border-b border-[var(--hl)]\">
          <Users className=\"w-5 h-5 text-[var(--ac)]\" />
          <h3 className=\"text-lg font-semibold font-serif text-[var(--ink)]\">
            Staff Access & PIN Credentials
          </h3>
        </div>

        <div className=\"mt-4 divide-y divide-[var(--hl)]/50 max-h-60 overflow-y-auto\">
          {state.users.map((u) => (
            <div
              key={u.id}
              className=\"py-3 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm\"
            >
              <div>
                <div className=\"flex items-center gap-2\">
                  <span className=\"font-bold text-[var(--ink)]\">{u.name}</span>
                  <span className=\"text-[10px] capitalize font-bold px-2 py-0.5 rounded bg-[var(--sage)] text-[var(--ac)]\">
                    {u.role}
                  </span>
                </div>
              </div>

              <div className=\"flex items-center gap-2\">
                <input
                  type=\"password\"
                  inputMode=\"numeric\"
                  maxLength={8}
                  placeholder=\"New PIN (4-8 digits)\"
                  value={pinInputs[u.id] || ''}
                  onChange={(e) =>
                    setPinInputs((prev) => ({ ...prev, [u.id]: e.target.value }))
                  }
                  className=\"w-36 px-2.5 py-1 text-xs border border-[var(--hl)] rounded-md bg-white text-[var(--ink)]\"
                />
                <button
                  type=\"button\"
                  onClick={() => {
                    const pin = pinInputs[u.id];
                    if (pin) {
                      updateUserPin(u.id, pin);
                      setPinInputs((prev) => ({ ...prev, [u.id]: '' }));
                    }
                  }}
                  className=\"px-3 py-1 text-xs rounded-md border border-[var(--hl)] bg-white text-[var(--s2)] hover:bg-[var(--sf)] font-medium\"
                >
                  Update PIN
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Staff Member Form */}
        <form onSubmit={handleAddStaff} className=\"mt-4 pt-3 border-t border-[var(--hl)] text-xs\">
          <div className=\"text-xs font-bold text-[var(--s2)] uppercase tracking-wider mb-2\">
            Add New Staff Member
          </div>
          <div className=\"grid grid-cols-1 sm:grid-cols-4 gap-2\">
            <input
              type=\"text\"
              placeholder=\"Staff Full Name\"
              value={newStaffName}
              onChange={(e) => setNewStaffName(e.target.value)}
              required
              className=\"px-2.5 py-1.5 border border-[var(--hl)] rounded-lg bg-white sm:col-span-2\"
            />
            <select
              value={newStaffRole}
              onChange={(e) => setNewStaffRole(e.target.value as 'doctor' | 'reception')}
              className=\"px-2.5 py-1.5 border border-[var(--hl)] rounded-lg bg-white\"
            >
              <option value=\"reception\">Reception</option>
              <option value=\"doctor\">Doctor</option>
            </select>
            <input
              type=\"password\"
              inputMode=\"numeric\"
              placeholder=\"4-8 digit PIN\"
              value={newStaffPin}
              onChange={(e) => setNewStaffPin(e.target.value)}
              required
              className=\"px-2.5 py-1.5 border border-[var(--hl)] rounded-lg bg-white\"
            />
          </div>
          <div className=\"mt-2.5\">
            <button
              type=\"submit\"
              className=\"px-4 py-1.5 rounded-lg bg-[var(--ac)] text-white font-medium hover:bg-[var(--ac-hover)] transition-colors flex items-center gap-1.5\"
            >
              <UserPlus className=\"w-3.5 h-3.5\" />
              <span>Add Staff</span>
            </button>
          </div>
        </form>
      </div>

      {/* Prescription Templates */}
      <div className=\"p-5 sm:p-6 rounded-2xl bg-[var(--sf-card)] border border-[var(--hl)] shadow-[var(--lift)]\">
        <div className=\"flex items-center gap-2 pb-3 border-b border-[var(--hl)]\">
          <BookmarkCheck className=\"w-5 h-5 text-[var(--ac)]\" />
          <h3 className=\"text-lg font-semibold font-serif text-[var(--ink)]\">
            Prescription Templates ({state.tp.length})
          </h3>
        </div>
        <p className=\"text-xs text-[var(--s2)] mt-1\">
          Reusable clinical protocols created in the Doctor consultation window.
        </p>

        <div className=\"mt-4 divide-y divide-[var(--hl)]/50\">
          {state.tp.length === 0 ? (\n            <div className=\"p-4 text-center text-xs text-[var(--s2)]\">\n              No templates saved yet. You can save any active consultation as a protocol template.\n            </div>\n          ) : (\n            state.tp.map((template) => (\n              <div\n                key={template.id}\n                className=\"py-2.5 flex items-center justify-between text-xs sm:text-sm\"\n              >\n                <div>\n                  <span className=\"font-semibold text-[var(--ink)]\">{template.name}</span>\n                  <span className=\"text-xs text-[var(--s2)] ml-2\">\n                    · {template.items.length} items included\n                  </span>\n                </div>\n                <button\n                  onClick={() => deleteTemplate(template.id)}\n                  className=\"p-1 rounded text-[var(--s2)] hover:text-[var(--err)] hover:bg-[var(--err-bg)]/40\"\n                  title=\"Delete Template\"\n                >\n                  <Trash2 className=\"w-4 h-4\" />\n                </button>\n              </div>\n            ))\n          )}\n        </div>\n      </div>\n\n      {/* Database Backup & Restore */}\n      <div className=\"p-5 sm:p-6 rounded-2xl bg-[var(--sf-card)] border border-[var(--hl)] shadow-[var(--lift)]\">\n        <div className=\"flex items-center gap-2 pb-3 border-b border-[var(--hl)]\">\n          <Database className=\"w-5 h-5 text-[var(--ac)]\" />\n          <h3 className=\"text-lg font-semibold font-serif text-[var(--ink)]\">\n            Data Backup & Migration\n          </h3>\n        </div>\n        <p className=\"text-xs text-[var(--s2)] mt-1\">\n          Export full clinic records (patients, queue, billing, inventory, and logs) to a JSON file, or restore from a previous backup.\n        </p>\n\n        <div className=\"mt-4 flex flex-wrap items-center gap-3\">\n          <button\n            onClick={exportDatabase}\n            className=\"flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--ac)] text-white text-xs font-semibold hover:bg-[var(--ac-hover)] transition-colors shadow-xs\"\n          >\n            <Download className=\"w-4 h-4\" />\n            <span>Export Full Database (.json)</span>\n          </button>\n\n          <button\n            onClick={() => fileInputRef.current?.click()}\n            className=\"flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--hl)] bg-white text-[var(--s2)] text-xs font-semibold hover:bg-[var(--sf)] transition-colors shadow-xs\"\n          >\n            <Upload className=\"w-4 h-4\" />\n            <span>Restore Backup</span>\n          </button>\n          <input\n            type=\"file\"\n            ref={fileInputRef}\n            onChange={handleFileUpload}\n            accept=\".json\"\n            className=\"hidden\"\n          />\n\n          <button\n            onClick={() => {\n              if (\n                window.confirm(\n                  'Are you sure you want to reset all data back to the demo clinic seed state?'\n                )\n              ) {\n                resetDatabase();\n              }\n            }}\n            className=\"flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--err)]/30 text-[var(--err)] text-xs font-medium hover:bg-[var(--err-bg)]/40 transition-colors ml-auto\"\n          >\n            <RotateCcw className=\"w-3.5 h-3.5\" />\n            <span>Reset Demo Data</span>\n          </button>\n        </div>\n      </div>\n    </div>\n  );\n}\n