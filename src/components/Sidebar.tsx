'use client';

import React from 'react';
import { useClinic } from '@/context/ClinicContext';
import { TabKey, Role } from '@/types';
import {
  Users,
  Stethoscope,
  LayoutDashboard,
  UserSquare2,
  Package,
  History,
  Settings,
  LogOut,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const TAB_CONFIG: {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}[] = [
  { key: 'reception', label: 'Reception', icon: Users, roles: ['reception', 'doctor'] },
  { key: 'doctor', label: 'Consultations', icon: Stethoscope, roles: ['doctor'] },
  { key: 'dash', label: 'Dashboard', icon: LayoutDashboard, roles: ['doctor'] },
  { key: 'pts', label: 'Patients', icon: UserSquare2, roles: ['doctor', 'reception'] },
  { key: 'stock', label: 'Medicines & Stock', icon: Package, roles: ['doctor', 'reception'] },
  { key: 'log', label: 'Activity History', icon: History, roles: ['doctor'] },
  { key: 'set', label: 'Settings', icon: Settings, roles: ['doctor'] },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { state, currentUser, currentTab, setCurrentTab, logout } = useClinic();

  if (!currentUser) return null;

  const userRole = currentUser.role;
  const accessibleTabs = TAB_CONFIG.filter((t) => t.roles.includes(userRole));

  // Count badges
  const unbilledRxCount = state.rx.filter(
    (r) => !state.invs.some((i) => i.rxid === r.id && !i.void)
  ).length;

  const waitingDoctorCount = state.vis.filter(
    (v) => v.st !== 'done' && !v.cancelled
  ).length;

  const lowStockCount = state.inv.filter(
    (i) => i.stock !== null && i.stock <= i.low
  ).length;

  const handleTabClick = (tabKey: TabKey) => {
    setCurrentTab(tabKey);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Scrim */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[var(--ink)]/30 backdrop-blur-xs transition-opacity lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Drawer Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-[var(--sf)] border-r border-[var(--hl)] flex flex-col p-5 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:static lg:shadow-none'
        }`}
        aria-label="Sidebar Navigation"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[var(--hl)]/50">
          <div className="flex items-center gap-3">
            <img
              src="/logo.webp"
              alt="Arogya Theeram Logo"
              className="w-10 h-10 rounded-xl object-cover border border-[var(--hl)] shadow-xs"
            />
            <div>
              <h2 className="text-lg font-semibold text-[var(--ink)] font-serif tracking-tight leading-none">
                Arogya Theeram
              </h2>
              <div className="w-8 h-0.5 bg-[var(--brass)] mt-1.5 rounded-full" />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--s2)] hover:bg-[var(--hl)]/40 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <nav className="mt-6 flex-1 space-y-1.5 overflow-y-auto">
          {accessibleTabs.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.key;
            let badge = 0;
            if (item.key === 'reception') badge = unbilledRxCount;
            if (item.key === 'doctor') badge = waitingDoctorCount;
            if (item.key === 'stock') badge = lowStockCount;

            return (
              <button
                key={item.key}
                onClick={() => handleTabClick(item.key)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[var(--sage)] text-[var(--ac)] border border-[var(--hl)] shadow-xs font-semibold'
                    : 'text-[var(--s2)] hover:bg-[var(--hl)]/30 hover:text-[var(--ink)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--ac)]' : 'text-[var(--s2)]'}`} />
                  <span>{item.label}</span>
                </div>
                {badge > 0 && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                      item.key === 'stock'
                        ? 'bg-[var(--err-bg)] text-[var(--err)]'
                        : 'bg-[var(--ac)] text-white'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Sign Out */}
        <div className="pt-4 border-t border-[var(--hl)] mt-auto">
          <div className="flex items-center justify-between text-xs text-[var(--s2)] mb-1">
            <span>Signed in as</span>
            <span className="capitalize px-1.5 py-0.5 rounded bg-[var(--sage)] text-[var(--ac)] font-medium">
              {currentUser.role}
            </span>
          </div>
          <div className="text-sm font-semibold text-[var(--ink)] truncate">
            {currentUser.name}
          </div>
          <button
            onClick={logout}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-[var(--hl)] bg-[var(--bg)] text-[var(--s2)] hover:text-[var(--err)] hover:border-[var(--err)]/40 hover:bg-[var(--err-bg)]/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
