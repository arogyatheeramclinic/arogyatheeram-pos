import { supabase, supabaseAdmin } from './supabase';
import {
  ClinicState,
  ClinicConfig,
  User,
  InventoryItem,
  Batch,
  Patient,
  Visit,
  Prescription,
  Invoice,
  Payment,
  TreatmentPackage,
  Appointment,
  PrescriptionTemplate,
  ActivityLog,
} from '@/types';

/**
 * Fetch the entire clinic state from Supabase PostgreSQL tables
 */
export async function fetchCloudClinicState(): Promise<ClinicState | null> {
  try {
    // 1. Fetch clinic config
    const { data: cfgRows, error: cfgErr } = await supabase
      .from('clinic_config')
      .select('*')
      .limit(1);

    if (cfgErr) {
      console.warn('[Supabase] Could not query clinic_config:', cfgErr.message);
      return null;
    }

    // 2. Fetch all collections in parallel for optimal load speed
    const [
      usersRes,
      itemsRes,
      batchesRes,
      patientsRes,
      visitsRes,
      rxRes,
      invsRes,
      paysRes,
      pkgsRes,
      apptsRes,
      templatesRes,
      logsRes,
    ] = await Promise.all([
      supabase.from('staff_users').select('*'),
      supabase.from('inventory_items').select('*'),
      supabase.from('inventory_batches').select('*'),
      supabase.from('patients').select('*'),
      supabase.from('visits').select('*').order('created_at', { ascending: true }),
      supabase.from('prescriptions').select('*').order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
      supabase.from('treatment_packages').select('*'),
      supabase.from('appointments').select('*').order('date', { ascending: true }),
      supabase.from('prescription_templates').select('*'),
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(200),
    ]);

    // Construct inventory items with their respective batches
    const batchesByItem: Record<string, Batch[]> = {};
    (batchesRes.data || []).forEach((b: { id: string; item_id: string; no: string; exp: string; qty: number; cost: number; sup: string | null }) => {
      if (!batchesByItem[b.item_id]) batchesByItem[b.item_id] = [];
      batchesByItem[b.item_id].push({
        id: b.id,
        no: b.no,
        exp: b.exp,
        qty: Number(b.qty) || 0,
        cost: Number(b.cost) || 0,
        sup: b.sup || '',
      });
    });

    const inventoryItems: InventoryItem[] = (itemsRes.data || []).map((i: { id: string; name: string; type: 'medicine' | 'treatment'; price: number; stock: number | null; low: number; tax: number; sess: number | null; fav: boolean | null }) => ({
      id: i.id,
      name: i.name,
      type: i.type,
      price: Number(i.price) || 0,
      stock: i.stock !== null ? Number(i.stock) : null,
      low: Number(i.low) || 8,
      tax: Number(i.tax) || 5,
      sess: i.sess || 1,
      fav: Boolean(i.fav),
      batches: batchesByItem[i.id] || [],
    }));

    const cfgRow = cfgRows && cfgRows[0];
    const cfg: ClinicConfig = cfgRow
      ? {
          name: cfgRow.name,
          addr: cfgRow.addr,
          phone: cfgRow.phone,
          reg: cfgRow.reg,
          dr: cfgRow.dr,
        }
      : {
          name: 'Arogya Theeram Ayurvedic Clinic & Wellness',
          addr: 'Beach Road, Kovalam, Thiruvananthapuram, Kerala - 695527',
          phone: '+91 98470 12345 / 0471-2480111',
          reg: 'AYUSH-KL-2024-8891',
          dr: 'Dr. Arya Varma, BAMS, MD (Ayurveda)',
        };

    const users: User[] = (usersRes.data || []).map((u: { id: string; name: string; role: 'doctor' | 'reception'; pin: string }) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      pin: u.pin,
    }));

    const pts: Patient[] = (patientsRes.data || []).map((p: { id: string; name: string; phone: string; age: string | null; sex: string; allergies: string | null; cond: string | null; created_at: string }) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      age: p.age ? Number(p.age) || p.age : '',
      sex: p.sex || 'Female',
      allergies: p.allergies || '',
      cond: p.cond || '',
      t: new Date(p.created_at).getTime(),
    }));

    const vis: Visit[] = (visitsRes.data || []).map((v: { id: string; pid: string; tk: number | null; st: 'waiting' | 'consulting' | 'done'; urg: boolean | null; cancelled: boolean | null; reason: string | null; created_at: string }) => ({
      id: v.id,
      pid: v.pid,
      tk: v.tk || undefined,
      t: new Date(v.created_at).getTime(),
      st: v.st,
      urg: Boolean(v.urg),
      cancelled: Boolean(v.cancelled),
      reason: v.reason || undefined,
    }));

    const rx: Prescription[] = (rxRes.data || []).map((r: { id: string; no: string; pid: string; vid: string | null; items: any; notes: string | null; vit: any; fu: string | null; fud: boolean | null; by: string | null; add: any; created_at: string }) => ({
      id: r.id,
      no: r.no,
      pid: r.pid,
      vid: r.vid || undefined,
      t: new Date(r.created_at).getTime(),
      items: r.items || [],
      notes: r.notes || '',
      vit: r.vit || {},
      fu: r.fu || undefined,
      fud: Boolean(r.fud),
      by: r.by || 'Doctor',
      add: r.add || [],
    }));

    const invs: Invoice[] = (invsRes.data || []).map((i: { id: string; pid: string; rxid: string | null; items: any; sub: number; disc: number; dt: 'p' | 'f'; disc_amt: number; tax: number; total: number; paid: number; removed: any; added: any; void: any; created_at: string }) => ({
      id: i.id,
      pid: i.pid,
      rxid: i.rxid || undefined,
      t: new Date(i.created_at).getTime(),
      items: i.items || [],
      sub: Number(i.sub) || 0,
      disc: Number(i.disc) || 0,
      dt: i.dt || 'p',
      discAmt: Number(i.disc_amt) || 0,
      tax: Number(i.tax) || 0,
      total: Number(i.total) || 0,
      paid: Number(i.paid) || 0,
      removed: i.removed || undefined,
      added: i.added || undefined,
      void: i.void || undefined,
    }));

    const pays: Payment[] = (paysRes.data || []).map((p: { id: string; inv: string; pid: string; amt: number; m: string; ref: string | null; refund: boolean | null; created_at: string }) => ({
      id: p.id,
      inv: p.inv,
      pid: p.pid,
      amt: Number(p.amt) || 0,
      t: new Date(p.created_at).getTime(),
      m: p.m,
      ref: p.ref || undefined,
      refund: Boolean(p.refund),
    }));

    const pk: TreatmentPackage[] = (pkgsRes.data || []).map((k: { id: string; pid: string; name: string; total: number; used: number; inv: string; void: boolean | null; created_at: string }) => ({
      id: k.id,
      pid: k.pid,
      name: k.name,
      total: Number(k.total) || 1,
      used: Number(k.used) || 0,
      inv: k.inv,
      t: new Date(k.created_at).getTime(),
      void: Boolean(k.void),
    }));

    const ap: Appointment[] = (apptsRes.data || []).map((a: { id: string; pid: string; date: string; time: string; note: string | null; st: 'booked' | 'arrived' | 'noshow' | 'cancelled'; created_at: string }) => ({
      id: a.id,
      pid: a.pid,
      date: a.date,
      time: a.time,
      note: a.note || undefined,
      st: a.st,
      t: new Date(a.created_at).getTime(),
    }));

    const tp: PrescriptionTemplate[] = (templatesRes.data || []).map((tm: { id: string; name: string; items: any }) => ({
      id: tm.id,
      name: tm.name,
      items: tm.items || [],
    }));

    const log: ActivityLog[] = (logsRes.data || []).map((l: { id: string; pid: string | null; type: any; msg: string; by: string | null; created_at: string }) => ({
      t: new Date(l.created_at).getTime(),
      pid: l.pid || undefined,
      type: l.type,
      msg: l.msg,
      by: l.by || 'System',
    }));

    return {
      cfg,
      users: users.length > 0 ? users : [],
      inv: inventoryItems,
      pts,
      vis,
      rx,
      invs,
      pays,
      pk,
      ap,
      tp,
      log,
    };
  } catch (err) {
    console.error('[Supabase] Failed to fetch remote clinic state:', err);
    return null;
  }
}

