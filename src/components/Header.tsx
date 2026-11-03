'use client';

import React from 'react';
import { useClinic } from '@/context/ClinicContext';
import { Menu } from 'lucide-react';

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
  const { currentTab, currentUser } = useClinic();

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
