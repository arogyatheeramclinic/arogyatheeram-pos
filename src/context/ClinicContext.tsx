'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  ClinicState,
  User,
  TabKey,
  Patient,
  Visit,
  Prescription,
  Invoice,
  Payment,
  TreatmentPackage,
  Appointment,
  PrescriptionTemplate,
  ActivityLog,
  InventoryItem,
  PrescriptionItem,
  InvoiceItem,
  Vitals,
} from '@/types';
import { loadClinicState, saveClinicState, getInitialSeedData } from '@/lib/storage';
import {
  hashPin,
  generateUid,
  takeStock,
  restockItem,
  syncStock,
  calculateBill,
  formatMoney,
  getAvailableStock,
  checkAllergyMatch,
} from '@/lib/utils';
import { testSupabaseConnection, supabase } from '@/lib/supabase';
import {
  fetchCloudClinicState,
  seedSupabaseInitialData,
  syncPatientToCloud,
  syncVisitToCloud,
  syncPrescriptionToCloud,
  syncInvoiceToCloud,
  syncPaymentToCloud,
  syncInventoryItemToCloud,
  syncAppointmentToCloud,
  syncTreatmentPackageToCloud,
  syncClinicConfigToCloud,
  syncPrescriptionTemplateToCloud,
  syncActivityLogToCloud,
} from '@/lib/supabaseSync';

export interface DraftConsultation {
  vid: string;
  pid: string;
  notes: string;
  items: PrescriptionItem[];
  vit: Vitals;
  fu: string;
  hasConfirmedAllergyWarning?: boolean;
}

export interface DraftBill {
  rxid?: string | null;
  pid: string;
  items: InvoiceItem[];
  disc: number;
  dt: 'p' | 'f';
  pm: string;
  pref: string;
  paid: string; // string input, converted on finalize
}

interface ClinicContextType {
  state: ClinicState;
  currentUser: User | null;
  currentTab: TabKey;
  setCurrentTab: (tab: TabKey) => void;
  syncStatus: 'connected' | 'syncing' | 'offline' | 'pending-schema';
  retrySync: () => Promise<void>;
  login: (userId: string, pin: string) => { success: boolean; error?: string };
  logout: () => void;
  toast: { message: string; isError?: boolean } | null;
  showToast: (message: string, isError?: boolean) => void;

  // Patient Actions
  registerPatient: (data: Omit<Patient, 'id' | 't'>) => Patient;
  updatePatient: (id: string, data: Partial<Patient>) => void;
  getPatient: (id: string) => Patient | undefined;

  // Queue / Visits
  checkInPatient: (patientId: string, isUrgent?: boolean) => void;
  toggleVisitUrgent: (visitId: string) => void;
  cancelVisit: (visitId: string, reason: string) => void;

  // Doctor / Consultations
  activeConsultation: DraftConsultation | null;
  startConsultation: (visitId: string) => void;
  updateActiveConsultation: (updater: (prev: DraftConsultation) => DraftConsultation) => void;
  cancelConsultation: () => void;
  savePrescription: () => boolean;
  repeatLastPrescription: () => void;
  applyTemplate: (templateId: string) => void;
  saveCurrentAsTemplate: (name: string) => void;
  deleteTemplate: (templateId: string) => void;
  addPrescriptionAddendum: (rxId: string, text: string) => void;

  // Billing / POS
  activeBill: DraftBill | null;
  startBillingSession: (rxId?: string | null, patientId?: string) => void;
  updateActiveBill: (updater: (prev: DraftBill) => DraftBill) => void;
  cancelBillingSession: () => void;
  finalizeInvoice: () => boolean;
  recordPayment: (invoiceId: string, amount: number, method: string, ref?: string) => void;
  voidInvoice: (invoiceId: string, reason: string) => void;

  // Inventory
  saveInventoryItem: (item: Partial<InventoryItem> & { name: string; price: number; type: 'medicine' | 'treatment' }) => void;
  receiveStockBatch: (itemId: string, batchNo: string, exp: string, qty: number, cost: number, supplier?: string) => void;
  adjustStockBatch: (itemId: string, batchId: string, delta: number, reason: string, note?: string) => void;
  toggleFavoriteItem: (itemId: string) => void;
  recordTreatmentSession: (packageId: string) => void;

  // Appointments
  bookAppointment: (patientId: string, date: string, time: string, note?: string, refRxId?: string) => void;
  updateAppointmentStatus: (appointmentId: string, status: Appointment['st']) => void;
  dismissFollowUp: (rxId: string) => void;

  // Clinic Config & Staff
  saveClinicConfig: (config: ClinicState['cfg']) => void;
  updateUserPin: (userId: string, newPin: string) => void;
  addUser: (name: string, role: 'doctor' | 'reception', pin: string) => void;