/**
 * Seed initial baseline clinic data into Supabase tables if freshly initialized
 */
export async function seedSupabaseInitialData(state: ClinicState): Promise<boolean> {
  try {
    const client = supabaseAdmin || supabase;

    // 1. Config
    await client.from('clinic_config').upsert({
      id: 'default',
      name: state.cfg.name,
      addr: state.cfg.addr,
      phone: state.cfg.phone,
      reg: state.cfg.reg,
      dr: state.cfg.dr,
    });

    // 2. Staff Users
    if (state.users.length > 0) {
      await client.from('staff_users').upsert(
        state.users.map((u) => ({
          id: u.id,
          name: u.name,
          role: u.role,
          pin: u.pin,
        }))
      );
    }

    // 3. Inventory Items & Batches
    if (state.inv.length > 0) {
      await client.from('inventory_items').upsert(
        state.inv.map((i) => ({
          id: i.id,
          name: i.name,
          type: i.type,
          price: i.price,
          stock: i.stock,
          low: i.low,
          tax: i.tax,
          sess: i.sess,
          fav: i.fav || false,
        }))
      );

      const allBatches: any[] = [];
      state.inv.forEach((item) => {
        (item.batches || []).forEach((b) => {
          allBatches.push({
            id: b.id,
            item_id: item.id,
            no: b.no,
            exp: b.exp,
            qty: b.qty,
            cost: b.cost,
            sup: b.sup || null,
          });
        });
      });

      if (allBatches.length > 0) {
        await client.from('inventory_batches').upsert(allBatches);
      }
    }

    // 4. Patients
    if (state.pts.length > 0) {
      await client.from('patients').upsert(
        state.pts.map((p) => ({
          id: p.id,
          name: p.name,
          phone: p.phone,
          age: p.age ? String(p.age) : null,
          sex: p.sex,
          allergies: p.allergies || '',
          cond: p.cond || '',
          created_at: new Date(p.t).toISOString(),
        }))
      );
    }

    // 5. Visits
    if (state.vis.length > 0) {
      await client.from('visits').upsert(
        state.vis.map((v) => ({
          id: v.id,
          pid: v.pid,
          tk: v.tk || null,
          st: v.st,
          urg: v.urg || false,
          cancelled: v.cancelled || false,
          reason: v.reason || null,
          created_at: new Date(v.t).toISOString(),
        }))
      );
    }

    // 6. Prescriptions
    if (state.rx.length > 0) {
      await client.from('prescriptions').upsert(
        state.rx.map((r) => ({
          id: r.id,
          no: r.no,
          pid: r.pid,
          vid: r.vid || null,
          items: r.items,
          notes: r.notes || '',
          vit: r.vit || {},
          fu: r.fu || null,
          fud: r.fud || false,
          by: r.by || 'Doctor',
          add: r.add || [],
          created_at: new Date(r.t).toISOString(),
        }))
      );
    }

    // 7. Invoices
    if (state.invs.length > 0) {
      await client.from('invoices').upsert(
        state.invs.map((i) => ({
          id: i.id,
          pid: i.pid,
          rxid: i.rxid || null,
          items: i.items,
          sub: i.sub,
          disc: i.disc,
          dt: i.dt,
          disc_amt: i.discAmt,
          tax: i.tax,
          total: i.total,
          paid: i.paid,
          removed: i.removed || [],
          added: i.added || [],
          void: i.void || null,
          created_at: new Date(i.t).toISOString(),
        }))
      );
    }

    // 8. Payments
    if (state.pays.length > 0) {
      await client.from('payments').upsert(
        state.pays.map((p) => ({
          id: p.id,
          inv: p.inv,
          pid: p.pid,
          amt: p.amt,
          m: p.m,
          ref: p.ref || null,
          refund: p.refund || false,
          created_at: new Date(p.t).toISOString(),
        }))
      );
    }

    // 9. Packages
    if (state.pk.length > 0) {
      await client.from('treatment_packages').upsert(
        state.pk.map((k) => ({
          id: k.id,
          pid: k.pid,
          name: k.name,
          total: k.total,
          used: k.used,
          inv: k.inv,
          void: k.void || false,
          created_at: new Date(k.t).toISOString(),
        }))
      );
    }

    // 10. Appointments
    if (state.ap.length > 0) {
      await client.from('appointments').upsert(
        state.ap.map((a) => ({
          id: a.id,
          pid: a.pid,
          date: a.date,
          time: a.time,
          note: a.note || null,
          st: a.st,
          created_at: new Date(a.t).toISOString(),
        }))
      );
    }

    // 11. Templates
    if (state.tp.length > 0) {
      await client.from('prescription_templates').upsert(
        state.tp.map((tm) => ({
          id: tm.id,
          name: tm.name,
          items: tm.items,
        }))
      );
    }

    // 12. Logs
    if (state.log.length > 0) {
      await client.from('activity_logs').upsert(
        state.log.slice(0, 50).map((l, idx) => ({
          id: `LOG-${l.t}-${idx}`,
          pid: l.pid || null,
          type: l.type,
          msg: l.msg,
          by: l.by || 'System',
          created_at: new Date(l.t).toISOString(),
        }))
      );
    }

    console.log('[Supabase] Initial clinic database seed completed successfully.');
    return true;
  } catch (err) {
    console.error('[Supabase] Failed to seed initial database:', err);
    return false;
  }
}

