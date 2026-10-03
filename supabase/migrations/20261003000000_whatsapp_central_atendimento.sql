-- Central de Atendimento WhatsApp - Sprint 1 (infraestrutura).
--
-- Tabelas novas para o novo servico "gabi-almeida-whatsapp-bot" (repositorio
-- separado, mesma instalacao Evolution API dos outros dois bots, instancia
-- propria e isolada). Nenhuma tabela existente e alterada, exceto a coluna
-- aditiva `origem` em `agendamentos`.
--
-- Seguem o padrao pos-hardening (20260823000000_rls_authenticated.sql):
-- RLS habilitado direto para `authenticated`, sem acesso `anon`.

CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  instance_name text NOT NULL UNIQUE,
  numero text,
  status text NOT NULL DEFAULT 'desconectado',
    -- desconectado | conectando | conectado | erro
  conectado_em timestamptz,
  ultimo_status_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  telefone text NOT NULL UNIQUE,
  whatsapp_jid text,
  nome text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid NOT NULL REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE,
  instance_id uuid REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'OPEN',
    -- OPEN | WAITING | HUMAN | BOT | CLOSED
  mode text NOT NULL DEFAULT 'BOT',
    -- BOT | HUMAN
  bot_state text,
  assigned_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  last_message_at timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  direction text NOT NULL,
    -- INBOUND | OUTBOUND
  message_type text NOT NULL DEFAULT 'TEXT',
    -- TEXT | IMAGE | AUDIO | VIDEO | DOCUMENT | LOCATION | BUTTON | LIST | SYSTEM
  content text,
  external_message_id text,
  media_url text,
  remetente text,
  status text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_conversation_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  tipo text NOT NULL,
    -- conversa_criada | cliente_identificado | bot_iniciado | bot_pausado |
    -- humano_assumiu | agendamento_criado | agendamento_alterado |
    -- agendamento_cancelado | conversa_encerrada
  detalhes jsonb,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_send_dedupe (
  chave text PRIMARY KEY,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_bot_settings (
  chave text PRIMARY KEY,
  valor jsonb NOT NULL,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'ADMIN';

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation_id ON public.whatsapp_messages(conversation_id, criado_em);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_external_id ON public.whatsapp_messages(external_message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_contact_id ON public.whatsapp_conversations(contact_id);

ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_send_dedupe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_bot_settings ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tabela text;
BEGIN
  FOREACH tabela IN ARRAY ARRAY[
    'whatsapp_instances',
    'whatsapp_contacts',
    'whatsapp_conversations',
    'whatsapp_messages',
    'whatsapp_conversation_events',
    'whatsapp_send_dedupe',
    'whatsapp_bot_settings'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Acesso autenticado" ON public.%I', tabela);
    EXECUTE format('CREATE POLICY "Acesso autenticado" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', tabela);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', tabela);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tabela);
  END LOOP;
END $$;

-- Realtime: coloca as tabelas que o painel/configuracoes vao observar ao vivo
-- na publicacao (idempotente; ignora se a publicacao nao existir neste banco).
DO $$
DECLARE
  tabela text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH tabela IN ARRAY ARRAY[
      'whatsapp_instances',
      'whatsapp_conversations',
      'whatsapp_messages',
      'whatsapp_bot_settings'
    ] LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tabela
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tabela);
      END IF;
    END LOOP;
  END IF;
END $$;
