-- Assinatura do cliente vinculada a uma sessao de plano de tratamento.
--
-- O sistema tinha um card de "Validacao de Sessao" no prontuario que desenhava
-- a assinatura, mas nunca salvava a imagem -- so gravava um texto generico no
-- historico, mesmo com o canvas vazio, e ainda tinha um IP fixo/falso fingindo
-- uma certificacao (ICP-Brasil) que o sistema nao possui. Substituido por um
-- passo real dentro do fluxo de "Registrar Sessao", com dado de verdade.

ALTER TABLE public.planos_tratamento_sessoes
  -- URL no bucket 'signatures' (ou o PNG em base64 inline, se o upload falhar).
  ADD COLUMN IF NOT EXISTS assinatura_url text,
  -- Quando o aceite foi de fato dado -- validacao eletronica real, sem
  -- fingir certificado/selo que nao existe.
  ADD COLUMN IF NOT EXISTS assinatura_aceite_em timestamptz,
  -- Texto exato do termo apresentado no momento do aceite (auditavel mesmo
  -- que o texto padrao mude no futuro).
  ADD COLUMN IF NOT EXISTS assinatura_termo text,
  -- Preenchido so quando o profissional dispensa a assinatura conscientemente
  -- (ex: cliente ja nao esta presente) -- a ausencia fica registrada como
  -- decisao, nao como buraco silencioso.
  ADD COLUMN IF NOT EXISTS assinatura_dispensada_motivo text;