// ==============================================================================
// GRANULAR MUTATION SYNC HANDLERS
// ==============================================================================

export async function syncPatientToCloud(p: Patient) {
  try {
    await supabase.from('patients').upsert({
      id: p.id,
      name: p.name,
      phone: p.phone,
      age: p.age ? String(p.age) : null,
      sex: p.sex,
      allergies: p.allergies || '',
      cond: p.cond || '',
      created_at: new Date(p.t).toISOString(),
    });
  } catch (err) {
    console.warn('[Supabase Sync] Failed to sync patient:', err);
  }
}

export async function syncVisitToCloud(v: Visit) {
  try {
    await supabase.from('visits').upsert({
      id: v.id,
      pid: v.pid,
      tk: v.tk || null,
      st: v.st,
      urg: v.urg || false,
      cancelled: v.cancelled || false,
      reason: v.reason || null,
      created_at: new Date(v.t).toISOString(),
    });
  } catch (err) {
    console.warn('[Supabase Sync] Failed to sync visit:', err);
  }
}

export async function syncPrescriptionToCloud(r: Prescription) {
  try {
    await supabase.from('prescriptions').upsert({
      id: r.id,
      no: r.no,
      pid: r.pid,
      vid: r.vid || null,
      items: r.items,
      notes: r.notes || '',
      vit: r.vit || {},
      fu: r.fu || null,
      fud: r.fud || false,
      by: r.by || 'Doctor',
      add: r.add || [],
      created_at: new Date(r.t).toISOString(),
    });
  } catch (err) {
    console.warn('[Supabase Sync] Failed to sync prescription:', err);
  }
}

