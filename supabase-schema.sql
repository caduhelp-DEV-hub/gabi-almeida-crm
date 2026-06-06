-- Script de inicialização do banco de dados do CRM Gabi Almeida no Supabase (PostgreSQL)
-- Autenticação gerenciada pela API do Next.js (sem Supabase Auth)
--
-- IMPORTANTE: As políticas abaixo concedem acesso amplo (role `public`).
-- A segurança é gerenciada pela API Next.js (JWT próprio + requireAdmin/requireUser).
-- O backend usa SUPABASE_SERVICE_ROLE_KEY para operações server-side sensíveis.
--
-- TODO arquitetural: migrar o client (app/page.tsx) para usar API routes ao invés
-- de supabase.from(...) direto, permitindo restringir policies a `TO authenticated`.
-- Por enquanto, o client usa a anon key diretamente, então precisamos de `TO public`.

-- 1. Tabela de Usuários do CRM (autenticação própria)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'prestador')),
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    specialty TEXT,
    phone TEXT,
    avatar TEXT,
    commission_rate NUMERIC DEFAULT 0,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS: Permitir acesso amplo (public = anon + authenticated)
-- Segurança real é gerenciada pela API Next.js (JWT + middleware)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access to users" ON public.users;
CREATE POLICY "Allow public full access to users" ON public.users
    FOR ALL TO public USING (true) WITH CHECK (true);

-- Limpar policies antigas que dependiam de auth.uid()
DROP POLICY IF EXISTS "Allow authenticated reads on users" ON public.users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow insert profile from triggers/seeding" ON public.users;
DROP POLICY IF EXISTS "Allow admin to update users" ON public.users;
DROP POLICY IF EXISTS "Allow admin to delete users" ON public.users;

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
    evolution_photos JSONB DEFAULT '[]'::jsonb,
    timeline JSONB DEFAULT '[]'::jsonb,
    financials JSONB DEFAULT '[]'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    phone TEXT,
    cpf TEXT,
    pronoun TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access to patients" ON public.patients;
CREATE POLICY "Allow public full access to patients" ON public.patients 
    FOR ALL TO public USING (true) WITH CHECK (true);

-- 3. Tabela de Agenda/Compromissos
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    date TEXT NOT NULL DEFAULT (CURRENT_DATE)::text,
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

DROP POLICY IF EXISTS "Allow public full access to appointments" ON public.appointments;
CREATE POLICY "Allow public full access to appointments" ON public.appointments 
    FOR ALL TO public USING (true) WITH CHECK (true);

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

DROP POLICY IF EXISTS "Allow public full access to transactions" ON public.transactions;
CREATE POLICY "Allow public full access to transactions" ON public.transactions 
    FOR ALL TO public USING (true) WITH CHECK (true);

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

DROP POLICY IF EXISTS "Allow public full access to services" ON public.services;
CREATE POLICY "Allow public full access to services" ON public.services 
    FOR ALL TO public USING (true) WITH CHECK (true);

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

DROP POLICY IF EXISTS "Allow public full access to inventory" ON public.inventory;
CREATE POLICY "Allow public full access to inventory" ON public.inventory 
    FOR ALL TO public USING (true) WITH CHECK (true);

-- ============================================================
-- MIGRATION: Executar APENAS se a tabela users já existe com schema antigo
-- ============================================================
-- Se a tabela users já existir com a coluna id referenciando auth.users,
-- rode os seguintes comandos manualmente no SQL Editor do Supabase:
--
-- ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;
-- UPDATE public.users SET password_hash = '$2a$10$placeholder' WHERE password_hash IS NULL;
-- ALTER TABLE public.users ALTER COLUMN password_hash SET NOT NULL;
