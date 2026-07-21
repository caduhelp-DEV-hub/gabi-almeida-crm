-- Tabela interna usada só para gerar atividade no banco (evitar pause automático do Supabase free tier).
-- Não é exposta ao app: RLS habilitado sem nenhuma policy, então a anon/authenticated key não enxerga isso.
CREATE TABLE IF NOT EXISTS public._heartbeat (
  id integer PRIMARY KEY DEFAULT 1,
  pinged_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT _heartbeat_single_row CHECK (id = 1)
);

ALTER TABLE public._heartbeat ENABLE ROW LEVEL SECURITY;

INSERT INTO public._heartbeat (id, pinged_at) VALUES (1, now())
  ON CONFLICT (id) DO UPDATE SET pinged_at = now();
