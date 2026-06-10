CREATE TABLE IF NOT EXISTS public.configuracoes_empresa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL DEFAULT 'Gabi Almeida Estética Avançada',
  cnpj TEXT NOT NULL DEFAULT '00.000.000/0001-00',
  endereco TEXT NOT NULL DEFAULT 'São Paulo - SP',
  telefone TEXT NOT NULL DEFAULT '(11) 99999-9999'
);

INSERT INTO public.configuracoes_empresa (id, nome, cnpj, endereco, telefone)
SELECT gen_random_uuid(), 'Gabi Almeida Estética Avançada', '00.000.000/0001-00', 'São Paulo - SP', '(11) 99999-9999'
WHERE NOT EXISTS (
    SELECT 1 FROM public.configuracoes_empresa
);

ALTER TABLE public.configuracoes_empresa ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated access" ON public.configuracoes_empresa;
CREATE POLICY "Allow authenticated access" ON public.configuracoes_empresa FOR ALL TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow public read" ON public.configuracoes_empresa;
CREATE POLICY "Allow public read" ON public.configuracoes_empresa FOR SELECT TO anon USING (true);