  // Print Modal
  printData: { type: 'rx' | 'inv'; id: string } | null;
  setPrintData: (data: { type: 'rx' | 'inv'; id: string } | null) => void;
  triggerPrint: (type: 'rx' | 'inv', id: string) => void;

  // Backup / Restore
  exportDatabase: () => void;
  importDatabase: (jsonString: string) => boolean;
  resetDatabase: () => void;
}

const ClinicContext = createContext<ClinicContextType | null>(null);

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ClinicState>(getInitialSeedData);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<TabKey>('reception');
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);
  const [toastTimer, setToastTimer] = useState<NodeJS.Timeout | null>(null);

  const [activeConsultation, setActiveConsultation] = useState<DraftConsultation | null>(null);
  const [activeBill, setActiveBill] = useState<DraftBill | null>(null);
  const [printData, setPrintData] = useState<{ type: 'rx' | 'inv'; id: string } | null>(null);
  const [loginAttempts, setLoginAttempts] = useState<number>(0);
  const [lockoutUntil, setLockoutUntil] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'offline' | 'pending-schema'>('syncing');

  // Supabase Cloud Synchronizer
  const performCloudSync = useCallback(async () => {
    try {
      setSyncStatus('syncing');
      const conn = await testSupabaseConnection();
      if (!conn.connected) {
        setSyncStatus('offline');
        return;
      }
      if (!conn.hasTables) {
        setSyncStatus('pending-schema');
        return;
      }
      const remote = await fetchCloudClinicState();
      if (remote && remote.inv && remote.inv.length > 0) {
        setState(remote);
        saveClinicState(remote);
        setSyncStatus('connected');
      } else if (remote && remote.inv && remote.inv.length === 0) {
        const currentData = loadClinicState();
        await seedSupabaseInitialData(currentData);
        setSyncStatus('connected');
      } else {
        setSyncStatus('connected');
      }
    } catch (err) {
      console.warn('[Supabase Sync Error]:', err);
      setSyncStatus('offline');
    }
  }, []);

  // Initialize from LocalStorage and Cloud
  useEffect(() => {
    const loaded = loadClinicState();
    setState(loaded);
    // Check saved session
    const savedUserId = sessionStorage.getItem('arogya_uid');
    if (savedUserId) {
      const user = loaded.users.find((u) => u.id === savedUserId);
      if (user) {
        setCurrentUser(user);
        if (user.role === 'doctor') {
          setCurrentTab('doctor');
        }
      }
    }

    // Connect to Supabase
    performCloudSync();

    // Subscribe to realtime changes for cross-terminal synchrony
    const channel = supabase
      .channel('clinic_realtime_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, () => performCloudSync())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions' }, () => performCloudSync())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => performCloudSync())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => performCloudSync())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [performCloudSync]);

  // Save state on changes
  const updateState = useCallback((updater: (prev: ClinicState) => ClinicState) => {
    setState((prev) => {
      const next = updater(prev);
      saveClinicState(next);
      return next;
    });
  }, []);

  const showToast = useCallback((message: string, isError = false) => {
    if (toastTimer) clearTimeout(toastTimer);
    setToast({ message, isError });
    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);
    setToastTimer(timer);
  }, [toastTimer]);

  const addLog = useCallback(
    (type: ActivityLog['type'], msg: string, pid?: string | null) => {
      const newLogItem: ActivityLog = {
        t: Date.now(),
        pid,
        type,
        msg,
        by: currentUser?.name || 'System',
      };
      updateState((prev) => ({
        ...prev,
        log: [newLogItem, ...prev.log],
      }));
      syncActivityLogToCloud(newLogItem);
    },
    [currentUser, updateState]
  );

  const login = (userId: string, pin: string) => {
    if (lockoutUntil > Date.now()) {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      return { success: false, error: `Too many failed attempts. Try again in ${remaining}s.` };
    }
    const user = state.users.find((u) => u.id === userId);
    if (!user || user.pin !== hashPin(pin)) {
      const nextAttempts = loginAttempts + 1;
      setLoginAttempts(nextAttempts);
      if (nextAttempts >= 5) {
        setLockoutUntil(Date.now() + 30000);
        setLoginAttempts(0);
      }
      return { success: false, error: 'Incorrect PIN.' };
    }
    setLoginAttempts(0);
    setCurrentUser(user);
    sessionStorage.setItem('arogya_uid', user.id);
    if (user.role === 'doctor') {
      setCurrentTab('doctor');
    } else {
      setCurrentTab('reception');
    }
    addLog('login', `${user.name} signed in`);
    showToast(`Welcome back, ${user.name}`);
    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      addLog('login', `${currentUser.name} signed out`);
    }
    setCurrentUser(null);
    setActiveConsultation(null);
    setActiveBill(null);
    sessionStorage.removeItem('arogya_uid');
    showToast('Signed out successfully');
  };

  const getPatient = (id: string) => state.pts.find((p) => p.id === id);

  const registerPatient = (data: Omit<Patient, 'id' | 't'>) => {
    const id = generateUid('P');
    const newPt: Patient = {
      ...data,
      id,
      t: Date.now(),
    };
    updateState((prev) => ({
      ...prev,
      pts: [...prev.pts, newPt],
    }));
    syncPatientToCloud(newPt);
    addLog('registration', `Patient ${newPt.name} registered`, id);
    return newPt;
  };

  const updatePatient = (id: string, data: Partial<Patient>) => {
    updateState((prev) => {
      const updatedPts = prev.pts.map((p) => (p.id === id ? { ...p, ...data } : p));
      const target = updatedPts.find((p) => p.id === id);
      if (target) syncPatientToCloud(target);
      return { ...prev, pts: updatedPts };
    });
    addLog('registration', `Patient details updated for ${data.name || id}`, id);
    showToast('Patient profile updated');
  };

  const checkInPatient = (patientId: string, isUrgent = false) => {
    const patient = getPatient(patientId);
    if (!patient) return;
    const existing = state.vis.find((v) => v.pid === patientId && v.st !== 'done' && !v.cancelled);
    if (existing) {
      showToast(`${patient.name} is already checked in.`, true);
      return;
    }
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const todayVisits = state.vis.filter((v) => v.t >= todayStart);
    const token = todayVisits.length + 1;

    const newVisit: Visit = {
      id: generateUid('V'),
      pid: patientId,
      st: 'waiting',
      t: Date.now(),
      tk: token,
      urg: isUrgent,
    };

    updateState((prev) => ({
      ...prev,
      vis: [...prev.vis, newVisit],
    }));
    syncVisitToCloud(newVisit);
    addLog('check-in', `${patient.name} checked in (Token #${token}${isUrgent ? ', Urgent' : ''})`, patientId);
    showToast(`${patient.name} checked in (Token #${token})`);
  };

  const toggleVisitUrgent = (visitId: string) => {
    updateState((prev) => {
      const updatedVis = prev.vis.map((v) => (v.id === visitId ? { ...v, urg: !v.urg } : v));
      const target = updatedVis.find((x) => x.id === visitId);
      if (target) syncVisitToCloud(target);
      return { ...prev, vis: updatedVis };
    });
    const v = state.vis.find((x) => x.id === visitId);
    if (v) {
      addLog('check-in', `Priority toggled for visit #${v.tk}`, v.pid);
    }
  };

  const cancelVisit = (visitId: string, reason: string) => {
    const v = state.vis.find((x) => x.id === visitId);
    if (!v) return;
    const updatedVisit: Visit = { ...v, st: 'done', cancelled: true, reason };
    updateState((prev) => ({
      ...prev,
      vis: prev.vis.map((x) =>
        x.id === visitId ? updatedVisit : x
      ),
    }));
    syncVisitToCloud(updatedVisit);
    addLog('check-in', `Check-in cancelled: ${reason}`, v.pid);
    showToast('Visit cancelled');
  };

  // Doctor Consultation
  const startConsultation = (visitId: string) => {
    const v = state.vis.find((x) => x.id === visitId);
    if (!v) return;
    updateState((prev) => ({
      ...prev,
      vis: prev.vis.map((x) => (x.id === visitId ? { ...x, st: 'consulting' } : x)),
    }));
    setActiveConsultation({
      vid: visitId,
      pid: v.pid,
      notes: '',
      items: [],
      vit: {},
      fu: '',
    });
    addLog('consultation', `Consultation started with token #${v.tk}`, v.pid);
  };

  const updateActiveConsultation = (updater: (prev: DraftConsultation) => DraftConsultation) => {
    setActiveConsultation((prev) => (prev ? updater(prev) : null));
  };

  const cancelConsultation = () => {
    setActiveConsultation(null);
  };

  const repeatLastPrescription = () => {
    if (!activeConsultation) return;
    const pastRxs = state.rx.filter((r) => r.pid === activeConsultation.pid);
    const lastRx = pastRxs[pastRxs.length - 1];
    if (!lastRx || lastRx.items.length === 0) {
      showToast('No previous prescription found for this patient.', true);
      return;
    }
    setActiveConsultation((prev) => {
      if (!prev) return null;
      const combined = [...prev.items];
      lastRx.items.forEach((item) => {
        const existing = combined.find((x) => x.iid === item.iid);
        if (existing) {
          existing.qty = Math.max(existing.qty, item.qty);
        } else {
          const invItem = state.inv.find((i) => i.id === item.iid);
          combined.push({
            ...item,
            price: invItem?.price ?? item.price,
          });
        }
      });
      return { ...prev, items: combined };
    });
    showToast('Items copied from last prescription');
  };

  const applyTemplate = (templateId: string) => {
    const tp = state.tp.find((t) => t.id === templateId);
    if (!tp || !activeConsultation) return;
    setActiveConsultation((prev) => {
      if (!prev) return null;
      const updated = [...prev.items];
      tp.items.forEach((ti) => {
        const itemInfo = state.inv.find((i) => i.id === ti.iid);
        if (!itemInfo) return;
        const exists = updated.find((x) => x.iid === ti.iid);
        if (exists) {
          Object.assign(exists, ti, { name: itemInfo.name, type: itemInfo.type, price: itemInfo.price });
        } else {
          updated.push({
            ...ti,
            name: itemInfo.name,
            type: itemInfo.type,
            price: itemInfo.price,
          });
        }
      });
      return { ...prev, items: updated };
    });
    showToast(`Template "${tp.name}" applied`);
  };

  const saveCurrentAsTemplate = (name: string) => {
    if (!activeConsultation || activeConsultation.items.length === 0) {
      showToast('Add at least one item before saving template.', true);
      return;
    }
    const template: PrescriptionTemplate = {
      id: generateUid('TP'),
      name,
      items: activeConsultation.items.map((x) => ({
        iid: x.iid,
        qty: x.qty,
        dq: x.dq,
        fr: x.fr,
        tm: x.tm,
        days: x.days,
        nt: x.nt,
      })),
    };
    updateState((prev) => ({
      ...prev,
      tp: [...prev.tp, template],
    }));
    syncPrescriptionTemplateToCloud(template);
    addLog('settings', `Prescription template "${name}" created`);
    showToast(`Template "${name}" saved`);
  };

  const deleteTemplate = (templateId: string) => {
    updateState((prev) => ({
      ...prev,
      tp: prev.tp.filter((t) => t.id !== templateId),
    }));
    showToast('Template deleted');
  };

  const savePrescription = (): boolean => {
    if (!activeConsultation) return false;
    const { items, notes, pid, vid, vit, fu, hasConfirmedAllergyWarning } = activeConsultation;

    if (items.length === 0 && !notes.trim()) {
      showToast('Add at least one medicine/treatment or enter clinical notes.', true);
      return false;
    }

    const patient = getPatient(pid);
    if (patient?.allergies && !hasConfirmedAllergyWarning) {
      const allergicItems = items.filter((x) => checkAllergyMatch(patient.allergies, x.name));
      if (allergicItems.length > 0) {
        setActiveConsultation((prev) => (prev ? { ...prev, hasConfirmedAllergyWarning: true } : null));
        showToast(
          `Allergy Alert: ${allergicItems.map((i) => i.name).join(', ')} matches allergies. Click Save again to confirm.`,
          true
        );
        return false;
      }
    }

    const rxNo = `RX-${String(state.rx.length + 1).padStart(4, '0')}`;
    const newRx: Prescription = {
      id: generateUid('RX'),
      no: rxNo,
      pid,
      vid,
      notes: notes.trim(),
      items: items.map((x) => {
        const doseStr = [x.dq && `${x.dq} dose`, x.fr, x.tm, x.nt].filter(Boolean).join(', ') || x.dose || '';
        return { ...x, dose: doseStr };
      }),
      vit,
      fu: fu || undefined,
      by: currentUser?.name || 'Doctor',
      t: Date.now(),
    };

    updateState((prev) => ({
      ...prev,
      rx: [...prev.rx, newRx],
      vis: prev.vis.map((v) => (v.id === vid ? { ...v, st: 'done' } : v)),
    }));

    syncPrescriptionToCloud(newRx);
    const targetVisit = state.vis.find((v) => v.id === vid);
    if (targetVisit) {
      syncVisitToCloud({ ...targetVisit, st: 'done' });
    }

    addLog('prescription', `Prescription ${rxNo} created (${newRx.items.length} items)`, pid);
    addLog('consultation', `Consultation finished for ${patient?.name || pid}`, pid);
    setActiveConsultation(null);
    showToast(`Prescription ${rxNo} saved! Sent to Reception.`);
    return true;
  };

  const addPrescriptionAddendum = (rxId: string, text: string) => {
    if (!text.trim()) return;
    updateState((prev) => ({
      ...prev,
      rx: prev.rx.map((r) =>
        r.id === rxId
          ? {
              ...r,
              add: [...(r.add || []), { t: Date.now(), by: currentUser?.name || 'Doctor', text: text.trim() }],
            }
          : r
      ),
    }));
    const rx = state.rx.find((r) => r.id === rxId);
    addLog('prescription', `Addendum added to ${rx?.no || 'prescription'}: ${text.trim()}`, rx?.pid);
    showToast('Addendum recorded');
  };

  // Billing / POS
  const startBillingSession = (rxId: string | null = null, patientId: string = 'PW') => {
    if (rxId) {
      const rx = state.rx.find((r) => r.id === rxId);
      if (rx) {
        setActiveBill({
          rxid: rxId,
          pid: rx.pid,
          items: rx.items.map((x) => {
            const invItem = state.inv.find((i) => i.id === x.iid);
            return {
              iid: x.iid,
              name: x.name,
              type: x.type,
              qty: x.qty,
              price: x.price,
              tax: invItem?.tax || 0,
            };
          }),
          disc: 0,
          dt: 'p',
          pm: 'Cash',
          pref: '',
          paid: '',
        });
        addLog('conversion', `Prescription ${rx.no} loaded into billing session`, rx.pid);
        return;
      }
    }
    // Walk-in sale
    setActiveBill({
      rxid: null,
      pid: patientId || 'PW',
      items: [],
      disc: 0,
      dt: 'p',
      pm: 'Cash',
      pref: '',
      paid: '',
    });
  };

  const updateActiveBill = (updater: (prev: DraftBill) => DraftBill) => {
    setActiveBill((prev) => (prev ? updater(prev) : null));
  };

  const cancelBillingSession = () => {
    setActiveBill(null);
  };

  const finalizeInvoice = (): boolean => {
    if (!activeBill || activeBill.items.length === 0) {
      showToast('Add at least one item before finalizing invoice.', true);
      return false;
    }

    // Check inventory stock availability
    for (const item of activeBill.items) {
      const invItem = state.inv.find((i) => i.id === item.iid);
      if (invItem && invItem.stock !== null) {
        const available = getAvailableStock(invItem);
        if (item.qty > available) {
          showToast(`Only ${available} unexpired units of "${item.name}" available. Reduce quantity.`, true);
          return false;
        }
      }
    }

    const calc = calculateBill({
      items: activeBill.items,
      disc: activeBill.disc,
      dt: activeBill.dt,
    });

    const paidNum =
      activeBill.paid === '' ? calc.t : Math.min(Math.max(+activeBill.paid || 0, 0), calc.t);

    const invNo = `INV-${String(state.invs.length + 1).padStart(4, '0')}`;
    const rx = activeBill.rxid ? state.rx.find((r) => r.id === activeBill.rxid) : null;
    const removed = rx
      ? rx.items.filter((o) => !activeBill.items.some((x) => x.iid === o.iid)).map((o) => o.name)
      : [];
    const added = rx
      ? activeBill.items.filter((x) => !rx.items.some((o) => o.iid === x.iid)).map((x) => x.name)
      : [];

    const newInvoiceItems: InvoiceItem[] = [];
    const newPackages: TreatmentPackage[] = [];
    const updatedInventory = [...state.inv];

    // Deduct stock using FIFO and calculate actual cost
    for (const item of activeBill.items) {
      const invIndex = updatedInventory.findIndex((i) => i.id === item.iid);
      if (invIndex !== -1) {
        const invItem = { ...updatedInventory[invIndex] };
        if (invItem.stock !== null) {
          const allocations = takeStock(invItem, item.qty);
          const totalCost = allocations.reduce((sum, a) => sum + a.q * a.c, 0);
          newInvoiceItems.push({
            ...item,
            alloc: allocations,
            cost: totalCost,
          });
          addLog('inventory', `−${item.qty} ${invItem.name} (${invNo})`, activeBill.pid);
        } else {
          newInvoiceItems.push({ ...item });
        }

        // Package sessions creation if treatment
        if (invItem.sess && invItem.sess > 1 && item.type === 'treatment') {
          const totalSessions = invItem.sess * item.qty;
          newPackages.push({
            id: generateUid('PK'),
            pid: activeBill.pid,
            name: `${item.name} (${totalSessions} sessions)`,
            total: totalSessions,
            used: 0,
            inv: invNo,
            t: Date.now(),
          });
          addLog('treatment', `Treatment package initiated: ${item.name} (${totalSessions} sessions)`, activeBill.pid);
        }

        updatedInventory[invIndex] = invItem;
      } else {
        newInvoiceItems.push({ ...item });
      }
    }

    const newInvoice: Invoice = {
      id: invNo,
      pid: activeBill.pid,
      rxid: activeBill.rxid || null,
      items: newInvoiceItems,
      sub: calc.s,
      disc: activeBill.disc,
      dt: activeBill.dt,
      discAmt: calc.d,
      tax: calc.tx,
      total: calc.t,
      paid: paidNum,
      t: Date.now(),
      removed,
      added,
    };

    const newPayments: Payment[] = [];
    if (paidNum > 0) {
      newPayments.push({
        id: generateUid('PY'),
        inv: invNo,
        pid: activeBill.pid,
        amt: paidNum,
        t: Date.now(),
        m: activeBill.pm || 'Cash',
        ref: activeBill.pref || undefined,
      });
      addLog(
        'payment',
        `${formatMoney(paidNum)} by ${activeBill.pm || 'Cash'} recorded for ${invNo}`,
        activeBill.pid
      );
    }

    addLog('invoice', `Invoice ${invNo} finalized for ${formatMoney(calc.t)}`, activeBill.pid);

    updateState((prev) => ({
      ...prev,
      inv: updatedInventory,
      invs: [...prev.invs, newInvoice],
      pays: [...prev.pays, ...newPayments],
      pk: [...prev.pk, ...newPackages],
    }));

    syncInvoiceToCloud(newInvoice);
    newPayments.forEach((p) => syncPaymentToCloud(p));
    newPackages.forEach((k) => syncTreatmentPackageToCloud(k));
    updatedInventory.forEach((item) => syncInventoryItemToCloud(item));

    setActiveBill(null);
    showToast(`Invoice ${invNo} finalized! Total: ${formatMoney(calc.t)}`);
    return true;
  };

  const recordPayment = (invoiceId: string, amount: number, method: string, ref = '') => {
    const inv = state.invs.find((i) => i.id === invoiceId);
    if (!inv) return;
    if (amount <= 0) {
      showToast('Enter a valid payment amount.', true);
      return;
    }
    const balance = inv.total - inv.paid;
    if (amount > balance) {
      showToast(`Amount exceeds outstanding balance of ${formatMoney(balance)}.`, true);
      return;
    }

    const newPayment: Payment = {
      id: generateUid('PY'),
      inv: invoiceId,
      pid: inv.pid,
      amt: amount,
      t: Date.now(),
      m: method,
      ref: ref || undefined,
    };

    updateState((prev) => ({
      ...prev,
      invs: prev.invs.map((i) => (i.id === invoiceId ? { ...i, paid: i.paid + amount } : i)),
      pays: [...prev.pays, newPayment],
    }));

    syncPaymentToCloud(newPayment);
    syncInvoiceToCloud({ ...inv, paid: inv.paid + amount });

    addLog('payment', `${formatMoney(amount)} by ${method} received for ${invoiceId}`, inv.pid);
    showToast(`Payment of ${formatMoney(amount)} recorded.`);
  };

  const voidInvoice = (invoiceId: string, reason: string) => {
    const inv = state.invs.find((i) => i.id === invoiceId);
    if (!inv || inv.void) return;

    const updatedInventory = [...state.inv];
    // Return stock to inventory
    for (const item of inv.items) {
      const invIndex = updatedInventory.findIndex((i) => i.id === item.iid);
      if (invIndex !== -1 && updatedInventory[invIndex].stock !== null) {
        const invItem = { ...updatedInventory[invIndex] };
        restockItem(invItem, item);
        updatedInventory[invIndex] = invItem;
        addLog('inventory', `+${item.qty} ${invItem.name} returned to inventory (${invoiceId} voided)`, inv.pid);
      }
    }

    const newPayments: Payment[] = [];
    if (inv.paid > 0) {
      newPayments.push({
        id: generateUid('PY'),
        inv: invoiceId,
        pid: inv.pid,
        amt: -inv.paid,
        t: Date.now(),
        refund: true,
        m: 'Refund',
      });
      addLog('payment', `${formatMoney(inv.paid)} refunded (${invoiceId} voided)`, inv.pid);
    }

    updateState((prev) => ({
      ...prev,
      inv: updatedInventory,
      invs: prev.invs.map((i) =>
        i.id === invoiceId
          ? {
              ...i,
              void: {
                t: Date.now(),
                by: currentUser?.name || 'Doctor',
                reason,
              },
            }
          : i
      ),
      pays: [...prev.pays, ...newPayments],
      pk: prev.pk.map((k) => (k.inv === invoiceId ? { ...k, void: true } : k)),
    }));

    syncInvoiceToCloud({
      ...inv,
      void: {
        t: Date.now(),
        by: currentUser?.name || 'Doctor',
        reason,
      },
    });
    newPayments.forEach((p) => syncPaymentToCloud(p));
    updatedInventory.forEach((item) => syncInventoryItemToCloud(item));

    addLog('invoice', `Invoice ${invoiceId} voided: ${reason}`, inv.pid);
    showToast(`Invoice ${invoiceId} voided and stock restored.`);
  };

  // Inventory Management
  const saveInventoryItem = (
    data: Partial<InventoryItem> & { name: string; price: number; type: 'medicine' | 'treatment' }
  ) => {
    updateState((prev) => {
      if (data.id) {
        // Edit
        const updatedList = prev.inv.map((i) => (i.id === data.id ? { ...i, ...data } : i));
        const updatedItem = updatedList.find((i) => i.id === data.id);
        if (updatedItem) syncInventoryItemToCloud(updatedItem);
        return {
          ...prev,
          inv: updatedList,
        };
      }
      // New
      const newItem: InventoryItem = {
        id: generateUid('I'),
        name: data.name,
        type: data.type,
        price: data.price,
        stock: data.type === 'medicine' ? 0 : null,
        low: data.low || 8,
        tax: data.tax || 0,
        sess: data.sess || 1,
        batches: [],
      };
      syncInventoryItemToCloud(newItem);
      return {
        ...prev,
        inv: [...prev.inv, newItem],
      };
    });
    addLog('inventory', `Item "${data.name}" saved to catalogue`);
    showToast(`Item "${data.name}" saved.`);
  };

  const receiveStockBatch = (
    itemId: string,
    batchNo: string,
    exp: string,
    qty: number,
    cost: number,
    supplier?: string
  ) => {
    updateState((prev) => {
      const updated = prev.inv.map((i) => {
        if (i.id !== itemId) return i;
        const batches = i.batches ? [...i.batches] : [];
        batches.push({
          id: generateUid('B'),
          no: batchNo || 'Batch',
          exp,
          qty,
          cost,
          sup: supplier,
        });
        const updatedItem = { ...i, batches };
        syncStock(updatedItem);
        syncInventoryItemToCloud(updatedItem);
        return updatedItem;
      });
      return { ...prev, inv: updated };
    });
    const item = state.inv.find((i) => i.id === itemId);
    addLog(
      'inventory',
      `+${qty} ${item?.name || 'stock'} received (Batch ${batchNo || '—'}, Exp ${exp || '—'}, Cost ${formatMoney(cost)})`
    );
    showToast(`Stock received: +${qty} units`);
  };

  const adjustStockBatch = (
    itemId: string,
    batchId: string,
    delta: number,
    reason: string,
    note?: string
  ) => {
    updateState((prev) => {
      const updated = prev.inv.map((i) => {
        if (i.id !== itemId) return i;
        const batches = (i.batches || []).map((b) => {
          if (b.id !== batchId) return b;
          return { ...b, qty: Math.max(0, b.qty + delta) };
        });
        const updatedItem = { ...i, batches };
        syncStock(updatedItem);
        syncInventoryItemToCloud(updatedItem);
        return updatedItem;
      });
      return { ...prev, inv: updated };
    });
    const item = state.inv.find((i) => i.id === itemId);
    addLog(
      'inventory',
      `${delta > 0 ? '+' : ''}${delta} ${item?.name || 'item'} adjusted (${reason}${note ? ': ' + note : ''})`
    );
    showToast(`Stock adjusted by ${delta > 0 ? '+' : ''}${delta}`);
  };

  const toggleFavoriteItem = (itemId: string) => {
    updateState((prev) => {
      const updated = prev.inv.map((i) => (i.id === itemId ? { ...i, fav: !i.fav } : i));
      const target = updated.find((i) => i.id === itemId);
      if (target) syncInventoryItemToCloud(target);
      return { ...prev, inv: updated };
    });
  };

  const recordTreatmentSession = (packageId: string) => {
    const pkg = state.pk.find((k) => k.id === packageId);
    if (!pkg || pkg.used >= pkg.total) {
      showToast('All sessions for this package have already been completed.', true);
      return;
    }
    const updatedPkg = { ...pkg, used: pkg.used + 1 };
    updateState((prev) => ({
      ...prev,
      pk: prev.pk.map((k) => (k.id === packageId ? updatedPkg : k)),
    }));
    syncTreatmentPackageToCloud(updatedPkg);
    addLog('treatment', `Session ${pkg.used + 1} of ${pkg.total} recorded: ${pkg.name}`, pkg.pid);
    showToast(`Session ${pkg.used + 1} of ${pkg.total} recorded.`);
  };

  // Appointments
  const bookAppointment = (
    patientId: string,
    date: string,
    time: string,
    note?: string,
    refRxId?: string
  ) => {
    const newAppointment: Appointment = {
      id: generateUid('AP'),
      pid: patientId,
      date,
      time: time || '10:00',
      note,
      st: 'booked',
      t: Date.now(),
    };

    updateState((prev) => {
      let rxList = prev.rx;
      if (refRxId) {
        rxList = rxList.map((r) => (r.id === refRxId ? { ...r, fud: true } : r));
      }
      return {
        ...prev,
        ap: [...prev.ap, newAppointment],
        rx: rxList,
      };
    });

    syncAppointmentToCloud(newAppointment);

    const patient = getPatient(patientId);
    addLog('appointment', `Appointment booked for ${date} at ${time}`, patientId);
    showToast(`Appointment booked for ${patient?.name || 'patient'}`);
  };

  const updateAppointmentStatus = (appointmentId: string, status: Appointment['st']) => {
    const apt = state.ap.find((a) => a.id === appointmentId);
    if (!apt) return;

    if (status === 'arrived') {
      const patient = getPatient(apt.pid);
      const isAlreadyCheckedIn = state.vis.some(
        (v) => v.pid === apt.pid && v.st !== 'done' && !v.cancelled
      );
      if (isAlreadyCheckedIn) {
        showToast(`${patient?.name || 'Patient'} is already checked in.`, true);
        return;
      }
      checkInPatient(apt.pid);
    }

    const updatedApt = { ...apt, st: status };
    updateState((prev) => ({
      ...prev,
      ap: prev.ap.map((a) => (a.id === appointmentId ? updatedApt : a)),
    }));

    syncAppointmentToCloud(updatedApt);

    addLog('appointment', `Appointment status changed to "${status}"`, apt.pid);
    showToast(`Appointment marked as ${status}`);
  };

  const dismissFollowUp = (rxId: string) => {
    updateState((prev) => ({
      ...prev,
      rx: prev.rx.map((r) => (r.id === rxId ? { ...r, fud: true } : r)),
    }));
    showToast('Follow-up reminder dismissed');
  };

  // Clinic Config & Staff
  const saveClinicConfig = (config: ClinicState['cfg']) => {
    updateState((prev) => ({ ...prev, cfg: config }));
    syncClinicConfigToCloud(config);
    addLog('settings', 'Clinic configuration updated');
    showToast('Clinic details saved');
  };

  const updateUserPin = (userId: string, newPin: string) => {
    if (!/^\d{4,8}$/.test(newPin)) {
      showToast('PIN must be 4 to 8 digits.', true);
      return;
    }
    updateState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === userId ? { ...u, pin: hashPin(newPin) } : u)),
    }));
    const u = state.users.find((x) => x.id === userId);
    addLog('settings', `PIN updated for ${u?.name || userId}`);
    showToast(`PIN updated for ${u?.name || 'staff'}`);
  };

  const addUser = (name: string, role: 'doctor' | 'reception', pin: string) => {
    if (!name.trim() || !/^\d{4,8}$/.test(pin)) {
      showToast('Enter a valid name and a 4-8 digit PIN.', true);
      return;
    }
    const newUser: User = {
      id: generateUid('U'),
      name: name.trim(),
      role,
      pin: hashPin(pin),
    };
    updateState((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
    }));
    addLog('settings', `Staff member added: ${name} (${role})`);
    showToast(`Staff member ${name} added.`);
  };

  const triggerPrint = (type: 'rx' | 'inv', id: string) => {
    setPrintData({ type, id });
  };

  // Backup / Restore
  const exportDatabase = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `arogyatheeram_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Clinic database exported successfully');
  };

  const importDatabase = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.cfg || !parsed.users || !parsed.inv) {
        showToast('Invalid backup file format.', true);
        return false;
      }
      updateState(() => parsed);
      showToast('Clinic database restored successfully!');
      return true;
    } catch {
      showToast('Failed to parse backup JSON file.', true);
      return false;
    }
  };

  const resetDatabase = () => {
    const seed = getInitialSeedData();
    updateState(() => seed);
    showToast('Reset to demo clinic data');
  };

  return (
    <ClinicContext.Provider
      value={{
        state,
        currentUser,
        currentTab,
        setCurrentTab,
        syncStatus,
        retrySync: performCloudSync,
        login,
        logout,
        toast,
        showToast,
        registerPatient,
        updatePatient,
        getPatient,
        checkInPatient,
        toggleVisitUrgent,
        cancelVisit,
        activeConsultation,
        startConsultation,
        updateActiveConsultation,
        cancelConsultation,
        savePrescription,
        repeatLastPrescription,
        applyTemplate,
        saveCurrentAsTemplate,
        deleteTemplate,
        addPrescriptionAddendum,
        activeBill,
        startBillingSession,
        updateActiveBill,
        cancelBillingSession,
        finalizeInvoice,
        recordPayment,
        voidInvoice,
        saveInventoryItem,
        receiveStockBatch,
        adjustStockBatch,
        toggleFavoriteItem,
        recordTreatmentSession,
        bookAppointment,
        updateAppointmentStatus,
        dismissFollowUp,
        saveClinicConfig,
        updateUserPin,
        addUser,
        printData,
        setPrintData,
        triggerPrint,
        exportDatabase,
        importDatabase,
        resetDatabase,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
}
