import { ClinicState } from '@/types';
import { hashPin } from './utils';

export const STORAGE_KEY = 'arogya_pos_v2';

export function getInitialSeedData(): ClinicState {
  const t = 1730620000000;
  const dayMs = 86400000;
  const todayStr = '2026-11-03';
  const futureExp1 = '2027-05-02';
  const futureExp2 = '2026-12-18';
  const futureExp3 = '2027-11-03';

  return {
    cfg: {
      name: 'Arogya Theeram Ayurvedic Clinic & Wellness',
      addr: 'Beach Road, Kovalam, Thiruvananthapuram, Kerala - 695527',
      phone: '+91 98470 12345 / 0471-2480111',
      reg: 'AYUSH-KL-2024-8891',
      dr: 'Dr. Arya Varma, BAMS, MD (Ayurveda)',
    },
    users: [
      { id: 'U1', name: 'Dr. Arya Varma', role: 'doctor', pin: hashPin('1234') },
      { id: 'U2', name: 'Reception Desk', role: 'reception', pin: hashPin('1111') },
    ],
    inv: [
      {
        id: 'I0',
        name: 'Ashwagandha Tablets (60s)',
        type: 'medicine',
        price: 180,
        stock: 40,
        low: 10,
        tax: 5,
        batches: [
          { id: 'B101', no: 'ASH-24A', exp: futureExp1, qty: 25, cost: 110, sup: 'Kottakkal Arya Vaidya Sala' },
          { id: 'B102', no: 'ASH-24B', exp: futureExp3, qty: 15, cost: 115, sup: 'Kottakkal Arya Vaidya Sala' },
        ],
        fav: true,
      },
      {
        id: 'I1',
        name: 'Triphala Churna (100g)',
        type: 'medicine',
        price: 120,
        stock: 30,
        low: 10,
        tax: 5,
        batches: [
          { id: 'B201', no: 'TRP-89', exp: futureExp2, qty: 30, cost: 70, sup: 'Vaidyaratnam' },
        ],
        fav: true,
      },
      {
        id: 'I2',
        name: 'Brahmi Ghritam (150g)',
        type: 'medicine',
        price: 340,
        stock: 12,
        low: 8,
        tax: 5,
        batches: [
          { id: 'B301', no: 'BRH-12', exp: futureExp1, qty: 12, cost: 220, sup: 'AVP Ayurveda' },
        ],
      },
      {
        id: 'I3',
        name: 'Dashamoolarishtam (450ml)',
        type: 'medicine',
        price: 210,
        stock: 25,
        low: 8,
        tax: 5,
        batches: [
          { id: 'B401', no: 'DSM-55', exp: futureExp3, qty: 25, cost: 135, sup: 'Kottakkal Arya Vaidya Sala' },
        ],
        fav: true,
      },
      {
        id: 'I4',
        name: 'Chyawanprash Special (500g)',
        type: 'medicine',
        price: 260,
        stock: 6,
        low: 8,
        tax: 5,
        batches: [
          { id: 'B501', no: 'CHY-02', exp: futureExp2, qty: 6, cost: 175, sup: 'Vaidyaratnam' },
        ],
      },
      {
        id: 'I5',
        name: 'Amruthotharam Kashayam (200ml)',
        type: 'medicine',
        price: 95,
        stock: 50,
        low: 12,
        tax: 5,
        batches: [
          { id: 'B601', no: 'AMR-11', exp: futureExp1, qty: 50, cost: 58, sup: 'Oushadhi' },
        ],
      },
      {
        id: 'I6',
        name: 'Abhyangam (Full Body Herbal Oil Massage)',
        type: 'treatment',
        price: 800,
        stock: null,
        low: 0,
        sess: 1,
        tax: 12,
        fav: true,
      },
      {
        id: 'I7',
        name: 'Shirodhara (Relaxing Medicated Oil Stream)',
        type: 'treatment',
        price: 1500,
        stock: null,
        low: 0,
        sess: 1,
        tax: 12,
        fav: true,
      },
      {
        id: 'I8',
        name: 'Nasyam (Nasal Cleansing & Therapy)',
        type: 'treatment',
        price: 600,
        stock: null,
        low: 0,
        sess: 1,
        tax: 12,
      },
      {
        id: 'I9',
        name: 'Kizhi (Warm Herbal Poultice Therapy)',
        type: 'treatment',
        price: 1200,
        stock: null,
        low: 0,
        sess: 1,
        tax: 12,
      },
    ],
    pts: [
      {
        id: 'PW',
        name: 'Walk-in customer',
        phone: '—',
        age: '',
        sex: '',
        allergies: '',
        cond: '',
        t: t - 10 * dayMs,
      },
      {
        id: 'P1',
        name: 'Anitha Menon',
        phone: '9847012345',
        age: 42,
        sex: 'Female',
        allergies: 'Penicillin, Dust',
        cond: 'Mild Hypertension, Chronic Fatigue',
        t: t - 5 * dayMs,
      },
      {
        id: 'P2',
        name: 'Rajan Pillai',
        phone: '9946098765',
        age: 58,
        sex: 'Male',
        allergies: 'None',
        cond: 'Lumbar Spondylosis, Osteoarthritis',
        t: t - 3 * dayMs,
      },
      {
        id: 'P3',
        name: 'Meera Nambiar',
        phone: '9447123987',
        age: 34,
        sex: 'Female',
        allergies: 'Sesame oil',
        cond: 'Migraine, Stress insomnia',
        t: t - 1 * dayMs,
      },
    ],
    vis: [
      { id: 'V1', pid: 'P1', st: 'waiting', t: t - 35 * 60000, tk: 1, urg: false },
      { id: 'V2', pid: 'P2', st: 'waiting', t: t - 15 * 60000, tk: 2, urg: true },
    ],
    rx: [
      {
        id: 'RX1',
        no: 'RX-0001',
        pid: 'P3',
        notes: 'Complaining of tension headaches and poor sleep. Recommended Shirodhara and Brahmi.',
        items: [
          { iid: 'I7', name: 'Shirodhara (Relaxing Medicated Oil Stream)', type: 'treatment', qty: 3, price: 1500, dose: '3 sessions alternate days' },
          { iid: 'I2', name: 'Brahmi Ghritam (150g)', type: 'medicine', qty: 1, price: 340, dose: '1 tsp, At bedtime, Empty stomach, 14 days' },
        ],
        vit: { wt: '56', bp: '118/76', pulse: '72' },
        fu: new Date(t + 7 * dayMs).toLocaleDateString('en-CA'),
        by: 'Dr. Arya Varma',
        t: t - 2 * dayMs,
      },
    ],
    invs: [
      {
        id: 'INV-0001',
        pid: 'P3',
        rxid: 'RX1',
        items: [
          { iid: 'I7', name: 'Shirodhara (Relaxing Medicated Oil Stream)', type: 'treatment', qty: 3, price: 1500, tax: 12 },
          { iid: 'I2', name: 'Brahmi Ghritam (150g)', type: 'medicine', qty: 1, price: 340, tax: 5 },
        ],
        sub: 4840,
        disc: 5,
        dt: 'p',
        discAmt: 242,
        tax: 531,
        total: 5129,
        paid: 5129,
        t: t - 2 * dayMs,
      },
    ],
    pays: [
      { id: 'PY1', inv: 'INV-0001', pid: 'P3', amt: 5129, t: t - 2 * dayMs, m: 'UPI', ref: 'UPI/9847123987@okaxis' },
    ],
    pk: [
      { id: 'PK1', pid: 'P3', name: 'Shirodhara (3 sessions)', total: 3, used: 1, inv: 'INV-0001', t: t - 2 * dayMs },
    ],
    ap: [
      { id: 'AP1', pid: 'P3', date: todayStr, time: '11:00', note: 'Shirodhara session 2', st: 'booked', t: t - dayMs },
      { id: 'AP2', pid: 'P1', date: todayStr, time: '15:30', note: 'Regular follow-up consultation', st: 'booked', t: t - 2 * dayMs },
    ],
    tp: [
      {\n        id: 'TP1',\n        name: 'Stress & Insomnia Protocol',\n        items: [\n          { iid: 'I7', qty: 3, nt: 'Alternate mornings' },\n          { iid: 'I2', qty: 1, dq: '1 tsp', fr: 'At bedtime', tm: 'Empty stomach', days: 14 },\n          { iid: 'I0', qty: 1, dq: '1 tablet', fr: 'Twice daily', tm: 'After food', days: 30 },\n        ],\n      },\n      {\n        id: 'TP2',\n        name: 'Joint Care & Arthritis Relief',\n        items: [\n          { iid: 'I6', qty: 5, nt: 'Consecutive days Abhyangam' },\n          { iid: 'I3', qty: 2, dq: '15 ml with equal warm water', fr: 'Twice daily', tm: 'After food', days: 20 },\n        ],\n      },\n    ],\n    log: [\n      { t: t - 35 * 60000, pid: 'P1', type: 'check-in', msg: 'Anitha Menon registered and checked in', by: 'Reception Desk' },\n      { t: t - 15 * 60000, pid: 'P2', type: 'check-in', msg: 'Rajan Pillai checked in (Urgent priority)', by: 'Reception Desk' },\n    ],\n  };\n}\n\nexport function loadClinicState(): ClinicState {\n  if (typeof window === 'undefined') {\n    return getInitialSeedData();\n  }\n  try {\n    const raw = localStorage.getItem(STORAGE_KEY);\n    if (!raw) {\n      // Check legacy storage key if migrating\n      const legacyRaw = localStorage.getItem('arogya1');\n      if (legacyRaw) {\n        const legacy = JSON.parse(legacyRaw);\n        return { ...getInitialSeedData(), ...legacy };\n      }\n      const initial = getInitialSeedData();\n      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));\n      return initial;\n    }\n    const parsed = JSON.parse(raw);\n    if (parsed.cfg && typeof parsed.cfg.name === 'string' && parsed.cfg.name.includes('ArogyTheeram')) {\n      parsed.cfg.name = parsed.cfg.name.replace(/ArogyTheeram/g, 'Arogya Theeram');\n    }\n    return parsed;\n  } catch (e) {\n    console.error('Failed to load clinic state, falling back to initial data', e);\n    return getInitialSeedData();\n  }\n}\n\nexport function saveClinicState(state: ClinicState): void {\n  if (typeof window === 'undefined') return;\n  try {\n    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));\n  } catch (e) {\n    console.error('Failed to persist clinic state to localStorage', e);\n  }\n}\n