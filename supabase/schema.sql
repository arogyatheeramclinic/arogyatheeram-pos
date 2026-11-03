-- ==============================================================================
-- AROGYA THEERAM AYURVEDIC CLINIC & DISPENSARY POS SYSTEM
-- Complete Production Database Schema & Realtime Setup
-- ==============================================================================

-- 1. Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Clinic Configuration Table
CREATE TABLE IF NOT EXISTS public.clinic_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    name TEXT NOT NULL,
    addr TEXT NOT NULL,
    phone TEXT NOT NULL,
    reg TEXT NOT NULL,
    dr TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Staff Users Table
CREATE TABLE IF NOT EXISTS public.staff_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('doctor', 'reception')),
    pin TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Inventory Items (Formulations & Clinical Therapies)
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('medicine', 'treatment')),
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    stock INTEGER, -- NULL for therapies, count for medicines
    low INTEGER NOT NULL DEFAULT 8,
    tax NUMERIC(5, 2) NOT NULL DEFAULT 5,
    sess INTEGER DEFAULT 1,
    fav BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Inventory Batches
CREATE TABLE IF NOT EXISTS public.inventory_batches (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    no TEXT NOT NULL,
    exp TEXT NOT NULL, -- YYYY-MM-DD
    qty INTEGER NOT NULL DEFAULT 0,
    cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    sup TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Patients Directory
CREATE TABLE IF NOT EXISTS public.patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    age TEXT,
    sex TEXT NOT NULL DEFAULT 'Female',
    allergies TEXT DEFAULT '',
    cond TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Patient Queue / Visits
CREATE TABLE IF NOT EXISTS public.visits (
    id TEXT PRIMARY KEY,
    pid TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    tk INTEGER,
    st TEXT NOT NULL CHECK (st IN ('waiting', 'consulting', 'done')),
    urg BOOLEAN DEFAULT FALSE,
    cancelled BOOLEAN DEFAULT FALSE,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Prescriptions & Clinical Consultation Records
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id TEXT PRIMARY KEY,
    no TEXT NOT NULL,
    pid TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    vid TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT DEFAULT '',
    vit JSONB DEFAULT '{}'::jsonb,
    fu TEXT,
    fud BOOLEAN DEFAULT FALSE,
    by TEXT DEFAULT 'Doctor',
    add JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Invoices & Billing Records
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    pid TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    rxid TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    sub NUMERIC(12, 2) NOT NULL DEFAULT 0,
    disc NUMERIC(12, 2) NOT NULL DEFAULT 0,
    dt TEXT NOT NULL DEFAULT 'p' CHECK (dt IN ('p', 'f')),
    disc_amt NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
    removed JSONB DEFAULT '[]'::jsonb,
    added JSONB DEFAULT '[]'::jsonb,
    void JSONB,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. Financial Payments & Collections
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    inv TEXT NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    pid TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    amt NUMERIC(12, 2) NOT NULL DEFAULT 0,
    m TEXT NOT NULL DEFAULT 'Cash',
    ref TEXT,
    refund BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 11. Multi-Session Ayurvedic Treatment Packages
CREATE TABLE IF NOT EXISTS public.treatment_packages (
    id TEXT PRIMARY KEY,
    pid TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    total INTEGER NOT NULL DEFAULT 1,
    used INTEGER NOT NULL DEFAULT 0,
    inv TEXT NOT NULL,
    void BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 12. Patient Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    pid TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    date TEXT NOT NULL, -- YYYY-MM-DD
    time TEXT NOT NULL, -- HH:mm
    note TEXT,
    st TEXT NOT NULL DEFAULT 'booked' CHECK (st IN ('booked', 'arrived', 'noshow', 'cancelled')),
    ref_rx_id TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 13. Prescription Templates (Clinical Protocols)
CREATE TABLE IF NOT EXISTS public.prescription_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 14. Activity Audit Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id TEXT PRIMARY KEY,
    pid TEXT,
    type TEXT NOT NULL,
    msg TEXT NOT NULL,
    by TEXT DEFAULT 'System',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- INDEXES FOR HIGH-THROUGHPUT PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_visits_status ON public.visits(st, urg, created_at);
CREATE INDEX IF NOT EXISTS idx_visits_patient ON public.visits(pid);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions(pid);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON public.invoices(pid);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(inv);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date, time);
CREATE INDEX IF NOT EXISTS idx_batches_item ON public.inventory_batches(item_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Permissive policies for authenticated dispensary clinic operations
-- ==============================================================================
ALTER TABLE public.clinic_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow unrestricted full access for application clients
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public full access policy" ON public.%I', tbl);
        EXECUTE format('CREATE POLICY "Public full access policy" ON public.%I FOR ALL USING (true) WITH CHECK (true)', tbl);
    END LOOP;
END
$$;

-- ==============================================================================
-- REALTIME SUBSCRIPTIONS
-- Enable real-time publication for live doctor & reception queue sync
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.visits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prescriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
