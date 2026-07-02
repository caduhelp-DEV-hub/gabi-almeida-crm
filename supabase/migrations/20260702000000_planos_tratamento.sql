-- Modulo Planos de Tratamento: orcamento composto por servicos com acompanhamento de execucao.
CREATE TABLE IF NOT EXISTS public.planos_tratamento (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  titulo text,
  status text NOT NULL DEFAULT 'Rascunho',
    -- Rascunho | Aguardando aprovacao | Aprovado | Em tratamento | Concluido | Cancelado
  valor_total numeric(10,2) NOT NULL DEFAULT 0,
  desconto_total numeric(10,2) NOT NULL DEFAULT 0,
  validade_orcamento date,
  observacoes text,
  aprovado_em timestamptz,
  iniciado_em timestamptz,
  concluido_em timestamptz,
  cancelado_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT valor_total_nao_negativo CHECK (valor_total >= 0),
  CONSTRAINT desconto_total_nao_negativo CHECK (desconto_total >= 0)
);

CREATE TABLE IF NOT EXISTS public.planos_tratamento_itens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plano_id uuid NOT NULL REFERENCES public.planos_tratamento(id) ON DELETE CASCADE,
  servico_id uuid REFERENCES public.servicos(id) ON DELETE SET NULL,
  -- snapshot: nao muda se o servico original mudar de preco/nome depois
  servico_nome text NOT NULL,
  preco_unitario numeric(10,2) NOT NULL DEFAULT 0,
  quantidade integer NOT NULL DEFAULT 1,
  desconto numeric(10,2) NOT NULL DEFAULT 0,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Pendente',
    -- Pendente | Agendado | Em andamento | Concluido | Cancelado
  ordem integer NOT NULL DEFAULT 0,
  concluido_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT preco_unitario_nao_negativo CHECK (preco_unitario >= 0),
  CONSTRAINT quantidade_positiva CHECK (quantidade > 0),
  CONSTRAINT desconto_nao_negativo CHECK (desconto >= 0),
  CONSTRAINT subtotal_nao_negativo CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_planos_tratamento_cliente_id ON public.planos_tratamento(cliente_id);
CREATE INDEX IF NOT EXISTS idx_planos_tratamento_status ON public.planos_tratamento(status);
CREATE INDEX IF NOT EXISTS idx_planos_tratamento_itens_plano_id ON public.planos_tratamento_itens(plano_id);

ALTER TABLE public.planos_tratamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_tratamento_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Access" ON public.planos_tratamento;
CREATE POLICY "Public Access" ON public.planos_tratamento FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access" ON public.planos_tratamento_itens;
CREATE POLICY "Public Access" ON public.planos_tratamento_itens FOR ALL USING (true) WITH CHECK (true);
