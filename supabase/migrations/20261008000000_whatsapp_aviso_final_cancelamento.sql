-- Aviso final + cancelamento automatico (Sprint 2.2): quando faltam poucas
-- horas pro agendamento e o cliente nao respondeu, o bot manda um ultimo
-- aviso avisando do cancelamento automatico; se ninguem agir (cliente nem
-- profissional) dentro do prazo, cancela de verdade via /api/bot/agendamentos
-- (mesma rota/regra de qualquer cancelamento) e libera o horario.

ALTER TABLE public.whatsapp_lembretes
  ADD COLUMN IF NOT EXISTS aviso_final_enviado_em timestamptz;
