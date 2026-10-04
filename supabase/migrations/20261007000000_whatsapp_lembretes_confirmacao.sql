-- Rastreio de confirmacao do lembrete diario (Sprint 2.1): uma linha por
-- agendamento que recebeu lembrete, pra detectar quem nao respondeu depois
-- de X horas (whatsapp_bot_settings.confirmacao_prazo_horas) e avisar a
-- profissional. Tabela do bot (como as outras whatsapp_*), nunca duplica
-- regra de negocio do agendamento em si -- so bookkeeping do lembrete.

CREATE TABLE IF NOT EXISTS public.whatsapp_lembretes (
  agendamento_id uuid PRIMARY KEY REFERENCES public.agendamentos(id) ON DELETE CASCADE,
  enviado_em timestamptz NOT NULL DEFAULT now(),
  confirmado_em timestamptz,
  avisado_em timestamptz
);

ALTER TABLE public.whatsapp_lembretes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso autenticado" ON public.whatsapp_lembretes;
CREATE POLICY "Acesso autenticado" ON public.whatsapp_lembretes FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON public.whatsapp_lembretes FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_lembretes TO authenticated;
