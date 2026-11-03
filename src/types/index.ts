export type Role = 'doctor' | 'reception';

export interface User {
  id: string;
  name: string;
  role: Role;
  pin: string; // hashed
}

export interface ClinicConfig {
  name: string;
  addr: string;
  phone: string;
  reg: string;
  dr: string;
}

export interface Batch {
  id: string;
  no: string;
  exp: string; // YYYY-MM-DD
  qty: number;
  cost: number;
  sup?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'medicine' | 'treatment';
  price: number;
  stock: number | null; // null for treatments
  low: number;
  tax?: number; // percentage
  sess?: number; // sessions for treatment package
  batches?: Batch[];
  fav?: boolean;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number | string;
  sex: string;
  allergies: string;
  cond: string;
  t: number;
}

export interface Visit {
  id: string;
  pid: string;
  st: 'waiting' | 'consulting' | 'done';
  t: number;
  tk?: number;
  urg?: boolean;
  cancelled?: boolean;
  reason?: string;
}

export interface PrescriptionItem {
  iid: string;
  name: string;
  type: 'medicine' | 'treatment';
  qty: number;
  price: number;
  dose?: string;
  dq?: string; // dose quantity (e.g. "1")
  fr?: string; // frequency (e.g. "Twice daily")
  tm?: string; // timing (e.g. "After food")
  days?: number | string;
  nt?: string; // note
}

export interface Addendum {
  t: number;
  by: string;
  text: string;
}

export interface Vitals {
  wt?: string;
  bp?: string;
  pulse?: string;
}

export interface Prescription {
  id: string;
  no: string;
  pid: string;
  vid?: string;
  items: PrescriptionItem[];
  notes?: string;
  vit?: Vitals;
  fu?: string; // follow-up date YYYY-MM-DD
  fud?: boolean; // follow-up dismissed
  by?: string;
  t: number;
  add?: Addendum[];
}

export interface InvoiceAllocation {
  b: string; // batch ID
  q: number; // quantity taken
  c: number; // unit cost
}

export interface InvoiceItem {
  iid: string;
  name: string;
  type: 'medicine' | 'treatment';
  qty: number;
  price: number;
  tax?: number;
  alloc?: InvoiceAllocation[];
  cost?: number;
}

export interface InvoiceVoid {
  t: number;
  by: string;
  reason: string;
}

export interface Invoice {
  id: string;
  pid: string;
  rxid?: string | null;
  items: InvoiceItem[];
  sub: number;
  disc: number;
  dt: 'p' | 'f'; // percentage or flat
  discAmt: number;
  tax: number;
  total: number;
  paid: number;
  t: number;
  removed?: string[];
  added?: string[];
  void?: InvoiceVoid;
}

export interface Payment {
  id: string;
  inv: string;
  pid: string;
  amt: number;
  t: number;
  m: string; // Cash, UPI, Card
  ref?: string;
  refund?: boolean | number;
}

export interface TreatmentPackage {
  id: string;
  pid: string;
  name: string;
  total: number;
  used: number;
  inv: string;
  t: number;
  void?: boolean | number;
}

export interface Appointment {
  id: string;
  pid: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  note?: string;
  st: 'booked' | 'arrived' | 'noshow' | 'cancelled';
  t: number;
}

export interface TemplateItem {
  iid: string;
  qty: number;
  dq?: string;
  fr?: string;
  tm?: string;
  days?: number | string;
  nt?: string;
}

export interface PrescriptionTemplate {
  id: string;
  name: string;
  items: TemplateItem[];
}

export interface ActivityLog {
  t: number;
  pid?: string | null;
  type: 'check-in' | 'consultation' | 'prescription' | 'billing' | 'payment' | 'inventory' | 'settings' | 'login' | 'registration' | 'treatment' | 'appointment' | 'conversion' | 'invoice';
  msg: string;
  by?: string;
}

export interface ClinicState {
  users: User[];
  cfg: ClinicConfig;
  inv: InventoryItem[];
  pts: Patient[];
  vis: Visit[];
  rx: Prescription[];
  invs: Invoice[];
  pays: Payment[];
  pk: TreatmentPackage[];
  ap: Appointment[];
  tp: PrescriptionTemplate[];
  log: ActivityLog[];
}

export type TabKey = 'reception' | 'doctor' | 'dash' | 'pts' | 'stock' | 'log' | 'set';
