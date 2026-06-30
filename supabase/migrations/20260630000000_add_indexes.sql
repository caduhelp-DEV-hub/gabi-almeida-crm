-- Índices para acelerar consultas e joins frequentes.
-- users.username já tem índice único implícito (constraint UNIQUE), não precisa de índice extra.

CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente_id ON public.agendamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON public.agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_cobrancas_data ON public.cobrancas(data);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON public.clientes(nome);
CREATE INDEX IF NOT EXISTS idx_despesas_data ON public.despesas(data);
