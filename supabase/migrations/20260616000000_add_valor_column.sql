-- Adiciona a coluna valor na tabela agendamentos
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS valor NUMERIC;
