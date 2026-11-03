import { InventoryItem, InvoiceAllocation, InvoiceItem } from '@/types';

export function hashPin(s: string): string {
  let x = 5381;
  for (const c of 'ag!' + s) {
    x = ((x * 33) ^ c.charCodeAt(0)) >>> 0;
  }
  return x.toString(36);
}

export function formatMoney(n: number | string): string {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

export function formatDateTime(t: number | string): string {
  if (!t) return '—';
  return new Date(t).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDate(t: number | string): string {
  if (!t) return '—';
  return new Date(t).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export function getTodayDate(): string {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
}

export function generateUid(p: string = ''): string {
  return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

export function syncStock(i: InventoryItem): void {
  if (i.batches) {
    i.stock = i.batches.reduce((x, y) => x + (y.qty || 0), 0);
  }
}

export function getAvailableStock(i: InventoryItem): number {
  if (i.stock === null || i.stock === undefined) return Infinity;
  if (!i.batches || i.batches.length === 0) return i.stock;
  const today = getTodayDate();
  return i.batches
    .filter((b) => !b.exp || b.exp >= today)
    .reduce((sum, b) => sum + (b.qty || 0), 0);
}

export function takeStock(i: InventoryItem, q: number): InvoiceAllocation[] {
  const al: InvoiceAllocation[] = [];
  if (!i.batches) return al;
  const today = getTodayDate();
  
  // Sort by earliest expiry first (FIFO)
  const validBatches = i.batches
    .filter((b) => b.qty > 0 && (!b.exp || b.exp >= today))
    .sort((a, b) => (a.exp || '9').localeCompare(b.exp || '9'));

  let remaining = q;
  for (const b of validBatches) {
    if (remaining <= 0) break;
    const n = Math.min(b.qty, remaining);
    b.qty -= n;
    remaining -= n;
    al.push({ b: b.id, q: n, c: b.cost || 0 });
  }

  syncStock(i);
  return al;
}

export function restockItem(k: InventoryItem, x: InvoiceItem): void {
  if (!k.batches) k.batches = [];
  const allocs = x.alloc && x.alloc.length > 0 ? x.alloc : [{ b: 'RET', q: x.qty, c: 0 }];
  for (const a of allocs) {
    const b = k.batches.find((y) => y.id === a.b);
    if (b) {
      b.qty += a.q;
    } else {
      k.batches.push({
        id: a.b,
        no: 'Returned',
        exp: '',
        qty: a.q,
        cost: a.c || 0,
      });
    }
  }
  syncStock(k);
}

export function calculateBill(b: {
  items: { qty: number; price: number; tax?: number }[];
  disc?: number;
  dt?: 'p' | 'f';
}) {
  const s = b.items.reduce((acc, x) => acc + x.qty * x.price, 0);
  const dv = +(b.disc || 0);
  const d = Math.min(
    s,
    b.dt === 'f'
      ? Math.round(dv)
      : Math.round(s * Math.min(dv, 100) / 100)
  );
  const r = s > 0 ? (s - d) / s : 0;
  const tx = Math.round(
    b.items.reduce((acc, x) => acc + x.qty * x.price * r * ((x.tax || 0) / 100), 0)
  );
  return {
    s, // subtotal
    d, // discount amount
    tx, // tax amount
    t: s - d + tx, // grand total
  };
}

export function checkAllergyMatch(allergies: string = '', itemName: string): boolean {
  if (!allergies || !itemName) return false;
  const name = itemName.toLowerCase();
  return allergies
    .toLowerCase()
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2)
    .some((a) => name.includes(a) || a.includes(name));
}

export function parseQueryMultiplier(q: string) {
  const m = q.match(/\s*[x×*]\s*(\d{1,3})\s*$/i);
  return m
    ? { text: q.slice(0, m.index).trim(), multiplier: Math.max(1, +m[1]) }
    : { text: q.trim(), multiplier: 1 };
}
