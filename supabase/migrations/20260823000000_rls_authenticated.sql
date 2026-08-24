-- Fecha o acesso publico ao banco.
--
-- Ate aqui todas as tabelas usavam `FOR ALL TO public USING (true) WITH CHECK (true)`.
-- Como a chave anon fica visivel no codigo do site, qualquer pessoa na internet
-- conseguia ler e gravar em qualquer tabela, inclusive `users` (que guarda
-- `password_hash`).
--
-- A partir daqui o acesso exige um token de usuario autenticado, assinado pelo
-- servidor Next.js (ver lib/supabaseToken.ts e /api/auth/db-token).
--
-- !! ORDEM OBRIGATORIA PARA NAO DERRUBAR O APP !!
--   1. Configure SUPABASE_JWT_SECRET no .env do servidor
--      (painel Supabase -> Settings -> API -> JWT Settings -> JWT Secret)
--   2. Suba a aplicacao e confirme que o login e a agenda funcionam
--      (nesse momento o app ja usa o token, mas o banco ainda aceita anon)
--   3. So entao aplique esta migration
--
-- Para reverter: troque `TO authenticated` por `TO public` nas policies abaixo.

BEGIN;

-- Helper: recria a policy de acesso total, mas restrita a usuarios autenticados.
DO $$
DECLARE
  tabela text;
  tabelas text[] := ARRAY[
    'users',
    'patients',
    'appointments',
    'transactions',
    'services',
    'inventory',
    'clientes',
    'agendamentos',
    'cobrancas',
    'servicos',
    'despesas',
    'configuracoes_empresa',
    'mensagens_predefinidas',
    'planos_tratamento',
    'planos_tratamento_itens',
    'planos_tratamento_sessoes'
  ];
BEGIN
  FOREACH tabela IN ARRAY tabelas LOOP
    -- Pula tabelas que nao existem neste banco.
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tabela
    ) THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tabela);

    -- Remove as policies abertas antigas (nomes usados ao longo do projeto).
    EXECUTE format('DROP POLICY IF EXISTS "Public Access" ON public.%I', tabela);
    EXECUTE format('DROP POLICY IF EXISTS "Allow public full access to %s" ON public.%I', tabela, tabela);
    EXECUTE format('DROP POLICY IF EXISTS "Allow public read access" ON public.%I', tabela);
    EXECUTE format('DROP POLICY IF EXISTS "Allow public insert access" ON public.%I', tabela);
    EXECUTE format('DROP POLICY IF EXISTS "Allow public update access" ON public.%I', tabela);
    EXECUTE format('DROP POLICY IF EXISTS "Allow public delete access" ON public.%I', tabela);
    EXECUTE format('DROP POLICY IF EXISTS "Acesso autenticado" ON public.%I', tabela);

    -- Novo acesso: somente usuario autenticado pelo sistema.
    EXECUTE format(
      'CREATE POLICY "Acesso autenticado" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      tabela
    );

    -- Tira qualquer permissao direta da chave publica.
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', tabela);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tabela);
  END LOOP;
END $$;

-- `users` guarda hash de senha: o frontend nunca precisa dessa coluna.
-- A leitura passa a ser restrita as colunas de perfil.
REVOKE ALL (password_hash) ON public.users FROM authenticated;

-- Impede que a chave publica descubra o formato das tabelas.
REVOKE USAGE ON SCHEMA public FROM anon;

COMMIT;