export async function syncInvoiceToCloud(i: Invoice) {
  try {
    await supabase.from('invoices').upsert({
      id: i.id,
      pid: i.pid,
      rxid: i.rxid || null,
      items: i.items,
      sub: i.sub,
      disc: i.disc,
      dt: i.dt,
      disc_amt: i.discAmt,
      tax: i.tax,
      total: i.total,
      paid: i.paid,
      removed: i.removed || [],
      added: i.added || [],
      void: i.void || null,
      created_at: new Date(i.t).toISOString(),
    });
  } catch (err) {
    console.warn('[Supabase Sync] Failed to sync invoice:', err);
  }
}

export async function syncPaymentToCloud(p: Payment) {
  try {
    await supabase.from('payments').upsert({
      id: p.id,
      inv: p.inv,
      pid: p.pid,
      amt: p.amt,
      m: p.m,
      ref: p.ref || null,
      refund: p.refund || false,
      created_at: new Date(p.t).toISOString(),
    });
  } catch (err) {
    console.warn('[Supabase Sync] Failed to sync payment:', err);
  }
}

export async function syncInventoryItemToCloud(item: InventoryItem) {
  try {
    await supabase.from('inventory_items').upsert({
      id: item.id,
      name: item.name,
      type: item.type,
      price: item.price,
      stock: item.stock,
      low: item.low,
      tax: item.tax,
      sess: item.sess,
      fav: item.fav || false,
      updated_at: new Date().toISOString(),
    });

    if (item.batches && item.batches.length > 0) {
      await supabase.from('inventory_batches').upsert(
        item.batches.map((b) => ({
          id: b.id,
          item_id: item.id,
          no: b.no,
          exp: b.exp,
          qty: b.qty,
          cost: b.cost,
          sup: b.sup || null,
        }))
      );
    }
  } catch (err) {
    console.warn('[Supabase Sync] Failed to sync inventory item:', err);
  }
}

