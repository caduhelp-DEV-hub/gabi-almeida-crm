CREATE TABLE IF NOT EXISTS public.configuracoes_empresa (
    id TEXT PRIMARY KEY DEFAULT '1',
    nome TEXT NOT NULL DEFAULT 'Gabi Almeida Estética Avançada',
    cnpj TEXT NOT NULL DEFAULT '00.000.000/0001-00',
    endereco TEXT NOT NULL DEFAULT 'São Paulo - SP',
    telefone TEXT NOT NULL DEFAULT '(11) 99999-9999',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Habilitar RLS
ALTER TABLE public.configuracoes_empresa ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (temporário, baseado nas outras tabelas do sistema)
CREATE POLICY "Public Access" ON public.configuracoes_empresa FOR ALL USING (true);

-- Inserir registro inicial
INSERT INTO public.configuracoes_empresa (id, nome, cnpj, endereco, telefone) 
VALUES ('1', 'Gabi Almeida Estética Avançada', '00.000.000/0001-00', 'São Paulo - SP', '(11) 99999-9999')
ON CONFLICT (id) DO NOTHING;
