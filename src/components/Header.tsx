'use client';

import React from 'react';
import { useClinic } from '@/context/ClinicContext';
import { Menu, Cloud, RefreshCw, Database, CloudOff } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const TAB_TITLES: Record<string, string> = {
  reception: 'Reception & Patient Check-In',
  doctor: 'Consultations & Patient Queue',
  dash: 'Clinic Performance & Revenue Dashboard',
  pts: 'Patient Medical Records',
  stock: 'Medicines & Treatments Stock',
  log: 'Clinic Activity History',
  set: 'Clinic Profile & Settings',
};

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { currentTab, currentUser, syncStatus, retrySync } = useClinic();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--hl)]">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg border border-[var(--hl)] text-[var(--ink)] hover:bg-[var(--sf)] transition-colors"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <img
            src="/logo-sm.webp"
            alt="Arogya Theeram Logo"
            className="w-7 h-7 rounded-lg object-cover border border-[var(--hl)] shadow-2xs lg:hidden"
          />
          <h1 className="text-lg sm:text-xl font-semibold text-[var(--ink)] font-serif">
            {TAB_TITLES[currentTab] || 'Arogya Theeram'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Cloud Backend Sync Status Pill */}
        <div className="flex items-center">
          {syncStatus === 'connected' && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs"
              title="Supabase Cloud PostgreSQL Active & Synchronized"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Cloud Active</span>
            </div>
          )}
          {syncStatus === 'syncing' && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200/80 shadow-2xs"
              title="Synchronizing with Supabase Cloud..."
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span className="hidden sm:inline">Syncing...</span>
            </div>
          )}
          {syncStatus === 'pending-schema' && (
            <button
              type="button"
              onClick={() => retrySync()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
              title="Supabase connected. Schema pending execution in SQL Editor. Click to retry sync."
            >
              <Database className="w-3.5 h-3.5 text-amber-600" />
              <span>Cloud Ready (Run SQL Schema)</span>
            </button>
          )}
          {syncStatus === 'offline' && (
            <button
              type="button"
              onClick={() => retrySync()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200 transition-colors shadow-2xs cursor-pointer"
              title="Working in local offline cache mode. Click to recheck cloud connection."
            >
              <CloudOff className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">Local Cache (Offline)</span>
            </button>
          )}
        </div>

        {currentUser && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--s2)] hidden md:inline">
              {currentUser.name}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--sage)] text-[var(--ac)] border border-[var(--ac)]/20">
              {currentUser.role}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
