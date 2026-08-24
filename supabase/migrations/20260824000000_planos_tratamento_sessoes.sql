-- Registro de execucao (sessao a sessao) de um item de plano de tratamento.
--
-- Ate aqui um item como "5x Microagulhamento" tinha um unico status e uma
-- unica data de conclusao para as 5 sessoes inteiras -- nao havia como
-- registrar quando cada sessao foi feita, o que foi feito (descricao) nem
-- fotos daquele atendimento especifico. Esta tabela guarda uma linha por
-- sessao realmente executada.

CREATE TABLE IF NOT EXISTS public.planos_tratamento_sessoes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id uuid NOT NULL REFERENCES public.planos_tratamento_itens(id) ON DELETE CASCADE,
  plano_id uuid NOT NULL REFERENCES public.planos_tratamento(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  numero_sessao integer NOT NULL,
  data_sessao date NOT NULL DEFAULT CURRENT_DATE,
  descricao text,
  -- Array no mesmo formato de EvolutionPhoto ({id, url, date, type, observacao}),
  -- as mesmas fotos tambem sao anexadas em clientes.fotos_evolucao.
  fotos jsonb NOT NULL DEFAULT '[]'::jsonb,
  realizado_por text,
  criado_em timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT numero_sessao_positivo CHECK (numero_sessao > 0)
);

CREATE INDEX IF NOT EXISTS idx_planos_tratamento_sessoes_item_id ON public.planos_tratamento_sessoes(item_id);
CREATE INDEX IF NOT EXISTS idx_planos_tratamento_sessoes_plano_id ON public.planos_tratamento_sessoes(plano_id);
CREATE INDEX IF NOT EXISTS idx_planos_tratamento_sessoes_cliente_id ON public.planos_tratamento_sessoes(cliente_id);

ALTER TABLE public.planos_tratamento_sessoes ENABLE ROW LEVEL SECURITY;

-- Mesmo padrao aberto ainda em uso pelas outras tabelas do modulo enquanto a
-- migration 20260823000000_rls_authenticated.sql nao e aplicada em producao.
DROP POLICY IF EXISTS "Public Access" ON public.planos_tratamento_sessoes;
CREATE POLICY "Public Access" ON public.planos_tratamento_sessoes FOR ALL USING (true) WITH CHECK (true);
