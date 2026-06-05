-- Script de inicialização do banco de dados do CRM Gabi Almeida no Supabase (PostgreSQL)

-- 1. Tabela de Perfis de Usuários (Integrada com o Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'prestador')),
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    specialty TEXT,
    phone TEXT,
    avatar TEXT,
    commission_rate NUMERIC DEFAULT 0,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para usuários
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated reads on users" ON public.users;
CREATE POLICY "Allow authenticated reads on users" ON public.users 
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;
CREATE POLICY "Allow users to update their own profile" ON public.users 
    FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow insert profile from triggers/seeding" ON public.users;
CREATE POLICY "Allow insert profile from triggers/seeding" ON public.users 
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full admin control on users" ON public.users;
DROP POLICY IF EXISTS "Allow admin to update users" ON public.users;
CREATE POLICY "Allow admin to update users" ON public.users 
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() AND public.users.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Allow admin to delete users" ON public.users;
CREATE POLICY "Allow admin to delete users" ON public.users 
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() AND public.users.role = 'admin'
        )
    );

-- 2. Tabela de Clientes/Pacientes
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    avatar TEXT,
    details_avatar TEXT,
    last_visit TEXT,
    tier TEXT DEFAULT 'Standard',
    since TEXT,
    total_spent NUMERIC DEFAULT 0,
    procedures_count INTEGER DEFAULT 0,
    last_photo_date TEXT DEFAULT '--',
    status TEXT DEFAULT 'Standard',
    allergies TEXT DEFAULT 'Nenhuma',
    medications TEXT DEFAULT 'Nenhum',
    previous_procedures TEXT DEFAULT 'Nenhum',
    evolution_notes TEXT DEFAULT '',
    before_photo TEXT,
    after_photo TEXT,
    timeline JSONB DEFAULT '[]'::jsonb,
    financials JSONB DEFAULT '[]'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    phone TEXT,
    cpf TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access to patients" ON public.patients;
CREATE POLICY "Allow authenticated full access to patients" ON public.patients 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Tabela de Agenda/Compromissos
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    time TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_avatar TEXT,
    procedure TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Confirmado', 'Em Atendimento', 'Finalizado', 'Pendente')) DEFAULT 'Confirmado',
    professional TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Estética', 'Injetáveis', 'Consulta')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access to appointments" ON public.appointments;
CREATE POLICY "Allow authenticated full access to appointments" ON public.appointments 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Tabela de Lançamentos Financeiros (Transações)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Confirmado', 'Pago', 'Pendente')) DEFAULT 'Pago',
    value NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access to transactions" ON public.transactions;
CREATE POLICY "Allow authenticated full access to transactions" ON public.transactions 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Tabela de Serviços e Tratamentos
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    duration TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access to services" ON public.services;
CREATE POLICY "Allow authenticated full access to services" ON public.services 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Tabela de Insumos/Estoque
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access to inventory" ON public.inventory;
CREATE POLICY "Allow authenticated full access to inventory" ON public.inventory 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
