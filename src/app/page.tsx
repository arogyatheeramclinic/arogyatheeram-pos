'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import AuthModal from '@/components/AuthModal';
import Toast from '@/components/Toast';

// Tabs
import ReceptionTab from '@/components/tabs/ReceptionTab';
import DoctorTab from '@/components/tabs/DoctorTab';
import DashboardTab from '@/components/tabs/DashboardTab';
import PatientsTab from '@/components/tabs/PatientsTab';
import InventoryTab from '@/components/tabs/InventoryTab';
import ActivityLogTab from '@/components/tabs/ActivityLogTab';
import SettingsTab from '@/components/tabs/SettingsTab';

// Modals
import ConsultationModal from '@/components/modals/ConsultationModal';
import BillingModal from '@/components/modals/BillingModal';
import PrintView from '@/components/print/PrintView';

export default function Home() {
  const { currentUser, currentTab, activeConsultation, activeBill, printData } = useClinic();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold font-serif text-[var(--ink)]">Arogya Theeram</h2>
          <div className="w-10 h-0.5 bg-[var(--brass)] mx-auto mt-2 rounded-full" />
        </div>
      </main>
    );
  }

  // If user is not authenticated, render login modal
  if (!currentUser) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
        <AuthModal />
        <Toast />
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)] text-[var(--ink)]">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onToggleSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'reception' && <ReceptionTab />}
          {currentTab === 'doctor' && <DoctorTab />}
          {currentTab === 'dash' && <DashboardTab />}
          {currentTab === 'pts' && <PatientsTab />}
          {currentTab === 'stock' && <InventoryTab />}
          {currentTab === 'log' && <ActivityLogTab />}
          {currentTab === 'set' && <SettingsTab />}
        </main>
      </div>

      {/* Global Interactive Modals */}
      {activeConsultation && <ConsultationModal />}
      {activeBill && <BillingModal />}
      {printData && <PrintView />}
      <Toast />
    </div>
  );
}
