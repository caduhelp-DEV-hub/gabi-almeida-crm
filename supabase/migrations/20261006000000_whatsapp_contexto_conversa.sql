-- Guarda o estado intermediario de um fluxo de conversa em andamento no bot
-- (servico ja escolhido, data ja escolhida, horarios oferecidos), junto do
-- bot_state (ja existente) -- persistido para que um restart do servico do
-- bot nao perca o contexto de uma conversa no meio de um agendamento.
ALTER TABLE public.whatsapp_conversations ADD COLUMN IF NOT EXISTS contexto jsonb;
