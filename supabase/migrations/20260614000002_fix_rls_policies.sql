-- Drop existing policies if they exist to recreate them properly
DROP POLICY IF EXISTS "Public Access" ON public.configuracoes_empresa;
DROP POLICY IF EXISTS "Public Access" ON public.despesas;

-- Recreate policy for configuracoes_empresa allowing everything
CREATE POLICY "Public Access" ON public.configuracoes_empresa 
FOR ALL USING (true) WITH CHECK (true);

-- Ensure despesas table exists (it should, but just in case)
CREATE TABLE IF NOT EXISTS public.despesas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    data TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

-- Recreate policy for despesas allowing everything
CREATE POLICY "Public Access" ON public.despesas 
FOR ALL USING (true) WITH CHECK (true);
