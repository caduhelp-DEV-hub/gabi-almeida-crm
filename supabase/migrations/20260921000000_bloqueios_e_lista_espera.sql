-- Bloqueio de horarios na Agenda (folga, workshop, indisponibilidade) e
-- Lista de Espera de clientes sem horario disponivel.
--
-- Tabelas nascem ja no padrao pos-hardening (20260823000000_rls_authenticated.sql):
-- RLS habilitado direto para `authenticated`, sem acesso `anon`. Nao usar o
-- padrao antigo "Public Access" USING (true) para public/anon.
--
-- !! ORDEM OBRIGATORIA !!
--   1. Aplique esta migration ANTES de publicar a v3.21.0 do app.
--      O app assina o canal realtime dessas tabelas; se elas nao existirem
--      (ou nao estiverem na publicacao), o canal compartilhado pode falhar e
--      derrubar tambem o sync ao vivo de agendamentos/clientes.
--   2. So depois faca o deploy.

CREATE TABLE IF NOT EXISTS public.bloqueios_agenda (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profissional text NOT NULL,
  data date NOT NULL,
  hora_inicio text NOT NULL,
  hora_fim text NOT NULL,
  dia_inteiro boolean NOT NULL DEFAULT false,
  descricao text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lista_espera (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_nome text NOT NULL,
  telefone text,
  procedimento_desejado text,
  profissional_preferido text,
  observacoes text,
  status text NOT NULL DEFAULT 'Aguardando',
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bloqueios_agenda_data ON public.bloqueios_agenda(data);
CREATE INDEX IF NOT EXISTS idx_bloqueios_agenda_profissional ON public.bloqueios_agenda(profissional);
CREATE INDEX IF NOT EXISTS idx_lista_espera_status ON public.lista_espera(status);

ALTER TABLE public.bloqueios_agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lista_espera ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso autenticado" ON public.bloqueios_agenda;
CREATE POLICY "Acesso autenticado" ON public.bloqueios_agenda FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso autenticado" ON public.lista_espera;
CREATE POLICY "Acesso autenticado" ON public.lista_espera FOR ALL TO authenticated USING (true) WITH CHECK (true);

REVOKE ALL ON public.bloqueios_agenda FROM anon;
REVOKE ALL ON public.lista_espera FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bloqueios_agenda TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lista_espera TO authenticated;

-- Realtime: coloca as tabelas na publicacao para o sync ao vivo funcionar
-- (idempotente; ignora se a publicacao nao existir neste banco).
DO $$
DECLARE
  tabela text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH tabela IN ARRAY ARRAY['bloqueios_agenda', 'lista_espera'] LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tabela
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tabela);
      END IF;
    END LOOP;
  END IF;
END $$;