export async function syncInventoryBatchToCloud(itemId: string, b: Batch) {
  try {
    await supabase.from('inventory_batches').upsert({
      id: b.id,
      item_id: itemId,
      no: b.no,
      exp: b.exp,
      qty: b.qty,
      cost: b.cost,
      sup: b.sup || null,
    });
  } catch (err) {
    console.warn('[Supabase Sync] Failed to sync inventory batch:', err);
  }
}

export async function syncAppointmentToCloud(a: Appointment) {
  try {
    await supabase.from('appointments').upsert({
      id: a.id,
      pid: a.pid,
      date: a.date,
      time: a.time,
      note: a.note || null,
      st: a.st,
      created_at: new Date(a.t).toISOString(),
    });
  } catch (err) {
    console.warn('[Supabase Sync] Failed to sync appointment:', err);
  }
}

export async function syncTreatmentPackageToCloud(k: TreatmentPackage) {
  try {
    await supabase.from('treatment_packages').upsert({
      id: k.id,
      pid: k.pid,
      name: k.name,
      total: k.total,
      used: k.used,
      inv: k.inv,
      void: k.void || false,
      created_at: new Date(k.t).toISOString(),
    });
  } catch (err) {
    console.warn('[Supabase Sync] Failed to sync package:', err);
  }
}

export async function syncClinicConfigToCloud(cfg: ClinicConfig) {
  try {
    await supabase.from('clinic_config').upsert({
      id: 'default',
      name: cfg.name,
      addr: cfg.addr,
      phone: cfg.phone,
      reg: cfg.reg,
      dr: cfg.dr,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Supabase Sync] Failed to sync config:', err);
  }
}

export async function syncPrescriptionTemplateToCloud(t: PrescriptionTemplate) {
  try {
    await supabase.from('prescription_templates').upsert({
      id: t.id,
      name: t.name,
      items: t.items,
    });
  } catch (err) {
    console.warn('[Supabase Sync] Failed to sync template:', err);
  }
}

export async function syncActivityLogToCloud(l: ActivityLog) {
  try {
    await supabase.from('activity_logs').upsert({
      id: `LOG-${l.t}-${Math.random().toString(36).slice(2, 6)}`,
      pid: l.pid || null,
      type: l.type,
      msg: l.msg,
      by: l.by || 'System',
      created_at: new Date(l.t).toISOString(),
    });
  } catch (err) {
    console.warn('[Supabase Sync] Failed to sync activity log:', err);
  }
}
